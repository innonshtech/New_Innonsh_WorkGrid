const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const declarations = await prisma.investmentDeclaration.findMany({});
  console.log('Total declarations in DB:', declarations.length);
  for (const d of declarations) {
    const emp = await prisma.employee.findUnique({ where: { id: d.employeeId } });
    console.log(`ID: ${d.id} | Employee: ${emp ? emp.firstName + ' ' + emp.lastName + ' (' + emp.employeeId + ')' : d.employeeId} | Status: ${d.status} | FY: ${d.modelData?.financialYear}`);
  }
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
