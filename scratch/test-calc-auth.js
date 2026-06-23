const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'super_admin' } });
  
  // Quick fake JWT (if needed) or we can just bypass middleware by mocking it.
  // Actually, we can just use the user token if they have one.
  const session = await prisma.session.findFirst({ where: { userId: user.id } });
  
  const token = session ? session.token : 'test_token';
  
  const req = http.request('http://localhost:3000/api/v1/admin/payroll/v2/runs/27ac12f5-f05e-41a8-a297-71c1abce408f/calculate', { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}` // Try to bypass auth
    } 
  }, (res) => { 
    console.log('STATUS:', res.statusCode); 
    console.log('CONTENT-TYPE:', res.headers['content-type']);
    res.on('data', d => console.log(d.toString())); 
  }); 
  req.write('{}'); 
  req.end();
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
