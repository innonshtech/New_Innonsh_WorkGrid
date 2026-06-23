const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFirst() {
  const emp = await prisma.employee.findFirst({});
  console.log('First Employee:', emp?.firstName, emp?.lastName);
}

checkFirst().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
