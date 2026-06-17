const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const employees = await prisma.employee.findMany({
    select: { id: true, mongoId: true, firstName: true, lastName: true }
  });
  console.log("=== EMPLOYEES ===");
  console.log(employees);

  console.log("\n=== APPRAISAL RECORDS ===");
  const appraisals = await prisma.appraisal.findMany({
    select: { id: true, employeeId: true }
  });
  console.log(appraisals);

  console.log("\n=== CAREER PATH RECORDS ===");
  const careerPaths = await prisma.careerPath.findMany({
    select: { id: true, employeeId: true, organizationId: true, modelData: true }
  });
  console.log(careerPaths);
}

check().catch(console.error).finally(() => prisma.$disconnect());
