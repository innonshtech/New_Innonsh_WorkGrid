import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function POST(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { id } = await params;
    const body = await request.json();
    const { message, attachmentUrl } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

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

    const comment = await prisma.payrollQueryComment.create({
      data: {
        queryId: id,
        commentById: authUser.id,
        commentByName: authUser.name || 'Admin',
        commentByRole: authUser.role.toUpperCase(),
        message,
        attachmentUrl,
      }
    });

    // Automatically update status to IN_PROGRESS if currently OPEN
    if (query.status === 'OPEN') {
      await prisma.payrollQuery.update({
        where: { id: query.id },
        data: { status: 'IN_PROGRESS' }
      });
    }

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
