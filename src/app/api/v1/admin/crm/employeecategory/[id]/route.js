import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin", "employee"]);

    const { id } = params;
    
    console.log("📥 Fetching employee category with ID:", id);

    const target = await prisma.employeeCategory.findFirst({
      where: {
        OR: [
          { id: id },
          { mongoId: id } 
        ]
      }
    });

    if (!target) {
      return NextResponse.json(
        { error: "Employee category not found" },
        { status: 404 }
      );
    }

    // In-memory mapping of relations
    const org = target.organizationId ? await prisma.organization.findFirst({
      where: { OR: [{ id: target.organizationId }, { mongoId: target.organizationId }] },
      select: { id: true, name: true }
    }) : null;

    const dept = target.departmentId ? await prisma.department.findFirst({
      where: { OR: [{ id: target.departmentId }, { mongoId: target.departmentId }] },
      select: { id: true, departmentName: true }
    }) : null;

    const type = target.employeeTypeId ? await prisma.employeeType.findFirst({
      where: { OR: [{ id: target.employeeTypeId }, { mongoId: target.employeeTypeId }] },
      select: { id: true, type: true, employeeType: true }
    }) : null;

    const creator = target.createdBy ? await prisma.user.findFirst({
      where: { OR: [{ id: target.createdBy }, { mongoId: target.createdBy }] },
      select: { name: true }
    }) : null;

    const updater = target.updatedBy ? await prisma.user.findFirst({
      where: { OR: [{ id: target.updatedBy }, { mongoId: target.updatedBy }] },
      select: { name: true }
    }) : null;

    // Fetch documents
    const docIds = target.supportedDocuments || [];
    const documents = docIds.length > 0 ? await prisma.document.findMany({
      where: { OR: [{ id: { in: docIds } }, { mongoId: { in: docIds } }] },
      select: { id: true, name: true, description: true }
    }) : [];

    const transformedCategory = {
      ...target,
      employeeCategory: target.employeeCategory || target.categoryName,
      organizationId: org ? org.name : null,
      departmentId: dept ? dept.departmentName : null,
      employeeTypeId: type ? (type.employeeType || type.type) : null,
      supportedDocuments: documents,
      createdBy: creator ? creator.name : null,
      updatedBy: updater ? updater.name : null,
    };

    return NextResponse.json({
      message: "Employee category retrieved successfully",
      category: transformedCategory
    });
  } catch (error) {
    console.error("❌ Error fetching employee category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

    const { id } = params;
    const body = await request.json();
    console.log("Update request body:", body);

    const { 
      organizationName, 
      departmentName, 
      employeeType, 
      employeeCategory,
      supportedDocuments,
    } = body;

    if (!organizationName || !departmentName || !employeeType || !employeeCategory) {
      return NextResponse.json(
        { error: "Organization, department, employee type, and category are required" },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findFirst({
      where: { name: organizationName },
      select: { id: true }
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const department = await prisma.department.findFirst({
      where: { 
        departmentName: departmentName,
        organizationId: organization.id 
      },
      select: { id: true }
    });
    
    if (!department) {
      return NextResponse.json(
        { error: "Department not found in the specified organization" },
        { status: 404 }
      );
    }

    const employeeTypeDoc = await prisma.employeeType.findFirst({
      where: {
        organizationId: organization.id,
        departmentId: department.id,
        OR: [
          { type: employeeType.trim() },
          { employeeType: employeeType.trim() }
        ]
      },
      select: { id: true }
    });

    if (!employeeTypeDoc) {
      return NextResponse.json(
        { error: "Employee type not found for this organization and department" },
        { status: 404 }
      );
    }

    const existingType = await prisma.employeeCategory.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });
    if (!existingType) {
      return NextResponse.json({ error: "Employee category not found" }, { status: 404 });
    }

    const duplicateCategory = await prisma.employeeCategory.findFirst({
      where: {
        NOT: { id: existingType.id },
        organizationId: organization.id,
        departmentId: department.id,
        employeeTypeId: employeeTypeDoc.id,
        OR: [
          { categoryName: employeeCategory.trim() },
          { employeeCategory: employeeCategory.trim() }
        ]
      },
      select: { id: true }
    });

    if (duplicateCategory) {
      return NextResponse.json(
        { error: "Employee category already exists for this employee type" },
        { status: 409 }
      );
    }

    const updateData = {
      organizationId: organization.id,
      departmentId: department.id,
      employeeTypeId: employeeTypeDoc.id,
      categoryName: employeeCategory.trim(),
      employeeCategory: employeeCategory.trim(),
      updatedBy: authUser.id,
      updatedAt: new Date()
    };

    if (supportedDocuments !== undefined && supportedDocuments !== null) {
      const existingDocuments = await prisma.document.findMany({
        where: { OR: [{ id: { in: supportedDocuments } }, { mongoId: { in: supportedDocuments } }] },
        select: { id: true }
      });
      updateData.supportedDocuments = existingDocuments.map(d => d.id);
    }

    console.log("Updating employee category with payload:", updateData);

    const updatedCategoryRaw = await prisma.employeeCategory.update({
      where: { id: existingType.id },
      data: updateData
    });

    // In-memory mapping
    const org = updatedCategoryRaw.organizationId ? await prisma.organization.findFirst({
      where: { OR: [{ id: updatedCategoryRaw.organizationId }, { mongoId: updatedCategoryRaw.organizationId }] },
      select: { id: true, name: true }
    }) : null;

    const dept = updatedCategoryRaw.departmentId ? await prisma.department.findFirst({
      where: { OR: [{ id: updatedCategoryRaw.departmentId }, { mongoId: updatedCategoryRaw.departmentId }] },
      select: { id: true, departmentName: true }
    }) : null;

    const type = updatedCategoryRaw.employeeTypeId ? await prisma.employeeType.findFirst({
      where: { OR: [{ id: updatedCategoryRaw.employeeTypeId }, { mongoId: updatedCategoryRaw.employeeTypeId }] },
      select: { id: true, type: true, employeeType: true }
    }) : null;

    const creator = updatedCategoryRaw.createdBy ? await prisma.user.findFirst({
      where: { OR: [{ id: updatedCategoryRaw.createdBy }, { mongoId: updatedCategoryRaw.createdBy }] },
      select: { name: true }
    }) : null;

    const updater = updatedCategoryRaw.updatedBy ? await prisma.user.findFirst({
      where: { OR: [{ id: updatedCategoryRaw.updatedBy }, { mongoId: updatedCategoryRaw.updatedBy }] },
      select: { name: true }
    }) : null;

    const docs = updatedCategoryRaw.supportedDocuments.length > 0 ? await prisma.document.findMany({
      where: { OR: [{ id: { in: updatedCategoryRaw.supportedDocuments } }, { mongoId: { in: updatedCategoryRaw.supportedDocuments } }] },
      select: { id: true, name: true, description: true }
    }) : [];

    const transformedCategory = {
      ...updatedCategoryRaw,
      employeeCategory: updatedCategoryRaw.employeeCategory || updatedCategoryRaw.categoryName,
      organizationId: org ? org.name : null,
      departmentId: dept ? dept.departmentName : null,
      employeeTypeId: type ? (type.employeeType || type.type) : null,
      supportedDocuments: docs,
      createdBy: creator ? creator.name : null,
      updatedBy: updater ? updater.name : null,
    };

    return NextResponse.json(
      { 
        message: "Employee Category updated successfully", 
        category: transformedCategory 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating employee category:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "company_admin", "super_admin"]);
    const { id } = params;

    const existingType = await prisma.employeeCategory.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });

    if (!existingType) {
      return NextResponse.json({ error: "Employee Category not found" }, { status: 404 });
    }

    await prisma.employeeCategory.delete({
      where: { id: existingType.id }
    });

    return NextResponse.json({ message: "Employee Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee category:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}