import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import { Prisma } from '@prisma/client';

async function resolveIds(model, externalId) {
  if (!externalId) return null;
  const record = await prisma[model].findFirst({
    where: {
      OR: [
        { id: externalId },
        { mongoId: externalId }
      ]
    },
    select: { id: true, mongoId: true }
  });
  return record ? [record.id, record.mongoId].filter(Boolean) : null;
}

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
      employeeSubCategory,
      createdBy
    } = body;

    // Validate required fields
    if (!organizationName || !departmentName || !employeeType || !employeeCategory || !employeeSubCategory) {
      return NextResponse.json(
        { error: "All fields are required" },
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
        { error: "Employee type not found" },
        { status: 404 }
      );
    }

    // Find employee category
    const employeeCategoryDoc = await prisma.employeeCategory.findFirst({
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

    if (!employeeCategoryDoc) {
      return NextResponse.json(
        { error: "Employee category not found" },
        { status: 404 }
      );
    }

    // Check if sub-category already exists
    const existingSubCategory = await prisma.employeeSubCategory.findFirst({
      where: {
        organizationId: organization.id,
        departmentId: department.id,
        employeeTypeId: employeeTypeDoc.id,
        employeeCategoryId: employeeCategoryDoc.id,
        OR: [
          { employeeSubCategory: employeeSubCategory.trim() }
        ]
      }
    });

    if (existingSubCategory) {
      return NextResponse.json(
        { error: "Employee sub-category already exists for this category" },
        { status: 409 }
      );
    }

    // Create payload
    const payload = {
      organizationId: organization.id,
      departmentId: department.id,
      employeeTypeId: employeeTypeDoc.id,
      employeeCategoryId: employeeCategoryDoc.id,
      employeeSubCategory: employeeSubCategory.trim(),
      createdBy: authUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Creating employee sub-category with payload:", payload);

    const newSubCategory = await prisma.employeeSubCategory.create({ data: payload });

    const transformedSubCategory = {
      ...newSubCategory,
      _id: newSubCategory.id,
      organizationId: { _id: organization.id, name: organization.name },
      departmentId: { _id: department.id, departmentName: department.departmentName },
      employeeTypeId: { _id: employeeTypeDoc.id, employeeType: employeeTypeDoc.employeeType || employeeTypeDoc.type },
      employeeCategoryId: { _id: employeeCategoryDoc.id, employeeCategory: employeeCategoryDoc.employeeCategory || employeeCategoryDoc.categoryName },
      createdBy: authUser ? { _id: authUser.id, name: authUser.name } : null
    };

    console.log("Created employee sub-category:", transformedSubCategory);

    return NextResponse.json(
      {
        message: "Employee Sub-Category created successfully",
        subCategory: transformedSubCategory
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating employee sub-category:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: "Employee sub-category already exists" },
        { status: 409 }
      );
    }

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
    const organizationIdParam = searchParams.get("organizationId");
    const departmentIdParam = searchParams.get("departmentId");
    const employeeTypeIdParam = searchParams.get("employeeTypeId");
    const employeeCategoryIdParam = searchParams.get("employeeCategoryId");

    // Build Prisma 'where' clause
    let whereClause = {};

    // SaaS PROTECTION - Resolve organizationId first
    let finalOrganizationIds = null;
    if (authUser.role !== "super_admin" && authUser.organizationId) {
      finalOrganizationIds = await resolveIds("organization", authUser.organizationId);
    } else if (organizationIdParam) {
      finalOrganizationIds = await resolveIds("organization", organizationIdParam);
    }
    if (finalOrganizationIds) {
      whereClause.organizationId = { in: finalOrganizationIds };
    }

    // Resolve other filter IDs
    if (departmentIdParam) {
      const resolvedDepartmentIds = await resolveIds("department", departmentIdParam);
      if (resolvedDepartmentIds) whereClause.departmentId = { in: resolvedDepartmentIds };
    }
    if (employeeTypeIdParam) {
      const resolvedEmployeeTypeIds = await resolveIds("employeeType", employeeTypeIdParam);
      if (resolvedEmployeeTypeIds) whereClause.employeeTypeId = { in: resolvedEmployeeTypeIds };
    }
    if (employeeCategoryIdParam) {
      const resolvedEmployeeCategoryIds = await resolveIds("employeeCategory", employeeCategoryIdParam);
      if (resolvedEmployeeCategoryIds) whereClause.employeeCategoryId = { in: resolvedEmployeeCategoryIds };
    }

    const dataRaw = await prisma.employeeSubCategory.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.employeeSubCategory.count({ where: whereClause });

    // In-memory mapping of relations
    const orgIds = [...new Set(dataRaw.map(c => c.organizationId).filter(Boolean))];
    const deptIds = [...new Set(dataRaw.map(c => c.departmentId).filter(Boolean))];
    const typeIds = [...new Set(dataRaw.map(c => c.employeeTypeId).filter(Boolean))];
    const catIds = [...new Set(dataRaw.map(c => c.employeeCategoryId).filter(Boolean))];
    const userIds = [...new Set([
      ...dataRaw.map(c => c.createdBy).filter(Boolean),
      ...dataRaw.map(c => c.updatedBy).filter(Boolean)
    ])];

    const [organizations, departments, employeeTypes, employeeCategories, users] = await Promise.all([
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
      prisma.employeeCategory.findMany({
        where: { OR: [{ id: { in: catIds } }, { mongoId: { in: catIds } }] },
        select: { id: true, mongoId: true, categoryName: true, employeeCategory: true }
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

    const catMap = new Map();
    employeeCategories.forEach(c => {
      catMap.set(c.id, c);
      if (c.mongoId) catMap.set(c.mongoId, c);
    });

    const userMap = new Map();
    users.forEach(u => {
      userMap.set(u.id, u);
      if (u.mongoId) userMap.set(u.mongoId, u);
    });

    const data = dataRaw.map(item => {
      const org = item.organizationId ? orgMap.get(item.organizationId) : null;
      const dept = item.departmentId ? deptMap.get(item.departmentId) : null;
      const type = item.employeeTypeId ? typeMap.get(item.employeeTypeId) : null;
      const category = item.employeeCategoryId ? catMap.get(item.employeeCategoryId) : null;
      const creator = item.createdBy ? userMap.get(item.createdBy) : null;
      const updater = item.updatedBy ? userMap.get(item.updatedBy) : null;

      return {
        ...item,
        _id: item.id,
        employeeSubCategory: item.employeeSubCategory,
        organizationId: org ? { _id: org.id, name: org.name } : null,
        departmentId: dept ? { _id: dept.id, departmentName: dept.departmentName } : null,
        employeeTypeId: type ? { _id: type.id, employeeType: type.employeeType || type.type } : null,
        employeeCategoryId: category ? { _id: category.id, employeeCategory: category.employeeCategory || category.categoryName } : null,
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
    console.error("Error fetching employee sub-categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}