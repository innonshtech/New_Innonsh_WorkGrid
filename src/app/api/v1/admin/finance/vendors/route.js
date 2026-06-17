import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET() {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        const vendors = await prisma.vendor.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });

        const enriched = vendors.map(v => ({
            _id: v.id,
            id: v.id,
            mongoId: v.mongoId,
            organizationId: v.organizationId,
            status: v.status,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
            ...(v.modelData || {})
        }));
        return NextResponse.json({ vendors: enriched });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const body = await request.json();

        // Basic validation
        if (!body.name) {
            return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
        }

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;

        const modelData = { ...body };
        const vendor = await prisma.vendor.create({
            data: {
                status: body.status || 'Active',
                organizationId: org ? org.id : authUser.organizationId,
                modelData
            }
        });

        const result = {
            _id: vendor.id,
            id: vendor.id,
            mongoId: vendor.mongoId,
            organizationId: vendor.organizationId,
            status: vendor.status,
            createdAt: vendor.createdAt,
            updatedAt: vendor.updatedAt,
            ...modelData
        };

        return NextResponse.json({ vendor: result, message: "Vendor added successfully" }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const body = await request.json();

        if (!id) return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        const existing = await prisma.vendor.findFirst({
            where: { OR: [{ id }, { mongoId: id }], organizationId: orgQuery }
        });

        if (!existing) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

        const updatedModelData = {
            ...(existing.modelData || {}),
            ...body
        };

        const vendor = await prisma.vendor.update({
            where: { id: existing.id },
            data: {
                status: body.status || existing.status,
                organizationId: org ? org.id : existing.organizationId,
                modelData: updatedModelData
            }
        });

        const result = {
            _id: vendor.id,
            id: vendor.id,
            mongoId: vendor.mongoId,
            organizationId: vendor.organizationId,
            status: vendor.status,
            createdAt: vendor.createdAt,
            updatedAt: vendor.updatedAt,
            ...updatedModelData
        };

        return NextResponse.json({ vendor: result, message: "Vendor updated successfully" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        const existing = await prisma.vendor.findFirst({
            where: { OR: [{ id }, { mongoId: id }], organizationId: orgQuery }
        });

        if (!existing) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

        await prisma.vendor.delete({
            where: { id: existing.id }
        });

        return NextResponse.json({ message: "Vendor deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
