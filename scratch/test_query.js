const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const res = await prisma.candidate.findMany({
      where: {
        organizationId: '6a0444985322ad791296f805'
      }
    });
    console.log("SUCCESS:", res);
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}

run().finally(() => prisma.$disconnect());
