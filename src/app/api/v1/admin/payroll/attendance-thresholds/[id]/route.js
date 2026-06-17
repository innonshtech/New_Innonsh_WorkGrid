import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';


// GET - Fetch single attendance threshold
export async function GET(request, { params }) {
  try {
    

    const { id } = params;

    const threshold = await prisma.attendanceThreshold.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } })
      
      
      
      ;

    if (!threshold) {
      return NextResponse.json(
        { success: false, error: "Threshold not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      threshold,
    });
  } catch (error) {
    console.error("Error fetching attendance threshold:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
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
    const existingThreshold = await prisma.attendanceThreshold.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
    if (!existingThreshold) {
      return NextResponse.json(
        { success: false, error: "Threshold not found" },
        { status: 404 }
      );
    }

    // Update threshold
    const updatedThreshold = await prisma.attendanceThreshold.update({ where: { id: (await prisma.attendanceThreshold.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id }, data: {
        criteria,
        threshold: parseInt(threshold),
        isActive: isActive !== undefined ? isActive : true,
        updatedBy: body.updatedBy || null,
      } })
      ;

    return NextResponse.json({
      success: true,
      threshold: updatedThreshold,
      message: "Attendance threshold updated successfully",
    });
  } catch (error) {
    console.error("Error updating attendance threshold:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete attendance threshold
export async function DELETE(request, { params }) {
  try {
    

    const { id } = params;

    const deletedThreshold = await prisma.attendanceThreshold.delete({ where: { id: (await prisma.attendanceThreshold.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id } });

    if (!deletedThreshold) {
      return NextResponse.json(
        { success: false, error: "Threshold not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Attendance threshold deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting attendance threshold:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}