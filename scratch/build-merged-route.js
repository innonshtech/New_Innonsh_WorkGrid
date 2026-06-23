const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/app/api/v1/admin/payroll/v2/runs');
const oldIdDir = path.join(srcDir, '[id]');
const newSlugDir = path.join(srcDir, '[...slug]');

// Read old files
const oldRouteCode = fs.readFileSync(path.join(oldIdDir, 'route.js'), 'utf8');
const actionRouteCode = fs.readFileSync(path.join(oldIdDir, 'action/route.js'), 'utf8');
const calcRouteCode = fs.readFileSync(path.join(oldIdDir, 'calculate/route.js'), 'utf8');

// Extract body of old GET
const getStart = oldRouteCode.indexOf('export async function GET');
const getEnd = oldRouteCode.indexOf('export async function DELETE');
const getFunctionCode = oldRouteCode.slice(getStart, getEnd).trim();

// Extract body of old DELETE
const deleteStart = oldRouteCode.indexOf('export async function DELETE');
const deleteEnd = oldRouteCode.indexOf('export async function POST');
const deleteFunctionCode = oldRouteCode.slice(deleteStart, deleteEnd).trim();

// Extract body of old POST (calculate run)
const postStart = oldRouteCode.indexOf('export async function POST');
const postFunctionCode = oldRouteCode.slice(postStart).trim();

// Extract body of action POST
const actionPostStart = actionRouteCode.indexOf('export async function POST');
const actionPostFunctionCode = actionRouteCode.slice(actionPostStart).trim();

// Extract body of calculate subroute POST
const calcSubPostStart = calcRouteCode.indexOf('export async function POST');
const calcSubPostFunctionCode = calcRouteCode.slice(calcSubPostStart).trim();

