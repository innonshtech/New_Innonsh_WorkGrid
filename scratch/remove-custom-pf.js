const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeCustomPF() {
  // 1. Clean up Employee.payslipStructure
  const employees = await prisma.employee.findMany();
  for (const emp of employees) {
    if (emp.payslipStructure && typeof emp.payslipStructure === 'object') {
      const ps = emp.payslipStructure;
      if (Array.isArray(ps.deductions)) {
        const hasPF = ps.deductions.some(d => d.code === 'PF');
        if (hasPF) {
          const cleanDeductions = ps.deductions.filter(d => d.code !== 'PF');
          await prisma.employee.update({
            where: { id: emp.id },
            data: {
              payslipStructure: {
                ...ps,
                deductions: cleanDeductions
              }
            }
          });
          console.log(`Cleaned up Employee payslipStructure for: ${emp.firstName} ${emp.lastName}`);
        }
      }
    }
  }

  // 2. Clean up PayrollEmployeeSalary.componentValues
  const assignments = await prisma.payrollEmployeeSalary.findMany({
    where: { status: 'Active' }
  });

  for (const assign of assignments) {
    if (assign.componentValues && typeof assign.componentValues === 'object') {
      const cv = assign.componentValues;
      if (cv.PF !== undefined) {
        const newComponents = { ...cv };
        delete newComponents.PF;
        
        await prisma.payrollEmployeeSalary.update({
          where: { id: assign.id },
          data: {
            componentValues: newComponents
          }
        });
        console.log(`Removed static PF from active PayrollEmployeeSalary assignment ID: ${assign.id}`);
      }
    }
  }
  console.log("✅ Cleanup finished!");
}

removeCustomPF().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
