const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkChetana() {
  const c = await prisma.employee.findFirst({
    where: { firstName: 'Chetana' }
  });
  console.log('Chetana Email:', c?.email);
}

checkChetana().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
