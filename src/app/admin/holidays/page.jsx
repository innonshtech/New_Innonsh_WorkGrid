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
    X,
    Settings,
    MapPin,
    Layers,
    CalendarDays
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
    const [locations, setLocations] = useState([]);
    const [holidayLists, setHolidayLists] = useState([]);
    const [selectedListId, setSelectedListId] = useState(null);
    const [showListModal, setShowListModal] = useState(false);
    const [editingList, setEditingList] = useState(null);

    // Form state for holidays
    const [formData, setFormData] = useState({
        name: "",
        date: "",
        endDate: "",
        numberOfDays: 1,
        type: "Public",
        description: "",
        organizationId: "",
        holidayListId: "",
        isRestricted: false
    });

    // Auto-calculate numberOfDays when dates change
    const calcDays = (start, end) => {
        if (!start || !end) return 1;
        const diff = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 1;
    };

    // Form state for holiday lists
    const [listFormData, setListFormData] = useState({
        name: "",
        year: new Date().getFullYear(),
        organizationId: "",
        applicableLocations: [],
        restrictedHolidayCount: 2,
        isDefault: false
    });

    const fetchHolidays = async (listId) => {
        try {
            setLoading(true);
            const url = listId 
                ? `/api/v1/admin/holidays?holidayListId=${listId}` 
                : "/api/v1/admin/holidays";
            const response = await fetch(url);
            const data = await response.json();
            if (response.ok && data.success) {
                setHolidays(data.holidays || []);
            }
        } catch (err) {
            toast.error("Failed to load holidays");
        } finally {
            setLoading(false);
        }
    };

    const fetchHolidayLists = async () => {
        try {
            const response = await fetch("/api/v1/admin/holiday-lists");
            const data = await response.json();
            if (response.ok && data.success) {
                setHolidayLists(data.holidayLists || []);
                if (data.holidayLists?.length > 0 && !selectedListId) {
                    const defaultList = data.holidayLists.find(l => l.isDefault) || data.holidayLists[0];
                    setSelectedListId(defaultList._id);
                    fetchHolidays(defaultList._id);
                } else if (data.holidayLists?.length === 0) {
                    setHolidays([]);
                    setLoading(false);
                }
            }
        } catch (err) {
            toast.error("Failed to load holiday lists");
        }
    };

    const fetchOrganizations = async () => {
        try {
            const response = await fetch("/api/v1/admin/organizations?limit=1000");
            const data = await response.json();
            if (response.ok) {
                const orgs = data.organizations || [];
                setOrganizations(orgs);
                if (orgs.length > 0 && !formData.organizationId) {
                    setFormData(prev => ({ ...prev, organizationId: orgs[0]._id }));
                    setListFormData(prev => ({ ...prev, organizationId: orgs[0]._id }));
                }
            }
        } catch (err) {
            console.error("Failed to load organizations");
        }
    };

    const fetchLocations = async () => {
        try {
            const response = await fetch("/api/settings/office-locations");
            const data = await response.json();
            if (data.success) {
                setLocations(data.locations || []);
            }
        } catch (err) {
            console.error("Failed to load locations");
        }
    };

    useEffect(() => {
        fetchHolidayLists();
        fetchOrganizations();
        fetchLocations();
    }, []);

    useEffect(() => {
        if (selectedListId) {
            fetchHolidays(selectedListId);
        }
    }, [selectedListId]);

    const handleOpenListModal = (list = null) => {
        if (list) {
            setEditingList(list);
            setListFormData({
                name: list.name,
                year: list.year,
                organizationId: list.organizationId?._id || list.organizationId,
                applicableLocations: list.applicableLocations?.map(l => l._id || l) || [],
                restrictedHolidayCount: list.restrictedHolidayCount || 0,
                isDefault: list.isDefault || false
            });
        } else {
            setEditingList(null);
            setListFormData({
                name: "",
                year: new Date().getFullYear(),
                organizationId: organizations[0]?._id || "",
                applicableLocations: [],
                restrictedHolidayCount: 2,
                isDefault: false
            });
        }
        setShowListModal(true);
    };

    const handleListSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editingList ? "PUT" : "POST";
            const url = editingList
                ? `/api/v1/admin/holiday-lists/${editingList._id}`
                : "/api/v1/admin/holiday-lists";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(listFormData)
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Holiday list ${editingList ? "updated" : "created"} successfully`);
                setShowListModal(false);
                fetchHolidayLists();
            } else {
                toast.error(data.error || "Failed to save holiday list");
            }
        } catch (err) {
            toast.error("An error occurred. Please try again.");
        }
    };

    const handleListDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this holiday list? All associated holidays will lose their list reference.")) return;
        try {
            const response = await fetch(`/api/v1/admin/holiday-lists/${id}`, { method: "DELETE" });
            const data = await response.json();
            if (data.success) {
                toast.success("Holiday list deleted successfully");
                if (selectedListId === id) setSelectedListId(null);
                fetchHolidayLists();
            } else {
                toast.error(data.error || "Failed to delete list");
            }
        } catch (err) {
            toast.error("An error occurred");
        }
    };

    const handleOpenModal = (holiday = null) => {
        if (holiday) {
            setEditingHoliday(holiday);
            setFormData({
                name: holiday.name,
                date: holiday.date.split("T")[0],
                endDate: holiday.endDate ? holiday.endDate.split("T")[0] : holiday.date.split("T")[0],
                numberOfDays: holiday.numberOfDays || 1,
                type: holiday.type,
                description: holiday.description || "",
                organizationId: holiday.organizationId?._id || holiday.organizationId,
                holidayListId: holiday.holidayListId?._id || holiday.holidayListId || selectedListId,
                isRestricted: holiday.isRestricted || false
            });
        } else {
            setEditingHoliday(null);
            setFormData({
                name: "",
                date: "",
                endDate: "",
                numberOfDays: 1,
                type: "Public",
                description: "",
                organizationId: organizations[0]?._id || "",
                holidayListId: selectedListId || "",
                isRestricted: false
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editingHoliday ? "PUT" : "POST";
            const url = editingHoliday
                ? `/api/v1/admin/holidays/${editingHoliday._id}`
                : "/api/v1/admin/holidays";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Holiday ${editingHoliday ? "updated" : "created"} successfully`);
                setShowModal(false);
                fetchHolidays(selectedListId);
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
            const response = await fetch(`/api/v1/admin/holidays/${id}`, { method: "DELETE" });
            const data = await response.json();
            if (data.success) {
                toast.success("Holiday deleted successfully");
                fetchHolidays(selectedListId);
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
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
            <Toaster />
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar: Holiday Lists */}
                    <div className="w-full md:w-64 space-y-4 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Lists</h2>
                            <button 
                                onClick={() => handleOpenListModal()}
                                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all active:scale-95"
                                title="Add New Holiday List"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3.5">
                            {holidayLists.map(list => (
                                <div 
                                    key={list._id}
                                    onClick={() => setSelectedListId(list._id)}
                                    className={`group cursor-pointer p-3.5 rounded-xl border transition-all ${
                                        selectedListId === list._id 
                                        ? "bg-indigo-600 border-indigo-600 ring-2 ring-indigo-100" 
                                        : "bg-white border-slate-200 hover:border-indigo-300 hover:"
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`p-1.5 rounded-lg ${selectedListId === list._id ? "bg-indigo-500" : "bg-slate-50"}`}>
                                            <CalendarDays className={`w-3.5 h-3.5 ${selectedListId === list._id ? "text-white" : "text-slate-400"}`} />
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleOpenListModal(list); }}
                                                className={`p-1 rounded-md transition-colors ${selectedListId === list._id ? "text-indigo-100 hover:bg-indigo-500" : "text-slate-400 hover:bg-slate-100"}`}
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleListDelete(list._id); }}
                                                className={`p-1 rounded-md transition-colors ${selectedListId === list._id ? "text-indigo-100 hover:bg-indigo-500" : "text-rose-400 hover:bg-rose-50"}`}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className={`text-sm font-bold tracking-tight ${selectedListId === list._id ? "text-white" : "text-slate-900"}`}>{list.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedListId === list._id ? "text-indigo-200" : "text-slate-400"}`}>{list.year}</span>
                                        {list.isDefault && <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-widest ${selectedListId === list._id ? "bg-indigo-500 text-white" : "bg-emerald-50 text-emerald-600"}`}>Default</span>}
                                    </div>
                                    <div className={`flex items-center gap-3 mt-2.5 pt-2.5 border-t ${selectedListId === list._id ? "border-indigo-500" : "border-slate-100"}`}>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedListId === list._id ? "text-indigo-200" : "text-slate-400"}`}>
                                            {list.holidayCount || 0} holidays
                                        </span>
                                        {(list.restrictedCount || 0) > 0 && (
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedListId === list._id ? "text-indigo-300" : "text-indigo-400"}`}>
                                                {list.restrictedCount} restricted
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {holidayLists.length === 0 && (
                                <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                                    <Layers className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Holiday Lists</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content: Holidays */}
                    <div className="flex-1 space-y-5">
                        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200">
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                    {holidayLists.find(l => l._id === selectedListId)?.name || "Holidays"}
                                </h1>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    {(() => {
                                        const sel = holidayLists.find(l => l._id === selectedListId);
                                        if (!sel) return "Select a list to manage holidays";
                                        return `${sel.holidayCount || 0} total holidays · ${sel.restrictedCount || 0} restricted · Quota: ${sel.restrictedHolidayCount || 0} per employee`;
                                    })()}
                                </p>
                            </div>
                            <button
                                onClick={() => handleOpenModal()}
                                disabled={!selectedListId}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:bg-slate-300 disabled:"
                            >
                                <Plus className="w-4 h-4" />
                                Add Holiday
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search holidays by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-medium transition-all"
                            />
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading holidays...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {filteredHolidays.length > 0 ? filteredHolidays.map((holiday) => (
                                    <Card key={holiday._id} className="p-4 relative overflow-hidden group hover:border-indigo-200 transition-all duration-300">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-full -mr-10 -mt-10 group-hover:bg-indigo-100 transition-colors"></div>
                                        <div className="relative z-10 flex gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="p-2.5 bg-white border border-slate-200 rounded-2xl text-center min-w-[70px]">
                                                    <p className="text-[9px] font-bold uppercase text-indigo-600 tracking-widest">{format(new Date(holiday.date), 'MMM')}</p>
                                                    <p className="text-xl font-bold text-slate-900">{format(new Date(holiday.date), 'dd')}</p>
                                                    {holiday.endDate && holiday.endDate !== holiday.date && (
                                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">→ {format(new Date(holiday.endDate), 'dd MMM')}</p>
                                                    )}
                                                    {(holiday.numberOfDays || 1) > 1 && (
                                                        <div className="mt-1.5 px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[8px] font-bold">
                                                            {holiday.numberOfDays} DAYS
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${holiday.type === 'Public' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            'bg-amber-50 text-amber-600 border-amber-100'
                                                            }`}>
                                                            {holiday.type}
                                                        </span>
                                                        {holiday.isRestricted && (
                                                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100">
                                                                Restricted
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleOpenModal(holiday)} className="p-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(holiday._id)} className="p-1 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 mb-1 truncate">{holiday.name}</h3>
                                                <div className="flex items-center gap-1.5 mb-2 text-slate-400 font-bold uppercase text-[9px] tracking-widest">
                                                    <Calendar className="w-3 h-3" />
                                                    {holiday.endDate && holiday.endDate !== holiday.date
                                                        ? `${format(new Date(holiday.date), 'EEE')} — ${format(new Date(holiday.endDate), 'EEE, dd MMM')}`
                                                        : format(new Date(holiday.date), 'EEEE')
                                                    }
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium line-clamp-2">{holiday.description || "Enjoy the break!"}</p>
                                            </div>
                                        </div>
                                    </Card>
                                )) : (
                                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200">
                                        <Palmtree className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">No holidays found</h3>
                                        <p className="text-xs text-slate-400 font-medium mt-1">Add holidays to populate this list.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Holiday Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{editingHoliday ? "Update Holiday" : "Add Holiday"}</h2>
                                <p className="text-sm text-slate-500 font-medium">Enter the details for this holiday</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-50 rounded-xl"><X className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Name</label>
                                    <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 placeholder:text-slate-300" placeholder="Holiday Name" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Start Date</label>
                                    <input required type="date" value={formData.date} onChange={(e) => {
                                        const newEnd = formData.endDate && formData.endDate >= e.target.value ? formData.endDate : e.target.value;
                                        setFormData({ ...formData, date: e.target.value, endDate: newEnd, numberOfDays: calcDays(e.target.value, newEnd) });
                                    }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">End Date</label>
                                    <input required type="date" min={formData.date} value={formData.endDate} onChange={(e) => {
                                        setFormData({ ...formData, endDate: e.target.value, numberOfDays: calcDays(formData.date, e.target.value) });
                                    }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Days Off</label>
                                    <div className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl font-black text-indigo-700 text-center text-lg">
                                        {formData.numberOfDays}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Type</label>
                                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700">
                                        <option value="Public">Public Holiday</option>
                                        <option value="Company">Company Holiday</option>
                                        <option value="Regional">Regional Holiday</option>
                                        <option value="Restricted">Restricted (Optional)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Restricted?</label>
                                    <button type="button" onClick={() => setFormData({ ...formData, isRestricted: !formData.isRestricted })} className={`w-full px-4 py-3 rounded-xl font-bold border transition-all ${formData.isRestricted ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                        {formData.isRestricted ? "✓ Yes — Optional" : "No — Mandatory"}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                                <textarea rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 placeholder:text-slate-300 resize-none" placeholder="Brief description..." />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]">{editingHoliday ? "Update" : "Create"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Holiday List Modal */}
            {showListModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{editingList ? "Update List" : "Create Holiday List"}</h2>
                                <p className="text-sm text-slate-500 font-medium">Group holidays by location or purpose</p>
                            </div>
                            <button onClick={() => setShowListModal(false)} className="p-2 hover:bg-slate-50 rounded-xl"><X className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleListSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">List Name</label>
                                    <input required type="text" value={listFormData.name} onChange={(e) => setListFormData({ ...listFormData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 placeholder:text-slate-300" placeholder="e.g. India HQ 2026" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Year</label>
                                    <input required type="number" min="2020" max="2050" value={listFormData.year} onChange={(e) => setListFormData({ ...listFormData, year: Number(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Organization</label>
                                <select required value={listFormData.organizationId} onChange={(e) => setListFormData({ ...listFormData, organizationId: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700">
                                    {organizations.map(org => (<option key={org._id} value={org._id}>{org.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Applicable Locations</label>
                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[48px]">
                                    {locations.length > 0 ? locations.map(loc => {
                                        const isSelected = listFormData.applicableLocations.includes(loc._id);
                                        return (
                                            <button key={loc._id} type="button" onClick={() => {
                                                const updated = isSelected ? listFormData.applicableLocations.filter(id => id !== loc._id) : [...listFormData.applicableLocations, loc._id];
                                                setListFormData({ ...listFormData, applicableLocations: updated });
                                            }} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                                                <MapPin className="w-3 h-3 inline mr-1" />{loc.name}
                                            </button>
                                        );
                                    }) : <p className="text-xs text-slate-400 font-medium py-1">No office locations configured</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Restricted Quota</label>
                                    <input type="number" min="0" max="20" value={listFormData.restrictedHolidayCount} onChange={(e) => setListFormData({ ...listFormData, restrictedHolidayCount: Number(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700" />
                                    <p className="text-[9px] text-slate-400 font-medium mt-1">Max optional holidays per employee</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Default List?</label>
                                    <button type="button" onClick={() => setListFormData({ ...listFormData, isDefault: !listFormData.isDefault })} className={`w-full px-4 py-3 rounded-xl font-bold border transition-all ${listFormData.isDefault ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                        {listFormData.isDefault ? "✓ Default" : "Not Default"}
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setShowListModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]">{editingList ? "Update List" : "Create List"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
