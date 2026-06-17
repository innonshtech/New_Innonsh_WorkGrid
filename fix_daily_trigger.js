const fs = require('fs');
let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

content = content.replace('if (viewMode === "weekly") {', 'if (viewMode === "weekly" || viewMode === "daily") {');

fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
console.log('Fixed fetchAttendance trigger for daily viewMode');
