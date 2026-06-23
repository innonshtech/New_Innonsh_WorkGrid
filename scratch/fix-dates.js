const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.payrollTaxSlabConfig.updateMany({ 
    where: { financialYear: '2026-27' },
    data: { effectiveFrom: new Date('2026-04-01') }
  });
  console.log("Updated effectiveFrom to 2026-04-01");
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
