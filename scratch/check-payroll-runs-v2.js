const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const runs = await prisma.payrollRunV2.findMany({});
  console.log('Payroll Runs V2 count:', runs.length);
  for (const r of runs) {
    console.log(`ID: ${r.id} | Code: ${r.runCode} | Month/Year: ${r.month}/${r.year} | FY: ${r.financialYear} | Status: ${r.status}`);
  }
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
