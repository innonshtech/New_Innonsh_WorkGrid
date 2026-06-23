import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { PayrollCalculationEngine } from '@/lib/payroll/engines/payroll-calculation-engine';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = parseInt(searchParams.get('month')) || 6;
    const year = parseInt(searchParams.get('year')) || 2026;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { organizationId: true }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const calculationEngine = new PayrollCalculationEngine();
    
    // Run calculation engine WITHOUT flushing logs (isPreview: true)
    const result = await calculationEngine.calculate({
      employeeId,
      month,
      year,
      organizationId: employee.organizationId,
      calculatedById: "SYSTEM",
      overrides: { isPreview: true }
    });

    return NextResponse.json({
      success: true,
      calculationResult: result
    });
  } catch (error) {
    console.error('[Preview API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
