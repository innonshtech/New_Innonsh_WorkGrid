import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "supervisor"]);
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const organizationId = searchParams.get('organizationId');
    
    let where = {};
    
    // SaaS PROTECTION: Restrict by organization
    if (authUser.role === "admin" || authUser.role === "supervisor") {
        where.organizationId = authUser.organizationId;
    } else if (authUser.role === "super_admin" && organizationId) {
        where.organizationId = organizationId;
    }

    if (status) where.status = status;
    
    const rawApprovals = await prisma.approvalWorkflow.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });

    // In-memory filter for JSON fields
    const filteredApprovals = rawApprovals.filter(app => {
        if (type && app.modelData?.type !== type) return false;
        return true;
    });

    const approvals = await Promise.all(filteredApprovals.map(async app => {
        let initiatedByDetails = null;
        const initId = app.modelData?.initiatedBy;
        if (initId && typeof initId === 'string') {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(initId);
            initiatedByDetails = await prisma.user.findFirst({
                where: isUuid ? { OR: [{ id: initId }, { mongoId: initId }] } : { mongoId: initId },
                select: { name: true, email: true }
            });
        }

        let steps = app.modelData?.steps || [];
        steps = await Promise.all(steps.map(async step => {
            if (step.approver && typeof step.approver === 'string') {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(step.approver);
                const approverUser = await prisma.user.findFirst({
                    where: isUuid ? { OR: [{ id: step.approver }, { mongoId: step.approver }] } : { mongoId: step.approver },
                    select: { name: true, email: true }
                });
                return { ...step, approver: approverUser || step.approver };
            }
            return step;
        }));

        return {
            _id: app.id,
            status: app.status,
            ...app.modelData,
            initiatedBy: initiatedByDetails,
            steps,
            organizationId: app.organizationId,
            createdAt: app.createdAt
        };
    }));
    
    return NextResponse.json({ approvals });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
