import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { performedBy } = body;

        let run = await prisma.payrollRun.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!run) return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
        
        const runStatus = run.status || run.runData?.status;
        if (runStatus === 'Locked' || runStatus === 'Cancelled') {
            return NextResponse.json({ error: "Cannot process a Locked or Cancelled payroll run." }, { status: 400 });
        }

        const runData = run.runData && typeof run.runData === 'object' ? run.runData : {};
        const currentLogs = runData.logs || [];
        currentLogs.push({ message: "Started batch processing...", level: 'info', timestamp: new Date().toISOString() });

        run = await prisma.payrollRun.update({
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

        // Define period dates
        const runMonth = run.month || new Date().getMonth() + 1;
        const runYear = run.year || new Date().getFullYear();
        const startDate = runData.periodStart ? new Date(runData.periodStart) : new Date(runYear, runMonth - 1, 1);
        const endDate = runData.periodEnd ? new Date(runData.periodEnd) : new Date(runYear, runMonth, 0);
        const daysInMonth = endDate.getDate();

        for (const empPrisma of employees) {
            try {
                // Removed Mongoose Document fetch since we use empPrisma
                
                // 1. Calculate Attendance-based LOP
                const attendance = await prisma.attendance.findMany({
                    where: {
                        employeeId: empPrisma.id,
                        date: { gte: startDate, lte: endDate },
                        status: { in: ['Absent', 'Leave'] }
                    }
                });

                const lopDays = attendance.length;

                // 2. Fetch Retros
                const retros = await prisma.retroAdjustment.findMany({
                    where: {
                        employeeId: empPrisma.id,
                        status: 'Pending'
                    }
                });

                // 2.5 Fetch Variable Pay Inputs
                const variableInputsRaw = await prisma.payrollVariableInput.findMany({
                    where: {
                        employeeId: { in: [empPrisma.id, empPrisma.mongoId].filter(Boolean) }
                    }
                });

                const runIdMatches = [run.id, run.mongoId].filter(Boolean);
                const variableInputs = variableInputsRaw.filter(v => 
                    v.modelData && typeof v.modelData === 'object' && 
                    runIdMatches.includes(v.modelData.payrollRunId)
                );

                // Fetch component names
                const componentIds = variableInputs.map(v => v.modelData?.componentId).filter(Boolean);
                const variableComponents = componentIds.length > 0 ? await prisma.variablePayConfig.findMany({
                    where: {
                        OR: componentIds.map(id => ({ id })).concat(
                            componentIds.map(id => ({ mongoId: id }))
                        )
                    }
                }) : [];
                
                const componentMap = {};
                variableComponents.forEach(c => {
                    componentMap[c.id] = c.modelData?.name;
                    if (c.mongoId) componentMap[c.mongoId] = c.modelData?.name;
                });

                // 3. Run Calculation Engine (using Prisma pure JS method)
                const { calculateSalaryComponents } = require('@/lib/payroll/calculator');
                const payrollData = await calculateSalaryComponents(empPrisma, null, {
                    workingDaysInMonth: daysInMonth,
                    lopDays: lopDays,
                    month: runMonth,
                    year: runYear
                });

                // Add Retros to calculations
                let retroEarningTotal = retros.filter(r => r.modelData?.type === 'Earning').reduce((sum, r) => sum + (r.modelData?.amount || 0), 0);
                let retroDeductionTotal = retros.filter(r => r.modelData?.type === 'Deduction').reduce((sum, r) => sum + (r.modelData?.amount || 0), 0);

                // Add Variable Pay to calculations
                let variablePayTotal = variableInputs.reduce((sum, v) => sum + (v.modelData?.payoutAmount || 0), 0);

                // Adjust final numbers
                const finalGross = payrollData.totalEarnings + retroEarningTotal + variablePayTotal;
                const finalDeductions = payrollData.totalDeductions + retroDeductionTotal;
                const finalNet = finalGross - finalDeductions;

                // 4. Create/Update Payslip
                const earnings = payrollData.earnings.map(e => ({
                    type: e.name,
                    amount: Math.round(e.calculatedAmount),
                    calculationType: e.calculationType || 'fixed',
                    percentage: e.percentage || 0
                }));
                const deductions = payrollData.deductions.map(d => ({
                    type: d.name,
                    amount: Math.round(d.calculatedAmount),
                    calculationType: d.calculationType || 'fixed',
                    percentage: d.percentage || 0
                }));

                // Add additional retro entries if any
                if (retros.length > 0) {
                    retros.forEach(r => {
                        if (r.modelData?.type === 'Earning') {
                            earnings.push({ type: r.modelData.componentName + " (Retro)", amount: r.modelData.amount });
                        } else {
                            deductions.push({ type: r.modelData.componentName + " (Retro)", amount: r.modelData.amount });
                        }
                    });
                }

                // Add Variable Pay entries
                if (variableInputs.length > 0) {
                    variableInputs.forEach(v => {
                        const name = componentMap[v.modelData?.componentId] || "Variable Pay";
                        earnings.push({
                            type: name,
                            amount: Math.round(v.modelData?.payoutAmount || 0),
                            calculationType: 'performance_linked',
                            percentage: v.modelData?.achievementPercentage || 0
                        });
                    });
                }

                const payslipData = {
                    employeeId: empPrisma.id,
                    organizationId: run.organizationId || empPrisma.organizationId || "N/A",
                    payrollRunId: run.id,
                    month: runMonth,
                    year: runYear,
                    basicSalary: Math.round(payrollData.basicSalary),
                    grossSalary: Math.round(finalGross),
                    totalDeductions: Math.round(finalDeductions),
                    netSalary: Math.round(finalNet),
                    earnings: earnings,
                    deductions: deductions,
                    workingDays: daysInMonth,
                    presentDays: daysInMonth - lopDays,
                    leaveDays: lopDays,
                    lopDays: lopDays,
                    organizationName: empPrisma.companyName || "N/A",
                    salaryType: payrollData.salaryType || 'monthly',
                    employeeType: empPrisma.employeeType || 'Full-Time',
                    generatedById: performedBy
                };

                // Upsert Payslip
                const existingPayslip = await prisma.payslip.findFirst({
                    where: {
                        employeeId: empPrisma.id,
                        month: runMonth,
                        year: runYear
                    }
                });

                if (existingPayslip) {
                    await prisma.payslip.update({
                        where: { id: existingPayslip.id },
                        data: {
                            ...payslipData,
                            status: 'Draft'
                        }
                    });
                } else {
                    const count = await prisma.payslip.count();
                    const payslipId = `PSL${String(count + 1).padStart(6, "0")}`;
                    await prisma.payslip.create({
                        data: {
                            ...payslipData,
                            payslipId,
                            status: 'Draft'
                        }
                    });
                }

                // 5. Update Retros to 'Applied'
                if (retros.length > 0) {
                    for (const r of retros) {
                        await prisma.retroAdjustment.update({
                            where: { id: r.id },
                            data: {
                                status: 'Applied',
                                modelData: {
                                    ...r.modelData,
                                    status: 'Applied',
                                    appliedInMonth: runMonth,
                                    appliedInYear: runYear
                                }
                            }
                        });
                    }
                }

                totalGross += finalGross;
                totalDeductions += finalDeductions;
                totalNet += finalNet;
                processedCount++;

            } catch (err) {
                console.error(`Error processing employee ${empPrisma.id}: `, err);
                failedCount++;
                currentLogs.push({
                    message: `Failed for ${empPrisma.firstName} ${empPrisma.lastName} (${empPrisma.employeeId}): ${err.message}`,
                    level: 'error',
                    employeeId: empPrisma.id,
                    timestamp: new Date().toISOString()
                });
            }
        }

        currentLogs.push({ message: `Processing finished. ${processedCount} succeeded, ${failedCount} failed.`, level: 'info', timestamp: new Date().toISOString() });

        await prisma.payrollRun.update({
            where: { id: run.id },
            data: {
                status: 'Completed',
                runData: {
                    ...runData,
                    status: 'Completed',
                    logs: currentLogs,
                    totalEmployees: employees.length,
                    processedEmployees: processedCount,
                    failedEmployeesCount: failedCount,
                    totalGrossSalary: Math.round(totalGross),
                    totalDeductions: Math.round(totalDeductions),
                    totalNetSalary: Math.round(totalNet)
                }
            }
        });

        return NextResponse.json({
            message: "Batch processing completed",
            processedCount,
            failedCount,
            totals: { totalGross, totalDeductions, totalNet }
        });

    } catch (error) {
        console.error("Batch Processor Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
