const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { PayrollCalculationEngine } = require('./src/lib/payroll/engines/payroll-calculation-engine.js');

async function testChetana() {
  const engine = new PayrollCalculationEngine();
  const emp = await prisma.employee.findFirst({ where: { firstName: 'Chetana' } });
  
  if (!emp) return;
  
  const result = await engine.calculate({
    employeeId: emp.id,
    month: 6,
    year: 2026,
    organizationId: emp.organizationId,
    calculatedById: emp.id,
    overrides: { isPreview: true }
  });
  
  console.log("totalEarnings:", result.totalEarnings);
  console.log("grossEarnings:", result.grossEarnings);
  console.log("netSalary:", result.netSalary);
}

testChetana().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
