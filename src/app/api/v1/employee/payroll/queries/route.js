import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve employee
    let employee = null;
    if (authUser.role === 'employee' || authUser.role === 'supervisor') {
      employee = await prisma.employee.findUnique({
        where: { id: authUser.id }
      });
    } else {
      if (authUser.employeeId) {
        employee = await prisma.employee.findUnique({
          where: { employeeId: authUser.employeeId }
        });
      }
      if (!employee && authUser.email) {
        employee = await prisma.employee.findFirst({
          where: { email: authUser.email }
        });
      }
    }

    if (!employee) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const where = { employeeId: employee.id };
    if (status) where.status = status;
    if (category) where.category = category;

    const queries = await prisma.payrollQuery.findMany({
      where,
      include: {
        comments: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, queries });
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

    // Resolve employee
    let employee = null;
    if (authUser.role === 'employee' || authUser.role === 'supervisor') {
      employee = await prisma.employee.findUnique({
        where: { id: authUser.id }
      });
    } else {
      if (authUser.employeeId) {
        employee = await prisma.employee.findUnique({
          where: { employeeId: authUser.employeeId }
        });
      }
      if (!employee && authUser.email) {
        employee = await prisma.employee.findFirst({
          where: { email: authUser.email }
        });
      }
    }

    if (!employee) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { category, subject, description, month, year, priority, attachmentUrl } = body;

    if (!category || !subject || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const query = await prisma.payrollQuery.create({
      data: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        category,
        subject,
        description,
        month: month ? parseInt(month) : null,
        year: year ? parseInt(year) : null,
        status: 'OPEN',
        priority: priority || 'MEDIUM',
      }
    });

    // Create initial comment as the description
    await prisma.payrollQueryComment.create({
      data: {
        queryId: query.id,
        commentById: authUser.id,
        commentByName: `${employee.firstName} ${employee.lastName}`,
        commentByRole: 'EMPLOYEE',
        message: description,
        attachmentUrl: attachmentUrl || null
      }
    });

    return NextResponse.json({ success: true, query });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
