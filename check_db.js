const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const orgs = await prisma.organization.findMany();
    console.log("=== Organizations ===");
    console.log(JSON.stringify(orgs, null, 2));

    const users = await prisma.user.findMany();
    console.log("\n=== Users ===");
    console.log(JSON.stringify(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, organizationId: u.organizationId })), null, 2));

    const employees = await prisma.employee.findMany();
    console.log("\n=== Employees ===");
    console.log(JSON.stringify(employees.map(e => ({ id: e.id, employeeId: e.employeeId, firstName: e.firstName, lastName: e.lastName, organizationId: e.organizationId })), null, 2));

    const projects = await prisma.project.findMany();
    console.log("\n=== Projects ===");
    console.log(JSON.stringify(projects, null, 2));

    const tasks = await prisma.task.findMany();
    console.log("\n=== Tasks ===");
    console.log(JSON.stringify(tasks, null, 2));

  } catch (error) {
    console.error("Error inspecting database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
