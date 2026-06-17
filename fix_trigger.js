const fs = require('fs');
let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

// Replace the useEffect for weekly to include daily
const oldUseEffect = `  useEffect(() => {
    if (viewMode === "weekly") {
      fetchAttendance();
    }
  }, [selectedDate, selectedOrganization, viewMode]);`;

const newUseEffect = `  useEffect(() => {
    if (viewMode === "weekly" || viewMode === "daily") {
      fetchAttendance();
    }
  }, [selectedDate, selectedOrganization, viewMode]);`;

content = content.replace(oldUseEffect, newUseEffect);

// Also revert the accidental change
const oldElseIf = `if (viewMode === "daily") {
        params.append("date", selectedDate);
      } else if (viewMode === "weekly" || viewMode === "daily") {`;

const newElseIf = `if (viewMode === "daily") {
        params.append("date", selectedDate);
      } else if (viewMode === "weekly") {`;

content = content.replace(oldElseIf, newElseIf);

fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
console.log('Fixed useEffect trigger properly!');
