const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const logs = await prisma.activityLog.findMany({
      take: 5
    });
    console.log("=== Activity Logs Sample ===");
    console.log(JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error("Error inspecting activity logs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
