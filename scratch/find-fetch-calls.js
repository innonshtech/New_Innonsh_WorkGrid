const fs = require('fs');

const content = fs.readFileSync('src/components/payroll/v2/PayrollMasterPortal.jsx', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('action') || line.includes('runs') || line.includes('fetch') || line.includes('POST')) {
    if (line.includes('v2') || line.includes('api')) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
    }
  }
}
