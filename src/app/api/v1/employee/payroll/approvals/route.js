import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    
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
        if (authUser.role === "employee" && app.modelData?.initiatedBy !== authUser.id && app.modelData?.initiatedBy !== authUser.mongoId) return false;
        if (type && app.modelData?.type !== type) return false;
        return true;
    });

    const approvals = await Promise.all(filteredApprovals.map(async app => {
        let initiatedByDetails = null;
        if (app.modelData?.initiatedBy) {
            initiatedByDetails = await prisma.user.findFirst({
                where: { OR: [{ id: app.modelData.initiatedBy }, { mongoId: app.modelData.initiatedBy }] },
                select: { name: true, email: true }
            });
        }

        let steps = app.modelData?.steps || [];
        steps = await Promise.all(steps.map(async step => {
            if (step.approver) {
                const approverUser = await prisma.user.findFirst({
                    where: { OR: [{ id: step.approver }, { mongoId: step.approver }] },
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
