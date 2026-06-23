const fs = require('fs');
const path = require('path');

const dir = 'src/app/api/v1/admin/payroll/v2/runs';
const files = fs.readdirSync(dir);
for (const file of files) {
  console.log(`File: "${file}"`);
  for (let i = 0; i < file.length; i++) {
    console.log(`  char[${i}] = '${file[i]}' (code: ${file.charCodeAt(i)})`);
  }
}
