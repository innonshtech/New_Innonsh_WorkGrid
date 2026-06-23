const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.payrollRunEmployee.deleteMany({});
  await prisma.payrollRunV2.deleteMany({});
  console.log('Deleted all payroll runs');
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
