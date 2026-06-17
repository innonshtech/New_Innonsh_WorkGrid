"use client";

import { useState, useEffect, Suspense } from "react";
import {
    Calendar,
    Plus,
    Search,
    Loader2,
    Palmtree,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Filter,
    X
} from "lucide-react";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "@/context/SessionContext";

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl border border-slate-200 ${className}`}>
        {children}
    </div>
);

export default function AdminHolidaysPage() {
    return (
        <Suspense fallback={<div>Loading holidays...</div>}>
            <AdminHolidaysContent />
        </Suspense>
    );
}

function AdminHolidaysContent() {
    const { user } = useSession();
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [organizations, setOrganizations] = useState([]);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        date: "",
        type: "Public",
        description: "",
        organizationId: ""
    });

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/v1/admin/payroll/holidays");
            const data = await response.json();
            if (data.success) {
                setHolidays(data.holidays || []);
            }
        } catch (err) {
            toast.error("Failed to load holidays");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const response = await fetch("/api/v1/admin/crm/organizations?limit=1000");
            const data = await response.json();
            if (response.ok) {
                const orgs = data.organizations || [];
                setOrganizations(orgs);
                if (orgs.length > 0 && !formData.organizationId) {
                    setFormData(prev => ({ ...prev, organizationId: orgs[0]._id }));
                }
            }
        } catch (err) {
            console.error("Failed to load organizations");
        }
    };

    useEffect(() => {
        fetchHolidays();
        fetchOrganizations();
    }, []);

    const handleOpenModal = (holiday = null) => {
        if (holiday) {
            setEditingHoliday(holiday);
            setFormData({
                name: holiday.name,
                date: holiday.date.split("T")[0],
                type: holiday.type,
                description: holiday.description || "",
                organizationId: holiday.organizationId?._id || holiday.organizationId
            });
        } else {
            setEditingHoliday(null);
            setFormData({
                name: "",
                date: "",
                type: "Public",
                description: "",
                organizationId: organizations[0]?._id || ""
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editingHoliday ? "PUT" : "POST";
            const url = editingHoliday
                ? `/api/v1/admin/payroll/holidays/${editingHoliday._id}`
                : "/api/v1/admin/payroll/holidays";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Holiday ${editingHoliday ? "updated" : "created"} successfully`);
                setShowModal(false);
                fetchHolidays();
            } else {
                toast.error(data.error || "Failed to save holiday");
            }
        } catch (err) {
            toast.error("An error occurred. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this holiday?")) return;
        try {
            const response = await fetch(`/api/v1/admin/payroll/holidays/${id}`, { method: "DELETE" });
            const data = await response.json();
            if (data.success) {
                toast.success("Holiday deleted successfully");
                fetchHolidays();
            } else {
                toast.error(data.error || "Failed to delete holiday");
            }
        } catch (err) {
            toast.error("An error occurred");
        }
    };

    const filteredHolidays = holidays.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <Toaster />
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Holiday Management</h1>
                        <p className="text-slate-500 font-medium">Configure company-wide and public holidays</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Holiday
                    </button>
                </div>

                <Card className="mb-8 p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search holidays by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                            />
                        </div>
                    </div>
                </Card>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredHolidays.length > 0 ? filteredHolidays.map((holiday) => (
                            <Card key={holiday._id} className="p-6 relative overflow-hidden group hover:border-indigo-200 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-100 transition-colors"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-white border border-slate-200 rounded-2xl text-center min-w-[64px]">
                                            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{format(new Date(holiday.date), 'MMM')}</p>
                                            <p className="text-2xl font-black text-slate-900">{format(new Date(holiday.date), 'dd')}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${holiday.type === 'Public' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                {holiday.type}
                                            </span>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(holiday)}
                                                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(holiday._id)}
                                                    className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{holiday.name}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Palmtree className="w-4 h-4 text-slate-400" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{format(new Date(holiday.date), 'EEEE')}</p>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium line-clamp-2 min-h-[40px]">{holiday.description || "Enjoy the break!"}</p>
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Organization</p>
                                        <p className="text-xs font-bold text-slate-600 truncate">{holiday.organizationId?.name || "Global"}</p>
                                    </div>
                                </div>
                            </Card>
                        )) : (
                            <div className="col-span-full py-24 text-center">
                                <Palmtree className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">No holidays found</h3>
                                <p className="text-slate-400 font-medium">Get started by creating your first holiday!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{editingHoliday ? "Update Holiday" : "Create New Holiday"}</h2>
                                <p className="text-sm text-slate-500 font-medium">Enter the details for this holiday</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Organization</label>
                                    <select
                                        required
                                        value={formData.organizationId}
                                        onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                                    >
                                        {organizations.map(org => (
                                            <option key={org._id} value={org._id}>{org.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300"
                                            placeholder="Holiday Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Date</label>
                                        <input
                                            required
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                                        >
                                            <option value="Public">Public Holiday</option>
                                            <option value="Company">Company Holiday</option>
                                            <option value="Regional">Regional Holiday</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
                                        <div className="flex items-center gap-4 py-3">
                                            <button type="button" className="flex items-center gap-2 text-xs font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                                                Active
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                                    <textarea
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300 resize-none"
                                        placeholder="Add a brief description..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {editingHoliday ? "Update Holiday" : "Create Holiday"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
