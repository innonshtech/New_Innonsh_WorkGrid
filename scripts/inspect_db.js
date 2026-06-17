const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    // Note: Table names in postgres/prisma might be lowercase or capitalized depending on the mapping
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE lower(table_name) = 'bonus'
    `);
    console.log("Postgres columns for 'Bonus' table:", cols);
  } catch (err) {
    console.error("Error querying columns:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
