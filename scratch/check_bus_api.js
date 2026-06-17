const http = require('http');

http.get('http://localhost:3000/api/v1/admin/crm/business-units?organizationId=1713d3da-2293-43c2-a7f9-c15a35b9c453&limit=100', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log("API Response:");
    console.log(data);
  });
}).on('error', err => {
  console.log("Error:", err.message);
});
