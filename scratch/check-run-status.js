const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const runs = await prisma.payrollRunV2.findMany({});
  console.log('=== RUNS ===');
  for (const r of runs) {
    console.log(`ID: ${r.id} | Status: ${r.status} | CurrentStep: ${r.currentStep}`);
    console.log('RunLog:', JSON.stringify(r.runLog, null, 2));
  }
  
  const payslips = await prisma.payslip.findMany({});
  console.log('\n=== PAYSLIPS ===');
  console.log('Count:', payslips.length);
  for (const p of payslips) {
    console.log(`ID: ${p.id} | EmployeeId: ${p.employeeId} | Month/Year: ${p.month}/${p.year} | Status: ${p.status} | Net: ${p.netSalary}`);
  }
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
