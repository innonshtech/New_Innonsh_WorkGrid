import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from "@/lib/auth-util";

export async function PUT(request, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const { id } = await params;
        const body = await request.json();

        const holiday = await prisma.holiday.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!holiday) {
            return NextResponse.json({ success: false, error: "Holiday not found" }, { status: 404 });
        }

        // SaaS PROTECTION
        if (authUser.role === "admin" && holiday.organizationId?.toString() !== authUser.organizationId?.toString()) {
            return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
        }

        const updatedHoliday = await prisma.holiday.update({ where: { id: (await prisma.holiday.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id }, data: body });
        return NextResponse.json({ success: true, holiday: updatedHoliday });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const { id } = await params;

        const holiday = await prisma.holiday.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!holiday) {
            return NextResponse.json({ success: false, error: "Holiday not found" }, { status: 404 });
        }

        // SaaS PROTECTION
        if (authUser.role === "admin" && holiday.organizationId?.toString() !== authUser.organizationId?.toString()) {
            return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
        }

        await prisma.holiday.delete({ where: { id: (await prisma.holiday.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id } });
        return NextResponse.json({ success: true, message: "Holiday deleted successfully" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
