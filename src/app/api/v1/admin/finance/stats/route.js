import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET() {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        // 1. Total Payroll (Sum of grossSalary from Payslips under organization)
        const payslips = await prisma.payslip.findMany({
            where: {
                organizationId: orgQuery,
                status: {
                    in: ['Completed', 'Approved', 'Locked', 'Published', 'Paid']
                }
            },
            select: { grossSalary: true }
        });
        const totalPayroll = payslips.reduce((sum, p) => sum + (p.grossSalary || 0), 0);

        // 2. Fetch all expenses under organization for in-memory calculations
        const allExpenses = await prisma.expense.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });

        // Sum and count in-memory to avoid Prisma aggregations on missing schema columns
        let totalExpenses = 0;
        let totalPendingReimbursements = 0;
        let totalPaidAmount = 0;
        let pendingApprovalsCount = 0;
        let pendingPaymentsCount = 0;

        allExpenses.forEach(exp => {
            const mData = exp.modelData && typeof exp.modelData === 'object' ? exp.modelData : {};
            const amount = parseFloat(mData.amount) || 0;
            const status = exp.status || mData.status || 'Pending';

            if (status !== 'Draft' && status !== 'Rejected') {
                totalExpenses += amount;
            }
            if (status === 'Pending') {
                totalPendingReimbursements += amount;
                pendingApprovalsCount++;
            }
            if (status === 'Paid') {
                totalPaidAmount += amount;
            }
            if (status === 'Approved') {
                pendingPaymentsCount++;
            }
        });

        // 3. Payroll Pending count
        const payrollPendingCount = await prisma.payrollRun.count({
            where: {
                organizationId: orgQuery,
                status: {
                    in: ['Draft', 'Processing']
                }
            }
        });

        // 4. Recent Activity
        const recentExpenses = await prisma.expense.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const recentPayroll = await prisma.payrollRun.findMany({
            where: { organizationId: orgQuery },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // Map and combine recent activities
        let activities = [];
        
        recentExpenses.forEach(exp => {
            const mData = exp.modelData && typeof exp.modelData === 'object' ? exp.modelData : {};
            let actionType = 'Expense submitted';
            const status = exp.status || mData.status;
            if (status === 'Approved') actionType = 'Approved';
            if (status === 'Paid') actionType = 'Paid';
            if (status === 'Rejected') actionType = 'Rejected';
            
            activities.push({
                id: (exp.id || exp.mongoId || '').toString(),
                type: 'expense',
                action: actionType,
                title: mData.title || 'Untitled Expense',
                timestamp: exp.createdAt
            });
        });

        recentPayroll.forEach(pr => {
            let actionType = 'Payroll processed';
            if (pr.status === 'Draft') actionType = 'Payroll drafted';
            
            activities.push({
                id: (pr.id || pr.mongoId || '').toString(),
                type: 'payroll',
                action: actionType,
                title: `Run for ${pr.month}/${pr.year}`,
                timestamp: pr.createdAt
            });
        });

        // Sort combined activities by timestamp desc and take top 5
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        activities = activities.slice(0, 5);

        return NextResponse.json({
            stats: {
                totalPayroll,
                totalExpenses,
                pendingReimbursements: totalPendingReimbursements,
                paidAmount: totalPaidAmount
            },
            alerts: {
                pendingApprovals: pendingApprovalsCount,
                pendingPayments: pendingPaymentsCount,
                payrollPending: payrollPendingCount
            },
            recentActivity: activities
        });
    } catch (error) {
        console.error("GET Finance Stats error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
