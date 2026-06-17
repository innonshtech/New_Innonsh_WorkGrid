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
        const [run1, run2] = await Promise.all([
            prisma.payrollRun.findFirst({ where: { OR: [{ id: runId1 }, { mongoId: runId1 }] } }),
            prisma.payrollRun.findFirst({ where: { OR: [{ id: runId2 }, { mongoId: runId2 }] } })
        ]);

        if (!run1 || !run2) {
            return NextResponse.json({ error: "One or both payroll runs not found" }, { status: 404 });
        }

        // 2. Fetch Payslips
        const [payslips1, payslips2] = await Promise.all([
            prisma.payslip.findMany({ where: { month: run1.month, year: run1.year } }),
            prisma.payslip.findMany({ where: { month: run2.month, year: run2.year } })
        ]);

        // Hydrate employees in-memory since Payslip model doesn't link relationally to Employee in schema.prisma
        const allEmployees = await prisma.employee.findMany();
        const employeeMap = new Map(allEmployees.map(e => [e.id, e]));
        const employeeMongoMap = new Map(allEmployees.filter(e => e.mongoId).map(e => [e.mongoId, e]));

        const hydratePayslip = p => {
            const emp = employeeMap.get(p.employeeId) || employeeMongoMap.get(p.employeeId);
            return {
                ...p,
                employee: emp ? {
                    _id: emp.id,
                    id: emp.id,
                    personalDetails: emp.personalDetails && typeof emp.personalDetails === 'object' ? emp.personalDetails : { firstName: emp.firstName, lastName: emp.lastName },
                    jobDetails: {
                        department: emp.department || "",
                        designation: emp.designation || ""
                    }
                } : {
                    _id: p.employeeId,
                    id: p.employeeId,
                    personalDetails: { firstName: "Unknown", lastName: "Employee" },
                    jobDetails: { department: "", designation: "" }
                }
            };
        };

        const payslips1Hydrated = payslips1.map(hydratePayslip);
        const payslips2Hydrated = payslips2.map(hydratePayslip);

        // 3. High Level Variance (extracting from runData JSON field)
        const rd1 = run1.runData && typeof run1.runData === 'object' ? run1.runData : {};
        const rd2 = run2.runData && typeof run2.runData === 'object' ? run2.runData : {};

        const r1Gross = rd1.totalGrossSalary || run1.totalGrossSalary || 0;
        const r1Net = rd1.totalNetSalary || run1.totalNetSalary || 0;
        const r1EmpCount = rd1.processedEmployees || run1.processedEmployees || payslips1.length;

        const r2Gross = rd2.totalGrossSalary || run2.totalGrossSalary || 0;
        const r2Net = rd2.totalNetSalary || run2.totalNetSalary || 0;
        const r2EmpCount = rd2.processedEmployees || run2.processedEmployees || payslips2.length;

        const highLevelVariance = {
            run1: {
                period: `${run1.month}/${run1.year}`,
                gross: r1Gross,
                net: r1Net,
                employees: r1EmpCount
            },
            run2: {
                period: `${run2.month}/${run2.year}`,
                gross: r2Gross,
                net: r2Net,
                employees: r2EmpCount
            },
            variance: {
                gross: r2Gross - r1Gross,
                net: r2Net - r1Net,
                employees: r2EmpCount - r1EmpCount
            },
            variancePercentage: {
                gross: r1Gross ? ((r2Gross - r1Gross) / r1Gross) * 100 : 0,
                net: r1Net ? ((r2Net - r1Net) / r1Net) * 100 : 0
            }
        };

        // 4. Employee Level Variance
        const employees1Map = new Map(payslips1Hydrated.map(p => [p.employeeId, p]));
        const employees2Map = new Map(payslips2Hydrated.map(p => [p.employeeId, p]));

        const allEmployeeIds = new Set([...employees1Map.keys(), ...employees2Map.keys()]);

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
                    lastNetSalary: p1.netSalary
                });
            } else if (!p1 && p2) {
                // New Joiner (Processed in Run 2 but not Run 1)
                newJoiners.push({
                    id: empId,
                    name: `${p2.employee.personalDetails.firstName || ''} ${p2.employee.personalDetails.lastName || ''}`.trim(),
                    department: p2.employee.jobDetails.department,
                    currentNetSalary: p2.netSalary
                });
            } else if (p1 && p2) {
                // Present in both, check for variance
                const netVariance = p2.netSalary - p1.netSalary;
                const grossVariance = p2.grossSalary - p1.grossSalary;

                if (Math.abs(netVariance) > 0 || Math.abs(grossVariance) > 0) {
                    salaryChanges.push({
                        id: empId,
                        name: `${p2.employee.personalDetails.firstName || ''} ${p2.employee.personalDetails.lastName || ''}`.trim(),
                        department: p2.employee.jobDetails.department,
                        designation: p2.employee.jobDetails.designation,
                        previousNet: p1.netSalary,
                        currentNet: p2.netSalary,
                        netVariance,
                        previousGross: p1.grossSalary,
                        currentGross: p2.grossSalary,
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
    const p1Lop = p1.leaveDetails && typeof p1.leaveDetails === 'object' ? (p1.leaveDetails.leaveDeduction || 0) : 0;
    const p2Lop = p2.leaveDetails && typeof p2.leaveDetails === 'object' ? (p2.leaveDetails.leaveDeduction || 0) : 0;
    if (p2Lop !== p1Lop) reasons.push(`LOP Variance (${p2Lop - p1Lop})`);

    if (p2.grossSalary > p1.grossSalary && p2.basicSalary === p1.basicSalary) reasons.push("Earnings Increased");
    if (p2.grossSalary < p1.grossSalary && p2.basicSalary === p1.basicSalary && p2Lop === p1Lop) reasons.push("Earnings Decreased");

    return reasons.join(", ") || "Other Adjustment";
}
