const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTaxSections() {
  const org = await prisma.organization.findFirst();
  if (!org) return console.log('No org found');

  const sections = [
    { sectionCode: '80C', name: 'Section 80C', maxLimit: 150000, applicableRegime: 'old', organizationId: org.id, isActive: true, effectiveFrom: new Date('2026-04-01') },
    { sectionCode: '80D', name: 'Section 80D', maxLimit: 25000, applicableRegime: 'old', organizationId: org.id, isActive: true, effectiveFrom: new Date('2026-04-01') },
    { sectionCode: '80CCD_1B', name: 'Section 80CCD(1B)', maxLimit: 50000, applicableRegime: 'old', organizationId: org.id, isActive: true, effectiveFrom: new Date('2026-04-01') },
    { sectionCode: '80E', name: 'Section 80E', maxLimit: 999999999, applicableRegime: 'old', organizationId: org.id, isActive: true, effectiveFrom: new Date('2026-04-01') },
    { sectionCode: '80G', name: 'Section 80G', maxLimit: 999999999, applicableRegime: 'old', organizationId: org.id, isActive: true, effectiveFrom: new Date('2026-04-01') },
    { sectionCode: '24B', name: 'Section 24(b)', maxLimit: 200000, applicableRegime: 'old', organizationId: org.id, isActive: true, effectiveFrom: new Date('2026-04-01') },
    { sectionCode: 'HRA', name: 'HRA Exemption', maxLimit: 999999999, applicableRegime: 'old', organizationId: org.id, isActive: true, effectiveFrom: new Date('2026-04-01') },
  ];

  for (const sec of sections) {
    const existing = await prisma.payrollTaxSectionConfig.findFirst({
      where: { sectionCode: sec.sectionCode, applicableRegime: sec.applicableRegime }
    });
    if (existing) {
      console.log(`  Already exists: ${sec.sectionCode} (${sec.applicableRegime})`);
      continue;
    }
    await prisma.payrollTaxSectionConfig.create({ data: sec });
    console.log(`  Created: ${sec.sectionCode} (${sec.applicableRegime}) - Max: ₹${sec.maxLimit}`);
  }

  // Verify
  const allSections = await prisma.payrollTaxSectionConfig.findMany({});
  console.log('\n=== ALL TAX SECTIONS NOW ===');
  for (const s of allSections) {
    console.log(`  ${s.sectionCode} | regime=${s.applicableRegime} | maxLimit=₹${s.maxLimit}`);
  }
}

seedTaxSections().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
