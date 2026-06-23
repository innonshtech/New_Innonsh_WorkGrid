const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const secret = '50560daf592e4a3fd93fc1ed75e13ebb88425fab6a5357024f126f8148ab9efe';

async function main() {
  const aniket = await prisma.employee.findFirst({ where: { employeeId: 'INN004' } });
  if (!aniket) {
    console.error('Aniket (INN004) not found');
    return;
  }
  
  // Use a non-existent user ID so getAuthUser doesn't overwrite organizationId from DB
  const payload = {
    id: 'f9999999-9999-9999-9999-999999999999',
    role: 'admin',
    organizationId: aniket.organizationId,
    email: 'test-admin@example.com'
  };
  
  const token = jwt.sign(payload, secret);
  
  console.log(`Using Aniket ID: ${aniket.id} (Org ID: ${aniket.organizationId})`);
  console.log(`Sending request with token to localhost:3000...`);
  
  try {
    const res = await fetch('http://localhost:3000/api/v1/admin/payroll/v2/calculate-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${token}`
      },
      body: JSON.stringify({
        employeeId: aniket.id,
        month: 6,
        year: 2026
      })
    });
    
    console.log('Response Status:', res.status);
    const json = await res.json();
    console.log('Response Body:');
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Fetch failed. Is the server running? Error:', err.message);
  }
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
