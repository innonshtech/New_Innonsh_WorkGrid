"use client";

import ExpenseManager from "@/components/finance/expense-manager";
import { useSession } from "@/context/SessionContext";
import { Suspense } from "react";

export default function ExpensesPage() {
    return (
        <Suspense fallback={<div>Loading expenses...</div>}>
            <ExpensesContent />
        </Suspense>
    );
}

function ExpensesContent() {
    const { user } = useSession();

    return (
        <div className="p-4 md:p-8">
            <ExpenseManager
                employeeId={user?._id}
                isAdmin={user?.role === 'admin'}
            />
        </div>
    );
}
