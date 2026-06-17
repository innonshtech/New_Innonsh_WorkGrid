
"use client";

import React, { useState, useEffect } from "react";
import { X, Save, TrendingUp, AlertCircle, Filter, Search } from "lucide-react";
import { toast } from "sonner";

export default function VariablePayInputModal({ isOpen, onClose, run, onUpdate }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (isOpen && run?._id) {
            fetchData();
        }
    }, [isOpen, run]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/admin/payroll/input/variable?runId=${run._id}`);
            if (!res.ok) throw new Error("Failed to fetch variable pay data");
            const data = await res.json();
            setEmployees(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load variable pay data");
        } finally {
            setLoading(false);
        }
    };

    const handleAchievementChange = (empId, compId, value) => {
        const percentage = Math.max(0, parseFloat(value) || 0);

        setEmployees(prev => prev.map(emp => {
            if (emp.employeeId !== empId) return emp;

            return {
                ...emp,
                structure: emp.structure.map(comp => {
                    if (comp.componentId !== compId) return comp;

                    return {
                        ...comp,
                        achievementPercentage: percentage,
                        payoutAmount: (comp.targetAmount * percentage) / 100
                    };
                })
            };
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Flatten data for API
            const inputs = [];
            employees.forEach(emp => {
                emp.structure.forEach(comp => {
                    inputs.push({
                        employeeId: emp.employeeId,
                        componentId: comp.componentId,
                        achievementPercentage: comp.achievementPercentage,
                        payoutAmount: comp.payoutAmount
                    });
                });
            });

            const res = await fetch("/api/v1/admin/payroll/input/variable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ runId: run._id, inputs })
            });

            if (!res.ok) throw new Error("Failed to save inputs");

            toast.success("Variable pay inputs saved successfully");
            if (onUpdate) onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                            </div>
                            Variable Pay Input
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Enter achievement percentages for {run?.month}/{run?.year}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredEmployees.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    No employees found with variable pay components.
                                </div>
                            ) : (
                                filteredEmployees.map(emp => (
                                    <div key={emp.employeeId} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{emp.name}</p>
                                                    <p className="text-[10px] text-slate-500">{emp.code}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="grid grid-cols-12 gap-4 mb-2 text-xs font-semibold text-slate-500 uppercase px-2">
                                                <div className="col-span-4">Component</div>
                                                <div className="col-span-2 text-right">Target</div>
                                                <div className="col-span-3 text-center">Achievement %</div>
                                                <div className="col-span-3 text-right">Payout</div>
                                            </div>
                                            <div className="space-y-3">
                                                {emp.structure.map(comp => (
                                                    <div key={comp.componentId} className="grid grid-cols-12 gap-4 items-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                                                        <div className="col-span-4">
                                                            <p className="text-sm font-medium text-slate-700">{comp.componentName}</p>
                                                            <p className="text-[10px] text-slate-400">{comp.frequency}</p>
                                                        </div>
                                                        <div className="col-span-2 text-right text-sm text-slate-600">
                                                            ₹{comp.targetAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                                        </div>
                                                        <div className="col-span-3">
                                                            <div className="flex items-center justify-center">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="200"
                                                                    value={comp.achievementPercentage}
                                                                    onChange={(e) => handleAchievementChange(emp.employeeId, comp.componentId, e.target.value)}
                                                                    className="w-20 text-center px-2 py-1 border border-slate-300 rounded-md text-sm font-semibold text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                                />
                                                                <span className="ml-1 text-slate-500 text-sm">%</span>
                                                            </div>
                                                        </div>
                                                        <div className="col-span-3 text-right font-bold text-emerald-600 text-sm">
                                                            ₹{comp.payoutAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save & Close
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
