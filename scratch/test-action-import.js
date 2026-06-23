const path = require('path');
const fs = require('fs');

async function main() {
  console.log('Testing import of route.js...');
  try {
    // Since Next.js uses Babel/Webpack/Mjs, we might get errors. Let's see if we can do a simple require or inspect imports.
    const fileContent = fs.readFileSync('src/app/api/v1/admin/payroll/v2/runs/[id]/action/route.js', 'utf8');
    console.log('File read successfully. Length:', fileContent.length);
    
    // Check for obvious syntax errors
    const esprima = require('esprima'); // might not be installed, let's check or use standard node parser
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
