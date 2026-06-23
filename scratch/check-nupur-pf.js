const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNupurPF() {
  const emp = await prisma.employeeProfile.findFirst({
    where: { employee: { firstName: 'Nupur' } }
  });
  console.log(emp ? emp.pfDetails : 'Not found');
}

checkNupurPF().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
