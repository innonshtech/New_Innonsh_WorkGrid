const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTaxSections() {
  // Check all tax sections
  const sections = await prisma.payrollTaxSectionConfig.findMany({});
  console.log('=== ALL TAX SECTIONS ===');
  console.log('Count:', sections.length);
  for (const s of sections) {
    console.log(`  code="${s.sectionCode}" | regime="${s.applicableRegime}" | maxLimit=${s.maxLimit} | active=${s.isActive} | effectiveFrom=${s.effectiveFrom}`);
  }

  // Check Aniket's investment declarations
  const emp = await prisma.employee.findFirst({ where: { employeeId: 'INN004' } });
  if (emp) {
    const decls = await prisma.investmentDeclaration.findMany({
      where: { employeeId: emp.id }
    });
    console.log('\n=== ANIKET INVESTMENT DECLARATIONS ===');
    console.log('Count:', decls.length);
    for (const d of decls) {
      console.log(`  status="${d.status}" | data:`, JSON.stringify(d.modelData));
    }
  }
}

checkTaxSections().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
