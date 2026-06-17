const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const runs = await prisma.payrollRun.findMany();
    console.log("=== Payroll Runs ===");
    console.log(JSON.stringify(runs, null, 2));

    const payslips = await prisma.payslip.findMany();
    console.log("\n=== Payslips ===");
    console.log(JSON.stringify(payslips.map(p => ({
      id: p.id,
      payslipId: p.payslipId,
      employeeId: p.employeeId,
      payrollRunId: p.payrollRunId,
      month: p.month,
      year: p.year,
      status: p.status
    })), null, 2));

  } catch (error) {
    console.error("Error inspecting database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
