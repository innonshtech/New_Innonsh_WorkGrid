const http = require('http');

http.get('http://localhost:3000/api/v1/admin/crm/teams?departmentId=6a05633bc4ccab14267355ad&limit=100', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(data);
  });
}).on('error', err => {
  console.log("Error:", err.message);
});
