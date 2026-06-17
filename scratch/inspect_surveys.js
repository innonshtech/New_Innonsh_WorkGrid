const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const surveys = await prisma.pulseSurvey.findMany();
  console.log("=== PULSE SURVEYS ===");
  console.log(`Total: ${surveys.length}`);
  console.log(JSON.stringify(surveys, null, 2));

  const responses = await prisma.pulseResponse.findMany();
  console.log("\n=== PULSE RESPONSES ===");
  console.log(`Total: ${responses.length}`);
  console.log(JSON.stringify(responses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
