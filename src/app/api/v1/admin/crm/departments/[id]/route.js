import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const department = await prisma.department.findFirst({
      where: {
        OR: [{ id: id }, { mongoId: id }],
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Transform data for frontend
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

    const transformedDepartment = {
      _id: department.id, // Using Prisma's 'id' as the new '_id'
      departmentName: department.departmentName,
      status: department.status,
      organizationId: org?.id,
      organizationName: org?.name,
      createdBy: creator?.name,
      updatedBy: updater?.name,
      permissions: department.permissions,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt
    };

    return NextResponse.json(transformedDepartment);
  } catch (error) {
    console.error("Get department error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // If organizationId is being updated, verify it exists
    if (body.organizationId) {
      const organization = await prisma.organization.findFirst({
        where: {
          OR: [{ id: body.organizationId }, { mongoId: body.organizationId }],
        },
        select: { id: true },
      });
      if (!organization) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        );
      }
    }

    // If departmentName is being updated, check for duplicates
    if (body.departmentName) {
      const existingDepartment = await prisma.department.findFirst({
        where: {
          departmentName: body.departmentName.trim(),
          NOT: {
            OR: [{ id: id }, { mongoId: id }],
          },
        },
        select: { id: true },
      });
      
      if (existingDepartment) {
        return NextResponse.json(
          { error: "Department name already exists" },
          { status: 400 }
        );
      }
    }

    // Filter body to only include fields existing in Prisma model Department
    const allowedFields = ['organizationId', 'businessUnitId', 'departmentName', 'status', 'permissions', 'createdBy', 'updatedBy'];
    const updateData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    if (updateData.departmentName) {
      updateData.departmentName = updateData.departmentName.trim();
    }

    // Find the correct unique record ID to update
    const record = await prisma.department.findFirst({
      where: {
        OR: [{ id: id }, { mongoId: id }]
      },
      select: { id: true }
    });

    if (!record) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    const department = await prisma.department.update({
      where: { id: record.id },
      data: updateData,
    });

    // Transform data for frontend
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

    const transformedDepartment = {
      _id: department.id, // Using Prisma's 'id' as the new '_id'
      departmentName: department.departmentName,
      status: department.status,
      organizationId: org?.id,
      organizationName: org?.name,
      createdBy: creator?.name,
      updatedBy: updater?.name,
      permissions: department.permissions,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt
    };

    return NextResponse.json(
      { message: "Department updated successfully", department: transformedDepartment },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update department error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const record = await prisma.department.findFirst({
      where: {
        OR: [{ id: id }, { mongoId: id }]
      },
      select: { id: true }
    });

    if (!record) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    await prisma.department.delete({
      where: { id: record.id },
    });

    return NextResponse.json(
      { message: "Department deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete department error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}