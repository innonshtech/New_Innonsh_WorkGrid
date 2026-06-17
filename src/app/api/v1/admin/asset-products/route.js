import prisma from '@/lib/db/prisma';
import { NextResponse } from "next/server";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const { searchParams } = new URL(request.url);
        
        let query = {};
        
        // Scope to org
        if (authUser.role !== "super_admin" && authUser.organizationId) {
            query.organizationId = authUser.organizationId;
        }

        const products = await prisma.productCatalog.findMany({
            where: query,
            orderBy: {
                createdAt: 'desc',
            },
        });

        const formattedProducts = products.map(p => {
            const md = typeof p.modelData === 'object' && p.modelData !== null ? p.modelData : {};
            return {
                _id: p.id,
                ...p,
                ...md
            };
        });

        return NextResponse.json({ success: true, data: formattedProducts });
    } catch (error) {
        console.error("GET ASSET PRODUCTS ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const body = await request.json();

        if (!body.name || !body.category || !body.totalQuantity) {
            return NextResponse.json({ success: false, error: "Missing required fields: name, category, or totalQuantity" }, { status: 400 });
        }

        // Attach org
        const orgId = authUser.role !== 'super_admin' ? authUser.organizationId : body.organizationId;

        const { name, category, totalQuantity, status, ...rest } = body;

        const product = await prisma.productCatalog.create({
            data: {
                organizationId: orgId,
                status: status || "Active",
                modelData: {
                    name,
                    category,
                    totalQuantity: Number(totalQuantity) || 0,
                    ...rest
                }
            }
        });
        
        const responseData = {
            ...product,
            _id: product.id,
            ...(typeof product.modelData === 'object' && product.modelData !== null ? product.modelData : {})
        };

        return NextResponse.json({ success: true, data: responseData, message: "Product added to vault" }, { status: 201 });
    } catch (error) {
        console.error("POST ASSET PRODUCT ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
    }
}