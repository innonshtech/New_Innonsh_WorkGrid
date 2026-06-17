
"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function VariablePaySection({
    variablePayStructure = [],
    onStructureChange,
    errors = {}
}) {
    const [availableComponents, setAvailableComponents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            const res = await fetch("/api/v1/admin/payroll/settings/variable-components");
            if (!res.ok) throw new Error("Failed to fetch components");
            const data = await res.json();
            setAvailableComponents(data.filter(c => c.isActive));
        } catch (error) {
            console.error("Error fetching variable pay components:", error);
            toast.error("Failed to load variable pay components");
        } finally {
            setLoading(false);
        }
    };

    const handleAddComponent = () => {
        // Find first unassigned component or default to first available
        const assignedIds = variablePayStructure.map(v => v.componentId);
        const unassigned = availableComponents.find(c => !assignedIds.includes(c._id));

        if (!unassigned) {
            toast.info("All available components are already assigned.");
            return;
        }

        const newAssignment = {
            componentId: unassigned._id,
            targetAmount: 0,
            frequency: unassigned.frequency
        };

        onStructureChange([...variablePayStructure, newAssignment]);
    };

    const handleUpdateComponent = (index, field, value) => {
        const updated = [...variablePayStructure];
        updated[index] = { ...updated[index], [field]: value };

        // If componentId changed, update frequency default
        if (field === 'componentId') {
            const comp = availableComponents.find(c => c._id === value);
            if (comp) updated[index].frequency = comp.frequency;
        }

        onStructureChange(updated);
    };

    const handleRemoveComponent = (index) => {
        const updated = variablePayStructure.filter((_, i) => i !== index);
        onStructureChange(updated);
    };

    if (loading) return <div className="p-4 text-center text-slate-500">Loading components...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center space-x-3 text-indigo-600 mb-2">
                <TrendingUp className="w-6 h-6" />
                <h2 className="text-xl font-semibold">Variable Pay Structure</h2>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div className="text-sm text-indigo-800">
                    <p className="font-semibold mb-1">Performance Linked Pay</p>
                    <p>Assign target variable pay amounts here. Actual payouts will be calculated based on achievement percentage input during each payroll run.</p>
                </div>
            </div>

            <div className="space-y-4">
                {variablePayStructure.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                        {/* Component Selection */}
                        <div className="md:col-span-5 space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Component</label>
                            <select
                                value={item.componentId}
                                onChange={(e) => handleUpdateComponent(index, 'componentId', e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            >
                                {availableComponents.map(comp => (
                                    <option
                                        key={comp._id}
                                        value={comp._id}
                                        disabled={variablePayStructure.some((v, i) => i !== index && v.componentId === comp._id)}
                                    >
                                        {comp.name} ({comp.frequency})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Target Amount */}
                        <div className="md:col-span-4 space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Target Amount (₹)</label>
                            <input
                                type="number"
                                min="0"
                                value={item.targetAmount}
                                onChange={(e) => handleUpdateComponent(index, 'targetAmount', parseFloat(e.target.value) || 0)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Frequency Display */}
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Frequency</label>
                            <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">
                                {item.frequency}
                            </div>
                        </div>

                        {/* Remove Button */}
                        <div className="md:col-span-1 flex justify-end pb-1">
                            <button
                                type="button"
                                onClick={() => handleRemoveComponent(index)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {variablePayStructure.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-500 mb-2">No variable pay components assigned.</p>
                        <button
                            type="button"
                            onClick={handleAddComponent}
                            className="text-indigo-600 font-medium hover:underline"
                        >
                            Add Component
                        </button>
                    </div>
                )}

                {variablePayStructure.length > 0 && (
                    <button
                        type="button"
                        onClick={handleAddComponent}
                        className="flex items-center space-x-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 px-4 py-2 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                        <Plus size={16} />
                        <span>Add Another Component</span>
                    </button>
                )}
            </div>

            {errors["variablePayStructure"] && (
                <div className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors["variablePayStructure"]}
                </div>
            )}
        </div>
    );
}
