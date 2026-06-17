const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const saketIds = ['079ac377-875e-4a0f-9f61-f3f4b6c00cee', '6a0b002790c557bb4b2d3c28'];
  
  console.log("=== SAKET TIMESHEETS ===");
  const timesheets = await prisma.timesheet.findMany({
    where: {
      employeeId: { in: saketIds }
    }
  });
  console.log(JSON.stringify(timesheets, null, 2));

  console.log("\n=== SAKET TIMESHEET ENTRIES ===");
  const allEntries = await prisma.timesheetEntry.findMany({});
  const matchingEntries = allEntries.filter(e => {
    const mData = e.modelData || {};
    return saketIds.includes(e.employeeId) || saketIds.includes(mData.employee);
  });
  console.log(JSON.stringify(matchingEntries, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
