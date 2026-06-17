import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get("organizationId");
        const year = searchParams.get("year");

        let query = { status: 'Active' };
        
        // SaaS PROTECTION: Admin/Employee restricted to their org
        if ((authUser.role === "admin" || authUser.role === "employee" || authUser.role === "supervisor") && authUser.organizationId) {
            query.organizationId = authUser.organizationId;
        } else if (organizationId) {
            query.organizationId = organizationId;
        }

        if (year) {
            const startOfYear = new Date(`${year}-01-01`);
            const endOfYear = new Date(`${year}-12-31`);
            query.date = { gte: startOfYear, lte: endOfYear };
        }

        const holidays = await prisma.holiday.findMany({ where: query });

        return NextResponse.json({ success: true, holidays });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        
        const body = await request.json();
        
        // SaaS PROTECTION: Admin must use their assigned organizationId
        if (authUser.role === "admin") {
            body.organizationId = authUser.organizationId;
        }

        // In a real app, we'd verify admin role here
        const holiday = await prisma.holiday.create({ data: body });

        return NextResponse.json({ success: true, holiday }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
