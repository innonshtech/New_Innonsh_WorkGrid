import { NextResponse } from 'next/server';

import prisma from '@/lib/db/prisma';



import { getAuthUser, authorize } from '@/lib/auth-util';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ['employee', 'admin', 'hr', 'company_admin', 'super_admin']);
        

        // 1. Resolve current employee
        let currentEmployee = null;
        if (true) {
            currentEmployee = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
            if (!currentEmployee) {
                const userRecord = await prisma.user.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
                if (userRecord && userRecord.employeeId) {
                    currentEmployee = await prisma.employee.findFirst({ where: { employeeId: userRecord.employeeId } });
                }
            }
        }

        if (!currentEmployee) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 2. Find pending applications assigned to this employee's ID
        const applications = await LeaveApplication.find({
            'approvalChain': {
                $elemMatch: {
                    approverId: currentEmployee._id,
                    status: 'Pending'
                }
            },
            status: 'Pending' // The global request itself must be pending
        })
        
        ;

        // Format data to expose necessary fields
        const formattedData = applications.map(app => {
            const step = app.approvalChain.find(s => s.approverId.toString() === currentEmployee._id.toString());
            return {
                _id: app._id,
                employee: app.employee,
                leaveType: app.leaveType,
                startDate: app.startDate,
                endDate: app.endDate,
                totalDays: app.totalDays,
                reason: app.reason,
                createdAt: app.createdAt,
                attachments: app.attachments,
                myApprovalRole: step?.level,
                isFinalApprover: app.finalApproverId?.toString() === currentEmployee._id.toString()
            };
        });

        return NextResponse.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Error fetching team approvals:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
