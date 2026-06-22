import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import { PayrollCalculationEngine } from "@/lib/payroll/engines";

const calculationEngine = new PayrollCalculationEngine();

export async function POST(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { id } = await params;
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
        // Run calculations
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

          // Update PayrollRunEmployee record with full details
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
    // If calculating for all, overwrite totals. If calculating for single, recalculate aggregated totals from DB
    let finalGross = totalGross;
    let finalDeductions = totalDeductions;
    let finalNet = totalNet;
    let finalSuccess = successCount;
    let finalErrors = errorCount;

    if (employeeId) {
      // Recalculate totals from all employee records in run
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
        message: `Triggered calculations. Success: ${successCount}, Errors: ${errorCount}.`
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
        currentStep: 2, // Step 2: Calculation done
        status: finalErrors > 0 ? 'OPEN' : 'PREVIEW', // if there are errors, keep OPEN, otherwise move to PREVIEW
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

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
