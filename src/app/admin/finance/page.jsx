import FinanceDashboard from "@/components/finance/finance-dashboard";

export const metadata = {
    title: "Finance Hub | XperHR",
    description: "Financial overview and command center",
};

export default async function FinancePage({ searchParams }) {
    const params = await searchParams;
    const tab = params?.tab || "overview";
    return (
        <div className="p-4 md:p-8">
            <FinanceDashboard initialTab={tab} />
        </div>
    );
}
