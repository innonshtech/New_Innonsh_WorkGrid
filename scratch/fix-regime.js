const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  await prisma.payrollTaxSectionConfig.updateMany({
    where: { sectionCode: 'STANDARD_DEDUCTION' },
    data: { applicableRegime: 'BOTH' }
  });
  console.log('Fixed applicableRegime');
}

fix().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
