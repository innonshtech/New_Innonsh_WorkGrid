// src/app/api/v1/employee/payroll/leaves/[id]/route.js
import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { updateAnnualBalance, calculateSummary } from "@/lib/payroll/leave-sync-engine";

// GET single leave record
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const leave = await prisma.leave.findFirst({
        where: { OR: [{ id }, { mongoId: id }] },
        include: {
            employee: { select: { firstName: true, lastName: true, email: true, employeeId: true, status: true, id: true, mongoId: true } }
        }
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave record not found" }, { status: 404 });
    }

    const org = leave.organizationId ? await prisma.organization.findFirst({
      where: { OR: [{ id: leave.organizationId }, { mongoId: leave.organizationId }] },
      select: { name: true }
    }) : null;

    const formatted = {
        ...leave,
        _id: leave.id,
        employeeId: leave.employee ? {
            id: leave.employee.id,
            mongoId: leave.employee.mongoId,
            _id: leave.employee.mongoId || leave.employee.id,
            employeeId: leave.employee.employeeId,
            status: leave.employee.status,
            personalDetails: {
                firstName: leave.employee.firstName,
                lastName: leave.employee.lastName,
                email: leave.employee.email
            }
        } : null,
        organizationId: org ? { name: org.name, _id: leave.organizationId } : null
    };
    
    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error in GET /api/v1/employee/payroll/leaves/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE leave record
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const leave = await prisma.leave.findFirst({
        where: { OR: [{ id }, { mongoId: id }] }
    });

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

    // Fetch the final leave record with references populated
    const finalLeave = await prisma.leave.findUnique({
      where: { id: leave.id },
      include: {
          employee: { select: { firstName: true, lastName: true, email: true, employeeId: true, status: true, id: true, mongoId: true } }
      }
    });

    const org = finalLeave.organizationId ? await prisma.organization.findFirst({
      where: { OR: [{ id: finalLeave.organizationId }, { mongoId: finalLeave.organizationId }] },
      select: { name: true }
    }) : null;

    const formatted = {
        ...finalLeave,
        _id: finalLeave.id,
        employeeId: finalLeave.employee ? {
            id: finalLeave.employee.id,
            mongoId: finalLeave.employee.mongoId,
            _id: finalLeave.employee.mongoId || finalLeave.employee.id,
            employeeId: finalLeave.employee.employeeId,
            status: finalLeave.employee.status,
            personalDetails: {
                firstName: finalLeave.employee.firstName,
                lastName: finalLeave.employee.lastName,
                email: finalLeave.employee.email
            }
        } : null,
        organizationId: org ? { name: org.name, _id: finalLeave.organizationId } : null
    };

    console.log("✅ Leave record updated:", finalLeave.id);
    return NextResponse.json(formatted);
  } catch (error) {
    console.error("❌ Error in PUT /api/v1/employee/payroll/leaves/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE leave record
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const leave = await prisma.leave.findFirst({
        where: { OR: [{ id }, { mongoId: id }] }
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave record not found" }, { status: 404 });
    }

    const { employeeId, year, organizationId } = leave;

    // Delete the record from Prisma
    await prisma.leave.delete({
        where: { id: leave.id }
    });

    // Recalculate annual balance for remaining records
    const remainingLeaves = await prisma.leave.findMany({ where: {
      employeeId: employeeId,
      year: year,
    } });

    if (remainingLeaves.length > 0) {
      console.log("📊 Recalculating annual balance after deletion...");
      await updateAnnualBalance(employeeId, organizationId, year);
    }

    console.log("✅ Leave record deleted:", id);
    return NextResponse.json({ message: "Leave record deleted successfully" });
  } catch (error) {
    console.error("❌ Error in DELETE /api/v1/employee/payroll/leaves/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}