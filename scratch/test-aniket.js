const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { PayrollCalculationEngine } = require('./src/lib/payroll/engines/payroll-calculation-engine.js');

async function testAniket() {
  const engine = new PayrollCalculationEngine();
  const aniket = await prisma.employee.findFirst({ where: { firstName: 'Aniket' } });
  
  if (!aniket) {
    console.log("Aniket not found");
    return;
  }
  
  const result = await engine.calculate({
    employeeId: aniket.id,
    month: 6,
    year: 2026,
    organizationId: aniket.organizationId,
    calculatedById: aniket.id,
    overrides: { isPreview: true }
  });
  
  console.log("totalEarnings:", result.totalEarnings);
  console.log("grossEarnings:", result.grossEarnings);
  console.log("proratedEarnings:", result.proratedEarnings);
  console.log("arrearsAmount:", result.arrearBreakdown?.arrearsAmount);
  console.log("bonusAmount:", result.bonusBreakdown?.bonusAmount);
  console.log("leaveEncashment:", result.leaveEncashmentBreakdown?.encashmentAmount);
  console.log("netSalary:", result.netSalary);
}

testAniket().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
