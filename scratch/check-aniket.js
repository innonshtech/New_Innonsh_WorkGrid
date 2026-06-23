const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAniket() {
  const emps = await prisma.employee.findMany({
    where: { firstName: { contains: 'Aniket' } }
  });
  
  for(const emp of emps) {
    const ps = await prisma.payrollEmployeeSalary.findFirst({
      where: { employeeId: emp.id }
    });
    console.log(`Aniket: ${emp.firstName} ${emp.lastName} | ID: ${emp.id}`);
    if(ps) {
      console.log(`CTC: ${ps.ctc}, Gross: ${ps.grossSalary}, Basic: ${ps.basicSalary}`);
    } else {
      console.log('No Salary Structure');
    }
  }
}

checkAniket().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
