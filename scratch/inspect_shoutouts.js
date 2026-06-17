const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shoutouts = await prisma.shoutOut.findMany();
  console.log("=== SHOUTOUTS ===");
  console.log(`Total: ${shoutouts.length}`);
  console.log(JSON.stringify(shoutouts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
