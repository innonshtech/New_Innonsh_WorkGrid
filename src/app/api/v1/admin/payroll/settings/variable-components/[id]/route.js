import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const config = await prisma.variablePayConfig.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!config) {
            return NextResponse.json({ error: 'Component not found' }, { status: 404 });
        }

        const currentData = config.modelData || {};
        const updatedModelData = {
            ...currentData,
            name: body.name !== undefined ? body.name : currentData.name,
            code: body.code !== undefined ? body.code.toUpperCase() : currentData.code,
            frequency: body.frequency !== undefined ? body.frequency : currentData.frequency,
            description: body.description !== undefined ? body.description : currentData.description,
            isActive: body.isActive !== undefined ? body.isActive : currentData.isActive,
            taxability: body.taxability !== undefined ? body.taxability : currentData.taxability
        };

        const updated = await prisma.variablePayConfig.update({
            where: { id: config.id },
            data: {
                status: updatedModelData.isActive !== false ? 'Active' : 'Inactive',
                modelData: updatedModelData
            }
        });

        const result = {
            id: updated.id,
            mongoId: updated.mongoId,
            organizationId: updated.organizationId,
            employeeId: updated.employeeId,
            status: updated.status,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            ...(updated.modelData || {})
        };

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;

        const config = await prisma.variablePayConfig.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!config) {
            return NextResponse.json({ error: 'Component not found' }, { status: 404 });
        }

        await prisma.variablePayConfig.delete({
            where: { id: config.id }
        });

        return NextResponse.json({ message: 'Component deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
