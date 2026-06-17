"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building,
    ChevronRight,
    ChevronDown,
    Users,
    Briefcase,
    Search,
    Maximize2,
    Minimize2,
    Info,
    User as UserIcon
} from "lucide-react";
import { toast } from "react-hot-toast";

const OrgNode = ({ node, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(level < 2);
    const hasChildren = node.children && node.children.length > 0;

    const getIcon = (type) => {
        switch (type) {
            case 'organization': return <Building className="w-4 h-4" />;
            case 'businessUnit': return <Briefcase className="w-4 h-4" />;
            case 'department': return <Users className="w-4 h-4" />;
            case 'team': return <Users className="w-3 h-3" />;
            default: return <ChevronRight className="w-4 h-4" />;
        }
    };

    const getBadgeColor = (type) => {
        switch (type) {
            case 'organization': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'businessUnit': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'department': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'team': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="flex flex-col">
            <div className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors group relative ${level === 0 ? 'bg-slate-50 border border-slate-200' : ''}`}>
                {hasChildren ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                ) : (
                    <div className="w-5" />
                )}

                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${getBadgeColor(node.type)}`}>
                    {getIcon(node.type)}
                </div>

                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                        {node.name}
                    </span>
                    {node.head && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <UserIcon className="w-2.5 h-2.5" />
                            <span className="truncate">{node.head.name}</span>
                        </div>
                    )}
                </div>

                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getBadgeColor(node.type)}`}>
                        {node.type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-6 border-l border-slate-200 pl-4 mt-1 overflow-hidden"
                    >
                        {node.children.map((child, idx) => (
                            <OrgNode key={idx} node={child} level={level + 1} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function OrgChartPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchChartData();
    }, []);

    const fetchChartData = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/v1/super-admin/organizations/chart");
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to fetch chart");
            setData(result.data);
        } catch (error) {
            console.error("Error fetching org chart:", error);
            toast.error("Failed to load organization chart");
        } finally {
            setLoading(false);
        }
    };

    const filterNodes = (nodes, query) => {
        if (!query) return nodes;
        return nodes.map(node => {
            const matches = node.name.toLowerCase().includes(query.toLowerCase()) ||
                (node.head && node.head.name.toLowerCase().includes(query.toLowerCase()));

            const filteredChildren = node.children ? filterNodes(node.children, query) : [];

            if (matches || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren };
            }
            return null;
        }).filter(Boolean);
    };

    const displayData = searchQuery ? filterNodes(data || [], searchQuery) : data;

    return (
        <div className="min-h-screen bg-slate-50/50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                <Building className="w-6 h-6" />
                            </div>
                            Organization Chart
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Visualize your organization's hierarchical structure and reporting lines
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search entities or heads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                            />
                        </div>
                        <button
                            onClick={fetchChartData}
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            title="Refresh Chart"
                        >
                            <Maximize2 className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Building organization tree...</p>
                    </div>
                ) : !displayData || displayData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Info className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No data found</h3>
                        <p className="text-slate-500 mt-1">We couldn't find any organization structure to display.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-6">
                            <div className="flex items-center gap-6 py-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-indigo-500 border border-indigo-600" />
                                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Company</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-slate-500 border border-blue-600" />
                                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Business Unit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600" />
                                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Department</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-amber-500 border border-amber-600" />
                                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Team</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="space-y-4 max-w-3xl">
                                {displayData.map((node, idx) => (
                                    <OrgNode key={idx} node={node} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4 text-indigo-600">
                            <Building className="w-5 h-5" />
                            <h3 className="font-semibold">Business Units</h3>
                        </div>
                        <p className="text-slate-500 text-sm">Large logical divisions of a company, each with its own head and objectives.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4 text-emerald-600">
                            <Users className="w-5 h-5" />
                            <h3 className="font-semibold">Departments</h3>
                        </div>
                        <p className="text-slate-500 text-sm">Functional groups within a business unit focused on specific disciplines.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4 text-amber-600">
                            <Users className="w-5 h-5" />
                            <h3 className="font-semibold">Teams</h3>
                        </div>
                        <p className="text-slate-500 text-sm">Agile units within departments working together on specific products or services.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
