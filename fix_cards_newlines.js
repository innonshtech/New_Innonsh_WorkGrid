const fs = require('fs');
let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

// 1. Remove KPI Cards
const kpiStartStr = '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">';
const nextDivStartStr = '<div className="bg-white rounded-xl border border-slate-200 shadow-sm">';
if (content.includes(kpiStartStr) && content.includes(nextDivStartStr)) {
    const kpiStartIdx = content.indexOf(kpiStartStr);
    const nextDivStartIdx = content.indexOf(nextDivStartStr, kpiStartIdx);
    content = content.slice(0, kpiStartIdx) + content.slice(nextDivStartIdx);
}

// 2. Remove Overtime Earnings Block
const otStartStr = "{user?.role === 'employee' && (\\n        <div className=\\\"bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8\\\">";
let otStartIdx = content.indexOf("{user?.role === 'employee' && (");
if (otStartIdx !== -1) {
    const otTextIdx = content.indexOf("Overtime Earnings", otStartIdx);
    if (otTextIdx !== -1 && otTextIdx - otStartIdx < 500) {
        const showRegStartIdx = content.indexOf('{showRegModal &&', otStartIdx);
        if (showRegStartIdx !== -1) {
            content = content.slice(0, otStartIdx) + content.slice(showRegStartIdx);
        }
    }
}

// 3. Fix the Weekly View to Flatten the Cards
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

// Replace the divide-y section inside WEEKLY VIEW CONTENT
const divideYStart = content.indexOf('<div className="divide-y divide-slate-200">');
if (divideYStart !== -1) {
    const monthlyViewStart = content.indexOf('{/* MONTHLY VIEW CONTENT */}');
    if (monthlyViewStart !== -1) {
        // USE REAL NEWLINES IN TEMPLATE LITERAL
        const closingTags = `
          </div>
        )}

        `;
        content = content.slice(0, divideYStart) + flatCardsCode + closingTags + content.slice(monthlyViewStart);
    }
}

fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
console.log("Fixes applied successfully with real newlines!");
