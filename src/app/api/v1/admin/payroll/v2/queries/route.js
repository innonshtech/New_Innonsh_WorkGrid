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

    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');

    const where = { organizationId: orgId };
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const queries = await prisma.payrollQuery.findMany({
      where,
      include: {
        comments: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Resolve employee names
    const detailedQueries = [];
    for (const q of queries) {
      const employee = await prisma.employee.findUnique({
        where: { id: q.employeeId },
        select: { firstName: true, lastName: true, employeeId: true }
      });
      detailedQueries.push({
        ...q,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee',
        employeeCode: employee?.employeeId || 'N/A'
      });
    }

    return NextResponse.json({ success: true, queries: detailedQueries });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const body = await request.json();
    const { employeeId, category, subject, description, month, year, priority } = body;

    let orgId = authUser.role === "admin" ? authUser.organizationId : body.orgId;
    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    if (!employeeId || !category || !subject || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const query = await prisma.payrollQuery.create({
      data: {
        organizationId: orgId,
        employeeId,
        category,
        subject,
        description,
        month: month ? parseInt(month) : null,
        year: year ? parseInt(year) : null,
        status: 'OPEN',
        priority: priority || 'MEDIUM',
      }
    });

    return NextResponse.json({ success: true, query });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
