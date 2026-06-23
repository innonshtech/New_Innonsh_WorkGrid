const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAniketSalary() {
  const emp = await prisma.employee.findFirst({
    where: { firstName: 'Aniket' }
  });
  
  if(!emp) return;
  const ps = await prisma.payrollEmployeeSalary.findFirst({
    where: { employeeId: emp.id }
  });
  console.log('Salary Structure:', ps);
}

checkAniketSalary().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
