"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users, Search, Plus, Filter,
    MoreHorizontal, MapPin, Building2,
    Calendar, Mail, Phone, Briefcase,
    ChevronRight, ArrowRight, Loader2,
    CheckCircle2, Clock, XCircle,
    AlertCircle, Download, ExternalLink,
    FilterX, MoreVertical, GripVertical,
    Star, MessageSquare, Paperclip,
    LayoutGrid, List as ListIcon,
    ArrowUpRight, RefreshCw, Layers, Video
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

const STAGES = [
    { id: 'Applied', label: 'Inbound', bg: 'bg-blue-50', dot: 'bg-blue-500', text: 'text-blue-700', iconBg: 'bg-blue-500/10', icon: Layers },
    { id: 'Screening', label: 'Screening', bg: 'bg-purple-50', dot: 'bg-purple-500', text: 'text-purple-700', iconBg: 'bg-purple-500/10', icon: Filter },
    { id: 'Interviewing', label: 'Interviewing', bg: 'bg-indigo-50', dot: 'bg-indigo-500', text: 'text-indigo-700', iconBg: 'bg-indigo-500/10', icon: Briefcase },
    { id: 'Offer Sent', label: 'Offered', bg: 'bg-rose-50', dot: 'bg-rose-500', text: 'text-rose-700', iconBg: 'bg-rose-500/10', icon: Paperclip },
    { id: 'Hired', label: 'Hired', bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700', iconBg: 'bg-emerald-500/10', icon: CheckCircle2 },
    { id: 'Rejected', label: 'Archived', bg: 'bg-slate-50', dot: 'bg-slate-500', text: 'text-slate-700', iconBg: 'bg-slate-500/10', icon: XCircle }
];

function HeartIcon({ className }) {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
    );
}

