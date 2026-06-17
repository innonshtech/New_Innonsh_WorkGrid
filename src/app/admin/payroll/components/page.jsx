"use client";

import React, { useState, useEffect } from "react";
import {
    Calculator,
    Plus,
    Search,
    Settings2,
    Trash2,
    Edit2,
    ArrowUpCircle,
    ArrowDownCircle,
    CheckCircle2,
    XCircle,
    Info,
    Layers,
    MoreVertical
} from "lucide-react";
import { toast } from "react-hot-toast";

const ComponentModal = ({ isOpen, onClose, component, onSave }) => {
    const [formData, setFormData] = useState(component || {
        name: "",
        type: "Earning",
        calculationType: "Percentage",
        percentageOf: "Basic",
        defaultValue: 0,
        category: "Standard",
        isTaxable: true,
        isStatutory: false,
        enabled: true,
        description: ""
    });

    useEffect(() => {
        if (component) setFormData(component);
        else setFormData({
            name: "",
            type: "Earning",
            calculationType: "Percentage",
            percentageOf: "Basic",
            defaultValue: 0,
            category: "Standard",
            isTaxable: true,
            isStatutory: false,
            enabled: true,
            description: ""
        });
    }, [component, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-indigo-600" />
                        {component ? "Edit Component" : "Add New Component"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Component Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. House Rent Allowance"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                            >
                                <option value="Earning">Earning</option>
                                <option value="Deduction">Deduction</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Calculation</label>
                            <select
                                value={formData.calculationType}
                                onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                            >
                                <option value="Percentage">Percentage</option>
                                <option value="Fixed">Fixed Amount</option>
                                <option value="Computed">Auto-Computed</option>
                            </select>
                        </div>

                        {formData.calculationType === 'Percentage' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Value (%)</label>
                                    <input
                                        type="number"
                                        value={formData.defaultValue}
                                        onChange={(e) => setFormData({ ...formData, defaultValue: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Percentage Of</label>
                                    <select
                                        value={formData.percentageOf}
                                        onChange={(e) => setFormData({ ...formData, percentageOf: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                                    >
                                        <option value="Basic">Basic Salary</option>
                                        <option value="Gross">Gross Salary</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isTaxable}
                                    onChange={(e) => setFormData({ ...formData, isTaxable: e.target.checked })}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Taxable Component</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isStatutory}
                                    onChange={(e) => setFormData({ ...formData, isStatutory: e.target.checked })}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Statutory (PF/ESI)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(formData)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition- hover:"
                    >
                        Save Component
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function SalaryComponentsPage() {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComponent, setEditingComponent] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/v1/admin/payroll/components");
            const data = await res.json();
            setComponents(data);
        } catch (error) {
            toast.error("Failed to load components");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data) => {
        try {
            const url = editingComponent ? `/api/v1/admin/payroll/components/${editingComponent._id}` : "/api/v1/admin/payroll/components";
            const method = editingComponent ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, createdBy: "66e2f79f3b8d2e1f1a9d9c33" })
            });

            if (!res.ok) throw new Error("Save failed");

            toast.success(`Component ${editingComponent ? "updated" : "created"}`);
            setIsModalOpen(false);
            fetchComponents();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const deleteComponent = async (id, e) => {
        if (e) e.stopPropagation();

        if (!confirm("Are you sure you want to delete this component?")) return;

        try {
            console.log("Triggering delete for:", id);
            const result = await deleteSalaryComponent(id);

            if (result.success) {
                toast.success("Component deleted");
                // Force a re-fetch to update UI state immediately
                await fetchComponents();
            } else {
                console.error("Server returned error:", result.error);
                toast.error(result.error || "Deletion failed");
            }
        } catch (error) {
            console.error("Delete handler error:", error);
            toast.error("Something went wrong");
        }
    };

    const filteredComponents = components.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                <Settings2 className="w-6 h-6" />
                            </div>
                            Salary Component Master
                        </h1>
                        <p className="text-slate-500 mt-1">Configure global earning and deduction rules</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search components..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-64 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => { setEditingComponent(null); setIsModalOpen(true); }}
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all hover: flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Component
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                        ))
                    ) : filteredComponents.length === 0 ? (
                        <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500">
                            <Layers className="w-12 h-12 mb-3 text-slate-200" />
                            <p>No components found. Create your first salary head!</p>
                        </div>
                    ) : (
                        filteredComponents.map((comp) => (
                            <div key={comp._id} className="bg-white rounded-2xl border border-slate-200 p-5 hover: transition- group relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 ${comp.type === 'Earning' ? 'bg-emerald-500' : 'bg-red-500'}`} />

                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-2 rounded-lg ${comp.type === 'Earning' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {comp.type === 'Earning' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => { setEditingComponent(comp); setIsModalOpen(true); }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => deleteComponent(comp._id, e)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate pr-8">
                                        {comp.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
                                        {comp.description || "No description provided for this component."}
                                    </p>
                                </div>

                                <div className="mt-6 flex flex-wrap gap-2">
                                    <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-600 rounded-md uppercase">
                                        {comp.calculationType}
                                    </span>
                                    {comp.calculationType === 'Percentage' && (
                                        <span className="px-2 py-0.5 bg-indigo-50 text-[10px] font-bold text-indigo-600 rounded-md">
                                            {comp.defaultValue}% of {comp.percentageOf}
                                        </span>
                                    )}
                                    {comp.isTaxable && (
                                        <span className="px-2 py-0.5 bg-amber-50 text-[10px] font-bold text-amber-600 rounded-md">
                                            Taxable
                                        </span>
                                    )}
                                    {comp.isStatutory && (
                                        <span className="px-2 py-0.5 bg-purple-50 text-[10px] font-bold text-purple-600 rounded-md">
                                            Statutory
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                                        <Info className="w-3 h-3" />
                                        ID: {comp._id.substring(comp._id.length - 8).toUpperCase()}
                                    </div>
                                    {comp.enabled ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                            <RefreshCw className="w-3 h-3" />
                                            Disabled
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <ComponentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    component={editingComponent}
                    onSave={handleSave}
                />
            </div>
        </div>
    );
}
