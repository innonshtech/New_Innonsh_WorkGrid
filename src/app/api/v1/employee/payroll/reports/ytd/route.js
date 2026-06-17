import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const financialYear = searchParams.get('financialYear'); // e.g., "2024-25"

        if (!employeeId || !financialYear) {
            return NextResponse.json({ error: "Missing employeeId or financialYear" }, { status: 400 });
        }

        const [startYearStr, endYearStr] = financialYear.split('-');
        const startYear = parseInt(startYearStr);
        const endYear = 2000 + parseInt(endYearStr); // Assuming "24-25" format

        // India FY is April to March
        const payslips = await prisma.payslip.findMany({
            where: {
                employeeId: employeeId,
                status: { not: 'Cancelled' },
                OR: [
                    { year: startYear, month: { gte: 4 } },
                    { year: endYear, month: { lte: 3 } }
                ]
            },
            orderBy: [
                { year: 'asc' },
                { month: 'asc' }
            ]
        });

        const ytdData = {
            employeeId,
            financialYear,
            totalGross: 0,
            totalDeductions: 0,
            totalNet: 0,
            totalBasic: 0,
            earningsBreakdown: {},
            deductionsBreakdown: {},
            monthsProcessed: payslips.length,
            payslips: payslips.map(p => ({
                month: p.month,
                year: p.year,
                netSalary: p.netSalary,
                grossSalary: p.grossSalary
            }))
        };

        payslips.forEach(p => {
            ytdData.totalGross += p.grossSalary || 0;
            ytdData.totalDeductions += p.totalDeductions || 0;
            ytdData.totalNet += p.netSalary || 0;
            ytdData.totalBasic += p.basicSalary || 0;

            // Aggregate earnings
            if (Array.isArray(p.earnings)) {
                p.earnings.forEach(e => {
                    ytdData.earningsBreakdown[e.type] = (ytdData.earningsBreakdown[e.type] || 0) + (e.amount || 0);
                });
            }

            // Aggregate deductions
            if (Array.isArray(p.deductions)) {
                p.deductions.forEach(d => {
                    ytdData.deductionsBreakdown[d.type] = (ytdData.deductionsBreakdown[d.type] || 0) + (d.amount || 0);
                });
            }
        });

        // Round everything
        ytdData.totalGross = Math.round(ytdData.totalGross);
        ytdData.totalDeductions = Math.round(ytdData.totalDeductions);
        ytdData.totalNet = Math.round(ytdData.totalNet);
        ytdData.totalBasic = Math.round(ytdData.totalBasic);

        return NextResponse.json(ytdData);

    } catch (error) {
        console.error("YTD Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
