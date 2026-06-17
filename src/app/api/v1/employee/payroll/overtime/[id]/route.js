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

        let otRequest = await prisma.overtimeRequest.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!otRequest) {
            return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
        }

        otRequest = await prisma.overtimeRequest.update({
            where: { id: otRequest.id },
            data: {
                status,
                modelData: {
                    ...otRequest.modelData,
                    adminNotes,
                    approvedBy,
                    approvedAt: new Date().toISOString()
                }
            }
        });

        if (status === 'Approved') {
            // Sync with Attendance record
            const targetDateStr = otRequest.modelData?.date;
            const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
            
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            let attendance = await prisma.attendance.findFirst({
                where: {
                    employeeId: otRequest.employeeId,
                    date: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            });

            if (attendance) {
                await prisma.attendance.update({
                    where: { id: attendance.id },
                    data: {
                        overtimeHours: (attendance.overtimeHours || 0) + (otRequest.modelData?.hours || 0)
                    }
                });
            } else {
                // Create a placeholder attendance record for the OT
                await prisma.attendance.create({
                    data: {
                        employeeId: otRequest.employeeId,
                        date: targetDate,
                        status: 'Present',
                        overtimeHours: otRequest.modelData?.hours || 0,
                        notes: `Overtime approved: ${otRequest.modelData?.reason}`
                    }
                });
            }
        }

        const formatted = {
            _id: otRequest.id,
            status: otRequest.status,
            ...otRequest.modelData
        };

        return NextResponse.json({ success: true, request: formatted });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
