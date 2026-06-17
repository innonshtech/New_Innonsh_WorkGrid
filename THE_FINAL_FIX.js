const fs = require('fs');

let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

// 1. Replace the Blue Banner with the Simple Header
const bannerStart = content.indexOf('<div className="relative overflow-hidden bg-gradient-to-r');
if (bannerStart !== -1) {
    const bannerEndStr = '</div>\\n        </div>';
    const bannerEnd = content.indexOf(bannerEndStr, bannerStart) + bannerEndStr.length;
    
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
}

// 2. Remove the "View Mode Toggle" (Weekly Rollup / Monthly Summary) because the filter bar has the Week/Month toggle.
// Looking at the second image, there is NO separate view mode toggle.
const toggleStart = content.indexOf('{/* View Mode Toggle */}');
if (toggleStart !== -1) {
    const toggleEnd = content.indexOf('</div>\\n        </div>', toggleStart) + 21;
    content = content.slice(0, toggleStart) + content.slice(toggleEnd);
}


// 3. Remove KPI Cards (`<AttendanceAnalytics />`)
const kpiStart = content.indexOf('{/* Professional Attendance Analytics */}');
if (kpiStart !== -1) {
    const kpiEnd = content.indexOf('/>', kpiStart) + 2;
    content = content.slice(0, kpiStart) + content.slice(kpiEnd);
}

// 4. Remove Organization Grouping Toggle
const orgToggleStart = content.indexOf('{/* Organization Grouping Toggle */}');
if (orgToggleStart !== -1) {
    // Finds the closing )} of the condition `{organizations.length > 1 && (`
    const orgToggleEndStr = '\\n          </div>\\n        )}';
    let orgToggleEnd = content.indexOf(orgToggleEndStr, orgToggleStart);
    if (orgToggleEnd !== -1) {
        orgToggleEnd += orgToggleEndStr.length;
        content = content.slice(0, orgToggleStart) + content.slice(orgToggleEnd);
    }
}

// 5. Remove "Weekly Attendance" header row in the Weekly View
const weeklyTitleStart = content.indexOf('<div className="p-6 border-b border-slate-200">');
if (weeklyTitleStart !== -1) {
    // Find the end of this div block. It ends just before `<div className="p-6 space-y-4">`
    const weeklyTitleEnd = content.indexOf('<div className="p-6 space-y-4">', weeklyTitleStart);
    if (weeklyTitleEnd !== -1) {
        content = content.slice(0, weeklyTitleStart) + content.slice(weeklyTitleEnd);
    }
}

// 6. Flatten the Employee List in the Weekly View (remove Innonsh Technologies accordion).
// Actually, the user's Image 2 shows the Innonsh Technologies wrapper!
// But wait, the user's instructions literally said: "remove innonsh tecnologies row".
// I will REPLACE the entire Weekly View card map to just be flat cards.
const flatCardsCode = `
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
`;

// Replace from `<div className="p-6 space-y-4">` to the end of the Weekly view.
const weeklyContentStart = content.indexOf('<div className="p-6 space-y-4">');
if (weeklyContentStart !== -1) {
    const weeklyContentEnd = content.indexOf('{/* MONTHLY VIEW CONTENT */}');
    if (weeklyContentEnd !== -1) {
        // Find the exact closing tags of the Weekly View
        const closingTags = `
          </div>
        )}

        `;
        content = content.slice(0, weeklyContentStart) + flatCardsCode + closingTags + content.slice(weeklyContentEnd);
    }
}


// 7. Remove the Overtime Earnings section
const otStartIdx = content.indexOf("{user?.role === 'employee' && (\\n        <div className=\\\"bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8\\\">");
if (otStartIdx !== -1) {
    const showRegStartIdx = content.indexOf('{showRegModal &&', otStartIdx);
    if (showRegStartIdx !== -1) {
        content = content.slice(0, otStartIdx) + content.slice(showRegStartIdx);
    }
}

fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
console.log("All UI fixes applied successfully!");
