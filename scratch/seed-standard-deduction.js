const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedStandardDeduction() {
  console.log('Seeding Standard Deduction...');
  try {
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('No org found');

    const standardDeduction = await prisma.payrollTaxSectionConfig.findFirst({
      where: { sectionCode: 'STANDARD_DEDUCTION', organizationId: org.id }
    });

    if (!standardDeduction) {
      await prisma.payrollTaxSectionConfig.create({
        data: {
          name: 'Standard Deduction',
          sectionCode: 'STANDARD_DEDUCTION',
          maxLimit: 75000,
          applicableRegime: 'both',
          organizationId: org.id,
          isActive: true
        }
      });
      console.log('Inserted STANDARD_DEDUCTION for ₹75,000');
    } else {
      await prisma.payrollTaxSectionConfig.update({
        where: { id: standardDeduction.id },
        data: { maxLimit: 75000 }
      });
      console.log('Updated STANDARD_DEDUCTION to ₹75,000');
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
seedStandardDeduction();
