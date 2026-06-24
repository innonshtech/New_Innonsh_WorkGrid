import React, { useState, useEffect } from 'react';
import { Download, FileText, Globe, CheckCircle2, RotateCw, AlertCircle } from 'lucide-react';

export default function PayrollReports({ runs = [] }) {
  const [selectedRunId, setSelectedRunId] = useState('');
  const [ptSummary, setPtSummary] = useState(null);
  const [loadingPT, setLoadingPT] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (runs.length > 0 && !selectedRunId) {
      setSelectedRunId(runs[0].id);
    }
  }, [runs]);

  useEffect(() => {
    if (selectedRunId) {
      fetchPTSummary(selectedRunId);
    } else {
      setPtSummary(null);
    }
  }, [selectedRunId]);

  const fetchPTSummary = async (runId) => {
    setLoadingPT(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/v1/admin/payroll/v2/reports?runId=${runId}&type=PT`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPtSummary(data.summary || {});
      } else {
        setErrorMsg(data.error || 'Failed to fetch Professional Tax summary');
        setPtSummary(null);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to report server');
      setPtSummary(null);
    } finally {
      setLoadingPT(false);
    }
  };

  const downloadReport = (type) => {
    if (!selectedRunId) return;
    window.open(`/api/v1/admin/payroll/v2/reports?runId=${selectedRunId}&type=${type}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Compliance & statutory reports</h1>
        <p className="text-slate-500 text-sm mt-0.5">Generate, audit, and download statutory compliance registers, PF ECR challan sheets, and ESIC spreadsheets.</p>
      </div>

      {/* Select payroll run */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Payroll Run Month</label>
          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700 w-full md:w-64"
          >
            <option value="">Choose run...</option>
            {runs.map(run => (
              <option key={run.id} value={run.id}>
                Month: {run.month}/{run.year} ({run.runCode || 'Draft'}) — {run.status}
              </option>
            ))}
          </select>
        </div>

        {selectedRunId && (
          <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-150 px-4 py-2.5 rounded-xl shrink-0">
            Selected Run ID: <span className="font-mono text-indigo-650">{selectedRunId.slice(0, 8)}...</span>
          </div>
        )}
      </div>

      {selectedRunId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns: Download options */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100">Statutory Compliance Downloads</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* PF ECR Card */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-indigo-150 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 w-fit">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h4 className="font-black text-slate-850 text-xs">EPF Electronic Challan-cum-Return (ECR)</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Unified portal compliant text file format containing UAN allocations, gross wages, and employee/employer contributions.</p>
                  </div>
                  <button
                    onClick={() => downloadReport('PF_ECR')}
                    className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PF ECR Text</span>
                  </button>
                </div>

                {/* ESIC Spreadsheet Card */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-emerald-150 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 w-fit">
                      <Globe className="h-5 w-5" />
                    </div>
                    <h4 className="font-black text-slate-850 text-xs">ESIC Contribution spreadsheet (CSV)</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Official format containing IP numbers, employee names, days paid, and monthly ESIC eligible salary wage totals.</p>
                  </div>
                  <button
                    onClick={() => downloadReport('ESIC')}
                    className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download ESIC CSV Sheet</span>
                  </button>
                </div>

                {/* Salary Register Card */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-blue-150 transition-all flex flex-col justify-between space-y-4 md:col-span-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <h4 className="font-black text-slate-850 text-xs">Monthly Salary Register Audit Workbook (CSV)</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">A complete breakdown worksheet of all employees in this run including itemized gross earnings, PF/ESI/PT deductions, TDS taxes, and net payouts.</p>
                    </div>
                    <button
                      onClick={() => downloadReport('SALARY_REGISTER')}
                      className="flex items-center justify-center space-x-1.5 py-2.5 px-6 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Audit workbook</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column: Professional Tax Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100">Professional Tax (PT) Challan Summary</h3>
              
              {loadingPT ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <RotateCw className="h-6 w-6 animate-spin" />
                </div>
              ) : errorMsg ? (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              ) : ptSummary && Object.keys(ptSummary).length > 0 ? (
                <div className="space-y-4">
                  {Object.values(ptSummary).map((statePT) => (
                    <div key={statePT.state} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                        <span className="font-extrabold text-slate-800">{statePT.state}</span>
                        <span className="text-[9px] font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded-full">
                          {statePT.totalEmployees} Employees
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-500 text-[10.5px]">
                          <span>PT Wages:</span>
                          <span className="font-bold text-slate-700">₹{Math.round(statePT.totalGrossWages).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[10.5px]">
                          <span>Total Collected:</span>
                          <span className="font-black text-rose-600">₹{Math.round(statePT.totalPTAmount).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No Professional Tax collections recorded in this run.
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center space-y-3 shadow-sm">
          <CheckCircle2 className="h-8 w-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Please Select a Run</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Select an active or closed payroll run month above to generate and extract statutory compliance papers.</p>
        </div>
      )}
    </div>
  );
}
