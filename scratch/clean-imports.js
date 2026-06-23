const fs = require('fs');
let route = fs.readFileSync('src/app/api/v1/admin/payroll/v2/runs/[id]/route.js', 'utf8');

// Strip out duplicate Next imports
route = route.replace(/import \{ NextResponse \} from 'next\/server';/g, '');
route = route.replace(/import prisma from '@\/lib\/db\/prisma';/g, '');
route = route.replace(/import \{ getAuthUser, authorize \} from "@\/lib\/auth-util";/g, '');

const finalFile = `import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
${route}`;

fs.writeFileSync('src/app/api/v1/admin/payroll/v2/runs/[id]/route.js', finalFile);
console.log('Fixed imports');
