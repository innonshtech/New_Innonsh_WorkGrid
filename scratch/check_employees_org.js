const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const targetOrgId = "1713d3da-2293-43c2-a7f9-c15a35b9c453";
  const empsExact = await prisma.employee.count({ where: { organizationId: targetOrgId } });
  console.log("Count with exact org ID UUID:", empsExact);
  
  const org = await prisma.organization.findFirst({
    where: { OR: [{ id: targetOrgId }, { mongoId: targetOrgId }] },
    select: { id: true, mongoId: true }
  });
  
  const inIds = [org.id, org.mongoId].filter(Boolean);
  const empsIn = await prisma.employee.count({ where: { organizationId: { in: inIds } } });
  console.log("Count with in UUID and mongoId:", empsIn);
}

check().catch(console.error).finally(() => prisma.$disconnect());
