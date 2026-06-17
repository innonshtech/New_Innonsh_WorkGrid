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
    Info,
    User as UserIcon,
    GitGraph
} from "lucide-react";
import { toast } from "react-hot-toast";

import { EnterprisePageHeader } from "@/components/ui/enterprise/EnterprisePageHeader";
import { EnterpriseSectionCard } from "@/components/ui/enterprise/EnterpriseSectionCard";
import { EnterpriseButton } from "@/components/ui/enterprise/EnterpriseButton";
import { EnterpriseEmptyState } from "@/components/ui/enterprise/EnterpriseEmptyState";
import { EnterpriseIconContainer } from "@/components/ui/enterprise/EnterpriseIconContainer";

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
            <div className={`flex items-center gap-3 py-2.5 px-4 rounded-xl hover:bg-slate-50 transition-colors group relative ${level === 0 ? 'bg-slate-50 border border-slate-200' : ''}`}>
                {hasChildren ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-500 transition-colors shrink-0"
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                ) : (
                    <div className="w-6 shrink-0" />
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${getBadgeColor(node.type)}`}>
                    {getIcon(node.type)}
                </div>

                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-800 truncate">
                        {node.name}
                    </span>
                    {node.head && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-slate-500">
                            <UserIcon className="w-3 h-3" />
                            <span className="truncate">{node.head.name}</span>
                        </div>
                    )}
                </div>

                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider ${getBadgeColor(node.type)}`}>
                        {node.type.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-8 border-l-2 border-slate-100 pl-4 mt-2 mb-2 overflow-hidden space-y-1"
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
            const response = await fetch("/api/v1/admin/organizations/tree");
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to fetch chart");
            
            setData(result.data || []);
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
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
            <EnterprisePageHeader 
                title="Organization Chart"
                subtitle="Visualize your organization's hierarchical structure and reporting lines"
                icon={GitGraph}
                actions={
                    <EnterpriseButton variant="secondary" icon={Maximize2} onClick={fetchChartData}>
                        Refresh Chart
                    </EnterpriseButton>
                }
            />

            <EnterpriseSectionCard>
                <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search entities or heads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 transition-all"
                        />
                    </div>
                </div>
            </EnterpriseSectionCard>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-slate-200">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-bold text-sm">Building organization tree...</p>
                </div>
            ) : !displayData || displayData.length === 0 ? (
                <EnterpriseEmptyState 
                    icon={Info}
                    title="No data found"
                    description="We couldn't find any organization structure to display."
                    action={
                        <EnterpriseButton onClick={fetchChartData}>
                            Try Again
                        </EnterpriseButton>
                    }
                />
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-indigo-500 border border-indigo-600" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-blue-500 border border-blue-600" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business Unit</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-amber-500 border border-amber-600" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Team</span>
                        </div>
                    </div>
                    <div className="p-6 md:p-8">
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {displayData.map((node, idx) => (
                                <OrgNode key={idx} node={node} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 hover: transition-">
                    <div className="flex items-center gap-3 mb-3">
                        <EnterpriseIconContainer icon={Building} color="indigo" size="sm" />
                        <h3 className="font-extrabold text-slate-800">Business Units</h3>
                    </div>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">Large logical divisions of a company, each with its own head and objectives.</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 hover: transition-">
                    <div className="flex items-center gap-3 mb-3">
                        <EnterpriseIconContainer icon={Users} color="emerald" size="sm" />
                        <h3 className="font-extrabold text-slate-800">Departments</h3>
                    </div>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">Functional groups within a business unit focused on specific disciplines.</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 hover: transition-">
                    <div className="flex items-center gap-3 mb-3">
                        <EnterpriseIconContainer icon={Users} color="amber" size="sm" />
                        <h3 className="font-extrabold text-slate-800">Teams</h3>
                    </div>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">Agile units within departments working together on specific products or services.</p>
                </div>
            </div>
        </div>
    );
}
