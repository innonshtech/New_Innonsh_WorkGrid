import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';


export async function PUT(request, { params }) {
    try {
        
        const { id } = params;
        const body = await request.json();

        const holiday = await prisma.holiday.update({ where: { id: (await prisma.holiday.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id }, data: body });
        if (!holiday) {
            return NextResponse.json({ success: false, error: "Holiday not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, holiday });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        
        const { id } = params;

        const holiday = await prisma.holiday.delete({ where: { id: (await prisma.holiday.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id } });
        if (!holiday) {
            return NextResponse.json({ success: false, error: "Holiday not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Holiday deleted successfully" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
