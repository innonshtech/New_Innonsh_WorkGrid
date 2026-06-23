const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAniketSalary() {
  const emp = await prisma.employee.findFirst({
    where: { firstName: 'Aniket' }
  });
  
  if(!emp) return;
  console.log('Employee payslipStructure:', JSON.stringify(emp.payslipStructure, null, 2));
}

checkAniketSalary().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
