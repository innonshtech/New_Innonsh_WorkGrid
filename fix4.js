const fs = require('fs');
let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

const regex = /(<MarkAttendance onAttendanceMarked=\{fetchAttendance\} \/>[\s\S]*?<\/[dD]iv>\s*\)\})([\s\S]*?)(\{\/\* Professional Filters \*\/})/m;
const match = content.match(regex);
if (match) {
    content = content.replace(regex, '$1\n\n        $3');
    fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
    console.log('Successfully removed the broken fragment!');
} else {
    console.log('Match not found.');
}
