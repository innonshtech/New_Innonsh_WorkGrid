import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar as CalendarIcon, User, Layers, Clock, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Download
} from 'lucide-react';

export default function EmployeeCalendarModal({ 
  isOpen, 
  onClose, 
  employeeData, 
  viewMode, 
  selectedMonth, 
  selectedYear,
  selectedDate // for weekly view context
}) {
  if (!isOpen || !employeeData) return null;

  const emp = employeeData.employee;
  const fullName = `${emp?.personalDetails?.firstName || ''} ${emp?.personalDetails?.lastName || ''}`.trim();
  const employeeId = emp?.employeeId || 'N/A';
  const department = emp?.jobDetails?.department || 'N/A';
  const organization = employeeData.organization || 'N/A';
  
  const stats = employeeData.stats || {
    totalPresent: 0, totalAbsent: 0, totalLeave: 0, totalHours: 0, totalOvertime: 0
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    return new Date(time).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get status color helper for calendar cells
  const getCellStatusClass = (record) => {
    if (!record) return "bg-slate-50 border-slate-100 hover:border-slate-300";
    switch (record.status) {
      case "Present":
        return "bg-emerald-50/50 border-emerald-200 text-emerald-800 hover:bg-emerald-50 ring-1 ring-emerald-100";
      case "Half-day":
        return "bg-amber-50/50 border-amber-200 text-amber-800 hover:bg-amber-50 ring-1 ring-amber-100";
      case "Leave":
        return "bg-violet-50/50 border-violet-200 text-violet-800 hover:bg-violet-50 ring-1 ring-violet-100";
      case "Absent":
        return "bg-rose-50/50 border-rose-200 text-rose-800 hover:bg-rose-50 ring-1 ring-rose-100";
      case "Weekend":
        return "bg-slate-100/60 border-slate-200 text-slate-500 cursor-default";
      case "Holiday":
        return "bg-fuchsia-50/50 border-fuchsia-200 text-fuchsia-800 hover:bg-fuchsia-50 ring-1 ring-fuchsia-100";
      default:
        return "bg-slate-50 border-slate-100 hover:border-slate-300";
    }
  };

  // Build calendar cells (ALWAYS MONTHLY GRID)
  const calendarCells = useMemo(() => {
    const month = viewMode === 'monthly' ? selectedMonth : new Date(selectedDate).getMonth() + 1;
    const year = viewMode === 'monthly' ? selectedYear : new Date(selectedDate).getFullYear();
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // Sunday=0
    
    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: "", record: null });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const record = employeeData.records[d];
      cells.push({ day: d, record: record });
    }
    return cells;
  }, [viewMode, selectedMonth, selectedYear, selectedDate, employeeData]);

  const months = [
    { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
    { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
    { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-full"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{fullName}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                      ID: {employeeId}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{department}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-xs font-semibold text-slate-500">{organization}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-full transition-colors self-end sm:self-auto shadow-sm"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
                {[
                  { label: "Present Days", value: stats.totalPresent, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                  { label: "Half-Days", value: 0 /* Replace if stats has halfDay */, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                  { label: "On Leaves", value: stats.totalLeave, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
                  { label: "Absents", value: stats.totalAbsent, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
                  { label: "Active Hours", value: `${stats.totalHours.toFixed(1)}h`, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" }
                ].map((m, idx) => (
                  <div key={idx} className={`bg-white rounded-2xl p-4 sm:p-5 border ${m.border} transition-transform hover:-translate-y-0.5 shadow-sm`}>
                    <div className="flex justify-between items-start">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
                      <span className={`w-2.5 h-2.5 rounded-full ${m.color.replace("text-", "bg-")}`} />
                    </div>
                    <p className={`text-2xl sm:text-3xl font-black mt-3 leading-none ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Calendar Section */}
              <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Attendance Month-Grid</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Detailed daily view of shifts, punches, and statuses.</p>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                    <span className="text-xs font-black uppercase text-slate-800 tracking-widest min-w-[120px] text-center px-4">
                      {viewMode === 'monthly' 
                        ? `${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`
                        : `${months.find((m) => m.value === new Date(selectedDate).getMonth() + 1)?.label} ${new Date(selectedDate).getFullYear()}`
                      }
                    </span>
                  </div>
                </div>

                  /* Monthly Grid Calendar */
                  <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
                    {/* Weekday Names */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                      <div key={dayName} className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-2">
                        {dayName}
                      </div>
                    ))}

                    {/* Day Cells */}
                    {calendarCells.map((cell, idx) => (
                      <div
                        key={idx}
                        className={`min-h-[90px] p-2 sm:p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                          cell.day ? getCellStatusClass(cell.record) : "bg-slate-50/20 border-transparent cursor-default"
                        }`}
                      >
                        {cell.day ? (
                          <>
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-black leading-none">{cell.day}</span>
                              {cell.record && (
                                <span className="text-[8px] font-bold uppercase tracking-tighter opacity-80 hidden sm:inline">
                                  {cell.record.status}
                                </span>
                              )}
                            </div>

                            {cell.record ? (
                              <div className="text-left mt-2 space-y-0.5">
                                {cell.record.checkIn && (
                                  <p className="text-[9px] font-semibold leading-none truncate text-slate-600">
                                    In: {formatTime(cell.record.checkIn).replace(" AM", "").replace(" PM", "")}
                                  </p>
                                )}
                                {cell.record.checkOut && (
                                  <p className="text-[9px] font-semibold leading-none truncate text-slate-600">
                                    Out: {formatTime(cell.record.checkOut).replace(" AM", "").replace(" PM", "")}
                                  </p>
                                )}
                                {cell.record.totalHours && (
                                  <p className="text-[8px] font-bold leading-none text-indigo-500 mt-1">
                                    {parseFloat(cell.record.totalHours).toFixed(1)}h logged
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="text-left mt-2">
                                <p className="text-[8px] text-slate-300 italic font-medium leading-none">No punch logs</p>
                              </div>
                            )}
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                
                {/* Status Legend */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 justify-center">
                  {[
                    { label: "Present", color: "bg-emerald-500" },
                    { label: "Absent", color: "bg-rose-500" },
                    { label: "Leave", color: "bg-violet-500" },
                    { label: "Half Day", color: "bg-amber-500" },
                    { label: "Holiday", color: "bg-fuchsia-500" },
                  ].map((legend, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${legend.color}`} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{legend.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                Close View
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
