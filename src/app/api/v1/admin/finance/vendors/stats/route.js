import { NextResponse } from 'next/server';
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

        const totalVendors = await prisma.vendor.count({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });
        
        const invoices = await prisma.vendorInvoice.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ],
                NOT: { status: 'Cancelled' }
            }
        });
        
        const stats = invoices.reduce((acc, inv) => {
            const data = inv.modelData || {};
            const amount = parseFloat(data.totalAmount) || 0;
            acc.totalExpenses += amount;
            if (inv.status === 'Paid') {
                acc.paidAmount += amount;
            } else if (inv.status === 'Approved' || inv.status === 'Pending') {
                acc.pendingPayments += amount;
            }
            return acc;
        }, { totalExpenses: 0, paidAmount: 0, pendingPayments: 0 });

        return NextResponse.json({
            totalVendors,
            ...stats
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
