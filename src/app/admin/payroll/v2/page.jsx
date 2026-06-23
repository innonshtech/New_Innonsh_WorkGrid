import PayrollMasterPortal from '@/components/payroll/v2/PayrollMasterPortal';
import { Suspense } from 'react';

export const metadata = {
  title: 'Workflow Payroll Command Center | WorkGrid ERP',
  description: 'Master workflow-driven payroll calculation engine v2 panel',
};

export default function PayrollV2Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-bold text-slate-400 bg-slate-950">Loading Command Center...</div>}>
      <PayrollMasterPortal />
    </Suspense>
  );
}

