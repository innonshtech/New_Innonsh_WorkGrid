const fs = require('fs');

let calc = fs.readFileSync('src/app/api/v1/admin/payroll/v2/runs/[id]/calculate/route.js', 'utf8');
let route = fs.readFileSync('src/app/api/v1/admin/payroll/v2/runs/[id]/route.js', 'utf8');

// Remove duplicate imports
calc = calc.replace(/import \{ NextResponse \} from 'next\/server';\r?\n/g, '');
calc = calc.replace(/import prisma from '@\/lib\/db\/prisma';\r?\n/g, '');
calc = calc.replace(/import \{ getAuthUser, authorize \} from "@\/lib\/auth-util";\r?\n/g, '');

// If it already appended, let's just make sure we only have one POST method.
if (!route.includes('export async function POST')) {
  fs.writeFileSync('src/app/api/v1/admin/payroll/v2/runs/[id]/route.js', route + '\n\n' + calc);
} else {
  console.log('POST already exists');
}
