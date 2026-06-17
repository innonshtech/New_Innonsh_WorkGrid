import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;
    const filter = {};

    if (status && status !== "all") filter.status = status;

    // SaaS PROTECTION: Restrict admin/hr to their own org if they have one assigned
    if (authUser.role !== "super_admin" && authUser.organizationId) {
      filter.OR = [
          { id: authUser.organizationId },
          { mongoId: authUser.organizationId }
      ];
    }

    if (search) {
      if (!filter.OR) filter.OR = [];
      filter.OR.push(
        { name: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } }
      );
    }

    const organizationsDocs = await prisma.organization.findMany({
      where: filter,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.organization.count({ where: filter });

    const organizations = organizationsDocs.map(org => ({
        ...org,
        _id: org.id,
        email: org.contactEmail,
        ...(typeof org.orgData === 'object' && org.orgData !== null ? org.orgData : {})
    }));

    return NextResponse.json({
      success: true,
      organizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET ORGANIZATIONS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function PUT(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Organization ID is required" }, { status: 400 });
    }

    // Check SaaS
    if (authUser.role !== "super_admin" && authUser.organizationId !== id) {
      const targetOrg = await prisma.organization.findFirst({ where: { OR: [{id: id}, {mongoId: id}] } });
      if (!targetOrg || (targetOrg.id !== authUser.organizationId && targetOrg.mongoId !== authUser.organizationId)) {
          return NextResponse.json({ success: false, error: "Unauthorized to update this organization" }, { status: 403 });
      }
    }

    const targetOrg = await prisma.organization.findFirst({ where: { OR: [{id: id}, {mongoId: id}] } });
    if (!targetOrg) {
      return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
    }

    const { email, description, _id, ...restUpdates } = updates;

    const updatedOrg = await prisma.organization.update({
        where: { id: targetOrg.id },
        data: {
            ...restUpdates,
            contactEmail: email || targetOrg.contactEmail,
            orgData: {
                ...(typeof targetOrg.orgData === 'object' && targetOrg.orgData !== null ? targetOrg.orgData : {}),
                description: description,
                updatedBy: authUser.id
            }
        }
    });

    return NextResponse.json({
      success: true,
      message: "Organization updated successfully",
      organization: { ...updatedOrg, _id: updatedOrg.id }
    });

  } catch (error) {
    console.error("PUT ORGANIZATIONS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
