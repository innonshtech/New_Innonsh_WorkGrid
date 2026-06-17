const http = require('http');

http.get('http://localhost:3000/admin/employees/d0dd3bd9-ec59-4058-be26-f404d98fa50b/edit', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    if (res.statusCode === 500) {
       console.log(data);
    } else {
       console.log("Response length:", data.length);
       // look for Sakshi in data
       console.log("Contains Sakshi?", data.includes("Sakshi"));
    }
  });
}).on('error', err => {
  console.log("Error:", err.message);
});
