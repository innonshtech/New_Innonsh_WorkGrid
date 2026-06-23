const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAniketUser() {
  const aniketEmp = await prisma.employee.findFirst({
    where: { firstName: 'Aniket' }
  });
  
  if (!aniketEmp) return;
  
  const user = await prisma.user.findFirst({
    where: { email: aniketEmp.email }
  });
  
  console.log('Aniket Employee ID:', aniketEmp.id);
  console.log('Aniket Email:', aniketEmp.email);
  if (user) {
    console.log('User EmployeeId:', user.employeeId);
    console.log('User Email:', user.email);
  } else {
    console.log('No user found with Aniket\'s email');
  }
}

checkAniketUser().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
