import React, { useState } from 'react';
import { Search, RefreshCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, ChevronUp } from 'lucide-react';
import EmployeeAttendanceInline from './EmployeeAttendanceInline';

export default function MonthlyAttendanceTable({
  employeeData,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedDate,
  setSelectedDate,
  months,
  years,
  onRefresh,
  refreshing,
  onViewDetails,
  onRegularize,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [expandedId, setExpandedId] = useState(null);

  // Filter by searchTerm
  const filteredData = employeeData.filter((empData) => {
    const firstName = empData.employee?.personalDetails?.firstName || '';
    const lastName = empData.employee?.personalDetails?.lastName || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const employeeId = (empData.employee?.employeeId || '').toLowerCase();
    const term = (searchTerm || '').toLowerCase();
    return fullName.includes(term) || employeeId.includes(term);
  });

  // Pagination logic (based on filtered results)
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      {/* Top Filter Bar */}
      <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center border border-slate-200 rounded-lg bg-white px-3 py-2">
            <span className="text-sm text-slate-600 mr-2">View:</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="text-sm font-medium text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          {viewMode === "monthly" ? (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-[100px]"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          ) : (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            />
          )}

          <button 
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-blue-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">#</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">EMPLOYEE</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">PRESENT (DAYS)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">TOTAL HOURS</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">OVERTIME</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentEntries.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-sm font-medium text-slate-500">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              currentEntries.map((empData, index) => {
                const name = `${empData.employee?.personalDetails?.firstName || ''} ${empData.employee?.personalDetails?.lastName || ''}`.trim();
                const id = empData.employee?.employeeId || 'N/A';
                const presentDays = empData.stats.totalPresent || 0;
                const totalHours = empData.stats.totalHours || 0;
                const overtime = empData.stats.totalOvertime || 0;
                const status = presentDays > 0 ? "Present" : "Absent";

                return (
                  <React.Fragment key={empData.employee._id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === empData.employee._id ? null : empData.employee._id)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer select-none"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-center">
                        {indexOfFirstEntry + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm mb-0.5">{name}</div>
                        <div className="text-xs text-slate-500 font-medium">ID: {id}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-bold ${presentDays > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {presentDays}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-blue-600">
                          {totalHours.toFixed(1)}h
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-purple-600">
                          {overtime.toFixed(1)}h
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {status}
                          </span>
                          {expandedId === empData.employee._id
                            ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable inline calendar row */}
                    {expandedId === empData.employee._id && (
                      <tr>
                        <td colSpan="6" className="p-0 bg-slate-50 border-t border-b border-slate-100">
                          <EmployeeAttendanceInline
                            employeeData={empData}
                            viewMode={viewMode}
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                            selectedDate={selectedDate}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => { setEntriesPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
            className="border border-slate-200 rounded-md px-2 py-1 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span className="text-sm text-slate-500">entries</span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1 mx-1">
            {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-sm font-semibold transition-colors ${
                    currentPage === pageNum 
                      ? "bg-blue-600 text-white" 
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 3 && <span className="px-1 text-slate-400">...</span>}
          </div>

          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(totalPages)}
            className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-sm text-slate-500 font-medium">
          Showing {filteredData.length === 0 ? 0 : indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredData.length)} of {filteredData.length} employees
        </div>
      </div>
    </div>
  );
}
