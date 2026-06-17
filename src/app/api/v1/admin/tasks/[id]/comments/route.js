import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { getAuthUser, authorize } from '@/lib/auth-util';

// GET — Fetch comments for a task
export async function GET(request, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin", "employee", "supervisor"]);
        
        const { id } = await params;

        const task = await prisma.task.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } })
            
            
            ;

        if (!task) {
            return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            comments: task.comments || [] 
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST — Add a comment to a task
export async function POST(request, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin", "employee", "supervisor"]);
        
        const { id } = await params;
        const body = await request.json();

        if (!body.comment || !body.comment.trim()) {
            return NextResponse.json({ success: false, error: 'Comment text is required' }, { status: 400 });
        }

        const task = await prisma.task.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

        if (!task) {
            return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
        }

        const existingComments = task.comments || [];
        const newComment = {
            user: authUser.id,
            comment: body.comment.trim(),
            attachments: body.attachments || [],
            createdAt: new Date()
        };
        existingComments.push(newComment);

        const updatedTask = await prisma.task.update({
            where: { id: task.id },
            data: { comments: existingComments }
        });

        return NextResponse.json({ 
            success: true, 
            comments: updatedTask.comments,
            newComment
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
