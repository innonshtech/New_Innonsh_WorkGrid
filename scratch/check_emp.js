const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmp() {
  const emp = await prisma.employee.findFirst({
    where: { employeeId: 'INN0020' }
  });
  console.log(emp);
}
checkEmp().catch(console.error).finally(() => prisma.$disconnect());
