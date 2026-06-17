const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const timesheets = await prisma.timesheet.findMany();
    console.log(`Total timesheets in database: ${timesheets.length}`);
    
    // Group by status
    const statusCounts = {};
    timesheets.forEach(t => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });
    console.log("Status counts:", statusCounts);

    // Check unique employee IDs
    const empIds = [...new Set(timesheets.map(t => t.employeeId))];
    console.log(`Unique employee IDs in timesheets:`, empIds);

    // Fetch corresponding employees
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { id: { in: empIds } },
          { mongoId: { in: empIds } }
        ]
      }
    });
    console.log(`Found matching employees in database: ${employees.length}`);
    employees.forEach(emp => {
      console.log(`- ${emp.firstName} ${emp.lastName} (ID: ${emp.id}, MongoID: ${emp.mongoId})`);
    });

    // Check timesheet details
    timesheets.forEach((t, i) => {
      console.log(`\nTimesheet ${i + 1}:`);
      console.log(`  ID: ${t.id}`);
      console.log(`  employeeId: ${t.employeeId}`);
      console.log(`  status: ${t.status}`);
      console.log(`  hours: ${t.hours}`);
      console.log(`  timesheetData:`, JSON.stringify(t.timesheetData));
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
