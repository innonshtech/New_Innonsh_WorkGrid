const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employee = await prisma.employee.findFirst({
    where: {
      payslipStructure: { not: null }
    }
  });
  if (employee) {
    console.log('EMPLOYEE:', employee.firstName, employee.lastName);
    console.log('PAYSLIP STRUCTURE:', JSON.stringify(employee.payslipStructure, null, 2));
  } else {
    console.log('No employee found with a payslipStructure');
    // Just dump first employee
    const first = await prisma.employee.findFirst();
    if (first) {
      console.log('FIRST EMPLOYEE:', first.firstName, first.lastName);
      console.log('PAYSLIP STRUCTURE:', first.payslipStructure);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
