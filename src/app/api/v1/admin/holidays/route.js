import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get("organizationId");
        const holidayListId = searchParams.get("holidayListId");
        const year = searchParams.get("year");

        let query = { status: 'Active' };
        
        // SaaS PROTECTION: Admin/Employee restricted to their org
        if ((authUser.role === "admin" || authUser.role === "employee" || authUser.role === "supervisor") && authUser.organizationId) {
            query.organizationId = authUser.organizationId;
        } else if (organizationId) {
            query.organizationId = organizationId;
        }

        if (holidayListId) {
            query.holidayListId = holidayListId;
        }

        if (year) {
            const startOfYear = new Date(`${year}-01-01`);
            const endOfYear = new Date(`${year}-12-31`);
            query.date = { gte: startOfYear, lte: endOfYear };
        }

        const holidaysDocs = await prisma.holiday.findMany({
            where: query,
            orderBy: { date: 'asc' }
        });

        const holidays = holidaysDocs.map(h => ({
            ...h,
            _id: h.id
        }));

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

        const { _id, ...restBody } = body;

        const holiday = await prisma.holiday.create({
            data: {
                ...restBody,
                date: new Date(restBody.date)
            }
        });

        return NextResponse.json({ success: true, holiday: { ...holiday, _id: holiday.id } }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
