const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTeams() {
  const allTeams = await prisma.team.findMany();
  console.log("All teams:", allTeams.length);
  if (allTeams.length > 0) {
    console.log("First team:", JSON.stringify(allTeams[0], null, 2));
  }
}

checkTeams().catch(console.error).finally(() => prisma.$disconnect());
