"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Clock,
    CheckCircle2,
    AlertCircle,
    Users,
    ChevronRight,
    ArrowLeft,
    TrendingUp,
    Briefcase,
    Calendar,
    Target,
    Zap,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSession } from "@/context/SessionContext";

const ProjectDashboard = () => {
    const params = useParams();
    const router = useRouter();
    const { user } = useSession();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchProjectData();
        }
    }, [params.id]);

    const fetchProjectData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/admin/tasks/projects/${params.id}`);
            const result = await res.json();
            if (result.success) {
                setData(result);
            } else {
                toast.error(result.error || "Failed to fetch project data");
            }
        } catch (error) {
            toast.error("An error occurred while fetching project data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse">Analyzing project data...</p>
            </div>
        );
    }

    if (!data?.project) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 m-8">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-900">Project Not Found</h3>
                <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">The project you're looking for doesn't exist or is currently restricted.</p>
                <button onClick={() => router.back()} className="mt-6 font-bold text-indigo-600 hover:underline">Go Back</button>
            </div>
        );
    }

    const { project, stats } = data;

    return (
        <div className="p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Projects
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{project.name}</h1>
                        </div>
                        <p className="text-slate-500 font-medium pl-14">{project.description || "No description provided for this project."}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Manager</p>
                        <p className="text-sm font-black text-slate-900">
                            {project.projectManager ? `${project.projectManager.personalDetails.firstName} ${project.projectManager.personalDetails.lastName}` : "Unassigned"}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                        <Users className="w-5 h-5 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Task Progress" 
                    value={`${stats.overallProgress}%`} 
                    icon={<Target className="w-5 h-5 text-indigo-600" />} 
                    subtext={`${stats.completedTasks} / ${stats.totalTasks} Completed`}
                    accent="indigo"
                />
                <StatCard 
                    label="Resource Utilization" 
                    value={`${stats.totalLoggedHours} Hrs`} 
                    icon={<Clock className="w-5 h-5 text-emerald-600" />} 
                    subtext={`Estimated: ${stats.totalEstimatedHours} Hrs`}
                    accent="emerald"
                />
                <StatCard 
                    label="Team Size" 
                    value={project.members?.length || 0} 
                    icon={<Users className="w-5 h-5 text-blue-600" />} 
                    subtext="Active members"
                    accent="blue"
                />
                <StatCard 
                    label="Project Health" 
                    value={project.status || "N/A"} 
                    icon={<Zap className="w-5 h-5 text-amber-600" />} 
                    subtext="Updated just now"
                    accent="amber"
                />
            </div>

            {/* Main Content: Tracking Details */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Side: Tasks & Milestones */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <LayoutDashboard className="w-6 h-6 text-indigo-600" />
                                Operational Tracking
                            </h3>
                            <button className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">View All Tasks</button>
                        </div>

                        {/* Progress Visualization */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                                    <span>Completion Threshold</span>
                                    <span>{stats.overallProgress}%</span>
                                </div>
                                <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${stats.overallProgress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 py-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pending</p>
                                    <p className="text-2xl font-black text-slate-800">{stats.pendingTasks}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">In Progress</p>
                                    <p className="text-2xl font-black text-slate-800">{stats.inProgressTasks}</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 text-center">Done</p>
                                    <p className="text-2xl font-black text-emerald-700 text-center">{stats.completedTasks}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Member Contributions Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200">
                         <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                            Workload Distribution
                        </h3>
                        <div className="space-y-6">
                            {stats.memberAggregation?.length > 0 ? (
                                stats.memberAggregation.map((m, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                            {m.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-black text-slate-700">{m.name}</span>
                                                <span className="text-xs font-bold text-slate-400">{m.hours} Hrs logged</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                                    style={{ width: `${Math.min((m.hours / (stats.totalLoggedHours || 1)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-10 text-slate-400 italic text-sm">No hours logged yet for this project.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Sidebar Info */}
                <div className="space-y-8">
                    {/* Project Metadata */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Project Details</h4>
                        <div className="space-y-6">
                             <DetailItem label="Start Date" value={project.startDate ? format(new Date(project.startDate), 'MMM dd, yyyy') : "Not set"} />
                             <DetailItem label="Estimated End" value={project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : "Not set"} />
                             <DetailItem label="Budget Allocation" value={`$${project.budget?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) || '0'}`} />
                             <DetailItem label="Priority Level" value="High Influence" />
                        </div>
                    </div>

                    {/* Team Members List */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200">
                         <h4 className="text-lg font-black text-slate-900 mb-6 underline decoration-indigo-500 underline-offset-8">Project Team</h4>
                         <div className="space-y-4">
                             {project.members?.map((m, i) => (
                                 <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                                             {m.personalDetails.firstName.charAt(0)}
                                         </div>
                                         <span className="text-sm font-bold text-slate-700">{m.personalDetails.firstName} {m.personalDetails.lastName}</span>
                                     </div>
                                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter italic">Member</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon, subtext, accent }) => {
    const accents = {
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100'
    };
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 space-y-4 transition-transform hover:-translate-y-1 duration-300 group">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${accents[accent]} group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</span>
                </div>
            </div>
            <div className="h-px bg-slate-50"></div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{subtext}</p>
        </div>
    );
};

const DetailItem = ({ label, value }) => (
    <div className="space-y-1">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-sm font-bold tracking-tight">{value}</p>
    </div>
);

export default ProjectDashboard;
