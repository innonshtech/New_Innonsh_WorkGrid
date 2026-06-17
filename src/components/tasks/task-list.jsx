"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Filter,
    Clock,
    Calendar,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Edit2,
    Trash2,
    Loader2,
    Briefcase,
    User,
    ChevronRight,
    Target
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

const TaskList = () => {
    const { user } = useSession();
    const { t } = useLanguage();
    const router = useRouter();
    const isAdmin = user?.role === "admin" || user?.role === "super_admin";
    const basePath = isAdmin ? "/admin/tasks" : "/employee/tasks";
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/v1/admin/tasks");
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to fetch tasks: ${res.status} ${res.statusText}`);
            }
            const data = await res.json();
            if (data.success) {
                setTasks(data.data || []);
            } else {
                toast.error(data.error || "Failed to fetch tasks");
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
            toast.error("An error occurred while fetching tasks");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            const res = await fetch(`/api/v1/admin/tasks/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast.success("Task deleted successfully");
                fetchTasks();
            } else {
                toast.error(data.error || "Failed to delete task");
            }
        } catch (error) {
            toast.error("Failed to delete task");
        }
    };

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const getStatusStyles = (status) => {
        const styles = {
            'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
            'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
            'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'Blocked': 'bg-rose-50 text-rose-700 border-rose-200',
            'Deferred': 'bg-slate-50 text-slate-700 border-slate-200'
        };
        return styles[status] || styles['Pending'];
    };

    const getPriorityStyles = (priority) => {
        const styles = {
            'Low': 'bg-slate-100 text-slate-700',
            'Medium': 'bg-amber-100 text-amber-700',
            'High': 'bg-orange-100 text-orange-700',
            'Urgent': 'bg-rose-100 text-rose-700'
        };
        return styles[priority] || styles['Medium'];
    };

    if (loading && tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium tracking-tight">Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            {isAdmin && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Target className="w-8 h-8 text-indigo-600" />
                            {t("taskManagement") || "Task Management"}
                        </h1>
                        <p className="text-slate-500 text-sm font-medium pl-11">{t("monitorTeamOperations") || "Monitor and coordinate team operations"}</p>
                    </div>
                    <button
                        onClick={() => router.push(`${basePath}/create`)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all ring-offset-2 focus:ring-2 focus:ring-indigo-600 active:scale-95"
                    >
                        <Plus size={18} /> {t("createNewTask") || "Create New Task"}
                    </button>
                </div>
            )}

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-3xl border border-slate-200 backdrop-blur-xl">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tasks by title or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 ml-2" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                    >
                        <option value="all">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Blocked">Blocked</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                    >
                        <option value="all">All Priority</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                    </select>
                </div>
            </div>

            {/* Task List Grid/Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden backdrop-blur-2xl">
                <div className="overflow-x-auto text-black">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("taskName") || "Task Name"}</th>
                                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("project") || "Project"}</th>
                                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("assignedTo") || "Assigned To"}</th>
                                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("dueDate") || "Due Date"}</th>
                                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t("priority") || "Priority"}</th>
                                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t("status") || "Status"}</th>
                                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t("actions") || "Actions"}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTasks.map((task) => (
                                <tr key={task._id || task.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="p-6 max-w-xs">
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">{task.title}</p>
                                            <p className="text-[10px] text-slate-500 line-clamp-1 italic">{task.category}</p>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">
                                                {task.project?.name || "No Project"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] border border-indigo-100 text-indigo-600 font-bold uppercase">
                                                {(task.assignedTo?.personalDetails 
                                                    ? task.assignedTo.personalDetails.firstName?.charAt(0)
                                                    : task.assignedTo?.name?.charAt(0)) || <User className="w-3 h-3" />}
                                            </div>
                                            <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">
                                                {task.assignedTo?.personalDetails 
                                                    ? `${task.assignedTo.personalDetails.firstName || ""} ${task.assignedTo.personalDetails.lastName || ""}`.trim()
                                                    : task.assignedTo?.name || "Unassigned"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Calendar size={14} className={new Date(task.dueDate) < new Date() ? "text-rose-500" : ""} />
                                            <span className={`text-[11px] font-bold ${new Date(task.dueDate) < new Date() ? "text-rose-600" : ""}`}>
                                                {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${getPriorityStyles(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getStatusStyles(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                                            <button 
                                                onClick={() => router.push(isAdmin ? `${basePath}/${task._id || task.id}` : `/employee/projects/${task.project?._id || task.project?.id}`)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title={isAdmin ? "Edit Task" : "View Project Board"}
                                            >
                                                {isAdmin ? <Edit2 size={15} /> : <Briefcase size={15} />}
                                            </button>
                                            {isAdmin && (
                                                <button 
                                                    onClick={() => handleDelete(task._id || task.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Delete Task"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredTasks.length === 0 && (
                    <div className="py-24 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                            <Clock className="w-10 h-10 text-slate-200" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-900 font-black text-lg">No tasks found</p>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">Try adjusting your search or filters to see more results.</p>
                        </div>
                        <button 
                            onClick={fetchTasks}
                            className="text-indigo-600 font-bold text-xs hover:underline decoration-2 underline-offset-4"
                        >
                            Refresh List
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskList;
