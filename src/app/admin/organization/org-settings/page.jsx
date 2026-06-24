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
    Filter,
    Layers,
    CheckCircle2,
    PlusCircle,
    Wallet,
    Info,
    Link,
    Copy,
    ExternalLink,
    Award,
    Landmark
} from "lucide-react";
import { toast } from "react-hot-toast";

import { EnterprisePageHeader } from "@/components/ui/enterprise/EnterprisePageHeader";
import { EnterpriseSectionCard } from "@/components/ui/enterprise/EnterpriseSectionCard";
import { EnterpriseButton } from "@/components/ui/enterprise/EnterpriseButton";
import { EnterpriseEmptyState } from "@/components/ui/enterprise/EnterpriseEmptyState";
import { EnterpriseIconContainer } from "@/components/ui/enterprise/EnterpriseIconContainer";
import { EnterpriseTableWrapper } from "@/components/ui/enterprise/EnterpriseTableWrapper";
import { EnterpriseStatusBadge } from "@/components/ui/enterprise/EnterpriseStatusBadge";

const TabButton = ({ active, onClick, icon, label, count }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all shrink-0 ${active
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
    const [linkedinId, setLinkedinId] = useState("");
    const [copying, setCopying] = useState(false);
    const [data, setData] = useState({
        businessUnits: [],
        teams: [],
        costCenters: [],
        organizations: [],
        departments: [],
        designations: [],
        banks: []
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
            const [buRes, teamRes, ccRes, orgRes, deptRes, desigRes, bankRes] = await Promise.all([
                fetch("/api/v1/admin/crm/business-units?limit=1000"),
                fetch("/api/v1/admin/crm/teams?limit=1000"),
                fetch("/api/v1/admin/finance/cost-centers?limit=1000"),
                fetch("/api/v1/admin/crm/organizations?limit=1000"),
                fetch("/api/v1/admin/crm/departments?limit=1000"),
                fetch("/api/v1/admin/crm/designations?limit=1000"),
                fetch("/api/v1/admin/crm/banks?limit=1000")
            ]);

            const safeJson = async (res) => {
                if (!res || !res.ok) {
                    const text = await res?.text?.().catch(() => "");
                    console.error(`API Error:`, text);
                    return { data: [] };
                }
                return res.json();
            };

            const [buData, teamData, ccData, orgData, deptData, desigData, bankData] = [
                await safeJson(buRes),
                await safeJson(teamRes),
                await safeJson(ccRes),
                await safeJson(orgRes),
                await safeJson(deptRes),
                await safeJson(desigRes),
                await safeJson(bankRes)
            ];

            setData({
                businessUnits: buData.data || [],
                teams: teamData.data || [],
                costCenters: ccData.data || [],
                organizations: orgData.data || orgData.organizations || [],
                departments: deptData.data || [],
                designations: desigData.data || [],
                banks: bankData.data || []
            });

            const currentOrg = orgData.data?.[0] || orgData.organizations?.[0];
            if (currentOrg) {
                setLinkedinId(currentOrg.linkedinCompanyId || "");
            }
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
            names: [''],
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
                activeTab === 'teams' ? 'teams' : 
                activeTab === 'designations' ? 'designations' : 
                activeTab === 'banks' ? 'banks' : 'cost-centers';

            const baseEndpoint = type === 'cost-centers' ? `/api/v1/admin/finance/${type}` : `/api/v1/admin/crm/${type}`;
            const method = editingItem ? 'PUT' : 'POST';
            const endpoint = editingItem ? `${baseEndpoint}?id=${editingItem._id}` : baseEndpoint;

            let payload = { ...formData };
            if (activeTab === 'business-units') { delete payload.departmentId; delete payload.businessUnitId; delete payload.budget; delete payload.code; }
            if (activeTab === 'teams') { delete payload.organizationId; delete payload.businessUnitId; delete payload.budget; delete payload.code; }
            if (activeTab === 'cost-centers') { delete payload.organizationId; delete payload.businessUnitId; delete payload.departmentId; }
            if (activeTab === 'designations') { delete payload.departmentId; delete payload.businessUnitId; delete payload.budget; delete payload.code; }
            if (activeTab === 'banks') { delete payload.departmentId; delete payload.businessUnitId; delete payload.budget; delete payload.code; }

            if (editingItem) payload.id = editingItem._id;

            if ((activeTab === 'designations' || activeTab === 'banks') && !editingItem) {
                payload.names = (payload.names || []).map(n => n.trim()).filter(Boolean);
                delete payload.name;
                if (!payload.organizationId && data.organizations.length > 0) {
                    payload.organizationId = data.organizations[0]._id;
                }
            } else if ((activeTab === 'designations' || activeTab === 'banks') && editingItem) {
                delete payload.names;
            }

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
                type === 'designations' ? `/api/v1/admin/crm/designations` :
                type === 'banks' ? `/api/v1/admin/crm/banks` :
                    `/api/v1/admin/finance/cost-centers`;

            const response = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error("Delete failed");

            toast.success("Deleted successfully");
            fetchAllData();
        } catch (error) {
            toast.error("Failed to delete item");
        }
    };

    const handleUpdateLinkedin = async () => {
        try {
            setSubmitting(true);
            const currentOrg = data.organizations[0];
            if (!currentOrg) throw new Error("No organization found");

            const response = await fetch(`/api/v1/admin/organizations`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: currentOrg._id,
                    linkedinCompanyId: linkedinId 
                })
            });

            if (!response.ok) throw new Error("Failed to update LinkedIn ID");
            toast.success("LinkedIn Integration updated");
            fetchAllData();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopying(true);
        toast.success("Feed URL copied to clipboard");
        setTimeout(() => setCopying(false), 2000);
    };

    const renderTable = () => {
        const getItems = () => {
            let items = [];
            if (activeTab === "business-units") items = data.businessUnits;
            else if (activeTab === "teams") items = data.teams;
            else if (activeTab === "cost-centers") items = data.costCenters;
            else if (activeTab === "designations") items = data.designations;
            else if (activeTab === "banks") items = data.banks;

            if (searchQuery) {
                items = items.filter(item =>
                    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.code?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            return items;
        };

        const items = getItems();

        if (activeTab === "integrations") {
            const currentOrg = data.organizations[0];
            const feedUrl = currentOrg ? `${window.location.origin}/api/v1/public/careers/feed.xml?orgId=${currentOrg._id}` : "";

            return (
                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#0077b5] rounded-xl flex items-center justify-center text-white">
                                        <Link className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-800">LinkedIn Job Wrapping</h3>
                                        <p className="text-xs font-semibold text-slate-500">Automate your job postings</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${linkedinId ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {linkedinId ? 'Configured' : 'Needs Setup'}
                                </span>
                            </div>
                            <div className="p-6 flex-1 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">LinkedIn Company ID</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={linkedinId}
                                            onChange={(e) => setLinkedinId(e.target.value)}
                                            placeholder="e.g. 12345678"
                                            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-medium"
                                        />
                                        <EnterpriseButton 
                                            onClick={handleUpdateLinkedin}
                                            disabled={submitting}
                                        >
                                            {submitting ? "..." : "Save"}
                                        </EnterpriseButton>
                                    </div>
                                    <p className="mt-2 text-xs font-medium text-slate-400">
                                        Found in your LinkedIn Company Page URL: linkedin.com/company/[ID]
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Public XML Feed URL</label>
                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 group">
                                        <code className="text-[10px] text-indigo-600 truncate flex-1 font-mono font-medium">
                                            {feedUrl || "Loading organization context..."}
                                        </code>
                                        <button 
                                            onClick={() => copyToClipboard(feedUrl)}
                                            className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                                        >
                                            {copying ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                                <Info className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-500">Provide this URL to your LinkedIn Account Manager to enable automated sync.</span>
                            </div>
                        </div>

                        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 space-y-4">
                            <h4 className="font-extrabold text-indigo-900 flex items-center gap-2">
                                <ExternalLink className="w-4 h-4" />
                                How to Sync with LinkedIn
                            </h4>
                            <ul className="space-y-4">
                                {[
                                    "Ensure you have a LinkedIn Recruiter or Job Slot contract.",
                                    "Copy the XML Feed URL provided to the left.",
                                    "Contact LinkedIn Support or your Account Manager.",
                                    "Request them to enable 'Job Wrapping' for your account using this link.",
                                    "All 'Open' jobs in our portal will sync automatically every 24 hours."
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-3 text-sm font-semibold text-indigo-800/80">
                                        <span className="flex-shrink-0 w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center font-bold text-xs text-indigo-700">
                                            {i + 1}
                                        </span>
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

        if (items.length === 0) {
            return (
                <EnterpriseEmptyState 
                    icon={Filter}
                    title="No items found"
                    description="No items found matching your criteria."
                />
            );
        }

        return (
            <EnterpriseTableWrapper>
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Name / Info</th>
                        {activeTab === 'teams' && <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Department</th>}
                        {activeTab === 'business-units' && <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Organization</th>}
                        {activeTab === 'designations' && <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Organization</th>}
                        {activeTab === 'banks' && <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Organization</th>}
                        {activeTab === 'cost-centers' && <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Code / Budget</th>}
                        <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <EnterpriseIconContainer 
                                        icon={activeTab === 'business-units' ? Briefcase :
                                            activeTab === 'teams' ? Users :
                                            activeTab === 'designations' ? Award :
                                            activeTab === 'banks' ? Landmark :
                                            Wallet} 
                                        color={activeTab === 'business-units' ? 'blue' :
                                            activeTab === 'teams' ? 'amber' :
                                            activeTab === 'designations' ? 'purple' :
                                            activeTab === 'banks' ? 'indigo' :
                                            'emerald'}
                                        size="sm"
                                    />
                                    <div>
                                        <div className="text-sm font-extrabold text-slate-800">{item.name}</div>
                                        <div className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">{item.description || 'No description'}</div>
                                    </div>
                                </div>
                            </td>
                            {activeTab === 'teams' && (
                                <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                    {item.departmentId?.departmentName || 'Unknown'}
                                </td>
                            )}
                            {activeTab === 'business-units' && (
                                <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                    {item.organizationId?.name || 'Unknown'}
                                </td>
                            )}
                            {activeTab === 'designations' && (
                                <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                    {item.organizationId?.name || 'Unknown'}
                                </td>
                            )}
                            {activeTab === 'banks' && (
                                <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                    {item.organizationId?.name || 'Unknown'}
                                </td>
                            )}
                            {activeTab === 'cost-centers' && (
                                <td className="px-6 py-4">
                                    <div className="text-sm font-extrabold text-slate-800">{item.code}</div>
                                    <div className="text-xs font-semibold text-slate-500">Budget: ₹{item.budget?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) || 0}</div>
                                </td>
                            )}
                            <td className="px-6 py-4">
                                <EnterpriseStatusBadge status={item.status} activeState="Active" />
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <EnterpriseButton variant="ghost" size="sm" icon={Edit2} onClick={() => handleEdit(item)} />
                                    <EnterpriseButton variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" icon={Trash2} onClick={() => handleDelete(activeTab === 'business-units' ? 'businessUnits' : activeTab === 'teams' ? 'teams' : activeTab === 'designations' ? 'designations' : activeTab === 'banks' ? 'banks' : 'costCenters', item._id)} />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </EnterpriseTableWrapper>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
            <EnterprisePageHeader 
                title="Organization Settings"
                subtitle="Configure and manage your organizational hierarchy and financial mapping"
                icon={Layers}
                actions={
                    <EnterpriseButton icon={PlusCircle} onClick={handleCreateNew}>
                        Create New {activeTab === "business-units" ? "Business Unit" : activeTab === "teams" ? "Team" : activeTab === "designations" ? "Designation" : activeTab === "banks" ? "Bank" : "Cost Center"}
                    </EnterpriseButton>
                }
            />

            <EnterpriseSectionCard className="p-0 overflow-hidden">
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
                        <TabButton
                            active={activeTab === "designations"}
                            onClick={() => setActiveTab("designations")}
                            icon={<Award className="w-4 h-4" />}
                            label="Designations"
                            count={data.designations.length}
                        />
                        <TabButton
                            active={activeTab === "banks"}
                            onClick={() => setActiveTab("banks")}
                            icon={<Landmark className="w-4 h-4" />}
                            label="Banks"
                            count={data.banks?.length || 0}
                        />
                        <TabButton
                            active={activeTab === "integrations"}
                            onClick={() => setActiveTab("integrations")}
                            icon={<Link className="w-4 h-4" />}
                            label="Integrations"
                        />
                    </div>
                </div>

                <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, code or info..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-200">
                        <Info className="w-4 h-4" />
                        Showing {data[activeTab === 'business-units' ? 'businessUnits' : activeTab === 'teams' ? 'teams' : activeTab === 'designations' ? 'designations' : activeTab === 'banks' ? 'banks' : 'costCenters']?.length || 0} total records
                    </div>
                </div>

                <div className="bg-white">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-slate-500 font-bold text-sm">Loading configuration data...</p>
                        </div>
                    ) : (
                        renderTable()
                    )}
                </div>
            </EnterpriseSectionCard>

            <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-3xl p-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-white">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                        <Building className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h2 className="text-2xl font-extrabold mb-2">Hierarchical Organization Management</h2>
                        <p className="text-indigo-100 font-medium opacity-90 max-w-2xl leading-relaxed">
                            Define your organizational structure through logical divisions. Connect business units to organizations,
                            departments to business units, and teams to departments for granular control and reporting.
                        </p>
                    </div>
                    <div className="md:ml-auto">
                        <button className="px-6 py-3 bg-white text-indigo-900 font-extrabold rounded-xl hover:bg-indigo-50 transition-colors active:scale-95 text-sm">
                            Download Hierarchy Report
                        </button>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[100px] -ml-32 -mb-32" />
            </div>

            {/* CREATE/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-4">
                                <EnterpriseIconContainer icon={editingItem ? Edit2 : Plus} color="indigo" size="md" />
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-lg">{editingItem ? 'Edit' : 'Create'} {activeTab === 'business-units' ? 'Business Unit' : activeTab === 'teams' ? 'Team' : activeTab === 'designations' ? 'Designation' : activeTab === 'banks' ? 'Bank' : 'Cost Center'}</h3>
                                    <p className="text-xs font-medium text-slate-500">Enter details below to {editingItem ? 'update' : 'add'} the record</p>
                                </div>
                            </div>
                            <EnterpriseButton variant="ghost" icon={Plus} className="rotate-45" onClick={() => setIsModalOpen(false)} disabled={submitting} />
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                                        {activeTab === 'designations' && !editingItem ? 'Designation Names' : activeTab === 'banks' && !editingItem ? 'Bank Names' : 'Name'}
                                    </label>
                                    {(activeTab === 'designations' || activeTab === 'banks') && !editingItem ? (
                                        <div className="space-y-3">
                                            {(formData.names || ['']).map((nameValue, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        required
                                                        value={nameValue}
                                                        onChange={(e) => {
                                                            const newNames = [...(formData.names || [''])];
                                                            newNames[index] = e.target.value;
                                                            setFormData({ ...formData, names: newNames });
                                                        }}
                                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                                        placeholder={`Enter ${activeTab === 'banks' ? 'bank' : 'designation'} name...`}
                                                    />
                                                    {(formData.names || ['']).length > 1 && (
                                                        <EnterpriseButton
                                                            variant="secondary"
                                                            type="button"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100"
                                                            onClick={() => {
                                                                const newNames = formData.names.filter((_, i) => i !== index);
                                                                setFormData({ ...formData, names: newNames });
                                                            }}
                                                            icon={Trash2}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, names: [...(formData.names || ['']), ''] })}
                                                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 mt-2"
                                            >
                                                <Plus className="w-4 h-4" /> Add Another {activeTab === 'banks' ? 'Bank' : 'Designation'}
                                            </button>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder={`Enter ${activeTab.slice(0, -1)} name...`}
                                        />
                                    )}
                                </div>

                                {activeTab === 'cost-centers' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Code</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Budget</label>
                                            <input
                                                type="number"
                                                value={formData.budget}
                                                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'business-units' && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Organization</label>
                                        <select
                                            required
                                            value={formData.organizationId}
                                            onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
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
                                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                                        <select
                                            required
                                            value={formData.departmentId}
                                            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                                        >
                                            <option value="">Select Department</option>
                                            {data.departments.map(dept => (
                                                <option key={dept._id} value={dept._id}>{dept.departmentName}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="col-span-2">
                                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                    <textarea
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                                        placeholder="Brief description..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <EnterpriseButton
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </EnterpriseButton>
                                <EnterpriseButton
                                    type="submit"
                                    className="flex-[2] justify-center"
                                    disabled={submitting}
                                    icon={editingItem ? CheckCircle2 : PlusCircle}
                                >
                                    {submitting ? "Processing..." : `${editingItem ? 'Update' : 'Create'} ${activeTab.slice(0, -1)}`}
                                </EnterpriseButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
