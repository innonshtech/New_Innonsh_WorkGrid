import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import { PayrollCalculationEngine, ConfigLoader } from "@/lib/payroll/engines";
import { WorkflowEngine } from "@/lib/payroll/engines/workflow-engine";

// ==========================================
// 1. GET RUN DETAILS (Fix #7: Bulk query)
// ==========================================
async function handleGetDetails(request, id, authUser) {
  const run = await prisma.payrollRunV2.findUnique({
    where: { id },
    include: {
      employees: {
        orderBy: { employeeId: 'asc' }
      }
    }
  });

  if (!run) {
    return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
  }

  // SaaS protection check
  if (authUser.role === "admin" && run.organizationId !== authUser.organizationId) {
    return NextResponse.json({ error: "Unauthorized access to this payroll run" }, { status: 403 });
  }

  // Fix #7: Single bulk query instead of N+1 loop
  const employeeIds = run.employees.map(re => re.employeeId);
  const employees = await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, firstName: true, lastName: true, employeeId: true, department: true, designation: true }
  });
  const employeeMap = new Map(employees.map(e => [e.id, e]));

  const detailedEmployees = run.employees.map(re => {
    const emp = employeeMap.get(re.employeeId);
    return {
      ...re,
      firstName: emp?.firstName || 'Unknown',
      lastName: emp?.lastName || '',
      employeeCode: emp?.employeeId || 'N/A',
      department: emp?.department || 'N/A',
      designation: emp?.designation || 'N/A'
    };
  });

  return NextResponse.json({
    success: true,
    run: {
      ...run,
      employees: detailedEmployees
    }
  });
}

// ==========================================
// 2. DELETE RUN
// ==========================================
async function handleDeleteRun(request, id, authUser) {
  const run = await prisma.payrollRunV2.findUnique({
    where: { id }
  });

  if (!run) {
    return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
  }

  // SaaS protection check
  if (authUser.role === "admin" && run.organizationId !== authUser.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (run.status !== 'OPEN' && run.status !== 'LOCKED' && !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: "Cannot delete a run that is in workflow approval or closed." }, { status: 400 });
  }

  // Delete associated run records
  await prisma.payrollRunEmployee.deleteMany({
    where: { runId: id }
  });

  await prisma.payrollRunV2.delete({
    where: { id }
  });

  return NextResponse.json({ success: true, message: "Payroll run deleted successfully" });
}

