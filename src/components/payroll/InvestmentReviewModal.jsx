"use client";

import React, { useState } from "react";
import {
    X,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Info,
    ChevronRight,
    ArrowDownRight,
    ArrowUpRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function InvestmentReviewModal({ declaration, onClose, onUpdate }) {
    const [submitting, setSubmitting] = useState(false);
    const [remark, setRemark] = useState(declaration.remark || "");

    const handleAction = async (status) => {
        try {
            setSubmitting(true);
            const res = await fetch('/api/v1/admin/payroll/investments', {
                method: 'POST', // Reusing POST for update
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: declaration.employeeId?._id || declaration.employeeId,
                    financialYear: declaration.financialYear,
                    status,
                    remark
                })
            });

            if (!res.ok) throw new Error("Failed to update status");

            toast.success(`Declaration ${status.toLowerCase()} successfully`);
            onUpdate();
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const SectionHeader = ({ icon: Icon, title, amount }) => (
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="font-bold text-slate-900">{title}</h4>
            </div>
            <div className="text-right">
                <p className="text-sm font-black text-slate-900">₹{amount?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Declared</p>
            </div>
        </div>
    );

    const DetailItem = ({ label, value }) => (
        <div className="flex justify-between items-center py-2 text-sm border-b border-slate-50 last:border-none">
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-900">₹{value?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) || '0'}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Review Declaration</h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {declaration.employeeId?.personalDetails?.firstName} {declaration.employeeId?.personalDetails?.lastName} • {declaration.financialYear}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {/* Summary Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Submitted On</p>
                            <p className="font-bold text-slate-900">
                                {declaration.updatedAt && !isNaN(new Date(declaration.updatedAt).getTime()) ? format(new Date(declaration.updatedAt), 'MMM dd, yyyy') : 'N/A'}
                            </p>
                        </div>
                        <div className={`p-4 rounded-2xl border ${declaration.status === 'Approved' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                            <p className={`text-[10px] font-bold ${declaration.status === 'Approved' ? 'text-emerald-500' : 'text-amber-500'} uppercase mb-1 tracking-wider`}>Current Status</p>
                            <p className="font-bold text-slate-900">{declaration.status}</p>
                        </div>
                    </div>

                    {/* Section 80C */}
                    <div>
                        <SectionHeader icon={ShieldCheck} title="Section 80C" amount={declaration.sections?.section80C?.total} />
                        <div className="px-4 space-y-1">
                            <DetailItem label="Public Provident Fund (PPF)" value={declaration.sections?.section80C?.ppf} />
                            <DetailItem label="ELSS Mutual Funds" value={declaration.sections?.section80C?.elss} />
                            <DetailItem label="LIC / Life Insurance" value={declaration.sections?.section80C?.lic} />
                            <DetailItem label="National Savings Certificate" value={declaration.sections?.section80C?.nsc} />
                            <DetailItem label="Others" value={declaration.sections?.section80C?.others} />
                        </div>
                        <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-3">
                            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
                                Max limit for 80C is ₹1,50,000. Any amount exceeding this will not provide additional tax benefit.
                            </p>
                        </div>
                    </div>

                    {/* Section 80D */}
                    <div>
                        <SectionHeader icon={AlertCircle} title="Section 80D" amount={declaration.sections?.section80D?.total} />
                        <div className="px-4">
                            <DetailItem label="Mediclaim (Self/Family)" value={declaration.sections?.section80D?.mediclaimSelf} />
                            <DetailItem label="Mediclaim (Parents)" value={declaration.sections?.section80D?.mediclaimParents} />
                        </div>
                    </div>

                    {/* HRA */}
                    <div>
                        <SectionHeader icon={Info} title="House Rent Allowance (HRA)" amount={declaration.sections?.hra?.annualRent} />
                        <div className="px-4">
                            <DetailItem label="Annual Rent Amount" value={declaration.sections?.hra?.annualRent} />
                            <DetailItem label="Monthly Rent" value={Math.round((declaration.sections?.hra?.annualRent || 0) / 12)} />
                            <div className="flex justify-between items-center py-2 text-sm">
                                <span className="text-slate-500">Landlord PAN</span>
                                <span className="font-mono font-bold text-indigo-600 uppercase tracking-wider">{declaration.sections?.hra?.landlordPan || 'NOT PROVIDED'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Admin Remark */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Reviewer Remark</label>
                        <textarea
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="Add internal notes or reason for rejection..."
                            className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none resize-none transition-all"
                        />
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
                    <button
                        disabled={submitting}
                        onClick={() => handleAction('Rejected')}
                        className="flex-1 py-4 px-6 rounded-2xl border border-red-200 bg-white text-red-600 text-sm font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                        <XCircle className="w-5 h-5" /> Reject
                    </button>
                    <button
                        disabled={submitting}
                        onClick={() => handleAction('Approved')}
                        className="flex-[2] py-4 px-6 rounded-2xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-5 h-5" /> Approve Declaration
                    </button>
                </div>
            </div>
        </div>
    );
}
