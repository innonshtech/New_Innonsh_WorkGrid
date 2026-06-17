"use client";

import { useState, useEffect } from "react";
import { Loader2, Calculator, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";


export default function FnFSettlement({ exitRequestId, employeeId, isHR, status }) {
    const [fnfData, setFnfData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (exitRequestId) {
            fetchFnFData();
        }
    }, [exitRequestId]);

    const fetchFnFData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/admin/payroll/fnf?exitRequestId=${exitRequestId}`);
            if (res.ok) {
                const data = await res.json();
                setFnfData(data); // Can be null if not yet created
            }
        } catch (error) {
            console.error("Error fetching FnF:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = async () => {
        try {
            setProcessing(true);
            const res = await fetch("/api/v1/admin/payroll/fnf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exitRequestId,
                    action: "calculate"
                })
            });

            if (res.ok) {
                const data = await res.json();
                setFnfData(data);
                toast.success("FnF Calculated successfully");
            } else {
                toast.error("Failed to calculate FnF");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error calculating FnF");
        } finally {
            setProcessing(false);
        }
    };

    // Placeholder for formatCurrency if import fails (resilient)
    const fmt = (amount) => amount?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', style: 'currency', currency: 'INR' }) || '₹0';

    if (loading) {
        return (
            <div className="p-8 flex justify-center">
                <Loader2 className="animate-spin text-slate-400" />
            </div>
        );
    }

    if (!fnfData) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-600" />
                    Full & Final Settlement
                </h2>
                <div className="text-center py-8">
                    <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calculator className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-slate-900 font-medium mb-2">Settlement Pending</h3>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                        The full and final settlement has not been processed yet.
                        Initiate calculation once all clearances are complete.
                    </p>
                    {isHR && (
                        <button
                            onClick={handleCalculate}
                            disabled={processing}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                        >
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                            Calculate FnF
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-600" />
                    Full & Final Settlement
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide 
                    ${fnfData.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {fnfData.status}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Earnings Section */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 border-b pb-2">Payable</h3>

                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Prorated Salary ({fnfData.daysWorked} days)</span>
                        <span className="font-medium">{fmt(fnfData.earnings?.totalEarnings)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">
                            Leave Encashment ({fnfData.leaveEncashment?.eligibleDays} days)
                        </span>
                        <span className="font-medium">{fmt(fnfData.leaveEncashment?.amount)}</span>
                    </div>

                    {fnfData.gratuity?.amount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Gratuity ({fnfData.gratuity?.tenureYears} years)</span>
                            <span className="font-medium">{fmt(fnfData.gratuity?.amount)}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                        <span className="font-semibold text-slate-900">Total Gross</span>
                        <span className="font-bold text-emerald-600">{fmt(fnfData.grossPayable)}</span>
                    </div>
                </div>

                {/* Deductions & Recovery Section */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 border-b pb-2">Recoveries & Deductions</h3>

                    {/* Notice Recovery */}
                    {fnfData.noticePeriod?.recoveryAmount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600 text-red-600">
                                Notice Period Shortfall ({fnfData.noticePeriod?.shortfallDays} days)
                            </span>
                            <span className="font-medium text-red-600">-{fmt(fnfData.noticePeriod?.recoveryAmount)}</span>
                        </div>
                    )}

                    {/* Add more deductions here if needed from fnfData.deductions */}

                    <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                        <span className="font-semibold text-slate-900">Total Recoveries</span>
                        <span className="font-bold text-red-600">-{fmt(fnfData.totalRecoveries)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500 mb-1">Net Payable Amount</p>
                    <p className="text-2xl font-bold text-indigo-700">{fmt(fnfData.netPayable)}</p>
                </div>

                <div className="flex gap-3">
                    {isHR && (
                        <button
                            onClick={handleCalculate}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                        >
                            Recalculate
                        </button>
                    )}
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download Statement
                    </button>
                </div>
            </div>
        </div>
    );
}
