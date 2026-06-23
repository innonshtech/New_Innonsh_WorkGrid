const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearEmployeeData() {
  console.log('Clearing Employee Side Data...');
  try {
    // 1. Clear Investment Declarations (Tax Declarations)
    await prisma.investmentDeclaration.deleteMany({});
    console.log('Cleared all InvestmentDeclarations (Tax Declarations).');
    
    // 2. Clear Employee Salary Assignments
    await prisma.payrollEmployeeSalary.deleteMany({});
    console.log('Cleared all PayrollEmployeeSalary assignments.');

    // 3. Reset Employee cache and statutory fields
    await prisma.employee.updateMany({
      data: {
        payslipStructure: null,
        variablePayStructure: null,
        taxRegime: 'new',
        pfApplicable: 'no',
        esicApplicable: 'no',
        isTDSApplicable: false,
        gratuityApplicable: 'no'
      }
    });
    console.log('Reset Employee payslip structures and statutory toggles.');

    console.log('Employee side data cleared successfully! Master templates & components remain intact.');
  } catch (error) {
    console.error('Error wiping employee data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearEmployeeData();
