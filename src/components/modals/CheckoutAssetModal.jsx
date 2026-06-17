"use client";
import { useState, useEffect } from "react";
import { X, Save, Box, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutAssetModal({ isOpen, onClose, onSuccess, vaultProducts = [] }) {
    const [formData, setFormData] = useState({
        productCatalogId: "",
        assetId: "",
        assignedTo: "",
        status: "Assigned",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

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

            if (!formData.productCatalogId || !formData.assetId || !formData.assignedTo) {
                setError("Please select a product, enter a Serial/Asset ID, and assign an employee.");
                setIsSubmitting(false);
                return;
            }

            const selectedProduct = vaultProducts.find(p => p._id === formData.productCatalogId);
            if (!selectedProduct) {
                setError("Invalid product selected.");
                setIsSubmitting(false);
                return;
            }

            const submitData = {
                ...formData,
                name: selectedProduct.name,
                category: selectedProduct.category,
                value: selectedProduct.value,
            };

            const res = await fetch("/api/v1/admin/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to checkout asset");
            }

            onSuccess();
            onClose();
            setFormData({ productCatalogId: "", assetId: "", assignedTo: "", status: "Assigned" });
            setSearchEmp("");
            toast.success("Asset Assigned Successfully!");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg transform transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <Box size={24} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Checkout Asset</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500 mb-4">
                        Deploy an item from your vault to an employee.
                    </p>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Select Vault Product *</label>
                        <select 
                            name="productCatalogId" 
                            value={formData.productCatalogId} 
                            onChange={handleChange} 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white font-medium"
                        >
                            <option value="">-- Choose from Vault --</option>
                            {vaultProducts.map(p => (
                                <option key={p._id} value={p._id}>{p.name} ({p.category}) - Total: {p.totalQuantity}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Specific Asset ID / Serial No *</label>
                        <input 
                            name="assetId" 
                            value={formData.assetId} 
                            onChange={handleChange} 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono" 
                            placeholder="e.g. MAC-001 or SN: 123456" 
                        />
                        <p className="text-xs text-gray-500">The exact ID of the physical item you are handing to them.</p>
                    </div>

                    <div className="space-y-2 relative">
                        <label className="text-sm font-medium text-gray-700">Assign To Employee *</label>
                        <input 
                            type="text"
                            value={searchEmp}
                            onChange={(e) => {
                                setSearchEmp(e.target.value);
                                setShowDropdown(true);
                                if (formData.assignedTo) setFormData(p => ({ ...p, assignedTo: "" }));
                            }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="Search employee by name or ID..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                        {showDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                                {filteredEmployees.length === 0 ? (
                                    <div className="px-3 py-3 text-sm text-gray-500 text-center">No employees found</div>
                                ) : (
                                    filteredEmployees.map(emp => (
                                        <div 
                                            key={emp._id}
                                            className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                                            onMouseDown={(e) => {
                                                e.preventDefault(); 
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

                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Confirm Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}