// ==========================================
// 3. CALCULATE RUN (POST)
// ==========================================
async function handleCalculateRun(request, id, authUser, preBody = null) {
  // Fix #3: Accept pre-parsed body to avoid double request.json() consumption
  const body = preBody || await request.json();
  const { employeeId } = body; // Optional: calculate for a single employee, otherwise calculate for all

  const run = await prisma.payrollRunV2.findUnique({
    where: { id }
  });

  if (!run) {
    return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
  }

  // SaaS protection check
  if (authUser.role === "admin" && run.organizationId !== authUser.organizationId) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  if (run.status === 'LOCKED' || run.status === 'CLOSED') {
    return NextResponse.json({ error: "Cannot recalculate a locked or closed payroll run" }, { status: 400 });
  }

  const employeeRecords = await prisma.payrollRunEmployee.findMany({
    where: {
      runId: id,
      ...(employeeId ? { employeeId } : {})
    }
  });

  if (employeeRecords.length === 0) {
    return NextResponse.json({ error: "No employee records found in this run" }, { status: 400 });
  }

  let successCount = 0;
  let errorCount = 0;
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  const calculationLogs = [];

  const sharedConfigLoader = new ConfigLoader(run.organizationId, new Date(run.year, run.month - 1, 15));

  // Fix #2: Process in parallel batches of 5
  const BATCH_SIZE = 5;
  for (let i = 0; i < employeeRecords.length; i += BATCH_SIZE) {
    const batch = employeeRecords.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(async (record) => {
        // Fix #1: Per-request engine instance
        const calculationEngine = new PayrollCalculationEngine();
        const result = await calculationEngine.calculate({
          employeeId: record.employeeId,
          month: run.month,
          year: run.year,
          organizationId: run.organizationId,
          payrollRunId: run.id,
          calculatedById: authUser.id,
          configLoader: sharedConfigLoader
        });
        return { record, result };
      })
    );

    for (const settled of batchResults) {
      if (settled.status === 'fulfilled') {
        const { record, result } = settled.value;
        if (result.status === 'CALCULATED') {
          successCount++;
          totalGross += result.totalEarnings;
          totalDeductions += result.totalDeductions;
          totalNet += result.netSalary;

          await prisma.payrollRunEmployee.update({
            where: { id: record.id },
            data: {
              status: 'CALCULATED',
              salaryAssignmentId: result.salaryAssignmentId || null,
              payrollDays: result.attendance?.payrollDays || 0,
              presentDays: result.attendance?.presentDays || 0,
              lopDays: result.attendance?.lopDays || 0,
              payableDays: result.attendance?.payableDays || 0,
              weeklyOffs: result.attendance?.weeklyOffs || 0,
              holidays: result.attendance?.holidays || 0,
              paidLeaves: result.attendance?.paidLeaves || 0,
              unpaidLeaves: result.attendance?.unpaidLeaves || 0,

              basicEarned: result.proratedEarnings?.BASIC || result.salaryAssignment?.basicSalary || 0,
              grossEarnings: result.grossEarnings,
              totalEarnings: result.totalEarnings,
              totalStatutory: result.totalStatutory,
              totalTax: result.monthlyTDS,
              totalOtherDeductions: result.loanRecovery + result.advanceRecovery + result.otherDeductions,
              totalDeductions: result.totalDeductions,
              netSalary: result.netSalary,

              earningsBreakdown: result.earningsBreakdown,
              deductionsBreakdown: result.deductionsBreakdown,
              statutoryBreakdown: result.statutoryBreakdown,
              taxBreakdown: result.taxBreakdown,
              attendanceBreakdown: result.attendance,

              bonusAmount: result.bonusAmount,
              overtimeAmount: result.overtimeAmount,
              reimbursementAmount: result.reimbursementAmount,
              loanRecovery: result.loanRecovery,
              advanceRecovery: result.advanceRecovery,
              arrearAmount: result.arrearAmount,
              leaveEncashment: result.leaveEncashment,

              errorMessage: null,
              calculatedAt: new Date()
            }
          });

          calculationLogs.push({
            employeeId: record.employeeId,
            status: 'CALCULATED',
            netSalary: result.netSalary,
            error: null
          });
        } else {
          errorCount++;
          await prisma.payrollRunEmployee.update({
            where: { id: record.id },
            data: {
              status: 'ERROR',
              errorMessage: result.errorMessage || 'Calculation failed'
            }
          });
          calculationLogs.push({
            employeeId: record.employeeId,
            status: 'ERROR',
            netSalary: 0,
            error: result.errorMessage
          });
        }
      } else {
        // Promise rejected
        const record = batch[batchResults.indexOf(settled)];
        errorCount++;
        await prisma.payrollRunEmployee.update({
          where: { id: record.id },
          data: {
            status: 'ERROR',
            errorMessage: settled.reason?.message || 'Calculation failed'
          }
        });
        calculationLogs.push({
          employeeId: record.employeeId,
          status: 'ERROR',
          error: settled.reason?.message
        });
      }
    }
  }

  // Update parent PayrollRunV2 totals
  let finalGross = totalGross;
  let finalDeductions = totalDeductions;
  let finalNet = totalNet;
  let finalSuccess = successCount;
  let finalErrors = errorCount;

  if (employeeId) {
    const agg = await prisma.payrollRunEmployee.aggregate({
      where: { runId: id },
      _sum: {
        totalEarnings: true,
        totalDeductions: true,
        netSalary: true
      }
    });
    finalGross = agg._sum.totalEarnings || 0;
    finalDeductions = agg._sum.totalDeductions || 0;
    finalNet = agg._sum.netSalary || 0;

    finalSuccess = await prisma.payrollRunEmployee.count({
      where: { runId: id, status: 'CALCULATED' }
    });
    finalErrors = await prisma.payrollRunEmployee.count({
      where: { runId: id, status: 'ERROR' }
    });
  }

  const currentLogs = Array.isArray(run.runLog) ? run.runLog : [];
  const updatedLogs = [
    ...currentLogs,
    {
      timestamp: new Date().toISOString(),
      action: 'CALCULATED',
      userId: authUser.id,
      userName: authUser.name || 'Admin',
      message: `Triggered calculations. Success: ${finalSuccess}, Errors: ${finalErrors}.`
    }
  ];

  await prisma.payrollRunV2.update({
    where: { id: run.id },
    data: {
      totalGross: finalGross,
      totalDeductions: finalDeductions,
      totalNet: finalNet,
      processedEmployees: finalSuccess,
      errorEmployees: finalErrors,
      currentStep: 2,
      status: finalErrors > 0 ? 'OPEN' : 'PREVIEW',
      runLog: updatedLogs
    }
  });

  return NextResponse.json({
    success: true,
    summary: {
      total: employeeRecords.length,
      success: finalSuccess,
      errors: finalErrors,
      totalGross: finalGross,
      totalDeductions: finalDeductions,
      totalNet: finalNet
    },
    logs: calculationLogs
  });
}

