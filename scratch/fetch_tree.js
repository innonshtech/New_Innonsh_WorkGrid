const http = require('http');

http.get('http://localhost:3000/api/v1/admin/organizations/tree', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    const parsed = JSON.parse(data);
    console.log("Tree:", JSON.stringify(parsed, null, 2));
  });
}).on('error', err => {
  console.log("Error:", err.message);
});
