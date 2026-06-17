import prisma from '@/lib/db/prisma';
import { NextResponse } from "next/server";
import { getAuthUser, authorize } from "@/lib/auth-util";

function isValidUUID(str) {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function PUT(request, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const { id } = await params;
        const body = await request.json();

        let whereClause = {};
        if (isValidUUID(id)) {
            whereClause = { OR: [{ id: id }, { mongoId: id }] };
        } else {
            whereClause = { mongoId: id };
        }
        if (authUser.role !== "super_admin" && authUser.organizationId) {
            whereClause.organizationId = authUser.organizationId;
        }

        const existingProduct = await prisma.productCatalog.findFirst({
            where: whereClause
        });

        if (!existingProduct) {
            return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
        }

        const existingData = typeof existingProduct.modelData === 'object' && existingProduct.modelData !== null ? existingProduct.modelData : {};
        const { name, category, totalQuantity, status, ...rest } = body;
        
        const newModelData = {
            ...existingData,
            ...rest
        };
        if (name !== undefined) newModelData.name = name;
        if (category !== undefined) newModelData.category = category;
        if (totalQuantity !== undefined) newModelData.totalQuantity = Number(totalQuantity) || 0;

        const product = await prisma.productCatalog.update({
            where: { id: existingProduct.id },
            data: {
                status: status || existingProduct.status,
                modelData: newModelData
            }
        });
        
        const responseData = {
            ...product,
            _id: product.id,
            ...(typeof product.modelData === 'object' && product.modelData !== null ? product.modelData : {})
        };

        return NextResponse.json({ success: true, data: responseData, message: "Product updated successfully" });
    } catch (error) {
        console.error("PUT ASSET PRODUCT ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const { id } = await params;

        let whereClause = {};
        if (isValidUUID(id)) {
            whereClause = { OR: [{ id: id }, { mongoId: id }] };
        } else {
            whereClause = { mongoId: id };
        }
        if (authUser.role !== "super_admin" && authUser.organizationId) {
            whereClause.organizationId = authUser.organizationId;
        }

        const existingProduct = await prisma.productCatalog.findFirst({
            where: whereClause
        });

        if (!existingProduct) {
            return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
        }

        await prisma.productCatalog.delete({
            where: { id: existingProduct.id },
        });
        
        return NextResponse.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        console.error("DELETE ASSET PRODUCT ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}