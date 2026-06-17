const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const docs = await prisma.handbookDocument.findMany();
    console.log("=== Handbook Documents ===");
    console.log(JSON.stringify(docs, null, 2));
  } catch (error) {
    console.error("Error inspecting handbook documents:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
