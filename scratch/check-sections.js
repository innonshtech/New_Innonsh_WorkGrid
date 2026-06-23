const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sections = await prisma.taxSection.findMany();
  console.log(sections);
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
