import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from '@/lib/auth-util';

// POST — Batch reorder tasks after drag-and-drop
export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin", "employee", "supervisor"]);
        

        const { tasks } = await request.json();

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return NextResponse.json({ success: false, error: 'Tasks array is required' }, { status: 400 });
        }

        // Update all tasks with new status and order
        for (const t of tasks) {
            const taskId = t._id || t.id;
            const existing = await prisma.task.findFirst({
                where: {
                    OR: [{ id: taskId }, { mongoId: taskId }],
                    organizationId: authUser.organizationId
                }
            });
            if (existing) {
                await prisma.task.update({
                    where: { id: existing.id },
                    data: {
                        status: t.status,
                        boardOrder: t.boardOrder,
                        updatedAt: new Date()
                    }
                });
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Updated ${tasks.length} tasks` 
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
