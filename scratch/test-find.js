const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = '27ac12f5-f05e-41a8-a297-71c1abce408f';
  const run = await prisma.payrollRunV2.findUnique({
    where: { id }
  });
  console.log('Run found via findUnique:', run !== null);
  if (run) {
    console.log('Run details:', { orgId: run.organizationId, status: run.status });
  }
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
