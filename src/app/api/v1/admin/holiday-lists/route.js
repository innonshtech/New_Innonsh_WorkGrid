import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get("organizationId");
        const year = searchParams.get("year");

        let query = { status: 'Active' };
        
        if (authUser.role === "admin" || authUser.role === "employee" || authUser.role === "supervisor") {
            query.organizationId = authUser.organizationId;
        } else if (organizationId) {
            query.organizationId = organizationId;
        }

        if (year) {
            query.year = Number(year);
        }

        const holidayListsData = await prisma.holidayList.findMany({
            where: query,
            orderBy: [
                { isDefault: 'desc' },
                { name: 'asc' }
            ]
        });

        const holidayLists = await Promise.all(holidayListsData.map(async (list) => {
            const listId = list.id;
            const mongoId = list.mongoId;
            const orQuery = [{ holidayListId: listId }];
            if (mongoId) orQuery.push({ holidayListId: mongoId });

            const totalCount = await prisma.holiday.count({
                where: { OR: orQuery, status: 'Active' }
            });
            const restrictedCount = await prisma.holiday.count({
                where: { OR: orQuery, status: 'Active', isRestricted: true }
            });

            return {
                _id: list.id,
                ...list,
                holidayCount: totalCount,
                restrictedCount: restrictedCount,
                applicableLocations: list.applicableLocations || []
            };
        }));

        return NextResponse.json({ success: true, holidayLists });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const body = await request.json();
        
        if (authUser.role === "admin") {
            body.organizationId = authUser.organizationId;
        }

        if (body.isDefault) {
            // Unset other defaults for the same year and organization
            await prisma.holidayList.updateMany({
                where: { organizationId: body.organizationId, year: body.year, isDefault: true },
                data: { isDefault: false }
            });
        }

        const { _id, applicableLocations, ...restBody } = body;
        const holidayList = await prisma.holidayList.create({
            data: {
                ...restBody,
                applicableLocations: applicableLocations || []
            }
        });

        return NextResponse.json({ success: true, holidayList: { ...holidayList, _id: holidayList.id } }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
