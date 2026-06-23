import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import { Form16Engine } from "@/lib/payroll/engines/form16-engine";
import { TaxEngine } from "@/lib/payroll/engines/tax-engine";
import { ConfigLoader } from "@/lib/payroll/engines/config-loader";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const financialYear = searchParams.get('financialYear') || '2026-27';

    if (!employeeId) {
      return NextResponse.json({ error: "Missing employeeId parameter" }, { status: 400 });
    }

    if (authUser.role === "employee" && employeeId !== authUser.id) {
      return NextResponse.json({ error: "Unauthorized: You can only download your own Form 16" }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { organization: true }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Load necessary dependencies
    const configLoader = new ConfigLoader();
    const { RoundingEngine } = require("@/lib/payroll/engines/rounding-engine");
    const roundingEngine = new RoundingEngine();
    const taxEngine = new TaxEngine(roundingEngine);
    const form16Engine = new Form16Engine(taxEngine);

    // We use the financialYear column on PayrollRunV2 to find the relevant payslips
    const runEmployees = await prisma.payrollRunEmployee.findMany({
      where: {
        employeeId,
        run: {
          financialYear: financialYear,
          status: { in: ['CLOSED', 'PAYSLIPS_GENERATED', 'LOCKED', 'COMPLIANCE_DONE', 'BANK_FILE_GENERATED'] }
        }
      },
      include: { run: true }
    });

    const declaration = await prisma.investmentDeclaration.findFirst({
      where: { employeeId, status: { in: ['Active', 'Approved', 'Verified'] } },
      orderBy: { createdAt: 'desc' }
    });

    // We pass empty items here if modelData is used
    const parsedDeclaration = declaration ? {
      regime: declaration.modelData?.taxRegime || employee.taxRegime || 'new',
      financialYearId: financialYear,
      items: declaration.modelData?.sections ? Object.entries(declaration.modelData.sections).map(([key, val]) => ({
        section: { sectionCode: key.replace('section', '') },
        declaredAmount: val?.total || val || 0,
        proofStatus: 'Verified', // Since we only loaded approved declarations
        verifiedAmount: val?.total || val || 0
      })) : []
    } : { regime: employee.taxRegime || 'new', items: [] };

    const taxSlabs = await prisma.payrollTaxSlabConfig.findMany({
      where: { regime: parsedDeclaration.regime, financialYear: financialYear, isActive: true },
      orderBy: { slabFrom: 'asc' }
    });

    const taxSections = await prisma.payrollTaxSectionConfig.findMany({
      where: { applicableRegime: parsedDeclaration.regime, isActive: true }
    });

    const form16Data = form16Engine.compileForm16(
      employee,
      employee.organization,
      runEmployees,
      parsedDeclaration,
      taxSlabs,
      taxSections
    );

    return NextResponse.json({ success: true, data: form16Data });
  } catch (error) {
    console.error("Form 16 Generation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
