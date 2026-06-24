import React from 'react';
import { CreditCard, TrendingUp, Users, MessageSquare, ChevronRight, Plus } from 'lucide-react';

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PayrollDashboard({
  activeRun,
  runEmployees = [],
  queries = [],
  pendingApprovals = [],
  setActiveTab,
  startNewRun
}) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const currentMonthVal = new Date().getMonth() + 1;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Payroll Cost", value: activeRun ? `₹${Number(activeRun.totalGross || 0).toLocaleString('en-IN')}` : "₹0", icon: CreditCard, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
          { title: "Net Disbursement", value: activeRun ? `₹${Number(activeRun.totalNet || 0).toLocaleString('en-IN')}` : "₹0", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
          { title: "Employees Processed", value: activeRun ? `${activeRun.processedEmployees || 0}/${runEmployees.length}` : "0/0", icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
          { title: "Pending Queries", value: queries.filter(q => q.status === 'OPEN').length.toString(), icon: MessageSquare, color: "text-rose-600 bg-rose-50 border-rose-100" },
        ].map((card, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.title}</p>
              <h3 className="text-2xl font-black text-slate-900">{card.value}</h3>
            </div>
            <div className={`p-3 rounded-xl border ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Active Pipeline Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline block */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Active Payroll Pipeline</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeRun ? `Month: ${activeRun.month}/${activeRun.year} • Code: ${activeRun.runCode}` : 'No active payroll run'}
                </p>
              </div>
              {activeRun && (
                <button
                  onClick={() => setActiveTab('payroll-run')}
                  className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                >
                  <span>Launch Wizard</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
            {activeRun ? (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-6">
                {[
                  { step: 1, name: "1. Load & Open", active: activeRun.currentStep >= 1, current: activeRun.currentStep === 1 },
                  { step: 2, name: "2. Calculation", active: activeRun.currentStep >= 2, current: activeRun.currentStep === 2 },
                  { step: 3, name: "3. Approval Chain", active: activeRun.currentStep >= 3, current: activeRun.currentStep === 3 },
                  { step: 4, name: "4. Lock Totals", active: activeRun.currentStep >= 4, current: activeRun.currentStep === 4 },
                  { step: 5, name: "5. Bank Transfer", active: activeRun.currentStep >= 5, current: activeRun.currentStep === 5 },
                  { step: 6, name: "6. Release Slips", active: activeRun.currentStep >= 6, current: activeRun.currentStep === 6 },
                  { step: 7, name: "7. Closed", active: activeRun.status === 'CLOSED', current: activeRun.status === 'CLOSED' },
                ].map(step => (
                  <div 
                    key={step.step}
                    className={`p-3.5 rounded-xl border text-center transition-all ${
                      step.current 
                        ? 'bg-indigo-600 text-white border-indigo-650 shadow-md shadow-indigo-600/10' 
                        : step.active 
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-700 font-semibold' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="text-[11px] font-bold block leading-snug">{step.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-xl mt-6">
                Please select a run from the dropdown or start a new month.
              </div>
            )}
          </div>
        </div>

        {/* Start New Run block */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Start New Payroll Run</h3>
            <p className="text-xs text-slate-500 mt-0.5">Initialize a calculation pipeline for another month.</p>
          </div>
          <form onSubmit={startNewRun} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Month</label>
                <select name="month" defaultValue={currentMonthVal} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all text-slate-700">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{monthNames[i]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Year</label>
                <select name="year" defaultValue={currentYear} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all text-slate-700">
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Initialize Run</span>
            </button>
          </form>
        </div>
      </div>

      {/* Bottom split: Disputes desk & Workflow Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Employee dispute queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">Employee Disputes Desk</h3>
            <button onClick={() => setActiveTab('queries')} className="text-xs text-indigo-600 font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {queries.slice(0, 3).map(q => (
              <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="font-bold text-xs text-slate-800">{q.subject}</p>
                  <span className="text-[10px] text-slate-500">{q.employeeName} • Category: {q.category}</span>
                </div>
                <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold ${q.status === 'OPEN' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {q.status}
                </span>
              </div>
            ))}
            {queries.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No active employee queries found.</p>
            )}
          </div>
        </div>

        {/* Approvals queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">Pending Workflow Steps</h3>
            <button onClick={() => setActiveTab('approvals')} className="text-xs text-indigo-600 font-bold hover:underline">Review Panel</button>
          </div>
          <div className="space-y-3">
            {pendingApprovals.slice(0, 3).map(item => (
              <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="font-bold text-xs text-slate-800">Verify Run: {item.entityCode}</p>
                  <span className="text-[10px] text-slate-500">Initiated: {new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="px-2 py-0.5 text-[9px] rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Review Required
                </span>
              </div>
            ))}
            {pendingApprovals.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No pending workflow requests in your queue.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
