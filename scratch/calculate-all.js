const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');

function fetchPreview(empId) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3000/api/test-calc?employeeId=${empId}&month=6&year=2026`, {
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const orgs = await prisma.organization.findMany({
    where: { name: { contains: 'Innonsh', mode: 'insensitive' } }
  });
  
  if (orgs.length === 0) {
    console.log("Organization not found");
    return;
  }
  const orgId = orgs[0].id;
  
  const employees = await prisma.employee.findMany({
    where: { organizationId: orgId },
    select: { id: true, firstName: true, lastName: true, employeeId: true }
  });
  
  console.log(`Found ${employees.length} employees. Running previews...`);
  
  const results = [];
  
  for (const emp of employees) {
    try {
      const result = await fetchPreview(emp.id);
      if (result.error) throw new Error(result.error);
      
      const calc = result.calculationResult;
      
      results.push({
        id: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`,
        gross: calc.grossSalary || 0,
        deductions: calc.totalDeductions || 0,
        tds: calc.taxDeducted || 0,
        net: calc.netSalary || 0
      });
    } catch (err) {
      console.log(`❌ Error for ${emp.firstName}: ${err.message}`);
    }
  }
  
  console.log("\n### Payroll Estimates (June 2026)\n");
  console.log("| Emp ID | Name | Gross Salary | Total Deductions | TDS | **Net Salary** |");
  console.log("|---|---|---|---|---|---|");
  for (const r of results) {
    console.log(`| ${r.id} | ${r.name} | ₹${r.gross.toFixed(2)} | ₹${r.deductions.toFixed(2)} | ₹${r.tds.toFixed(2)} | **₹${r.net.toFixed(2)}** |`);
  }
}

main().finally(() => prisma.$disconnect());
