const fs = require('fs');
let content = fs.readFileSync('src/components/payroll/attendance-dashboard.jsx', 'utf8');

// I accidentally deleted the opening tags for MONTHLY VIEW CONTENT. I need to restore them.
const brokenPart = `                  </div>
                )}
              </div>
          </div>
        )}

        {/* MONTHLY VIEW CONTENT */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">`;

const fixedPart = `                  </div>
                )}
              </div>
          </div>
        )}

        {/* MONTHLY VIEW CONTENT */}
        {viewMode === "monthly" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">`;

if (content.includes(brokenPart)) {
    content = content.replace(brokenPart, fixedPart);
    fs.writeFileSync('src/components/payroll/attendance-dashboard.jsx', content);
    console.log('Fixed replacement issue!');
} else {
    console.log('Could not find the broken part.');
}
