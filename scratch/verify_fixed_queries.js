const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runVerification() {
  console.log("🚀 Starting database query verification...");

  try {
    console.log("\n1. Verifying Department query (flat)...");
    const department = await prisma.department.findFirst();
    console.log("✅ Department query successful:", department ? `Found ID: ${department.id}` : "No records found");
  } catch (error) {
    console.error("❌ Department query failed:", error);
  }

  try {
    console.log("\n2. Verifying Leave query (with flat Employee select)...");
    const leave = await prisma.leave.findFirst({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
            status: true,
            id: true,
            mongoId: true
          }
        }
      }
    });
    console.log("✅ Leave query successful:", leave ? `Found ID: ${leave.id}` : "No records found");
  } catch (error) {
    console.error("❌ Leave query failed:", error);
  }

  try {
    console.log("\n3. Verifying Attendance query (with flat Employee select)...");
    const attendance = await prisma.attendance.findFirst({
      include: {
        employee: {
          select: {
            id: true,
            mongoId: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            organizationId: true,
            organization: { select: { name: true } }
          }
        }
      }
    });
    console.log("✅ Attendance query successful:", attendance ? `Found ID: ${attendance.id}` : "No records found");
  } catch (error) {
    console.error("❌ Attendance query failed:", error);
  }

  try {
    console.log("\n4. Verifying Bonus query (flat)...");
    const bonus = await prisma.bonus.findFirst();
    console.log("✅ Bonus query successful:", bonus ? `Found ID: ${bonus.id}` : "No records found");
  } catch (error) {
    console.error("❌ Bonus query failed:", error);
  }

  try {
    console.log("\n5. Verifying LeaveApplication query (flat)...");
    const leaveApp = await prisma.leaveApplication.findFirst();
    console.log("✅ LeaveApplication query successful:", leaveApp ? `Found ID: ${leaveApp.id}` : "No records found");
  } catch (error) {
    console.error("❌ LeaveApplication query failed:", error);
  }

  await prisma.$disconnect();
  console.log("\n🏁 Verification finished.");
}

runVerification();
