import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';



// GET - Fetch all attendance thresholds
export async function GET(request) {
  try {
    

    const thresholds = await prisma.attendanceThreshold.findMany()
      
      
      
      
      ;

    return NextResponse.json({
      success: true,
      thresholds,
    });
  } catch (error) {
    console.error("Error fetching attendance thresholds:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new attendance threshold
export async function POST(request) {
  console.log('POST /api/payroll/attendance-thresholds called');
  try {
    

    const body = await request.json();
    const { criteria, threshold, isActive } = body;

    // Validate required fields
    if (!criteria || !Array.isArray(criteria) || criteria.length === 0 || !threshold) {
      return NextResponse.json(
        { success: false, error: "At least one criteria group and threshold are required" },
        { status: 400 }
      );
    }

    // Validate each criteria item
    for (const item of criteria) {
      if (!item.organizationId || !item.categoryId) {
        return NextResponse.json(
          { success: false, error: "Organization and Category are required for all groups" },
          { status: 400 }
        );
      }
    }

    // Create new threshold
    console.log('Creating threshold with data:', {
      criteria,
      threshold: parseInt(threshold),
      isActive: isActive !== undefined ? isActive : true,
    });

    const newThreshold = await prisma.attendanceThreshold.create({ data: {
      criteria,
      threshold: parseInt(threshold),
      isActive: isActive !== undefined ? isActive : true,
      createdBy: body.createdBy || null, // TODO: Get from session
      updatedBy: body.updatedBy || null,
    } });

    // Populate for response
    await newThreshold;
    await newThreshold;

    return NextResponse.json({
      success: true,
      threshold: newThreshold,
      message: "Attendance threshold created successfully",
    });
  } catch (error) {
    console.error("Error creating attendance threshold:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update attendance threshold
export async function PUT(request) {
  try {
    

    const body = await request.json();
    const { id, criteria, threshold, isActive } = body;

    // Validate required fields
    if (!id || !criteria || !Array.isArray(criteria) || criteria.length === 0 || !threshold) {
      return NextResponse.json(
        { success: false, error: "ID, criteria, and threshold are required" },
        { status: 400 }
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

    if (!updatedThreshold) {
      return NextResponse.json(
        { success: false, error: "Threshold not found" },
        { status: 404 }
      );
    }

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
export async function DELETE(request) {
  try {
    

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Threshold ID is required" },
        { status: 400 }
      );
    }

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