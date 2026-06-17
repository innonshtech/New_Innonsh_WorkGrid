"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Briefcase, Users, Target, Clock, Zap,
    Settings, Loader2, AlertCircle, Plus, LayoutGrid
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSession } from "@/context/SessionContext";
import KanbanBoard from "./KanbanBoard";
import TaskListView from "./TaskListView";
import TaskDetailPanel from "./TaskDetailPanel";
import BoardFilters from "./BoardFilters";

const ProjectBoard = () => {
    const params = useParams();
    const router = useRouter();
    const { user } = useSession();
    const isAdmin = user?.role === "admin" || user?.role === "super_admin";
    // Core data
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    // Permission helpers for hierarchical access
    const isProjectManager = user?.id === (typeof project?.projectManager === 'object' ? project?.projectManager?._id : project?.projectManager);
    const isLead = project?.leads?.some(l => (typeof l === 'object' ? l._id : l) === user?.id);
    const canManageBoard = isAdmin || isProjectManager;
    const canManageTasks = isAdmin || isProjectManager || isLead;

    const basePath = isAdmin ? "/admin/tasks/projects" : "/employee/projects";

    // View & filter state
    const [viewMode, setViewMode] = useState("board");
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [assigneeFilter, setAssigneeFilter] = useState("");

    // Task detail panel
    const [selectedTask, setSelectedTask] = useState(null);

    // Column management
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [newColumnName, setNewColumnName] = useState("");

    // Fetch all data
    useEffect(() => {
        if (params.id) {
            fetchProjectData();
        }
    }, [params.id]);

    const fetchProjectData = async () => {
        try {
            setLoading(true);
            const [projRes, taskRes, empRes] = await Promise.all([
                fetch(`/api/v1/admin/tasks/projects/${params.id}`),
                fetch(`/api/v1/admin/tasks?project=${params.id}&view=board`),
                fetch("/api/v1/admin/payroll/employees?limit=1000"),
            ]);

            const projData = await projRes.json();
            const taskData = await taskRes.json();
            const empData = await empRes.json();

            if (projData.success) {
                setProject(projData.project);
                setStats(projData.stats);
            } else {
                toast.error("Failed to load project");
            }

            if (taskData.success) {
                setTasks(taskData.data || []);
            }

            if (empData.success) {
                setEmployees(empData.data || empData.employees || []);
            }
        } catch (error) {
            console.error("Error loading project:", error);
            toast.error("Failed to load project data");
        } finally {
            setLoading(false);
        }
    };

    // Filter tasks based on search, priority, assignee
    const filteredTasks = useCallback(() => {
        return tasks.filter((task) => {
            // Search filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchesSearch =
                    task.title?.toLowerCase().includes(q) ||
                    task.description?.toLowerCase().includes(q);
                if (!matchesSearch) return false;
            }

            // Priority filter
            if (priorityFilter !== "all" && task.priority !== priorityFilter) {
                return false;
            }

            // Assignee filter
            if (assigneeFilter) {
                const taskAssignee = typeof task.assignedTo === "object" ? task.assignedTo?._id : task.assignedTo;
                if (taskAssignee !== assigneeFilter) return false;
            }

            return true;
        });
    }, [tasks, searchQuery, priorityFilter, assigneeFilter]);

    // Handle task updates from board/panel
    const handleTaskUpdate = (updatedTask) => {
        setTasks((prev) =>
            prev.map((t) => (t._id === updatedTask._id ? { ...t, ...updatedTask } : t))
        );
    };

    // Handle new task created
    const handleTaskCreated = (newTask) => {
        fetchProjectData(); // Re-fetch to get populated data
    };

    // Handle inline status change from list view
    const handleStatusChange = async (taskId, newStatus) => {
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
        );

        try {
            await fetch(`/api/v1/admin/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch (err) {
            toast.error("Failed to update status");
            fetchProjectData(); // Revert
        }
    };

    // Handle task deletion
    const handleTaskDelete = (taskId) => {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    // Handle task click from list view
    const handleListTaskClick = (task) => {
        setSelectedTask(task);
    };

    // Add custom column
    const handleAddColumn = async () => {
        if (!newColumnName.trim()) return;
        const updatedColumns = [...(project.boardColumns || []), newColumnName.trim()];

        try {
            const res = await fetch(`/api/v1/admin/tasks/projects/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ boardColumns: updatedColumns }),
            });
            const data = await res.json();
            if (data.success) {
                setProject({ ...project, boardColumns: updatedColumns });
                setNewColumnName("");
                setShowColumnModal(false);
                toast.success(`Column "${newColumnName.trim()}" added`);
            }
        } catch (err) {
            toast.error("Failed to add column");
        }
    };

    // Remove custom column
    const handleRemoveColumn = async (columnName) => {
        const defaultColumns = ["Pending", "In Progress", "Completed", "Blocked"];
        if (defaultColumns.includes(columnName)) {
            toast.error("Cannot remove default columns");
            return;
        }

        const tasksInColumn = tasks.filter((t) => t.status === columnName);
        if (tasksInColumn.length > 0) {
            toast.error(`Move ${tasksInColumn.length} tasks from "${columnName}" first`);
            return;
        }

        const updatedColumns = (project.boardColumns || []).filter((c) => c !== columnName);
        try {
            const res = await fetch(`/api/v1/admin/tasks/projects/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ boardColumns: updatedColumns }),
            });
            const data = await res.json();
            if (data.success) {
                setProject({ ...project, boardColumns: updatedColumns });
                toast.success(`Column "${columnName}" removed`);
            }
        } catch (err) {
            toast.error("Failed to remove column");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse">Loading project board...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 m-8">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-900">Project Not Found</h3>
                <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">
                    The project you are looking for does not exist or you do not have access.
                </p>
                <button
                    onClick={() => router.push(basePath)}
                    className="mt-6 font-bold text-indigo-600 hover:underline"
                >
                    Back to Projects
                </button>
            </div>
        );
    }

    const columns = project.boardColumns || ["Pending", "In Progress", "Completed", "Blocked"];
    const projectMembers = project.members || [];
    const managerName = project.projectManager?.personalDetails
        ? `${project.projectManager.personalDetails.firstName || ""} ${project.projectManager.personalDetails.lastName || ""}`.trim()
        : "Unassigned";

    const filtered = filteredTasks();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Header */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
                <div className="px-6 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left: Back + Project Info */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push(basePath)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-lg font-black text-slate-900 tracking-tight">{project.name}</h1>
                                        {project.prefix && (
                                            <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                                {project.prefix}
                                            </span>
                                        )}
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                            project.status === "Active" ? "bg-emerald-50 text-emerald-600" :
                                            project.status === "Completed" ? "bg-indigo-50 text-indigo-600" :
                                            project.status === "On Hold" ? "bg-amber-50 text-amber-600" :
                                            "bg-slate-50 text-slate-500"
                                        }`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        {project.client} · Managed by {managerName}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Quick Stats + Actions */}
                        <div className="flex items-center gap-3">
                            {/* Mini Stats Pills */}
                            <div className="hidden md:flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                                    <span className="text-[10px] font-bold text-slate-600">
                                        {stats?.completedTasks || 0}/{stats?.totalTasks || 0}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-[10px] font-bold text-slate-600">
                                        {stats?.totalLoggedHours || 0}h logged
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <Users className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="text-[10px] font-bold text-slate-600">
                                        {projectMembers.length} members
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                                    <span className="text-[10px] font-bold text-slate-600">
                                        {stats?.overallProgress || 0}%
                                    </span>
                                </div>
                            </div>

                            {/* Manage Columns */}
                            {canManageBoard && (
                                <button
                                    onClick={() => setShowColumnModal(true)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="Manage Columns"
                                >
                                    <Settings className="w-4.5 h-4.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000"
                                style={{ width: `${stats?.overallProgress || 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="px-6 pt-5 pb-2">
                <BoardFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    priorityFilter={priorityFilter}
                    setPriorityFilter={setPriorityFilter}
                    assigneeFilter={assigneeFilter}
                    setAssigneeFilter={setAssigneeFilter}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    members={projectMembers}
                />
            </div>

            {/* Board View */}
            <div className="px-6 py-4">
                {viewMode === "board" && (
                    <KanbanBoard
                        tasks={filtered}
                        columns={columns}
                        projectId={params.id}
                        projectPrefix={project.prefix}
                        onTaskUpdate={handleTaskUpdate}
                        onTaskCreated={handleTaskCreated}
                        onDelete={handleTaskDelete}
                        employees={employees}
                        userId={user?.id}
                        isAdmin={isAdmin}
                        canManageTasks={canManageTasks}
                        loading={false}
                    />
                )}

                {viewMode === "list" && (
                    <TaskListView
                        tasks={filtered}
                        onTaskClick={handleListTaskClick}
                        onStatusChange={handleStatusChange}
                        projectPrefix={project.prefix}
                    />
                )}

                {viewMode === "calendar" && (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <LayoutGrid className="w-12 h-12 text-slate-200 mb-4" />
                        <h3 className="text-lg font-black text-slate-300">Calendar View</h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Calendar view is available at{" "}
                            <button
                                onClick={() => router.push("/admin/tasks/calendar")}
                                className="text-indigo-600 font-bold hover:underline"
                            >
                                /admin/tasks/calendar
                            </button>
                        </p>
                    </div>
                )}
            </div>

            {/* Task Detail Panel (for list view clicks) */}
            {viewMode === "list" && (
                <TaskDetailPanel
                    task={selectedTask}
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={(updated) => {
                        handleTaskUpdate(updated);
                        setSelectedTask(updated);
                    }}
                    onDelete={handleTaskDelete}
                    employees={employees}
                    boardColumns={columns}
                    canManageTasks={canManageTasks}
                />
            )}

            {/* Column Management Modal */}
            {showColumnModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-black text-slate-900 mb-1">Manage Board Columns</h3>
                        <p className="text-xs text-slate-500 mb-5">Add or remove columns to customize your workflow</p>

                        <div className="space-y-2 mb-5 max-h-[300px] overflow-y-auto">
                            {columns.map((col, i) => {
                                const defaultCols = ["Pending", "In Progress", "Completed", "Blocked"];
                                const isDefault = defaultCols.includes(col);
                                const taskCount = tasks.filter((t) => t.status === col).length;

                                return (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                            <span className="text-sm font-bold text-slate-700">{col}</span>
                                            <span className="text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded">
                                                {taskCount} tasks
                                            </span>
                                            {isDefault && (
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">default</span>
                                            )}
                                        </div>
                                        {!isDefault && (
                                            <button
                                                onClick={() => handleRemoveColumn(col)}
                                                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="text"
                                value={newColumnName}
                                onChange={(e) => setNewColumnName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
                                placeholder="New column name (e.g. QA Review)"
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <button
                                onClick={handleAddColumn}
                                disabled={!newColumnName.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowColumnModal(false)}
                                className="px-5 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectBoard;
