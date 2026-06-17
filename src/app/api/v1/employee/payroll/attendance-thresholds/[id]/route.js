import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET - Fetch single attendance threshold
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const t = await prisma.attendanceThreshold.findFirst({
        where: { OR: [{ id }, { mongoId: id }] }
    });

    if (!t) {
      return NextResponse.json({ success: false, error: "Threshold not found" }, { status: 404 });
    }

    let criteria = t.modelData?.criteria || [];
    criteria = await Promise.all(criteria.map(async c => {
      let orgDetails = null;
      let catDetails = null;
      if (c.organizationId) {
          orgDetails = await prisma.organization.findFirst({
              where: { OR: [{ id: c.organizationId }, { mongoId: c.organizationId }] },
              select: { id: true, mongoId: true, name: true }
          });
      }
      if (c.categoryId) {
          catDetails = await prisma.employeeCategory.findFirst({
              where: { OR: [{ id: c.categoryId }, { mongoId: c.categoryId }] },
              select: { id: true, mongoId: true, employeeCategory: true }
          });
      }
      return {
          ...c,
          organizationId: orgDetails ? { ...orgDetails, _id: orgDetails.mongoId || orgDetails.id } : c.organizationId,
          categoryId: catDetails ? { ...catDetails, _id: catDetails.mongoId || catDetails.id } : c.categoryId
      };
    }));

    const threshold = {
      _id: t.id,
      status: t.status,
      isActive: t.status === 'Active',
      threshold: t.modelData?.threshold,
      criteria,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    };

    return NextResponse.json({ success: true, threshold });
  } catch (error) {
    console.error("Error fetching attendance threshold:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update attendance threshold
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { criteria, threshold, isActive } = body;

    // Validate required fields
    if (!criteria || !Array.isArray(criteria) || criteria.length === 0 || !threshold) {
      return NextResponse.json(
        { success: false, error: "Criteria and threshold are required" },
        { status: 400 }
      );
    }

    // Check if threshold exists
    const existingThreshold = await prisma.attendanceThreshold.findFirst({
        where: { OR: [{ id }, { mongoId: id }] }
    });
    if (!existingThreshold) {
      return NextResponse.json({ success: false, error: "Threshold not found" }, { status: 404 });
    }

    const isThresholdActive = isActive !== undefined ? isActive : true;

    // Update threshold
    const updatedRecord = await prisma.attendanceThreshold.update({
        where: { id: existingThreshold.id },
        data: {
            status: isThresholdActive ? 'Active' : 'Inactive',
            modelData: {
                ...existingThreshold.modelData,
                criteria,
                threshold: parseInt(threshold),
                updatedBy: body.updatedBy || null,
            }
        }
    });

    const updatedThreshold = {
      _id: updatedRecord.id,
      status: updatedRecord.status,
      isActive: isThresholdActive,
      ...updatedRecord.modelData
    };

    return NextResponse.json({
      success: true,
      threshold: updatedThreshold,
      message: "Attendance threshold updated successfully",
    });
  } catch (error) {
    console.error("Error updating attendance threshold:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete attendance threshold
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const existing = await prisma.attendanceThreshold.findFirst({
        where: { OR: [{ id }, { mongoId: id }] }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Threshold not found" }, { status: 404 });
    }

    await prisma.attendanceThreshold.delete({ where: { id: existing.id } });

    return NextResponse.json({
      success: true,
      message: "Attendance threshold deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting attendance threshold:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}