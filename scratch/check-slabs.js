const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSlabs() {
  const slabs = await prisma.payrollTaxSlabConfig.findMany({});
  console.log('Slabs:', slabs.map(s => ({
    regime: s.regime, 
    fyId: s.financialYearId, 
    from: s.slabFrom, 
    to: s.slabTo, 
    rate: s.rate 
  })));
}

checkSlabs().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
