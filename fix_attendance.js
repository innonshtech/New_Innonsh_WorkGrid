const fs = require('fs');
const file = 'src/components/payroll/attendance-dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const weeklyStart = content.indexOf('{viewMode === "weekly" && (');
const monthlyStart = content.indexOf('{/* MONTHLY VIEW CONTENT */}');

if (weeklyStart !== -1 && monthlyStart !== -1) {
    let weeklyChunk = content.substring(weeklyStart, monthlyStart);
    let newWeekly = \{viewMode === "weekly" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            {getMonthlyAttendanceByEmployee()
              .filter((empData) => {
                const fullName =
                  \\\\\\ \\\\\\.toLowerCase();
                const employeeId =
                  empData.employee.employeeId?.toLowerCase() || "";
                return (
                  fullName.includes(searchTerm.toLowerCase()) ||
                  employeeId.includes(searchTerm.toLowerCase())
                );
              })
              .map((empData) => (
                <div key={empData.employee._id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div
                    onClick={() => toggleEmployee(empData.employee._id)}
                    className="px-4 py-3 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">
                            {empData.employee.personalDetails?.firstName} {empData.employee.personalDetails?.lastName}
                          </h4>
                          <p className="text-xs text-slate-500">ID: {empData.employee.employeeId}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedEmployees[empData.employee._id] && (
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                        {(() => {
                          const curr = new Date(selectedDate);
                          const day = curr.getDay();
                          const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
                          return Array.from({ length: 7 }, (_, i) => {
                            const d = new Date(new Date(selectedDate).setDate(diff + i));
                            const dayNum = d.getDate();
                            const record = empData.records[dayNum];
                            
                            return (
                              <div
                                key={i}
                                className={\\\min-h-[90px] p-3 rounded-2xl border flex flex-col justify-between transition-all \\\\\\}
                              >
                                <div className="flex justify-between items-start">
                                  <span className="text-xs font-black leading-none">{d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                                  {record && (
                                    <span className="text-[8px] font-bold uppercase tracking-tighter opacity-80">
                                      {record.status}
                                    </span>
                                  )}
                                </div>
                                
                                {record ? (
                                  <div className="text-left mt-2 space-y-0.5">
                                    {record.checkIn && (
                                      <p className="text-[9px] font-semibold leading-none truncate text-slate-600">
                                        In: {new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).replace(" AM", "").replace(" PM", "")}
                                      </p>
                                    )}
                                    {record.checkOut && (
                                      <p className="text-[9px] font-semibold leading-none truncate text-slate-600">
                                        Out: {new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).replace(" AM", "").replace(" PM", "")}
                                      </p>
                                    )}
                                    {record.totalHours && (
                                      <p className="text-[8px] font-bold leading-none text-indigo-500 mt-1">
                                        {parseFloat(record.totalHours).toFixed(1)}h logged
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-left mt-2">
                                    <p className="text-[8px] text-slate-300 italic font-medium leading-none">No punch logs</p>
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        \;
    content = content.replace(weeklyChunk, newWeekly);
}

const monthlyChunkStart = content.indexOf('{/* MONTHLY VIEW CONTENT */}');
const afterMonthlyChunk = content.indexOf('{/* Modals */}');

if (monthlyChunkStart !== -1 && afterMonthlyChunk !== -1) {
    let monthlyChunk = content.substring(monthlyChunkStart, afterMonthlyChunk);
    
    let newMonthly = \{/* MONTHLY VIEW CONTENT */}
        {viewMode === "monthly" && (
          <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 space-y-4">
                {getMonthlyAttendanceByEmployee()
                  .filter((empData) => {
                    const fullName =
                      \\\\\\ \\\\\\.toLowerCase();
                    const employeeId =
                      empData.employee.employeeId?.toLowerCase() || "";
                    return (
                      fullName.includes(searchTerm.toLowerCase()) ||
                      employeeId.includes(searchTerm.toLowerCase())
                    );
                  })
                  .map((empData) => {
                    const daysInMonth = getDaysInMonth(
                      selectedMonth,
                      selectedYear
                    );

                    return (
                      <div
                        key={empData.employee._id}
                        className="border border-slate-200 rounded-xl overflow-hidden"
                      >
                        <div
                          onClick={() => toggleEmployee(empData.employee._id)}
                          className="px-4 py-3 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900 text-sm">
                                  {empData.employee.personalDetails?.firstName} {empData.employee.personalDetails?.lastName}
                                </h4>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <p className="text-xs text-slate-500">
                                    ID: {empData.employee.employeeId}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {expandedEmployees[empData.employee._id] && (
                          <div className="p-4 bg-white">
                                  <div className="grid grid-cols-7 gap-3 text-center">
                                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                                      <div key={dayName} className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-2">
                                        {dayName}
                                      </div>
                                    ))}
                                    {(() => {
                                      const cells = [];
                                      const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();
                                      for (let i = 0; i < firstDayIndex; i++) {
                                        cells.push({ day: "", record: null });
                                      }
                                      for (let d = 1; d <= daysInMonth; d++) {
                                        cells.push({ day: d, record: empData.records[d] });
                                      }
                                      return cells;
                                    })().map((cell, idx) => (
                                      <div
                                        key={idx}
                                        className={\\\min-h-[90px] p-3 rounded-2xl border flex flex-col justify-between transition-all \\\\\\}
                                      >
                                        {cell.day ? (
                                          <>
                                            <div className="flex justify-between items-start">
                                              <span className="text-xs font-black leading-none">{cell.day}</span>
                                              {cell.record && (
                                                <span className="text-[8px] font-bold uppercase tracking-tighter opacity-80">
                                                  {cell.record.status}
                                                </span>
                                              )}
                                            </div>
                                            {cell.record ? (
                                              <div className="text-left mt-2 space-y-0.5">
                                                {cell.record.checkIn && (
                                                  <p className="text-[9px] font-semibold leading-none truncate text-slate-600">
                                                    In: {new Date(cell.record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).replace(" AM", "").replace(" PM", "")}
                                                  </p>
                                                )}
                                                {cell.record.checkOut && (
                                                  <p className="text-[9px] font-semibold leading-none truncate text-slate-600">
                                                    Out: {new Date(cell.record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).replace(" AM", "").replace(" PM", "")}
                                                  </p>
                                                )}
                                                {cell.record.totalHours && (
                                                  <p className="text-[8px] font-bold leading-none text-indigo-500 mt-1">
                                                    {parseFloat(cell.record.totalHours).toFixed(1)}h
                                                  </p>
                                                )}
                                              </div>
                                            ) : (
                                              <div className="text-left mt-2">
                                                <p className="text-[8px] text-slate-300 italic font-medium leading-none">No punch</p>
                                              </div>
                                            )}
                                          </>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                        )}
                      </div>
                    );
                  })}
              </div>
          </div>
        )}

        \;

    content = content.replace(monthlyChunk, newMonthly);
}

fs.writeFileSync(file, content, 'utf8');
console.log('done!');
