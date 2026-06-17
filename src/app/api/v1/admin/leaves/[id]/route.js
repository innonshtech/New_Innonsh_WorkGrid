// src/app/api/v1/admin/leaves/[id]/route.js
import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { updateAnnualBalance, calculateSummary } from "@/lib/payroll/leave-sync-engine";

// GET single leave record
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    console.log(id);
    
    const leave = await prisma.leave.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

    if (!leave) {
      return NextResponse.json({ error: "Leave record not found" }, { status: 404 });
    }

    console.log("Leaves :: :: ", leave);
    return NextResponse.json(leave);
  } catch (error) {
    console.error("Error in GET /api/v1/admin/leaves/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE leave record
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log("Update Leave Body:", body);

    const leave = await prisma.leave.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

    if (!leave) {
      return NextResponse.json({ error: "Leave record not found" }, { status: 404 });
    }

    // Update fields
    const updatedLeaves = body.leaves || leave.leaves;
    const notes = body.notes !== undefined ? body.notes : leave.notes;
    const status = body.status || leave.status;
    const updatedById = body.updatedBy || leave.updatedById;

    // Calculate summary
    const { summary } = calculateSummary(updatedLeaves);

    // Update in database
    await prisma.leave.update({
      where: { id: leave.id },
      data: {
        leaves: updatedLeaves,
        notes,
        status,
        updatedById,
        summary
      }
    });

    // Always update annual balance on edit to keep data in sync
    console.log("📊 Updating annual balance...");
    await updateAnnualBalance(leave.employeeId, leave.organizationId, leave.year);

    // Fetch the final leave record with the updated annualLeaveBalance
    const finalLeave = await prisma.leave.findUnique({
      where: { id: leave.id }
    });

    console.log("✅ Leave record updated:", finalLeave.id);
    return NextResponse.json(finalLeave);
  } catch (error) {
    console.error("❌ Error in PUT /api/v1/admin/leaves/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE leave record
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const leave = await prisma.leave.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

    if (!leave) {
      return NextResponse.json({ error: "Leave record not found" }, { status: 404 });
    }

    // Store employee and year for balance recalculation
    const { employeeId, year, organizationId } = leave;

    // Delete the record
    await prisma.leave.delete({ where: { id: leave.id } });

    // Recalculate annual balance for remaining records
    const remainingLeaves = await prisma.leave.findMany({ where: {
      employeeId,
      year,
    } });

    if (remainingLeaves.length > 0) {
      console.log("📊 Recalculating annual balance after deletion...");
      await updateAnnualBalance(employeeId, organizationId, year);
    }

    console.log("✅ Leave record deleted:", id);
    return NextResponse.json({ message: "Leave record deleted successfully" });
  } catch (error) {
    console.error("❌ Error in DELETE /api/v1/admin/leaves/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}