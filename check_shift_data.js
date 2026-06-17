const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check WorkingShift data
    const shifts = await prisma.workingShift.findMany({ take: 5 });
    console.log("=== WorkingShift records ===");
    console.log("Count:", shifts.length);
    if (shifts.length > 0) {
      console.log("Sample shift (full):", JSON.stringify(shifts[0], null, 2));
    }

    // Check if the data is inside modelData
    if (shifts.length > 0 && shifts[0].modelData) {
      console.log("\n=== modelData contents ===");
      console.log(JSON.stringify(shifts[0].modelData, null, 2));
    }

    // Check Department
    const depts = await prisma.department.findMany({ take: 3 });
    console.log("\n=== Department records ===");
    console.log("Count:", depts.length);
    if (depts.length > 0) console.log("Sample:", JSON.stringify(depts[0], null, 2));

    // Check BusinessUnit
    const bus = await prisma.businessUnit.findMany({ take: 3 });
    console.log("\n=== BusinessUnit records ===");
    console.log("Count:", bus.length);
    if (bus.length > 0) console.log("Sample:", JSON.stringify(bus[0], null, 2));

    // Check Team
    const teams = await prisma.team.findMany({ take: 3 });
    console.log("\n=== Team records ===");
    console.log("Count:", teams.length);
    if (teams.length > 0) console.log("Sample:", JSON.stringify(teams[0], null, 2));

    // Check EmployeeType
    const etypes = await prisma.employeeType.findMany({ take: 3 });
    console.log("\n=== EmployeeType records ===");
    console.log("Count:", etypes.length);
    if (etypes.length > 0) console.log("Sample:", JSON.stringify(etypes[0], null, 2));

    // Check Employee
    const emps = await prisma.employee.findMany({ take: 2 });
    console.log("\n=== Employee records ===");
    console.log("Count:", emps.length);
    if (emps.length > 0) console.log("Sample:", JSON.stringify({ id: emps[0].id, mongoId: emps[0].mongoId, defaultShift: emps[0].defaultShift, organizationId: emps[0].organizationId }, null, 2));

    // Check Organization
    const orgs = await prisma.organization.findMany({ take: 3 });
    console.log("\n=== Organization records ===");
    console.log("Count:", orgs.length);
    if (orgs.length > 0) console.log("Sample:", JSON.stringify({ id: orgs[0].id, mongoId: orgs[0].mongoId, name: orgs[0].name, orgId: orgs[0].orgId }, null, 2));

    // Check ShiftRoster
    const rosters = await prisma.shiftRoster.findMany({ take: 3 });
    console.log("\n=== ShiftRoster records ===");
    console.log("Count:", rosters.length);
    if (rosters.length > 0) console.log("Sample:", JSON.stringify(rosters[0], null, 2));

    // Check HolidayList
    const hlists = await prisma.holidayList.findMany({ take: 3 });
    console.log("\n=== HolidayList records ===");
    console.log("Count:", hlists.length);
    if (hlists.length > 0) console.log("Sample:", JSON.stringify(hlists[0], null, 2));

    // Check Holiday
    const holidays = await prisma.holiday.findMany({ take: 3 });
    console.log("\n=== Holiday records ===");
    console.log("Count:", holidays.length);
    if (holidays.length > 0) console.log("Sample:", JSON.stringify(holidays[0], null, 2));

    // Check LeaveApplication
    const leaveApps = await prisma.leaveApplication.findMany({ take: 3 });
    console.log("\n=== LeaveApplication records ===");
    console.log("Count:", leaveApps.length);
    if (leaveApps.length > 0) console.log("Sample:", JSON.stringify(leaveApps[0], null, 2));

    // Check Attendance count
    const attCount = await prisma.attendance.count();
    console.log("\n=== Attendance count ===", attCount);

    // Check Leave count
    const leaveCount = await prisma.leave.count();
    console.log("=== Leave count ===", leaveCount);

    // Check Payslip count
    const payslipCount = await prisma.payslip.count();
    console.log("=== Payslip count ===", payslipCount);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
