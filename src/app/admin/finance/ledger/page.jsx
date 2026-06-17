import FinanceDashboard from "@/components/finance/finance-dashboard";

export default function LedgerPage() {
    return (
        <div className="p-4 md:p-8">
            {/* For now, we reuse FinanceDashboard but could have a specific Ledger viewer */}
            <h2 className="text-2xl font-black text-slate-900 mb-6">General Ledger</h2>
            <FinanceDashboard initialTab="ledger" />
        </div>
    );
}
