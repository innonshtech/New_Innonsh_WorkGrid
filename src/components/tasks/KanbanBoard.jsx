"use client";

import React, { useState, useCallback } from "react";
import { Loader2, Inbox } from "lucide-react";
import TaskCard from "./TaskCard";
import QuickCreateTask from "./QuickCreateTask";
import TaskDetailPanel from "./TaskDetailPanel";

const columnColors = {
    Pending: { header: "bg-amber-50 border-amber-200", dot: "bg-amber-400", accent: "text-amber-700" },
    "In Progress": { header: "bg-blue-50 border-blue-200", dot: "bg-blue-500", accent: "text-blue-700" },
    Completed: { header: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", accent: "text-emerald-700" },
    Blocked: { header: "bg-rose-50 border-rose-200", dot: "bg-rose-500", accent: "text-rose-700" },
    Deferred: { header: "bg-slate-50 border-slate-200", dot: "bg-slate-400", accent: "text-slate-600" },
    // Fallback for custom columns
    default: { header: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-500", accent: "text-indigo-700" },
};

const getColumnColor = (status) => columnColors[status] || columnColors.default;

const KanbanBoard = ({
    tasks,
    columns,
    projectId,
    projectPrefix,
    onTaskUpdate,
    onTaskCreated,
    onReorder,
    onDelete,
    employees = [],
    userId,
    isAdmin,
    canManageTasks,
    loading,
}) => {
    const [selectedTask, setSelectedTask] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // Group tasks by status
    const getColumnTasks = useCallback(
        (status) => {
            return tasks
                .filter((t) => t.status === status)
                .sort((a, b) => (a.boardOrder || 0) - (b.boardOrder || 0));
        },
        [tasks]
    );

    // Handle drag over a column
    const handleDragOver = (e, column) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverColumn(column);
    };

    // Handle drag over a specific card position
    const handleDragOverCard = (e, column, index) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        setDragOverColumn(column);
        setDragOverIndex(index);
    };

    // Handle drop on a column
    const handleDrop = async (e, targetColumn) => {
        e.preventDefault();
        setDragOverColumn(null);
        setDragOverIndex(null);

        const taskId = e.dataTransfer.getData("taskId");
        const sourceStatus = e.dataTransfer.getData("sourceStatus");

        if (!taskId) return;
        if (sourceStatus === targetColumn) return; // Same column, no status change needed from column drop

        const task = tasks.find((t) => t._id === taskId);
        if (!task) return;

        // Get target column tasks to determine order
        const targetTasks = getColumnTasks(targetColumn);
        const newOrder = targetTasks.length; // Add to end

        // Optimistic update
        const updatedTask = { ...task, status: targetColumn, boardOrder: newOrder };
        onTaskUpdate?.(updatedTask);

        // Persist
        try {
            await fetch(`/api/v1/admin/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: targetColumn, boardOrder: newOrder }),
            });
        } catch (err) {
            console.error("Failed to update task status:", err);
        }
    };

    const handleDragLeave = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverColumn(null);
            setDragOverIndex(null);
        }
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
    };

    const handleTaskUpdated = (updatedTask) => {
        onTaskUpdate?.(updatedTask);
        // Update selected task if it's the same
        if (selectedTask?._id === updatedTask._id) {
            setSelectedTask(updatedTask);
        }
    };

    const handleTaskCreated = (newTask) => {
        onTaskCreated?.(newTask);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium">Loading board...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex gap-5 overflow-x-auto pb-6 px-1 min-h-[calc(100vh-320px)]">
                {columns.map((column) => {
                    const columnTasks = getColumnTasks(column);
                    const colors = getColumnColor(column);
                    const isDragTarget = dragOverColumn === column;

                    return (
                        <div
                            key={column}
                            className="flex-shrink-0 w-[300px] flex flex-col"
                            onDragOver={(e) => handleDragOver(e, column)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column)}
                        >
                            {/* Column Header */}
                            <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl border ${colors.header}`}>
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                                    <h3 className={`text-xs font-black uppercase tracking-widest ${colors.accent}`}>
                                        {column}
                                    </h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 bg-white/80 px-2 py-0.5 rounded-full">
                                    {columnTasks.length}
                                </span>
                            </div>

                            {/* Column Body */}
                            <div
                                className={`flex-1 p-2.5 space-y-2.5 rounded-b-2xl border border-t-0 transition-colors duration-200 overflow-y-auto max-h-[calc(100vh-400px)] ${
                                    isDragTarget
                                        ? "bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-200"
                                        : "bg-slate-50/50 border-slate-100"
                                }`}
                            >
                                {columnTasks.length === 0 && !isDragTarget && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Inbox className="w-8 h-8 text-slate-200 mb-2" />
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                            No tasks
                                        </p>
                                    </div>
                                )}

                                {isDragTarget && columnTasks.length === 0 && (
                                    <div className="border-2 border-dashed border-indigo-300 rounded-xl py-8 flex items-center justify-center">
                                        <p className="text-xs font-bold text-indigo-400">Drop here</p>
                                    </div>
                                )}

                                {columnTasks.map((task, index) => (
                                    <div
                                        key={task._id || task.id}
                                        onDragOver={(e) => handleDragOverCard(e, column, index)}
                                    >
                                        {isDragTarget && dragOverIndex === index && (
                                            <div className="h-1 bg-indigo-400 rounded-full mx-2 mb-1 animate-pulse" />
                                        )}
                                        <TaskCard
                                            task={task}
                                            onClick={handleTaskClick}
                                            projectPrefix={projectPrefix}
                                        />
                                    </div>
                                ))}

                                {/* Quick Create */}
                                {canManageTasks && (
                                    <QuickCreateTask
                                        status={column}
                                        projectId={projectId}
                                        assignedBy={userId}
                                        onTaskCreated={handleTaskCreated}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Task Detail Panel */}
            <TaskDetailPanel
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdate={handleTaskUpdated}
                onDelete={onDelete}
                employees={employees}
                boardColumns={columns}
                canManageTasks={canManageTasks}
            />
        </>
    );
};

export default KanbanBoard;
