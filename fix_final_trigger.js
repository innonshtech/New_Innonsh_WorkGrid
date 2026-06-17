const fs = require('fs');
let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

// Replace the useEffect dependency correctly using regex
const regex = /useEffect\(\(\) => \{\s*if \(viewMode === \"weekly\"\) \{\s*fetchAttendance\(\);\s*\}\s*\}, \[selectedDate, selectedOrganization, viewMode\]\);/;

const match = content.match(regex);
if (match) {
  content = content.replace(regex, 'useEffect(() => { if (viewMode === "weekly" || viewMode === "daily") { fetchAttendance(); } }, [selectedDate, selectedOrganization, viewMode]);');
  fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
  console.log('Fixed trigger for real!');
} else {
  console.log('Regex did not match! Let us try another regex.');
  const backupRegex = /if \(viewMode === "weekly"\) \{\s*fetchAttendance\(\);\s*\}/g;
  let matches = content.match(backupRegex);
  console.log("Matches found:", matches ? matches.length : 0);
  
  if (matches) {
    // Only replace the one inside the useEffect
    const parts = content.split('useEffect(() => {');
    for (let i = 1; i < parts.length; i++) {
        if (parts[i].includes('fetchAttendance();') && parts[i].includes('[selectedDate, selectedOrganization, viewMode]')) {
            parts[i] = parts[i].replace(/if \(viewMode === "weekly"\) \{/, 'if (viewMode === "weekly" || viewMode === "daily") {');
        }
    }
    content = parts.join('useEffect(() => {');
    fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
    console.log('Fixed trigger using fallback method!');
  }
}
