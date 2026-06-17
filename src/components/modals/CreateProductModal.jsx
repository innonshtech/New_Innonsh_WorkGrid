"use client";
import { useState } from "react";
import { X, Save, Box, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateProductModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        totalQuantity: 1,
        description: "",
        value: "",
    });
    const [customCategory, setCustomCategory] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setError("");

            const finalCategory = formData.category === "Other" ? customCategory : formData.category;

            if (!formData.name || !finalCategory || formData.totalQuantity < 1) {
                setError("Please fill in all required fields and ensure quantity is at least 1.");
                setIsSubmitting(false);
                return;
            }

            const submitData = { ...formData, category: finalCategory };

            const res = await fetch("/api/v1/admin/asset-products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add product to vault");
            }

            onSuccess();
            onClose();
            setFormData({ name: "", category: "", totalQuantity: 1, description: "", value: "" });
            setCustomCategory("");
            toast.success("Added to Vault Successfully!");
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
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Box size={24} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Add to Vault</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500 mb-4">
                        Add a new product category to your inventory vault. You'll be able to checkout individual items from this stock later.
                    </p>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Product Name *</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="e.g. Dell XPS 15 Laptop" />
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
                            <label className="text-sm font-medium text-gray-700">Total Quantity Purchased *</label>
                            <input type="number" min="1" name="totalQuantity" value={formData.totalQuantity} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold text-indigo-700" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Unit Value (Optional)</label>
                            <input type="number" name="value" value={formData.value} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="0.00" />
                        </div>
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
                        Save to Vault
                    </button>
                </div>
            </div>
        </div>
    );
}
