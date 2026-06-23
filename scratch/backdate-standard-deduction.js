const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEffectiveDate() {
  console.log('Fixing effectiveFrom date...');
  try {
    await prisma.payrollTaxSectionConfig.updateMany({
      where: { sectionCode: 'STANDARD_DEDUCTION' },
      data: { effectiveFrom: new Date('2026-04-01T00:00:00.000Z') }
    });
    console.log('Successfully backdated Standard Deduction to April 1st 2026!');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
fixEffectiveDate();
