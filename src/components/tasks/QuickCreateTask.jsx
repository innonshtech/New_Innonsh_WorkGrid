"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, X, Loader2 } from "lucide-react";

const QuickCreateTask = ({ status, projectId, onTaskCreated, assignedBy }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleCreate = async () => {
        if (!title.trim()) return;
        setLoading(true);

        try {
            const res = await fetch("/api/v1/admin/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    description: title.trim(),
                    status,
                    priority: "Medium",
                    category: "Other",
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    project: projectId,
                    assignedTo: null,
                    assignedBy: assignedBy,
                    assignedByModel: "User",
                }),
            });

            const data = await res.json();
            if (data.success) {
                setTitle("");
                setIsOpen(false);
                onTaskCreated?.(data.task);
            }
        } catch (error) {
            console.error("Quick create failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleCreate();
        } else if (e.key === "Escape") {
            setIsOpen(false);
            setTitle("");
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-200 text-xs font-bold group"
            >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                <span>Create task</span>
            </button>
        );
    }

    return (
        <div className="bg-white rounded-xl border-2 border-indigo-200 p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What needs to be done?"
                className="w-full text-sm text-slate-800 placeholder:text-slate-300 outline-none font-medium bg-transparent"
                disabled={loading}
            />
            <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400 font-medium">Enter to create · Esc to cancel</span>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => { setIsOpen(false); setTitle(""); }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                        disabled={loading}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !title.trim()}
                        className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickCreateTask;
