
"use client";
import React, { useState, useEffect } from "react";
import {
    TrendingUp,
    TrendingDown,
    Users,
    ArrowRight,
    Search,
    Download,
    Filter,
    AlertCircle,
    CheckCircle,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { format } from "date-fns";

export default function PayrollComparisonReport() {
    const [runs, setRuns] = useState([]);
    const [loadingRuns, setLoadingRuns] = useState(true);
    const [run1Id, setRun1Id] = useState("");
    const [run2Id, setRun2Id] = useState("");
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [activeTab, setActiveTab] = useState("salary_changes"); // salary_changes, new_joiners, exits

    useEffect(() => {
        fetchRuns();
    }, []);

    const fetchRuns = async () => {
        try {
            const res = await fetch("/api/v1/admin/payroll/run");
            const data = await res.json();
            if (Array.isArray(data)) {
                setRuns(data);
                // Default to last 2 runs if available
                if (data.length >= 2) {
                    setRun2Id(data[0]._id); // Most recent
                    setRun1Id(data[1]._id); // Previous
                }
            }
        } catch (error) {
            console.error("Failed to fetch runs:", error);
        } finally {
            setLoadingRuns(false);
        }
    };

    const generateReport = async () => {
        if (!run1Id || !run2Id) return;
        setLoadingReport(true);
        try {
            const res = await fetch(`/api/v1/admin/payroll/reports/comparison?runId1=${run1Id}&runId2=${run2Id}`);
            const data = await res.json();
            if (res.ok) {
                setReportData(data);
            } else {
                console.error("Report error:", data.error);
            }
        } catch (error) {
            console.error("Failed to generate report:", error);
        } finally {
            setLoadingReport(false);
        }
    };

    // Auto-generate when both runs are selected
    useEffect(() => {
        if (run1Id && run2Id) {
            generateReport();
        }
    }, [run1Id, run2Id]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getVarianceColor = (amount) => {
        if (amount > 0) return "text-red-600"; // Cost increased
        if (amount < 0) return "text-green-600"; // Cost decreased
        return "text-slate-600";
    };

    if (loadingRuns) {
        return <div className="p-8 text-center text-slate-500">Loading payroll data...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Payroll Variance Report</h2>
                    <p className="text-sm text-slate-500">Compare payroll costs between two months</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="flex flex-col">
                        <label className="text-xs text-slate-500 mb-1 ml-1">Base Run (Previous)</label>
                        <select
                            value={run1Id}
                            onChange={(e) => setRun1Id(e.target.value)}
                            className="bg-white border-slate-300 text-sm rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Select Run</option>
                            {runs.map(run => (
                                <option key={run._id} value={run._id}>
                                    {format(new Date(run.year, run.month - 1), 'MMMM yyyy')} ({run.status})
                                </option>
                            ))}
                        </select>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 mt-5" />
                    <div className="flex flex-col">
                        <label className="text-xs text-slate-500 mb-1 ml-1">Comparison Run (Current)</label>
                        <select
                            value={run2Id}
                            onChange={(e) => setRun2Id(e.target.value)}
                            className="bg-white border-slate-300 text-sm rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Select Run</option>
                            {runs.map(run => (
                                <option key={run._id} value={run._id}>
                                    {format(new Date(run.year, run.month - 1), 'MMMM yyyy')} ({run.status})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loadingReport ? (
                <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Calculating variances...</p>
                </div>
            ) : reportData ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <VarianceCard
                            title="Total Net Pay"
                            current={reportData.summary.run2.net}
                            previous={reportData.summary.run1.net}
                            variance={reportData.summary.variance.net}
                            percentage={reportData.summary.variancePercentage.net}
                            format={formatCurrency}
                        />
                        <VarianceCard
                            title="Total Gross Pay"
                            current={reportData.summary.run2.gross}
                            previous={reportData.summary.run1.gross}
                            variance={reportData.summary.variance.gross}
                            percentage={reportData.summary.variancePercentage.gross}
                            format={formatCurrency}
                        />
                        <VarianceCard
                            title="Headcount"
                            current={reportData.summary.run2.employees}
                            previous={reportData.summary.run1.employees}
                            variance={reportData.summary.variance.employees}
                            percentage={0} // Headcount % is less standard
                            isCount={true}
                        />
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-200">
                            <nav className="flex -mb-px">
                                <TabButton
                                    active={activeTab === 'salary_changes'}
                                    onClick={() => setActiveTab('salary_changes')}
                                    label={`Salary Changes (${reportData.details.totalChanges})`}
                                    icon={TrendingUp}
                                />
                                <TabButton
                                    active={activeTab === 'new_joiners'}
                                    onClick={() => setActiveTab('new_joiners')}
                                    label={`New Joiners (${reportData.details.newJoiners.length})`}
                                    icon={Users}
                                />
                                <TabButton
                                    active={activeTab === 'exits'}
                                    onClick={() => setActiveTab('exits')}
                                    label={`Exits (${reportData.details.exits.length})`}
                                    icon={TrendingDown}
                                />
                            </nav>
                        </div>

                        <div className="p-0">
                            {activeTab === 'salary_changes' && (
                                <SalaryChangesTable
                                    data={reportData.details.salaryChanges}
                                    formatCurrency={formatCurrency}
                                    run1Label={reportData.meta.run1.label}
                                    run2Label={reportData.meta.run2.label}
                                />
                            )}
                            {activeTab === 'new_joiners' && (
                                <NewJoinersTable
                                    data={reportData.details.newJoiners}
                                    formatCurrency={formatCurrency}
                                />
                            )}
                            {activeTab === 'exits' && (
                                <ExitsTable
                                    data={reportData.details.exits}
                                    formatCurrency={formatCurrency}
                                />
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">Select Payroll Runs</h3>
                    <p className="text-slate-500">Choose a Base Run and a Comparison Run to see the variance report.</p>
                </div>
            )}
        </div>
    );
}

function VarianceCard({ title, current, previous, variance, percentage, format = (v) => v, isCount = false }) {
    const isPositive = variance > 0;
    const isNeutral = variance === 0;

    // For cost, increase is usually "bad" (red), decrease is "good" (green) - but neutral is gray
    // For headcount, color is less strictly "good/bad"
    let colorClass = "text-slate-600";
    if (!isNeutral) {
        if (isCount) {
            colorClass = isPositive ? "text-green-600" : "text-red-600";
        } else {
            colorClass = isPositive ? "text-red-600" : "text-green-600";
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
            <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">{format(current)}</span>
                <div className={`flex items-center text-sm font-medium ${colorClass}`}>
                    {percentage !== 0 && !isNeutral && (
                        isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />
                    )}
                    <span>{isPositive ? "+" : ""}{isCount ? variance : format(variance)}</span>
                    {!isCount && <span className="ml-1">({percentage.toFixed(1)}%)</span>}
                </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
                Previous: {format(previous)}
            </p>
        </div>
    );
}

function TabButton({ active, onClick, label, icon: Icon }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 w-full sm:w-auto px-6 py-4 text-sm font-medium border-b-2 transition-colors
                ${active
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }
            `}
        >
            <Icon className={`w-4 h-4 ${active ? "text-indigo-600" : "text-slate-400"}`} />
            {label}
        </button>
    );
}

function SalaryChangesTable({ data, formatCurrency, run1Label, run2Label }) {
    if (data.length === 0) return <EmptyState message="No salary changes detected between these periods." />;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-3 font-semibold text-slate-900">Employee</th>
                        <th className="px-6 py-3 font-semibold text-slate-900 text-right">{run1Label} (Net)</th>
                        <th className="px-6 py-3 font-semibold text-slate-900 text-right">{run2Label} (Net)</th>
                        <th className="px-6 py-3 font-semibold text-slate-900 text-right">Variance</th>
                        <th className="px-6 py-3 font-semibold text-slate-900">Reason</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-medium text-slate-900">{item.name}</div>
                                <div className="text-xs text-slate-500">{item.department} • {item.designation}</div>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(item.previousNet)}</td>
                            <td className="px-6 py-4 text-right text-slate-900 font-medium">{formatCurrency(item.currentNet)}</td>
                            <td className={`px-6 py-4 text-right font-medium ${item.netVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {item.netVariance > 0 ? "+" : ""}{formatCurrency(item.netVariance)}
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                    {item.reason}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function NewJoinersTable({ data, formatCurrency }) {
    if (data.length === 0) return <EmptyState message="No new joiners in this period." />;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-3 font-semibold text-slate-900">Employee</th>
                        <th className="px-6 py-3 font-semibold text-slate-900">Department</th>
                        <th className="px-6 py-3 font-semibold text-slate-900 text-right">Net Salary</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                            <td className="px-6 py-4 text-slate-600">{item.department}</td>
                            <td className="px-6 py-4 text-right text-green-600 font-medium">{formatCurrency(item.currentNetSalary)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ExitsTable({ data, formatCurrency }) {
    if (data.length === 0) return <EmptyState message="No exits in this period." />;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-3 font-semibold text-slate-900">Employee</th>
                        <th className="px-6 py-3 font-semibold text-slate-900">Department</th>
                        <th className="px-6 py-3 font-semibold text-slate-900 text-right">Last Salary</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                            <td className="px-6 py-4 text-slate-600">{item.department}</td>
                            <td className="px-6 py-4 text-right text-slate-500">{formatCurrency(item.lastNetSalary)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">{message}</p>
        </div>
    );
}
