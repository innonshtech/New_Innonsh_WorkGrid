const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const slabs = await prisma.payrollTaxSlabConfig.findMany({ 
    where: { financialYear: '2026-27', regime: 'new' }
  });
  console.log('2026-27 Slabs:', slabs.length);

  const sections = await prisma.payrollTaxSectionConfig.findMany();
  console.log('Total Sections:', sections.length);
}

main().finally(() => setTimeout(()=>prisma.$disconnect(), 1000));
