const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addOldRegimeSlabs() {
  console.log('Adding Old Regime Tax Slabs...');
  try {
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('No org found');

    const oldSlabs = [
      { slabFrom: 0, slabTo: 250000, rate: 0, regime: 'OLD', organizationId: org.id, financialYear: '2026-27', isActive: true },
      { slabFrom: 250000, slabTo: 500000, rate: 5, regime: 'OLD', organizationId: org.id, financialYear: '2026-27', isActive: true },
      { slabFrom: 500000, slabTo: 1000000, rate: 20, regime: 'OLD', organizationId: org.id, financialYear: '2026-27', isActive: true },
      { slabFrom: 1000000, slabTo: 999999999, rate: 30, regime: 'OLD', organizationId: org.id, financialYear: '2026-27', isActive: true },
    ];

    // Clear existing OLD slabs first just in case
    await prisma.payrollTaxSlabConfig.deleteMany({
      where: { regime: 'OLD' }
    });

    for (const s of oldSlabs) {
      await prisma.payrollTaxSlabConfig.create({ data: s });
    }
    console.log('Successfully added Old Regime slabs!');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
addOldRegimeSlabs();
