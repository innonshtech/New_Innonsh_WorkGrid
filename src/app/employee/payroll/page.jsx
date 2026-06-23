import EmployeePayrollDashboard from '@/components/payroll/v2/employee/EmployeePayrollDashboard';
import { Suspense } from 'react';

export const metadata = {
  title: 'My Payroll Portal | WorkGrid ERP',
  description: 'View payslips, submit tax declarations, and manage support tickets',
};

export default function EmployeePayrollPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-bold text-slate-400 bg-slate-950">Loading Portal...</div>}>
      <EmployeePayrollDashboard />
    </Suspense>
  );
}

