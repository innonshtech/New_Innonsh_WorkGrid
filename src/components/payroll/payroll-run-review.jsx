"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  ArrowLeft, Lock, Send, FileText, CheckCircle, 
  AlertTriangle, DollarSign, Calculator, Users, Clock,
  Download, ChevronDown, Trash2, Banknote, RefreshCw
} from "lucide-react";
import BankPayoutModal from "@/components/payroll/bank-transfer-modal";

export function PayrollRunReview({ runId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [run, setRun] = useState(null);
  const [payslips, setPayslips] = useState([]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/payroll/run/${runId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) throw new Error("Failed to load payroll run");
      const data = await res.json();
      setRun(data.run);
      setPayslips(data.payslips || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load run details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [runId]);

  const handleLock = async () => {
    const confirm = window.confirm(
      "Are you sure you want to LOCK this payroll run?\n\nOnce locked, these payslips cannot be edited or recalculated. This action is final."
    );
    if (!confirm) return;

    setLocking(true);
    const toastId = toast.loading("Locking payroll run...");
    try {
      const res = await fetch(`/api/v1/admin/payroll/run/${runId}/lock`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to lock run");
      
      toast.success("Payroll Run Locked!", { id: toastId });
      setRun(data.run);
      fetchData(); // Refresh the payslips list to reflect locked status
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLocking(false);
    }
  };

  const handlePublish = async () => {
    const confirm = window.confirm(
      "Are you sure you want to PUBLISH this payroll run?\n\nThis will make the payslips visible to all employees on their personal dashboards."
    );
    if (!confirm) return;

    setPublishing(true);
    const toastId = toast.loading("Publishing payslips...");
    try {
      const res = await fetch(`/api/v1/admin/payroll/run/${runId}/publish`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish run");
      
      toast.success("Payslips published to employees!", { id: toastId });
      setRun(data.run);
      fetchData(); // Refresh
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setPublishing(false);
    }
  };
  
  const handleRecalculate = async () => {
    const confirm = window.confirm(
      "Are you sure you want to RECALCULATE this payroll run?\n\nThis will re-fetch all attendance, leaves, and salary structures to update the draft payslips."
    );
    if (!confirm) return;

    setProcessing(true);
    const toastId = toast.loading("Recalculating all payslips in this batch...");
    try {
      const res = await fetch(`/api/v1/admin/payroll/run/${runId}/process`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Passing current user as performedBy if your API expects it
        body: JSON.stringify({ performedBy: "Admin" }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to recalculate run");
      
      toast.success("Recalculation complete!", { id: toastId });
      
      // Use the returned data to update state immediately before re-fetching
      if (data.run) {
        setRun(data.run);
      }
      if (data.payslips) {
        setPayslips(data.payslips);
      }
      
      fetchData(); // Final background sync
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm(
      "Are you sure you want to DELETE this Draft Payroll Run?\n\nThis will remove all generated payslips and return you to the dashboard so you can regenerate if needed."
    );
    if (!confirm) return;

    setProcessing(true);
    const toastId = toast.loading("Deleting payroll run...");
    try {
      const res = await fetch(`/api/v1/admin/payroll/run/${runId}`, { method: "DELETE" });
      if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete run");
      }
      
      toast.success("Run deleted successfully!", { id: toastId });
      router.push('/admin/payroll/run');
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const downloadBankFile = (format) => {
    window.open(`/api/v1/admin/payroll/run/${runId}/export-bank?format=${format}`, '_blank');
    setShowBankDropdown(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 relative">
          <div className="absolute inset-0 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800">Payroll Run Not Found</h2>
        <button onClick={() => router.push('/payroll/run')} className="mt-4 text-indigo-600 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const isDraft = run.status === 'Draft';
  const isLocked = run.status === 'Locked';
  const isPublished = run.status === 'Published';
  const isPaid = run.status === 'Paid';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/admin/payroll/run')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-2xl font-bold text-slate-900">
               Batch Review: {months[run.month - 1]} {run.year}
             </h1>
             <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isLocked ? 'bg-amber-100 text-amber-800 border-amber-200' :
                isPublished ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                'bg-slate-100 text-slate-800 border-slate-200'
             }`}>
               {run.status.toUpperCase()}
             </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Run ID: {run.runId}</p>
        </div>
      </div>

      {/* Progress / Status Banner */}
      {isDraft && !run.needsRecalculation && (
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-indigo-900">Review Draft Payslips</h3>
            <p className="text-indigo-800 text-sm mt-1">
              Review the aggregated totals below. If everything is correct, Lock the run to freeze the numbers. 
              Draft payslips can still be regenerated or edited individually before locking.
            </p>
          </div>
        </div>
      )}

      {/* ATTENDANCE CHANGE ALERT */}
      {run.needsRecalculation && isDraft && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start gap-4 animate-pulse">
          <div className="p-2 bg-amber-100 rounded-full">
            <RefreshCw className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              Action Required: Attendance Changes Detected
            </h3>
            <p className="text-amber-800 text-sm mt-1">
              {run.recalculationReason || "Regularization changes have been made to attendance records for this period. Current salary totals and LOP counts may be outdated."}
            </p>
            <div className="mt-3">
               <button 
                onClick={handleRecalculate}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-2"
               >
                 <Calculator className="w-4 h-4" />
                 Recalculate Batch Now
               </button>
            </div>
          </div>
        </div>
      )}


      {/* Action Buttons aligned right */}
      <div className="flex justify-end gap-3 pb-2 border-b border-slate-200">
         {isDraft && (
           <>
             <button 
               onClick={handleRecalculate}
               disabled={processing || locking}
               className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 font-medium rounded-lg transition-colors"
             >
               <Calculator className="w-4 h-4" />
               Recalculate
             </button>
             <button 
               onClick={handleDelete}
               disabled={processing || locking}
               className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-medium rounded-lg transition-colors"
             >
               <Trash2 className="w-4 h-4" />
               Delete Run
             </button>
             <button 
               onClick={handleLock}
               disabled={locking || processing}
               className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-medium rounded-lg transition-colors"
             >
               <Lock className="w-4 h-4" />
               Lock Payroll
             </button>
           </>
         )}
         
         {isLocked && (
           <button 
             onClick={handlePublish}
             disabled={publishing}
             className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-lg transition-colors"
           >
             <Send className="w-4 h-4" />
             Publish to Employees
           </button>
         )}
         
         {isPublished && (
            <button 
              onClick={() => setShowPayoutModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-medium rounded-lg transition-colors"
            >
              <Banknote className="w-4 h-4" />
              Bank Payout
            </button>
          )}

          {isPaid && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Fully Paid</span>
            </div>
          )}      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 text-slate-600 mb-2">
            <Users className="w-5 h-5" />
            <span className="font-medium text-sm">Employees Paid</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{run.processedEmployees ?? 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 text-slate-600 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="font-medium text-sm">Gross Payout</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">₹{run.totalGrossSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 text-red-500 mb-2">
            <Calculator className="w-5 h-5" />
            <span className="font-medium text-sm">Total Deductions</span>
          </div>
          <p className="text-2xl font-bold text-red-600">₹{run.totalDeductions?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-5 rounded-xl text-white">
          <div className="flex items-center gap-3 text-indigo-100 mb-2">
            <FileText className="w-5 h-5" />
            <span className="font-medium text-sm">Net Payout</span>
          </div>
          <p className="text-2xl font-bold text-white">₹{run.totalNetSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
      </div>

      {/* Generated Payslips Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8">
        <div className="p-5 border-b border-slate-100">
           <h3 className="text-lg font-bold text-slate-900">Generated Payslips</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-6 py-3 font-medium">Department</th>
                <th className="px-6 py-3 font-medium text-right">Gross Pay</th>
                <th className="px-6 py-3 font-medium text-right">Deductions</th>
                <th className="px-6 py-3 font-medium text-right">Net Pay</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payslips.map(slip => (
                <tr key={slip._id || slip.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                     {slip.employee?.employeeId} - {slip.employee?.personalDetails?.firstName} {slip.employee?.personalDetails?.lastName}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                     {slip.employee?.jobDetails?.department || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                     ₹{slip.grossSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td className="px-6 py-4 text-right text-red-600">
                     ₹{slip.totalDeductions?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-green-600">
                     ₹{slip.netSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={`px-2 py-1 rounded text-xs font-medium ${
                       slip.status === 'Locked' ? 'bg-amber-50 text-amber-700' :
                       slip.status === 'Published' ? 'bg-emerald-50 text-emerald-700' :
                       'bg-slate-100 text-slate-700'
                     }`}>
                       {slip.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button 
                       onClick={() => router.push(`/admin/payroll/payslip/${slip._id}`)}
                       className="text-indigo-600 hover:underline text-xs"
                     >
                       View Slip
                     </button>
                  </td>
                </tr>
              ))}
              {payslips.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    No payslips found for this run.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Payout Modal */}
      <BankPayoutModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        payrollRun={run}
        onUpdate={fetchData}
      />
    </div>
  );
}
