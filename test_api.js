const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/admin/payroll/v2/runs/e454d0c0-309c-41b0-951c-ee9c0a8cf9f0/action',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Body:', data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify({ action: 'SUBMIT_APPROVAL' }));
req.end();