// Construct the new unified code
const unifiedCode = `import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import { PayrollCalculationEngine } from "@/lib/payroll/engines";
import { WorkflowEngine } from "@/lib/payroll/engines/workflow-engine";
import { BankFileEngine } from "@/lib/payroll/engines/bank-file-engine";
import { ComplianceEngine } from "@/lib/payroll/engines/compliance-engine";

const calculationEngine = new PayrollCalculationEngine();
const workflowEngine = new WorkflowEngine();
const bankFileEngine = new BankFileEngine();
const complianceEngine = new ComplianceEngine();

// ==========================================
// 1. GET RUN DETAILS
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

  // Load full details for employee records
  const detailedEmployees = [];
  for (const re of run.employees) {
    const employee = await prisma.employee.findUnique({
      where: { id: re.employeeId },
      select: { firstName: true, lastName: true, employeeId: true, department: true, designation: true }
    });
    detailedEmployees.push({
      ...re,
      firstName: employee?.firstName || 'Unknown',
      lastName: employee?.lastName || '',
      employeeCode: employee?.employeeId || 'N/A',
      department: employee?.department || 'N/A',
      designation: employee?.designation || 'N/A'
    });
  }

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
async function handleCalculateRun(request, id, authUser) {
  const body = await request.json();
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

  for (const record of employeeRecords) {
    try {
      const result = await calculationEngine.calculate({
        employeeId: record.employeeId,
        month: run.month,
        year: run.year,
        organizationId: run.organizationId,
        payrollRunId: run.id,
        calculatedById: authUser.id
      });

      if (result.status === 'CALCULATED') {
        successCount++;
        totalGross += result.totalEarnings;
        totalDeductions += result.totalDeductions;
        totalNet += result.netSalary;

        await prisma.payrollRunEmployee.update({
          where: { id: record.id },
          data: {
            status: 'CALCULATED',
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
      } else {
        errorCount++;
        await prisma.payrollRunEmployee.update({
          where: { id: record.id },
          data: {
            status: 'ERROR',
            errorMessage: result.errorMessage || 'Calculation failed'
          }
        });
      }

      calculationLogs.push({
        employeeId: record.employeeId,
        status: result.status,
        netSalary: result.netSalary,
        error: result.errorMessage
      });

    } catch (err) {
      errorCount++;
      await prisma.payrollRunEmployee.update({
        where: { id: record.id },
        data: {
          status: 'ERROR',
          errorMessage: err.message
        }
      });
      calculationLogs.push({
        employeeId: record.employeeId,
        status: 'ERROR',
        error: err.message
      });
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
      message: \`Triggered calculations. Success: \${successCount}, Errors: \${errorCount}.\`
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
      success: successCount,
      errors: errorCount,
      totalGross: finalGross,
      totalDeductions: finalDeductions,
      totalNet: finalNet
    },
    logs: calculationLogs
  });
}

// ==========================================
// 4. WORKFLOW ACTIONS (POST)
// ==========================================
async function handleWorkflowAction(request, id, authUser) {
  const body = await request.json();
  const { action, comments } = body;

  console.log(\`[ACTION ROUTE] Incoming Action: \${action} for ID: \${id}\`);

  const run = await prisma.payrollRunV2.findUnique({
    where: { id }
  });

  if (!run) {
    console.log(\`[ACTION ROUTE] Run not found in DB for ID: \${id}\`);
    return NextResponse.json({ error: \`Payroll run not found for ID: \${id}\` }, { status: 404 });
  }

  // SaaS protection check
  if (authUser.role === "admin" && run.organizationId !== authUser.organizationId) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const currentLogs = Array.isArray(run.runLog) ? run.runLog : [];

  if (action === 'SUBMIT_APPROVAL') {
    if (run.status !== 'OPEN' && run.status !== 'PREVIEW') {
      return NextResponse.json({ error: "Payroll run must be in OPEN or PREVIEW state to submit for approval" }, { status: 400 });
    }

    const errorCount = await prisma.payrollRunEmployee.count({
      where: { runId: id, status: 'ERROR' }
    });
    if (errorCount > 0) {
      return NextResponse.json({ error: "Cannot submit for approval when there are employee calculation errors. Resolve them first." }, { status: 400 });
    }

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
    if (run.status !== 'LOCKED') {
      return NextResponse.json({ error: "Payroll run must be LOCKED before releasing payslips" }, { status: 400 });
    }

    const runEmployees = await prisma.payrollRunEmployee.findMany({
      where: { runId: id, status: 'CALCULATED' }
    });

    let releaseCount = 0;
    const organization = await prisma.organization.findUnique({
      where: { id: run.organizationId }
    });
    const orgName = organization ? organization.name : 'Company';

    for (const re of runEmployees) {
      const employee = await prisma.employee.findUnique({
        where: { id: re.employeeId },
        select: { employeeId: true }
      });
      const empCode = employee?.employeeId || re.employeeId;
      const formattedMonth = String(run.month).padStart(2, '0');
      const payslipId = \`PS-\${empCode}-\${run.year}\${formattedMonth}\`;

      await prisma.payslip.upsert({
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

      await prisma.payrollNotification.create({
        data: {
          recipientId: re.employeeId,
          type: 'PAYSLIP_RELEASED',
          title: 'Payslip Released',
          message: \`Your payslip for \${run.month}/\${run.year} has been released. You can now download it from your portal.\`,
          entityType: 'PAYSLIP',
          entityId: payslipId
        }
      });

      releaseCount++;
    }

    const updatedLogs = [
      ...currentLogs,
      {
        timestamp: new Date().toISOString(),
        action: 'PAYSLIPS_RELEASED',
        userId: authUser.id,
        userName: authUser.name || 'Admin',
        message: \`Released \${releaseCount} payslips to employee portals.\`
      }
    ];

    const updatedRun = await prisma.payrollRunV2.update({
      where: { id: run.id },
      data: {
        status: 'PAYSLIPS_GENERATED',
        currentStep: 5,
        runLog: updatedLogs
      }
    });

    return NextResponse.json({ success: true, count: releaseCount, run: updatedRun });
  }

  if (action === 'GENERATE_BANK_FILE') {
    if (run.status !== 'PAYSLIPS_GENERATED') {
      return NextResponse.json({ error: "Payslips must be generated first" }, { status: 400 });
    }

    const runEmployees = await prisma.payrollRunEmployee.findMany({
      where: { runId: id, status: 'CALCULATED' }
    });

    const employeeIds = runEmployees.map(re => re.employeeId);
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, firstName: true, lastName: true, employeeId: true, email: true }
    });
    const employeeMap = {};
    for (const emp of employees) { employeeMap[emp.id] = emp; }

    const bankRecords = await prisma.bank.findMany({
      where: { employeeId: { in: employeeIds } }
    });
    const bankMap = {};
    for (const b of bankRecords) { bankMap[b.employeeId] = b.modelData || {}; }

    const csvHeaders = ['Employee ID','Employee Name','Net Salary','Bank Name','Account Number','IFSC Code'];
    const csvRows = runEmployees.map(re => {
      const emp = employeeMap[re.employeeId] || {};
      const bank = bankMap[re.employeeId] || {};
      return [
        emp.employeeId || re.employeeId,
        \`\${emp.firstName || ''} \${emp.lastName || ''}\`.trim(),
        re.netSalary?.toFixed(2) || '0.00',
        bank.bankName || bank.bank_name || '',
        bank.accountNumber || bank.account_number || '',
        bank.ifscCode || bank.ifsc_code || ''
      ].join(',');
    });
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\\n');

    const updatedLogs = [
      ...currentLogs,
      {
        timestamp: new Date().toISOString(),
        action: 'BANK_FILE_GENERATED',
        userId: authUser.id,
        userName: authUser.name || 'Admin',
        message: 'Bank transfer instruction file compiled.'
      }
    ];

    const updatedRun = await prisma.payrollRunV2.update({
      where: { id: run.id },
      data: {
        status: 'BANK_FILE_GENERATED',
        currentStep: 6,
        bankFileUrl: 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent),
        runLog: updatedLogs
      }
    });

    return NextResponse.json({ success: true, csv: csvContent, run: updatedRun });
  }

  if (action === 'CLOSE') {
    if (run.status !== 'BANK_FILE_GENERATED' && run.status !== 'PAYSLIPS_GENERATED') {
      return NextResponse.json({ error: "Invalid status sequence for closing run" }, { status: 400 });
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

  return NextResponse.json({ error: \`Action '\${action}' not recognized.\` }, { status: 400 });
}

// ==========================================
// 5. STATIC SUBROUTE FALLBACK FOR CALCULATE
// ==========================================
async function handleCalculateSubroute(request, id, authUser) {
  const body = await request.json();
  const { employeeId } = body;

  const run = await prisma.payrollRunV2.findUnique({
    where: { id }
  });

  if (!run) {
    return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
  }

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

  // Same logic as standard post calculate
  return handleCalculateRun(request, id, authUser);
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
        return handleCalculateSubroute(request, id, authUser);
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return handleCalculateRun(request, id, authUser);
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`;

// Create new folder
if (!fs.existsSync(newSlugDir)) {
  fs.mkdirSync(newSlugDir, { recursive: true });
}

// Write new route.js
fs.writeFileSync(path.join(newSlugDir, 'route.js'), unifiedCode, 'utf8');
console.log('Successfully wrote unified [...slug] route.js!');

// Delete old [id] directory recursively
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

deleteFolderRecursive(oldIdDir);
console.log('Successfully deleted old [id] directory!');
