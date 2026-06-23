const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSlabOrg() {
  const slabs = await prisma.payrollTaxSlabConfig.findMany({
    where: { regime: 'old' }
  });
  for (const s of slabs) {
    console.log(`regime="${s.regime}" | orgId="${s.organizationId}" | from=${s.slabFrom} | rate=${s.rate}%`);
  }
}

checkSlabOrg().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
