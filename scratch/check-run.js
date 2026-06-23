const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRun() {
  const run = await prisma.payrollRunV2.findUnique({
    where: { id: '27ac12f5-f05e-41a8-a297-71c1abce408f' }
  });
  console.log('Run:', run);
}

checkRun().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
