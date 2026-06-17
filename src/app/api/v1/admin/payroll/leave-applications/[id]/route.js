import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { logActivity } from "@/lib/logger";
import { calculateEffectiveLeaveDays } from "@/lib/utils/leave-calculator";
import { syncLeaveApplicationToPayroll } from "@/lib/payroll/leave-sync-engine";

// GET single leave application
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const application = await prisma.leaveApplication.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const { modelData, ...rest } = application;
        const flattened = {
            id: application.id,
            _id: application.id,
            mongoId: application.mongoId,
            employeeId: application.employeeId,
            organizationId: application.organizationId,
            status: application.status,
            createdAt: application.createdAt,
            updatedAt: application.updatedAt,
            ...(modelData || {})
        };

        const empKey = flattened.employee || flattened.employeeId;
        if (empKey) {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: empKey }, { mongoId: empKey }] },
                select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true }
            });
            if (emp) {
                const empObj = {
                    _id: emp.id,
                    id: emp.id,
                    employeeId: emp.employeeId,
                    personalDetails: { firstName: emp.firstName, lastName: emp.lastName }
                };
                flattened.employee = empObj;
                flattened.employeeId = empObj;
            }
        }

        return NextResponse.json(flattened);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UPDATE leave application status (Approve/Reject)
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, rejectionReason, approvedBy } = body;

        if (!status || !['Approved', 'Rejected'].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const application = await prisma.leaveApplication.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const isApprovedByUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(approvedBy);
        const approverUser = await prisma.user.findFirst({
            where: isApprovedByUuid ? { OR: [{ id: approvedBy }, { mongoId: approvedBy }] } : { mongoId: approvedBy }
        });
        let approverEmployee = await prisma.employee.findFirst({
            where: isApprovedByUuid ? { OR: [{ id: approvedBy }, { mongoId: approvedBy }] } : { mongoId: approvedBy }
        });
        if (!approverEmployee && approverUser) {
            if (approverUser.employeeId) {
                approverEmployee = await prisma.employee.findFirst({ where: { employeeId: approverUser.employeeId } });
            } else if (approverUser.email) {
                approverEmployee = await prisma.employee.findFirst({ where: { email: approverUser.email } });
            }
        }
        
        let isFinalAuthority = approverUser?.role === 'admin' || approverUser?.role === 'super_admin';
        
        const appData = application.modelData || {};
        const approvalChain = appData.approvalChain || [];
        
        if (approvalChain.length > 0) {
            const stageIndex = approvalChain.findIndex(
                stage => stage.approverId?.toString() === approverEmployee?.id?.toString() || stage.approverId?.toString() === approverEmployee?.mongoId?.toString()
            );

            if (stageIndex !== -1) {
                approvalChain[stageIndex].status = status;
                approvalChain[stageIndex].updatedAt = new Date();
                approvalChain[stageIndex].remarks = rejectionReason || 'Action taken';
                
                const finalApproverId = appData.finalApproverId;
                if (finalApproverId && (finalApproverId.toString() === approverEmployee?.id?.toString() || finalApproverId.toString() === approverEmployee?.mongoId?.toString())) {
                    isFinalAuthority = true;
                }
            }
        } else {
            isFinalAuthority = true;
        }

        const updateData = {};
        if (approvalChain.length > 0) {
            appData.approvalChain = approvalChain;
            updateData.modelData = appData;
        }
        
        if (isFinalAuthority) {
            updateData.status = status;
            appData.status = status;
            appData.approvedBy = approvedBy;
            appData.approvedAt = new Date();
            if (status === 'Rejected') {
                appData.rejectionReason = rejectionReason;
            }
            updateData.modelData = appData;
        }

        const updatedApplication = await prisma.leaveApplication.update({
            where: { id: application.id },
            data: updateData
        });

        if (updatedApplication.status === "Approved" && isFinalAuthority) {
            try {
                await syncLeaveApplicationToPayroll(updatedApplication.id);
            } catch (syncErr) {
                console.error("CRITICAL: Failed to sync approved leave to Payroll model:", syncErr);
            }
        }

        await logActivity({
            action: status.toLowerCase(),
            entity: "LeaveApplication",
            entityId: updatedApplication.id,
            description: `Leave application was ${status.toLowerCase()}`,
            performedBy: {
                userId: approvedBy,
                name: "Admin"
            },
            details: { rejectionReason },
            req: request
        });

        const { modelData: md, ...rest } = updatedApplication;
        const responseObj = {
            id: updatedApplication.id,
            _id: updatedApplication.id,
            mongoId: updatedApplication.mongoId,
            employeeId: updatedApplication.employeeId,
            organizationId: updatedApplication.organizationId,
            status: updatedApplication.status,
            createdAt: updatedApplication.createdAt,
            updatedAt: updatedApplication.updatedAt,
            ...(md || {})
        };

        return NextResponse.json(responseObj);
    } catch (error) {
        console.error("Error in PUT /api/payroll/leave-applications/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
