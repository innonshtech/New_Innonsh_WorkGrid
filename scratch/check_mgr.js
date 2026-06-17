const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const emp = await prisma.employee.findFirst({
    where: { OR: [{ id: "6a0b002790c557bb4b2d3c28" }, { mongoId: "6a0b002790c557bb4b2d3c28" }] }
  });
  console.log(emp);
}

check().catch(console.error).finally(() => prisma.$disconnect());
