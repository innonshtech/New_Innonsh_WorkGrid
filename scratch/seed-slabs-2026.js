const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTaxSlabs() {
  console.log('Seeding FY 2026-27 Tax Slabs...');
  try {
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('No org found');

    let fy = await prisma.payrollFinancialYear.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!fy) {
      console.log('No Financial Year found. Creating one...');
      fy = await prisma.payrollFinancialYear.create({
        data: {
          name: '2026-27',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2027-03-31'),
          status: 'Active'
        }
      });
    }

    // Delete existing NEW slabs
    await prisma.payrollTaxSlabConfig.deleteMany({
      where: { 
        regime: 'new',
        financialYear: '2026-27'
      }
    });

    // Insert 2026-27 slabs
    const newSlabs = [
      { slabFrom: 0, slabTo: 400000, rate: 0, regime: 'new', organizationId: org.id, financialYear: '2026-27', isActive: true },
      { slabFrom: 400000, slabTo: 800000, rate: 5, regime: 'new', organizationId: org.id, financialYear: '2026-27', isActive: true },
      { slabFrom: 800000, slabTo: 1200000, rate: 10, regime: 'new', organizationId: org.id, financialYear: '2026-27', isActive: true },
      { slabFrom: 1200000, slabTo: 1600000, rate: 15, regime: 'new', organizationId: org.id, financialYear: '2026-27', isActive: true },
      { slabFrom: 1600000, slabTo: 2000000, rate: 20, regime: 'new', organizationId: org.id, financialYear: '2026-27', isActive: true },
      { slabFrom: 2000000, slabTo: 2400000, rate: 25, regime: 'new', organizationId: org.id, financialYear: '2026-27', isActive: true },
      { slabFrom: 2400000, slabTo: 999999999, rate: 30, regime: 'new', organizationId: org.id, financialYear: '2026-27', isActive: true },
    ];

    for (const s of newSlabs) {
      await prisma.payrollTaxSlabConfig.create({ data: s });
    }
    console.log('Successfully updated slabs to 2026-27 rules!');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
updateTaxSlabs();
