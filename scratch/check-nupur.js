const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNupur() {
  // Try different name patterns
  const emps = await prisma.employee.findMany({
    where: {
      OR: [
        { firstName: { contains: 'Nupur', mode: 'insensitive' } },
        { firstName: { contains: 'nupur', mode: 'insensitive' } },
        { employeeId: 'INN014' }
      ]
    }
  });
  
  if (emps.length === 0) return console.log('Not found');
  
  const emp = emps[0];
  console.log('=== EMPLOYEE ===');
  console.log('ID:', emp.id);
  console.log('Name:', emp.firstName, emp.lastName);
  console.log('EmpId:', emp.employeeId);
  console.log('Tax Regime:', emp.taxRegime);
  console.log('Gross (legacy):', emp.payslipStructure?.grossSalary);
  
  // Check salary assignment
  const assignment = await prisma.payrollEmployeeSalary.findFirst({
    where: { employeeId: emp.id, status: 'Active' },
    orderBy: { effectiveFrom: 'desc' }
  });
  
  if (assignment) {
    console.log('\n=== SALARY ASSIGNMENT ===');
    console.log('CTC:', assignment.ctc);
    console.log('Gross:', assignment.grossSalary);
    console.log('Basic:', assignment.basicSalary);
    console.log('Components:', JSON.stringify(assignment.componentValues, null, 2));
  } else {
    console.log('\nNo salary assignment');
  }

  // Check latest payroll run result
  const runEmp = await prisma.payrollRunEmployee.findFirst({
    where: { employeeId: emp.id },
    orderBy: { calculatedAt: 'desc' }
  });
  if (runEmp) {
    console.log('\n=== LATEST RUN RESULT ===');
    console.log('Payroll Days:', runEmp.payrollDays);
    console.log('Payable Days:', runEmp.payableDays);
    console.log('LOP Days:', runEmp.lopDays);
    console.log('Gross Earnings:', runEmp.grossEarnings);
    console.log('Total Earnings:', runEmp.totalEarnings);
    console.log('Total Deductions:', runEmp.totalDeductions);
    console.log('Net Salary:', runEmp.netSalary);
    console.log('Total Tax:', runEmp.totalTax);
    console.log('Earnings:', JSON.stringify(runEmp.earningsBreakdown));
    console.log('Deductions:', JSON.stringify(runEmp.deductionsBreakdown));
    console.log('Tax:', JSON.stringify(runEmp.taxBreakdown));
    console.log('Statutory:', JSON.stringify(runEmp.statutoryBreakdown));
  }
}

checkNupur().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
