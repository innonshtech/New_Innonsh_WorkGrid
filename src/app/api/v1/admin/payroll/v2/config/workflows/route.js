import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { searchParams } = new URL(request.url);
    let orgId = authUser.role === "admin" ? authUser.organizationId : searchParams.get('orgId');

    if (!orgId && authUser.role === "super_admin") {
      const firstOrg = await prisma.organization.findFirst();
      orgId = firstOrg?.id;
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    const configs = await prisma.payrollWorkflowConfig.findMany({
      where: { organizationId: orgId }
    });

    return NextResponse.json({ success: true, configs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const body = await request.json();
    const { workflowType, approvalLevels, status } = body;
    let orgId = authUser.role === "admin" ? authUser.organizationId : body.orgId;

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    if (!workflowType || !approvalLevels || !Array.isArray(approvalLevels)) {
      return NextResponse.json({ error: "Invalid layout. workflowType and approvalLevels (array) required" }, { status: 400 });
    }

    // Sort approvalLevels by level to prevent ordering issues
    const sortedLevels = [...approvalLevels].sort((a, b) => a.level - b.level);

    // Upsert the workflow config
    const existing = await prisma.payrollWorkflowConfig.findFirst({
      where: { organizationId: orgId, workflowType }
    });

    let config;
    if (existing) {
      config = await prisma.payrollWorkflowConfig.update({
        where: { id: existing.id },
        data: {
          approvalLevels: sortedLevels,
          status: status || 'ACTIVE',
        }
      });
    } else {
      config = await prisma.payrollWorkflowConfig.create({
        data: {
          organizationId: orgId,
          workflowType,
          approvalLevels: sortedLevels,
          status: status || 'ACTIVE',
        }
      });
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
