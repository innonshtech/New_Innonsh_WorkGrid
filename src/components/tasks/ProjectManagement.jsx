"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    MoreVertical,
    Edit2,
    Trash2,
    Users,
    Calendar,
    Briefcase,
    ChevronRight,
    Loader2,
    X,
    LayoutDashboard
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

const ProjectManagement = () => {
    const { user } = useSession();
    const router = useRouter();
    const { t } = useLanguage();
    const isAdmin = user?.role === 'admin';
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [memberSearch, setMemberSearch] = useState("");
    const [viewingMembersProject, setViewingMembersProject] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        client: "",
        description: "",
        projectManager: "",
        members: [],
        leads: [],
        startDate: "",
        endDate: "",
        status: "Active"
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projRes, empRes] = await Promise.all([
                fetch("/api/v1/admin/tasks/projects"),
                fetch("/api/v1/admin/payroll/employees?limit=1000") // Get all employees for assignment
            ]);
            const projData = await projRes.json();
            const empData = await empRes.json();

            if (projData.success) setProjects(projData.projects);
            if (empData.success) setEmployees(empData.data || []);
        } catch (error) {
            toast.error("Failed to fetch project data");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (project = null) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                name: project.name,
                client: project.client,
                description: project.description || "",
                projectManager: typeof project.projectManager === 'object' ? (project.projectManager._id || project.projectManager.id) : project.projectManager,
                members: (project.members || []).map(m => typeof m === 'object' ? (m._id || m.id) : m),
                leads: (project.leads || []).map(m => typeof m === 'object' ? (m._id || m.id) : m),
                startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
                endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
                status: project.status
            });
        } else {
            setEditingProject(null);
            setFormData({
                name: "",
                client: "",
                description: "",
                projectManager: "",
                members: [],
                leads: [],
                startDate: "",
                endDate: "",
                status: "Pipeline"
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingProject ? `/api/v1/admin/tasks/projects/${editingProject._id || editingProject.id}` : "/api/v1/admin/tasks/projects";
            const method = editingProject ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`Project ${editingProject ? "updated" : "created"} successfully`);
                setIsModalOpen(false);
                fetchData();
            } else {
                toast.error(data.error || "Something went wrong");
            }
        } catch (error) {
            toast.error("Failed to save project");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            const res = await fetch(`/api/v1/admin/tasks/projects/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast.success("Project deleted");
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to delete project");
        }
    };

    const filteredProjects = projects.filter(p =>
        (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.client || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium">Loading projects...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Assigned Projects
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 max-w-xl">
                        Monitor assigned projects, milestones, tasks and work progress.
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all ring-offset-2 focus:ring-2 focus:ring-indigo-600"
                    >
                        <Plus size={18} /> {t("createNewProject")}
                    </button>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: t("activeProject"), value: projects.filter(p => p.status === 'Active').length, color: "bg-indigo-50 text-indigo-600", icon: Briefcase },
                    { label: t("totalMembers"), value: Array.from(new Set(projects.flatMap(p => p.members || []))).length, color: "bg-emerald-50 text-emerald-600", icon: Users },
                    { label: t("upcoming"), value: projects.filter(p => p.status === 'Pipeline').length, color: "bg-amber-50 text-amber-600", icon: Calendar },
                    { label: t("completed"), value: projects.filter(p => p.status === 'Completed').length, color: "bg-slate-50 text-slate-600", icon: ChevronRight },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or client..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("projectName")}</th>
                                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("client")}</th>
                                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("manager")}</th>
                                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("timeline")}</th>
                                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t("status")}</th>
                                <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t("actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredProjects.map((project) => (
                                <tr key={project._id || project.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                                {project.name?.charAt(0) || "P"}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{project.name}</p>
                                                <p className="text-[10px] text-slate-500">{project.members?.length || 0} members assigned</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="text-sm font-medium text-slate-600">{project.client}</span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">👤</div>
                                            <span className="text-sm text-slate-700">
                                                {project.projectManager && typeof project.projectManager === 'object' ?
                                                    `${project.projectManager.personalDetails?.firstName || ''} ${project.projectManager.personalDetails?.lastName || ''}`.trim() || 'N/A' :
                                                    'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="text-xs text-slate-500 font-medium">
                                            <p>{project.startDate ? format(new Date(project.startDate), 'MMM dd, yyyy') : 'N/A'}</p>
                                            {project.endDate && <p className="text-[10px] text-slate-400">to {format(new Date(project.endDate), 'MMM dd, yyyy')}</p>}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex justify-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${project.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                                project.status === 'Completed' ? 'bg-indigo-50 text-indigo-600' :
                                                    'bg-amber-50 text-amber-600'
                                                }`}>
                                                {project.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => setViewingMembersProject(project)} 
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="View Members"
                                            >
                                                <Users size={16} />
                                            </button>
                                            
                                            {(() => {
                                                const projectManagerId = typeof project.projectManager === 'object' ? (project.projectManager?._id || project.projectManager?.id) : project.projectManager;
                                                const isProjectManager = projectManagerId === user?.id;
                                                
                                                return (isAdmin || isProjectManager) && (
                                                    <>
                                                        <button onClick={() => handleOpenModal(project)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        {isAdmin && (
                                                            <button onClick={() => handleDelete(project._id || project.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                                                                < Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden scale-in duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{editingProject ? t("editProject") : t("createNewProject")}</h3>
                                <p className="text-xs text-slate-500 font-medium">{t("fillProjectDetails")}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">{t("projectName")}</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        placeholder={t("projectNamePlaceholder")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">{t("clientName")}</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.client}
                                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        placeholder={t("clientNamePlaceholder")}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">{t("description")}</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                                    placeholder={t("projectOverviewPlaceholder")}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Project Manager</label>
                                    <select
                                        required
                                        disabled={editingProject && !isAdmin} // PMs shouldn't change the PM
                                        value={formData.projectManager}
                                        onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                                        className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none ${editingProject && !isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="">Select Manager</option>
                                        {employees
                                            .filter(emp => (emp.jobDetails?.designation || "").toLowerCase().includes("manager") || (emp.jobDetails?.designation || "").toLowerCase().includes("lead") || (emp.role || "").toLowerCase() === "admin")
                                            .map(emp => (
                                                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                                                    {emp.personalDetails?.firstName} {emp.personalDetails?.lastName} ({emp.jobDetails?.designation || 'N/A'})
                                                </option>
                                            ))}
                                        {employees.length > 0 && employees.filter(emp => (emp.jobDetails?.designation || "").toLowerCase().includes("manager")).length === 0 && (
                                            <optgroup label="Other Employees">
                                                {employees.map(emp => (
                                                    <option key={emp._id || emp.id} value={emp._id || emp.id}>{emp.personalDetails?.firstName} {emp.personalDetails?.lastName}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    >
                                        <option value="Pipeline">Pipeline</option>
                                        <option value="Active">Active</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">{t("startDate")}</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">{t("endDateOptional")}</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Team Members</label>
                                    <input 
                                        type="text" 
                                        placeholder="Filter members..." 
                                        value={memberSearch}
                                        onChange={(e) => setMemberSearch(e.target.value)}
                                        className="text-[10px] px-2 py-1 border border-slate-200 rounded bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 max-h-[150px] overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    {employees
                                        .filter(emp => 
                                            `${emp.personalDetails?.firstName} ${emp.personalDetails?.lastName}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                            (emp.jobDetails?.designation || "").toLowerCase().includes(memberSearch.toLowerCase())
                                        )
                                        .map(emp => (
                                        <label key={emp._id || emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                            <input
                                                type="checkbox"
                                                checked={formData.members.includes(emp._id || emp.id)}
                                                onChange={(e) => {
                                                    const empId = emp._id || emp.id;
                                                    const members = e.target.checked
                                                        ? [...formData.members, empId]
                                                        : formData.members.filter(id => id !== empId);
                                                    
                                                    // Also remove from leads if removed from members
                                                    const leads = formData.leads.filter(id => members.includes(id));
                                                    setFormData({ ...formData, members, leads });
                                                }}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-slate-700 truncate">{emp.personalDetails?.firstName} {emp.personalDetails?.lastName}</span>
                                                <span className="text-[10px] text-slate-400 truncate">{emp.jobDetails?.designation || 'Employee'}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Team Leads Selection */}
                            {formData.members.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 text-indigo-600">Designate Team Leads</label>
                                    <p className="text-[10px] text-slate-500 pl-1 -mt-1 mb-2 italic">Managers can promote members to Leads to allow them to assign tasks.</p>
                                    <div className="flex flex-wrap gap-2 p-3 bg-indigo-50/30 rounded-xl border border-indigo-100">
                                        {employees
                                            .filter(emp => formData.members.includes(emp._id || emp.id))
                                            .map(emp => {
                                                const empId = emp._id || emp.id;
                                                return (
                                                    <button
                                                        key={empId}
                                                        type="button"
                                                        onClick={() => {
                                                            const isLead = formData.leads.includes(empId);
                                                            const leads = isLead
                                                                ? formData.leads.filter(id => id !== empId)
                                                                : [...formData.leads, empId];
                                                            setFormData({ ...formData, leads });
                                                        }}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                                                            formData.leads.includes(empId)
                                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                                                        }`}
                                                    >
                                                        {emp.personalDetails?.firstName} {emp.personalDetails?.lastName}
                                                        {formData.leads.includes(empId) && <X className="w-3 h-3 ml-1" />}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">

                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
                                >
                                    {editingProject ? t("update") : t("create")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* View Members Modal */}
            {viewingMembersProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden scale-in duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{viewingMembersProject.name} Members</h3>
                                <p className="text-xs text-slate-500 font-medium">{viewingMembersProject.members?.length || 0} members assigned</p>
                            </div>
                            <button onClick={() => setViewingMembersProject(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="space-y-3">
                                {viewingMembersProject.members?.length > 0 ? (
                                    viewingMembersProject.members.map((member, idx) => (
                                        <div key={member.id || member._id || idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                                                {member.personalDetails?.firstName?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">
                                                    {member.personalDetails?.firstName || ''} {member.personalDetails?.lastName || ''}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium">{member.jobDetails?.designation || 'Member'}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-6 text-slate-500 text-sm">
                                        No members assigned to this project.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectManagement;
