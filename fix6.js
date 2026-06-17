const fs = require('fs');
let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

const regex = /\{user\?\.role === 'employee' && \(\s*<div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">[\s\S]*?<h2 className="text-lg font-black text-slate-900">Overtime Earnings<\/h2>[\s\S]*?<\/table>\s*\)\}\s*<\/div>\s*<\/div>\s*\)\}/;

const match = content.match(regex);
if (match) {
    content = content.replace(regex, '');
    fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
    console.log('Removed Overtime Earnings block');
} else {
    console.log('Not found');
}
