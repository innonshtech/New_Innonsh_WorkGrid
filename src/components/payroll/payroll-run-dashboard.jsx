"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CalendarDays, PlayCircle, Loader2, AlertCircle, RefreshCw, FileText, ShieldCheck, ShieldAlert, AlertTriangle, Info, Trash2 } from "lucide-react";

export default function PayrollRunDashboard() {
  const router = useRouter();
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const isFutureDate = (m, y) => {
    if (y > currentYear) return true;
    if (y === currentYear && m > currentMonth) return true;
    return false;
  };

  const fetchPayrollHistory = async () => {
    try {
      if (!user?.organizationId) return;
      setFetchingHistory(true);
      // Fetching all past runs for this specific organization
      const res = await fetch(`/api/v1/admin/payroll/run?orgId=${user?.organizationId}`);
      const data = await res.json();
      if (res.ok) {
        setPayrollHistory(data || []);
      }
    } catch (error) {
      console.error("Error fetching payroll history", error);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    if (user?.organizationId) {
      fetchPayrollHistory();
    }
  }, [user?.organizationId]);

  const handleGenerateBatch = async () => {
    console.log("Starting batch generation for month:", formData.month, "year:", formData.year, "org:", user?.organizationId);
    
    // Future date validation
    if (isFutureDate(formData.month, formData.year)) {
      toast.error(`Cannot run payroll for future months (${months[formData.month - 1]} ${formData.year})`);
      return;
    }

    // Safety check for month index
    const mIndex = (parseInt(formData.month) || 1) - 1;
    const confirmText = `Are you sure you want to run payroll for ${months[mIndex] || "selected month"} ${formData.year}?\n\nThis will generate Draft payslips for ALL active employees.`;
    
    const confirm = window.confirm(confirmText);
    if (!confirm) return;

    setLoading(true);
    const toastId = toast.loading("Processing batch payroll. This may take a moment...");

    try {
      const res = await fetch("/api/v1/admin/payroll/run/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: formData.month,
          year: formData.year,
          orgId: user?.organizationId
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.existingRunId) {
          toast.dismiss(toastId);
          toast.error(
            (t) => (
              <div className="flex flex-col gap-2 p-1">
                <span className="font-semibold text-sm">Conflict: A payroll run already exists.</span>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    router.push(`/admin/payroll/run/${data.existingRunId}`);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition-colors self-start"
                >
                  View & Fix Existing Run
                </button>
              </div>
            ),
            { duration: 6000 }
          );
          return;
        }
        toast.error(data.error || "Failed to generate payroll batch", { id: toastId });
        return;
      }

      toast.success(data.message || "Batch Payroll Generated Successfully!", { id: toastId });
      
      // Navigate to the Review screen for this new run
      router.push(`/admin/payroll/run/${data.runId}`);

    } catch (error) {
      console.error("Batch error:", error);
      toast.error("Internal Server Error", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (isFutureDate(formData.month, formData.year)) {
      toast.error("Cannot validate future months.");
      return;
    }
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await fetch(`/api/v1/admin/payroll/run/validate?month=${formData.month}&year=${formData.year}&orgId=${user?.organizationId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setValidationResult(data);
      if (data.isReady) {
        toast.success(`All ${data.summary.readyCount}/${data.summary.totalEmployees} employees ready!`);
      } else {
        toast.error(`${data.summary.criticalIssues} critical issues found. Fix before proceeding.`);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setValidating(false);
    }
  };

  const handleDeleteRun = async (id, runId) => {
    const confirm = window.confirm(
      `Are you sure you want to DELETE Payroll Run ${runId}?\n\nThis will remove all associated draft payslips so you can regenerate it again for this month.`
    );
    if (!confirm) return;

    setLoading(true);
    const toastId = toast.loading("Deleting payroll run...");

    try {
      const res = await fetch(`/api/v1/admin/payroll/run/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete payroll run");
      }

      toast.success("Payroll run deleted successfully", { id: toastId });
      fetchPayrollHistory(); // Refresh the list
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Batch Payroll Run</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and process payroll for all employees simultaneously
          </p>
        </div>
      </div>

      {/* Main Action Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg">
              <PlayCircle className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Start New Payroll Run</h2>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Select the target month and year. The system will automatically fetch all active employees, 
                calculate their statutory deductions, factor in leaves/attendance, and prepare draft payslips.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row items-end gap-6 max-w-3xl">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Month</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition- appearance-none"
                >
                  {months.map((month, index) => {
                    const mValue = index + 1;
                    const disabled = isFutureDate(mValue, formData.year);
                    return (
                      <option key={index} value={mValue} disabled={disabled}>
                        {month} {disabled ? "(Future)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Year</label>
              <select
                value={formData.year}
                onChange={(e) => {
                  const newYear = parseInt(e.target.value);
                  // If switching to current year and selected month is future, reset to current month
                  let newMonth = formData.month;
                  if (newYear === currentYear && formData.month > currentMonth) {
                    newMonth = currentMonth;
                  }
                  setFormData({ ...formData, year: newYear, month: newMonth });
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition- appearance-none"
              >
                {[...Array(3)].map((_, i) => {
                  const y = currentYear - 1 + i;
                  if (y > currentYear) return null; // Don't show future years
                  return <option key={y} value={y}>{y}</option>;
                }).filter(Boolean)}
              </select>
            </div>

            <button
              onClick={handleValidate}
              disabled={validating}
              className="w-full md:w-auto flex-shrink-0 px-6 py-3 bg-white border-2 border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-medium rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {validating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Validate Readiness
                </>
              )}
            </button>

            <button
              onClick={handleGenerateBatch}
              disabled={loading || (validationResult && !validationResult.isReady)}
              className="w-full md:w-auto flex-shrink-0 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg hover: transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Run Payroll Batch
                </>
              )}
            </button>
          </div>

          {/* Validation Results Panel */}
          {validationResult && (
            <div className="mt-6 space-y-3">
              {/* Summary Bar */}
              <div className={`flex items-center gap-3 p-4 rounded-lg border ${validationResult.isReady ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {validationResult.isReady ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                <div className="flex-1">
                  <p className="font-semibold">
                    {validationResult.isReady ? 'All Clear — Ready to Process' : `${validationResult.summary.criticalIssues} Critical Issue(s) Found`}
                  </p>
                  <p className="text-sm opacity-80">
                    {validationResult.summary.readyCount}/{validationResult.summary.totalEmployees} employees ready • {validationResult.summary.warnings} warnings • {validationResult.summary.infoNotices} notices
                  </p>
                </div>
                <div className="hidden md:flex flex-col items-end border-l pl-4 border-current border-opacity-20 gap-1 text-right">
                    <div className="text-xs uppercase font-bold opacity-60">Estimated Net Payout</div>
                    <div className="text-xl font-black">₹{(validationResult.summary.estimatedProratedGross || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* Quick Analytics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs font-bold text-slate-500 uppercase">Headcount</div>
                      <div className="text-lg font-bold text-slate-900">{validationResult.summary.totalEmployees}</div>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs font-bold text-slate-500 uppercase">Compliant</div>
                      <div className="text-lg font-bold text-emerald-600">
                          {validationResult.summary.totalEmployees - (validationResult.summary.missingCompliance || 0)}
                      </div>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs font-bold text-slate-500 uppercase">Non-Compliant</div>
                      <div className="text-lg font-bold text-red-600">{validationResult.summary.missingCompliance || 0}</div>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-xs font-bold text-slate-500 uppercase">Est. Net Payable (Prorated)</div>
                      <div className="text-lg font-bold text-slate-900">₹{(validationResult.summary.estimatedProratedGross || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
              </div>

              {/* Critical Issues */}
              {validationResult.issues.critical.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Critical — Must Fix</h4>
                  <div className="space-y-1.5">
                    {validationResult.issues.critical.map((issue, i) => (
                      <div key={i} className="text-sm text-red-700 flex items-start gap-2">
                        <span className="font-mono text-xs bg-red-100 px-1.5 py-0.5 rounded">{issue.employeeId}</span>
                        <span>{issue.employeeName}: {issue.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResult.issues.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Warnings</h4>
                  <div className="space-y-1.5">
                    {validationResult.issues.warnings.map((issue, i) => (
                      <div key={i} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">{issue.employeeId}</span>
                        <span>{issue.employeeName}: {issue.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Notices */}
              {validationResult.issues.info.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> Info</h4>
                  <div className="space-y-1.5">
                    {validationResult.issues.info.map((issue, i) => (
                      <div key={i} className="text-sm text-blue-700 flex items-start gap-2">
                        <span className="font-mono text-xs bg-blue-100 px-1.5 py-0.5 rounded">{issue.employeeId}</span>
                        <span>{issue.employeeName}: {issue.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex gap-2 items-start p-4 bg-amber-50 rounded-lg text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <p>
              <strong>Note:</strong> Generating a batch will create "Draft" payslips. 
              No notifications will be sent to employees and payslips will remain hidden until you explicitly <strong>Lock & Publish</strong> them in the next step.
            </p>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Recent Payroll Runs</h2>
          <button 
             onClick={fetchPayrollHistory} 
             disabled={fetchingHistory}
             className="text-slate-500 hover:text-indigo-600 transition-colors p-2 rounded-md hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${fetchingHistory ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {fetchingHistory ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : payrollHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>No payroll runs found for your organization yet.</p>
            <p className="text-sm mt-1">Start your first batch run above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Run ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employees</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Payout</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollHistory.map((run) => (
                  <tr key={run._id || run.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 border-l-2 border-transparent">
                      {run.runId}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {months[run.month - 1]} {run.year}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {run.processedEmployees || 0}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                      ₹{(run.totalNetSalary || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        run.status === 'Locked' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        run.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {run.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => router.push(`/admin/payroll/run/${run._id || run.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 hover:underline"
                        >
                          View Summary
                        </button>
                        {run.status === 'Draft' && (
                          <button
                            onClick={() => handleDeleteRun(run._id || run.id, run.runId)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                            title="Delete Run (Regenerate)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
