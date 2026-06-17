const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBanks() {
  const banks = await prisma.bank.findMany();
  console.log("Total banks in DB:", banks.length);
  if (banks.length > 0) {
    console.log("Sample banks:", JSON.stringify(banks.slice(0, 5), null, 2));
  }
}

checkBanks().catch(console.error).finally(() => prisma.$disconnect());
