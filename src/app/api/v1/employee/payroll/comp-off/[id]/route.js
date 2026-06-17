import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, adminNotes, approvedBy } = body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
        }

        let coRequest = await prisma.compOffRequest.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!coRequest) {
            return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
        }

        if (coRequest.status !== 'Pending') {
            return NextResponse.json({ success: false, error: "Request already processed" }, { status: 400 });
        }

        if (status === 'Approved') {
            const employee = await prisma.employee.findFirst({
                where: { OR: [{ id: coRequest.employeeId }, { mongoId: coRequest.employeeId }] }
            });
            if (!employee) throw new Error("Employee not found");

            const currentBalance = employee.modelData?.compOffBalance || 0;
            const days = coRequest.modelData?.days || 0;
            let newBalance = currentBalance;

            if (coRequest.modelData?.type === 'Earn') {
                newBalance = currentBalance + days;
            } else if (coRequest.modelData?.type === 'Use') {
                if (currentBalance < days) {
                    return NextResponse.json({ success: false, error: "Insufficient balance at time of approval" }, { status: 400 });
                }
                newBalance = currentBalance - days;
            }

            await prisma.employee.update({
                where: { id: employee.id },
                data: {
                    modelData: {
                        ...employee.modelData,
                        compOffBalance: newBalance
                    }
                }
            });
        }

        coRequest = await prisma.compOffRequest.update({
            where: { id: coRequest.id },
            data: {
                status,
                modelData: {
                    ...coRequest.modelData,
                    adminNotes,
                    approvedBy,
                    approvedAt: new Date().toISOString()
                }
            }
        });

        const formatted = {
            _id: coRequest.id,
            status: coRequest.status,
            ...coRequest.modelData
        };

        return NextResponse.json({ success: true, request: formatted });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
