import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';


import { logActivity } from "@/lib/logger";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function POST(request) {
    try {
        
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        const body = await request.json();

        if (!body.code || !body.name) {
            return NextResponse.json(
                { error: "Cost Center Code and Name are required" },
                { status: 400 }
            );
        }

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        const allCCs = await prisma.costCenter.findMany({ where: { organizationId: orgQuery } });
        const existingCC = allCCs.find(cc => {
            const data = cc.modelData || {};
            return data.code === body.code.trim();
        });

        if (existingCC) {
            return NextResponse.json(
                { error: "Cost Center code already exists" },
                { status: 400 }
            );
        }

        const costCenter = await prisma.costCenter.create({
            data: {
                organizationId: org ? org.id : authUser.organizationId,
                modelData: body
            }
        });

        const costCenterData = costCenter.modelData || {};

        await logActivity({
            action: "created",
            entity: "CostCenter",
            entityId: costCenter.id,
            description: `Created cost center: ${costCenterData.name} (${costCenterData.code})`,
            performedBy: {
                userId: authUser.id,
                name: authUser.name || "Admin/User",
                email: authUser.email,
                role: authUser.role
            },
            req: request
        });

        return NextResponse.json(
            { message: "Cost Center created successfully", costCenter: { ...costCenter, ...costCenterData, _id: costCenter.id } },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create Cost Center error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function GET(request) {
    try {
        
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("limit")) || 100; // Increased limit for manager view
        const search = searchParams.get("search") || "";

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;
        
        // Fetch cost centers
        const allCCs = await prisma.costCenter.findMany({ where: { organizationId: orgQuery } });
        
        const filteredCCs = allCCs.filter(cc => {
            const data = cc.modelData || {};
            if (search) {
                const searchLower = search.toLowerCase();
                const nameMatch = data.name && data.name.toLowerCase().includes(searchLower);
                const codeMatch = data.code && data.code.toLowerCase().includes(searchLower);
                return nameMatch || codeMatch;
            }
            return true;
        });

        // Dynamically calculate spent amount per cost center
        const journalEntries = await prisma.journalEntry.findMany({ where: { organizationId: orgQuery } });
        const spentMap = {};
        
        for (const je of journalEntries) {
            const data = je.modelData || {};
            if (data.status === 'Posted' && Array.isArray(data.lines)) {
                for (const line of data.lines) {
                    if (line.costCenter) {
                        spentMap[line.costCenter] = (spentMap[line.costCenter] || 0) + (line.debit || 0);
                    }
                }
            }
        }

        const enrichedData = filteredCCs.map(cc => {
            const data = cc.modelData || {};
            return {
                ...cc,
                ...data,
                _id: cc.id,
                spent: spentMap[cc.id] || spentMap[cc.mongoId] || 0
            };
        });

        const total = filteredCCs.length;

        return NextResponse.json({
            data: enrichedData,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get Cost Centers error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Cost Center ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        const existingCC = await prisma.costCenter.findFirst({
            where: { OR: [{ id: id }, { mongoId: id }], organizationId: orgQuery }
        });
        if (!existingCC) {
            return NextResponse.json({ error: "Cost Center not found" }, { status: 404 });
        }
        
        const existingData = existingCC.modelData || {};

        if (body.code && body.code !== existingData.code) {
            const allCCs = await prisma.costCenter.findMany({ where: { organizationId: orgQuery } });
            const duplicateCC = allCCs.find(cc => cc.id !== existingCC.id && (cc.modelData || {}).code === body.code.trim());
            if (duplicateCC) {
                return NextResponse.json({ error: "Cost Center code already exists" }, { status: 400 });
            }
        }

        const updatedModelData = { ...existingData, ...body, updatedAt: new Date() };

        const updatedCC = await prisma.costCenter.update({
            where: { id: existingCC.id },
            data: { modelData: updatedModelData }
        });

        await logActivity({
            action: "updated",
            entity: "CostCenter",
            entityId: updatedCC.id,
            description: `Updated cost center: ${updatedModelData.name}`,
            performedBy: {
                userId: authUser.id,
                name: authUser.name || "Admin/User",
                email: authUser.email,
                role: authUser.role
            },
            req: request
        });

        return NextResponse.json({ message: "Cost Center updated successfully", costCenter: { ...updatedCC, ...updatedModelData, _id: updatedCC.id } });
    } catch (error) {
        console.error("Update Cost Center error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Cost Center ID is required" }, { status: 400 });
        }

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        const cc = await prisma.costCenter.findFirst({
            where: { OR: [{ id: id }, { mongoId: id }], organizationId: orgQuery }
        });
        if (!cc) {
            return NextResponse.json({ error: "Cost Center not found" }, { status: 404 });
        }

        await prisma.costCenter.delete({ where: { id: cc.id } });
        
        const ccData = cc.modelData || {};

        await logActivity({
            action: "deleted",
            entity: "CostCenter",
            entityId: cc.id,
            description: `Deleted cost center: ${ccData.name}`,
            req: request
        });

        return NextResponse.json({ message: "Cost Center deleted successfully" });
    } catch (error) {
        console.error("Delete Cost Center error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
