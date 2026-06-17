const fs = require('fs');

let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

// 1. Replace the Blue Banner with the Simple Header
const bannerStartStr = '<div className="relative overflow-hidden bg-gradient-to-r';
const bannerStart = content.indexOf(bannerStartStr);
if (bannerStart === -1) {
    console.error("Could not find banner start!");
    process.exit(1);
}

const bannerEndRegex = /<\/div>\s*<\/div>\s*<\/div>\s*{?\/\* Mark Attendance Section/m;
const match = content.match(bannerEndRegex);
if (!match) {
    console.error("Could not find banner end!");
    process.exit(1);
}
const bannerEnd = match.index;

const simpleHeader = `
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isAdminView ? "Attendance Management" : "My Attendance Dashboard"}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAdminView 
                ? "Track and manage employee attendance records, handle status corrections, and export complete statutory logs." 
                : "View clock-in schedules, analyze monthly hours, and submit regularization requests instantly."
              }
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                router.push(isEmployeeView ? '/employee/attendance/add-attendance' : "/admin/attendance/add-attendance")
              }
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Entry
            </button>
          </div>
        </div>

        `;

content = content.slice(0, bannerStart) + simpleHeader + content.slice(bannerEnd);


// 2. Remove View Mode Toggle
const toggleStart = content.indexOf('{/* View Mode Toggle */}');
if (toggleStart !== -1) {
    const toggleEndRegex = /<\/div>\s*<\/div>\s*<\/div>\s*{?\/\* Professional Attendance Analytics/m;
    const tMatch = content.match(toggleEndRegex);
    if (tMatch) {
        content = content.slice(0, toggleStart) + content.slice(tMatch.index);
    } else {
        console.error("Could not find View Mode Toggle end");
        process.exit(1);
    }
}

// 3. Remove KPI Cards
const kpiStart = content.indexOf('{/* Professional Attendance Analytics */}');
if (kpiStart !== -1) {
    const kpiEndIdx = content.indexOf('/>', kpiStart);
    if (kpiEndIdx !== -1) {
        content = content.slice(0, kpiStart) + content.slice(kpiEndIdx + 2);
    }
}

// 4. Remove Organization Grouping Toggle
const orgToggleStart = content.indexOf('{/* Organization Grouping Toggle */}');
if (orgToggleStart !== -1) {
    const orgToggleEndRegex = /<\/div>\s*<\/div>\s*\)}\s*{?\/\* Professional Filters/m;
    const orgMatch = content.match(orgToggleEndRegex);
    if (orgMatch) {
        content = content.slice(0, orgToggleStart) + content.slice(orgMatch.index);
    } else {
        console.error("Could not find org toggle end");
        process.exit(1);
    }
}

// 5. Replace AttendanceFilters with custom filter bar
const filterRegex = /<AttendanceFilters[\s\S]*?\/>/;
const newFilterBar = `
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 mb-8 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search employee or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700">
              {new Date(selectedDate).toLocaleDateString('en-GB')} 
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("weekly")}
                className={\`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 \${
                  viewMode === "weekly"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }\`}
              >
                <Clock className="w-4 h-4" />
                Week
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={\`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 \${
                  viewMode === "monthly"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }\`}
              >
                <Calendar className="w-4 h-4" />
                Month
              </button>
            </div>

            <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none">
              <option value="All Statuses">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>

            <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
`;
if (content.match(filterRegex)) {
    content = content.replace(filterRegex, newFilterBar);
}

// 6. Replace Weekly View with the flat cards.
const weeklyContentStart = content.indexOf('{/* WEEKLY VIEW CONTENT */}');
if (weeklyContentStart !== -1) {
    const weeklyContentEnd = content.indexOf('{/* MONTHLY VIEW CONTENT */}');
    if (weeklyContentEnd !== -1) {
        const flatCardsCode = `{/* WEEKLY VIEW CONTENT */}
        {viewMode === "weekly" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 space-y-4">
              {getMonthlyAttendanceByEmployee()
                .filter((empData) => {
                  const fullName = \`\${empData.employee.personalDetails?.firstName} \${empData.employee.personalDetails?.lastName}\`.toLowerCase();
                  const employeeId = empData.employee.employeeId?.toLowerCase() || "";
                  return (
                    (searchTerm === "" || fullName.includes(searchTerm.toLowerCase()) || employeeId.includes(searchTerm.toLowerCase())) &&
                    (selectedOrganization === "" || empData.employee.jobDetails?.organization === selectedOrganization)
                  );
                })
                .map((empData) => (
                  <div key={empData.employee._id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex items-center p-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mr-4">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900">
                        {empData.employee.personalDetails?.firstName} {empData.employee.personalDetails?.lastName}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500">ID: {empData.employee.employeeId || "N/A"}</p>
                    </div>
                  </div>
                ))}
              {getMonthlyAttendanceByEmployee().length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-500 font-medium">No attendance records found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        `;
        content = content.slice(0, weeklyContentStart) + flatCardsCode + content.slice(weeklyContentEnd);
    } else {
        console.error("Could not find Monthly View Content to slice Weekly!");
        process.exit(1);
    }
} else {
    console.error("Could not find Weekly View Content start!");
    process.exit(1);
}

// 7. Remove Overtime Earnings section
const otStartIdx = content.indexOf("{user?.role === 'employee' && (\\n        <div className=\\\"bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8\\\">");
if (otStartIdx !== -1) {
    const showRegStartIdx = content.indexOf('{showRegModal &&', otStartIdx);
    if (showRegStartIdx !== -1) {
        content = content.slice(0, otStartIdx) + content.slice(showRegStartIdx);
    }
}


fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
console.log("SUCCESS!");
