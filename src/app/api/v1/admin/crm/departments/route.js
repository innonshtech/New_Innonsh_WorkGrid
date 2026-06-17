import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { logActivity } from "@/lib/logger";
import { getAuthUser, authorize } from "@/lib/auth-util";
import { buildOrgFilter, resolveOrgIds } from "@/lib/utils/flatten-model";

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);
    
    const body = await request.json();
    
    // SaaS PROTECTION: Admin must use their assigned organizationId
    if (authUser.role === "admin") {
      body.organizationId = authUser.organizationId;
    }

    console.log(body);
    
    // Validate required fields
    if (!body.organizationId || !body.departmentName) {
      return NextResponse.json(
        { error: "Organization ID and department name are required" },
        { status: 400 }
      );
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: {
        OR: [
          { id: body.organizationId },
          { mongoId: body.organizationId }
        ]
      }
    });

    console.log(organization);
    
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if department name already exists IN THE SAME ORGANIZATION
    const existingDepartment = await prisma.department.findFirst({
      where: {
        departmentName: body.departmentName.trim(),
        organizationId: organization.id // Use the found organization's Prisma ID
      }
    });

    console.log(existingDepartment);
    
    
    if (existingDepartment) {
      return NextResponse.json(
        { error: "Department name already exists in this organization" },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        ...body,
        organizationId: organization.id, // Ensure Prisma ID is used
        createdBy: authUser.id, // Assuming authUser.id is the Prisma ID for the user
      }
    });

    console.log(department);
    

    // Populate organization details for response
    const org = department.organizationId ? await prisma.organization.findFirst({
      where: { OR: [{ id: department.organizationId }, { mongoId: department.organizationId }] },
      select: { id: true, name: true }
    }) : null;

    const creator = department.createdBy ? await prisma.user.findFirst({
      where: { OR: [{ id: department.createdBy }, { mongoId: department.createdBy }] },
      select: { id: true, name: true, email: true, role: true }
    }) : null;

    const populatedDepartment = {
      ...department,
      organization: org,
      createdByUser: creator
    };

    await logActivity({
      action: "created",
      entity: "Department",
      entityId: populatedDepartment.id,
      description: `Created department: ${populatedDepartment.departmentName} in ${populatedDepartment.organization?.name}`,
      performedBy: {
        userId: populatedDepartment.createdByUser?.id,
        name: populatedDepartment.createdByUser?.name || "Admin/User",
        email: populatedDepartment.createdByUser?.email,
        role: populatedDepartment.createdByUser?.role
      },
      details: {
        organization: populatedDepartment.organization?.name
      },
      req: request
    });

    return NextResponse.json(
      { 
        message: "Department created successfully", 
        department: populatedDepartment 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create department error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// GET All Departments (with pagination and search)
export async function GET(request) {
  try {
    const authUser = await getAuthUser();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 9;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const organizationId = searchParams.get("organizationId") || "";

    const businessUnitId = searchParams.get("businessUnitId") || "";

    // Build query
    let where = {};
    
    if (search) {
      where.departmentName = { contains: search, mode: "insensitive" };
    }
    
    if (status && status !== "all") {
      where.status = status;
    }

    if (authUser.role === "admin" && authUser.organizationId) {
      where.organizationId = await buildOrgFilter(authUser.organizationId);
    } else if (organizationId) {
      where.organizationId = await buildOrgFilter(organizationId);
    }

    if (businessUnitId) {
      const bu = await prisma.businessUnit.findFirst({
        where: { OR: [{ id: businessUnitId }, { mongoId: businessUnitId }] },
        select: { id: true, mongoId: true }
      });
      if (bu) {
        where.businessUnitId = { in: [bu.id, bu.mongoId].filter(Boolean) };
      } else {
        where.businessUnitId = businessUnitId;
      }
    }

    const departments = await prisma.department.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" }
    });

    const total = await prisma.department.count({ where });

    // Manually populate organization and user names
    const orgIds = [...new Set(departments.map(d => d.organizationId).filter(Boolean))];
    const userIds = [...new Set([
      ...departments.map(d => d.createdBy).filter(Boolean),
      ...departments.map(d => d.updatedBy).filter(Boolean)
    ])];

    const [organizations, users] = await Promise.all([
      prisma.organization.findMany({
        where: { OR: [{ id: { in: orgIds } }, { mongoId: { in: orgIds } }] },
        select: { id: true, mongoId: true, name: true }
      }),
      prisma.user.findMany({
        where: { OR: [{ id: { in: userIds } }, { mongoId: { in: userIds } }] },
        select: { id: true, mongoId: true, name: true }
      })
    ]);

    const orgMap = new Map();
    organizations.forEach(o => {
      if (o.id) orgMap.set(o.id, o);
      if (o.mongoId) orgMap.set(o.mongoId, o);
    });

    const userMap = new Map();
    users.forEach(u => {
      if (u.id) userMap.set(u.id, u);
      if (u.mongoId) userMap.set(u.mongoId, u);
    });

    // Transform data for frontend
    const transformedDepartments = departments.map(dept => {
      const org = dept.organizationId ? orgMap.get(dept.organizationId) : null;
      const creator = dept.createdBy ? userMap.get(dept.createdBy) : null;
      const updater = dept.updatedBy ? userMap.get(dept.updatedBy) : null;
      
      return {
        _id: dept.id,
        id: dept.id,
        mongoId: dept.mongoId,
        departmentName: dept.departmentName,
        status: dept.status,
        organizationId: org?.id,
        organizationName: org?.name,
        createdBy: creator?.name,
        updatedBy: updater?.name,
        permissions: dept.permissions,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt
      };
    });

    return NextResponse.json({
      data: transformedDepartments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get departments error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update Department
export async function PUT(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Department ID is required" }, { status: 400 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.organizationId || !body.departmentName || !body.departmentName.trim()) {
      return NextResponse.json(
        { error: "Organization and department name are required" },
        { status: 400 }
      );
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: {
        OR: [
          { id: id },
          { mongoId: id }
        ]
      },
      select: {
        organizationId: true // Only need organizationId for the check
      }
    });
    if (!existingDepartment) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // SaaS PROTECTION: Admin can only update their own org's departments
    if (authUser.role === 'admin') {
      const authOrgIds = await resolveOrgIds(authUser.organizationId);
      if (!authOrgIds.includes(existingDepartment.organizationId)) {
        return NextResponse.json({ error: "Forbidden: This department does not belong to your organization" }, { status: 403 });
      }
    }

    const duplicateDepartment = await prisma.department.findFirst({
      where: {
        departmentName: body.departmentName.trim(),
        organizationId: body.organizationId,
        NOT: {
          OR: [
            { id: id },
            { mongoId: id }
          ]
        }
      }
    });

    if (duplicateDepartment) {
      return NextResponse.json(
        { error: "Department name already exists in this organization" },
        { status: 400 }
      );
    }

    // Update department
    const rawUpdatedDepartment = await prisma.department.update({ where: { id: (await prisma.department.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id },
      data: {
        organizationId: body.organizationId,
        departmentName: body.departmentName.trim(),
        status: body.status,
        permissions: body.permissions,
        updatedBy: body.updatedBy || authUser.id, // Assuming updatedBy field exists in model
        updatedAt: new Date()
      }
    });

    const org = rawUpdatedDepartment.organizationId ? await prisma.organization.findFirst({
      where: { OR: [{ id: rawUpdatedDepartment.organizationId }, { mongoId: rawUpdatedDepartment.organizationId }] },
      select: { id: true, name: true }
    }) : null;

    const creator = rawUpdatedDepartment.createdBy ? await prisma.user.findFirst({
      where: { OR: [{ id: rawUpdatedDepartment.createdBy }, { mongoId: rawUpdatedDepartment.createdBy }] },
      select: { id: true, name: true, email: true, role: true }
    }) : null;

    const updater = rawUpdatedDepartment.updatedBy ? await prisma.user.findFirst({
      where: { OR: [{ id: rawUpdatedDepartment.updatedBy }, { mongoId: rawUpdatedDepartment.updatedBy }] },
      select: { id: true, name: true, email: true, role: true }
    }) : null;

    const updatedDepartment = {
      ...rawUpdatedDepartment,
      organization: org,
      createdByUser: creator,
      updatedByUser: updater
    };

    await logActivity({
      action: "updated",
      entity: "Department",
      entityId: updatedDepartment.id,
      description: `Updated department: ${updatedDepartment.departmentName}`,
      performedBy: {
        userId: updatedDepartment.updatedByUser?.id,
        name: updatedDepartment.updatedByUser?.name || "Admin/User",
        email: updatedDepartment.updatedByUser?.email,
        role: updatedDepartment.updatedByUser?.role
      },
      req: request
    });

    return NextResponse.json({
      message: "Department updated successfully",
      department: updatedDepartment
    });

  } catch (error) {
    console.error("Update department error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete Department
export async function DELETE(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Department ID is required" }, { status: 400 });
    }

    const department = await prisma.department.findUnique({
      where: {
        OR: [
          { id: id },
          { mongoId: id }
        ]
      },
      select: {
        departmentName: true,
        organizationId: true
      }
    });
    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // SaaS PROTECTION: Admin can only delete their own org's departments
    if (authUser.role === 'admin') {
      const authOrgIds = await resolveOrgIds(authUser.organizationId);
      if (!authOrgIds.includes(department.organizationId)) {
        return NextResponse.json({ error: "Forbidden: This department does not belong to your organization" }, { status: 403 });
      }
    }

    await prisma.department.delete({ where: { id: (await prisma.department.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id }
    });

    await logActivity({
      action: "deleted",
      entity: "Department",
      entityId: id,
      description: `Deleted department: ${department.departmentName}`,
      req: request
    });

    return NextResponse.json({ 
      message: "Department deleted successfully" 
    });

  } catch (error) {
    console.error("Delete department error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET Single Department by ID
export async function GET_SINGLE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Department ID is required" }, { status: 400 });
    }

    const department = await prisma.department.findUnique({
      where: {
        OR: [
          { id: id },
          { mongoId: id }
        ]
      }
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const org = department.organizationId ? await prisma.organization.findFirst({
      where: { OR: [{ id: department.organizationId }, { mongoId: department.organizationId }] },
      select: { id: true, name: true }
    }) : null;

    const creator = department.createdBy ? await prisma.user.findFirst({
      where: { OR: [{ id: department.createdBy }, { mongoId: department.createdBy }] },
      select: { id: true, name: true }
    }) : null;

    const updater = department.updatedBy ? await prisma.user.findFirst({
      where: { OR: [{ id: department.updatedBy }, { mongoId: department.updatedBy }] },
      select: { id: true, name: true }
    }) : null;

    // Transform data for frontend
    const transformedDepartment = {
      id: department.id,
      departmentName: department.departmentName,
      status: department.status,
      organizationId: org?.id,
      organizationName: org?.name,
      createdBy: creator?.name,
      updatedBy: updater?.name,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt
    };

    return NextResponse.json(transformedDepartment);

  } catch (error) {
    console.error("Get single department error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}