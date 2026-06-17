const fs = require('fs');
const path = require('path');
function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(/[a-zA-Z0-9_\-]+:?[0-9_]+px_[0-9_]+px_[a-zA-Z0-9_,().]+\]/g, '');
    newContent = newContent.replace(/[0-9_]+px_[0-9_]+px_[a-zA-Z0-9_,().]+\]/g, '');
    newContent = newContent.replace(/hover:\s+hover:\s+/g, '');
    if(newContent !== content) {
        fs.writeFileSync(file, newContent);
        console.log('Fixed ' + file);
    }
}
const files = [
    'src/app/admin/change-password/page.jsx',
    'src/app/employee/dashboard/page.jsx',
    'src/app/employee/timesheets/page.jsx',
    'src/components/payroll/EmployeeAttendanceView.jsx',
    'src/components/recruitment/ats-system.jsx',
    'src/components/recruitment/interview-scheduler.jsx',
    'src/components/recruitment/recruitment-hub.jsx'
];
files.forEach(f => fixFile(path.join(__dirname, f)));
