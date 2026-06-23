const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const runs = await prisma.payrollRunV2.findMany();
  console.log('Current DB runs:', runs.map(r => r.id));
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
