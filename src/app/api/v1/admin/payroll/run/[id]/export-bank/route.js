import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { generateHDFCPayout, generateICICIPayout } from '@/lib/utils/payout-generator';

export async function GET(request, { params }) {
    try {
        
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'hdfc';

        // 1. Fetch the Payroll Run
        const run = await prisma.payrollRun.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!run) return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });

        // 2. Fetch all Payslips for this run (only those with netSalary > 0)
        const payslips = await prisma.payslip.findMany({ where: { 
            payrollRunId: run.id,
            netSalary: { gt: 0 }
        } });

        if (payslips.length === 0) {
            return NextResponse.json({ error: "No finalized payslips found with positive net salary for this run." }, { status: 404 });
        }

        // 3. Generate CSV content based on format
        let csvContent = "";
        let fileName = "";

        if (format.toLowerCase() === 'hdfc') {
            // In a real app, you might fetch the organization's sender account number from settings
            const senderAcc = "50200012345678"; 
            csvContent = generateHDFCPayout(payslips, senderAcc);
            fileName = `HDFC_Transfer_${run.month}_${run.year}.csv`;
        } else if (format.toLowerCase() === 'icici') {
            csvContent = generateICICIPayout(payslips);
            fileName = `ICICI_Transfer_${run.month}_${run.year}.csv`;
        } else {
            return NextResponse.json({ error: "Unsupported bank format. Supported: hdfc, icici" }, { status: 400 });
        }

        // 4. Return as a streamable file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });

    } catch (error) {
        console.error("Export Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
