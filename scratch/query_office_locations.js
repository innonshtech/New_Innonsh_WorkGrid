const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const locations = await prisma.officeLocation.findMany();
    console.log("Office Locations count:", locations.length);
    console.log("First location details:", JSON.stringify(locations[0], null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
