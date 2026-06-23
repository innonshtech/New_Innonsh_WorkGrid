import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser } from "@/lib/auth-util";

export async function POST(request, { params }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { message, attachmentUrl } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Load query
    const query = await prisma.payrollQuery.findUnique({
      where: { id }
    });

    if (!query) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    // Resolve employee
    let employee = null;
    if (authUser.employeeId) {
      employee = await prisma.employee.findUnique({
        where: { employeeId: authUser.employeeId }
      });
    }
    if (!employee) {
      employee = await prisma.employee.findFirst({
        where: { email: authUser.email }
      });
    }

    // Verify ownership
    if (!employee || query.employeeId !== employee.id) {
      return NextResponse.json({ error: "Unauthorized access to this query" }, { status: 403 });
    }

    const comment = await prisma.payrollQueryComment.create({
      data: {
        queryId: id,
        commentById: authUser.id,
        commentByName: `${employee.firstName} ${employee.lastName}`,
        commentByRole: 'EMPLOYEE',
        message,
        attachmentUrl,
      }
    });

    // Automatically set status back to OPEN (signaling new employee message to admin) if currently RESOLVED/CLOSED
    if (['RESOLVED', 'CLOSED'].includes(query.status)) {
      await prisma.payrollQuery.update({
        where: { id: query.id },
        data: { status: 'OPEN' }
      });
    }

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Resolve employee
    let employee = null;
    if (authUser.employeeId) {
      employee = await prisma.employee.findUnique({
        where: { employeeId: authUser.employeeId }
      });
    }
    if (!employee) {
      employee = await prisma.employee.findFirst({
        where: { email: authUser.email }
      });
    }

    // Verify ownership
    if (!employee || query.employeeId !== employee.id) {
      return NextResponse.json({ error: "Unauthorized access to this query" }, { status: 403 });
    }

    return NextResponse.json({ success: true, query });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
