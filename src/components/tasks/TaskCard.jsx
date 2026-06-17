"use client";

import React from "react";
import { Calendar, Clock, User, GripVertical, MessageSquare } from "lucide-react";
import { format } from "date-fns";

const priorityConfig = {
    Urgent: { color: "bg-rose-500", border: "border-l-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
    High: { color: "bg-orange-500", border: "border-l-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
    Medium: { color: "bg-amber-500", border: "border-l-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
    Low: { color: "bg-slate-400", border: "border-l-slate-300", text: "text-slate-600", bg: "bg-slate-50" },
};

const TaskCard = ({ task, onClick, onDragStart, onDragEnd, projectPrefix }) => {
    const priority = priorityConfig[task.priority] || priorityConfig.Medium;
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Completed";
    const assigneeName = task.assignedTo?.personalDetails
        ? `${task.assignedTo.personalDetails.firstName || ""} ${task.assignedTo.personalDetails.lastName || ""}`.trim()
        : task.assignedTo?.name || "Unassigned";
    const assigneeInitial = assigneeName.charAt(0).toUpperCase();
    const taskId = projectPrefix ? `${projectPrefix}-${task.boardOrder || "?"}` : null;

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("taskId", task._id);
                e.dataTransfer.setData("sourceStatus", task.status);
                e.dataTransfer.effectAllowed = "move";
                e.currentTarget.style.opacity = "0.5";
                onDragStart?.(task);
            }}
            onDragEnd={(e) => {
                e.currentTarget.style.opacity = "1";
                onDragEnd?.(task);
            }}
            onClick={() => onClick?.(task)}
            className={`group bg-white rounded-xl border border-slate-200 hover: hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden border-l-[3px] ${priority.border}`}
        >
            <div className="p-3.5 space-y-3">
                {/* Top Row: Task ID + Labels */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        {taskId && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                                {taskId}
                            </span>
                        )}
                        {task.labels?.slice(0, 2).map((label, i) => (
                            <span
                                key={i}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                                style={{ backgroundColor: label.color + "20", color: label.color }}
                            >
                                {label.name}
                            </span>
                        ))}
                        {task.labels?.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-bold">+{task.labels.length - 2}</span>
                        )}
                    </div>
                    <GripVertical className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                </div>

                {/* Title */}
                <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
                    {task.title}
                </h4>

                {/* Priority Badge */}
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${priority.bg} ${priority.text}`}>
                        {task.priority}
                    </span>
                    {task.category && task.category !== "Other" && (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                            {task.category}
                        </span>
                    )}
                </div>

                {/* Progress Bar */}
                {task.progress > 0 && (
                    <div className="space-y-1">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    task.progress === 100 ? "bg-emerald-500" : task.progress > 50 ? "bg-indigo-500" : "bg-amber-500"
                                }`}
                                style={{ width: `${task.progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer: Assignee + Due Date + Comments */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white">
                            {assigneeInitial}
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 truncate max-w-[80px]">
                            {assigneeName}
                        </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        {task.comments?.length > 0 && (
                            <div className="flex items-center gap-0.5 text-slate-400">
                                <MessageSquare className="w-3 h-3" />
                                <span className="text-[10px] font-bold">{task.comments.length}</span>
                            </div>
                        )}
                        {task.dueDate && (
                            <div className={`flex items-center gap-1 text-[10px] font-bold ${isOverdue ? "text-rose-600" : "text-slate-400"}`}>
                                <Calendar className="w-3 h-3" />
                                {format(new Date(task.dueDate), "MMM d")}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
