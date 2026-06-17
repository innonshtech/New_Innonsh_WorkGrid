const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const exits = await prisma.exitRequest.findMany();
    console.log("=== Exit Requests ===");
    console.log(JSON.stringify(exits, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
