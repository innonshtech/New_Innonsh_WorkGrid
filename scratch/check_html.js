const http = require('http');

http.get('http://localhost:3000/admin/employees/d0dd3bd9-ec59-4058-be26-f404d98fa50b/edit', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    // print the index where Sakshi appears and a snippet around it
    const index = data.indexOf("Sakshi");
    if (index !== -1) {
        console.log(data.substring(Math.max(0, index - 100), Math.min(data.length, index + 100)));
    } else {
        console.log("Not found");
    }
  });
}).on('error', err => {
  console.log("Error:", err.message);
});
