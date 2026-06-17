const fs = require('fs');
let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

// Change default viewMode to daily
content = content.replace('const [viewMode, setViewMode] = useState("weekly");', 'const [viewMode, setViewMode] = useState("daily");');

fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
console.log('Default viewMode changed to daily');
