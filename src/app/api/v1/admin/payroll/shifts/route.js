import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import { flattenModelData, flattenModelDataArray, buildOrgFilter } from "@/lib/utils/flatten-model";

export async function GET(req) {
    try {
        const authUser = await getAuthUser();
        
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get("organizationId");
        const status = searchParams.get("status") || "Active";

        const filter = { status };
        
        // SaaS PROTECTION: Restrict by organization
        if (authUser.role === "admin" || authUser.role === "supervisor" || authUser.role === "employee") {
            filter.organizationId = await buildOrgFilter(authUser.organizationId);
        } else if (authUser.role === "super_admin" && organizationId) {
            filter.organizationId = await buildOrgFilter(organizationId);
        }

        const shifts = await prisma.workingShift.findMany({ where: filter });

        // Flatten modelData into top-level fields for the UI
        const flatShifts = flattenModelDataArray(shifts);

        return NextResponse.json({ success: true, shifts: flatShifts });
    } catch (error) {
        console.error("GET Shifts Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const data = await req.json();

        // Ensure organizationId
        if (!data.organizationId) {
            data.organizationId = authUser.organizationId;
        }
        if (!data.organizationId) {
            return NextResponse.json({ success: false, error: "Organization ID is required" }, { status: 400 });
        }

        // Extract fields that go into modelData (everything except schema columns)
        const { organizationId, status, ...shiftFields } = data;

        // If setting as default, unset other defaults in same org
        if (shiftFields.isDefault) {
            const orgIds = [organizationId];
            const org = await prisma.organization.findFirst({ where: { OR: [{ id: organizationId }, { mongoId: organizationId }] } });
            if (org?.mongoId) orgIds.push(org.mongoId);
            // We can't filter on modelData.isDefault in Prisma easily, so skip this for now
        }

        const shift = await prisma.workingShift.create({
            data: {
                organizationId,
                status: status || "Active",
                modelData: shiftFields,
            }
        });

        return NextResponse.json({ success: true, shift: flattenModelData(shift) });
    } catch (error) {
        console.error("POST Shift Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const data = await req.json();
        const { _id, id: frontendId, ...updateFields } = data;
        const shiftId = _id || frontendId;

        if (!shiftId) {
            return NextResponse.json({ success: false, error: "Shift ID is required" }, { status: 400 });
        }

        const existing = await prisma.workingShift.findFirst({ where: { OR: [{ id: shiftId }, { mongoId: shiftId }] } });
        if (!existing) {
            return NextResponse.json({ success: false, error: "Shift not found" }, { status: 404 });
        }

        // SaaS PROTECTION
        if (authUser.role === "admin") {
            const orgIds = [authUser.organizationId];
            const org = await prisma.organization.findFirst({ where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] } });
            if (org?.mongoId) orgIds.push(org.mongoId);
            if (org?.id) orgIds.push(org.id);
            if (!orgIds.includes(existing.organizationId)) {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }
        }

        // Merge with existing modelData
        const { organizationId, status, employeeId, createdAt, updatedAt, mongoId, modelData: existMD, ...restUpdate } = updateFields;
        const mergedModelData = { ...(existing.modelData || {}), ...restUpdate };

        const shift = await prisma.workingShift.update({
            where: { id: existing.id },
            data: {
                ...(status ? { status } : {}),
                modelData: mergedModelData,
            }
        });

        return NextResponse.json({ success: true, shift: flattenModelData(shift) });
    } catch (error) {
        console.error("PUT Shift Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "Shift ID is required" }, { status: 400 });
        }

        const existing = await prisma.workingShift.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!existing) {
             return NextResponse.json({ success: false, error: "Shift not found" }, { status: 404 });
        }

        // SaaS PROTECTION
        if (authUser.role === "admin") {
            const orgIds = [authUser.organizationId];
            const org = await prisma.organization.findFirst({ where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] } });
            if (org?.mongoId) orgIds.push(org.mongoId);
            if (org?.id) orgIds.push(org.id);
            if (!orgIds.includes(existing.organizationId)) {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }
        }

        await prisma.workingShift.delete({ where: { id: existing.id } });
        return NextResponse.json({ success: true, message: "Shift deleted successfully" });
    } catch (error) {
        console.error("DELETE Shift Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
