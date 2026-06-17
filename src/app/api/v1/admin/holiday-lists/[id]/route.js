import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request, { params }) {
    try {
        const authUser = await getAuthUser();
        
        
        const { id } = await params;
        const query = { OR: [{ id: id }, { mongoId: id }] };
        
        if (authUser.role === "admin" || authUser.role === "employee" || authUser.role === "supervisor") {
            query.organizationId = authUser.organizationId;
        }

        const holidayList = await prisma.holidayList.findFirst({ where: query });
        if (!holidayList) return NextResponse.json({ success: false, error: "Holiday List not found" }, { status: 404 });

        return NextResponse.json({ success: true, holidayList });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        
        const { id } = await params;
        const body = await request.json();
        
        const query = { OR: [{ id: id }, { mongoId: id }] };
        if (authUser.role === "admin") {
            query.organizationId = authUser.organizationId;
        }
        
        const existingList = await prisma.holidayList.findFirst({ where: query });
        if (!existingList) return NextResponse.json({ success: false, error: "Holiday List not found or unauthorized" }, { status: 404 });

        if (body.isDefault) {
            // Unset other defaults for the same year and organization
            await prisma.holidayList.updateMany({
                where: { 
                    organizationId: existingList.organizationId, 
                    year: existingList.year, 
                    isDefault: true, 
                    id: { not: existingList.id } 
                },
                data: { isDefault: false }
            });
        }

        const holidayList = await prisma.holidayList.update({
            where: { id: existingList.id },
            data: { ...body, updatedBy: authUser.id }
        });

        return NextResponse.json({ success: true, holidayList });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        
        const { id } = await params;
        
        const query = { OR: [{ id: id }, { mongoId: id }] };
        if (authUser.role === "admin") {
            query.organizationId = authUser.organizationId;
        }

        const existingList = await prisma.holidayList.findFirst({ where: query });
        if (!existingList) return NextResponse.json({ success: false, error: "Holiday List not found or unauthorized" }, { status: 404 });

        await prisma.holidayList.delete({ where: { id: existingList.id } });

        // Optionally delete all associated holidays? 
        // Keka usually keeps them but marks them inactive or prompts. 
        // For simplicity, we'll keep them but they lose their reference list.

        return NextResponse.json({ success: true, message: "Holiday List deleted" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
