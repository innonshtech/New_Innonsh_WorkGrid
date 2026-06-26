const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const components = await prisma.payrollComponentMaster.findMany();
  console.log('COMPONENTS COUNT:', components.length);
  console.log('COMPONENTS:', JSON.stringify(components, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
