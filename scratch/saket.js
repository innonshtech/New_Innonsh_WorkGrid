const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');

async function main() {
  const saket = await prisma.employee.findFirst({ where: { employeeId: 'INN005' }});
  if (!saket) return;
  http.get('http://localhost:3000/api/test-calc?employeeId=' + saket.id, (res) => {
    let data = '';
    res.on('data', c => data+=c);
    res.on('end', () => console.log(JSON.stringify(JSON.parse(data).calculationResult, null, 2)));
  });
}

main().finally(() => setTimeout(()=>prisma.$disconnect(), 2000));
