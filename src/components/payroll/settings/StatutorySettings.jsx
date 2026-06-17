"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

export default function StatutorySettings() {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        state: "",
        isEnabled: true,
        ptApplicable: true,
        ptSlabs: [],
        lwfApplicable: false,
        lwfRules: {
            employeeContribution: 0,
            employerContribution: 0,
            deductionCycle: 'monthly',
            deductionMonths: []
        }
    });

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await fetch("/api/v1/admin/payroll/settings/statutory");
            const data = await res.json();
            if (Array.isArray(data)) {
                setConfigs(data);
            }
        } catch (error) {
            console.error("Failed to fetch statutory configs", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (config) => {
        setEditingId(config._id);
        setFormData({
            state: config.state,
            isEnabled: config.isEnabled,
            ptApplicable: config.ptApplicable,
            ptSlabs: config.ptSlabs || [],
            lwfApplicable: config.lwfApplicable,
            lwfRules: config.lwfRules || {
                employeeContribution: 0,
                employerContribution: 0,
                deductionCycle: 'monthly',
                deductionMonths: []
            }
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            state: "",
            isEnabled: true,
            ptApplicable: true,
            ptSlabs: [],
            lwfApplicable: false,
            lwfRules: {
                employeeContribution: 0,
                employerContribution: 0,
                deductionCycle: 'monthly',
                deductionMonths: []
            }
        });
    };

    const addPtSlab = () => {
        setFormData(prev => ({
            ...prev,
            ptSlabs: [...prev.ptSlabs, { minSalary: 0, maxSalary: 0, taxAmount: 0 }]
        }));
    };

    const removePtSlab = (index) => {
        setFormData(prev => ({
            ...prev,
            ptSlabs: prev.ptSlabs.filter((_, i) => i !== index)
        }));
    };

    const updatePtSlab = (index, field, value) => {
        const newSlabs = [...formData.ptSlabs];
        newSlabs[index][field] = Number(value);
        setFormData({ ...formData, ptSlabs: newSlabs });
    };

    const handleSave = async () => {
        if (!formData.state) {
            toast.error("State name is required");
            return;
        }

        try {
            const res = await fetch("/api/v1/admin/payroll/settings/statutory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Configuration saved");
                fetchConfigs();
                handleCancel();
            } else {
                toast.error(data.error || "Failed to save");
            }
        } catch (error) {
            toast.error("Error saving configuration");
        }
    };

    return (
        <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">State Statutory Settings</h2>
                {!editingId && (
                    <button
                        onClick={() => setEditingId('new')}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                        <Plus size={16} /> Add State
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-4">Loading configurations...</div>
            ) : (
                <div className="space-y-6">
                    {/* EDIT/CREATE FORM */}
                    {editingId && (
                        <div className="border border-indigo-100 rounded-lg p-4 bg-indigo-50/30">
                            <h3 className="font-semibold text-lg mb-4">{editingId === 'new' ? 'Add New State Rule' : 'Edit State Rule'}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State Name</label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        disabled={editingId !== 'new'}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="e.g. Karnataka"
                                    />
                                </div>
                                <div className="flex items-center gap-4 mt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.ptApplicable}
                                            onChange={(e) => setFormData({ ...formData, ptApplicable: e.target.checked })}
                                            className="rounded text-indigo-600"
                                        />
                                        <span className="text-sm font-medium">PT Applicable</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.lwfApplicable}
                                            onChange={(e) => setFormData({ ...formData, lwfApplicable: e.target.checked })}
                                            className="rounded text-indigo-600"
                                        />
                                        <span className="text-sm font-medium">LWF Applicable</span>
                                    </label>
                                </div>
                            </div>

                            {/* PT SLABS */}
                            {formData.ptApplicable && (
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-semibold text-gray-700">Professional Tax Slabs</h4>
                                        <button onClick={addPtSlab} className="text-xs text-indigo-600 flex items-center hover:underline">
                                            <Plus size={12} className="mr-1" /> Add Slab
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.ptSlabs.map((slab, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Min Salary"
                                                    value={slab.minSalary}
                                                    onChange={(e) => updatePtSlab(index, 'minSalary', e.target.value)}
                                                    className="w-24 px-2 py-1 text-sm border rounded"
                                                />
                                                <span className="text-gray-400">-</span>
                                                <input
                                                    type="number"
                                                    placeholder="Max Salary"
                                                    value={slab.maxSalary}
                                                    onChange={(e) => updatePtSlab(index, 'maxSalary', e.target.value)}
                                                    className="w-24 px-2 py-1 text-sm border rounded"
                                                />
                                                <span className="text-gray-400">=</span>
                                                <input
                                                    type="number"
                                                    placeholder="Tax"
                                                    value={slab.taxAmount}
                                                    onChange={(e) => updatePtSlab(index, 'taxAmount', e.target.value)}
                                                    className="w-20 px-2 py-1 text-sm border rounded"
                                                />
                                                <button onClick={() => removePtSlab(index)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.ptSlabs.length === 0 && (
                                            <p className="text-xs text-gray-400 italic">No slabs defined.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ACTIONS */}
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={handleCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                                <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2">
                                    <Save size={16} /> Save Rules
                                </button>
                            </div>
                        </div>
                    )}

                    {/* LIST */}
                    <div className="grid grid-cols-1 gap-4">
                        {configs.map((config, index) => (
                            <div key={config._id || config.id || index} className="border rounded-lg p-4 flex justify-between items-start hover: transition-">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">{config.state}</h3>
                                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                                        <p><span className="font-medium">PT:</span> {config.ptApplicable ? 'Applicable' : 'N/A'} {config.ptApplicable && `(${config.ptSlabs?.length || 0} slabs)`}</p>
                                        <p><span className="font-medium">LWF:</span> {config.lwfApplicable ? 'Applicable' : 'N/A'}</p>
                                        <p className="text-xs text-gray-400 mt-2">Last updated: {new Date(config.updatedAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleEdit(config)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                                >
                                    <Edit2 size={18} />
                                </button>
                            </div>
                        ))}
                        {configs.length === 0 && !editingId && (
                            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                No state configurations found. Add a state to get started.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
