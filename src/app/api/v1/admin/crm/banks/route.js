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
                return NextResponse.json({ success: false, error: "Organization ID and at least one Bank name are required" }, { status: 400 });
            }

            const organization = await prisma.organization.findFirst({
                where: { OR: [{ id: body.organizationId }, { mongoId: body.organizationId }] }
            });
            if (!organization) return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });

            const existingBanks = await prisma.bank.findMany({
                where: { organizationId: body.organizationId }
            });
            const existingNames = existingBanks.map(b => b.modelData?.name?.toLowerCase()).filter(Boolean);
            
            const toCreate = body.names
                .map(n => n.trim())
                .filter(n => n && !existingNames.includes(n.toLowerCase()))
                .map(name => ({
                    modelData: { name },
                    organizationId: body.organizationId,
                    status: body.status || "Active"
                }));

            if (toCreate.length === 0) {
                return NextResponse.json({ success: false, error: "All provided banks already exist" }, { status: 400 });
            }

            const result = await prisma.bank.createMany({ data: toCreate });

            await logActivity({
                action: "created",
                entity: "Bank",
                entityId: organization.id,
                description: `Created ${result.count} banks in ${organization.name}`,
                req: request
            });

            return NextResponse.json(
                { success: true, message: `Successfully created ${result.count} banks` },
                { status: 201 }
            );
        }

        if (!body.organizationId || !body.name) {
            return NextResponse.json(
                { success: false, error: "Organization ID and Bank name are required" },
                { status: 400 }
            );
        }

        const organization = await prisma.organization.findFirst({
            where: { OR: [{ id: body.organizationId }, { mongoId: body.organizationId }] }
        });
        if (!organization) {
            return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
        }

        const existingBanks = await prisma.bank.findMany({
            where: { organizationId: body.organizationId }
        });
        
        const isDuplicate = existingBanks.some(b => b.modelData?.name?.toLowerCase() === body.name.trim().toLowerCase());
        if (isDuplicate) {
            return NextResponse.json(
                { success: false, error: "Bank name already exists in this organization" },
                { status: 400 }
            );
        }

        const bank = await prisma.bank.create({
            data: {
                modelData: { name: body.name.trim() },
                status: body.status || "Active",
                organizationId: body.organizationId
            }
        });

        const populatedBank = {
            ...bank,
            name: body.name.trim(),
            _id: bank.id,
            organizationId: { _id: organization.id, name: organization.name }
        };

        await logActivity({
            action: "created",
            entity: "Bank",
            entityId: bank.id,
            description: `Created bank: ${body.name} in ${organization.name}`,
            req: request
        });

        return NextResponse.json(
            { success: true, message: "Bank created successfully", bank: populatedBank },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create Bank error:", error);
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

        let banksRaw = await prisma.bank.findMany({
            where: query,
            orderBy: { createdAt: 'desc' }
        });

        if (search) {
            const searchLower = search.toLowerCase();
            banksRaw = banksRaw.filter(b => b.modelData?.name?.toLowerCase().includes(searchLower));
        }

        const total = banksRaw.length;
        const paginatedBanks = banksRaw.slice((page - 1) * limit, page * limit);

        const orgIds = [...new Set(paginatedBanks.map(b => b.organizationId).filter(Boolean))];
        const orgs = await prisma.organization.findMany({
            where: { OR: [{ id: { in: orgIds } }, { mongoId: { in: orgIds } }] },
            select: { id: true, mongoId: true, name: true }
        });
        const orgMap = new Map();
        orgs.forEach(o => {
            orgMap.set(o.id, o);
            if (o.mongoId) orgMap.set(o.mongoId, o);
        });

        const banks = paginatedBanks.map(b => {
            const org = b.organizationId ? orgMap.get(b.organizationId) : null;
            return {
                ...b,
                name: b.modelData?.name || "",
                _id: b.id,
                organizationId: org ? { _id: org.id, name: org.name } : null
            };
        });

        return NextResponse.json({
            success: true,
            data: banks,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get Banks error:", error);
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
            return NextResponse.json({ success: false, error: "Bank ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const existingBank = await prisma.bank.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!existingBank) {
            return NextResponse.json({ success: false, error: "Bank not found" }, { status: 404 });
        }

        if (body.name) {
            const allBanks = await prisma.bank.findMany({
                where: {
                    organizationId: body.organizationId || existingBank.organizationId,
                    NOT: { OR: [{ id: id }, { mongoId: id }] }
                }
            });
            const duplicateBank = allBanks.find(b => b.modelData?.name?.toLowerCase() === body.name.trim().toLowerCase());
            if (duplicateBank) {
                return NextResponse.json(
                    { success: false, error: "Bank name already exists in this organization" },
                    { status: 400 }
                );
            }
        }

        const updateData = {};
        if (body.status) updateData.status = body.status;
        if (body.organizationId) updateData.organizationId = body.organizationId;
        
        let newModelData = existingBank.modelData || {};
        if (body.name) newModelData.name = body.name.trim();
        updateData.modelData = newModelData;

        const updatedBank = await prisma.bank.update({ 
            where: { id: existingBank.id },
            data: updateData
        });

        const org = await prisma.organization.findFirst({
            where: { OR: [{ id: updatedBank.organizationId }, { mongoId: updatedBank.organizationId }] }
        });

        const populatedBank = {
            ...updatedBank,
            name: updatedBank.modelData?.name || "",
            _id: updatedBank.id,
            organizationId: org ? { _id: org.id, name: org.name } : null
        };

        await logActivity({
            action: "updated",
            entity: "Bank",
            entityId: id,
            description: `Updated bank: ${populatedBank.name}`,
            req: request
        });

        return NextResponse.json({ success: true, message: "Bank updated successfully", bank: populatedBank });
    } catch (error) {
        console.error("Update Bank error:", error);
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
            return NextResponse.json({ success: false, error: "Bank ID is required" }, { status: 400 });
        }

        const bank = await prisma.bank.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!bank) {
            return NextResponse.json({ success: false, error: "Bank not found" }, { status: 404 });
        }

        await prisma.bank.delete({ where: { id: bank.id } });
        
        await logActivity({
            action: "deleted",
            entity: "Bank",
            entityId: id,
            description: `Deleted bank: ${bank.modelData?.name || "Unknown"}`,
            req: request
        });

        return NextResponse.json({ success: true, message: "Bank deleted successfully" });
    } catch (error) {
        console.error("Delete Bank error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}