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

        const otRequest = await prisma.overtimeRequest.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!otRequest) {
            return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
        }

        const updateOtData = {
            status,
            adminNotes,
            approvedBy,
            approvedAt: new Date()
        };

        if (status === 'Approved') {
            // Sync with Attendance record
            const startOfDay = new Date(otRequest.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(otRequest.date);
            endOfDay.setHours(23, 59, 59, 999);

            let attendance = await prisma.attendance.findFirst({ where: {
                employee: otRequest.employee,
                date: { gte: startOfDay, lte: endOfDay }
            } });

            if (attendance) {
                await prisma.attendance.update({
                    where: { id: attendance.id },
                    data: { overtimeHours: (attendance.overtimeHours || 0) + otRequest.hours }
                });
            } else {
                // Create a placeholder attendance record for the OT
                await prisma.attendance.create({ data: {
                    employee: otRequest.employee,
                    date: otRequest.date,
                    status: 'Present', // Or could be 'Weekend'/'Holiday' if logic permits
                    overtimeHours: otRequest.hours,
                    notes: `Overtime approved: ${otRequest.reason}`
                } });
            }
        }

        const updatedOt = await prisma.overtimeRequest.update({
            where: { id: otRequest.id },
            data: updateOtData
        });

        return NextResponse.json({ success: true, request: updatedOt });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
