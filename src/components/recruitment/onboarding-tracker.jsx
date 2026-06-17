"use client";

import { useState, useEffect } from "react";
import {
    UserCheck, Clock, CheckCircle2,
    AlertCircle, Search, Filter,
    ChevronDown, MoreVertical, Loader2,
    Calendar, Building2, User
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function OnboardingTracker() {
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChecklist, setSelectedChecklist] = useState(null);

    useEffect(() => {
        fetchChecklists();
    }, []);

    const fetchChecklists = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/admin/recruitment/onboarding');
            const data = await res.json();
            setChecklists(data.checklists || []);
        } catch (error) {
            toast.error("Failed to load onboarding checklists");
        } finally {
            setLoading(false);
        }
    };

    const updateTaskStatus = async (checklistId, taskIndex, newStatus) => {
        try {
            const checklist = checklists.find(c => c._id === checklistId);
            const updatedTasks = [...checklist.tasks];
            updatedTasks[taskIndex].status = newStatus;

            if (newStatus === 'Completed') {
                updatedTasks[taskIndex].completedAt = new Date();
            }

            const res = await fetch('/api/v1/admin/recruitment/onboarding', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: checklistId, tasks: updatedTasks })
            });

            if (!res.ok) throw new Error("Failed to update task");

            toast.success("Task updated!");
            fetchChecklists();
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-slate-500 font-medium">Loading onboarding progress...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Onboarding Tracker</h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Track the integration journey of your newest team members.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active New Hires List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            placeholder="Filter new hires..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                        />
                    </div>

                    <div className="space-y-3">
                        {checklists.length === 0 ? (
                            <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No active onboarding</p>
                            </div>
                        ) : (
                            checklists.map((cl) => (
                                <button
                                    key={cl._id}
                                    onClick={() => setSelectedChecklist(cl)}
                                    className={`w-full p-4 rounded-3xl border text-left transition-all group ${selectedChecklist?._id === cl._id
                                            ? "bg-emerald-50 border-emerald-200"
                                            : "bg-white border-slate-100 hover:border-emerald-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-emerald-600 border border-slate-200">
                                            {cl.employee?.personalDetails?.firstName?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate">
                                                {cl.employee?.personalDetails?.firstName} {cl.employee?.personalDetails?.lastName}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-tighter">
                                                {cl.employee?.employmentDetails?.designation || "New Joiner"}
                                            </p>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${selectedChecklist?._id === cl._id ? "rotate-90" : ""}`} />
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-1.5">
                                            <span>Progress</span>
                                            <span className="text-emerald-600">
                                                {Math.round((cl.tasks.filter(t => t.status === 'Completed').length / cl.tasks.length) * 100)}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-1000"
                                                style={{ width: `${(cl.tasks.filter(t => t.status === 'Completed').length / cl.tasks.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Checklist Detail View */}
                <div className="lg:col-span-2">
                    {selectedChecklist ? (
                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-in slide-in-from-right-4 duration-500">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">
                                        <UserCheck className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">
                                            {selectedChecklist.employee?.personalDetails?.firstName}'s Integration Roadmap
                                        </h2>
                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
                                            <Building2 className="w-3 h-3" /> {selectedChecklist.employee?.employmentDetails?.department || "General"}
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <Calendar className="w-3 h-3" /> Joined {format(new Date(selectedChecklist.employee?.employmentDetails?.joiningDate || Date.now()), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-200"><MoreVertical className="w-5 h-5" /></button>
                            </div>

                            <div className="p-8">
                                <div className="space-y-6">
                                    {['Documentation', 'IT Setup', 'Training', 'Orientation', 'Finance'].map(cat => {
                                        const catTasks = selectedChecklist.tasks.filter(t => t.category === cat);
                                        if (catTasks.length === 0) return null;

                                        return (
                                            <div key={cat} className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span> {cat}
                                                </h4>
                                                <div className="grid gap-3">
                                                    {catTasks.map((task, idx) => {
                                                        const globalIdx = selectedChecklist.tasks.indexOf(task);
                                                        return (
                                                            <div key={idx} className="group p-4 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-emerald-200 hover: hover: transition-all flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <button
                                                                        onClick={() => updateTaskStatus(selectedChecklist._id, globalIdx, task.status === 'Completed' ? 'Pending' : 'Completed')}
                                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${task.status === 'Completed'
                                                                                ? "bg-emerald-500 text-white border-none"
                                                                                : "bg-white border-2 border-slate-200 text-transparent hover:border-emerald-400"
                                                                            }`}
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                    </button>
                                                                    <div>
                                                                        <p className={`text-sm font-bold ${task.status === 'Completed' ? "text-slate-400 line-through" : "text-slate-800"}`}>
                                                                            {task.task}
                                                                        </p>
                                                                        {task.dueDate && (
                                                                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                                                                                <Clock className="w-3 h-3" /> Due {format(new Date(task.dueDate), 'MMM d')}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {task.status === 'Completed' ? (
                                                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase scale-90">Done</span>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button className="text-[10px] font-black text-slate-400 hover:text-emerald-600 uppercase">Skip</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 border-dashed p-20 text-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6">
                                <UserPlus className="w-10 h-10 text-emerald-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Select a New Hire</h3>
                            <p className="text-slate-500 text-sm font-medium mt-2 max-w-xs">Choose an individual from the left to view and manage their onboarding checklist.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function UserPlus({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
    );
}
