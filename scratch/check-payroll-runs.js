const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const runs = await prisma.payrollRun?.findMany({}) || [];
  console.log('Payroll runs:', runs.length);
  for (const r of runs) {
    console.log(`ID: ${r.id} | period: ${r.period} | status: ${r.status}`);
  }
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
