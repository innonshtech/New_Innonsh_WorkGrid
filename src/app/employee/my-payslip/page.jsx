"use client";

import EmployeePayslipView from "@/components/payroll/EmployeePayslipView";

export default function MyPayslipPage() {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4 mt-2">
              <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Payroll & Payslips
                  </h1>
                  <p className="text-slate-500 text-sm mt-1 max-w-xl">
                      Access salary slips, earnings, deductions and payroll history.
                  </p>
              </div>
          </div>
      </div>
      <EmployeePayslipView />
    </>
  );
}