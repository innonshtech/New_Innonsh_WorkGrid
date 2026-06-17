"use client";

import { useEffect, useState } from "react";
import { 
  CheckCircle, Clock, Building2, 
  Mail, Phone, ShieldCheck, Loader2,
  Calendar, RefreshCw
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function SuperAdminApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = "/api/v1/super-admin/approvals";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      } else {
        toast.error(data.message || "Failed to fetch requests");
      }
    } catch (err) {
      toast.error("Network error fetching requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (userId, action) => {
    setProcessingId(userId);
    try {
      const url = "/api/v1/super-admin/approvals/approve-request";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === 'approve' ? "Registration approved!" : "Registration rejected");
        setRequests(prev => prev.filter(r => r.id !== userId));
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (err) {
      toast.error("Network error processing request");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Clock className="w-8 h-8 text-indigo-600" />
            Client Approvals
          </h1>
          <p className="text-slate-500 mt-1">Review and manage pending organization registration requests.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={fetchRequests}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Registration Requests</h2>
          <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
            Immediate Attention Required
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Company Info</th>
                <th className="px-6 py-4">Request Date</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">Loading requests...</p>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-semibold text-lg">All caught up!</p>
                    <p className="text-slate-400 text-sm">No pending registration requests at the moment.</p>
                  </td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold">
                          {req.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{req.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {req.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-800 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {req.companyName}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded capitalize">
                           {req.industry || 'General'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                            {req.companySize || 'N/A'} Emp
                          </span>
                        </div>
                        {req.phone && (
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {req.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(req.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 pl-6">
                        {new Date(req.createdAt).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleAction(req.id, 'approve')}
                          disabled={processingId === req.id}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {processingId === req.id && <Loader2 className="w-3 h-3 animate-spin" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'reject')}
                          disabled={processingId === req.id}
                          className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 disabled:opacity-50 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">
            Only the platform owners can access this dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
