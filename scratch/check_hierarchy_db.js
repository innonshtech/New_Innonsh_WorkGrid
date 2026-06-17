const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHierarchyData() {
  const departments = await prisma.department.findMany();
  console.log("Departments:");
  departments.forEach(d => {
    console.log(`- ${d.departmentName}: id=${d.id}, mongoId=${d.mongoId}, orgId=${d.organizationId}, buId=${d.businessUnitId}`);
  });

  const businessUnits = await prisma.businessUnit.findMany();
  console.log("\nBusiness Units:");
  businessUnits.forEach(bu => {
    console.log(`- ${bu.unitName}: id=${bu.id}, mongoId=${bu.mongoId}, orgId=${bu.organizationId}`);
  });

  const teams = await prisma.team.findMany();
  console.log("\nTeams:");
  teams.forEach(t => {
    console.log(`- ${t.teamName}: id=${t.id}, mongoId=${t.mongoId}, orgId=${t.organizationId}, deptId=${t.departmentId}`);
  });
}

checkHierarchyData().catch(console.error).finally(() => prisma.$disconnect());
