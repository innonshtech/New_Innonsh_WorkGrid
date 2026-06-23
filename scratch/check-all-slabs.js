const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSlabs() {
  const allSlabs = await prisma.payrollTaxSlabConfig.findMany({});
  console.log('=== ALL TAX SLABS IN DB ===');
  for (const s of allSlabs) {
    console.log(`regime="${s.regime}" | fy="${s.financialYear}" | from=${s.slabFrom} | to=${s.slabTo} | rate=${s.rate}% | active=${s.isActive} | effectiveFrom=${s.effectiveFrom}`);
  }
}

checkSlabs().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
