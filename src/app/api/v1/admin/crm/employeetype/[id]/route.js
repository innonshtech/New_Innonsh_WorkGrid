import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin", "employee"]);
    
    const { id } = await params;
    
    const target = await prisma.employeeType.findFirst({
      where: {
        OR: [{ id: id }, { mongoId: id }],
      }
    });

    if (!target) {
      return NextResponse.json({ error: "Employee Type not found" }, { status: 404 });
    }

    // Map relations in-memory
    const org = target.organizationId ? await prisma.organization.findFirst({
      where: { OR: [{ id: target.organizationId }, { mongoId: target.organizationId }] },
      select: { id: true, name: true }
    }) : null;

    const dept = target.departmentId ? await prisma.department.findFirst({
      where: { OR: [{ id: target.departmentId }, { mongoId: target.departmentId }] },
      select: { id: true, departmentName: true }
    }) : null;

    const creator = target.createdBy ? await prisma.user.findFirst({
      where: { OR: [{ id: target.createdBy }, { mongoId: target.createdBy }] },
      select: { name: true, email: true }
    }) : null;

    const updater = target.updatedBy ? await prisma.user.findFirst({
      where: { OR: [{ id: target.updatedBy }, { mongoId: target.updatedBy }] },
      select: { name: true, email: true }
    }) : null;

    const item = {
      ...target,
      _id: target.id,
      employeeType: target.employeeType || target.type,
      organization: org,
      department: dept,
      createdBy: creator,
      updatedBy: updater
    };

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching employee type:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
    
    const { id } = await params;

    const body = await request.json();
    const { employeeType, organizationName, departmentName } = body;

    const existingType = await prisma.employeeType.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });
    if (!existingType) {
      return NextResponse.json({ error: "Employee Type not found" }, { status: 404 });
    }

    // Build update payload
    const updateData = {};
    
    if (employeeType) {
      updateData.type = employeeType.trim();
      updateData.employeeType = employeeType.trim();
    }

    if (organizationName) {
      const organization = await prisma.organization.findFirst({ where: { name: organizationName } });
      if (!organization) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        );
      }
      updateData.organizationId = organization.id;
    }

    if (departmentName) {
      const department = await prisma.department.findFirst({ where: { departmentName: departmentName } });
      if (!department) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 }
        );
      }
      updateData.departmentId = department.id;
    }

    updateData.updatedBy = authUser.id;
    updateData.updatedAt = new Date();

    const updatedRaw = await prisma.employeeType.update({
      where: { id: existingType.id },
      data: updateData
    });

    const org = updatedRaw.organizationId ? await prisma.organization.findFirst({
      where: { OR: [{ id: updatedRaw.organizationId }, { mongoId: updatedRaw.organizationId }] },
      select: { id: true, name: true }
    }) : null;

    const dept = updatedRaw.departmentId ? await prisma.department.findFirst({
      where: { OR: [{ id: updatedRaw.departmentId }, { mongoId: updatedRaw.departmentId }] },
      select: { id: true, departmentName: true }
    }) : null;

    const updater = updatedRaw.updatedBy ? await prisma.user.findFirst({
      where: { OR: [{ id: updatedRaw.updatedBy }, { mongoId: updatedRaw.updatedBy }] },
      select: { name: true, email: true }
    }) : null;

    const updated = {
      ...updatedRaw,
      _id: updatedRaw.id,
      employeeType: updatedRaw.employeeType || updatedRaw.type,
      organization: org,
      department: dept,
      updatedBy: updater
    };

    return NextResponse.json({
      message: "Employee Type updated successfully",
      employeeType: updated,
    });
  } catch (error) {
    console.error("Error updating employee type:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Employee type already exists for this department" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
    
    const { id } = await params;

    const existingType = await prisma.employeeType.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });

    if (!existingType) {
      return NextResponse.json({ error: "Employee Type not found" }, { status: 404 });
    }

    await prisma.employeeType.delete({
      where: { id: existingType.id },
    });

    return NextResponse.json({ message: "Employee Type deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee type:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}