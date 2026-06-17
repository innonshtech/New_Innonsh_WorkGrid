import React from 'react';
import { X, ChevronLeft, ChevronRight, User } from 'lucide-react';
import EmployeeAttendanceInline from './EmployeeAttendanceInline';

export default function AttendanceCalendarModal({
  isOpen,
  onClose,
  employeeData,
  viewMode,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedDate,
  setSelectedDate,
  months,
}) {
  if (!isOpen || !employeeData) return null;

  const name = `${employeeData.employee?.personalDetails?.firstName || ''} ${employeeData.employee?.personalDetails?.lastName || ''}`.trim();
  const empId = employeeData.employee?.employeeId || 'N/A';

  // Month navigation for monthly view
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Week navigation for weekly view
  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Compute week label
  const getWeekLabel = () => {
    const curr = new Date(selectedDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(new Date(selectedDate).setDate(diff));
    const end = new Date(new Date(selectedDate).setDate(diff + 6));
    return `${start.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const monthLabel = months?.find(m => m.value === selectedMonth)?.label || '';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {viewMode === 'monthly' ? 'Attendance Month-Grid' : 'Attendance Week-Grid'}
              </h2>
              <p className="text-xs text-slate-500">
                {name} &nbsp;·&nbsp; ID: {empId}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <button
                onClick={viewMode === 'monthly' ? handlePrevMonth : handlePrevWeek}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-700 min-w-[130px] text-center">
                {viewMode === 'monthly' ? `${monthLabel} ${selectedYear}` : getWeekLabel()}
              </span>
              <button
                onClick={viewMode === 'monthly' ? handleNextMonth : handleNextWeek}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="overflow-y-auto flex-1">
          <EmployeeAttendanceInline
            employeeData={employeeData}
            viewMode={viewMode}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            selectedDate={selectedDate}
          />
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-4 flex-wrap">
          {[
            { label: 'Present', color: 'bg-emerald-100 text-emerald-700' },
            { label: 'Absent', color: 'bg-rose-100 text-rose-700' },
            { label: 'Half-day', color: 'bg-amber-100 text-amber-700' },
            { label: 'Leave', color: 'bg-violet-100 text-violet-700' },
            { label: 'Weekend', color: 'bg-slate-100 text-slate-500' },
          ].map(({ label, color }) => (
            <span key={label} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
