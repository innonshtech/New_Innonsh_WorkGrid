import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { logActivity } from '@/lib/logger';

export async function GET(request, { params }) {
    try {
        
        const project = await prisma.project.findFirst({ where: { OR: [{ id: params.id }, { mongoId: params.id }] } })
            
            ;

        if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

        return NextResponse.json({ success: true, project });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        
        const body = await request.json();

        const project = await prisma.project.update({ where: { id: (await prisma.project.findFirst({ where: { OR: [{ id: params.id }, { mongoId: params.id }] }, select: { id: true } }))?.id || params.id }, data: body });

        if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

        await logActivity({
            action: "updated",
            entity: "Project",
            entityId: project._id,
            description: `Updated project: ${project.name}`,
            details: body,
            req: request
        });

        return NextResponse.json({ success: true, project });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        
        const project = await prisma.project.delete({ where: { id: (await prisma.project.findFirst({ where: { OR: [{ id: params.id }, { mongoId: params.id }] }, select: { id: true } }))?.id || params.id } });

        if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

        await logActivity({
            action: "deleted",
            entity: "Project",
            entityId: project._id,
            description: `Deleted project: ${project.name}`,
            req: request
        });

        return NextResponse.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
