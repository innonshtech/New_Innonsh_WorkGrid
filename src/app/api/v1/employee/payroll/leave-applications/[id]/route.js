import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/logger";

// GET single leave application
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const application = await prisma.leaveApplication.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const employeeId = application.employeeId;
        const employee = await prisma.employee.findFirst({
            where: { OR: [{ id: employeeId }, { mongoId: employeeId }] }
        });

        let approvedBy = null;
        if (application.modelData?.approvedBy) {
            approvedBy = await prisma.user.findFirst({
                where: { OR: [{ id: application.modelData.approvedBy }, { mongoId: application.modelData.approvedBy }] },
                select: { name: true, email: true }
            });
        }

        const formatted = {
            _id: application.id,
            status: application.status,
            ...application.modelData,
            employee: employee ? { ...employee, _id: employee.id } : null,
            approvedBy: approvedBy || null,
        };

        return NextResponse.json(formatted);
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

        let application = await prisma.leaveApplication.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        application = await prisma.leaveApplication.update({
            where: { id: application.id },
            data: {
                status,
                modelData: {
                    ...application.modelData,
                    rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
                    approvedBy,
                    approvedAt: new Date().toISOString()
                }
            }
        });

        const employee = await prisma.employee.findFirst({
            where: { OR: [{ id: application.employeeId }, { mongoId: application.employeeId }] }
        });

        // Log activity
        await logActivity({
            action: status.toLowerCase(),
            entity: "LeaveApplication",
            entityId: application.id,
            description: `Leave application for ${employee?.modelData?.personalDetails?.firstName} was ${status.toLowerCase()}`,
            performedBy: {
                userId: approvedBy,
                name: "Admin" // You can pass actual name in body if needed
            },
            details: { rejectionReason },
            req: request
        });

        const formatted = {
            _id: application.id,
            status: application.status,
            ...application.modelData,
            employee: employee ? { ...employee, _id: employee.id } : null,
        };

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error in PUT /api/payroll/leave-applications/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
