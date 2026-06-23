const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sections = await prisma.payrollTaxSectionConfig.findMany({
    where: { sectionCode: 'STANDARD_DEDUCTION' }
  });
  console.log(sections);
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
