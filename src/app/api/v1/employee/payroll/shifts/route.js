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
        
        if (authUser.role === "admin" || authUser.role === "supervisor" || authUser.role === "employee") {
            filter.organizationId = await buildOrgFilter(authUser.organizationId);
        } else if (authUser.role === "super_admin" && organizationId) {
            filter.organizationId = await buildOrgFilter(organizationId);
        }

        const shifts = await prisma.workingShift.findMany({ where: filter });
        return NextResponse.json({ success: true, shifts: flattenModelDataArray(shifts) });
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

        if (!data.organizationId) data.organizationId = authUser.organizationId;
        if (!data.organizationId) {
            return NextResponse.json({ success: false, error: "Organization ID is required" }, { status: 400 });
        }

        const { organizationId, status, ...shiftFields } = data;
        const shift = await prisma.workingShift.create({
            data: { organizationId, status: status || "Active", modelData: shiftFields }
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
        const { _id, id: fId, ...updateFields } = data;
        const shiftId = _id || fId;

        if (!shiftId) return NextResponse.json({ success: false, error: "Shift ID is required" }, { status: 400 });

        const existing = await prisma.workingShift.findFirst({ where: { OR: [{ id: shiftId }, { mongoId: shiftId }] } });
        if (!existing) return NextResponse.json({ success: false, error: "Shift not found" }, { status: 404 });

        const { organizationId, status, employeeId, createdAt, updatedAt, mongoId, modelData: _md, ...restUpdate } = updateFields;
        const mergedModelData = { ...(existing.modelData || {}), ...restUpdate };

        const shift = await prisma.workingShift.update({
            where: { id: existing.id },
            data: { ...(status ? { status } : {}), modelData: mergedModelData }
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

        if (!id) return NextResponse.json({ success: false, error: "Shift ID is required" }, { status: 400 });

        const existing = await prisma.workingShift.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!existing) return NextResponse.json({ success: false, error: "Shift not found" }, { status: 404 });

        await prisma.workingShift.delete({ where: { id: existing.id } });
        return NextResponse.json({ success: true, message: "Shift deleted successfully" });
    } catch (error) {
        console.error("DELETE Shift Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
