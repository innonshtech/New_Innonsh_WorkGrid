"use client";

import React, { useState } from "react";
import { Calendar, User, ChevronDown, ChevronRight, MessageSquare, CheckSquare } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
    Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Blocked: "bg-rose-100 text-rose-700 border-rose-200",
    Deferred: "bg-slate-100 text-slate-600 border-slate-200",
};

const priorityColors = {
    Urgent: "bg-rose-50 text-rose-700 border-rose-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-slate-50 text-slate-600 border-slate-200",
};

const TaskListView = ({ tasks, onTaskClick, onStatusChange, groupBy = "status", projectPrefix }) => {
    const [expandedGroups, setExpandedGroups] = useState(new Set(["Pending", "In Progress", "Blocked", "Completed", "Deferred"]));

    const toggleGroup = (group) => {
        const next = new Set(expandedGroups);
        if (next.has(group)) next.delete(group);
        else next.add(group);
        setExpandedGroups(next);
    };

    // Group tasks
    const grouped = {};
    tasks.forEach((task) => {
        const key = groupBy === "priority" ? task.priority : groupBy === "assignee" ? (task.assignedTo?.name || task.assignedTo?.personalDetails?.firstName || "Unassigned") : task.status;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(task);
    });

    // Sort groups by logical order
    const statusOrder = ["Pending", "In Progress", "Blocked", "Completed", "Deferred"];
    const priorityOrder = ["Urgent", "High", "Medium", "Low"];
    const order = groupBy === "priority" ? priorityOrder : groupBy === "status" ? statusOrder : Object.keys(grouped).sort();

    const sortedKeys = order.filter((k) => grouped[k]?.length > 0);
    // Add any remaining keys not in the order
    Object.keys(grouped).forEach((k) => {
        if (!sortedKeys.includes(k)) sortedKeys.push(k);
    });

    return (
        <div className="space-y-4">
            {sortedKeys.map((group) => {
                const groupTasks = grouped[group] || [];
                const isExpanded = expandedGroups.has(group);

                return (
                    <div key={group} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        {/* Group Header */}
                        <button
                            onClick={() => toggleGroup(group)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                                <span
                                    className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                        statusColors[group] || priorityColors[group] || "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    }`}
                                >
                                    {group}
                                </span>
                                <span className="text-xs font-bold text-slate-400">{groupTasks.length} tasks</span>
                            </div>
                        </button>

                        {/* Group Content */}
                        {isExpanded && (
                            <div className="border-t border-slate-50">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-5 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-[40%]">Task</th>
                                            <th className="px-5 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assignee</th>
                                            <th className="px-5 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Priority</th>
                                            <th className="px-5 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                                            <th className="px-5 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Progress</th>
                                            <th className="px-5 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {groupTasks.map((task) => {
                                            const assigneeName = task.assignedTo?.personalDetails
                                                ? `${task.assignedTo.personalDetails.firstName || ""} ${task.assignedTo.personalDetails.lastName || ""}`.trim()
                                                : task.assignedTo?.name || "Unassigned";
                                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Completed";

                                            return (
                                                <tr
                                                    key={task._id || task.id}
                                                    onClick={() => onTaskClick?.(task)}
                                                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                                                >
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            {projectPrefix && (
                                                                <span className="text-[9px] font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                                    {projectPrefix}-{task.boardOrder || "?"}
                                                                </span>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                                                                    {task.title}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    {task.labels?.slice(0, 2).map((l, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                                                                            style={{ backgroundColor: l.color + "20", color: l.color }}
                                                                        >
                                                                            {l.name}
                                                                        </span>
                                                                    ))}
                                                                    {task.subTasks?.length > 0 && (
                                                                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                                                                            <CheckSquare className="w-3 h-3" />
                                                                            {task.subTasks.filter((s) => s.completed).length}/{task.subTasks.length}
                                                                        </span>
                                                                    )}
                                                                    {task.comments?.length > 0 && (
                                                                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                                                                            <MessageSquare className="w-3 h-3" />
                                                                            {task.comments.length}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold">
                                                                {assigneeName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-xs font-medium text-slate-600 truncate max-w-[100px]">{assigneeName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityColors[task.priority] || ""}`}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {task.dueDate && (
                                                            <div className={`flex items-center gap-1 text-xs font-bold ${isOverdue ? "text-rose-600" : "text-slate-500"}`}>
                                                                <Calendar className="w-3 h-3" />
                                                                {format(new Date(task.dueDate), "MMM d, yyyy")}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${
                                                                        task.progress === 100 ? "bg-emerald-500" : task.progress > 50 ? "bg-indigo-500" : "bg-amber-500"
                                                                    }`}
                                                                    style={{ width: `${task.progress || 0}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-500">{task.progress || 0}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <select
                                                            value={task.status}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                onStatusChange?.(task._id || task.id, e.target.value);
                                                            }}
                                                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border cursor-pointer outline-none ${statusColors[task.status] || ""}`}
                                                        >
                                                            {Object.keys(statusColors).map((s) => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}

            {tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <CheckSquare className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-lg font-black text-slate-300">No tasks found</p>
                    <p className="text-xs text-slate-400 mt-1">Create your first task to get started</p>
                </div>
            )}
        </div>
    );
};

export default TaskListView;
