"use client";

import React, { useState, useEffect } from "react";
import {
    Building,
    Users,
    Briefcase,
    Plus,
    Search,
    Edit2,
    Trash2,
    MoreVertical,
    ChevronRight,
    Filter,
    Layers,
    CheckCircle2,
    XCircle,
    PlusCircle,
    Wallet,
    Info
} from "lucide-react";
import { toast } from "react-hot-toast";

const TabButton = ({ active, onClick, icon, label, count }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all shrink-0 ${active
            ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
            : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
    >
        {icon}
        {label}
        {count !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                {count}
            </span>
        )}
    </button>
);

export default function OrgSettingsPage() {
    const [activeTab, setActiveTab] = useState("business-units");
    const [data, setData] = useState({
        businessUnits: [],
        teams: [],
        costCenters: [],
        organizations: [],
        departments: []
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        organizationId: '',
        businessUnitId: '',
        departmentId: '',
        budget: 0,
        status: 'Active'
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [buRes, teamRes, ccRes, orgRes, deptRes] = await Promise.all([
                fetch("/api/v1/admin/crm/business-units?limit=1000"),
                fetch("/api/v1/admin/crm/teams?limit=1000"),
                fetch("/api/v1/admin/finance/cost-centers?limit=1000"),
                fetch("/api/v1/super-admin/organizations?limit=1000"),
                fetch("/api/v1/admin/crm/departments?limit=1000")
            ]);

            const [buData, teamData, ccData, orgData, deptData] = await Promise.all([
                buRes.json(),
                teamRes.json(),
                ccRes.json(),
                orgRes.json(),
                deptRes.json()
            ]);

            setData({
                businessUnits: buData.data || [],
                teams: teamData.data || [],
                costCenters: ccData.data || [],
                organizations: orgData.organizations || [],
                departments: deptData.data || []
            });
        } catch (error) {
            console.error("Error fetching org settings data:", error);
            toast.error("Failed to load organization settings");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            organizationId: data.organizations[0]?._id || '',
            businessUnitId: data.businessUnits[0]?._id || '',
            departmentId: data.departments[0]?._id || '',
            budget: 0,
            status: 'Active'
        });
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name || '',
            code: item.code || '',
            description: item.description || '',
            organizationId: item.organizationId?._id || item.organizationId || '',
            businessUnitId: item.businessUnitId?._id || item.businessUnitId || '',
            departmentId: item.departmentId?._id || item.departmentId || '',
            budget: item.budget || 0,
            status: item.status || 'Active'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const type = activeTab === 'business-units' ? 'business-units' :
                activeTab === 'teams' ? 'teams' : 'cost-centers';

            const endpoint = type === 'cost-centers' ? `/api/v1/admin/finance/${type}` : `/api/v1/admin/crm/${type}`;
            const method = editingItem ? 'PUT' : 'POST';

            // Clean data based on type
            let payload = { ...formData };
            if (activeTab === 'business-units') { delete payload.departmentId; delete payload.businessUnitId; delete payload.budget; delete payload.code; }
            if (activeTab === 'teams') { delete payload.organizationId; delete payload.businessUnitId; delete payload.budget; delete payload.code; }
            if (activeTab === 'cost-centers') { delete payload.organizationId; delete payload.businessUnitId; delete payload.departmentId; }

            if (editingItem) payload.id = editingItem._id;

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Submission failed");

            toast.success(`${editingItem ? 'Updated' : 'Created'} successfully`);
            setIsModalOpen(false);
            fetchAllData();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (type, id) => {
        if (!confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;

        try {
            const endpoint = type === 'businessUnits' ? `/api/v1/admin/crm/business-units` :
                type === 'teams' ? `/api/v1/admin/crm/teams` :
                    `/api/v1/admin/finance/cost-centers`;

            const response = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error("Delete failed");

            toast.success("Deleted successfully");
            fetchAllData();
        } catch (error) {
            toast.error("Failed to delete item");
        }
    };

    const renderTable = () => {
        const getItems = () => {
            let items = [];
            if (activeTab === "business-units") items = data.businessUnits;
            else if (activeTab === "teams") items = data.teams;
            else if (activeTab === "cost-centers") items = data.costCenters;

            if (searchQuery) {
                items = items.filter(item =>
                    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.code?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            return items;
        };

        const items = getItems();

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name / Info</th>
                            {activeTab === 'teams' && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>}
                            {activeTab === 'business-units' && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization</th>}
                            {activeTab === 'cost-centers' && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code / Budget</th>}
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {items.map((item) => (
                            <tr key={item._id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${activeTab === 'business-units' ? 'bg-slate-50 text-blue-600 border-slate-200' :
                                            activeTab === 'teams' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                            {activeTab === 'business-units' ? <Briefcase className="w-4 h-4" /> :
                                                activeTab === 'teams' ? <Users className="w-4 h-4" /> :
                                                    <Wallet className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{item.description || 'No description'}</div>
                                        </div>
                                    </div>
                                </td>
                                {activeTab === 'teams' && (
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {item.departmentId?.departmentName || 'Unknown'}
                                    </td>
                                )}
                                {activeTab === 'business-units' && (
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {item.organizationId?.name || 'Unknown'}
                                    </td>
                                )}
                                {activeTab === 'cost-centers' && (
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-900">{item.code}</div>
                                        <div className="text-xs text-slate-500">Budget: ₹{item.budget?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) || 0}</div>
                                    </td>
                                )}
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.status === 'Active'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : 'bg-slate-50 text-slate-600 border-slate-100'
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(activeTab === 'business-units' ? 'businessUnits' : activeTab === 'teams' ? 'teams' : 'costCenters', item._id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {items.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                        <Filter className="w-12 h-12 text-slate-200 mb-3" />
                        <p className="text-sm">No items found matching your criteria.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center">
                                <Layers className="w-7 h-7 text-indigo-600" />
                            </div>
                            Organization Settings
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            Configure and manage your organizational hierarchy and financial mapping
                        </p>
                    </div>

                    <button
                        onClick={handleCreateNew}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all scale-100 active:scale-95"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Create New {activeTab === "business-units" ? "Business Unit" : activeTab === "teams" ? "Team" : "Cost Center"}
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="border-b border-slate-200 bg-white">
                        <div className="flex overflow-x-auto scrollbar-hide">
                            <TabButton
                                active={activeTab === "business-units"}
                                onClick={() => setActiveTab("business-units")}
                                icon={<Briefcase className="w-4 h-4" />}
                                label="Business Units"
                                count={data.businessUnits.length}
                            />
                            <TabButton
                                active={activeTab === "teams"}
                                onClick={() => setActiveTab("teams")}
                                icon={<Users className="w-4 h-4" />}
                                label="Teams"
                                count={data.teams.length}
                            />
                            <TabButton
                                active={activeTab === "cost-centers"}
                                onClick={() => setActiveTab("cost-centers")}
                                icon={<Wallet className="w-4 h-4" />}
                                label="Cost Centers"
                                count={data.costCenters.length}
                            />
                        </div>
                    </div>

                    <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, code or info..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-white px-4 py-2 rounded-lg border border-slate-200">
                            <Info className="w-3.5 h-3.5" />
                            Showing {data[activeTab === 'business-units' ? 'businessUnits' : activeTab === 'teams' ? 'teams' : 'costCenters']?.length || 0} total records
                        </div>
                    </div>

                    <div className="bg-white">
                        {loading ? (
                            <div className="py-24 flex flex-col items-center justify-center">
                                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-slate-500 font-medium">Loading configuration data...</p>
                            </div>
                        ) : (
                            renderTable()
                        )}
                    </div>
                </div>

                <div className="mt-8 bg-indigo-900 rounded-2xl p-8 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-white">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                            <Building className="w-10 h-10 text-white" />
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold mb-2">Hierarchical Organization Management</h2>
                            <p className="text-indigo-100 text-lg opacity-80 max-w-2xl">
                                Define your organizational structure through logical divisions. Connect business units to organizations,
                                departments to business units, and teams to departments for granular control and reporting.
                            </p>
                        </div>
                        <div className="md:ml-auto">
                            <button className="px-8 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-slate-100 transition-all active:scale-95">
                                Download Hierarchy Report
                            </button>
                        </div>
                    </div>
                    {/* Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-300/10 blur-[100px] -ml-32 -mb-32" />
                </div>
            </div>

            {/* CREATE/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                    {editingItem ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{editingItem ? 'Edit' : 'Create'} {activeTab === 'business-units' ? 'Business Unit' : activeTab === 'teams' ? 'Team' : 'Cost Center'}</h3>
                                    <p className="text-xs text-slate-500">Enter details below to {editingItem ? 'update' : 'add'} the record</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                                disabled={submitting}
                            >
                                <Plus className="w-5 h-5 text-slate-500 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder={`Enter ${activeTab.slice(0, -1)} name...`}
                                    />
                                </div>

                                {activeTab === 'cost-centers' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Code</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Budget</label>
                                            <input
                                                type="number"
                                                value={formData.budget}
                                                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'business-units' && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Organization</label>
                                        <select
                                            required
                                            value={formData.organizationId}
                                            onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        >
                                            <option value="">Select Organization</option>
                                            {data.organizations.map(org => (
                                                <option key={org._id} value={org._id}>{org.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {activeTab === 'teams' && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                                        <select
                                            required
                                            value={formData.departmentId}
                                            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        >
                                            <option value="">Select Department</option>
                                            {data.departments.map(dept => (
                                                <option key={dept._id} value={dept._id}>{dept.departmentName}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                    <textarea
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                        placeholder="Brief description..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : editingItem ? <CheckCircle2 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                                    {editingItem ? 'Update' : 'Create'} {activeTab.slice(0, -1)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
