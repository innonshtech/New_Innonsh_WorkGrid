import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const runId1 = searchParams.get('runId1');
        const runId2 = searchParams.get('runId2');

        if (!runId1 || !runId2) {
            return NextResponse.json({ error: "Missing runId1 or runId2" }, { status: 400 });
        }

        // 1. Fetch Payroll Runs
        const [run1Record, run2Record] = await Promise.all([
            prisma.payrollRun.findFirst({ where: { OR: [{ id: runId1 }, { mongoId: runId1 }] } }),
            prisma.payrollRun.findFirst({ where: { OR: [{ id: runId2 }, { mongoId: runId2 }] } })
        ]);

        if (!run1Record || !run2Record) {
            return NextResponse.json({ error: "One or both payroll runs not found" }, { status: 404 });
        }

        const run1 = run1Record;
        const run2 = run2Record;

        // 2. Fetch Payslips
        const [rawPayslips1, rawPayslips2] = await Promise.all([
            prisma.payslip.findMany({
                where: { payrollRunId: run1Record.id }
            }),
            prisma.payslip.findMany({
                where: { payrollRunId: run2Record.id }
            })
        ]);

        const fetchEmployeeData = async (rawPayslips) => {
            const mapped = await Promise.all(rawPayslips.map(async p => {
                const empId = p.employeeId;
                let employee = { _id: empId, personalDetails: {}, jobDetails: {} };
                if (empId) {
                    const e = await prisma.employee.findFirst({ where: { OR: [{ id: empId }, { mongoId: empId }] } });
                    if (e) {
                        employee = {
                            _id: e.id,
                            personalDetails: {
                                firstName: e.firstName,
                                lastName: e.lastName
                            },
                            jobDetails: {
                                department: e.department,
                                designation: e.designation
                            }
                        };
                    }
                }
                return { _id: p.id, ...p, employee };
            }));
            return mapped;
        };

        const payslips1 = await fetchEmployeeData(rawPayslips1);
        const payslips2 = await fetchEmployeeData(rawPayslips2);

        // 3. High Level Variance
        const highLevelVariance = {
            run1: {
                period: `${run1.month}/${run1.year}`,
                gross: run1.totalGrossSalary || 0,
                net: run1.totalNetSalary || 0,
                employees: run1.processedEmployees || 0
            },
            run2: {
                period: `${run2.month}/${run2.year}`,
                gross: run2.totalGrossSalary || 0,
                net: run2.totalNetSalary || 0,
                employees: run2.processedEmployees || 0
            },
            variance: {
                gross: (run2.totalGrossSalary || 0) - (run1.totalGrossSalary || 0),
                net: (run2.totalNetSalary || 0) - (run1.totalNetSalary || 0),
                employees: (run2.processedEmployees || 0) - (run1.processedEmployees || 0)
            },
            variancePercentage: {
                gross: run1.totalGrossSalary ? (((run2.totalGrossSalary || 0) - run1.totalGrossSalary) / run1.totalGrossSalary) * 100 : 0,
                net: run1.totalNetSalary ? (((run2.totalNetSalary || 0) - run1.totalNetSalary) / run1.totalNetSalary) * 100 : 0
            }
        };

        // 4. Employee Level Variance
        const employees1Map = new Map(payslips1.map(p => [String(p.employee._id), p]));
        const employees2Map = new Map(payslips2.map(p => [String(p.employee._id), p]));

        const allEmployeeIds = new Set([...employees1Map.keys(), ...employees2Map.keys()]);

        const employeeVariances = [];
        const newJoiners = [];
        const exits = [];
        const salaryChanges = [];

        for (const empId of allEmployeeIds) {
            const p1 = employees1Map.get(empId);
            const p2 = employees2Map.get(empId);

            if (p1 && !p2) {
                // Exit (Processed in Run 1 but not Run 2)
                exits.push({
                    id: empId,
                    name: `${p1.employee.personalDetails.firstName || ''} ${p1.employee.personalDetails.lastName || ''}`.trim(),
                    department: p1.employee.jobDetails.department,
                    lastNetSalary: p1.netSalary || 0
                });
            } else if (!p1 && p2) {
                // New Joiner (Processed in Run 2 but not Run 1)
                newJoiners.push({
                    id: empId,
                    name: `${p2.employee.personalDetails.firstName || ''} ${p2.employee.personalDetails.lastName || ''}`.trim(),
                    department: p2.employee.jobDetails.department,
                    currentNetSalary: p2.netSalary || 0
                });
            } else if (p1 && p2) {
                // Present in both, check for variance
                const netVariance = (p2.netSalary || 0) - (p1.netSalary || 0);
                const grossVariance = (p2.grossSalary || 0) - (p1.grossSalary || 0);

                if (Math.abs(netVariance) > 0 || Math.abs(grossVariance) > 0) {
                    salaryChanges.push({
                        id: empId,
                        name: `${p2.employee.personalDetails.firstName || ''} ${p2.employee.personalDetails.lastName || ''}`.trim(),
                        department: p2.employee.jobDetails.department,
                        designation: p2.employee.jobDetails.designation,
                        previousNet: p1.netSalary || 0,
                        currentNet: p2.netSalary || 0,
                        netVariance,
                        previousGross: p1.grossSalary || 0,
                        currentGross: p2.grossSalary || 0,
                        grossVariance,
                        reason: detectReason(p1, p2)
                    });
                }
            }
        }

        return NextResponse.json({
            meta: {
                run1: { id: run1.id, label: `${run1.month}/${run1.year}` },
                run2: { id: run2.id, label: `${run2.month}/${run2.year}` }
            },
            summary: highLevelVariance,
            details: {
                newJoiners,
                exits,
                salaryChanges,
                totalChanges: salaryChanges.length
            }
        });

    } catch (error) {
        console.error("Comparison Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function detectReason(p1, p2) {
    const reasons = [];
    if (p2.basicSalary !== p1.basicSalary) reasons.push("Basic Change");

    // Check Leave Deduction
    const p1Lop = p1.leaveDetails?.leaveDeduction || 0;
    const p2Lop = p2.leaveDetails?.leaveDeduction || 0;
    if (p2Lop !== p1Lop) reasons.push(`LOP Variance (${p2Lop - p1Lop})`);

    // Check Variable Pay (Incentives/Bonuses) if modeled in earnings
    // Simplified check:
    if ((p2.grossSalary || 0) > (p1.grossSalary || 0) && p2.basicSalary === p1.basicSalary) reasons.push("Earnings Increased");
    if ((p2.grossSalary || 0) < (p1.grossSalary || 0) && p2.basicSalary === p1.basicSalary && p2Lop === p1Lop) reasons.push("Earnings Decreased");

    return reasons.join(", ") || "Other Adjustment";
}
