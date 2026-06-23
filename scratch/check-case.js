const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const slabsUpper = await prisma.payrollTaxSlabConfig.findMany({ 
    where: { financialYear: '2026-27', regime: 'NEW' }
  });
  console.log('Upper:', slabsUpper.length);

  const slabsLower = await prisma.payrollTaxSlabConfig.findMany({ 
    where: { financialYear: '2026-27', regime: 'new' }
  });
  console.log('Lower:', slabsLower.length);
}

main().finally(() => setTimeout(()=>prisma.$disconnect(), 1000));
