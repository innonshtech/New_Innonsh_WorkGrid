import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

    const body = await request.json();
    console.log("Request body:", body);

    const { organizationName, departmentName, employeeType, createdBy } = body;

    // Validate required fields
    if (!organizationName || !departmentName || !employeeType) {
      return NextResponse.json(
        { error: "Organization, department, and employee type are required" },
        { status: 400 }
      );
    }

    // Find organization by name
    const organization = await prisma.organization.findFirst({ where: { name: organizationName } });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Find department by name and organization
    const department = await prisma.department.findFirst({
      where: {
        departmentName: departmentName,
        organizationId: organization.id
      }
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found in the specified organization" },
        { status: 404 }
      );
    }

    // Check if employee type already exists
    const existingEmployeeType = await prisma.employeeType.findFirst({
      where: {
        organizationId: organization.id,
        departmentId: department.id,
        OR: [
          { type: employeeType.trim() },
          { employeeType: employeeType.trim() }
        ]
      }
    });

    if (existingEmployeeType) {
      return NextResponse.json(
        { error: "Employee type already exists for this department" },
        { status: 409 }
      );
    }

    // Create payload with Prisma ID references
    const payload = {
      organizationId: organization.id,
      departmentId: department.id,
      type: employeeType.trim(),
      employeeType: employeeType.trim(),
      createdBy: authUser.id
    };

    console.log("Creating employee type with payload:", payload);

    const newEmployeeType = await prisma.employeeType.create({ data: payload });

    // Populate creator and updater details in-memory for response
    const creatorUser = authUser ? { id: authUser.id, name: authUser.name } : null;

    const populatedEmployeeType = {
      ...newEmployeeType,
      _id: newEmployeeType.id,
      organizationId: { _id: organization.id, name: organization.name },
      departmentId: { _id: department.id, departmentName: department.departmentName },
      createdBy: creatorUser ? { _id: creatorUser.id, name: creatorUser.name } : null,
      updatedBy: null
    };

    console.log("Created employee type:", populatedEmployeeType);

    return NextResponse.json(
      {
        message: "Employee Type created successfully",
        employeeType: populatedEmployeeType
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating employee type:", error);

    // Handle duplicate employee type error (Prisma P2002 for unique constraint violation)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Employee type already exists for this department" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin", "employee"]);

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const organizationId = searchParams.get("organizationId");
    const departmentId = searchParams.get("departmentId");

    // Build query
    let query = {};
    
    // SaaS PROTECTION: Restrict admin/hr/employees to their own org
    let targetOrgId = authUser.role !== "super_admin" && authUser.organizationId ? authUser.organizationId : organizationId;
    if (targetOrgId) {
      const org = await prisma.organization.findFirst({
        where: { OR: [{ id: targetOrgId }, { mongoId: targetOrgId }] },
        select: { id: true, mongoId: true }
      });
      if (org) {
        query.organizationId = { in: [org.id, org.mongoId].filter(Boolean) };
      } else {
        query.organizationId = targetOrgId;
      }
    }

    if (departmentId) {
      const dept = await prisma.department.findFirst({
        where: { OR: [{ id: departmentId }, { mongoId: departmentId }] },
        select: { id: true, mongoId: true }
      });
      if (dept) {
        query.departmentId = { in: [dept.id, dept.mongoId].filter(Boolean) };
      } else {
        query.departmentId = departmentId;
      }
    }

    const employeeTypesRaw = await prisma.employeeType.findMany({
      where: query,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.employeeType.count({ where: query });

    // Manually map relations in-memory
    const orgIds = [...new Set(employeeTypesRaw.map(et => et.organizationId).filter(Boolean))];
    const deptIds = [...new Set(employeeTypesRaw.map(et => et.departmentId).filter(Boolean))];
    const userIds = [...new Set([
      ...employeeTypesRaw.map(et => et.createdBy).filter(Boolean),
      ...employeeTypesRaw.map(et => et.updatedBy).filter(Boolean)
    ])];

    const [organizations, departments, users] = await Promise.all([
      prisma.organization.findMany({
        where: { OR: [{ id: { in: orgIds } }, { mongoId: { in: orgIds } }] },
        select: { id: true, mongoId: true, name: true }
      }),
      prisma.department.findMany({
        where: { OR: [{ id: { in: deptIds } }, { mongoId: { in: deptIds } }] },
        select: { id: true, mongoId: true, departmentName: true }
      }),
      prisma.user.findMany({
        where: { OR: [{ id: { in: userIds } }, { mongoId: { in: userIds } }] },
        select: { id: true, mongoId: true, name: true }
      })
    ]);

    const orgMap = new Map();
    organizations.forEach(o => {
      orgMap.set(o.id, o);
      if (o.mongoId) orgMap.set(o.mongoId, o);
    });

    const deptMap = new Map();
    departments.forEach(d => {
      deptMap.set(d.id, d);
      if (d.mongoId) deptMap.set(d.mongoId, d);
    });

    const userMap = new Map();
    users.forEach(u => {
      userMap.set(u.id, u);
      if (u.mongoId) userMap.set(u.mongoId, u);
    });

    const data = employeeTypesRaw.map(et => {
      const org = et.organizationId ? orgMap.get(et.organizationId) : null;
      const dept = et.departmentId ? deptMap.get(et.departmentId) : null;
      const creator = et.createdBy ? userMap.get(et.createdBy) : null;
      const updater = et.updatedBy ? userMap.get(et.updatedBy) : null;

      return {
        ...et,
        _id: et.id,
        employeeType: et.employeeType || et.type,
        organizationId: org ? { _id: org.id, name: org.name } : null,
        departmentId: dept ? { _id: dept.id, departmentName: dept.departmentName } : null,
        createdBy: creator ? { _id: creator.id, name: creator.name } : null,
        updatedBy: updater ? { _id: updater.id, name: updater.name } : null,
      };
    });

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching employee types:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}