"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare, Search, Filter, RefreshCw,
  Mail, Phone, Building2, Users, Calendar, Clock,
  CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight, Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function DemoRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resendingId, setResendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch all demo requests
  const fetchRequests = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const res = await fetch("/api/v1/super-admin/demo-requests");
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      } else {
        setError(data.message || "Failed to fetch demo requests");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle manual resend of sandbox credentials
  const handleResendCredentials = async (id) => {
    setResendingId(id);
    try {
      const res = await fetch("/api/v1/super-admin/demo-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Credentials resent successfully!");
        fetchRequests(true); // Silent refresh
      } else {
        toast.error(data.message || "Failed to resend credentials");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during credentials resend");
    } finally {
      setResendingId(null);
    }
  };

  // Handle delete demo request and deactivate user
  const handleDeleteRequest = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the demo request from "${name}"? This will also deactivate their trial account and they will no longer be able to log in.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/super-admin/demo-requests?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Demo request deleted & user account deactivated!");
        fetchRequests(true);
      } else {
        toast.error(data.message || "Failed to delete demo request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during deletion");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter requests based on search and status
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.phone?.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Count metrics
  const totalCount = requests.length;
  const sentCount = requests.filter((r) => r.status === "credentials_sent").length;
  const failedCount = requests.filter((r) => r.status === "failed").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Demo Walkthrough Requests</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage incoming leads and sandbox environment accounts.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRequests(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Leads</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalCount}</p>
            <p className="text-xs text-slate-400 mt-1">Requested sandbox trials</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Credentials Emailed</p>
            <p className="text-3xl font-extrabold text-green-600 mt-1">{sentCount}</p>
            <p className="text-xs text-slate-400 mt-1">Accounts active & notified</p>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Delivery Failures</p>
            <p className="text-3xl font-extrabold text-red-600 mt-1">{failedCount}</p>
            <p className="text-xs text-slate-400 mt-1">Pending manual re-send</p>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="md:col-span-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Delivery Statuses</option>
            <option value="credentials_sent">Credentials Emailed</option>
            <option value="pending">Pending Processing</option>
            <option value="failed">Delivery Failed</option>
          </select>
        </div>

        <div className="md:col-span-2">
          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-800">Connection Error</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-20 flex justify-center items-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Fetching inquiries...</p>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-400">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No requests found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "We couldn't find any requests matching your filters. Try adjusting your search query."
              : "Demo request submissions from your portfolio landing page will appear here."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Applicant & Lead</th>
                  <th className="px-6 py-4">Company & Size</th>
                  <th className="px-6 py-4">Sandbox Password</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Submitting</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Applicant & Lead */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{req.name}</div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="w-3.5 h-3.5" />
                          {req.email}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="w-3.5 h-3.5" />
                          {req.phone}
                        </span>
                      </div>
                    </td>

                    {/* Company & Size */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {req.companyName}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {req.companySize} employees
                      </div>
                    </td>

                    {/* Sandbox Password */}
                    <td className="px-6 py-4">
                      {req.loginPassword ? (
                        <code className="px-2.5 py-1 bg-slate-100 text-slate-800 font-semibold font-mono text-xs rounded-md border border-slate-200">
                          {req.loginPassword}
                        </code>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {req.status === "credentials_sent" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 border border-green-200 text-green-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          Sent Successfully
                        </span>
                      ) : req.status === "failed" ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-700 w-fit">
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                            Email Failed
                          </span>
                          {req.error && (
                            <span className="text-[10px] text-red-500 max-w-[200px] truncate" title={req.error}>
                              {req.error}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Date Submitting */}
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(req.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.loginPassword && (
                          <button
                            onClick={() => handleResendCredentials(req._id)}
                            disabled={resendingId === req._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-slate-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
                          >
                            {resendingId === req._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Mail className="w-3 h-3" />
                            )}
                            Resend
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRequest(req._id, req.name)}
                          disabled={deletingId === req._id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-all"
                        >
                          {deletingId === req._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
