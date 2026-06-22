import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { searchParams } = new URL(request.url);
    let orgId = authUser.role === "admin" ? authUser.organizationId : searchParams.get('orgId');

    if (!orgId && authUser.role === "super_admin") {
      const firstOrg = await prisma.organization.findFirst();
      orgId = firstOrg?.id;
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    const runs = await prisma.payrollRunV2.findMany({
      where: { organizationId: orgId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    return NextResponse.json({ success: true, runs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const body = await request.json();
    const { month, year } = body;
    let orgId = authUser.role === "admin" ? authUser.organizationId : body.orgId;

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    if (!month || !year) {
      return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
    }

    // Check if run already exists for this month & year
    const existing = await prisma.payrollRunV2.findFirst({
      where: { organizationId: orgId, month: parseInt(month), year: parseInt(year) }
    });

    if (existing) {
      return NextResponse.json({ error: `A payroll run for ${month}/${year} already exists.` }, { status: 400 });
    }

    // Auto-generate runCode (e.g. PRUN-202606-0001)
    const formattedMonth = String(month).padStart(2, '0');
    const codePrefix = `PRUN-${year}${formattedMonth}`;
    const count = await prisma.payrollRunV2.count({
      where: {
        organizationId: orgId,
        runCode: { startsWith: codePrefix }
      }
    });
    const runCode = `${codePrefix}-${String(count + 1).padStart(4, '0')}`;

    // Determine FY
    const fy = month >= 4 ? `${year}-${String(year + 1).slice(-2)}` : `${year - 1}-${String(year).slice(-2)}`;

    // Create the run
    const run = await prisma.payrollRunV2.create({
      data: {
        organizationId: orgId,
        runCode,
        month: parseInt(month),
        year: parseInt(year),
        financialYear: fy,
        status: 'OPEN',
        currentStep: 1,
        processedById: authUser.id,
        runLog: [
          {
            timestamp: new Date().toISOString(),
            action: 'CREATED',
            userId: authUser.id,
            userName: authUser.name || 'Admin',
            message: 'Payroll run initialized.'
          }
        ]
      }
    });

    // Populate active employees in this run (all active employees in organization)
    const activeEmployees = await prisma.employee.findMany({
      where: {
        organizationId: orgId,
        status: 'Active'
      }
    });

    // Bulk create PayrollRunEmployee records
    if (activeEmployees.length > 0) {
      const recordsData = activeEmployees.map(emp => ({
        runId: run.id,
        employeeId: emp.id,
        status: 'PENDING'
      }));

      await prisma.payrollRunEmployee.createMany({
        data: recordsData
      });

      // Update total count
      await prisma.payrollRunV2.update({
        where: { id: run.id },
        data: { totalEmployees: activeEmployees.length }
      });
    }

    return NextResponse.json({ success: true, run });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
