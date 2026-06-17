const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const emp = await prisma.employee.findFirst({
    where: { designation: "Software Developer" }
  });
  console.log("Employee:");
  console.log(emp);
}

check().catch(console.error).finally(() => prisma.$disconnect());
