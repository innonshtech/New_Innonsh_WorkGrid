import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { logActivity } from "@/lib/logger";
import { getAuthUser, authorize } from "@/lib/auth-util";
import { calculateSalaryComponents } from '@/lib/payroll/calculator';

export async function POST(request) {
  let payrollRun = null;
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const body = await request.json();
    let { month, year, orgId } = body;

    // SaaS PROTECTION: Admin must use their assigned organizationId
    if (authUser.role === "admin") {
      orgId = authUser.organizationId;
    }

    if (!orgId || orgId === "undefined" || orgId === "null") {
      const firstOrg = await prisma.organization.findFirst();
      if (firstOrg) orgId = firstOrg.id;
    }

    if (!month || !year || !orgId) {
      return NextResponse.json({ error: "Missing required fields (month, year, orgId)" }, { status: 400 });
    }

    // --- FUTURE DATE PROTECTION --- //
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      return NextResponse.json({ 
        error: "Cannot run payroll for future months. Please select the current or a previous month." 
      }, { status: 400 });
    }

    // 1. Check if a Payroll Run already exists for this Org + Month + Year
    const existingRun = await prisma.payrollRun.findFirst({
        where: {
            month: parseInt(month),
            year: parseInt(year),
            organizationId: orgId
        }
    });

    if (existingRun) {
      return NextResponse.json(
        { 
          error: "A Payroll Run already exists for this period.", 
          existingRunId: existingRun.id 
        },
        { status: 409 }
      );
    }

    // 2. Fetch all Active & Compliant employees for this Organization
    const employees = await prisma.employee.findMany({
        where: {
            organizationId: orgId,
            status: "Active"
        }
    });

    if (employees.length === 0) {
      return NextResponse.json({ error: "No active employees found for this organization." }, { status: 404 });
    }

    // 2.5 Filter out employees who already have a Payslip for this month/year
    const existingPayslips = await prisma.payslip.findMany({
        where: {
            month: parseInt(month),
            year: parseInt(year),
            organizationId: orgId
        }
    });
    const existingEmpIds = existingPayslips.map(p => p.employeeId);
    
    const eligibleEmployees = employees.filter(emp => !existingEmpIds.includes(emp.id));

    if (eligibleEmployees.length === 0) {
      return NextResponse.json({ 
        error: "All active employees already have payslips generated for this period." 
      }, { status: 409 });
    }

    // 3. Create the Master PayrollRun Document (Draft state)
    const runId = `PRUN-${year}${String(month).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    payrollRun = await prisma.payrollRun.create({
        data: {
            organizationId: orgId,
            month: parseInt(month),
            year: parseInt(year),
            status: 'Draft',
            processedBy: authUser.name,
            runData: {
                runId,
                generatedBy: authUser.id,
                periodStart: new Date(year, month - 1, 1).toISOString(),
                periodEnd: new Date(year, month, 0).toISOString(),
            }
        }
    });

    const generatedPayslips = [];
    const errors = [];
    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;

    // Cache statutory config to avoid repeated DB calls
    const stateConfigs = {};

    // 4. Loop through each eligible employee and generate a Draft Payslip
    for (const employeeDoc of eligibleEmployees) {
      try {
        const payslipStructure = employeeDoc.payslipStructure && typeof employeeDoc.payslipStructure === 'object' ? employeeDoc.payslipStructure : {};
        if (!payslipStructure.basicSalary) {
           errors.push({ employeeId: employeeDoc.employeeId, error: "Missing salary structure" });
           continue;
        }

        // Fetch Statutory Config for Employee's State if not cached
        const workState = employeeDoc.workState || 'Maharashtra';
        if (!stateConfigs[workState]) {
           const config = await prisma.statutoryConfig.findFirst({
               where: { state: { equals: workState, mode: 'insensitive' } }
           });
           stateConfigs[workState] = config;
        }

        // --- ATTENDANCE, LEAVE & LOAN INTEGRATION --- //
        const totalDays = new Date(year, month, 0).getDate();

        // --- CALCULATE COMPONENTS (Async) --- //
        const salaryCalc = await calculateSalaryComponents(employeeDoc, stateConfigs[workState], {
            workingDaysInMonth: totalDays,
            month: parseInt(month),
            year: parseInt(year)
        });

        const grossSalary = salaryCalc.totalEarnings;
        const netSalary = salaryCalc.netSalary;

        totalGross += grossSalary;
        totalNet += netSalary;
        totalDeductions += salaryCalc.totalDeductions;

        // Generate unique payslip ID
        const uniqueSuffix = Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const payslipId = `PSL-${uniqueSuffix}`;

        // Create Payload
        generatedPayslips.push({
          payslipId,
          payrollRunId: payrollRun.id, // LINK TO BATCH RUN
          employeeId: employeeDoc.id,
          employeeType: employeeDoc.employeeType || null,
          organizationId: orgId,
          organizationName: employeeDoc.companyName || "Organization",
          month: parseInt(month),
          year: parseInt(year),
          status: "Draft",
          salaryType: salaryCalc.salaryType || "monthly",
          basicSalary: Math.round(salaryCalc.basicSalary),
          earnings: salaryCalc.earnings.map(e => ({
            type: e.name,
            amount: Math.round(e.calculatedAmount),
            percentage: e.percentage || 0,
            calculationType: e.calculationType || "percentage"
          })),
          deductions: salaryCalc.deductions.map(d => ({
            type: d.name,
            amount: Math.round(d.calculatedAmount),
            percentage: d.percentage || 0,
            calculationType: d.calculationType || "percentage"
          })),
          leaveDays: (salaryCalc.paidLeaves || 0) + (salaryCalc.lopDays || 0),
          paidLeaveDays: salaryCalc.paidLeaves || 0,
          unpaidLeaveDays: salaryCalc.lopDays || 0,
          totalDays: salaryCalc.totalDays || totalDays,
          weeklyOffs: salaryCalc.weeklyOffs || 0,
          halfDays: salaryCalc.halfDays || 0,
          holidays: salaryCalc.holidays || 0,
          workingDays: salaryCalc.workingDays || 0,
          presentDays: salaryCalc.presentDays || 0,
          paidDays: salaryCalc.paidDays || 0,
          overtimeHours: salaryCalc.overtimeHours || 0,
          overtimeRate: 0,
          overtimeAmount: salaryCalc.overtimeAmount || 0,
          loanDeductions: salaryCalc.loanDeductions || 0,
          grossSalary: Math.round(grossSalary),
          totalDeductions: Math.round(salaryCalc.totalDeductions),
          netSalary: Math.round(netSalary),
          generatedById: authUser.id,
          paymentMethod: employeeDoc.bankAccountNumber ? "Bank Transfer" : "Manual",
          isPFApplicable: employeeDoc.pfApplicable === 'yes',
          isESICApplicable: employeeDoc.esicApplicable === 'yes',
          isPTApplicable: salaryCalc.professionalTax > 0,
          professionalTax: salaryCalc.professionalTax || 0
        });

      } catch (empError) {
        console.error(`Error processing employee ${employeeDoc.employeeId}: `, empError);
        errors.push({ employeeId: employeeDoc.employeeId, error: empError.message });
      }
    }

    // 5. Bulk Insert Payslips
    if (generatedPayslips.length > 0) {
      await prisma.payslip.createMany({ data: generatedPayslips });
      
      // Update Retro Adjustments to 'Applied' for all processed employees in this run
      const processedEmpIds = generatedPayslips.map(p => p.employeeId);
      const retrosToUpdate = await prisma.retroAdjustment.findMany({
          where: {
              employeeId: { in: processedEmpIds },
              status: 'Pending'
          }
      });
      for (const retro of retrosToUpdate) {
          await prisma.retroAdjustment.update({
              where: { id: retro.id },
              data: {
                  status: 'Applied',
                  modelData: {
                      ...(retro.modelData && typeof retro.modelData === 'object' ? retro.modelData : {}),
                      status: 'Applied',
                      appliedInMonth: parseInt(month),
                      appliedInYear: parseInt(year)
                  }
              }
          });
      }

      // Update Payroll Run aggregate metrics inside runData JSON column
      await prisma.payrollRun.update({
          where: { id: payrollRun.id },
          data: {
              runData: {
                  runId,
                  generatedBy: authUser.id,
                  periodStart: new Date(year, month - 1, 1).toISOString(),
                  periodEnd: new Date(year, month, 0).toISOString(),
                  totalGrossSalary: Math.round(totalGross),
                  totalNetSalary: Math.round(totalNet),
                  totalDeductions: Math.round(totalDeductions),
                  totalEmployees: generatedPayslips.length,
                  processedEmployees: generatedPayslips.length,
                  employeesProcessed: generatedPayslips.length,
                  logs: [
                      { message: `Batch generated ${generatedPayslips.length} payslips for ${month}/${year}`, level: 'info', timestamp: new Date().toISOString() }
                  ]
              }
          }
      });
    } else {
      // If none generated successfully, remove the draft run
      await prisma.payrollRun.delete({ where: { id: payrollRun.id } });
      return NextResponse.json({ error: "Failed to generate any payslips. Ensure employees have salary structures." }, { status: 400 });
    }

    // 6. Log completion
    await logActivity({
      action: "batch_generated",
      entity: "PayrollRun",
      entityId: runId,
      description: `Batch generated ${generatedPayslips.length} payslips for ${month}/${year}`,
      performedBy: { userId: authUser.id, name: authUser.name },
      req: request
    });

    return NextResponse.json({
        message: `Successfully generated ${generatedPayslips.length} draft payslips.`,
        runId: payrollRun.id,
        employeesProcessed: generatedPayslips.length,
        errors: errors.length > 0 ? errors : undefined
    }, { status: 201 });

  } catch (error) {
    console.error("Batch Payroll Error:", error);
    if (payrollRun && payrollRun.id) {
      try {
        await prisma.payrollRun.delete({ where: { id: payrollRun.id } });
      } catch (cleanupErr) {
        console.error("Failed to cleanup empty PayrollRun:", cleanupErr);
      }
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
