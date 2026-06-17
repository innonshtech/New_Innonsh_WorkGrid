"use client";

import { useState, useEffect } from "react";
import { X, Building2, Save, Mail, Phone, MapPin, Landmark, FileText, Globe } from "lucide-react";
import { toast } from "react-hot-toast";

const VENDOR_CATEGORIES = [
    'IT Services', 'Office Supplies', 'Benefits Provider', 'Consultant', 
    'Travel', 'Software', 'Maintenance', 'Marketing', 'Legal', 'Other'
];

export default function VendorModal({ isOpen, onClose, onVendorSaved, editData = null }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        companyName: "",
        category: "Other",
        email: "",
        phone: "",
        gstin: "",
        pan: "",
        address: "",
        bankDetails: {
            accountName: "",
            accountNumber: "",
            ifsc: "",
            bankName: ""
        },
        status: "Active"
    });

    useEffect(() => {
        if (editData) {
            setFormData({
                ...formData,
                ...editData,
                bankDetails: editData.bankDetails || formData.bankDetails
            });
        } else {
            setFormData({
                name: "",
                companyName: "",
                category: "Other",
                email: "",
                phone: "",
                gstin: "",
                pan: "",
                address: "",
                bankDetails: {
                    accountName: "",
                    accountNumber: "",
                    ifsc: "",
                    bankName: ""
                },
                status: "Active"
            });
        }
    }, [editData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error("Vendor Name is required");
            return;
        }

        try {
            setLoading(true);
            const url = editData ? `/api/v1/admin/finance/vendors?id=${editData._id}` : '/api/v1/admin/finance/vendors';
            const method = editData ? 'PUT' : 'POST';

            // We need to handle the update route in vendors/route.js as well if it's not there
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to save vendor");

            toast.success(editData ? "Vendor Updated Successfully" : "Vendor Added Successfully");
            onVendorSaved();
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            {editData ? "Edit Vendor Profile" : "Register New Vendor"}
                        </h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 ml-13">Enter master details for the service provider</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white hover: rounded-2xl transition-all text-slate-400 hover:text-slate-900">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Basic Info */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Basic Identification
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendor Name *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. John Doe"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Acme Services Pvt Ltd"
                                        value={formData.companyName}
                                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all appearance-none"
                                        >
                                            {VENDOR_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all appearance-none"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 pt-4">
                                <Mail className="w-3 h-3" /> Contact & Address
                            </h3>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="vendor@company.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="+91 XXXXX XXXXX"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billing Address</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Full address details..."
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Tax & Banking */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Globe className="w-3 h-3" /> Tax Compliance
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">GSTIN</label>
                                    <input
                                        type="text"
                                        placeholder="22AAAAA0000A1Z5"
                                        value={formData.gstin}
                                        onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PAN Number</label>
                                    <input
                                        type="text"
                                        placeholder="ABCDE1234F"
                                        value={formData.pan}
                                        onChange={e => setFormData({ ...formData, pan: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 pt-4">
                                <Landmark className="w-3 h-3" /> Banking Settlement
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Account Holder Name</label>
                                    <input
                                        type="text"
                                        placeholder="Name as per Bank"
                                        value={formData.bankDetails.accountName}
                                        onChange={e => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountName: e.target.value } })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Account Number</label>
                                        <input
                                            type="text"
                                            placeholder="XXXX XXXX XXXX"
                                            value={formData.bankDetails.accountNumber}
                                            onChange={e => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountNumber: e.target.value } })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">IFSC Code</label>
                                        <input
                                            type="text"
                                            placeholder="HDFC0001234"
                                            value={formData.bankDetails.ifsc}
                                            onChange={e => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, ifsc: e.target.value } })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bank Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. HDFC Bank"
                                        value={formData.bankDetails.bankName}
                                        onChange={e => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value } })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 flex justify-end gap-4 border-t border-slate-50 mt-8">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                        >
                            Dismiss
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                            {loading ? "Processing..." : (editData ? "Update Record" : "Register Vendor")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
