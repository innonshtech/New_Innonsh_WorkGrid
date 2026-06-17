const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const deptId = "6a05633bc4ccab14267355ad";
  const dept = await prisma.department.findFirst({
    where: { OR: [{ id: deptId }, { mongoId: deptId }] }
  });
  const depIds = dept ? [dept.id, dept.mongoId].filter(Boolean) : [deptId];
  
  const teams = await prisma.team.findMany({ where: { departmentId: { in: depIds } } });
  console.log("Teams for department:");
  console.log(teams);
}

check().catch(console.error).finally(() => prisma.$disconnect());
