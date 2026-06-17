const http = require('http');

http.get('http://localhost:3000/api/v1/admin/crm/banks?limit=1000', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    console.log("Body:", data.substring(0, 1000));
  });
}).on('error', err => {
  console.log("Error:", err.message);
});