export default function ATSSystem() {
    const [jobs, setJobs] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [draggedCandidate, setDraggedCandidate] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [view, setView] = useState("board"); // 'board' or 'list'
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [schedulingCandidate, setSchedulingCandidate] = useState(null);
    const [interviewers, setInterviewers] = useState([]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [jobsRes, pipelineRes, interviewersRes] = await Promise.all([
                fetch('/api/v1/admin/recruitment/jobs'),
                fetch('/api/v1/admin/recruitment/pipeline'),
                fetch('/api/v1/admin/recruitment/interviews') // Reusing this to get interviewers
            ]);

            const jobsData = await jobsRes.json();
            const pipelineData = await pipelineRes.json();
            const intData = await interviewersRes.json();

            setJobs(jobsData.jobs || []);
            setCandidates(pipelineData.candidates || []);
            setInterviewers(intData.interviewers || []);
        } catch (error) {
            console.error("Error fetching ATS data:", error);
            toast.error("Failed to load pipeline stats");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        setIsRefreshing(false);
        toast.success("Pipeline Synchronized");
    };

    const updateCandidateStatus = async (candidateId, newStatus) => {
        try {
            // Optimistic update
            const oldCandidates = [...candidates];
            setCandidates(prev => prev.map(c =>
                c._id === candidateId ? { ...c, status: newStatus } : c
            ));

            const res = await fetch('/api/v1/admin/recruitment/candidates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: candidateId, status: newStatus })
            });

            if (!res.ok) {
                setCandidates(oldCandidates);
                throw new Error("Failed to update status");
            }
            const data = await res.json();
            toast.success(data.message || "Candidate status updated");
        } catch (error) {
            toast.error("Update failed. Please retry.");
        }
    };

    const filteredCandidates = candidates.filter(c => {
        const matchesJob = selectedJob === "all" || (c.jobRequisition?._id || c.jobRequisition) === selectedJob;
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesJob && matchesSearch;
    });

    const getCandidatesByStage = (stageId) => {
        return filteredCandidates.filter(c => c.status === stageId);
    };

    if (loading && !isRefreshing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
                <div className="relative group">
                    <div className="w-20 h-20 border-[6px] border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                        <Layers className="w-8 h-8 animate-pulse" />
                    </div>
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Syncing Recruitment Pipeline</h3>
                    <p className="text-slate-400 text-sm mt-1 font-medium italic">Handshaking with database clusters...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-10 space-y-12 animate-in fade-in duration-1000">
            {/* Ultra Premium Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-600 text-white p-1 rounded-lg">
                            <Layers className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Smart ATS Engine</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Hiring Pipeline
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-xs px-2 py-0.5 rounded-md font-bold">
                            Live {filteredCandidates.length} Candidates
                        </Badge>
                    </h1>

                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white rounded-2xl p-1 border border-slate-200 mr-2">
                        <button
                            onClick={() => setView('board')}
                            className={`p-2 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${view === 'board' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" /> Board
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`p-2 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ListIcon className="w-3.5 h-3.5" /> List
                        </button>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        className="bg-white hover:bg-slate-50 h-12 rounded-2xl border-slate-200 text-slate-700 font-bold px-5 active:scale-95 transition-all"
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2 text-indigo-500" />}
                        Refresh Board
                    </Button>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl text-white px-6 font-black group transition-all"
                    >
                        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        Acquire Talent
                    </Button>
                </div>
            </div>

            {/* Smart Search & Global Filters */}
            <div className="relative flex items-center group w-full">
                <div className="absolute left-5 z-10 pointer-events-none">
                    <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <Input
                    placeholder="Search resumes, names or contact tags..."
                    className="pl-14 h-14 w-full rounded-2xl border-slate-200 focus:ring-[6px] focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-base font-medium placeholder:text-slate-400 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-5 flex items-center gap-2 pointer-events-none">
                    <kbd className="hidden md:inline-flex h-6 select-none items-center gap-1 rounded-lg border bg-slate-50 px-2 font-mono text-[10px] font-bold text-slate-400">
                        CTRL + K
                    </kbd>
                </div>
            </div>

            {/* Pipeline Canvas */}
            <div className="relative pt-10 overflow-x-auto pb-12 -mx-6 px-6 no-scrollbar">
                {/* Active View Content */}
                {view === 'board' ? (
                    <div className="flex gap-6 overflow-x-auto pb-8 min-h-[700px] -mx-4 px-4 scrollbar-hide">
                        {STAGES.map((stage) => (
                            <div key={stage.id} className="w-[340px] shrink-0 group/col">
                                {/* Proportional Column Header */}
                                <div className="flex items-center justify-between mb-8 px-3 py-2 bg-white/40 backdrop-blur-sm rounded-2xl border border-transparent group-hover/col:border-slate-200 group-hover/col:bg-white transition-all duration-500 group-hover/col:">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stage.bg} ${stage.text} overflow-hidden relative`}>
                                            <stage.icon className="w-5 h-5 shrink-0" />
                                            <div className={`absolute inset-0 ${stage.iconBg} animate-pulse`}></div>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.15em] leading-none mb-1">{stage.label}</h3>
                                            <span className="text-[10px] text-slate-400 font-bold">{getCandidatesByStage(stage.id).length} Active Applicants</span>
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Drop Zone with Enhanced Styling */}
                                <div
                                    className={`min-h-[600px] flex flex-col gap-4 p-4 rounded-[32px] transition-all duration-500 ${draggedCandidate && draggedCandidate.status !== stage.id
                                        ? "bg-indigo-50/50 ring-4 ring-indigo-500/20 scale-[1.02] border-2 border-dashed border-indigo-400 backdrop-blur-2xl"
                                        : "bg-slate-100/50 hover:bg-slate-100/80 border-2 border-transparent backdrop-blur-2xl"
                                        }`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => {
                                        if (draggedCandidate && draggedCandidate.status !== stage.id) {
                                            updateCandidateStatus(draggedCandidate._id, stage.id);
                                            setDraggedCandidate(null);
                                        }
                                    }}
                                >
                                    <AnimatePresence mode="popLayout">
                                        {getCandidatesByStage(stage.id).map((candidate) => (
                                            <CandidateCard
                                                key={candidate._id}
                                                candidate={candidate}
                                                onDragStart={() => setDraggedCandidate(candidate)}
                                                onDragEnd={() => setDraggedCandidate(null)}
                                                isSelected={draggedCandidate?._id === candidate._id}
                                                onStatusUpdate={updateCandidateStatus}
                                                onSchedule={(cand) => {
                                                    setSchedulingCandidate(cand);
                                                    setShowScheduleModal(true);
                                                }}
                                            />
                                        ))}
                                    </AnimatePresence>

                                    {getCandidatesByStage(stage.id).length === 0 && (
                                        <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/30 backdrop-blur-[2px] opacity-60 hover:opacity-100 transition-opacity">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-3">
                                                <div className="w-5 h-5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
                                                    <Plus className="w-3 h-3 text-slate-400" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empty Stage</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <ListView candidates={filteredCandidates} onStatusUpdate={updateCandidateStatus} />
                )}
            </div>

            {/* Modals & Overlays */}
            <AnimatePresence>
                {showAddModal && (
                    <AddCandidateModal
                        jobs={jobs}
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Inline Interview Scheduler Modal */}
            <AnimatePresence>
                {showScheduleModal && schedulingCandidate && (
                    <ScheduleModal
                        onClose={() => setShowScheduleModal(false)}
                        candidate={schedulingCandidate}
                        interviewers={interviewers}
                        onSuccess={() => {
                            setShowScheduleModal(false);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function CandidateCard({ candidate, onDragStart, onDragEnd, isSelected, onStatusUpdate, onSchedule }) {
    const [isHovered, setIsHovered] = useState(false);

    const currentStageIndex = STAGES.findIndex(s => s.id === candidate.status);
    const nextStage = STAGES[currentStageIndex + 1];
    const isRejected = candidate.status === 'Rejected';
    const isHired = candidate.status === 'Hired';

    const upcomingInterview = candidate.interviews?.find(i =>
        i.status === 'Scheduled' && new Date(i.date) > new Date()
    );

    const handlePromote = (e) => {
        e.stopPropagation();
        if (nextStage && !isHired) {
            onStatusUpdate(candidate._id, nextStage.id);
        }
    };

    const handleReject = (e) => {
        e.stopPropagation();
        onStatusUpdate(candidate._id, 'Rejected');
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
            whileHover={{ y: -8, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
            draggable={!isHovered}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={`cursor-grab active:cursor-grabbing h-full ${isSelected ? "opacity-30 blur-[2px]" : ""}`}
        >
            <Card
                className={`group border-none(17,17,26,0.05) transition-all duration-500 bg-white rounded-[32px] overflow-hidden relative border border-slate-200 flex flex-col min-h-[380px] ${isRejected ? 'opacity-85 grayscale-[0.2]' : 'hover:border-slate-200/50'}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-500 ${isRejected ? 'bg-slate-300' : 'bg-transparent group-hover:bg-indigo-600'}`}></div>

                <CardContent className="pt-12 pb-8 px-8 space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-6">
                        {/* Header Section */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-slate-900 text-xl tracking-tight leading-tight group-hover:text-indigo-600 transition-colors truncate">
                                    {candidate.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isRejected ? 'bg-slate-400' : 'bg-emerald-500'}`}></span>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                                        {(candidate.appliedRole || candidate.jobRequisition?.title || "Product Designer")}
                                    </p>
                                </div>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 transition-all duration-500 border ${isRejected ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-200 group-hover:bg-indigo-600 group-hover:border-indigo-600 '}`}>
                                <span className={`text-base font-black tracking-tighter uppercase ${isRejected ? 'text-slate-400' : 'text-slate-400 group-hover:text-white'}`}>{candidate.name.charAt(0)}</span>
                            </div>
                        </div>
                        {/* AI Fit Score Badge & On Hold */}
                        <div className="flex items-center gap-2">
                            {candidate.fitScore != null && (
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black ${candidate.fitScore >= 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : candidate.fitScore >= 60 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                    🤖 {candidate.fitScore}% Match
                                </div>
                            )}
                            {candidate.isOnHold && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                    ⏸️ On Hold
                                </div>
                            )}
                        </div>

                        {/* Info Grid */}
                        <div className="space-y-3 bg-slate-50/30 p-5 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-indigo-50 transition-all duration-500">
                            <div className="flex items-center text-slate-500 text-xs font-bold gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-200">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <span className="truncate">{candidate.email}</span>
                            </div>
                            <div className="flex items-center text-slate-500 text-xs font-bold gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-200">
                                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <span className="truncate uppercase tracking-wider text-[9px] font-black">Source: {candidate.source}</span>
                            </div>
                        </div>

                        {/* Status Footer */}
                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                                <Badge className="text-[9px] font-black tracking-widest bg-white text-slate-500 rounded-lg px-3 py-1.5 border border-slate-200 uppercase">
                                    {format(new Date(candidate.appliedDate), "MMM dd")}
                                </Badge>
                                {upcomingInterview && (
                                    <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100/30 animate-pulse">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-tight">{format(new Date(upcomingInterview.date), "HH:mm")}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-300">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span className="text-xs font-black tracking-tighter">{candidate.interviews?.length || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions on Hover */}
                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: 15 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: 15 }}
                                className="pt-4 flex gap-2"
                            >
                                {nextStage && !isHired && (
                                    <Button
                                        onClick={handlePromote}
                                        className="h-12 flex-1 text-[11px] font-black uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 border-none rounded-2xl px-2"
                                    >
                                        <ArrowRight className="w-4 h-4 mr-1" /> Promote
                                    </Button>
                                )}
                                {!isRejected && !isHired && (
                                    <Button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const newHoldStatus = !candidate.isOnHold;
                                            try {
                                                const res = await fetch(`/api/v1/admin/recruitment/candidates`, {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ id: candidate._id, isOnHold: newHoldStatus })
                                                });
                                                if(res.ok) {
                                                    window.location.reload();
                                                }
                                            } catch (err) {}
                                        }}
                                        variant="outline"
                                        className="h-12 flex-1 text-[11px] font-black uppercase tracking-wider bg-white text-slate-700 hover:bg-slate-50 border-slate-200 rounded-2xl px-2"
                                    >
                                        {candidate.isOnHold ? "Resume" : "Hold"}
                                    </Button>
                                )}
                                {!isRejected && !isHired && (
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSchedule(candidate);
                                        }}
                                        variant="ghost"
                                        className="h-12 flex-1 text-[11px] font-black uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 border-none rounded-2xl"
                                    >
                                        <Calendar className="w-4 h-4 mr-1.5" /> Schedule
                                    </Button>
                                )}
                                {!isRejected && (
                                    <Button
                                        onClick={handleReject}
                                        variant="ghost"
                                        className="h-12 w-12 shrink-0 text-rose-600 bg-rose-50 hover:bg-rose-100 border-none rounded-2xl"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </Button>
                                )}
                                {isRejected && (
                                    <Button
                                        onClick={() => onStatusUpdate(candidate._id, 'Applied')}
                                        className="h-12 flex-1 text-[11px] font-black uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 border-none rounded-2xl"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-1.5" /> Restore
                                    </Button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function AddCandidateModal({ jobs, onClose, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        appliedRole: '',
        source: 'Website',
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            toast.error("Required fields missing");
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch('/api/v1/admin/recruitment/candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    appliedDate: new Date().toISOString(),
                    status: 'Applied'
                })
            });

            if (!res.ok) throw new Error("Failed to create talent profile");
            toast.success("Talent Profile Generated Successfully!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-[8px]"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="bg-white rounded-[40px] w-full max-w-2xl border border-white/20 overflow-hidden relative z-10 p-10"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white">
                            <Users className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Acquire Talent</h2>
                            <p className="text-slate-400 text-sm font-medium mt-1">Manual intake for external talent sourcing</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hidden md:flex p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 text-2xl group">
                        <XCircle className="w-8 h-8 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Applicant Full Name</label>
                        <Input
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Robert Smith"
                            className="h-16 rounded-2xl border-slate-200 text-lg font-bold px-6 focus:ring-[8px] focus:ring-indigo-500/10 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Email Infrastructure</label>
                        <Input
                            required
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="robert@cloud.com"
                            className="h-14 rounded-2xl border-slate-200 font-bold px-6"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Direct Contact</label>
                        <Input
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className="h-14 rounded-2xl border-slate-200 font-bold px-6"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Target Role/Position</label>
                        <Input
                            required
                            value={formData.appliedRole}
                            onChange={e => setFormData({ ...formData, appliedRole: e.target.value })}
                            placeholder="e.g. Senior Frontend Developer"
                            className="h-14 rounded-2xl border-slate-200 font-bold px-6 focus:ring-[8px] focus:ring-indigo-500/10 transition-all"
                        />
                    </div>

                    <div className="md:col-span-2 flex gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-16 rounded-[24px] border-slate-200 text-slate-600 font-black uppercase tracking-widest text-xs"
                        >
                            Abort
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 h-16 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Authorize Profile Creation"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function ListView({ candidates, onStatusUpdate }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] border border-slate-200 overflow-hidden"
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Target Role</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Current Stage</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Applied Date</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {candidates.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                                            <Search className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="font-bold text-slate-400">No candidates matching your search criteria</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            candidates.map((candidate) => {
                                const stage = STAGES.find(s => s.id === candidate.status);
                                return (
                                    <motion.tr
                                        key={candidate._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-xs">
                                                    {candidate.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm leading-none mb-1 group-hover:text-indigo-600 transition-colors">{candidate.name}</p>
                                                    <p className="text-[11px] font-medium text-slate-400">{candidate.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-600">
                                                {candidate.appliedRole || candidate.jobRequisition?.title || "Manual Entry"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                <Badge variant="outline" className={`${stage?.bg} ${stage?.text} border-none rounded-lg font-black text-[10px] tracking-tight`}>
                                                    {stage?.label}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-400">
                                                {candidate.appliedDate ? format(new Date(candidate.appliedDate), "MMM dd, yyyy") : "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2.5 rounded-xl text-slate-400 hover:bg-white hover:text-indigo-600 transition-all">
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

function ScheduleModal({ onClose, candidate, interviewers, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        round: 'Interviewing',
        interviewer: '',
        date: '',
        meetingLink: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.date || !formData.interviewer) {
            toast.error("Interviewer and Date are required");
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch('/api/v1/admin/recruitment/interviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: candidate._id,
                    interview: {
                        ...formData,
                        status: 'Scheduled'
                    }
                })
            });

            if (!res.ok) throw new Error("Sync failed");
            toast.success("Interview Round Synchronized!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden relative z-10 p-10"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Book Interview</h2>
                        <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">{candidate.name}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Round Type</label>
                        <Select onValueChange={val => setFormData({ ...formData, round: val })} defaultValue={formData.round}>
                            <SelectTrigger className="h-14 rounded-2xl border-slate-100 font-bold px-6 bg-slate-50/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {['Screening', 'Interviewing'].map(round => (
                                    <SelectItem key={round} value={round}>{round}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Interviewer</label>
                        <Select onValueChange={val => setFormData({ ...formData, interviewer: val })}>
                            <SelectTrigger className="h-14 rounded-2xl border-slate-100 font-bold px-6 bg-slate-50/50">
                                <SelectValue placeholder="Identify panel member..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {interviewers.map(i => (
                                    <SelectItem key={i._id} value={i._id} className="rounded-xl">
                                        {i.name} ({i.designation})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</label>
                            <Input
                                type="datetime-local"
                                className="h-14 rounded-2xl border-slate-100 font-bold px-6 bg-slate-50/50"
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting Link</label>
                            <Input
                                placeholder="Zoom/Meet URL"
                                className="h-14 rounded-2xl border-slate-200 focus:border-indigo-500 font-bold px-6 bg-slate-50/50"
                                onChange={e => setFormData({ ...formData, meetingLink: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="flex-2 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] flex-[2]"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize Schedule"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

