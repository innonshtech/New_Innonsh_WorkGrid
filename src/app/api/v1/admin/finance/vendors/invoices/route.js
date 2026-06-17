import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get('vendorId');
        const status = searchParams.get('status');

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        const invoices = await prisma.vendorInvoice.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });
        
        let filtered = invoices.map(inv => ({
            _id: inv.id,
            id: inv.id,
            mongoId: inv.mongoId,
            organizationId: inv.organizationId,
            status: inv.status,
            createdAt: inv.createdAt,
            updatedAt: inv.updatedAt,
            ...(inv.modelData || {})
        }));

        if (vendorId) {
            filtered = filtered.filter(i => i.vendor === vendorId || i.vendorId === vendorId);
        }
        if (status) {
            filtered = filtered.filter(i => i.status === status);
        }

        // Hydrate Vendor object details in memory for standard display
        const vendors = await prisma.vendor.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });
        const vendorMap = {};
        vendors.forEach(v => {
            const data = v.modelData || {};
            vendorMap[v.id] = { _id: v.id, name: data.name };
            if (v.mongoId) {
                vendorMap[v.mongoId] = { _id: v.id, name: data.name };
            }
        });

        filtered = filtered.map(i => ({
            ...i,
            vendor: i.vendor ? (vendorMap[i.vendor] || i.vendor) : null
        }));

        return NextResponse.json({ invoices: filtered });
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
        if (!body.vendor || !body.totalAmount || !body.invoiceNumber) {
            return NextResponse.json({ error: "Vendor, Amount, and Invoice Number are required" }, { status: 400 });
        }

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;

        const modelData = { ...body };
        const invoice = await prisma.vendorInvoice.create({
            data: {
                status: body.status || 'Pending',
                organizationId: org ? org.id : authUser.organizationId,
                modelData
            }
        });

        const result = {
            _id: invoice.id,
            id: invoice.id,
            mongoId: invoice.mongoId,
            organizationId: invoice.organizationId,
            status: invoice.status,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
            ...modelData
        };

        return NextResponse.json({ invoice: result, message: "Invoice recorded successfully" }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        const existing = await prisma.vendorInvoice.findFirst({
            where: { OR: [{ id }, { mongoId: id }], organizationId: orgQuery }
        });

        if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

        const updatedModelData = {
            ...(existing.modelData || {}),
            ...updateData
        };

        const invoice = await prisma.vendorInvoice.update({
            where: { id: existing.id },
            data: {
                status: updateData.status || existing.status,
                modelData: updatedModelData
            }
        });

        const result = {
            _id: invoice.id,
            id: invoice.id,
            mongoId: invoice.mongoId,
            organizationId: invoice.organizationId,
            status: invoice.status,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
            ...updatedModelData
        };

        return NextResponse.json({ invoice: result, message: "Invoice updated successfully" });
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

        if (!id) return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        const existing = await prisma.vendorInvoice.findFirst({
            where: { OR: [{ id }, { mongoId: id }], organizationId: orgQuery }
        });

        if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

        await prisma.vendorInvoice.delete({
            where: { id: existing.id }
        });

        return NextResponse.json({ message: "Invoice deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
