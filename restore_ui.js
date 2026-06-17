const fs = require('fs');

let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

// 1. Restore the simple header
const heroRegex = /<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">[\s\S]*?(?={<AttendanceFilters)/;
const replacement = `
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isAdminView ? "Attendance Management" : "My Attendance Dashboard"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isAdminView 
                ? "Track and manage employee attendance records, handle status corrections, and export complete statutory logs." 
                : "View clock-in schedules, analyze monthly hours, and submit regularization requests instantly."
              }
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            {isAdminView && (
              <button
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            )}
          </div>
        </div>
        `;
        
content = content.replace(heroRegex, replacement);
fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);

// Now I also need to restore the single line filter bar and remove AttendanceFilters!
let filterContent = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

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

filterContent = filterContent.replace(filterRegex, newFilterBar);
fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', filterContent);

console.log("Header and Filter Bar Restored!");