// ==========================================
// 4. WORKFLOW ACTIONS (POST)
// Fix #6: Strict idempotency guards
// Fix #5: Transaction wrapping for payslip release
// Fix #8: Direct CSV return
// ==========================================
async function handleWorkflowAction(request, id, authUser) {
  const body = await request.json();
  const { action, comments } = body;

  console.log(`[ACTION ROUTE] Incoming Action: ${action} for ID: ${id}`);

  const run = await prisma.payrollRunV2.findUnique({
    where: { id }
  });

  if (!run) {
    console.log(`[ACTION ROUTE] Run not found in DB for ID: ${id}`);
    return NextResponse.json({ error: `Payroll run not found for ID: ${id}` }, { status: 404 });
  }

  // SaaS protection check
  if (authUser.role === "admin" && run.organizationId !== authUser.organizationId) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const currentLogs = Array.isArray(run.runLog) ? run.runLog : [];

  if (action === 'SUBMIT_APPROVAL') {
    // Fix #6: Strict status guard
    if (run.status !== 'OPEN' && run.status !== 'PREVIEW') {
      return NextResponse.json({ error: "Payroll run must be in OPEN or PREVIEW state to submit for approval" }, { status: 400 });
    }

    const errorCount = await prisma.payrollRunEmployee.count({
      where: { runId: id, status: 'ERROR' }
    });
    if (errorCount > 0) {
      return NextResponse.json({ error: "Cannot submit for approval when there are employee calculation errors. Resolve them first." }, { status: 400 });
    }

    const workflowEngine = new WorkflowEngine();
    const workflow = await workflowEngine.initiateWorkflow({
      organizationId: run.organizationId,
      workflowType: 'PAYROLL_RUN',
      entityType: 'PAYROLL_RUN',
      entityId: run.id,
      initiatedById: authUser.id
    });

    const updatedLogs = [
      ...currentLogs,
      {
        timestamp: new Date().toISOString(),
        action: 'SUBMITTED_FOR_APPROVAL',
        userId: authUser.id,
        userName: authUser.name || 'Admin',
        message: 'Submitted payroll run for multi-level approval.'
      }
    ];

    await prisma.payrollRunV2.update({
      where: { id: run.id },
      data: {
        status: 'MANAGER_APPROVAL',
        currentStep: 3,
        runLog: updatedLogs
      }
    });

    return NextResponse.json({ success: true, message: "Submitted for approval successfully", workflow });
  }

  if (action === 'LOCK') {
    // Fix #6: Strict idempotency — reject if already locked
    if (run.status === 'LOCKED') {
      return NextResponse.json({ success: true, message: "Run is already locked", run });
    }
    if (run.status !== 'PREVIEW' && !run.status.includes('APPROVAL')) {
      return NextResponse.json({ error: "Can only lock approved, previewed, or pending-approval runs" }, { status: 400 });
    }

    const updatedLogs = [
      ...currentLogs,
      {
        timestamp: new Date().toISOString(),
        action: 'LOCKED',
        userId: authUser.id,
        userName: authUser.name || 'Admin',
        message: 'Payroll run locked.'
      }
    ];

    const updatedRun = await prisma.payrollRunV2.update({
      where: { id: run.id },
      data: {
        status: 'LOCKED',
        currentStep: 4,
        lockedById: authUser.id,
        lockedAt: new Date(),
        runLog: updatedLogs
      }
    });

    return NextResponse.json({ success: true, run: updatedRun });
  }

  if (action === 'RELEASE_PAYSLIPS') {
    // Fix #6: Strict idempotency
    if (run.status === 'PAYSLIPS_GENERATED') {
      return NextResponse.json({ success: true, message: "Payslips have already been released" });
    }
    if (run.status !== 'BANK_FILE_GENERATED') {
      return NextResponse.json({ error: "Bank payout file must be generated before releasing payslips" }, { status: 400 });
    }

    const runEmployees = await prisma.payrollRunEmployee.findMany({
      where: { runId: id, status: 'CALCULATED' }
    });

    const organization = await prisma.organization.findFirst({
      where: { OR: [{ id: run.organizationId }, { mongoId: run.organizationId }].filter(x => x.id || x.mongoId) }
    });
    const orgName = organization ? organization.name : 'Company';

    // Fix #7: Bulk load employee codes
    const empIds = runEmployees.map(re => re.employeeId);
    const empRecords = await prisma.employee.findMany({
      where: { id: { in: empIds } },
      select: { 
        id: true, 
        employeeId: true, 
        email: true, 
        firstName: true, 
        lastName: true,
        department: true,
        designation: true,
        dateOfJoining: true,
        panNumber: true,
        bankAccountNumber: true,
        bankName: true
      }
    });
    const empMap = new Map(empRecords.map(e => [e.id, e]));

    // Fix #5: Wrap in transaction for atomicity
    const releaseCount = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const re of runEmployees) {
        const emp = empMap.get(re.employeeId);
        const empCode = emp?.employeeId || re.employeeId;
        const formattedMonth = String(run.month).padStart(2, '0');
        const payslipId = `PS-${empCode}-${run.year}${formattedMonth}`;

        await tx.payslip.upsert({
          where: { payslipId },
          update: {
            basicSalary: re.basicEarned,
            grossSalary: re.grossEarnings,
            totalDeductions: re.totalDeductions,
            netSalary: re.netSalary,
            workingDays: re.payrollDays,
            presentDays: re.presentDays,
            lopDays: re.lopDays,
            paidDays: re.payableDays,
            overtimeHours: re.presentDays > 0 ? (re.attendanceBreakdown?.overtimeHours || 0) : 0,
            overtimeAmount: re.overtimeAmount,
            status: 'Released',
            paymentDate: new Date(),
            paymentMethod: 'Bank Transfer',
            earnings: re.earningsBreakdown,
            deductions: re.deductionsBreakdown,
            pfDetails: re.statutoryBreakdown ? {
              employeePF: re.statutoryBreakdown.PF_EMPLOYEE,
              employerPF: re.statutoryBreakdown.PF_EMPLOYER,
              eps: re.statutoryBreakdown.EPS,
              admin: re.statutoryBreakdown.PF_ADMIN,
              edli: re.statutoryBreakdown.PF_EDLI
            } : null,
            esicDetails: re.statutoryBreakdown ? {
              employeeESI: re.statutoryBreakdown.ESI_EMPLOYEE,
              employerESI: re.statutoryBreakdown.ESI_EMPLOYER
            } : null,
            professionalTax: Number(re.deductionsBreakdown?.PT || 0),
            isPFApplicable: re.statutoryBreakdown?.PF_EMPLOYEE > 0,
            isESICApplicable: re.statutoryBreakdown?.ESI_EMPLOYEE > 0,
            isPTApplicable: re.deductionsBreakdown?.PT > 0,
            generatedById: authUser.id,
            approvedById: authUser.id
          },
          create: {
            employeeId: re.employeeId,
            organizationId: run.organizationId,
            payslipId,
            month: run.month,
            year: run.year,
            basicSalary: re.basicEarned,
            grossSalary: re.grossEarnings,
            totalDeductions: re.totalDeductions,
            netSalary: re.netSalary,
            workingDays: re.payrollDays,
            presentDays: re.presentDays,
            lopDays: re.lopDays,
            paidDays: re.payableDays,
            overtimeHours: re.presentDays > 0 ? (re.attendanceBreakdown?.overtimeHours || 0) : 0,
            overtimeAmount: re.overtimeAmount,
            status: 'Released',
            paymentDate: new Date(),
            paymentMethod: 'Bank Transfer',
            organizationName: orgName,
            salaryType: 'Monthly',
            earnings: re.earningsBreakdown,
            deductions: re.deductionsBreakdown,
            pfDetails: re.statutoryBreakdown ? {
              employeePF: re.statutoryBreakdown.PF_EMPLOYEE,
              employerPF: re.statutoryBreakdown.PF_EMPLOYER,
              eps: re.statutoryBreakdown.EPS,
              admin: re.statutoryBreakdown.PF_ADMIN,
              edli: re.statutoryBreakdown.PF_EDLI
            } : null,
            esicDetails: re.statutoryBreakdown ? {
              employeeESI: re.statutoryBreakdown.ESI_EMPLOYEE,
              employerESI: re.statutoryBreakdown.ESI_EMPLOYER
            } : null,
            professionalTax: Number(re.deductionsBreakdown?.PT || 0),
            isPFApplicable: re.statutoryBreakdown?.PF_EMPLOYEE > 0,
            isESICApplicable: re.statutoryBreakdown?.ESI_EMPLOYEE > 0,
            isPTApplicable: re.deductionsBreakdown?.PT > 0,
            generatedById: authUser.id
          }
        });

        await tx.payrollNotification.create({
          data: {
            recipientId: re.employeeId,
            type: 'PAYSLIP_RELEASED',
            title: 'Payslip Released',
            message: `Your payslip for ${run.month}/${run.year} has been released. You can now download it from your portal.`,
            entityType: 'PAYSLIP',
            entityId: payslipId
          }
        });

        count++;
      }
      return count;
    });

    const updatedLogs = [
      ...currentLogs,
      {
        timestamp: new Date().toISOString(),
        action: 'PAYSLIPS_RELEASED',
        userId: authUser.id,
        userName: authUser.name || 'Admin',
        message: `Released ${releaseCount} payslips to employee portals.`
      }
    ];

    const updatedRun = await prisma.payrollRunV2.update({
      where: { id: run.id },
      data: {
        status: 'PAYSLIPS_GENERATED',
        currentStep: 6,
        runLog: updatedLogs
      }
    });

    // Send email notifications asynchronously (non-blocking)
    (async () => {
      try {
        const { sendEmail } = await import('@/lib/email/service');
        const { PayslipPDFEngine } = await import('@/lib/payroll/engines/payslip-pdf-engine');
        const pdfEngine = new PayslipPDFEngine();
        
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const periodName = `${monthNames[run.month - 1]} ${run.year}`;

        for (const re of runEmployees) {
          const emp = empMap.get(re.employeeId);
          if (!emp || !emp.email) continue;

          try {
            const earnBr = typeof re.earningsBreakdown === 'string'
              ? JSON.parse(re.earningsBreakdown)
              : (re.earningsBreakdown || {});
            const dedBr = typeof re.deductionsBreakdown === 'string'
              ? JSON.parse(re.deductionsBreakdown)
              : (re.deductionsBreakdown || {});

            const payslipData = {
              employee: emp,
              organization: {
                name: orgName,
                address: typeof organization?.address === 'string' ? JSON.parse(organization.address) : (organization?.address || {})
              },
              run: {
                month: run.month,
                year: run.year,
                workingDays: re.payrollDays
              },
              earningsBreakdown: earnBr,
              deductionsBreakdown: dedBr,
              payableDays: re.payableDays,
              lopDays: re.lopDays,
              totalEarnings: re.totalEarnings,
              totalDeductions: re.totalDeductions,
              netSalary: re.netSalary
            };

            const pdfDoc = pdfEngine.generate(payslipData);
            const pdfBuffer = pdfEngine.toBuffer(pdfDoc);

            await sendEmail({
              to: emp.email,
              subject: `Payslip Released - ${periodName}`,
              html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <h2>Hello ${emp.firstName} ${emp.lastName},</h2>
                  <p>Your payslip for <strong>${periodName}</strong> has been released by <strong>${orgName}</strong>.</p>
                  <p>Please find the payslip PDF attached to this email.</p>
                  <p>You can also access, view, and download all your past payslips directly from your Employee Self-Service portal.</p>
                  <br />
                  <p>Best Regards,</p>
                  <p><strong>HR & Payroll Team</strong></p>
                  <p>${orgName}</p>
                </div>
              `,
              attachments: [
                {
                  filename: `Payslip_${emp.employeeId || 'Employee'}_${run.year}_${String(run.month).padStart(2, '0')}.pdf`,
                  content: pdfBuffer,
                  contentType: 'application/pdf'
                }
              ]
            });
          } catch (emailErr) {
            console.error(`Failed to send payslip email to ${emp.email}:`, emailErr);
          }
        }
      } catch (importErr) {
        console.error('Failed to initialize email/PDF engine for payslip release:', importErr);
      }
    })();

    return NextResponse.json({ success: true, count: releaseCount, run: updatedRun });
  }

  if (action === 'GENERATE_BANK_FILE') {
    // Fix #6: Idempotency
    if (run.status === 'BANK_FILE_GENERATED') {
      return NextResponse.json({ success: true, message: "Bank file has already been generated" });
    }
    if (run.status !== 'LOCKED') {
      return NextResponse.json({ error: "Payroll run must be LOCKED before generating the bank payout file" }, { status: 400 });
    }

    const runEmployees = await prisma.payrollRunEmployee.findMany({
      where: { runId: id, status: 'CALCULATED' }
    });

    // Fix #7: Bulk query
    const employeeIds = runEmployees.map(re => re.employeeId);
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, firstName: true, lastName: true, employeeId: true, email: true, bankAccountNumber: true, bankName: true, ifscCode: true, branch: true }
    });
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // Fix #8: Build CSV directly from employee data (no data URI storage)
    const csvHeaders = ['Employee ID', 'Employee Name', 'Net Salary', 'Bank Name', 'Account Number', 'IFSC Code', 'Branch'];
    const csvRows = runEmployees.map(re => {
      const emp = employeeMap.get(re.employeeId) || {};
      return [
        emp.employeeId || re.employeeId,
        `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        re.netSalary?.toFixed(2) || '0.00',
        emp.bankName || '',
        emp.bankAccountNumber || '',
        emp.ifscCode || '',
        emp.branch || ''
      ].join(',');
    });
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    const updatedLogs = [
      ...currentLogs,
      {
        timestamp: new Date().toISOString(),
        action: 'BANK_FILE_GENERATED',
        userId: authUser.id,
        userName: authUser.name || 'Admin',
        message: `Bank transfer instruction file compiled for ${runEmployees.length} employees.`
      }
    ];

    const updatedRun = await prisma.payrollRunV2.update({
      where: { id: run.id },
      data: {
        status: 'BANK_FILE_GENERATED',
        currentStep: 5,
        runLog: updatedLogs
      }
    });

    return NextResponse.json({ success: true, csv: csvContent, run: updatedRun });
  }

  if (action === 'CLOSE') {
    // Fix #6: Idempotency
    if (run.status === 'CLOSED') {
      return NextResponse.json({ success: true, message: "Run is already closed", run });
    }
    if (run.status !== 'PAYSLIPS_GENERATED') {
      return NextResponse.json({ error: "Payslips must be released to portals before closing the payroll run" }, { status: 400 });
    }

    const updatedLogs = [
      ...currentLogs,
      {
        timestamp: new Date().toISOString(),
        action: 'CLOSED',
        userId: authUser.id,
        userName: authUser.name || 'Admin',
        message: 'Payroll run finalized and closed.'
      }
    ];

    const updatedRun = await prisma.payrollRunV2.update({
      where: { id: run.id },
      data: {
        status: 'CLOSED',
        currentStep: 7,
        closedAt: new Date(),
        runLog: updatedLogs
      }
    });

    return NextResponse.json({ success: true, run: updatedRun });
  }

  return NextResponse.json({ error: `Action '${action}' not recognized.` }, { status: 400 });
}

// ==========================================
// MASTER EXPORTS
// ==========================================

export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { slug } = await params;
    if (!slug || slug.length !== 1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const id = slug[0];
    return handleGetDetails(request, id, authUser);
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { slug } = await params;
    if (!slug || slug.length !== 1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const id = slug[0];
    return handleDeleteRun(request, id, authUser);
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { slug } = await params;
    if (!slug || slug.length === 0 || slug.length > 2) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const id = slug[0];

    if (slug.length === 2) {
      const subroute = slug[1];
      if (subroute === 'action') {
        return handleWorkflowAction(request, id, authUser);
      } else if (subroute === 'calculate') {
        // Fix #3: Pre-parse body before passing to avoid double consumption
        const body = await request.json();
        return handleCalculateRun(request, id, authUser, body);
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return handleCalculateRun(request, id, authUser);
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
