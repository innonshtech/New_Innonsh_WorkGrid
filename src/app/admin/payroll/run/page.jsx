"use client";

import { useSession } from "@/context/SessionContext";
import PayrollRunDashboard from "@/components/payroll/payroll-run-dashboard";

export default function RunPayrollPage() {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 relative">
          <div className="absolute inset-0 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Double check authorization, although middleware should handle it
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
           <span className="text-red-500 text-2xl font-bold">!</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-600 max-w-md">
          You do not have permission to run payroll batches. This feature is restricted to Organization Administrators and Super Admins.
        </p>
      </div>
    );
  }

  return (
    <PayrollRunDashboard />
  );
}
