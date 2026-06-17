import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        let holidayRecord = await prisma.holiday.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!holidayRecord) {
            return NextResponse.json({ success: false, error: "Holiday not found" }, { status: 404 });
        }

        holidayRecord = await prisma.holiday.update({
            where: { id: holidayRecord.id },
            data: {
                name: body.name || holidayRecord.name,
                date: body.date ? new Date(body.date) : holidayRecord.date,
                isRestricted: body.isRestricted !== undefined ? body.isRestricted : holidayRecord.isRestricted,
                status: body.status || holidayRecord.status,
                holidayData: {
                    ...holidayRecord.holidayData,
                    ...body
                }
            }
        });

        const holiday = {
            _id: holidayRecord.id,
            name: holidayRecord.name,
            date: holidayRecord.date,
            isRestricted: holidayRecord.isRestricted,
            status: holidayRecord.status,
            ...holidayRecord.holidayData
        };

        return NextResponse.json({ success: true, holiday });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const holidayRecord = await prisma.holiday.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!holidayRecord) {
            return NextResponse.json({ success: false, error: "Holiday not found" }, { status: 404 });
        }

        await prisma.holiday.delete({
            where: { id: holidayRecord.id }
        });

        return NextResponse.json({ success: true, message: "Holiday deleted successfully" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
