const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log("Organizations:");
  console.log(JSON.stringify(orgs.map(o => ({ id: o.id, mongoId: o.mongoId, name: o.name })), null, 2));

  const emps = await prisma.employee.findMany();
  console.log("\nEmployees orgIds:");
  console.log(JSON.stringify(emps.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, orgId: e.organizationId })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
