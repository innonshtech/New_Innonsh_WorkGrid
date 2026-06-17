const fs = require('fs');
let content = fs.readFileSync('src/components/payroll/attendance/EmployeeDetailsDrawer.jsx', 'utf8');

content = content.replace('grid-cols-3', 'grid-cols-2');

const overtimeRegex = /<div>\s*<p className="text-\[10px\] font-bold text-indigo-200 uppercase">Overtime<\/p>[\s\S]*?<\/div>/;
content = content.replace(overtimeRegex, '');

fs.writeFileSync('src/components/payroll/attendance/EmployeeDetailsDrawer.jsx', content);
console.log('Overtime removed from drawer');
