
import PayrollComparisonReport from '@/components/payroll/reports/PayrollComparisonReport';
import { FileBarChart } from 'lucide-react';

export default function ComparisonReportPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FileBarChart className="w-8 h-8 text-indigo-600" />
                    Payroll Analytics & Variance
                </h1>
                <p className="text-slate-600 mt-1">
                    Analyze trends and identify variances between payroll cycles based on employee data and salary components.
                </p>
            </div>

            <PayrollComparisonReport />
        </div>
    );
}
