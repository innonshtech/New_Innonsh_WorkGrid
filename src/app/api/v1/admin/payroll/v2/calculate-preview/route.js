import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import { PayrollCalculationEngine } from "@/lib/payroll/engines";

const calculationEngine = new PayrollCalculationEngine();

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    const body = await request.json();
    const { employeeId, month, year, overrides = {} } = body;

    if (authUser.role === "employee") {
      if (employeeId !== authUser.id) {
        return NextResponse.json({ error: "Unauthorized access: Employee can only preview their own payroll calculations" }, { status: 403 });
      }
    } else {
      authorize(authUser, ["admin", "super_admin", "supervisor"]);
    }

    if (!employeeId || !month || !year) {
      return NextResponse.json({ error: "Missing required fields (employeeId, month, year)" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // SaaS protection check
    if (authUser.role === "admin" && employee.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Run calculation engine
    const result = await calculationEngine.calculate({
      employeeId,
      month: Number(month),
      year: Number(year),
      organizationId: employee.organizationId,
      calculatedById: authUser.id,
      overrides
    });

    // Also load calculation logs from the logger in memory
    const logs = calculationEngine.logger ? calculationEngine.logger.getLogs() : [];

    return NextResponse.json({
      success: true,
      result,
      logs
    });

  } catch (error) {
    console.error("❌ Preview Calculation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
