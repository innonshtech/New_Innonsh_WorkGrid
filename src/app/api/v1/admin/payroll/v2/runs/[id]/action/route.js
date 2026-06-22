import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import { WorkflowEngine } from "@/lib/payroll/engines/workflow-engine";
import { BankFileEngine } from "@/lib/payroll/engines/bank-file-engine";
import { ComplianceEngine } from "@/lib/payroll/engines/compliance-engine";

const workflowEngine = new WorkflowEngine();
const bankFileEngine = new BankFileEngine();
const complianceEngine = new ComplianceEngine();

export async function POST(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { id } = await params;
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
      if (run.status !== 'OPEN' && run.status !== 'PREVIEW') {
        return NextResponse.json({ error: "Payroll run must be in OPEN or PREVIEW state to submit for approval" }, { status: 400 });
      }

      // Check if there are any employees in error state
      const errorCount = await prisma.payrollRunEmployee.count({
        where: { runId: id, status: 'ERROR' }
      });
      if (errorCount > 0) {
        return NextResponse.json({ error: "Cannot submit for approval when there are employee calculation errors. Resolve them first." }, { status: 400 });
      }

      // Initiate the approval workflow
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
          status: 'MANAGER_APPROVAL', // First level usually
          currentStep: 3,
          runLog: updatedLogs
        }
      });

      return NextResponse.json({ success: true, message: "Submitted for approval successfully", workflow });
    }

    if (action === 'LOCK') {
      // Manual lock if needed (e.g. if workflow is bypassed by admin/super_admin)
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
      
      // Load organization name
      const organization = await prisma.organization.findUnique({
        where: { id: run.organizationId }
      });
      const orgName = organization ? organization.name : 'Company';

      for (const re of runEmployees) {
        // Generate unique payslipId (e.g. PS-EMP123-202606)
        const employee = await prisma.employee.findUnique({
          where: { id: re.employeeId },
          select: { employeeId: true }
        });
        const empCode = employee?.employeeId || re.employeeId;
        const formattedMonth = String(run.month).padStart(2, '0');
        const payslipId = `PS-${empCode}-${run.year}${formattedMonth}`;

        // Upsert standard Payslip table for backward compatibility
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

        // Trigger in-app notification to employee
        await prisma.payrollNotification.create({
          data: {
            recipientId: re.employeeId,
            type: 'PAYSLIP_RELEASED',
            title: 'Payslip Released',
            message: `Your payslip for ${run.month}/${run.year} has been released. You can now download it from your portal.`,
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
          message: `Released ${releaseCount} payslips to employee portals.`
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

      // Fetch employee details separately (no Prisma relation on PayrollRunEmployee)
      const employeeIds = runEmployees.map(re => re.employeeId);
      const employees = await prisma.employee.findMany({
        where: { id: { in: employeeIds } },
        select: { id: true, firstName: true, lastName: true, employeeId: true, email: true }
      });
      const employeeMap = {};
      for (const emp of employees) { employeeMap[emp.id] = emp; }

      // Fetch bank details
      const bankRecords = await prisma.bank.findMany({
        where: { employeeId: { in: employeeIds } }
      });
      const bankMap = {};
      for (const b of bankRecords) { bankMap[b.employeeId] = b.modelData || {}; }

      // Build CSV rows
      const csvHeaders = ['Employee ID','Employee Name','Net Salary','Bank Name','Account Number','IFSC Code'];
      const csvRows = runEmployees.map(re => {
        const emp = employeeMap[re.employeeId] || {};
        const bank = bankMap[re.employeeId] || {};
        return [
          emp.employeeId || re.employeeId,
          `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          re.netSalary?.toFixed(2) || '0.00',
          bank.bankName || bank.bank_name || '',
          bank.accountNumber || bank.account_number || '',
          bank.ifscCode || bank.ifsc_code || ''
        ].join(',');
      });
      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

      // In a real environment, we would upload this CSV to S3/Cloudinary and store the URL.
      // Here, we can simulate saving it or returning it as data.
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
          bankFileUrl: 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent), // Inline simulation
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

    return NextResponse.json({ error: `Action '${action}' not recognized.` }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
