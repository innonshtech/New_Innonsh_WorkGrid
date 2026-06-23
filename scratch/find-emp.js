const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findEmployeeByCTC() {
  const ps = await prisma.payrollEmployeeSalary.findMany();
  for(const p of ps) {
    if(p.ctc === 399576 || p.grossSalary === 66596) {
      const emp = await prisma.employee.findUnique({ where: { id: p.employeeId } });
      console.log(`Found! Name: ${emp.firstName} ${emp.lastName}, CTC: ${p.ctc}`);
    }
  }
}

findEmployeeByCTC().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
