"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    X, Calendar, User, Flag, Clock, Tag, MessageSquare,
    CheckSquare, Edit3, Loader2, Send, Trash2, ChevronDown,
    AlertCircle, Plus, Check
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContext";

const priorityOptions = [
    { value: "Low", color: "#94a3b8", bg: "bg-slate-100" },
    { value: "Medium", color: "#f59e0b", bg: "bg-amber-100" },
    { value: "High", color: "#f97316", bg: "bg-orange-100" },
    { value: "Urgent", color: "#ef4444", bg: "bg-rose-100" },
];

const statusOptions = ["Pending", "In Progress", "Completed", "Blocked", "Deferred"];

const statusColors = {
    Pending: "bg-amber-100 text-amber-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Completed: "bg-emerald-100 text-emerald-700",
    Blocked: "bg-rose-100 text-rose-700",
    Deferred: "bg-slate-100 text-slate-600",
};

const TaskDetailPanel = ({ task, isOpen, onClose, onUpdate, onDelete, employees = [], boardColumns = [], canManageTasks = false }) => {
    const { user } = useSession();
    const [editedTask, setEditedTask] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [sendingComment, setSendingComment] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [editingDesc, setEditingDesc] = useState(false);
    const [newSubTask, setNewSubTask] = useState("");
    const panelRef = useRef(null);
    const titleRef = useRef(null);

    const allStatuses = boardColumns.length > 0 ? boardColumns : statusOptions;

    useEffect(() => {
        if (task) {
            setEditedTask({ ...task });
            setComments(task.comments || []);
            fetchComments(task._id);
        }
    }, [task]);

    useEffect(() => {
        if (editingTitle && titleRef.current) {
            titleRef.current.focus();
            titleRef.current.select();
        }
    }, [editingTitle]);

    const fetchComments = async (taskId) => {
        try {
            setLoadingComments(true);
            const res = await fetch(`/api/v1/admin/tasks/${taskId}/comments`);
            const data = await res.json();
            if (data.success) setComments(data.comments || []);
        } catch (err) {
            console.error("Failed to fetch comments:", err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleSendComment = async () => {
        if (!newComment.trim() || !task?._id) return;
        setSendingComment(true);
        try {
            const res = await fetch(`/api/v1/admin/tasks/${task._id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment: newComment.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                setComments(data.comments || []);
                setNewComment("");
                toast.success("Comment added");
            }
        } catch (err) {
            toast.error("Failed to add comment");
        } finally {
            setSendingComment(false);
        }
    };

    const handleFieldUpdate = async (field, value) => {
        const updated = { ...editedTask, [field]: value };
        setEditedTask(updated);

        setSaving(true);
        try {
            const res = await fetch(`/api/v1/admin/tasks/${task._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: value }),
            });
            const data = await res.json();
            if (data.success) {
                onUpdate?.(data.task || updated);
            }
        } catch (err) {
            toast.error("Failed to update");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/admin/tasks/${task._id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Task deleted");
                onDelete?.(task._id);
                onClose();
            }
        } catch (err) {
            toast.error("Failed to delete task");
        } finally {
            setSaving(false);
        }
    };

    const calculateProgress = (subTasks) => {
        if (!subTasks || subTasks.length === 0) return editedTask.progress || 0;
        const completed = subTasks.filter(s => s.completed).length;
        return Math.round((completed / subTasks.length) * 100);
    };

    const handleProgressUpdate = async (value) => {
        const progress = Math.max(0, Math.min(100, parseInt(value) || 0));
        handleFieldUpdate("progress", progress);
    };

    const handleAddSubTask = async () => {
        if (!newSubTask.trim()) return;
        const currentSubTasks = editedTask.subTasks || [];
        const updatedSubTasks = [...currentSubTasks, { title: newSubTask.trim(), completed: false }];
        setNewSubTask("");
        
        const newProgress = calculateProgress(updatedSubTasks);
        
        // Multi-update
        const updated = { 
            ...editedTask, 
            subTasks: updatedSubTasks,
            progress: newProgress 
        };
        setEditedTask(updated);
        
        try {
            setSaving(true);
            const res = await fetch(`/api/v1/admin/tasks/${task._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subTasks: updatedSubTasks, progress: newProgress }),
            });
            const data = await res.json();
            if (data.success) {
                onUpdate?.(data.task);
            }
        } catch (err) {
            toast.error("Failed to add sub-task");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleSubTask = async (index) => {
        const updatedSubTasks = [...(editedTask.subTasks || [])];
        updatedSubTasks[index] = {
            ...updatedSubTasks[index],
            completed: !updatedSubTasks[index].completed,
            completedAt: !updatedSubTasks[index].completed ? new Date() : null,
        };
        
        const newProgress = calculateProgress(updatedSubTasks);
        
        const updated = { 
            ...editedTask, 
            subTasks: updatedSubTasks,
            progress: newProgress 
        };
        setEditedTask(updated);

        try {
            setSaving(true);
            const res = await fetch(`/api/v1/admin/tasks/${task._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subTasks: updatedSubTasks, progress: newProgress }),
            });
            const data = await res.json();
            if (data.success) {
                onUpdate?.(data.task);
            }
        } catch (err) {
            toast.error("Failed to update sub-task");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSubTask = async (index) => {
        const updatedSubTasks = (editedTask.subTasks || []).filter((_, i) => i !== index);
        const newProgress = calculateProgress(updatedSubTasks);
        
        const updated = { 
            ...editedTask, 
            subTasks: updatedSubTasks,
            progress: newProgress 
        };
        setEditedTask(updated);

        try {
            setSaving(true);
            const res = await fetch(`/api/v1/admin/tasks/${task._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subTasks: updatedSubTasks, progress: newProgress }),
            });
            const data = await res.json();
            if (data.success) {
                onUpdate?.(data.task);
            }
        } catch (err) {
            toast.error("Failed to delete sub-task");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !editedTask) return null;

    const assigneeName = editedTask.assignedTo?.personalDetails
        ? `${editedTask.assignedTo.personalDetails.firstName || ""} ${editedTask.assignedTo.personalDetails.lastName || ""}`.trim()
        : editedTask.assignedTo?.name || "Unassigned";

    const completedSubTasks = (editedTask.subTasks || []).filter((s) => s.completed).length;
    const totalSubTasks = (editedTask.subTasks || []).length;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className="fixed right-0 top-0 h-full w-full max-w-[520px] bg-white z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        {editedTask.project?.prefix && (
                            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                {editedTask.project.prefix}-{editedTask.boardOrder || "?"}
                            </span>
                        )}
                        {saving && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                    </div>
                    <div className="flex items-center gap-2">
                        {canManageTasks && (
                            <button
                                onClick={handleDelete}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                title="Delete Task"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Title */}
                        <div className="group">
                            {editingTitle ? (
                                <input
                                    ref={titleRef}
                                    type="text"
                                    value={editedTask.title}
                                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                                    onBlur={() => {
                                        setEditingTitle(false);
                                        handleFieldUpdate("title", editedTask.title);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            setEditingTitle(false);
                                            handleFieldUpdate("title", editedTask.title);
                                        }
                                    }}
                                    className="text-xl font-bold text-slate-900 w-full outline-none border-b-2 border-indigo-500 pb-1 bg-transparent"
                                />
                            ) : (
                                <h2
                                    onClick={() => setEditingTitle(true)}
                                    className="text-xl font-bold text-slate-900 cursor-pointer hover:text-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    {editedTask.title}
                                    <Edit3 className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </h2>
                            )}
                        </div>

                        {/* Status + Priority Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                                <select
                                    value={editedTask.status}
                                    onChange={(e) => handleFieldUpdate("status", e.target.value)}
                                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border-0 outline-none cursor-pointer ${statusColors[editedTask.status] || "bg-slate-100"}`}
                                >
                                    {allStatuses.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority</label>
                                <select
                                    value={editedTask.priority}
                                    onChange={(e) => handleFieldUpdate("priority", e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold border border-slate-200 outline-none cursor-pointer"
                                >
                                    {priorityOptions.map((p) => (
                                        <option key={p.value} value={p.value}>{p.value}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assignee</label>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                    {assigneeName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    {employees.length > 0 && canManageTasks ? (
                                        <select
                                            value={typeof editedTask.assignedTo === 'object' ? editedTask.assignedTo?._id : editedTask.assignedTo}
                                            onChange={(e) => handleFieldUpdate("assignedTo", e.target.value)}
                                            className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer"
                                        >
                                            <option value="">Unassigned</option>
                                            {employees.map((emp) => (
                                                <option key={emp._id} value={emp._id}>
                                                    {emp.personalDetails
                                                        ? `${emp.personalDetails.firstName || ""} ${emp.personalDetails.lastName || ""}`.trim()
                                                        : emp.name || "Unknown"}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="text-sm font-bold text-slate-800">{assigneeName}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Due Date + Estimated Hours */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Due Date
                                </label>
                                <input
                                    type="date"
                                    value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split("T")[0] : ""}
                                    onChange={(e) => handleFieldUpdate("dueDate", e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Est. Hours
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={editedTask.estimatedHours || ""}
                                    onChange={(e) => handleFieldUpdate("estimatedHours", parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                            {editingDesc ? (
                                <textarea
                                    autoFocus
                                    rows={6}
                                    value={editedTask.description || ""}
                                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                                    onBlur={() => {
                                        setEditingDesc(false);
                                        handleFieldUpdate("description", editedTask.description);
                                    }}
                                    className="w-full px-3 py-2 bg-white border-2 border-indigo-200 rounded-xl text-sm text-slate-700 outline-none resize-none"
                                />
                            ) : (
                                <div className="space-y-2">
                                    <div
                                        onClick={() => setEditingDesc(true)}
                                        className={`p-3 bg-slate-50 rounded-xl text-sm text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100 ${
                                            editedTask.description?.length > 300 ? "max-h-[150px] overflow-hidden relative" : "min-h-[60px]"
                                        }`}
                                    >
                                        {editedTask.description || "Click to add description..."}
                                        {editedTask.description?.length > 300 && (
                                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
                                        )}
                                    </div>
                                    {editedTask.description?.length > 300 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowFullDesc(true);
                                            }}
                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            View Full Description
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Labels */}
                        {editedTask.labels && editedTask.labels.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> Labels
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {editedTask.labels.map((label, i) => (
                                        <span
                                            key={i}
                                            className="text-[10px] font-bold px-2 py-1 rounded-lg"
                                            style={{ backgroundColor: label.color + "20", color: label.color }}
                                        >
                                            {label.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Progress */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</label>
                                <span className="text-xs font-black text-slate-700">{editedTask.progress || 0}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={editedTask.progress || 0}
                                onChange={(e) => handleProgressUpdate(e.target.value)}
                                disabled={totalSubTasks > 0}
                                className={`w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-600 ${totalSubTasks > 0 ? "bg-slate-200 opacity-50 cursor-not-allowed" : "bg-slate-100"}`}
                            />
                            {totalSubTasks > 0 && (
                                <p className="text-[9px] text-slate-400 italic">Progress is automatically calculated from {totalSubTasks} sub-task{totalSubTasks > 1 ? 's' : ''}</p>
                            )}
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden -mt-1">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                        editedTask.progress === 100
                                            ? "bg-emerald-500"
                                            : editedTask.progress > 50
                                              ? "bg-indigo-500"
                                              : "bg-amber-500"
                                    }`}
                                    style={{ width: `${editedTask.progress || 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Sub-tasks */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <CheckSquare className="w-3 h-3" /> Sub-tasks
                                </label>
                                {totalSubTasks > 0 && (
                                    <span className="text-[10px] font-bold text-slate-500">
                                        {completedSubTasks}/{totalSubTasks}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                {(editedTask.subTasks || []).map((sub, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between p-2 rounded-lg group/subtask transition-colors ${
                                            sub.completed ? "bg-emerald-50" : "bg-slate-50 hover:bg-slate-100"
                                        }`}
                                    >
                                        <div 
                                            className="flex items-center gap-2.5 flex-1 cursor-pointer"
                                            onClick={() => handleToggleSubTask(i)}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                                    sub.completed
                                                        ? "bg-emerald-500 border-emerald-500"
                                                        : "border-slate-300"
                                                }`}
                                            >
                                                {sub.completed && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span
                                                className={`text-xs font-medium ${
                                                    sub.completed ? "text-slate-400 line-through" : "text-slate-700"
                                                }`}
                                            >
                                                {sub.title}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSubTask(i);
                                            }}
                                            className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover/subtask:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newSubTask}
                                    onChange={(e) => setNewSubTask(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddSubTask()}
                                    placeholder="Add a sub-task..."
                                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <button
                                    onClick={handleAddSubTask}
                                    disabled={!newSubTask.trim()}
                                    className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Comments ({comments.length})
                            </label>

                            {loadingComments ? (
                                <div className="flex items-center gap-2 py-4 justify-center text-slate-400">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-xs">Loading...</span>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                    {comments.length === 0 && (
                                        <p className="text-xs text-slate-400 italic text-center py-4">No comments yet</p>
                                    )}
                                    {comments.map((c, i) => {
                                        const cName = c.user?.personalDetails
                                            ? `${c.user.personalDetails.firstName || ""} ${c.user.personalDetails.lastName || ""}`.trim()
                                            : c.user?.name || "User";
                                        return (
                                            <div key={i} className="flex gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 mt-0.5">
                                                    {cName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-700">{cName}</span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {c.createdAt ? format(new Date(c.createdAt), "MMM d, h:mm a") : ""}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 leading-relaxed">{c.comment}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Add Comment */}
                            <div className="flex items-start gap-2 pt-1">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0 mt-0.5">
                                    {(user?.personalDetails?.firstName || user?.name || "U").charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 flex items-end gap-2">
                                    <textarea
                                        rows={1}
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendComment();
                                            }
                                        }}
                                        placeholder="Write a comment..."
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                    />
                                    <button
                                        onClick={handleSendComment}
                                        disabled={!newComment.trim() || sendingComment}
                                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0"
                                    >
                                        {sendingComment ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Send className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description Full Modal */}
            {showFullDesc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        onClick={() => setShowFullDesc(false)}
                    />
                    <div className="relative bg-white rounded-3xl w-full max-w-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-black text-slate-900">Full Description</h3>
                            <button 
                                onClick={() => setShowFullDesc(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
                            {editedTask.description}
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setShowFullDesc(false)}
                                className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-colors"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TaskDetailPanel;
