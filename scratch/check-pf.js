const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPF() {
  const pf = await prisma.payrollPFConfig.findFirst();
  console.log(pf);
}

checkPF().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
