const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncAniketSalary() {
  const emp = await prisma.employee.findFirst({
    where: { firstName: 'Aniket' }
  });
  
  if (!emp) {
    console.log("Employee Aniket not found");
    return;
  }
  
  const activeSalary = await prisma.payrollEmployeeSalary.findFirst({
    where: { employeeId: emp.id, status: 'Active' }
  });
  
  if (!activeSalary) {
    console.log("No active salary found for Aniket");
    return;
  }

  const payslipStructure = emp.payslipStructure || {};
  const newComponents = { BASIC: payslipStructure.basicSalary || activeSalary.basicSalary };
  
  if (Array.isArray(payslipStructure.earnings)) {
    payslipStructure.earnings.forEach(e => {
      if (e.enabled) {
        const amt = e.calculationType === 'percentage'
          ? (newComponents.BASIC * (e.percentage || 0)) / 100
          : (e.fixedAmount || 0);
        newComponents[e.code || e.name?.toUpperCase().replace(/ /g, '_')] = Math.round(amt);
      }
    });
  }
  
  if (Array.isArray(payslipStructure.deductions)) {
    payslipStructure.deductions.forEach(d => {
      if (d.enabled) {
        const amt = d.calculationType === 'percentage'
          ? (newComponents.BASIC * (d.percentage || 0)) / 100
          : (d.fixedAmount || 0);
        newComponents[d.code || d.name?.toUpperCase().replace(/ /g, '_')] = Math.round(amt);
      }
    });
  }

  await prisma.payrollEmployeeSalary.update({
    where: { id: activeSalary.id },
    data: {
      basicSalary: payslipStructure.basicSalary || activeSalary.basicSalary,
      grossSalary: payslipStructure.grossSalary || activeSalary.grossSalary,
      ctc: payslipStructure.ctc || activeSalary.ctc,
      componentValues: newComponents
    }
  });

  console.log("✅ Successfully synchronized active PayrollEmployeeSalary componentValues:", newComponents);
}

syncAniketSalary().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
