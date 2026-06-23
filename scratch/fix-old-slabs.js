const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOldSlabs() {
  // Fix the regime case from 'OLD' to 'old' to match the config loader query
  // Also fix effectiveFrom to April 1 2026 to match the financial year start
  const result = await prisma.payrollTaxSlabConfig.updateMany({
    where: { regime: 'OLD' },
    data: { 
      regime: 'old',
      effectiveFrom: new Date('2026-04-01')
    }
  });
  console.log(`Updated ${result.count} OLD regime slabs to lowercase 'old' with effectiveFrom=2026-04-01`);
  
  // Verify
  const slabs = await prisma.payrollTaxSlabConfig.findMany({
    where: { regime: 'old' },
    orderBy: { slabFrom: 'asc' }
  });
  console.log('\nVerification:');
  for (const s of slabs) {
    console.log(`  regime="${s.regime}" | from=${s.slabFrom} | to=${s.slabTo} | rate=${s.rate}% | effectiveFrom=${s.effectiveFrom}`);
  }
}

fixOldSlabs().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
