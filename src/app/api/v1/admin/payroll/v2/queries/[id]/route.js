import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { id } = await params;
    const query = await prisma.payrollQuery.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!query) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    // SaaS protection check
    if (authUser.role === "admin" && query.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: "Unauthorized access to this query" }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: query.employeeId },
      select: { firstName: true, lastName: true, employeeId: true }
    });

    const detailedQuery = {
      ...query,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee',
      employeeCode: employee?.employeeId || 'N/A'
    };

    return NextResponse.json({ success: true, query: detailedQuery });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { id } = await params;
    const body = await request.json();
    const { status, priority, assignedToId, resolution } = body;

    const query = await prisma.payrollQuery.findUnique({
      where: { id }
    });

    if (!query) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    // SaaS protection check
    if (authUser.role === "admin" && query.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: "Unauthorized access to this query" }, { status: 403 });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (resolution !== undefined) {
      updateData.resolution = resolution;
      if (status === 'RESOLVED') {
        updateData.resolvedAt = new Date();
      }
    }

    const updatedQuery = await prisma.payrollQuery.update({
      where: { id },
      data: updateData
    });

    // Create a system comment for tracking state changes
    if (status && status !== query.status) {
      await prisma.payrollQueryComment.create({
        data: {
          queryId: query.id,
          commentById: authUser.id,
          commentByName: authUser.name || 'Admin',
          commentByRole: authUser.role.toUpperCase(),
          message: `Status updated from ${query.status} to ${status}.`,
        }
      });
    }

    return NextResponse.json({ success: true, query: updatedQuery });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
