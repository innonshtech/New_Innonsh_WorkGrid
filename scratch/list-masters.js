const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listMasters() {
  const components = await prisma.payrollComponentMaster.findMany();
  console.log('Master Components:', components.map(c => ({ code: c.code, name: c.name, category: c.category, isActive: c.isActive })));
}

listMasters().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
