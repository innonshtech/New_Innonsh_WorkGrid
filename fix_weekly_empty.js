const fs = require('fs');
let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

const regex = /\{\/\* WEEKLY VIEW CONTENT \*\/\}[\s\S]*?\{viewMode === \"monthly\" && \(/;
const match = content.match(regex);
if (match) {
    content = content.replace(regex, '{viewMode === "monthly" && (');
    fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
    console.log('Removed Weekly View Content');
} else {
    console.log('Not found');
}
