import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { logActivity } from '@/lib/logger';

export async function PUT(request, { params }) {
    try {
        
        const { id } = await params;
        const body = await request.json();
        const component = await prisma.salaryComponent.update({ where: { id: (await prisma.salaryComponent.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id }, data: body });

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

        const component = await prisma.salaryComponent.delete({ where: { id: (await prisma.salaryComponent.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id } });
        console.log(`🗑️ DB Operation Result:`, component);

        if (!component) {
            console.warn(`⚠️ Component with ID ${id} not found in database.`);
            return NextResponse.json({ error: "Component not found in database" }, { status: 404 });
        }

        try {
            // Attempt logging but don't fail if it crashes
            await logActivity({
                action: "deleted",
                entity: "SalaryComponent",
                entityId: component.name,
                description: `Deleted salary component: ${component.name}`,
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
