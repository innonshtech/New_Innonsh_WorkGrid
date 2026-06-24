import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import { ComplianceEngine } from "@/lib/payroll/engines/compliance-engine";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "supervisor"]);

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');
    const type = searchParams.get('type'); // PF_ECR, ESIC, PT, SALARY_REGISTER

    if (!runId || !type) {
      return NextResponse.json({ error: "Missing required query parameters: runId and type" }, { status: 400 });
    }

    const run = await prisma.payrollRunV2.findUnique({
      where: { id: runId }
    });

    if (!run) {
      return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
    }

    // SaaS protection check
    if (authUser.role === "admin" && run.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Fetch employees in the run
    const runEmployees = await prisma.payrollRunEmployee.findMany({
      where: { runId }
    });

    // Bulk query employee profiles
    const empIds = runEmployees.map(re => re.employeeId);
    const employees = await prisma.employee.findMany({
      where: { id: { in: empIds } }
    });
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // Attach employee info to runEmployee records
    const populatedRunEmployees = runEmployees.map(re => {
      const emp = employeeMap.get(re.employeeId) || {};
      const statBr = typeof re.statutoryBreakdown === 'string' 
        ? JSON.parse(re.statutoryBreakdown) 
        : (re.statutoryBreakdown || {});
      const dedBr = typeof re.deductionsBreakdown === 'string'
        ? JSON.parse(re.deductionsBreakdown)
        : (re.deductionsBreakdown || {});
      const earnBr = typeof re.earningsBreakdown === 'string'
        ? JSON.parse(re.earningsBreakdown)
        : (re.earningsBreakdown || {});
      const taxBr = typeof re.taxBreakdown === 'string'
        ? JSON.parse(re.taxBreakdown)
        : (re.taxBreakdown || {});

      // ComplianceEngine looks for re.statutoryBreakdown, re.deductionsBreakdown
      // PF ECR looks for stat.pfWage, stat.pfBasis, stat.employeePF, stat.eps, stat.employerEPF
      // ESI return looks for stat.employeeESI, stat.employerESI
      // PT summary looks for re.deductionsBreakdown.PT
      // Let's populate pfWage and pfBasis if they aren't explicitly inside statBr but PF is active.
      // Under pf-engine: pfWage represents the wages eligible for PF, and pfBasis is the restricted basis amount (₹15,000 ceiling).
      const statBreakdown = {
        pfWage: statBr.pfWage ?? statBr.eligibleWages ?? statBr.PF_WAGE ?? (statBr.PF_EMPLOYEE > 0 ? re.basicEarned : 0),
        pfBasis: statBr.pfBasis ?? statBr.eligibleWagesRestricted ?? statBr.PF_BASIS ?? (statBr.PF_EMPLOYEE > 0 ? Math.min(re.basicEarned, 15000) : 0),
        employeePF: statBr.PF_EMPLOYEE ?? statBr.employeePF ?? 0,
        eps: statBr.EPS ?? statBr.employerEPS ?? 0,
        employerEPF: statBr.PF_EMPLOYER ?? statBr.employerEPF ?? 0,
        employeeESI: statBr.ESI_EMPLOYEE ?? statBr.employeeESI ?? 0,
        employerESI: statBr.ESI_EMPLOYER ?? statBr.employerESI ?? 0,
      };

      return {
        ...re,
        employee: emp,
        statutoryBreakdown: statBreakdown,
        deductionsBreakdown: dedBr,
        earningsBreakdown: earnBr,
        taxBreakdown: taxBr
      };
    });

    const complianceEngine = new ComplianceEngine();

    if (type === 'PF_ECR') {
      const content = complianceEngine.generatePFECR(populatedRunEmployees);
      return new Response(content, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename=PF_ECR_${run.runCode || runId}.txt`
        }
      });
    }

    if (type === 'ESIC') {
      const content = complianceEngine.generateESICSpreadsheet(populatedRunEmployees);
      return new Response(content, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=ESIC_Return_${run.runCode || runId}.csv`
        }
      });
    }

    if (type === 'PT') {
      const summary = complianceEngine.summarizePT(populatedRunEmployees);
      return NextResponse.json({ success: true, summary });
    }

    if (type === 'SALARY_REGISTER') {
      const headers = [
        'Employee ID', 'Name', 'Department', 'Designation', 'Regime',
        'Basic Earned', 'Gross Earnings', 'EPF Employee', 'ESIC Employee', 'Professional Tax', 'Income Tax TDS',
        'Other Deductions', 'Total Deductions', 'Net Payout'
      ];

      const rows = populatedRunEmployees.map(re => {
        const emp = re.employee || {};
        const regime = (re.taxBreakdown?.regime || emp.taxRegime || 'new').toUpperCase();
        return [
          emp.employeeId || re.employeeCode || '',
          `"${emp.firstName || ''} ${emp.lastName || ''}"`,
          `"${emp.department || ''}"`,
          `"${emp.designation || ''}"`,
          regime,
          re.basicEarned?.toFixed(2) || '0.00',
          re.grossEarnings?.toFixed(2) || '0.00',
          (re.statutoryBreakdown?.employeePF || 0).toFixed(2),
          (re.statutoryBreakdown?.employeeESI || 0).toFixed(2),
          (re.deductionsBreakdown?.PT || 0).toFixed(2),
          (re.totalTax || 0).toFixed(2),
          (re.totalOtherDeductions || 0).toFixed(2),
          re.totalDeductions?.toFixed(2) || '0.00',
          re.netSalary?.toFixed(2) || '0.00'
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=Salary_Register_${run.runCode || runId}.csv`
        }
      });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });

  } catch (error) {
    console.error("❌ Generate Report Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
