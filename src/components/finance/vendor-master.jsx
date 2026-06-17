"use client";

import { useState, useEffect } from "react";
import { 
    Users, Plus, Search, Filter,
    Building2, Mail, Phone, MapPin,
    CheckCircle2, Clock, Loader2,
    Edit3, Trash2, Eye, MoreVertical
} from "lucide-react";
import toast from "react-hot-toast";
import VendorModal from "./vendor-modal";

export default function VendorMaster({ onSelectVendor }) {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/admin/finance/vendors');
            const data = await res.json();
            setVendors(data.vendors || []);
        } catch (error) {
            toast.error("Failed to load vendors");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this vendor?")) return;
        try {
            const res = await fetch(`/api/v1/admin/finance/vendors?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Vendor removed");
            fetchVendors();
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Vendor Master</h3>
                    <p className="text-slate-500 text-xs font-medium">Manage your network of external service providers.</p>
                </div>
                <button
                    onClick={() => { setEditData(null); setShowModal(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                >
                    <Plus className="w-4 h-4" /> Add New Vendor
                </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            placeholder="Search by name, company, or category..." 
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Profile</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-8 py-10 bg-slate-50/10"></td>
                                    </tr>
                                ))
                            ) : (
                                vendors.map((vendor) => (
                                    <tr key={vendor._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs border ${vendor.status === 'Active' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{vendor.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{vendor.companyName || 'Individual'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                    <Mail className="w-3 h-3 text-slate-400" /> {vendor.email || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                    <Phone className="w-3 h-3 text-slate-400" /> {vendor.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GSTIN: <span className="text-slate-900 font-bold ml-1">{vendor.gstin || 'NONE'}</span></p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PAN: <span className="text-slate-900 font-bold ml-1">{vendor.pan || 'NONE'}</span></p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${vendor.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                {vendor.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => onSelectVendor(vendor)}
                                                    className="p-2 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all" title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => { setEditData(vendor); setShowModal(true); }}
                                                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all" title="Edit Record"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(vendor._id)}
                                                    className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-all" title="Remove"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <VendorModal 
                isOpen={showModal} 
                onClose={() => { setShowModal(false); setEditData(null); }}
                onVendorSaved={fetchVendors}
                editData={editData}
            />
        </div>
    );
}
