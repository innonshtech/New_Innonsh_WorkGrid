import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, adminNotes, approvedBy } = body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        const coRequest = await prisma.compOffRequest.findFirst({
            where: isUuid ? { OR: [{ id: id }, { mongoId: id }] } : { mongoId: id }
        });

        if (!coRequest) {
            return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
        }

        if (coRequest.status !== 'Pending') {
            return NextResponse.json({ success: false, error: "Request already processed" }, { status: 400 });
        }

        const existingData = coRequest.modelData && typeof coRequest.modelData === 'object' ? coRequest.modelData : {};
        const requestType = existingData.type;
        const requestDays = parseFloat(existingData.days || 0);

        if (status === 'Approved') {
            if (!coRequest.employeeId) {
                throw new Error("No employee assigned to this request");
            }

            const employee = await prisma.employee.findUnique({
                where: { id: coRequest.employeeId }
            });
            if (!employee) throw new Error("Employee not found");

            let newBalance = employee.compOffBalance || 0;
            if (requestType === 'Earn') {
                newBalance += requestDays;
            } else if (requestType === 'Use') {
                if (newBalance < requestDays) {
                    return NextResponse.json({ success: false, error: "Insufficient balance at time of approval" }, { status: 400 });
                }
                newBalance -= requestDays;
            }

            await prisma.employee.update({
                where: { id: employee.id },
                data: { compOffBalance: newBalance }
            });
        }

        const updatedModelData = {
            ...existingData,
            adminNotes,
            approvedBy,
            approvedAt: new Date().toISOString()
        };

        const updatedRequest = await prisma.compOffRequest.update({
            where: { id: coRequest.id },
            data: {
                status,
                modelData: updatedModelData
            }
        });

        return NextResponse.json({
            success: true,
            request: {
                _id: updatedRequest.id,
                id: updatedRequest.id,
                employeeId: updatedRequest.employeeId,
                status: updatedRequest.status,
                createdAt: updatedRequest.createdAt,
                updatedAt: updatedRequest.updatedAt,
                ...updatedModelData
            }
        });
    } catch (error) {
        console.error("❌ PUT Comp-Off [id] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
