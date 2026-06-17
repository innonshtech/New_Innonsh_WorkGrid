import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    // Allow admin, HR, company_admin, and super_admin to view organizations
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where = {};
    if (status && status !== "all") where.status = status;

    // SaaS PROTECTION: Scope to the user's organization if they are not a super_admin
    if (authUser.role !== "super_admin" && authUser.organizationId) {
      where.OR = [
          { id: authUser.organizationId },
          { mongoId: authUser.organizationId }
      ];
    }

    if (search) {
      where.OR = [
          ...(where.OR || []),
          { name: { contains: search, mode: "insensitive" } },
      ];
      // Note: email isn't on the base Prisma model but might be in orgData, so we stick to name searching for simplicity or we pull all and filter
    }

    const organizationsDocs = await prisma.organization.findMany({
        where,
        orderBy: { name: 'asc' }
    });

    const organizations = organizationsDocs.map(o => {
        const od = typeof o.orgData === 'object' && o.orgData !== null ? o.orgData : {};
        return {
            _id: o.id,
            name: o.name,
            status: o.status,
            ...od,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt
        };
    });

    return NextResponse.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error("CRM GET ORGANIZATIONS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
