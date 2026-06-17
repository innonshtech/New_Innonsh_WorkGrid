import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { logActivity } from "@/lib/logger";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const body = await request.json();

        if (authUser.role === "admin") {
            body.organizationId = authUser.organizationId;
        }

        if (!body.organizationId || !body.name) {
            return NextResponse.json(
                { success: false, error: "Organization ID and Business Unit name are required" },
                { status: 400 }
            );
        }

        const organization = await prisma.organization.findFirst({
            where: {
                OR: [{ id: body.organizationId }, { mongoId: body.organizationId }]
            }
        });
        if (!organization) {
            return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
        }

        const existingBU = await prisma.businessUnit.findFirst({
            where: {
                unitName: body.name.trim(),
                organizationId: body.organizationId
            }
        });

        if (existingBU) {
            return NextResponse.json(
                { success: false, error: "Business Unit name already exists in this organization" },
                { status: 400 }
            );
        }

        const businessUnit = await prisma.businessUnit.create({ 
            data: {
                unitName: body.name.trim(),
                organizationId: body.organizationId,
                status: body.status || "Active"
            } 
        });

        const populatedBU = {
            ...businessUnit,
            name: businessUnit.unitName,
            _id: businessUnit.id,
            organizationId: { _id: organization.id, name: organization.name }
        };

        await logActivity({
            action: "created",
            entity: "BusinessUnit",
            entityId: businessUnit.id,
            description: `Created business unit: ${businessUnit.unitName} in ${organization.name}`,
            req: request
        });

        return NextResponse.json(
            { success: true, message: "Business Unit created successfully", businessUnit: populatedBU },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create Business Unit error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("limit")) || 10;
        const search = searchParams.get("search") || "";
        const organizationId = searchParams.get("organizationId");

        let where = {};
        if (search) {
            where.unitName = { contains: search, mode: "insensitive" };
        }
        
        const targetOrgId = (authUser.role !== "super_admin" && authUser.organizationId) ? authUser.organizationId : organizationId;
        if (targetOrgId) {
            const org = await prisma.organization.findFirst({
                where: { OR: [{ id: targetOrgId }, { mongoId: targetOrgId }] }
            });
            if (org) {
                where.organizationId = { in: [org.id, org.mongoId].filter(Boolean) };
            } else {
                where.organizationId = targetOrgId;
            }
        }

        const businessUnitsRaw = await prisma.businessUnit.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.businessUnit.count({ where });

        // Manually fetch organizations
        const orgIds = [...new Set(businessUnitsRaw.map(bu => bu.organizationId).filter(Boolean))];
        const orgs = await prisma.organization.findMany({
            where: { OR: [{ id: { in: orgIds } }, { mongoId: { in: orgIds } }] },
            select: { id: true, mongoId: true, name: true }
        });
        const orgMap = new Map();
        orgs.forEach(o => {
            orgMap.set(o.id, o);
            if (o.mongoId) orgMap.set(o.mongoId, o);
        });

        const businessUnits = businessUnitsRaw.map(bu => {
            const org = bu.organizationId ? orgMap.get(bu.organizationId) : null;
            return {
                ...bu,
                name: bu.unitName,
                _id: bu.id,
                organizationId: org ? { _id: org.id, name: org.name } : null
            };
        });

        return NextResponse.json({
            success: true,
            data: businessUnits,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get Business Units error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "Business Unit ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const existingBU = await prisma.businessUnit.findFirst({
            where: {
                OR: [{ id: id }, { mongoId: id }]
            }
        });
        if (!existingBU) {
            return NextResponse.json({ success: false, error: "Business Unit not found" }, { status: 404 });
        }

        if (body.name) {
            const duplicateBU = await prisma.businessUnit.findFirst({
                where: {
                    unitName: body.name.trim(),
                    organizationId: body.organizationId || existingBU.organizationId,
                    NOT: { OR: [{ id: id }, { mongoId: id }] }
                }
            });
            if (duplicateBU) {
                return NextResponse.json(
                    { success: false, error: "Business Unit name already exists in this organization" },
                    { status: 400 }
                );
            }
        }

        const updateData = {};
        if (body.name) updateData.unitName = body.name;
        if (body.status) updateData.status = body.status;
        if (body.organizationId) updateData.organizationId = body.organizationId;

        const buId = existingBU.id;
        const updatedBU = await prisma.businessUnit.update({ 
            where: { id: buId },
            data: updateData
        });

        const org = await prisma.organization.findFirst({
            where: { OR: [{ id: updatedBU.organizationId }, { mongoId: updatedBU.organizationId }] }
        });

        const populatedBU = {
            ...updatedBU,
            name: updatedBU.unitName,
            _id: updatedBU.id,
            organizationId: org ? { _id: org.id, name: org.name } : null
        };

        await logActivity({
            action: "updated",
            entity: "BusinessUnit",
            entityId: id,
            description: `Updated business unit: ${updatedBU.unitName}`,
            req: request
        });

        return NextResponse.json({ success: true, message: "Business Unit updated successfully", businessUnit: populatedBU });
    } catch (error) {
        console.error("Update Business Unit error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "Business Unit ID is required" }, { status: 400 });
        }

        const bu = await prisma.businessUnit.findFirst({
            where: {
                OR: [{ id: id }, { mongoId: id }]
            }
        });
        if (!bu) {
            return NextResponse.json({ success: false, error: "Business Unit not found" }, { status: 404 });
        }

        await prisma.businessUnit.delete({ where: { id: bu.id } });
        await logActivity({
            action: "deleted",
            entity: "BusinessUnit",
            entityId: id,
            description: `Deleted business unit: ${bu.unitName}`,
            req: request
        });

        return NextResponse.json({ success: true, message: "Business Unit deleted successfully" });
    } catch (error) {
        console.error("Delete Business Unit error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}