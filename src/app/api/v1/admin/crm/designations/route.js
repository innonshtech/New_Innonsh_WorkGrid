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

        if (body.names && Array.isArray(body.names)) {
            if (!body.organizationId || body.names.length === 0) {
                return NextResponse.json({ success: false, error: "Organization ID and at least one Designation name are required" }, { status: 400 });
            }

            const organization = await prisma.organization.findFirst({
                where: { OR: [{ id: body.organizationId }, { mongoId: body.organizationId }] }
            });
            if (!organization) return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });

            const existingDesignations = await prisma.designation.findMany({
                where: {
                    title: { in: body.names.map(n => n.trim()) },
                    organizationId: body.organizationId
                }
            });
            const existingTitles = existingDesignations.map(d => d.title.toLowerCase());
            
            const toCreate = body.names
                .map(n => n.trim())
                .filter(n => n && !existingTitles.includes(n.toLowerCase()))
                .map(name => ({
                    title: name,
                    organizationId: body.organizationId,
                    status: body.status || "Active"
                }));

            if (toCreate.length === 0) {
                return NextResponse.json({ success: false, error: "All provided designations already exist" }, { status: 400 });
            }

            const result = await prisma.designation.createMany({ data: toCreate });

            await logActivity({
                action: "created",
                entity: "Designation",
                entityId: organization.id,
                description: `Created ${result.count} designations in ${organization.name}`,
                req: request
            });

            return NextResponse.json(
                { success: true, message: `Successfully created ${result.count} designations` },
                { status: 201 }
            );
        }

        if (!body.organizationId || !body.name) {
            return NextResponse.json(
                { success: false, error: "Organization ID and Designation name are required" },
                { status: 400 }
            );
        }

        const organization = await prisma.organization.findFirst({
            where: { OR: [{ id: body.organizationId }, { mongoId: body.organizationId }] }
        });
        if (!organization) {
            return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
        }

        const existingDesignation = await prisma.designation.findFirst({
            where: {
                title: body.name.trim(),
                organizationId: body.organizationId
            }
        });

        if (existingDesignation) {
            return NextResponse.json(
                { success: false, error: "Designation name already exists in this organization" },
                { status: 400 }
            );
        }

        const designation = await prisma.designation.create({
            data: {
                title: body.name,
                status: body.status || "Active",
                organizationId: body.organizationId
            }
        });

        const populatedDesignation = {
            ...designation,
            name: designation.title,
            _id: designation.id,
            organizationId: { _id: organization.id, name: organization.name }
        };

        await logActivity({
            action: "created",
            entity: "Designation",
            entityId: designation.id,
            description: `Created designation: ${designation.title} in ${organization.name}`,
            req: request
        });

        return NextResponse.json(
            { success: true, message: "Designation created successfully", designation: populatedDesignation },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create Designation error:", error);
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
        const status = searchParams.get("status");

        let query = {};
        if (search) {
            query.title = { contains: search, mode: 'insensitive' };
        }
        
        const targetOrgId = (authUser.role !== "super_admin" && authUser.organizationId) ? authUser.organizationId : organizationId;
        if (targetOrgId) {
            const org = await prisma.organization.findFirst({
                where: { OR: [{ id: targetOrgId }, { mongoId: targetOrgId }] }
            });
            if (org) {
                query.organizationId = { in: [org.id, org.mongoId].filter(Boolean) };
            } else {
                query.organizationId = targetOrgId;
            }
        }
        if (status) {
            query.status = status;
        }

        const designationsRaw = await prisma.designation.findMany({
            where: query,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.designation.count({ where: query });

        // Manually fetch organizations
        const orgIds = [...new Set(designationsRaw.map(d => d.organizationId).filter(Boolean))];
        const orgs = await prisma.organization.findMany({
            where: { OR: [{ id: { in: orgIds } }, { mongoId: { in: orgIds } }] },
            select: { id: true, mongoId: true, name: true }
        });
        const orgMap = new Map();
        orgs.forEach(o => {
            orgMap.set(o.id, o);
            if (o.mongoId) orgMap.set(o.mongoId, o);
        });

        const designations = designationsRaw.map(d => {
            const org = d.organizationId ? orgMap.get(d.organizationId) : null;
            return {
                ...d,
                name: d.title,
                _id: d.id,
                organizationId: org ? { _id: org.id, name: org.name } : null
            };
        });

        return NextResponse.json({
            success: true,
            data: designations,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get Designations error:", error);
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
            return NextResponse.json({ success: false, error: "Designation ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const existingDesignation = await prisma.designation.findFirst({
            where: { OR: [{ id: id }, { mongoId: id }] }
        });
        if (!existingDesignation) {
            return NextResponse.json({ success: false, error: "Designation not found" }, { status: 404 });
        }

        if (body.name) {
            const duplicateDesignation = await prisma.designation.findFirst({
                where: {
                    title: body.name.trim(),
                    organizationId: body.organizationId || existingDesignation.organizationId,
                    NOT: { OR: [{ id: id }, { mongoId: id }] }
                }
            });
            if (duplicateDesignation) {
                return NextResponse.json(
                    { success: false, error: "Designation name already exists in this organization" },
                    { status: 400 }
                );
            }
        }
        
        const updateData = {};
        if (body.name) updateData.title = body.name;
        if (body.status) updateData.status = body.status;
        if (body.organizationId) updateData.organizationId = body.organizationId;

        const designationId = existingDesignation.id;
        const updatedDesignation = await prisma.designation.update({ 
            where: { id: designationId },
            data: updateData
        });

        const org = await prisma.organization.findFirst({
            where: { OR: [{ id: updatedDesignation.organizationId }, { mongoId: updatedDesignation.organizationId }] }
        });

        const populatedDesignation = {
            ...updatedDesignation,
            name: updatedDesignation.title,
            _id: updatedDesignation.id,
            organizationId: org ? { _id: org.id, name: org.name } : null
        };

        await logActivity({
            action: "updated",
            entity: "Designation",
            entityId: id,
            description: `Updated designation: ${updatedDesignation.title}`,
            req: request
        });

        return NextResponse.json({ success: true, message: "Designation updated successfully", designation: populatedDesignation });
    } catch (error) {
        console.error("Update Designation error:", error);
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
            return NextResponse.json({ success: false, error: "Designation ID is required" }, { status: 400 });
        }

        const designation = await prisma.designation.findFirst({
            where: { OR: [{ id: id }, { mongoId: id }] }
        });
        if (!designation) {
            return NextResponse.json({ success: false, error: "Designation not found" }, { status: 404 });
        }

        await prisma.designation.delete({ where: { id: designation.id } });
        
        await logActivity({
            action: "deleted",
            entity: "Designation",
            entityId: id,
            description: `Deleted designation: ${designation.title}`,
            req: request
        });

        return NextResponse.json({ success: true, message: "Designation deleted successfully" });
    } catch (error) {
        console.error("Delete Designation error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}