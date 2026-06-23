const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAniketVars() {
  const emp = await prisma.employee.findFirst({
    where: { firstName: 'Aniket' }
  });
  
  if(!emp) return;
  const vars = await prisma.payrollVariableInput.findMany({
    where: { employeeId: emp.id }
  });
  console.log('Vars:', vars);
}

checkAniketVars().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
