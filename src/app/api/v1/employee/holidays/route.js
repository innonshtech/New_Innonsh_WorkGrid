import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        // Allow employee roles, and supervisor
        authorize(authUser, ["employee", "attendance_only", "supervisor", "admin"]);
        
        const { searchParams } = new URL(request.url);
        const year = searchParams.get("year") || new Date().getFullYear();
        let employeeId = authUser.id; // Usually token ID holds employee ID
        
        // Admins can view holidays for a specific employee if passed
        if ((authUser.role === "admin" || authUser.role === "supervisor") && searchParams.get("employeeId")) {
            employeeId = searchParams.get("employeeId");
        }

        const employee = await prisma.employee.findFirst({
            where: {
                OR: [{ id: employeeId }, { mongoId: employeeId }]
            }
        });

        if (!employee) {
            return NextResponse.json({ success: false, error: "Employee record not found" }, { status: 404 });
        }

        const empOrgId = employee.organizationId;
        const empOfficeId = employee.assignedOfficeId; // Ensure mapping is correct
        let empHolidayListId = employee.holidayListId;

        // AUTO-RESOLVE: Find holiday list from employee's branch/office location
        if (!empHolidayListId && empOfficeId) {
            const activeLists = await prisma.holidayList.findMany({
                where: {
                    year: Number(year),
                    status: 'Active'
                }
            });
            const listForOffice = activeLists.find(list => {
                const locs = list.applicableLocations;
                if (Array.isArray(locs)) {
                    return locs.includes(empOfficeId);
                }
                if (typeof locs === 'string') {
                    return locs === empOfficeId;
                }
                return false;
            });
            if (listForOffice) empHolidayListId = listForOffice.id;
        }

        // FALLBACK: Default list for org
        if (!empHolidayListId && empOrgId) {
            const defaultList = await prisma.holidayList.findFirst({
                where: {
                    organizationId: empOrgId,
                    year: Number(year),
                    isDefault: true,
                    status: 'Active'
                }
            });
            if (defaultList) empHolidayListId = defaultList.id;
        }

        // If no list resolved, they have no specific list set
        if (!empHolidayListId) {
             return NextResponse.json({ 
                 success: true, 
                 holidayList: null, 
                 mandatoryHolidays: [], 
                 restrictedHolidays: [],
                 claims: [] 
             });
        }

        const holidayList = await prisma.holidayList.findUnique({
            where: { id: empHolidayListId }
        });

        // Fetch all holidays for this list
        const holidays = await prisma.holiday.findMany({
            where: {
                holidayListId: empHolidayListId,
                status: "Active"
            },
            orderBy: { date: 'asc' }
        });

        // Separate them
        const mandatoryHolidays = holidays.filter(h => !h.isRestricted);
        const restrictedHolidays = holidays.filter(h => h.isRestricted);

        // Fetch existing claims for the employee for this year
        const claims = await prisma.restrictedHolidayClaim.findMany({
            where: {
                employeeId: employee.id,
                year: Number(year)
            }
        });

        return NextResponse.json({
            success: true,
            holidayList,
            mandatoryHolidays,
            restrictedHolidays,
            claims,
            quota: holidayList?.holidayListData?.restrictedHolidayCount || 0
        });

    } catch (error) {
        console.error("Employee Holidays fetch error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
