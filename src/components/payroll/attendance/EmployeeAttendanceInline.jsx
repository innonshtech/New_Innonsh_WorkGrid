import React, { useMemo } from 'react';

export default function EmployeeAttendanceInline({ 
  employeeData, 
  viewMode, 
  selectedMonth, 
  selectedYear,
  selectedDate // for weekly view context
}) {
  if (!employeeData) return null;

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

  // Build calendar cells
  const calendarCells = useMemo(() => {
    if (viewMode === 'monthly') {
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // Sunday=0
      
      const cells = [];
      for (let i = 0; i < firstDayIndex; i++) {
        cells.push({ day: "", record: null });
      }
      
      for (let d = 1; d <= daysInMonth; d++) {
        const record = employeeData.records[d];
        const date = new Date(selectedYear, selectedMonth - 1, d);
        cells.push({ 
          day: d, 
          dayName: date.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short' }),
          monthName: date.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'short' }),
          record: record 
        });
      }
      return cells;
    } else {
      // Weekly view
      const curr = new Date(selectedDate);
      const day = curr.getDay();
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday (Monday start)
      
      const startDate = new Date(curr.setDate(diff));
      const cells = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayOfMonth = date.getDate();
        const record = employeeData.records[dayOfMonth];
        cells.push({ 
          day: dayOfMonth, 
          dayName: date.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short' }),
          monthName: date.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'short' }),
          record: record 
        });
      }
      return cells;
    }
  }, [viewMode, selectedMonth, selectedYear, selectedDate, employeeData]);

  return (
    <div className="px-4 py-4 bg-white overflow-x-auto">
      {viewMode === 'monthly' ? (
        /* Monthly Grid Calendar */
        <div className="grid grid-cols-7 gap-3 text-center min-w-[600px]">
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
              className={`min-h-[90px] p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                cell.day ? getCellStatusClass(cell.record) : "bg-slate-50/20 border-transparent cursor-default"
              }`}
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
      ) : (
        /* Weekly Cards */
        <div className="grid grid-cols-7 gap-3 min-w-[600px]">
          {calendarCells.map((cell, idx) => (
            <div
              key={idx}
              className={`min-h-[90px] p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                getCellStatusClass(cell.record)
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-black leading-none">{cell.monthName} {cell.day}</span>
                {cell.record && (
                  <span className="text-[8px] font-bold uppercase tracking-tighter opacity-80 bg-white/50 px-1.5 py-0.5 rounded">
                    {cell.record.status}
                  </span>
                )}
              </div>

              {cell.record ? (
                <div className="text-left mt-2 space-y-0.5">
                  {cell.record.checkIn && (
                    <p className="text-[9px] font-semibold leading-none text-slate-600">
                      In: {formatTime(cell.record.checkIn)}
                    </p>
                  )}
                  {cell.record.checkOut && (
                    <p className="text-[9px] font-semibold leading-none text-slate-600">
                      Out: {formatTime(cell.record.checkOut)}
                    </p>
                  )}
                  {cell.record.totalHours && (
                    <div className="pt-0.5">
                      <p className="text-[9px] font-black text-indigo-500">
                        {parseFloat(cell.record.totalHours).toFixed(1)}h logged
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-left mt-2">
                  <p className="text-[9px] text-slate-300 italic font-medium">No punch logs</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
