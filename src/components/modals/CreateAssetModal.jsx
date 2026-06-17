"use client";
import { useState, useEffect } from "react";
import { X, Save, Box, AlertCircle, Loader2 } from "lucide-react";

export default function CreateAssetModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        assetId: "",
        category: "",
        value: "",
        purchaseDate: "",
        description: "",
        assignedTo: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [customCategory, setCustomCategory] = useState("");

    const [employees, setEmployees] = useState([]);
    const [searchEmp, setSearchEmp] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchEmployees = async () => {
                try {
                    const res = await fetch("/api/v1/admin/employees");
                    if (res.ok) {
                        const data = await res.json();
                        setEmployees(data.data || []);
                    }
                } catch (err) {}
            };
            fetchEmployees();
        }
    }, [isOpen]);

    const filteredEmployees = employees.filter(emp => 
        `${emp.personalDetails?.firstName} ${emp.personalDetails?.lastName} ${emp.employeeId}`.toLowerCase().includes(searchEmp.toLowerCase())
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setError("");

            const finalCategory = formData.category === "Other" ? customCategory : formData.category;

            if (!formData.name || !formData.assetId || !finalCategory) {
                setError("Please fill in all required fields.");
                setIsSubmitting(false);
                return;
            }

            const submitData = { ...formData, category: finalCategory };

            const res = await fetch("/api/v1/admin/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create asset");
            }

            onSuccess();
            onClose();
            setFormData({ name: "", assetId: "", category: "", value: "", purchaseDate: "", description: "", assignedTo: "" });
            setSearchEmp("");
            setCustomCategory("");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg transform transition-all">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Box size={24} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Add New Asset</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Asset Name *</label>
                            <input name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="e.g. MacBook Pro" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Asset ID *</label>
                            <input name="assetId" value={formData.assetId} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="e.g. AST-001" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Category *</label>
                            <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                                <option value="">Select Category</option>
                                <option value="Laptop">Laptop</option>
                                <option value="Desktop">Desktop</option>
                                <option value="Monitor">Monitor</option>
                                <option value="Mobile">Mobile</option>
                                <option value="Peripheral">Peripheral</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        {formData.category === "Other" && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <label className="text-sm font-medium text-gray-700">Specify Category *</label>
                                <input 
                                    type="text" 
                                    value={customCategory} 
                                    onChange={(e) => setCustomCategory(e.target.value)} 
                                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                                    placeholder="e.g. Printer" 
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Purchase Date</label>
                            <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Value</label>
                            <input type="number" name="value" value={formData.value} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="0.00" />
                        </div>
                    </div>

                    <div className="space-y-2 relative">
                        <label className="text-sm font-medium text-gray-700">Assigned To (Employee)</label>
                        <input 
                            type="text"
                            value={searchEmp}
                            onChange={(e) => {
                                setSearchEmp(e.target.value);
                                setShowDropdown(true);
                                // clear assignment if user is typing
                                if (formData.assignedTo) setFormData(p => ({ ...p, assignedTo: "" }));
                            }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="Search employee..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                        {showDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                                <div 
                                    className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-500 font-medium border-b border-gray-100"
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // prevent input blur
                                        setFormData(p => ({ ...p, assignedTo: "" }));
                                        setSearchEmp("");
                                        setShowDropdown(false);
                                    }}
                                >
                                    Unassign (Leave empty)
                                </div>
                                {filteredEmployees.length === 0 ? (
                                    <div className="px-3 py-3 text-sm text-gray-500 text-center">No employees found</div>
                                ) : (
                                    filteredEmployees.map(emp => (
                                        <div 
                                            key={emp._id}
                                            className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // prevent input blur
                                                setFormData(p => ({ ...p, assignedTo: emp._id }));
                                                setSearchEmp(`${emp.personalDetails?.firstName} ${emp.personalDetails?.lastName} (${emp.employeeId})`);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <div className="font-medium text-gray-900">{emp.personalDetails?.firstName} {emp.personalDetails?.lastName}</div>
                                            <div className="text-xs text-gray-500">{emp.employeeId} • {emp.department?.departmentName || "No Dept"}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24" placeholder="Additional details..." />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Asset
                    </button>
                </div>
            </div>
        </div>
    );
}
