const fs = require('fs');
let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

// 1. Remove blue background header banner and replace with Module Hero
const headerRegex = /\{\/\* Header Banner \*\/\}\s*<div className="relative overflow-hidden bg-gradient-to-r[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newHeader = `{/* Module Hero */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {isAdminView ? "Attendance Management" : "My Attendance"}
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-xl">
              {isAdminView 
                ? "Track and manage employee attendance records, handle status corrections, and export complete statutory logs." 
                : "View clock-in schedules, analyze monthly hours, and submit regularization requests instantly."
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={exportLoading}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  {exportLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-slate-500" />
                  )}
                  Export Report
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-xl rounded-xl">
                <DropdownMenuItem className="hover:bg-slate-50 cursor-pointer" onClick={() => handleExport('excel')}>Excel Format</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-slate-50 cursor-pointer" onClick={() => handleExport('csv')}>CSV Format</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-slate-50 cursor-pointer" onClick={() => handleExport('pdf')}>PDF Document</DropdownMenuItem>
                <DropdownMenuSeparator className="border-slate-100" />
                <DropdownMenuItem className="hover:bg-slate-50 cursor-pointer text-indigo-600" onClick={() => window.print()}>Print Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user?.role === "admin" && (
              <button
                onClick={() => router.push("/admin/attendance/import-attendance")}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-200 transition-all active:scale-95 shadow-sm"
              >
                <Upload className="w-4 h-4 text-slate-500" /> Bulk Import
              </button>
            )}

            <button
              onClick={() =>
                router.push(isEmployeeView ? '/employee/attendance/add-attendance' : "/admin/attendance/add-attendance")
              }
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Entry
            </button>
          </div>
        </div>`;

content = content.replace(headerRegex, newHeader);

// 2. Hide KPI Cards and View Mode Toggle
const toggleRegex = /\{\/\* View Mode Toggle \*\/\}\s*<div className="bg-white rounded-2xl border border-slate-100[\s\S]*?<AttendanceAnalytics stats=\{stats\} viewMode=\{viewMode\} role=\{isAdminView \? "admin" : "employee"\} \/>/;
content = content.replace(toggleRegex, "");

// 3. Hide Organization Grouping Toggle
const orgToggleRegex = /\{\/\* Organization Grouping Toggle \*\/\}\s*\{organizations\.length > 1 && \(\s*<div[\s\S]*?<\/div>\s*\)\}/;
content = content.replace(orgToggleRegex, "");

// 4. Force groupByOrganization to false by default
content = content.replace('const [groupByOrganization, setGroupByOrganization] = useState(true);', 'const [groupByOrganization, setGroupByOrganization] = useState(false);');

// Write
fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
console.log('Modifications applied successfully');
