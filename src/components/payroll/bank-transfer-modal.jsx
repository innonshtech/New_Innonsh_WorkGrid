
import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function BankPayoutModal({ isOpen, onClose, payrollRun, onUpdate }) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('generate'); // generate | review | confirm

    if (!payrollRun) return null;

    const handleGenerateAdvice = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/admin/payroll/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payrollRunId: payrollRun._id,
                    action: 'generate_advice'
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to generate advice');

            // Trigger download
            const blob = new Blob([data.csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Bank advice generated!");
            setStep('confirm');
            onUpdate(); // refresh parent
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async () => {
        if (!confirm("This will mark the payroll as PAID and send notifications to all employees. Continue?")) return;

        try {
            setLoading(true);
            const res = await fetch('/api/v1/admin/payroll/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payrollRunId: payrollRun._id,
                    action: 'mark_paid'
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to mark as paid');

            toast.success("Payroll marked as paid & notifications sent!");
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-0 overflow-hidden sm:rounded-2xl">
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 px-6 pt-6 pb-20 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-white text-xl font-bold tracking-tight">Bank Transfer Payout</DialogTitle>
                        <DialogDescription className="text-slate-300">
                            Manage salary disbursement for {payrollRun.month}/{payrollRun.year}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 pb-6 space-y-5 -mt-14 relative z-20">
                    <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 backdrop-blur-sm">
                        <div className="flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Net Payable</p>
                            <p className="text-3xl font-black text-slate-900 flex items-center gap-1">
                                <span className="text-slate-400 text-2xl font-light">₹</span>
                                {(payrollRun.totalNetSalary || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                            </p>
                        </div>
                        <div className="text-right border-l border-slate-100 pl-5">
                            <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wide">Employees</p>
                            <p className="text-xl font-bold text-slate-800">{payrollRun.processedEmployees || 0}</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className={`p-5 rounded-xl border transition-all duration-300 relative group overflow-hidden ${step === 'generate' ? 'bg-white border-indigo-200 ring-1 ring-indigo-50' : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'}`}>
                            {step === 'generate' && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>}
                            <div className="flex items-start gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-colors ${step === 'generate' ? 'bg-indigo-100 text-indigo-700 ring-4 ring-indigo-50' : payrollRun.payoutStatus !== 'Pending' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {payrollRun.payoutStatus !== 'Pending' ? <CheckCircle className="w-5 h-5" /> : '1'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`font-semibold text-base ${step === 'generate' ? 'text-slate-900' : 'text-slate-700'}`}>
                                            Generate Bank Advice
                                        </h3>
                                        {payrollRun.payoutStatus === 'Processing' && <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Processing</span>}
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-4 pr-4">
                                        Download CSV file compatible with HDFC/ICICI bulk salary upload.
                                    </p>
                                    <Button
                                        onClick={handleGenerateAdvice}
                                        size="default"
                                        className={`w-full font-medium transition-all ${step === 'generate' ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700' : ''}`}
                                        variant={step === 'generate' ? 'outline' : 'secondary'}
                                        disabled={loading}
                                    >
                                        {loading && step === 'generate' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                                        {payrollRun.payoutStatus !== 'Pending' ? 'Regenerate CSV' : 'Download CSV'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className={`p-5 rounded-xl border transition-all duration-300 relative overflow-hidden ${step === 'confirm' ? 'bg-white border-emerald-200 ring-1 ring-emerald-50' : 'bg-slate-50 border-slate-200 opacity-70 grayscale-[30%]'}`}>
                            {step === 'confirm' && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>}
                            <div className="flex items-start gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-colors ${step === 'confirm' ? 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50' : payrollRun.payoutStatus === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {payrollRun.payoutStatus === 'Completed' ? <CheckCircle className="w-5 h-5" /> : '2'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`font-semibold text-base ${step === 'confirm' ? 'text-slate-900' : 'text-slate-700'}`}>
                                            Confirm Payment
                                        </h3>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-4 pr-4">
                                        Mark as paid after successful bank upload. This triggers employee notifications.
                                    </p>
                                    <Button
                                        onClick={handleMarkPaid}
                                        size="default"
                                        className={`w-full font-medium transition-all ${step === 'confirm' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-200 text-slate-400'}`}
                                        disabled={loading || step !== 'confirm'}
                                    >
                                        {loading && step === 'confirm' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                        Mark as Paid & Notify
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
