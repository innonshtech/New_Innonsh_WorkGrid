"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function Redirector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    const target = `/admin/payroll/v2${params ? `?${params}` : ''}`;
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center font-bold text-slate-400 bg-slate-950">
      Redirecting to Command Center...
    </div>
  );
}

export default function PayrollPage() {
  return (
    <Suspense fallback={null}>
      <Redirector />
    </Suspense>
  );
}