import prisma from '@/lib/db/prisma';
import { NextResponse } from "next/server";

function isValidUUID(str) {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function PUT(request, { params }) {
    console.log("PUT Asset API HIT");
    try {
        const { id } = await params;
        const body = await request.json();
        console.log("PUT Body:", body);

        let whereClause = {};
        if (isValidUUID(id)) {
            whereClause = { OR: [{ id: id }, { mongoId: id }] };
        } else {
            whereClause = { mongoId: id };
        }

        const asset = await prisma.asset.findFirst({
            where: whereClause
        });

        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const existingData = typeof asset.assetData === 'object' && asset.assetData !== null ? asset.assetData : {};
        let updatedHistory = existingData.history ? [...existingData.history] : [];
        
        let resolvedEmployeeId = asset.employeeId;
        if (body.assignedTo !== undefined) {
            if (body.assignedTo) {
                const emp = await prisma.employee.findFirst({
                    where: {
                        OR: [
                            ...(isValidUUID(body.assignedTo) ? [{ id: body.assignedTo }] : []),
                            { mongoId: body.assignedTo }
                        ]
                    },
                    select: { id: true }
                });
                resolvedEmployeeId = emp ? emp.id : null;
            } else {
                resolvedEmployeeId = null;
            }

            if (resolvedEmployeeId !== asset.employeeId) {
                updatedHistory.push({
                    action: resolvedEmployeeId ? "Assigned" : "Unassigned",
                    date: new Date(),
                    details: resolvedEmployeeId ? `Assigned to employee ID: ${resolvedEmployeeId}` : `Unassigned from employee`,
                });
                if (!body.status) body.status = resolvedEmployeeId ? "Assigned" : "Available";
            }
        }

        if (body.status && body.status !== asset.status) {
            updatedHistory.push({
                action: "Status Change",
                date: new Date(),
                details: `Status changed from ${asset.status} to ${body.status}`,
            });
        }

        const { assignedTo, status, name, ...restOfBody } = body;
        
        const newAssetData = {
            ...existingData,
            ...restOfBody,
            history: updatedHistory
        };

        const updatedAsset = await prisma.asset.update({
            where: { id: asset.id },
            data: {
                employeeId: resolvedEmployeeId,
                status: status || asset.status,
                name: name || asset.name,
                assetData: newAssetData
            }
        });

        return NextResponse.json(updatedAsset);
    } catch (error) {
        console.error("PUT ASSET ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        let whereClause = {};
        if (isValidUUID(id)) {
            whereClause = { OR: [{ id: id }, { mongoId: id }] };
        } else {
            whereClause = { mongoId: id };
        }

        const asset = await prisma.asset.findFirst({
            where: whereClause
        });

        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        await prisma.asset.delete({
            where: { id: asset.id },
        });

        return NextResponse.json({ message: "Asset deleted successfully", asset });
    } catch (error) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}