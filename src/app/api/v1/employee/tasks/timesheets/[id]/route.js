import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { logActivity } from '@/lib/logger';

export async function GET(request, { params }) {
    try {
        
        const { id } = await params;
        const timesheet = await prisma.timesheet.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } })
            ;

        if (!timesheet) return NextResponse.json({ success: false, error: 'Timesheet not found' }, { status: 404 });

        return NextResponse.json({ success: true, timesheet });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        
        const { id } = await params;
        const body = await request.json();
        const { status, adminNotes, approvedBy } = body;

        const timesheet = await prisma.timesheet.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!timesheet) return NextResponse.json({ success: false, error: 'Timesheet not found' }, { status: 404 });

        let updateData = {};
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
        if (status === 'Approved') {
            updateData.approvedBy = approvedBy;
            updateData.approvedAt = new Date();
        }

        const updatedTimesheet = await prisma.timesheet.update({
            where: { id: timesheet.id },
            data: updateData
        });

        await logActivity({
            action: status.toLowerCase(),
            entity: "Timesheet",
            entityId: updatedTimesheet.id,
            description: `${status} timesheet for week starting ${updatedTimesheet.weekStartDate}`,
            req: request
        });

        return NextResponse.json({ success: true, timesheet: updatedTimesheet });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
