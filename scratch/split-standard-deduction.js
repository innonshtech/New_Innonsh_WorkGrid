const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStandardDeduction() {
  console.log('Fixing Standard Deduction Regimes...');
  try {
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('No org found');

    // Delete existing standard deduction to prevent duplicates
    await prisma.payrollTaxSectionConfig.deleteMany({
      where: { sectionCode: 'STANDARD_DEDUCTION' }
    });

    // Insert Old Regime Standard Deduction
    await prisma.payrollTaxSectionConfig.create({
      data: {
        name: 'Standard Deduction (Old Regime)',
        sectionCode: 'STANDARD_DEDUCTION',
        maxLimit: 50000,
        applicableRegime: 'old',
        organizationId: org.id,
        isActive: true
      }
    });

    // Insert New Regime Standard Deduction
    await prisma.payrollTaxSectionConfig.create({
      data: {
        name: 'Standard Deduction (New Regime)',
        sectionCode: 'STANDARD_DEDUCTION',
        maxLimit: 75000,
        applicableRegime: 'new',
        organizationId: org.id,
        isActive: true
      }
    });

    console.log('Successfully split Standard Deduction into 50k (Old) and 75k (New)!');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
fixStandardDeduction();
