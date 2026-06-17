import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["employee", "attendance_only", "supervisor", "admin"]);

        const body = await request.json();
        const { holidayId, employeeId: requestedEmployeeId } = body;

        if (!holidayId) {
            return NextResponse.json({ success: false, error: "Holiday ID is required" }, { status: 400 });
        }

        // Allow admins to claim on behalf of employees
        let employeeId = authUser.id;
        if ((authUser.role === "admin" || authUser.role === "supervisor") && requestedEmployeeId) {
            employeeId = requestedEmployeeId;
        }

        const employee = await prisma.employee.findFirst({ where: { OR: [{ id: employeeId }, { mongoId: employeeId }] } });
        if (!employee) {
             return NextResponse.json({ success: false, error: "Employee record not found" }, { status: 404 });
        }

        const holiday = await prisma.holiday.findFirst({ where: { OR: [{ id: holidayId }, { mongoId: holidayId }] } });
        if (!holiday || !holiday.isRestricted) {
             return NextResponse.json({ success: false, error: "Invalid or non-restricted holiday" }, { status: 400 });
        }

        const holidayListId = holiday.holidayListId;
        if (!holidayListId) {
             return NextResponse.json({ success: false, error: "Holiday not associated with a holiday list" }, { status: 400 });
        }

        const holidayList = await prisma.holidayList.findFirst({ where: { OR: [{ id: holidayListId }, { mongoId: holidayListId }] } });
        if (!holidayList) {
             return NextResponse.json({ success: false, error: "Holiday list not found" }, { status: 404 });
        }

        // Parse list count/quota
        const listData = holidayList.holidayListData && typeof holidayList.holidayListData === 'object' ? holidayList.holidayListData : {};
        const quota = holidayList.restrictedHolidayCount || listData.restrictedHolidayCount || 0;
        const year = holidayList.year || new Date(holiday.date).getFullYear();

        // Check if already claimed
        const existingClaim = await prisma.restrictedHolidayClaim.findFirst({ 
            where: {
                employeeId: employee.id,
                holidayId: holiday.id
            } 
        });

        if (existingClaim) {
            return NextResponse.json({ success: false, error: "You have already claimed this holiday" }, { status: 400 });
        }

        // Check quota usages
        const currentClaimsCount = await prisma.restrictedHolidayClaim.count({ 
            where: {
                employeeId: employee.id,
                year: year,
                status: { not: "Rejected" }
            } 
        });

        if (currentClaimsCount >= quota) {
            return NextResponse.json({ 
                success: false, 
                error: `Quota exceeded. You can only claim ${quota} optional holiday(s) this year.` 
            }, { status: 400 });
        }

        // Create Claim in-memory / schema compliant
        const claimData = {
            employee: employee.id,
            holiday: holiday.id,
            holidayList: holidayList.id,
            date: holiday.date
        };

        const newClaim = await prisma.restrictedHolidayClaim.create({ 
            data: {
                employeeId: employee.id,
                holidayId: holiday.id,
                year: year,
                status: "Approved", // Auto-approve
                claimData: claimData
            } 
        });

        // Match legacy keys on output
        const formatted = {
            ...newClaim,
            _id: newClaim.id,
            ...claimData
        };

        return NextResponse.json({
            success: true,
            claim: formatted,
            message: "Holiday successfully claimed"
        });

    } catch (error) {
        console.error("Employee Holiday claim POST error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["employee", "attendance_only", "supervisor", "admin"]);

        const { searchParams } = new URL(request.url);
        const claimId = searchParams.get("id");

        if (!claimId) {
             return NextResponse.json({ success: false, error: "Claim ID is required" }, { status: 400 });
        }

        const claim = await prisma.restrictedHolidayClaim.findFirst({ where: { OR: [{ id: claimId }, { mongoId: claimId }] } });
        if (!claim) {
             return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
        }

        // Check authorization to delete (must be owner or admin)
        const claimEmpId = claim.employeeId || (claim.claimData && typeof claim.claimData === 'object' ? claim.claimData.employee : '');
        if (authUser.role !== "admin" && authUser.role !== "supervisor" && claimEmpId !== authUser.id) {
            return NextResponse.json({ success: false, error: "Unauthorized to delete this claim" }, { status: 403 });
        }
        
        // Cannot cancel past holidays
        const cData = claim.claimData && typeof claim.claimData === 'object' ? claim.claimData : {};
        const holidayDate = cData.date ? new Date(cData.date) : new Date();
        const today = new Date();
        today.setHours(0,0,0,0);

        if (holidayDate < today && authUser.role !== "admin") {
             return NextResponse.json({ success: false, error: "Cannot un-claim past holidays" }, { status: 400 });
        }

        await prisma.restrictedHolidayClaim.delete({ where: { id: claim.id } });

        return NextResponse.json({
            success: true,
            message: "Holiday claim cancelled"
        });

    } catch (error) {
        console.error("Employee Holiday claim DELETE error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
