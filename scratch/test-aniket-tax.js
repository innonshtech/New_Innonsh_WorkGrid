const { PrismaClient } = require('@prisma/client');
const { PayrollCalculationEngine } = require('../src/lib/payroll/engines');
const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employee.findFirst({ where: { employeeId: 'INN004' } });
  if (!emp) {
    console.error('Aniket not found');
    return;
  }
  console.log(`Found Aniket: ${emp.firstName} ${emp.lastName} (${emp.id})`);
  console.log(`Tax Regime: ${emp.taxRegime}`);

  const engine = new PayrollCalculationEngine();
  const result = await engine.calculate({
    employeeId: emp.id,
    month: 6,
    year: 2026,
    organizationId: emp.organizationId,
    calculatedById: 'system',
    overrides: { isPreview: true }
  });

  console.log('\n=== CALCULATION RESULT ===');
  console.log('Gross Salary:', result.salaryAssignment?.grossSalary || result.grossSalary);
  console.log('Tax Calculation Data:');
  if (result.taxCalculation) {
    const tc = result.taxCalculation;
    console.log(`  Regime: ${tc.regime}`);
    console.log(`  Projected Annual Income: ₹${tc.projectedAnnualIncome}`);
    console.log(`  Total Exemptions (Deductions): ₹${tc.totalExemptions}`);
    console.log(`  Taxable Income: ₹${tc.taxableIncome}`);
    console.log(`  Projected Annual Tax: ₹${tc.projectedAnnualTax}`);
    console.log(`  Monthly TDS: ₹${tc.monthlyTDS}`);
    console.log('  Exemption Breakdown:');
    console.log(JSON.stringify(tc.exemptionBreakdown, null, 2));
  } else {
    console.log('No taxCalculation field in result');
  }
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
