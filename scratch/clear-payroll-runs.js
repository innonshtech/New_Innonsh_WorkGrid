const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearData() {
  console.log('Clearing Payroll Runs Data...');
  try {
    await prisma.payrollRunEmployee.deleteMany({});
    console.log('Deleted all PayrollRunEmployee records.');
    
    await prisma.payrollRunV2.deleteMany({});
    console.log('Deleted all PayrollRunV2 records.');
    
    // Also clear other V2 transactions just in case
    await prisma.payrollWorkflowStep.deleteMany({});
    await prisma.payrollWorkflowInstance.deleteMany({});
    await prisma.payrollQueryComment.deleteMany({});
    await prisma.payrollQuery.deleteMany({});
    
    // Clear legacy structure caches on employees (to simulate fresh start)
    await prisma.employee.updateMany({
      data: {
        payslipStructure: null,
        variablePayStructure: null
      }
    });
    console.log('Cleared employee cache structures.');

    console.log('Payroll data wiped successfully!');
  } catch (error) {
    console.error('Error wiping data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
