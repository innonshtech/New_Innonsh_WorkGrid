"use client";

import { useSession } from "@/context/SessionContext";
import EmployeeClaimsManager from "@/components/finance/employee-claims-manager";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EmployeeClaimsPage() {
    const { user, loading } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || !user.id)) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading || !user || !user.id) {
        return <div className="p-8 text-center text-slate-500 font-medium">Loading your claims...</div>;
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Expense Claims
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 max-w-xl">
                        Submit reimbursement requests, track approvals and claim history.
                    </p>
                </div>
            </div>
            <EmployeeClaimsManager employeeId={user.id} />
        </div>
    );
}
