
"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function VariablePaySettings() {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newComponent, setNewComponent] = useState({
        name: "",
        code: "",
        frequency: "Monthly",
        description: "",
        isActive: true,
    });

    useEffect(() => {
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            const res = await fetch("/api/v1/admin/payroll/settings/variable-components");
            if (!res.ok) throw new Error("Failed to fetch components");
            const data = await res.json();
            setComponents(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewComponent((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleAdd = async () => {
        if (!newComponent.name || !newComponent.code) {
            toast.error("Name and Code are required");
            return;
        }

        try {
            const res = await fetch("/api/v1/admin/payroll/settings/variable-components", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newComponent),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setComponents([data, ...components]);
            setIsAdding(false);
            setNewComponent({ name: "", code: "", frequency: "Monthly", description: "", isActive: true });
            toast.success("Component added successfully");
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this component?")) return;

        try {
            const res = await fetch(`/api/v1/admin/payroll/settings/variable-components/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            setComponents(components.filter((c) => c._id !== id));
            toast.success("Component deleted");
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800">Variable Pay Components</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
                >
                    <Plus size={18} />
                    <span>Add Component</span>
                </button>
            </div>

            {isAdding && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={newComponent.name}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                                placeholder="e.g. Performance Bonus"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                            <input
                                type="text"
                                name="code"
                                value={newComponent.code}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md uppercase"
                                placeholder="e.g. PERF_BONUS"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                            <select
                                name="frequency"
                                value={newComponent.frequency}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Half-Yearly">Half-Yearly</option>
                                <option value="Annually">Annually</option>
                            </select>
                        </div>
                        <div className="flex items-end space-x-2">
                            <button
                                onClick={handleAdd}
                                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex justify-center items-center"
                            >
                                <Save size={18} className="mr-2" /> Save
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-100 text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 font-semibold text-slate-600">Name</th>
                            <th className="p-4 font-semibold text-slate-600">Code</th>
                            <th className="p-4 font-semibold text-slate-600">Frequency</th>
                            <th className="p-4 font-semibold text-slate-600">Status</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-500">Loading components...</td>
                            </tr>
                        ) : components.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-500">No variable pay components defined.</td>
                            </tr>
                        ) : (
                            components.map((comp) => (
                                <tr key={comp._id} className="border-b border-slate-50 last:border-none hover:bg-slate-50 transition">
                                    <td className="p-4 font-medium text-slate-800">{comp.name}</td>
                                    <td className="p-4 text-slate-600 font-mono text-sm">{comp.code}</td>
                                    <td className="p-4 text-slate-600">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                                            {comp.frequency}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${comp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {comp.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDelete(comp._id)}
                                            className="text-slate-400 hover:text-red-500 transition p-1"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
