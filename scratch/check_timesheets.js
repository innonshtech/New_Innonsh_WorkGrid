const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const timesheets = await prisma.timesheet.findMany({ take: 5 });
  console.log("=== TIMESHEETS ===");
  console.log(JSON.stringify(timesheets, null, 2));

  const entries = await prisma.timesheetEntry.findMany({ take: 5 });
  console.log("\n=== TIMESHEET ENTRIES ===");
  console.log(JSON.stringify(entries, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
