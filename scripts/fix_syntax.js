const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/api/**/*.js');
let count = 0;

files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    let o = c;

    // Fix corrupted Date and toLowerCase methods
    c = c.replace(/Date\.now\(\s*\}\)/g, 'Date.now()');
    c = c.replace(/\.toLowerCase\(\s*\}\)/g, '.toLowerCase()');
    c = c.replace(/new Date\(\s*\}\)/g, 'new Date()');
    c = c.replace(/\.toString\(\s*\}\)/g, '.toString()');
    
    // Fix duplicate imports
    c = c.replace(/import prisma from \'\@\/lib\/db\/prisma\';\r?\nimport prisma from \'\@\/lib\/db\/prisma\';/g, 'import prisma from \'@/lib/db/prisma\';');
    c = c.replace(/import prisma from \"\@\/lib\/db\/prisma\";\r?\nimport prisma from \'\@\/lib\/db\/prisma\';/g, 'import prisma from \'@/lib/db/prisma\';');

    // Fix bad regex match corruptions
    c = c.replace(/findMany\(\{ where: \{\}, "employeeId" \}\)/g, 'findMany({ where: {} })');
    c = c.replace(/approvalprisma\.chain/g, 'approvalChain');
    c = c.replace(/existingprisma\.runs\.findMany\(\{ where: (.*?) \}\)/g, 'existingRuns.find($1)');
    c = c.replace(/approvalChain\.findMany\(\{ where: (.*?) \}\)/g, 'approvalChain.find($1)');
    
    // Fix missing closing braces on lean() or populate corruptions
    c = c.replace(/lean\(\),\r?\n/g, 'lean(),\n');
    c = c.replace(/\{ where: \{\}, \"employeeId\"/g, '{ where: {}');

    // Fix sort corruption (report => b.utilizationPercentage - a.utilizationPercentage);)
    // Wait, I fixed that manually, so it's fine.

    if(c !== o) {
        fs.writeFileSync(f, c, 'utf8');
        count++;
    }
});

console.log('Fixed files:', count);
