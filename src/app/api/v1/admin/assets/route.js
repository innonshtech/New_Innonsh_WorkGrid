import prisma from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { getAuthUser, authorize } from "@/lib/auth-util";

function isValidUUID(str) {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const { searchParams } = new URL(request.url);
        const assignedTo = searchParams.get("assignedTo");
        const status = searchParams.get("status");

        let where = {};
        
        // SaaS PROTECTION: Scope to org
        if (authUser.role !== "super_admin" && authUser.organizationId) {
            where.organizationId = authUser.organizationId;
        }

        if (assignedTo) where.employeeId = assignedTo;
        if (status) where.status = status;

        const assetsDocs = await prisma.asset.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        const empIds = [...new Set(assetsDocs.map(a => a.employeeId).filter(Boolean))];
        const validEmpUUIDs = empIds.filter(isValidUUID);
        const employees = await prisma.employee.findMany({
            where: { OR: [
                ...(validEmpUUIDs.length > 0 ? [{ id: { in: validEmpUUIDs } }] : []),
                { mongoId: { in: empIds } }
            ] },
            select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true }
        });

        const empMap = {};
        employees.forEach(e => {
            const data = {
                _id: e.id,
                employeeId: e.employeeId,
                personalDetails: { firstName: e.firstName || e.personalDetails?.firstName, lastName: e.lastName || e.personalDetails?.lastName }
            };
            empMap[e.id] = data;
            if (e.mongoId) empMap[e.mongoId] = data;
        });

        const pcIds = [];
        assetsDocs.forEach(a => {
            const ad = a.assetData || {};
            if (ad.productCatalogId) pcIds.push(ad.productCatalogId);
        });

        const validPcUUIDs = pcIds.filter(isValidUUID);
        const catalogs = await prisma.productCatalog.findMany({
            where: { OR: [
                ...(validPcUUIDs.length > 0 ? [{ id: { in: validPcUUIDs } }] : []),
                { mongoId: { in: pcIds } }
            ] }
        });

        const catMap = {};
        catalogs.forEach(c => {
            const cd = c.modelData || {};
            const data = { _id: c.id, name: cd.name, category: cd.category, totalQuantity: cd.totalQuantity };
            catMap[c.id] = data;
            if (c.mongoId) catMap[c.mongoId] = data;
        });

        const assets = assetsDocs.map(a => {
            const ad = typeof a.assetData === 'object' && a.assetData !== null ? a.assetData : {};
            return {
                _id: a.id,
                ...a,
                ...ad,
                assignedTo: empMap[a.employeeId] || null,
                productCatalogId: catMap[ad.productCatalogId] || null
            };
        });

        return NextResponse.json({ success: true, data: assets });
    } catch (error) {
        console.error("GET ASSETS ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const body = await request.json();

        // Basic validation
        if (!body.name || !body.assetId || !body.category) {
            return NextResponse.json({ success: false, error: "Missing required fields: name, assetId, and category" }, { status: 400 });
        }

        // SaaS PROTECTION: Attach org
        const orgId = authUser.role !== 'super_admin' ? authUser.organizationId : body.organizationId;

        // JIT Stock Check
        if (body.productCatalogId) {
            let catalogWhere = {};
            if (isValidUUID(body.productCatalogId)) {
                catalogWhere = { OR: [{ id: body.productCatalogId }, { mongoId: body.productCatalogId }] };
            } else {
                catalogWhere = { mongoId: body.productCatalogId };
            }
            
            const catalog = await prisma.productCatalog.findFirst({
                where: catalogWhere
            });
            if (!catalog) {
                return NextResponse.json({ success: false, error: "Invalid vault product selected" }, { status: 400 });
            }
            const catalogData = typeof catalog.modelData === 'object' && catalog.modelData !== null ? catalog.modelData : {};
            
            const deployedAssets = await prisma.asset.findMany({
                where: { organizationId: orgId, status: { not: "Retired" } }
            });
            const deployedCount = deployedAssets.filter(a => {
                const pcId = (a.assetData || {}).productCatalogId;
                return pcId === catalog.id || pcId === catalog.mongoId;
            }).length;

            if (deployedCount >= (catalogData.totalQuantity || 0)) {
                return NextResponse.json({ success: false, error: "Insufficient stock in the vault for this product" }, { status: 400 });
            }
        }

        const { assignedTo, status, name, ...assetData } = body;
        
        let resolvedEmployeeId = null;
        if (assignedTo) {
            const emp = await prisma.employee.findFirst({
                where: {
                    OR: [
                        ...(isValidUUID(assignedTo) ? [{ id: assignedTo }] : []),
                        { mongoId: assignedTo }
                    ]
                },
                select: { id: true }
            });
            if (emp) resolvedEmployeeId = emp.id;
        }

        const asset = await prisma.asset.create({ 
            data: {
                organizationId: orgId, 
                employeeId: resolvedEmployeeId,
                name,
                status: status || "Available",
                assetData: {
                    ...assetData,
                    createdBy: authUser.id
                }
            }
        });
        
        return NextResponse.json({ success: true, data: { ...asset, _id: asset.id, ...(typeof asset.assetData === 'object' && asset.assetData !== null ? asset.assetData : {}) }, message: "Asset registered successfully" }, { status: 201 });
    } catch (error) {
        console.error("POST ASSET ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
    }
}
