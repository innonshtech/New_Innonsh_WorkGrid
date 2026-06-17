const fs = require('fs');
let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');
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
content = content.replace(filterRegex, newFilterBar);
fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
