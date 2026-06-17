"use client";

import React, { useState, useEffect } from "react";
import { 
    Users, 
    TrendingUp, 
    AlertTriangle, 
    CheckCircle2, 
    Loader2, 
    ArrowUpRight,
    ArrowDownRight,
    Search
} from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

const ResourceUtilization = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchUtilization = async () => {
        try {
            setLoading(true);
            const start = startOfWeek(new Date(), { weekStartsOn: 1 });
            const end = endOfWeek(new Date(), { weekStartsOn: 1 });
            
            const res = await fetch(`/api/v1/admin/tasks/utilization?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
            const result = await res.json();
            if (result.success) {
                setData(result);
            }
        } catch (error) {
            console.error("Failed to fetch utilization:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUtilization();
    }, []);

    const getIntensityColor = (percentage) => {
        if (percentage >= 100) return "bg-rose-50 text-rose-600 border-rose-100";
        if (percentage >= 80) return "bg-amber-50 text-amber-600 border-amber-100";
        if (percentage >= 50) return "bg-emerald-50 text-emerald-600 border-emerald-100";
        return "bg-slate-50 text-slate-500 border-slate-100";
    };

    const getStatusIcon = (percentage) => {
        if (percentage >= 100) return <AlertTriangle className="w-3 h-3" />;
        if (percentage >= 80) return <TrendingUp className="w-3 h-3" />;
        if (percentage >= 50) return <CheckCircle2 className="w-3 h-3" />;
        return null;
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-48 bg-white rounded-3xl border border-slate-100">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const filteredReport = data?.report?.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.empCode.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-8 pb-4 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            Resource Utilization
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Bandwidth Analysis</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Avg Utilization</p>
                            <p className="text-xl font-black text-indigo-600">{data?.summary?.averageUtilization}%</p>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Filter employee..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                <div className="space-y-3">
                    {filteredReport.map((emp) => (
                        <div key={emp.employeeId} className="group p-4 bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-200 hover: hover: rounded-3xl transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-bold text-indigo-600 group-hover:scale-110 transition-transform">
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 tracking-tight">{emp.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{emp.empCode}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-900">{emp.totalHours}h</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Logged</p>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-xl border text-[10px] font-black flex items-center gap-1.5 min-w-[65px] justify-center ${getIntensityColor(emp.utilizationPercentage)}`}>
                                        {getStatusIcon(emp.utilizationPercentage)}
                                        {emp.utilizationPercentage}%
                                    </div>
                                </div>
                            </div>
                            
                            {/* Simple Progress Bar */}
                            <div className="mt-4 h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-100/50">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                        emp.utilizationPercentage >= 100 ? 'bg-rose-500' :
                                        emp.utilizationPercentage >= 80 ? 'bg-amber-500' :
                                        'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(emp.utilizationPercentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    
                    {filteredReport.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">No matching employees</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResourceUtilization;
