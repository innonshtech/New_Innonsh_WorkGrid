"use client";

import { useState } from "react";
import { X, Plus, Trash2, Save, CreditCard } from "lucide-react";
import { toast } from "react-hot-toast";

export default function JournalEntryModal({ isOpen, onClose, onEntrySaved }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: "",
        referenceNumber: "",
        source: "Manual",
        lines: [
            { id: 1, accountName: "", accountType: "Expense", debit: 0, credit: 0 },
            { id: 2, accountName: "", accountType: "Asset", debit: 0, credit: 0 }
        ]
    });

    if (!isOpen) return null;

    const calculateTotals = () => {
        const totalDebit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
        const totalCredit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
        return { totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
    };

    const { totalDebit, totalCredit, balanced } = calculateTotals();

    const addLine = () => {
        setFormData({
            ...formData,
            lines: [...formData.lines, { id: Date.now(), accountName: "", accountType: "Expense", debit: 0, credit: 0 }]
        });
    };

    const removeLine = (id) => {
        if (formData.lines.length <= 2) {
            toast.error("Entry must have at least 2 lines");
            return;
        }
        setFormData({
            ...formData,
            lines: formData.lines.filter(l => l.id !== id)
        });
    };

    const updateLine = (id, field, value) => {
        setFormData({
            ...formData,
            lines: formData.lines.map(l => l.id === id ? { ...l, [field]: value } : l)
        });
    };

    const handleSubmit = async () => {
        if (!balanced) {
            toast.error("Journal Entry must be balanced (Debits = Credits)");
            return;
        }
        if (!formData.description || !formData.referenceNumber) {
            toast.error("Please fill in Description and Reference Number");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                totalDebit,
                totalCredit,
                // Clean up lines (remove temp id, ensure numbers)
                lines: formData.lines.map(({ id, ...rest }) => ({
                    ...rest,
                    debit: parseFloat(rest.debit) || 0,
                    credit: parseFloat(rest.credit) || 0
                }))
            };

            const res = await fetch('/api/v1/admin/finance/ledger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to post entry");

            toast.success("Journal Entry Posted Successfully");
            onEntrySaved();
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-600" />
                            New Journal Entry
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Record manual accounting transaction</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Header Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reference No.</label>
                            <input
                                type="text"
                                placeholder="Ref-001"
                                value={formData.referenceNumber}
                                onChange={e => setFormData({ ...formData, referenceNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                            <input
                                type="text"
                                placeholder="e.g. Office Supplies Purchase"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    {/* Lines Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Account Name</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3 text-right">Debit</th>
                                    <th className="px-4 py-3 text-right">Credit</th>
                                    <th className="px-4 py-3 text-center w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {formData.lines.map((line) => (
                                    <tr key={line.id} className="hover:bg-slate-50/50">
                                        <td className="p-2">
                                            <input
                                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                                placeholder="Account Name"
                                                value={line.accountName}
                                                onChange={e => updateLine(line.id, 'accountName', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select
                                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
                                                value={line.accountType}
                                                onChange={e => updateLine(line.id, 'accountType', e.target.value)}
                                            >
                                                {['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-right"
                                                value={line.debit}
                                                onChange={e => updateLine(line.id, 'debit', e.target.value)}
                                                onFocus={e => e.target.select()}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-right"
                                                value={line.credit}
                                                onChange={e => updateLine(line.id, 'credit', e.target.value)}
                                                onFocus={e => e.target.select()}
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button
                                                onClick={() => removeLine(line.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold text-slate-700">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 text-right uppercase text-xs text-slate-500">Totals</td>
                                    <td className="px-4 py-3 text-right text-indigo-600">₹{totalDebit.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</td>
                                    <td className="px-4 py-3 text-right text-indigo-600">₹{totalCredit.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <button
                        onClick={addLine}
                        className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors border border-dashed border-indigo-200"
                    >
                        <Plus className="w-4 h-4" /> Add Line Item
                    </button>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${balanced ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {balanced ? "Entry is Balanced" : "Entry is Unbalanced"}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !balanced}
                            className={`px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all flex items-center gap-2 ${loading || !balanced ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:'}`}
                        >
                            <Save className="w-4 h-4" />
                            {loading ? "Posting..." : "Post Entry"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
