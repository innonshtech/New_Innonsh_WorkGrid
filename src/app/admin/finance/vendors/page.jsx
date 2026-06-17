import FinanceDashboard from "@/components/finance/finance-dashboard";

export default function VendorsPage() {
    return (
        <div className="p-4 md:p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Vendor Management</h2>
            <FinanceDashboard initialTab="vendors" />
        </div>
    );
}
