const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNupurPF() {
  const emp = await prisma.employee.findFirst({
    where: { firstName: 'Nupur' }
  });
  console.log(emp.pfApplicable, emp.pfType, emp.pfDetails);
}

checkNupurPF().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
