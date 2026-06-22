import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser } from "@/lib/auth-util";
import { ConfigLoader } from "@/lib/payroll/engines/config-loader";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve employee
    let employee = null;
    if (authUser.employeeId) {
      employee = await prisma.employee.findUnique({
        where: { employeeId: authUser.employeeId }
      });
    }
    if (!employee) {
      employee = await prisma.employee.findFirst({
        where: { email: authUser.email }
      });
    }

    if (!employee) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    const configLoader = new ConfigLoader(employee.organizationId, new Date());
    const assignment = await configLoader.loadEmployeeSalary(employee.id);

    if (!assignment) {
      // Fallback structure
      const legacy = employee.payslipStructure || {};
      return NextResponse.json({
        success: true,
        ctc: (legacy.grossSalary || 0) * 12,
        gross: legacy.grossSalary || 0,
        basic: legacy.basicSalary || 0,
        components: {
          BASIC: legacy.basicSalary || 0,
          HRA: (legacy.basicSalary || 0) * 0.5,
          SPECIAL_ALLOWANCE: Math.max(0, (legacy.grossSalary || 0) - (legacy.basicSalary || 0) * 1.5)
        }
      });
    }

    return NextResponse.json({
      success: true,
      ctc: assignment.ctc,
      gross: assignment.grossSalary,
      basic: assignment.basicSalary,
      components: assignment.componentValues || {}
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
