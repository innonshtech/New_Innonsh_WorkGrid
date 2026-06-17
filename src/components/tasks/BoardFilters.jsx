"use client";

import React from "react";
import { Search, Filter, LayoutGrid, List, Calendar, X } from "lucide-react";

const BoardFilters = ({
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    viewMode,
    setViewMode,
    members = [],
}) => {
    const hasFilters = searchQuery || priorityFilter !== "all" || assigneeFilter;

    const clearAllFilters = () => {
        setSearchQuery("");
        setPriorityFilter("all");
        setAssigneeFilter("");
    };

    return (
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200">
            {/* Left Side: Search + Filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search */}
                <div className="relative min-w-[220px] flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Priority Filter */}
                <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
                    >
                        <option value="all">All Priority</option>
                        <option value="Urgent">🔴 Urgent</option>
                        <option value="High">🟠 High</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="Low">⚪ Low</option>
                    </select>
                </div>

                {/* Assignee Filter */}
                {members.length > 0 && (
                    <select
                        value={assigneeFilter}
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
                    >
                        <option value="">All Members</option>
                        {members.map((m) => (
                            <option key={m._id} value={m._id}>
                                {m.personalDetails
                                    ? `${m.personalDetails.firstName || ""} ${m.personalDetails.lastName || ""}`.trim()
                                    : m.name || "Unknown"}
                            </option>
                        ))}
                    </select>
                )}

                {/* Clear Filters */}
                {hasFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                        <X className="w-3 h-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* Right Side: View Switcher */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
                {[
                    { mode: "board", icon: LayoutGrid, label: "Board" },
                    { mode: "list", icon: List, label: "List" },
                    { mode: "calendar", icon: Calendar, label: "Calendar" },
                ].map(({ mode, icon: Icon, label }) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                            viewMode === mode
                                ? "bg-white text-indigo-700"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                        title={label}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BoardFilters;
