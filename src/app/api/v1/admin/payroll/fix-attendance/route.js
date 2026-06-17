import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { calculateSalaryComponents } from '@/lib/payroll/calculator';

export async function GET(req) {
    try {
        const month = 4; // April
        const year = 2026;
        
        console.log(`[FixScript] Starting attendance sync for ${month}/${year}`);
        
        const payslips = await prisma.payslip.findMany({ where: { month, year } });
        let updatedCount = 0;
        
        for (const payslip of payslips) {
            const employee = await prisma.employee.findFirst({ where: { OR: [{ id: payslip.employeeId }, { mongoId: payslip.employeeId }] } });
            if (!employee) continue;
            
            const result = await calculateSalaryComponents(employee, null, { 
                month, 
                year,
                workingDaysInMonth: payslip.totalDays 
            });
            
            await prisma.payslip.update({
                where: { id: payslip.id },
                data: {
                    presentDays: result.presentDays,
                    paidDays: result.paidDays,
                    paidLeaveDays: result.paidLeaves,
                    unpaidLeaveDays: result.lopDays
                }
            });
            updatedCount++;
            console.log(`[FixScript] Updated ${employee.employeeId}: Present=${result.presentDays}, LOP=${result.lopDays}`);
        }
        
        return NextResponse.json({ 
            success: true, 
            message: `Successfully updated ${updatedCount} payslips for April 2026.`,
            details: `Present Days logic (Working - LOP - Leaves) applied globally.`
        });
        
    } catch (error) {
        console.error('[FixScript] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
