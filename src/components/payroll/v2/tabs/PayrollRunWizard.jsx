import React, { useState } from 'react';
import { 
  AlertTriangle, RotateCw, Send, Clock, FileText, Download, CheckCircle2, X, TrendingUp,
  Calendar, Briefcase, Coffee, Sun, AlertCircle
} from 'lucide-react';

export default function PayrollRunWizard({
  activeRun,
  runEmployees = [],
  calculating,
  triggerCalculations,
  handleRunAction,
  handleOpenInspectorFromDraft
}) {
  const [activeDraftEmployee, setActiveDraftEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const [retryingIds, setRetryingIds] = useState({});

  const itemsPerPage = 20;
  const totalPages = Math.ceil(runEmployees.length / itemsPerPage);
  const paginatedEmployees = runEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const onAction = async (action) => {
    if (action === 'LOCK') {
      if (!window.confirm("Are you sure you want to LOCK this payroll run? This will lock all employee totals and prevent further recalculations.")) {
        return;
      }
    } else if (action === 'CLOSE') {
      if (!window.confirm("Are you sure you want to CLOSE this payroll run? This is irreversible and locks the records in the database forever.")) {
        return;
      }
    }

    setActionLoading(prev => ({ ...prev, [action]: true }));
    try {
      await handleRunAction(action);
    } finally {
      setActionLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const onRetry = async (e, employeeId) => {
    e.stopPropagation(); // Avoid opening the drawer
    setRetryingIds(prev => ({ ...prev, [employeeId]: true }));
    try {
      await triggerCalculations(employeeId);
    } finally {
      setRetryingIds(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payroll Processing Wizard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Execute formula engine calculations, apply variable component inputs, audit, and finalize payouts.</p>
        </div>
        <div className="flex items-start space-x-3 bg-amber-50 border border-amber-200 p-3 rounded-xl max-w-md">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-800">Punch-In Priority Rule</h4>
            <p className="text-[11px] text-amber-700 leading-normal mt-0.5">
              Attendance check-ins automatically take priority over approved leaves. Punching in on a leave day overrides the leave and counts the employee as Present.
            </p>
          </div>
        </div>
      </div>

      {!activeRun ? (
        <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center space-y-4 shadow-sm">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h3 className="font-bold text-lg text-slate-800">No Active Payroll Run</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Open a payroll run from the Dashboard Command Center to launch the processing wizard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Workflow Actions */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Status card */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800">Current Step Actions</h3>
              
              <div className="space-y-3.5 py-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500">Processing Stage</p>
                  <p className="text-sm font-extrabold text-indigo-600 capitalize mt-0.5">{activeRun.status.replace(/_/g, ' ')}</p>
                </div>
              </div>

              {/* Dynamic Stepper buttons */}
              <div className="space-y-3">
                {activeRun.status === 'OPEN' && (
                  <button
                    onClick={() => triggerCalculations()}
                    disabled={calculating}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
                  >
                    <RotateCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
                    <span>{calculating ? 'Calculating...' : 'Run Component Formulas'}</span>
                  </button>
                )}

                {activeRun.status === 'PREVIEW' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => onAction('SUBMIT_APPROVAL')}
                      disabled={actionLoading['SUBMIT_APPROVAL']}
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50"
                    >
                      {actionLoading['SUBMIT_APPROVAL'] ? <RotateCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      <span>Submit for Multi-level Approval</span>
                    </button>
                    <button
                      onClick={() => triggerCalculations()}
                      disabled={calculating}
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50"
                    >
                      <RotateCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
                      <span>{calculating ? 'Recalculating...' : 'Recalculate Formulas'}</span>
                    </button>
                  </div>
                )}

                {(activeRun.status.includes('APPROVAL') || activeRun.status === 'FINANCE_APPROVAL') && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-center">
                    <Clock className="h-5 w-5 text-amber-500 mx-auto animate-pulse" />
                    <p className="text-xs font-bold text-slate-700">Under Review</p>
                    <p className="text-[10px] text-slate-500">Currently awaiting approvals in the workflow queue. Go to Workflow Approvals tab to review.</p>
                    <button
                      onClick={() => onAction('LOCK')}
                      disabled={actionLoading['LOCK']}
                      className="mt-2 text-xs font-bold text-indigo-600 hover:underline flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
                    >
                      {actionLoading['LOCK'] && <RotateCw className="h-3 w-3 animate-spin" />}
                      <span>(Bypass Approval & Lock Run)</span>
                    </button>
                  </div>
                )}

                {activeRun.status === 'LOCKED' && (
                  <button
                    onClick={() => onAction('GENERATE_BANK_FILE')}
                    disabled={actionLoading['GENERATE_BANK_FILE']}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    {actionLoading['GENERATE_BANK_FILE'] ? <RotateCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    <span>Compile & Download Bank CSV</span>
                  </button>
                )}

                {activeRun.status === 'BANK_FILE_GENERATED' && (
                  <button
                    onClick={() => onAction('RELEASE_PAYSLIPS')}
                    disabled={actionLoading['RELEASE_PAYSLIPS']}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    {actionLoading['RELEASE_PAYSLIPS'] ? <RotateCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    <span>Publish Payslips & Send Emails</span>
                  </button>
                )}

                {activeRun.status === 'PAYSLIPS_GENERATED' && (
                  <button
                    onClick={() => onAction('CLOSE')}
                    disabled={actionLoading['CLOSE']}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    {actionLoading['CLOSE'] ? <RotateCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    <span>Lock Database & Close Run</span>
                  </button>
                )}

                {activeRun.status === 'CLOSED' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                    <p className="text-xs font-extrabold text-emerald-700">Run Successfully Finalized</p>
                    <p className="text-[10px] text-slate-500">All data locked. Payslips released and compliance files compiled.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Run audit trail */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800">Run Audit Trail</h3>
              <div className="space-y-4 overflow-y-auto max-h-60 pr-2">
                {Array.isArray(activeRun.runLog) && activeRun.runLog.map((log, lidx) => (
                  <div key={lidx} className="flex items-start space-x-3 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-slate-700 font-bold">{log.action}</p>
                      <p className="text-[10px] text-slate-500">{log.message}</p>
                      <span className="text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()} • {log.userName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Employee Table details */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-800">Wages Summary</h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Total Employees: {runEmployees.length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 bg-slate-50/50">
                      <th className="p-4">Employee</th>
                      <th className="p-4 text-center">Attendance Ratio</th>
                      <th className="p-4 text-center">Leaves Taken</th>
                      <th className="p-4 text-center">LOP Days</th>
                      <th className="p-4 text-right">Gross Earnings</th>
                      <th className="p-4 text-right">Deductions</th>
                      <th className="p-4 text-right">Net Payout</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {paginatedEmployees.map(re => (
                      <tr 
                        key={re.id} 
                        onClick={() => setActiveDraftEmployee(re)}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-all"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-extrabold text-slate-800">{re.firstName} {re.lastName}</p>
                            <span className="text-[10px] text-slate-400 font-medium">{re.employeeCode} • {re.designation}</span>
                            {re.status === 'ERROR' && re.errorMessage && (
                              <div className="mt-1 text-[10px] text-rose-500 font-bold bg-rose-50 border border-rose-100 rounded-md p-1.5 max-w-[220px] whitespace-normal">
                                Error: {re.errorMessage}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center text-slate-600 font-semibold">
                          {re.presentDays || 0}/{re.payrollDays || 0}
                        </td>
                        <td className="p-4 text-center text-slate-600 font-medium">
                          {re.paidLeaves || 0} days
                        </td>
                        <td className="p-4 text-center text-rose-600 font-bold">
                          {re.lopDays || 0} days
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-800">
                          ₹{Number(re.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right text-rose-600 font-semibold">
                          -₹{Number(re.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right font-black text-emerald-600">
                          ₹{Number(re.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold border ${
                              re.status === 'CALCULATED' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : re.status === 'ERROR'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {re.status}
                            </span>
                            {re.status === 'ERROR' && (
                              <button
                                onClick={(e) => onRetry(e, re.employeeId)}
                                disabled={retryingIds[re.employeeId] || ['LOCKED', 'CLOSED', 'BANK_FILE_GENERATED', 'PAYSLIPS_GENERATED'].includes(activeRun.status)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                              >
                                <RotateCw className={`h-2.5 w-2.5 ${retryingIds[re.employeeId] ? 'animate-spin' : ''}`} />
                                <span>{retryingIds[re.employeeId] ? 'Retrying' : 'Retry'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-500 font-bold">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Draft Payslip Drawer */}
      {activeDraftEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3.5">
                <div className="h-11 w-11 bg-indigo-100 text-indigo-700 font-black rounded-full flex items-center justify-center text-lg">
                  {activeDraftEmployee.firstName?.[0]}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{activeDraftEmployee.firstName} {activeDraftEmployee.lastName}</h3>
                  <p className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider">
                    {activeDraftEmployee.employeeCode} • {activeDraftEmployee.designation} ({activeDraftEmployee.department})
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setActiveDraftEmployee(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
              
              {/* Attendance Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <h4 className="font-extrabold text-indigo-800 uppercase text-[10px] tracking-wider">Attendance Summary</h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  {/* Block 1: TOTAL DAYS */}
                  <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Days</span>
                      <span className="text-sm font-black text-slate-800 block">{activeDraftEmployee.payrollDays || 0}</span>
                    </div>
                  </div>

                  {/* Block 2: WORKING DAYS */}
                  <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Working Days</span>
                      <span className="text-sm font-black text-slate-800 block">
                        {Math.max(0, (activeDraftEmployee.payrollDays || 0) - (activeDraftEmployee.weeklyOffs || 0) - (activeDraftEmployee.holidays || 0))}
                      </span>
                    </div>
                  </div>

                  {/* Block 3: PRESENT DAYS */}
                  <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Present Days</span>
                      <span className="text-sm font-black text-slate-800 block">{activeDraftEmployee.presentDays || 0}</span>
                    </div>
                  </div>

                  {/* Block 4: HALF DAYS */}
                  <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Half Days</span>
                      <span className="text-sm font-black text-slate-800 block">{activeDraftEmployee.halfDays || 0}</span>
                    </div>
                  </div>

                  {/* Block 5: WEEKLY OFFS */}
                  <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Coffee className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Offs</span>
                      <span className="text-sm font-black text-slate-800 block">{activeDraftEmployee.weeklyOffs || 0}</span>
                    </div>
                  </div>

                  {/* Block 6: HOLIDAYS */}
                  <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                      <Sun className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Holidays</span>
                      <span className="text-sm font-black text-slate-800 block">{activeDraftEmployee.holidays || 0}</span>
                    </div>
                  </div>

                  {/* Block 7: PAID LEAVES */}
                  <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paid Leaves</span>
                      <span className="text-sm font-black text-slate-800 block">{activeDraftEmployee.paidLeaves || 0}</span>
                    </div>
                  </div>

                  {/* Block 8: LWP / UNPAID */}
                  <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LWP / Unpaid</span>
                      <span className="text-sm font-black text-rose-600 block">{activeDraftEmployee.lopDays || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>Net Payable Days: <strong className="text-indigo-600">{activeDraftEmployee.payableDays} / {activeDraftEmployee.payrollDays} Days</strong></span>
                  <span>Proration Factor: <strong className="font-mono">{(activeDraftEmployee.payrollDays > 0 ? (activeDraftEmployee.payableDays / activeDraftEmployee.payrollDays) : 1).toFixed(4)}</strong></span>
                </div>
              </div>

              {/* Payslip Elements */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase">Draft Payslip Overview</h4>
                  <span className="px-2.5 py-0.5 text-[10px] rounded-full font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 uppercase">
                    {((activeDraftEmployee.taxBreakdown && typeof activeDraftEmployee.taxBreakdown === 'object' && activeDraftEmployee.taxBreakdown.regime) || 'NEW')} regime
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  
                  {/* Earnings */}
                  <div className="p-5 space-y-4">
                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest pb-1 border-b border-emerald-50">Earnings (Incurred)</h5>
                    <div className="space-y-2.5 text-xs">
                      {activeDraftEmployee.earningsBreakdown && typeof activeDraftEmployee.earningsBreakdown === 'object' && Object.entries(activeDraftEmployee.earningsBreakdown).map(([c, v]) => (
                        <div key={c} className="flex justify-between hover:bg-slate-50/50 p-1 rounded transition-all">
                          <span className="text-slate-500 font-bold">{c.replace(/_/g, ' ')}</span>
                          <span className="text-slate-800 font-semibold">₹{Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t border-dashed border-slate-100 text-emerald-600 font-extrabold">
                        <span>OT / Bonus / Reimbursements:</span>
                        <span>₹{Number((activeDraftEmployee.overtimeAmount || 0) + (activeDraftEmployee.bonusAmount || 0) + (activeDraftEmployee.reimbursementAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {activeDraftEmployee.lopDays > 0 && (() => {
                        const fullGross = activeDraftEmployee.grossEarnings 
                          ? (activeDraftEmployee.grossEarnings / ((activeDraftEmployee.payableDays || 1) / (activeDraftEmployee.payrollDays || 30)))
                          : 0;
                        const lopAmount = Math.round(fullGross - (activeDraftEmployee.grossEarnings || 0));
                        return lopAmount > 0 ? (
                          <div className="flex justify-between pt-1 text-rose-500 font-bold bg-rose-50/50 -mx-1 px-2 py-1.5 rounded-lg">
                            <span className="flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                              Loss of Pay ({activeDraftEmployee.lopDays} day{activeDraftEmployee.lopDays > 1 ? 's' : ''}):
                            </span>
                            <span>-₹{lopAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ) : null;
                      })()}
                      <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-900 font-black text-sm">
                        <span>Gross Earnings:</span>
                        <span>₹{Number(activeDraftEmployee.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="p-5 space-y-4 bg-slate-50/30">
                    <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest pb-1 border-b border-rose-50">Deductions (Applied)</h5>
                    <div className="space-y-2.5 text-xs">
                      {activeDraftEmployee.deductionsBreakdown && typeof activeDraftEmployee.deductionsBreakdown === 'object' && Object.entries(activeDraftEmployee.deductionsBreakdown).map(([c, v]) => (
                        <div key={c} className="flex justify-between hover:bg-slate-50/50 p-1 rounded transition-all">
                          <span className="text-slate-500 font-bold">{c.replace(/_EMPLOYEE|_EARNED/g, '').replace(/_/g, ' ')}</span>
                          <span className="text-rose-600 font-semibold">-₹{Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      
                      <div className="flex justify-between text-rose-600 border-t border-dashed border-slate-200 pt-2">
                        <span className="font-bold">Projected Monthly TDS (Tax):</span>
                        <span className="font-extrabold">-₹{Number(activeDraftEmployee.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      
                      {(activeDraftEmployee.loanRecovery > 0 || activeDraftEmployee.advanceRecovery > 0) && (
                        <div className="flex justify-between text-slate-500">
                          <span>Loans/Advances:</span>
                          <span className="font-semibold">-₹{Number((activeDraftEmployee.loanRecovery || 0) + (activeDraftEmployee.advanceRecovery || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-900 font-black text-sm">
                        <span>Total Deductions:</span>
                        <span className="text-rose-600">-₹{Number(activeDraftEmployee.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Net Payable Banner */}
                <div className="p-5 bg-indigo-50 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Net Take-Home Salary</span>
                    <h4 className="text-xl font-black text-indigo-800 mt-0.5">
                      ₹{Number(activeDraftEmployee.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                  <div className="text-[10px] text-indigo-600 bg-indigo-100/50 px-3 py-1.5 rounded-xl border border-indigo-200/50 font-bold">
                    Calculated Secure Draft
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button 
                type="button"
                onClick={() => setActiveDraftEmployee(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Close Preview
              </button>

              <button 
                type="button"
                onClick={() => {
                  setActiveDraftEmployee(null);
                  handleOpenInspectorFromDraft(activeDraftEmployee.employeeId);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Open Calculator Inspector</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
