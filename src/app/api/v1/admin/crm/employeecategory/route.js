import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

    const body = await request.json();
    console.log("Request body:", body);

    const {
      organizationName,
      departmentName,
      employeeType,
      employeeCategory,
      supportedDocuments,
      createdBy
    } = body;

    // Validate required fields
    if (!organizationName || !departmentName || !employeeType || !employeeCategory) {
      return NextResponse.json(
        { error: "Organization, department, employee type, and category are required" },
        { status: 400 }
      );
    }

    // Validate supported documents if provided
    let validDocumentIds = [];
    if (supportedDocuments && supportedDocuments.length > 0) {
      // Check if documents exist in the database
      const existingDocuments = await prisma.document.findMany({
        where: { OR: [{ id: { in: supportedDocuments } }, { mongoId: { in: supportedDocuments } }] },
        select: { id: true }
      });

      if (existingDocuments.length !== supportedDocuments.length) {
        return NextResponse.json(
          { error: "One or more document IDs are invalid" },
          { status: 400 }
        );
      }
      validDocumentIds = existingDocuments.map(d => d.id);
    }

    // Find organization by name
    const organization = await prisma.organization.findFirst({
        where: { name: organizationName }
    });
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

    // Find employee type
    const employeeTypeDoc = await prisma.employeeType.findFirst({
        where: {
            organizationId: organization.id,
            departmentId: department.id,
            OR: [
              { type: employeeType.trim() },
              { employeeType: employeeType.trim() }
            ]
        }
    });

    if (!employeeTypeDoc) {
      return NextResponse.json(
        { error: "Employee type not found for this organization and department" },
        { status: 404 }
      );
    }

    // Check if category already exists
    const existingCategory = await prisma.employeeCategory.findFirst({
        where: {
            organizationId: organization.id,
            departmentId: department.id,
            employeeTypeId: employeeTypeDoc.id,
            OR: [
              { categoryName: employeeCategory.trim() },
              { employeeCategory: employeeCategory.trim() }
            ]
        }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Employee category already exists for this employee type" },
        { status: 409 }
      );
    }

    // Create payload (mapping to Prisma schema)
    const payload = {
      organizationId: organization.id,
      departmentId: department.id,
      employeeTypeId: employeeTypeDoc.id,
      categoryName: employeeCategory.trim(),
      employeeCategory: employeeCategory.trim(),
      supportedDocuments: validDocumentIds,
      createdBy: authUser.id
    };

    console.log("Creating employee category with payload:", payload);

    const newCategory = await prisma.employeeCategory.create({ data: payload });

    const populatedCategory = {
      ...newCategory,
      _id: newCategory.id,
      organizationId: { _id: organization.id, name: organization.name },
      departmentId: { _id: department.id, departmentName: department.departmentName },
      employeeTypeId: { _id: employeeTypeDoc.id, employeeType: employeeTypeDoc.employeeType || employeeTypeDoc.type }
    };

    return NextResponse.json(
      {
        message: "Employee Category created successfully",
        category: populatedCategory
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating employee category:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
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
    let where = {};
    
    // SaaS PROTECTION
    let targetOrgId = authUser.role !== "super_admin" && authUser.organizationId ? authUser.organizationId : organizationId;
    if (targetOrgId) {
      const org = await prisma.organization.findFirst({
        where: { OR: [{ id: targetOrgId }, { mongoId: targetOrgId }] },
        select: { id: true, mongoId: true }
      });
      if (org) {
        where.organizationId = { in: [org.id, org.mongoId].filter(Boolean) };
      } else {
        where.organizationId = targetOrgId;
      }
    }

    if (departmentId) {
      const dept = await prisma.department.findFirst({
        where: { OR: [{ id: departmentId }, { mongoId: departmentId }] },
        select: { id: true, mongoId: true }
      });
      if (dept) {
        where.departmentId = { in: [dept.id, dept.mongoId].filter(Boolean) };
      } else {
        where.departmentId = departmentId;
      }
    }

    const categoriesRaw = await prisma.employeeCategory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.employeeCategory.count({ where });

    // Manually map relations in-memory
    const orgIds = [...new Set(categoriesRaw.map(c => c.organizationId).filter(Boolean))];
    const deptIds = [...new Set(categoriesRaw.map(c => c.departmentId).filter(Boolean))];
    const typeIds = [...new Set(categoriesRaw.map(c => c.employeeTypeId).filter(Boolean))];
    const userIds = [...new Set([
      ...categoriesRaw.map(c => c.createdBy).filter(Boolean),
      ...categoriesRaw.map(c => c.updatedBy).filter(Boolean)
    ])];

    const [organizations, departments, employeeTypes, users] = await Promise.all([
      prisma.organization.findMany({
        where: { OR: [{ id: { in: orgIds } }, { mongoId: { in: orgIds } }] },
        select: { id: true, mongoId: true, name: true }
      }),
      prisma.department.findMany({
        where: { OR: [{ id: { in: deptIds } }, { mongoId: { in: deptIds } }] },
        select: { id: true, mongoId: true, departmentName: true }
      }),
      prisma.employeeType.findMany({
        where: { OR: [{ id: { in: typeIds } }, { mongoId: { in: typeIds } }] },
        select: { id: true, mongoId: true, type: true, employeeType: true }
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

    const typeMap = new Map();
    employeeTypes.forEach(t => {
      typeMap.set(t.id, t);
      if (t.mongoId) typeMap.set(t.mongoId, t);
    });

    const userMap = new Map();
    users.forEach(u => {
      userMap.set(u.id, u);
      if (u.mongoId) userMap.set(u.mongoId, u);
    });

    const data = categoriesRaw.map(cat => {
      const org = cat.organizationId ? orgMap.get(cat.organizationId) : null;
      const dept = cat.departmentId ? deptMap.get(cat.departmentId) : null;
      const type = cat.employeeTypeId ? typeMap.get(cat.employeeTypeId) : null;
      const creator = cat.createdBy ? userMap.get(cat.createdBy) : null;
      const updater = cat.updatedBy ? userMap.get(cat.updatedBy) : null;

      return {
        ...cat,
        _id: cat.id,
        employeeCategory: cat.employeeCategory || cat.categoryName,
        organizationId: org ? { _id: org.id, name: org.name } : null,
        departmentId: dept ? { _id: dept.id, departmentName: dept.departmentName } : null,
        employeeTypeId: type ? { _id: type.id, employeeType: type.employeeType || type.type } : null,
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
    console.error("Error fetching employee categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}