import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { id } = await params;
    const run = await prisma.payrollRunV2.findUnique({
      where: { id },
      include: {
        employees: {
          orderBy: { employeeId: 'asc' }
        }
      }
    });

    if (!run) {
      return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
    }

    // SaaS protection check
    if (authUser.role === "admin" && run.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: "Unauthorized access to this payroll run" }, { status: 403 });
    }

    // Load full details for employee records
    const detailedEmployees = [];
    for (const re of run.employees) {
      const employee = await prisma.employee.findUnique({
        where: { id: re.employeeId },
        select: { firstName: true, lastName: true, employeeId: true, department: true, designation: true }
      });
      detailedEmployees.push({
        ...re,
        firstName: employee?.firstName || 'Unknown',
        lastName: employee?.lastName || '',
        employeeCode: employee?.employeeId || 'N/A',
        department: employee?.department || 'N/A',
        designation: employee?.designation || 'N/A'
      });
    }

    return NextResponse.json({
      success: true,
      run: {
        ...run,
        employees: detailedEmployees
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { id } = await params;
    const run = await prisma.payrollRunV2.findUnique({
      where: { id }
    });

    if (!run) {
      return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
    }

    // SaaS protection check
    if (authUser.role === "admin" && run.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (run.status !== 'OPEN' && run.status !== 'LOCKED' && !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: "Cannot delete a run that is in workflow approval or closed." }, { status: 400 });
    }

    // Delete associated run records
    await prisma.payrollRunEmployee.deleteMany({
      where: { runId: id }
    });

    await prisma.payrollRunV2.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Payroll run deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
