import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get("organizationId");
        const year = searchParams.get("year");

        let filter = { status: 'Active' };
        
        // SaaS PROTECTION: Admin/Employee restricted to their org
        if ((authUser.role === "admin" || authUser.role === "employee" || authUser.role === "supervisor") && authUser.organizationId) {
            filter.organizationId = authUser.organizationId;
        } else if (organizationId) {
            filter.organizationId = organizationId;
        }

        const dateFilter = {};
        if (year) {
            const startOfYear = new Date(`${year}-01-01`);
            const endOfYear = new Date(`${year}-12-31`);
            dateFilter.gte = startOfYear;
            dateFilter.lte = endOfYear;
        }

        const rawHolidays = await prisma.holiday.findMany({
            where: filter.organizationId ? {
                organizationId: filter.organizationId,
                status: 'Active'
            } : { status: 'Active' },
            orderBy: { createdAt: 'asc' } // Sorting after filtering
        });

        // Filter and remap from modelData
        let holidays = rawHolidays.map(h => ({
            _id: h.id,
            status: h.status,
            ...h.modelData,
            organizationId: h.organizationId
        }));

        if (year) {
            const startOfYear = new Date(`${year}-01-01`);
            const endOfYear = new Date(`${year}-12-31`);
            holidays = holidays.filter(h => {
                if (!h.date) return false;
                const d = new Date(h.date);
                return d >= startOfYear && d <= endOfYear;
            });
        }

        holidays.sort((a, b) => new Date(a.date) - new Date(b.date));

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

        const { organizationId, status, ...restData } = body;

        const holidayRecord = await prisma.holiday.create({
            data: {
                organizationId,
                status: status || 'Active',
                modelData: restData
            }
        });

        const holiday = {
            _id: holidayRecord.id,
            status: holidayRecord.status,
            ...holidayRecord.modelData,
            organizationId: holidayRecord.organizationId
        };

        return NextResponse.json({ success: true, holiday }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
