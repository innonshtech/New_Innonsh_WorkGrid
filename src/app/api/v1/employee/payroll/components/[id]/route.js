import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        let compRecord = await prisma.salaryComponent.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!compRecord) {
            return NextResponse.json({ error: "Component not found" }, { status: 404 });
        }

        // Only update fields that exist in schema
        const updateData = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.type !== undefined) updateData.type = body.type;
        if (body.calculationType !== undefined) updateData.calculationType = body.calculationType;
        if (body.percentageOf !== undefined) updateData.percentageOf = body.percentageOf;
        if (body.defaultValue !== undefined) updateData.defaultValue = body.defaultValue;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.isTaxable !== undefined) updateData.isTaxable = body.isTaxable;
        if (body.isStatutory !== undefined) updateData.isStatutory = body.isStatutory;
        if (body.enabled !== undefined) updateData.enabled = body.enabled;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder;

        compRecord = await prisma.salaryComponent.update({
            where: { id: compRecord.id },
            data: updateData
        });

        const component = {
            _id: compRecord.id,
            ...compRecord
        };

        await logActivity({
            action: "updated",
            entity: "SalaryComponent",
            entityId: component.name,
            description: `Updated salary component: ${component.name}`,
            performedBy: { userId: body.updatedBy },
            req: request
        });

        return NextResponse.json(component);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, context) {
    try {
        // Robust params handling for Next.js 15+ / 14 compatibility
        const params = await context.params;
        const id = params?.id;

        console.log(`🗑️ DELETE Request received. ID: ${id}`);

        if (!id) {
            return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
        }

        const compRecord = await prisma.salaryComponent.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!compRecord) {
            console.warn(`⚠️ Component with ID ${id} not found in database.`);
            return NextResponse.json({ error: "Component not found in database" }, { status: 404 });
        }

        await prisma.salaryComponent.delete({
            where: { id: compRecord.id }
        });

        const componentName = compRecord.name || compRecord.id;
        console.log(`🗑️ DB Operation Result: Deleted`);

        try {
            // Attempt logging but don't fail if it crashes
            await logActivity({
                action: "deleted",
                entity: "SalaryComponent",
                entityId: componentName,
                description: `Deleted salary component: ${componentName}`,
                req: request
            });
        } catch (logError) {
            console.error("Failed to log deletion activity:", logError);
        }

        return NextResponse.json({ message: "Component deleted successfully", deletedId: id });
    } catch (error) {
        console.error("❌ DELETE Handler Fatal Error:", error);
        return NextResponse.json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}
