"use client";

import { useEffect, useState } from "react";
import { 
  Users, Clock, Building2, CheckCircle,
  ShieldCheck, Loader2, RefreshCw, AlertCircle
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalEmployees: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = "/api/v1/super-admin/stats";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || "Failed to fetch stats");
      }
    } catch (err) {
      setError("Network error fetching stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            Super Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Overview of system health and platform usage.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-800">Error Loading Stats</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Clients</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalOrganizations}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Clients</p>
              <p className="text-2xl font-bold text-slate-900">{stats.activeOrganizations}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Employees</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalEmployees}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Pending Approvals</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

