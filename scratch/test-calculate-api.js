const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const secret = '50560daf592e4a3fd93fc1ed75e13ebb88425fab6a5357024f126f8148ab9efe';

async function main() {
  const run = await prisma.payrollRunV2.findFirst({});
  if (!run) {
    console.error('No payroll run found');
    return;
  }
  
  const payload = {
    id: 'f9999999-9999-9999-9999-999999999999',
    role: 'admin',
    organizationId: run.organizationId,
    email: 'test-admin@example.com'
  };
  
  const token = jwt.sign(payload, secret);
  
  console.log(`Using Run ID: ${run.id} (Org ID: ${run.organizationId})`);
  console.log(`Sending POST request with token to localhost:3000/api/v1/admin/payroll/v2/runs/${run.id}/calculate...`);
  
  try {
    const res = await fetch(`http://localhost:3000/api/v1/admin/payroll/v2/runs/${run.id}/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${token}`
      },
      body: JSON.stringify({
        employeeId: 'some-emp-id-to-test'
      })
    });
    
    console.log('Response Status:', res.status);
    const json = await res.json();
    console.log('Response Body:');
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

main().finally(() => setTimeout(() => prisma.$disconnect(), 1000));
