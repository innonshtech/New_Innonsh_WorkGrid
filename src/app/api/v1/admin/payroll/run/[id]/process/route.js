import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';
import { calculateSalaryComponents } from '@/lib/payroll/calculator';

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { performedBy } = body;

        const run = await prisma.payrollRun.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!run) return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
        
        const runStatus = run.status;
        if (runStatus === 'Locked' || runStatus === 'Cancelled') {
            return NextResponse.json({ error: "Cannot process a Locked or Cancelled payroll run." }, { status: 400 });
        }

        const runData = run.runData && typeof run.runData === 'object' ? run.runData : {};
        const currentLogs = runData.logs || [];
        currentLogs.push({ message: "Started recalculation...", level: 'info', timestamp: new Date().toISOString() });

        // Update run status to Processing and update logs in runData
        await prisma.payrollRun.update({
            where: { id: run.id },
            data: {
                status: 'Processing',
                runData: {
                    ...runData,
                    status: 'Processing',
                    logs: currentLogs
                }
            }
        });

        // Fetch active employees for this organization
        const employees = await prisma.employee.findMany({ 
            where: {
                organizationId: run.organizationId,
                status: 'Active'
            } 
        });

        let totalGross = 0;
        let totalDeductions = 0;
        let totalNet = 0;
        let processedCount = 0;
        let failedCount = 0;

        // Fetch Global Payroll Config for OT and other rules
        const payrollConfig = await prisma.payrollConfig.findFirst({ where: { companyId: run.organizationId } });

        // Cache statutory configs
        const stateConfigs = {};

        for (const employee of employees) {
            try {
                // 1. Fetch Statutory Config for Employee's State
                const workState = employee.workState || 'Maharashtra';
                if (!stateConfigs[workState]) {
                    const allConfigs = await prisma.statutoryConfig.findMany({ 
                        where: { organizationId: run.organizationId }
                    });
                    const config = allConfigs.find(c => 
                        c.modelData && typeof c.modelData === 'object' && 
                        (c.modelData.state || '').toLowerCase() === workState.toLowerCase()
                    );
                    stateConfigs[workState] = config || null;
                }

                // 2. Run Unified Calculation Engine (Async)
                const salaryCalc = await calculateSalaryComponents(employee, stateConfigs[workState], {
                    month: run.month,
                    year: run.year,
                    payrollConfig: payrollConfig
                });

                // 3. Create/Update Payslip Payload
                const payslipId = `PSL-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                
                const payslipData = {
                    payrollRunId: run.id,
                    employeeId: employee.id,
                    month: run.month,
                    year: run.year,
                    basicSalary: Math.round(salaryCalc.basicSalary),
                    grossSalary: Math.round(salaryCalc.totalEarnings),
                    totalDeductions: Math.round(salaryCalc.totalDeductions),
                    netSalary: Math.round(salaryCalc.netSalary),
                    earnings: salaryCalc.earnings.map(e => ({
                        type: e.name,
                        amount: Math.round(e.calculatedAmount),
                        calculationType: e.calculationType || 'fixed',
                        percentage: e.percentage || 0
                    })),
                    deductions: salaryCalc.deductions.map(d => ({
                        type: d.name,
                        amount: Math.round(d.calculatedAmount),
                        calculationType: d.calculationType || 'fixed',
                        percentage: d.percentage || 0
                    })),
                    workingDays: salaryCalc.workingDays,
                    presentDays: salaryCalc.presentDays,
                    lopDays: salaryCalc.lopDays || 0,
                    leaveDays: (salaryCalc.paidLeaves || 0) + (salaryCalc.lopDays || 0),
                    paidLeaveDays: salaryCalc.paidLeaves || 0,
                    unpaidLeaveDays: salaryCalc.lopDays || 0,
                    totalDays: salaryCalc.totalDays,
                    weeklyOffs: salaryCalc.weeklyOffs,
                    holidays: salaryCalc.holidays,
                    status: 'Draft',
                    organizationId: run.organizationId,
                    organizationName: employee.companyName || "Organization",
                    salaryType: salaryCalc.salaryType,
                    generatedById: run.processedBy || performedBy || 'system',
                    overtimeHours: salaryCalc.overtimeHours || 0,
                    overtimeAmount: salaryCalc.overtimeAmount || 0,
                    loanDeductions: salaryCalc.loanDeductions || 0,
                    paymentMethod: employee.bankAccountNumber ? "Bank Transfer" : "Manual",
                    pfDetails: salaryCalc.pfDetails || {},
                    esicDetails: salaryCalc.esicDetails || {},
                    professionalTax: salaryCalc.professionalTax || 0,
                    isPFApplicable: employee.pfApplicable === 'yes',
                    isESICApplicable: employee.esicApplicable === 'yes',
                    isPTApplicable: salaryCalc.professionalTax > 0
                };

                // Upsert Payslip
                const existingPayslip = await prisma.payslip.findFirst({ 
                    where: { 
                        employeeId: employee.id, 
                        month: run.month, 
                        year: run.year 
                    } 
                });

                if (existingPayslip) {
                    await prisma.payslip.update({ 
                        where: { id: existingPayslip.id }, 
                        data: payslipData 
                    });
                } else {
                    payslipData.payslipId = payslipId;
                    await prisma.payslip.create({ data: payslipData });
                }

                // 4. Update Retros to 'Applied'
                if (salaryCalc.retroList && salaryCalc.retroList.length > 0) {
                    for (const r of salaryCalc.retroList) {
                        const retroRecord = await prisma.retroAdjustment.findFirst({
                            where: { OR: [{ id: r.retroId }, { mongoId: r.retroId }] }
                        });
                        if (retroRecord) {
                            await prisma.retroAdjustment.update({
                                where: { id: retroRecord.id },
                                data: {
                                    status: 'Applied',
                                    modelData: {
                                        ...(retroRecord.modelData && typeof retroRecord.modelData === 'object' ? retroRecord.modelData : {}),
                                        status: 'Applied',
                                        appliedInMonth: run.month,
                                        appliedInYear: run.year
                                    }
                                }
                            });
                        }
                    }
                }

                totalGross += Math.round(salaryCalc.totalEarnings);
                totalDeductions += Math.round(salaryCalc.totalDeductions);
                totalNet += Math.round(salaryCalc.netSalary);
                processedCount++;

            } catch (err) {
                console.error(`Error processing employee ${employee.employeeId}:`, err);
                failedCount++;
                currentLogs.push({
                    message: `Failed for ${employee.firstName} ${employee.lastName} (${employee.employeeId}): ${err.message}`,
                    level: 'error',
                    employeeId: employee.id,
                    timestamp: new Date().toISOString()
                });
            }
        }

        currentLogs.push({ 
            message: `Recalculation finished. ${processedCount} succeeded, ${failedCount} failed.`, 
            level: 'info',
            timestamp: new Date().toISOString()
        });

        // Final Update to PayrollRun Document
        const updatedRun = await prisma.payrollRun.update({ 
            where: { id: run.id }, 
            data: {
                status: 'Draft',
                runData: {
                    ...runData,
                    status: 'Draft',
                    totalEmployees: employees.length,
                    processedEmployees: processedCount,
                    employeesProcessed: processedCount, // For UI compatibility
                    failedEmployeesCount: failedCount,
                    totalGrossSalary: Math.round(totalGross),
                    totalDeductions: Math.round(totalDeductions),
                    totalNetSalary: Math.round(totalNet),
                    needsRecalculation: false,
                    recalculationReason: null,
                    logs: currentLogs
                }
            } 
        });

        const formattedRun = {
            _id: updatedRun.id,
            id: updatedRun.id,
            status: updatedRun.status,
            month: updatedRun.month,
            year: updatedRun.year,
            organizationId: updatedRun.organizationId,
            processedBy: updatedRun.processedBy,
            createdAt: updatedRun.createdAt,
            updatedAt: updatedRun.updatedAt,
            ...(updatedRun.runData && typeof updatedRun.runData === 'object' ? updatedRun.runData : {})
        };

        return NextResponse.json({
            message: "Batch processing completed",
            processedCount,
            failedCount,
            run: formattedRun,
            totals: { totalGross, totalDeductions, totalNet }
        });

    } catch (error) {
        console.error("Batch Processor Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
