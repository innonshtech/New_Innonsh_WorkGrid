import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';
import { logActivity } from '@/lib/logger';
import { syncLeaveApplicationToPayroll } from '@/lib/payroll/leave-sync-engine';

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        
        const authUser = await getAuthUser();
        authorize(authUser, ['employee', 'admin', 'hr', 'company_admin', 'super_admin']);

        const body = await request.json();
        const { action, remarks } = body;

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Resolve current employee
        let currentEmployee = await prisma.employee.findFirst({
            where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
        });

        if (!currentEmployee) {
            const userRecord = await prisma.user.findFirst({
                where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
            });
            if (userRecord && userRecord.employeeId) {
                currentEmployee = await prisma.employee.findFirst({
                    where: { OR: [{ id: userRecord.employeeId }, { employeeId: userRecord.employeeId }] }
                });
            }
        }

        if (!currentEmployee) {
            return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
        }

        const application = await prisma.leaveApplication.findFirst({
            where: { OR: [{ id: id }, { mongoId: id }] }
        });
        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const modelData = application.modelData && typeof application.modelData === 'object' ? application.modelData : {};
        const approvalChain = modelData.approvalChain || [];

        // Find the approver's step in the chain
        const stepIndex = approvalChain.findIndex(
            step => step.approverId === currentEmployee.id || step.approverId === currentEmployee.mongoId
        );

        if (stepIndex === -1) {
            return NextResponse.json({ error: 'You are not authorized to approve this request' }, { status: 403 });
        }

        if (approvalChain[stepIndex].status !== 'Pending') {
            return NextResponse.json({ error: 'You have already actioned this request' }, { status: 400 });
        }

        // Process Action
        let newStatus = application.status;
        const updatedChain = [...approvalChain];
        let rejectionReason = modelData.rejectionReason || '';
        let approvedBy = modelData.approvedBy || null;
        let approvedAt = modelData.approvedAt || null;

        if (action === 'reject') {
            updatedChain[stepIndex] = {
                ...updatedChain[stepIndex],
                status: 'Rejected',
                remarks,
                updatedAt: new Date().toISOString()
            };
            newStatus = 'Rejected';
            rejectionReason = remarks || `Rejected by ${currentEmployee.firstName}`;
        } else if (action === 'approve') {
            updatedChain[stepIndex] = {
                ...updatedChain[stepIndex],
                status: 'Approved',
                remarks,
                updatedAt: new Date().toISOString()
            };
            
            // Check if this was the final approver
            const finalApproverId = modelData.finalApproverId;
            if (finalApproverId === currentEmployee.id || finalApproverId === currentEmployee.mongoId) {
                newStatus = 'Approved';
                approvedBy = currentEmployee.id; 
                approvedAt = new Date().toISOString();
            }
        }

        const updatedModelData = {
            ...modelData,
            approvalChain: updatedChain,
            rejectionReason,
            approvedBy,
            approvedAt
        };

        const updatedApplication = await prisma.leaveApplication.update({
            where: { id: application.id },
            data: {
                status: newStatus,
                modelData: updatedModelData
            }
        });

        // Trigger Sync Engine if fully approved
        if (newStatus === 'Approved') {
            try {
                await syncLeaveApplicationToPayroll(application.id);
            } catch (syncError) {
                console.error('Failed to sync leave to payroll:', syncError);
            }
        }

        // Fetch applicant employee details for activity log
        const applicant = await prisma.employee.findFirst({
            where: { OR: [{ id: application.employeeId }, { mongoId: application.employeeId }] }
        });
        const applicantName = applicant ? `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() : 'Employee';

        // Log activity
        await logActivity({
            action: action === 'approve' ? 'approved' : 'rejected',
            entity: "LeaveApplication",
            entityId: application.id,
            description: `${currentEmployee.firstName} ${action}d leave request for ${applicantName}`,
            performedBy: {
                userId: authUser.id,
                name: authUser.name
            },
            req: request
        });

        return NextResponse.json({ success: true, application: updatedApplication });

    } catch (error) {
        console.error('Error actioning leave request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
