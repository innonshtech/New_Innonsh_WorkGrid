const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const orgCount = await prisma.organization.count();
    const userCount = await prisma.user.count();
    const employeeCount = await prisma.employee.count();
    const attendanceCount = await prisma.attendance.count();
    const leaveCount = await prisma.leave.count();
    const ticketCount = await prisma.helpdeskTicket.count();
    const projectCount = await prisma.project.count();
    const taskCount = await prisma.task.count();
    const shiftCount = await prisma.workingShift.count();

    console.log("=== Counts ===");
    console.log("Organizations:", orgCount);
    console.log("Users:", userCount);
    console.log("Employees:", employeeCount);
    console.log("Attendances:", attendanceCount);
    console.log("Leaves:", leaveCount);
    console.log("Tickets:", ticketCount);
    console.log("Projects:", projectCount);
    console.log("Tasks:", taskCount);
    console.log("Shifts:", shiftCount);

    if (userCount > 0) {
      console.log("\n=== Sample Users ===");
      const users = await prisma.user.findMany({ take: 3 });
      console.log(JSON.stringify(users.map(u => ({ id: u.id, mongoId: u.mongoId, email: u.email, role: u.role, organizationId: u.organizationId })), null, 2));
    }

    if (employeeCount > 0) {
      console.log("\n=== Sample Employees ===");
      const employees = await prisma.employee.findMany({ take: 3 });
      console.log(JSON.stringify(employees.map(e => ({ id: e.id, mongoId: e.mongoId, employeeId: e.employeeId, email: e.email, organizationId: e.organizationId })), null, 2));
    }

  } catch (error) {
    console.error("Error inspecting database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
