import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser } from "@/lib/auth-util";
import { WorkflowEngine } from "@/lib/payroll/engines/workflow-engine";

const workflowEngine = new WorkflowEngine();

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = authUser.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization associated with user" }, { status: 400 });
    }

    const pending = await workflowEngine.getMyPendingApprovals(
      authUser.id,
      authUser.role.toUpperCase(),
      orgId
    );

    return NextResponse.json({ success: true, pending });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { instanceId, stepId, action, comments } = body;

    if (!instanceId || !stepId || !action) {
      return NextResponse.json({ error: "Missing required fields: instanceId, stepId, action" }, { status: 400 });
    }

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: "Action must be APPROVED or REJECTED" }, { status: 400 });
    }

    const result = await workflowEngine.processWorkflowAction({
      instanceId,
      stepId,
      action,
      comments,
      userId: authUser.id,
      userRole: authUser.role.toUpperCase()
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
