const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const targetOrgId = "1713d3da-2293-43c2-a7f9-c15a35b9c453";
  const org = await prisma.organization.findFirst({
      where: { OR: [{ id: targetOrgId }, { mongoId: targetOrgId }] }
  });
  const inIds = [org.id, org.mongoId].filter(Boolean);
  
  const bus = await prisma.businessUnit.findMany({ where: { organizationId: { in: inIds } } });
  console.log("Business Units:", bus);
  
  const depts = await prisma.department.findMany({ where: { organizationId: { in: inIds } } });
  console.log("Departments:", depts.length);
  
  const teams = await prisma.team.findMany({ where: { organizationId: { in: inIds } } });
  console.log("Teams:", teams.length);
}

check().catch(console.error).finally(() => prisma.$disconnect());
