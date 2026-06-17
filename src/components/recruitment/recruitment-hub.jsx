"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Briefcase, Users, UserPlus, FileCheck,
    Search, Plus, Filter, MoreVertical,
    Clock, MapPin, Building2, TrendingUp,
    ChevronRight, ArrowUpRight, Loader2,
    Calendar, CheckCircle2, XCircle, AlertCircle,
    Layers, Star, Target, Sparkles, Bot, Upload,
    BarChart3, Gauge, FileText, Brain, Share2, Linkedin, Link, Rss, Mail,
    Edit, Trash2, PauseCircle, PlayCircle, Copy, Eye
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function RecruitmentHub() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("jobs");
    const [jobs, setJobs] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showJobModal, setShowJobModal] = useState(false);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerModalData, setOfferModalData] = useState(null); // For pre-filling from candidate pipeline
    const [pipelineFilter, setPipelineFilter] = useState(null); // { jobId, jobTitle }
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [showSyndicateModal, setShowSyndicateModal] = useState(false);
    const [syndicateJobData, setSyndicateJobData] = useState(null);
    const [editJobData, setEditJobData] = useState(null);
    const [stats, setStats] = useState({
        totalJobs: 0,
        activePositions: 0,
        totalCandidates: 0,
        hiresThisMonth: 0
    });

    useEffect(() => {
        fetchRecruitmentData();
    }, []);

    const fetchRecruitmentData = async () => {
        try {
            setLoading(true);
            const [jobsRes, candidatesRes] = await Promise.all([
                fetch('/api/v1/admin/recruitment/jobs'),
                fetch('/api/v1/admin/recruitment/candidates')
            ]);

            const jobsData = await jobsRes.json();
            const candidatesData = await candidatesRes.json();

            setJobs(jobsData.jobs || []);
            setCandidates(candidatesData.candidates || []);

            // Calculate basic stats
            setStats({
                totalJobs: jobsData.jobs?.length || 0,
                activePositions: jobsData.jobs?.filter(j => j.status === 'Open').length || 0,
                totalCandidates: candidatesData.candidates?.length || 0,
                hiresThisMonth: candidatesData.candidates?.filter(c => c.status === 'Hired').length || 0
            });
        } catch (error) {
            toast.error("Failed to load recruitment data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Assembling recruitment data...</p>
            </div>
        );
    }

    return (
        <div className="p-10 space-y-12 animate-in fade-in duration-1000">
            {/* Ultra-Premium Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                <div className="space-y-5">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600">Enterprise Talent Acquisition</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                        Recruitment <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">Intelligence.</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-xl leading-relaxed">
                        Orchestrate your global talent pipeline with precision metrics and automated workflow synchronization.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/recruitment/ats')}
                        className="bg-white border-2 border-slate-200 text-slate-900 px-8 h-18 rounded-[28px] text-[13px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center gap-3 group"
                    >
                        <Users className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" /> ATS Board
                    </button>
                    <button
                        onClick={() => router.push('/admin/recruitment/interviews')}
                        className="bg-white border-2 border-slate-200 text-slate-900 px-8 h-18 rounded-[28px] text-[13px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center gap-3 group"
                    >
                        <Calendar className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" /> Interviews
                    </button>
                    <button
                        onClick={() => setShowJobModal(true)}
                        className="bg-slate-900 text-white px-10 h-18 rounded-[28px] text-[13px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 group"
                    >
                        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" /> Create Opening
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: "Pipeline Depth", value: stats.totalJobs, icon: Briefcase, color: "indigo", bg: "bg-indigo-50", text: "text-indigo-600" },
                    { label: "Active Channels", value: stats.activePositions, icon: Target, color: "emerald", bg: "bg-emerald-50", text: "text-emerald-600" },
                    { label: "Funnel Velocity", value: stats.totalCandidates, icon: Users, color: "blue", bg: "bg-blue-50", text: "text-blue-600" },
                    { label: "Conversion Rate", value: stats.hiresThisMonth, icon: Star, color: "purple", bg: "bg-purple-50", text: "text-purple-600" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-10 rounded-[48px] border  group transition-all duration-700 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-40 h-40 ${stat.bg} opacity-30 rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-1000`}></div>
                        <div className="relative z-10 flex flex-col gap-6">
                            <div className={`w-16 h-16 ${stat.bg} rounded-[24px] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700`}>
                                <stat.icon className={`w-8 h-8 ${stat.text} group-hover:text-white transition-colors duration-700`} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.25em]">{stat.label}</p>
                                <h3 className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Navigation Tabs */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50/50">
                    {[
                        { id: "jobs", label: "Job Board", icon: Briefcase },
                        { id: "candidates", label: "Candidate Pipeline", icon: Users },
                        { id: "offers", label: "Offer Management", icon: FileCheck },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === tab.id
                                ? "bg-white text-indigo-600 ring-1 ring-slate-200"
                                : "text-slate-500 hover:bg-white hover:text-indigo-600"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {activeTab === "jobs" && (
                        <JobBoard
                            jobs={jobs}
                            onRefresh={fetchRecruitmentData}
                            onViewPipeline={(jobId, jobTitle) => {
                                setPipelineFilter({ jobId, jobTitle });
                                setActiveTab("candidates");
                            }}
                            onSyndicate={(job) => {
                                setSyndicateJobData(job);
                                setShowSyndicateModal(true);
                            }}
                            onEditJob={(job) => setEditJobData(job)}
                        />
                    )}
                    {activeTab === "candidates" && (
                        <CandidatePipeline
                            candidates={pipelineFilter
                                ? candidates.filter(c => c.jobRequisition?._id === pipelineFilter.jobId)
                                : candidates
                            }
                            activeFilter={pipelineFilter}
                            onClearFilter={() => setPipelineFilter(null)}
                            onRefresh={fetchRecruitmentData}
                            onSelectCandidate={(c) => setSelectedCandidate(c)}
                        />
                    )}
                    {activeTab === "offers" && (
                        <OfferManagement
                            onRefresh={fetchRecruitmentData}
                            onCreateOffer={() => {
                                setOfferModalData(null);
                                setShowOfferModal(true);
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Modals will be added here */}
            {showJobModal && (
                <JobRequisitionModal
                    onClose={() => setShowJobModal(false)}
                    onSuccess={() => {
                        setShowJobModal(false);
                        fetchRecruitmentData();
                    }}
                />
            )}

            {showCandidateModal && (
                <AddCandidateModal
                    jobs={jobs}
                    onClose={() => setShowCandidateModal(false)}
                    onSuccess={() => {
                        setShowCandidateModal(false);
                        fetchRecruitmentData();
                    }}
                />
            )}

            {showOfferModal && (
                <CreateOfferModal
                    candidates={candidates}
                    initialData={offerModalData}
                    onClose={() => setShowOfferModal(false)}
                    onSuccess={() => {
                        setShowOfferModal(false);
                        fetchRecruitmentData(); // Refresh to see new offer
                    }}
                />
            )}

            {selectedCandidate && (
                <CandidateDetailModal
                    candidate={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    onRefresh={() => {
                        setSelectedCandidate(null);
                        fetchRecruitmentData();
                    }}
                    onGenerateOffer={(candidate) => {
                        setSelectedCandidate(null);
                        setOfferModalData({ candidateId: candidate._id, name: candidate.name, jobTitle: candidate.jobRequisition?.title });
                        setShowOfferModal(true);
                        setActiveTab("offers");
                    }}
                />
            )}

            {showSyndicateModal && syndicateJobData && (
                <SyndicateModal
                    job={syndicateJobData}
                    onClose={() => {
                        setShowSyndicateModal(false);
                        setSyndicateJobData(null);
                    }}
                />
            )}

            {editJobData && (
                <EditJobModal
                    job={editJobData}
                    onClose={() => setEditJobData(null)}
                    onSuccess={() => {
                        setEditJobData(null);
                        fetchRecruitmentData();
                    }}
                />
            )}
        </div>
    );
}

function JobBoard({ jobs, onRefresh, onViewPipeline, onSyndicate, onEditJob }) {
    const [openMenuId, setOpenMenuId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        if (openMenuId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openMenuId]);

    if (jobs.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold">No active job requisitions found.</p>
                <p className="text-slate-400 text-xs mt-1 italic">Click 'Create Requisition' to start hiring.</p>
            </div>
        );
    }

    const handleApproveJob = async (jobId) => {
        try {
            const res = await fetch(`/api/v1/admin/recruitment/jobs`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, status: 'Open' })
            });
            if (res.ok) {
                onRefresh();
            }
        } catch (e) {
            console.error('Failed to approve job');
        }
    };

    const handleStatusToggle = async (job) => {
        const newStatus = job.status === 'Open' ? 'Closed' : 'Open';
        try {
            const res = await fetch('/api/v1/admin/recruitment/jobs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: job._id, status: newStatus })
            });
            if (res.ok) {
                toast.success(`Job ${newStatus === 'Closed' ? 'closed' : 'reopened'} successfully`);
                onRefresh();
            }
        } catch (e) {
            toast.error('Failed to update job status');
        }
    };

    const handleDuplicate = async (job) => {
        try {
            const res = await fetch('/api/v1/admin/recruitment/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `${job.title} (Copy)`,
                    department: job.department,
                    location: job.location,
                    type: job.type,
                    priority: job.priority,
                    workplaceType: job.workplaceType || 'On-site',
                    experienceLevel: job.experienceLevel || 'Mid',
                    headcount: job.headcount || 1,
                    description: job.description || 'Duplicated job opening',
                    requirements: job.requirements || [],
                    salaryRange: job.salaryRange || {},
                    hiringManagerName: job.hiringManagerName || ''
                })
            });
            if (res.ok) {
                toast.success('Job duplicated successfully!');
                onRefresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to duplicate job');
            }
        } catch (e) {
            toast.error('Failed to duplicate job');
        }
    };

    const handleDelete = async (jobId) => {
        try {
            setDeleting(true);
            const res = await fetch(`/api/v1/admin/recruitment/jobs?id=${jobId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Job deleted successfully');
                setConfirmDeleteId(null);
                onRefresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete job');
            }
        } catch (e) {
            toast.error('Failed to delete job');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
                <div key={job._id} className="p-6 bg-white border border-slate-200 rounded-3xl transition-all group border-l-4 border-l-indigo-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                                job.status === 'Open' ? 'bg-emerald-50 text-emerald-600' :
                                job.status === 'Pending Approval' ? 'bg-amber-50 text-amber-600' :
                                job.status === 'Closed' ? 'bg-rose-50 text-rose-600' :
                                'bg-slate-100 text-slate-500'
                            }`}>
                                {job.status}
                            </span>
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                                <Users className="w-3 h-3" /> {job.headcount || 1} Openings
                            </span>
                            {job.status === 'Pending Approval' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleApproveJob(job._id); }}
                                    className="px-3 py-1 bg-indigo-600 outline-none focus:ring focus:ring-indigo-200 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                                >
                                    Approve & Publish
                                </button>
                            )}
                            <h4 className="text-lg font-black text-slate-900 mt-1 w-full">{job.title}</h4>
                        </div>
                        {/* Three-dot menu */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === job._id ? null : job._id);
                                }}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                            {openMenuId === job._id && (
                                <div
                                    className="absolute right-0 top-10 w-52 bg-white rounded-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => { setOpenMenuId(null); onEditJob(job); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" /> Edit Opening
                                    </button>
                                    <button
                                        onClick={() => { setOpenMenuId(null); onViewPipeline(job._id, job.title); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" /> View Pipeline
                                    </button>
                                    {job.status === 'Open' && (
                                        <button
                                            onClick={() => { setOpenMenuId(null); onSyndicate(job); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-3 transition-colors"
                                        >
                                            <Share2 className="w-4 h-4" /> Syndicate & Share
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setOpenMenuId(null); handleDuplicate(job); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
                                    >
                                        <Copy className="w-4 h-4" /> Duplicate
                                    </button>
                                    <button
                                        onClick={() => { setOpenMenuId(null); handleStatusToggle(job); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-3 transition-colors"
                                    >
                                        {job.status === 'Open' ? (
                                            <><PauseCircle className="w-4 h-4" /> Close Opening</>
                                        ) : (
                                            <><PlayCircle className="w-4 h-4" /> Reopen Opening</>
                                        )}
                                    </button>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                        onClick={() => { setOpenMenuId(null); setConfirmDeleteId(job._id); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete Opening
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500" /> {job.department}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {job.location}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" /> {job.type}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <AlertCircle className={`w-3.5 h-3.5 ${job.priority === 'Urgent' ? 'text-rose-500' : 'text-amber-500'
                                }`} /> {job.priority} Priority
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Applicant" className="w-full h-full object-cover" />
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 italic">+5</div>
                        </div>
                        <div className="flex items-center gap-4">
                            {job.status === 'Open' && (
                                <button
                                    onClick={() => onSyndicate(job)}
                                    className="text-[10px] font-black text-emerald-600 hover:underline uppercase tracking-widest flex items-center gap-1"
                                >
                                    <Share2 className="w-3 h-3" /> Syndicate & Share
                                </button>
                            )}
                            <button
                                onClick={() => onViewPipeline(job._id, job.title)}
                                className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest flex items-center gap-1"
                            >
                                Review Pipeline <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-3xl w-full max-w-sm border border-slate-200 overflow-hidden p-8 text-center">
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-7 h-7 text-rose-500" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Delete This Opening?</h3>
                    <p className="text-sm text-slate-500 mb-6">This action is permanent and cannot be undone. All candidate associations with this job will be lost.</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleDelete(confirmDeleteId)}
                            disabled={deleting}
                            className="flex-1 py-3 px-4 bg-rose-600 text-white rounded-2xl text-xs font-black hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                        >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

function CandidatePipeline({ candidates, onRefresh, onSelectCandidate, activeFilter, onClearFilter }) {
    // Stage-wise grouping
    const stages = [
        "Applied", "Screening", "Technical Interview", "Managerial Interview", "HR Interview", "Offer Sent"
    ];

    if (candidates.length === 0 && !activeFilter) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-bold">No candidates tracked yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        placeholder="Search by name, email, or skill..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all"><Filter className="w-4 h-4" /></button>
                </div>
            </div>

            {activeFilter && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex justify-between items-center animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-indigo-600 font-black uppercase tracking-wider">Filtered by Position</p>
                            <p className="text-sm font-bold text-indigo-900">{activeFilter.jobTitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClearFilter}
                        className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                    >
                        <XCircle className="w-3.5 h-3.5" /> Clear Filter
                    </button>
                </div>
            )}

            <div className="overflow-x-auto pb-4">
                <table className="w-full">
                    <thead>
                        <tr className="text-left border-b border-slate-100">
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Candidate</th>
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Position</th>
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Status</th>
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">AI Score</th>
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Applied</th>
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {candidates.map((cand) => (
                            <tr key={cand._id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center font-black text-indigo-600 text-sm">
                                            {cand.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{cand.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{cand.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <p className="text-xs font-bold text-slate-700">{cand.jobRequisition?.title || "Unknown Position"}</p>
                                    <p className="text-[10px] text-slate-400">{cand.jobRequisition?.department}</p>
                                </td>
                                <td className="py-4 px-4">
                                    <span className="px-2 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] font-black text-indigo-600 uppercase">
                                        {cand.status}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    {cand.fitScore != null ? (
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${cand.fitScore >= 80 ? 'bg-emerald-50 text-emerald-600' : cand.fitScore >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {cand.fitScore}%
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-slate-300 italic">—</span>
                                    )}
                                </td>
                                <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                                    {format(new Date(cand.appliedDate), 'MMM dd, yyyy')}
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <button
                                        onClick={() => onSelectCandidate(cand)}
                                        className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-200"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AddCandidateModal({ jobs, onClose, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        jobRequisition: '',
        source: 'Website',
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await fetch('/api/v1/admin/recruitment/candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to add candidate");
            toast.success("Candidate added to pipeline!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl w-full max-w-xl border border-slate-200 overflow-hidden scale-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-900">Add New Candidate</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Full Name</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email</label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                                placeholder="john@example.com"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone</label>
                            <input
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                                placeholder="+91 9876543210"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Applied For</label>
                            <select
                                required
                                value={formData.jobRequisition}
                                onChange={e => setFormData({ ...formData, jobRequisition: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            >
                                <option value="">Select Position</option>
                                {jobs.map(j => <option key={j._id} value={j._id}>{j.title} ({j.department})</option>)}
                            </select>
                        </div>
                    </div>
                </form>
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !formData.jobRequisition}
                        className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Candidate"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CandidateDetailModal({ candidate, onClose, onRefresh, onGenerateOffer }) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [scoringAI, setScoringAI] = useState(false);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [aiQuestions, setAiQuestions] = useState(null);
    const [showResume, setShowResume] = useState(false);
    const [resumeViewMode, setResumeViewMode] = useState('parsed'); // 'parsed' or 'original'
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailMessage, setEmailMessage] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);
    const stages = [
        'Applied', 'Screening', 'Interviewing', 'Offer Sent', 'Hired', 'Rejected'
    ];

    const handleCalculateFitScore = async () => {
        try {
            setScoringAI(true);
            const res = await fetch('/api/v1/admin/recruitment/ai/fit-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateId: candidate._id, jobId: candidate.jobRequisition?._id })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`AI Score: ${data.data.fitScore}/100 — ${data.data.recommendation}`);
                onRefresh();
            } else toast.error(data.error);
        } catch (e) { toast.error('Scoring failed'); } finally { setScoringAI(false); }
    };

    const handleGenerateQuestions = async () => {
        try {
            setQuestionsLoading(true);
            const res = await fetch('/api/v1/admin/recruitment/ai/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: candidate.jobRequisition?._id, round: candidate.status })
            });
            const data = await res.json();
            if (data.success) { setAiQuestions(data.data); toast.success('Interview questions generated!'); }
            else toast.error(data.error);
        } catch (e) { toast.error('Generation failed'); } finally { setQuestionsLoading(false); }
    };

    const updateStatus = async (newStatus) => {
        try {
            setSubmitting(true);
            const res = await fetch('/api/v1/admin/recruitment/candidates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: candidate._id, status: newStatus })
            });

            if (!res.ok) throw new Error("Failed to update status");
            toast.success(`Candidate moved to ${newStatus}`);
            onRefresh();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendManualEmail = async (e) => {
        e.preventDefault();
        if (!emailSubject || !emailMessage) {
            toast.error("Subject and message are required");
            return;
        }
        try {
            setSendingEmail(true);
            const res = await fetch('/api/v1/admin/recruitment/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: candidate._id,
                    subject: emailSubject,
                    message: emailMessage
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Message sent to ${candidate.name}!`);
                setShowEmailForm(false);
                setEmailSubject("");
                setEmailMessage("");
            } else toast.error(data.error);
        } catch (e) {
            toast.error('Failed to send email');
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl w-full max-w-4xl border border-slate-200 overflow-hidden scale-in duration-300 grid grid-cols-1 md:grid-cols-3">
                {/* Left Profile Sidebar */}
                <div className="p-8 bg-slate-50 border-r border-slate-100 flex flex-col items-center">
                    <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black mb-6">
                        {candidate.name.charAt(0)}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 text-center">{candidate.name}</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{candidate.jobRequisition?.title}</p>

                    <div className="w-full mt-8 space-y-4">
                        <div className="flex items-center gap-3 text-slate-600">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-medium">Applied {format(new Date(candidate.appliedDate), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-medium">{candidate.source}</span>
                        </div>
                    </div>

                    {/* AI Fit Score Badge — shown immediately if available */}
                    {candidate.fitScore != null && (
                        <div className="w-full mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 text-center">
                            <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1">AI Fit Score</p>
                            <p className={`text-3xl font-black ${candidate.fitScore >= 80 ? 'text-emerald-600' : candidate.fitScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {candidate.fitScore}<span className="text-sm text-slate-400">/100</span>
                            </p>
                            {candidate.fitRecommendation && (
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    candidate.fitRecommendation === 'Strong Hire' ? 'bg-emerald-100 text-emerald-700' :
                                    candidate.fitRecommendation === 'Potential Fit' ? 'bg-amber-100 text-amber-700' :
                                    'bg-rose-100 text-rose-700'
                                }`}>{candidate.fitRecommendation}</span>
                            )}
                        </div>
                    )}

                    {/* Manual Email Tool */}
                    <div className="w-full mt-4">
                        <button 
                            onClick={() => setShowEmailForm(!showEmailForm)}
                            className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${showEmailForm ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Mail className="w-4 h-4" /> {showEmailForm ? 'Cancel Message' : 'Send Message'}
                        </button>

                        {showEmailForm && (
                            <div className="mt-4 p-4 bg-white border border-slate-200 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subject</label>
                                    <input 
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        placeholder="Formal subject..."
                                        className="w-full p-2 bg-slate-50 border-none rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Message</label>
                                    <textarea 
                                        value={emailMessage}
                                        onChange={(e) => setEmailMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        rows={4}
                                        className="w-full p-2 bg-slate-50 border-none rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleSendManualEmail}
                                    disabled={sendingEmail || !emailSubject || !emailMessage}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {sendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />} Send Formal Email
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto w-full pt-8 space-y-2">
                        <button 
                            onClick={() => setShowResume(!showResume)}
                            className={`w-full py-3 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${showResume ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                            {showResume ? '← Back to Pipeline' : 'View Resume'}
                        </button>
                        <button className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all" onClick={() => updateStatus('Rejected')}>Reject</button>
                    </div>
                </div>

                {/* Right Content — Pipeline or Resume */}
                <div className="md:col-span-2 p-8 flex flex-col max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                            {showResume ? 'Parsed Resume' : 'Recruitment Pipeline'}
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">&times;</button>
                    </div>

                    {showResume ? (
                        /* ===== RESUME PANEL ===== */
                        <div className="flex flex-col flex-1 h-full">
                            <div className="flex mb-4 bg-slate-100 p-1 rounded-xl w-max">
                                <button 
                                    onClick={() => setResumeViewMode('parsed')} 
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${resumeViewMode === 'parsed' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}
                                >
                                    Parsed Data
                                </button>
                                <button 
                                    onClick={() => setResumeViewMode('original')} 
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${resumeViewMode === 'original' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}
                                >
                                    Original Document
                                </button>
                            </div>
                            
                            {resumeViewMode === 'parsed' ? (
                                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {/* AI Summary */}
                            {candidate.parsedResume?.summary && (
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">AI Summary</h4>
                                    <p className="text-sm text-slate-700 leading-relaxed">{candidate.parsedResume.summary}</p>
                                </div>
                            )}

                            {/* Skills */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(candidate.parsedResume?.skills || []).length > 0 ? (
                                        candidate.parsedResume.skills.map((skill, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">{skill}</span>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No skills extracted yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Experience */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Work Experience {candidate.parsedResume?.totalExperienceYears ? `(${candidate.parsedResume.totalExperienceYears} yrs)` : ''}
                                </h4>
                                {(candidate.parsedResume?.experience || []).length > 0 ? (
                                    <div className="space-y-3">
                                        {candidate.parsedResume.experience.map((exp, i) => (
                                            <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-sm font-black text-slate-800">{exp.role}</p>
                                                <p className="text-xs text-slate-500 font-medium">{exp.company} • {exp.duration}</p>
                                                {exp.highlights?.length > 0 && (
                                                    <ul className="mt-2 space-y-1">
                                                        {exp.highlights.map((h, j) => (
                                                            <li key={j} className="text-[11px] text-slate-600 flex items-start gap-2">
                                                                <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1.5 shrink-0"></span> {h}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No experience data extracted.</p>
                                )}
                            </div>

                            {/* Education */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Education</h4>
                                {(candidate.parsedResume?.education || []).length > 0 ? (
                                    <div className="space-y-2">
                                        {candidate.parsedResume.education.map((edu, i) => (
                                            <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-black shrink-0">🎓</div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{edu.degree}</p>
                                                    <p className="text-[10px] text-slate-500">{edu.institution} {edu.year ? `• ${edu.year}` : ''}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No education data extracted.</p>
                                )}
                            </div>

                            {/* Fit Score Summary */}
                            {candidate.fitScore != null && (
                                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-indigo-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">AI Fit Analysis</h4>
                                        <span className={`text-2xl font-black ${candidate.fitScore >= 80 ? 'text-emerald-600' : candidate.fitScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{candidate.fitScore}/100</span>
                                    </div>
                                    {candidate.fitStrengths?.length > 0 && (
                                        <div className="mb-2">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Strengths</p>
                                            {candidate.fitStrengths.map((s, i) => <p key={i} className="text-[11px] text-slate-600">✓ {s}</p>)}
                                        </div>
                                    )}
                                    {candidate.fitGaps?.length > 0 && (
                                        <div>
                                            <p className="text-[9px] font-black text-rose-500 uppercase mb-1">Gaps</p>
                                            {candidate.fitGaps.map((g, i) => <p key={i} className="text-[11px] text-slate-600">✗ {g}</p>)}
                                        </div>
                                    )}
                                </div>
                            )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col mt-4">
                                {candidate.resumeUrl && candidate.resumeUrl !== 'pending' ? (
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Uploaded Resume</p>
                                            <a 
                                                href={candidate.resumeUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                                            >
                                                ↓ Download PDF
                                            </a>
                                        </div>
                                        <iframe 
                                            src={candidate.resumeUrl} 
                                            className="w-full flex-1 min-h-[500px] rounded-2xl border border-slate-200 bg-white" 
                                            title="Original Resume" 
                                        />
                                    </div>
                                ) : candidate.resumeText ? (
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Extracted Document Text</p>
                                        </div>
                                        <div className="p-8 bg-white border border-slate-200 rounded-2xl flex-1 overflow-y-auto whitespace-pre-wrap font-mono text-sm text-slate-600 leading-relaxed translate-z-0 custom-scrollbar max-h-[500px]">
                                            {candidate.resumeText}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-12 text-center h-full bg-slate-50 rounded-2xl border border-slate-200">
                                        <FileText className="w-12 h-12 text-slate-300 mb-4" />
                                        <p className="text-sm font-bold text-slate-500">No original document available.</p>
                                        <p className="text-xs text-slate-400 mt-1">Cloud storage is not configured, and no document text was extracted.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        </div>
                    ) : (
                        /* ===== PIPELINE VIEW ===== */
                        <div className="space-y-6 flex-1">
                            <div className="flex flex-wrap gap-2">
                                {stages.map((stage) => (
                                    <button
                                        key={stage}
                                        disabled={submitting}
                                        onClick={() => updateStatus(stage)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${candidate.status === stage
                                            ? "bg-indigo-600 text-white"
                                            : "bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                                            }`}
                                    >
                                        {stage}
                                    </button>
                                ))}
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Interviews & Feedback</h4>
                                <div className="text-center py-8">
                                    <p className="text-slate-400 text-xs italic font-medium">No interview feedback recorded yet.</p>
                                    <button 
                                        onClick={() => router.push('/admin/recruitment/interviews')}
                                        className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                    >
                                        + Schedule Interview
                                    </button>
                                </div>
                            </div>

                            {/* AI Tools Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                {/* AI Fit Score */}
                                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Brain className="w-4 h-4 text-purple-600" />
                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">AI Fit Score</span>
                                    </div>
                                    {candidate.fitScore != null ? (
                                        <div>
                                            <div className="flex items-end gap-2">
                                                <span className={`text-3xl font-black ${candidate.fitScore >= 80 ? 'text-emerald-600' : candidate.fitScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{candidate.fitScore}</span>
                                                <span className="text-slate-400 text-sm font-bold mb-1">/100</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{candidate.fitAnalysis || candidate.fitRecommendation}</p>
                                            <button onClick={handleCalculateFitScore} disabled={scoringAI} className="mt-2 text-[9px] font-black text-purple-600 uppercase tracking-widest hover:underline">↻ Recalculate</button>
                                        </div>
                                    ) : (
                                        <button onClick={handleCalculateFitScore} disabled={scoringAI} className="w-full py-2.5 bg-white text-purple-600 rounded-xl text-[10px] font-black border border-purple-200 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                            {scoringAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {scoringAI ? 'Analyzing...' : 'Calculate Fit Score'}
                                        </button>
                                    )}
                                </div>
                                {/* AI Interview Questions */}
                                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">AI Questions</span>
                                    </div>
                                    <button onClick={handleGenerateQuestions} disabled={questionsLoading} className="w-full py-2.5 bg-white text-blue-600 rounded-xl text-[10px] font-black border border-blue-200 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                        {questionsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />} {questionsLoading ? 'Generating...' : 'Generate Interview Qs'}
                                    </button>
                                    {aiQuestions && (
                                        <div className="mt-3 max-h-32 overflow-y-auto space-y-1.5">
                                            {aiQuestions.questions?.slice(0, 4).map((q, i) => (
                                                <p key={i} className="text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-50">{i + 1}. {q.question}</p>
                                            ))}
                                            {aiQuestions.questions?.length > 4 && <p className="text-[9px] text-blue-500 font-bold">+{aiQuestions.questions.length - 4} more questions</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!showResume && candidate.status === 'HR Interview' && (
                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <button
                                onClick={() => onGenerateOffer(candidate)}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                                <FileCheck className="w-4 h-4" /> Finalize & Generate Offer
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function OfferManagement({ onRefresh, onCreateOffer }) {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleApproveOffer = async (offerId) => {
        try {
            const res = await fetch(`/api/v1/admin/recruitment/offers`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: offerId, status: 'Sent' }) // Assuming HR/Finance approves and it automatically transitions to Sent for MVP
            });
            if (res.ok) {
                onRefresh();
            }
        } catch (e) {
            console.error('Failed to approve offer');
        }
    };

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/v1/admin/recruitment/offers');
                const data = await res.json();
                setOffers(data.offers || []);
            } catch (error) {
                toast.error("Failed to load offers");
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, [onRefresh]); // Re-fetch when onRefresh (parent update) happens

    if (loading) return <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;

    if (offers.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileCheck className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold">No offers generated yet.</p>
                <button onClick={onCreateOffer} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">
                    Generate First Offer
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-800">Recent Offers</h3>
                <button onClick={onCreateOffer} className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                    <Plus className="w-3 h-3" /> New Offer
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {offers.map((offer) => (
                    <div key={offer._id} className="p-6 bg-white border border-slate-200 rounded-2xl hover: transition-all flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${offer.status === 'Accepted' ? 'bg-emerald-100 text-emerald-600' :
                                offer.status === 'Sent' ? 'bg-indigo-100 text-indigo-600' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                {offer.candidate?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{offer.candidate?.name}</h4>
                                <p className="text-xs text-slate-500">{offer.jobTitle} • {offer.salary?.currency} {offer.salary?.amount?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                            </div>
                        </div>

                        <div className="div flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joining</p>
                                <p className="text-xs font-bold text-slate-700">{format(new Date(offer.joiningDate), 'MMM d, yyyy')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                    offer.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600' :
                                    offer.status === 'Sent' ? 'bg-blue-50 text-blue-600' :
                                    offer.status === 'Pending Internal Approval' ? 'bg-amber-50 text-amber-600' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                    {offer.status}
                                </span>
                                {offer.status === 'Pending Internal Approval' && (
                                    <button
                                        onClick={() => handleApproveOffer(offer._id)}
                                        className="px-3 py-1 bg-indigo-600 outline-none focus:ring text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                                    >
                                        Approve & Send
                                    </button>
                                )}
                            </div>
                            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CreateOfferModal({ candidates, initialData, onClose, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiContent, setAiContent] = useState(null);
    const [formData, setFormData] = useState({
        candidate: initialData?.candidateId || '',
        jobTitle: initialData?.jobTitle || '',
        amount: 0,
        joiningDate: '',
        expiryDate: '',
        status: 'Sent'
    });

    const handleAIGenerateOffer = async () => {
        const candName = initialData?.name || candidates.find(c => c._id === formData.candidate)?.name;
        if (!candName || !formData.jobTitle || !formData.joiningDate) {
            toast.error('Fill candidate, job title & joining date first');
            return;
        }
        try {
            setAiGenerating(true);
            const res = await fetch('/api/v1/admin/recruitment/ai/generate-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateName: candName,
                    jobTitle: formData.jobTitle,
                    salary: formData.amount,
                    joiningDate: formData.joiningDate
                })
            });
            const data = await res.json();
            if (data.success) {
                setAiContent(data.data);
                toast.success('✨ AI offer letter generated!');
            } else toast.error(data.error);
        } catch (e) { toast.error('AI generation failed'); } finally { setAiGenerating(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = {
                candidate: formData.candidate,
                jobTitle: formData.jobTitle,
                salary: {
                    amount: formData.amount,
                    currency: 'INR',
                    frequency: 'Yearly'
                },
                joiningDate: formData.joiningDate,
                expiryDate: formData.expiryDate,
                content: aiContent?.content || '',
                terms: aiContent?.terms || [],
                aiGenerated: !!aiContent,
                status: 'Sent'
            };

            const res = await fetch('/api/v1/admin/recruitment/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create offer");

            // Also update candidate status to 'Offer Sent'
            if (formData.candidate) {
                await fetch('/api/v1/admin/recruitment/candidates', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: formData.candidate, status: 'Offer Sent' })
                });
            }

            toast.success("Offer Letter Generated & Sent!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl w-full max-w-xl border border-slate-200 overflow-hidden scale-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-900">Generate Offer Letter</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Candidate</label>
                            {initialData?.name ? (
                                <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 font-bold">
                                    {initialData.name}
                                </div>
                            ) : (
                                <select
                                    required
                                    value={formData.candidate}
                                    onChange={e => setFormData({ ...formData, candidate: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                >
                                    <option value="">Select Candidate</option>
                                    {candidates.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Job Title</label>
                            <input
                                required
                                value={formData.jobTitle}
                                onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold"
                                placeholder="e.g. Senior Developer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Annual Salary (CTC)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        required
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                                        className="w-full pl-8 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Joining Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.joiningDate}
                                    onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Offer Expiry Date</label>
                            <input
                                type="date"
                                required
                                value={formData.expiryDate}
                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            />
                        </div>
                    </div>
                </form>

                {/* AI Generate Offer Button */}
                <div className="px-8 pb-4">
                    <button
                        type="button"
                        onClick={handleAIGenerateOffer}
                        disabled={aiGenerating}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover: transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {aiGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> ✨ AI Generate Offer Letter</>}
                    </button>
                    {aiContent && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">✓ AI Content Ready</p>
                            <p className="text-xs text-slate-600">{aiContent.terms?.length || 0} terms generated</p>
                        </div>
                    )}
                </div>                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate & Send Offer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function JobRequisitionModal({ onClose, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        location: '',
        type: 'Full-time',
        priority: 'Medium',
        experienceLevel: 'Mid',
        hiringManager: '',
        workplaceType: 'On-site',
        description: '',
        requirements: '',
        targetDate: '',
        headcount: 1,
        salaryRange: {
            min: '',
            max: ''
        }
    });

    const handleAIGenerate = async () => {
        if (!formData.title || !formData.department) {
            toast.error('Enter Job Title and Department first');
            return;
        }
        try {
            setAiGenerating(true);
            const res = await fetch('/api/v1/admin/recruitment/ai/generate-jd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    department: formData.department,
                    type: formData.type,
                    location: formData.location
                })
            });
            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({
                    ...prev,
                    description: data.data.description || prev.description,
                    requirements: (data.data.requirements || []).join(', ')
                }));
                toast.success('✨ AI generated JD successfully!');
            } else {
                toast.error(data.error || 'AI generation failed');
            }
        } catch (error) {
            toast.error('AI generation failed');
        } finally {
            setAiGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await fetch('/api/v1/admin/recruitment/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    hiringManagerName: formData.hiringManager,
                    headcount: Number(formData.headcount) || 1,
                    requirements: formData.requirements.split(',').map(r => r.trim()).filter(Boolean),
                    salaryRange: {
                        min: Number(formData.salaryRange.min) || undefined,
                        max: Number(formData.salaryRange.max) || undefined,
                    }
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                if (errData.error && Array.isArray(errData.error)) {
                    // It's a Zod Validation Error, throw the first message
                    throw new Error(errData.error[0].message);
                }
                throw new Error(errData.error || "Failed to create job");
            }
            toast.success("Job requisition active!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 overflow-hidden scale-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-900">New Job Requisition</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Row 1: Job Title & Department */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Job Title</label>
                            <input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                                placeholder="Head of Engineering"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Department</label>
                            <input
                                required
                                value={formData.department}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                                placeholder="Technology"
                            />
                        </div>
                    </div>

                    {/* Row 2: Location, Type & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Location</label>
                            <input
                                required
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                                placeholder="Remote / Mumbai"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            >
                                <option>Full-time</option>
                                <option>Contract</option>
                                <option>Part-time</option>
                                <option>Internship</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Workplace Type */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Workplace Type</label>
                        <div className="flex gap-4">
                            {['On-site', 'Remote', 'Hybrid'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, workplaceType: t })}
                                    className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all border-2 ${
                                        formData.workplaceType === t 
                                        ? 'bg-indigo-600 text-white border-indigo-600' 
                                        : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-100'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Row 4: Target Date, Hiring Manager & Experience Level */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Date</label>
                            <input
                                type="date"
                                required
                                value={formData.targetDate}
                                onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 h-[46px]"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Hiring Manager</label>
                            <input
                                type="text"
                                required
                                value={formData.hiringManager}
                                onChange={e => setFormData({ ...formData, hiringManager: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 h-[46px]"
                                placeholder="e.g. Sarah Connor"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Experience Level</label>
                            <select
                                value={formData.experienceLevel}
                                onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none h-[46px]"
                            >
                                <option>Entry</option>
                                <option>Mid</option>
                                <option>Senior</option>
                                <option>Executive</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 5: Salary Range & Headcount */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Salary Range (Optional)</label>
                            <div className="flex gap-2">
                                 <input
                                    type="number"
                                    placeholder="Min"
                                    value={formData.salaryRange.min}
                                    onChange={e => setFormData({ ...formData, salaryRange: { ...formData.salaryRange, min: e.target.value } })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 h-[46px]"
                                />
                                 <input
                                    type="number"
                                    placeholder="Max"
                                    value={formData.salaryRange.max}
                                    onChange={e => setFormData({ ...formData, salaryRange: { ...formData.salaryRange, max: e.target.value } })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 h-[46px]"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Openings / Headcount</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={formData.headcount}
                                onChange={e => setFormData({ ...formData, headcount: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 h-[46px]"
                            />
                        </div>
                    </div>

                    {/* AI Generate Button */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleAIGenerate}
                            disabled={aiGenerating || !formData.title || !formData.department}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {aiGenerating ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> AI Generating...</>
                            ) : (
                                <><Sparkles className="w-4 h-4 group-hover:animate-pulse" /> ✨ AI Generate JD</>
                            )}
                        </button>
                    </div>

                    {/* Requirements */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Requirements (comma separated)</label>
                        <input
                            value={formData.requirements}
                            onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                            placeholder="Next.js, Tailwind CSS, 5+ yrs exp..."
                        />
                    </div>

                    {/* Job Description */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Job Description {formData.description && <span className="text-emerald-500 normal-case">({formData.description.length} chars)</span>}</label>
                        <textarea
                            required
                            minLength={10}
                            rows={6}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                            placeholder="Detailed role description... (min 10 characters)"
                        ></textarea>
                    </div>
                </form>
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all">Discard</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Opening"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditJobModal({ job, onClose, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: job.title || '',
        department: job.department || '',
        location: job.location || '',
        type: job.type || 'Full-time',
        priority: job.priority || 'Medium',
        experienceLevel: job.experienceLevel || 'Mid',
        hiringManager: job.hiringManagerName || '',
        workplaceType: job.workplaceType || 'On-site',
        description: job.description || '',
        requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : (job.requirements || ''),
        targetDate: job.targetDate ? new Date(job.targetDate).toISOString().split('T')[0] : '',
        headcount: job.headcount || 1,
        salaryRange: {
            min: job.salaryRange?.min || '',
            max: job.salaryRange?.max || ''
        }
    });

    const handleSubmit = async (e) => {
        e?.preventDefault();
        try {
            setSubmitting(true);
            const res = await fetch('/api/v1/admin/recruitment/jobs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId: job._id,
                    title: formData.title,
                    department: formData.department,
                    location: formData.location,
                    type: formData.type,
                    priority: formData.priority,
                    workplaceType: formData.workplaceType,
                    experienceLevel: formData.experienceLevel,
                    hiringManagerName: formData.hiringManager,
                    description: formData.description,
                    requirements: formData.requirements.split(',').map(r => r.trim()).filter(Boolean),
                    targetDate: formData.targetDate || undefined,
                    headcount: Number(formData.headcount) || 1,
                    salaryRange: {
                        min: Number(formData.salaryRange.min) || undefined,
                        max: Number(formData.salaryRange.max) || undefined,
                    }
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to update job");
            }
            toast.success("Job updated successfully!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 overflow-hidden scale-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Edit className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Edit Opening</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Modify job details</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Row 1: Job Title & Department */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Job Title</label>
                            <input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Department</label>
                            <input
                                required
                                value={formData.department}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>
                    </div>

                    {/* Row 2: Location, Type & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Location</label>
                            <input
                                required
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            >
                                <option>Full-time</option>
                                <option>Contract</option>
                                <option>Part-time</option>
                                <option>Internship</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Workplace Type */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Workplace Type</label>
                        <div className="flex gap-4">
                            {['On-site', 'Remote', 'Hybrid'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, workplaceType: t })}
                                    className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all border-2 ${
                                        formData.workplaceType === t
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-100'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Row 4: Target Date, Hiring Manager & Experience Level */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Date</label>
                            <input
                                type="date"
                                value={formData.targetDate}
                                onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 h-[46px]"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Hiring Manager</label>
                            <input
                                type="text"
                                value={formData.hiringManager}
                                onChange={e => setFormData({ ...formData, hiringManager: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 h-[46px]"
                                placeholder="e.g. Sarah Connor"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Experience Level</label>
                            <select
                                value={formData.experienceLevel}
                                onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none h-[46px]"
                            >
                                <option>Entry</option>
                                <option>Mid</option>
                                <option>Senior</option>
                                <option>Executive</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 5: Salary Range & Headcount */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Salary Range (Optional)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={formData.salaryRange.min}
                                    onChange={e => setFormData({ ...formData, salaryRange: { ...formData.salaryRange, min: e.target.value } })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 h-[46px]"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={formData.salaryRange.max}
                                    onChange={e => setFormData({ ...formData, salaryRange: { ...formData.salaryRange, max: e.target.value } })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 h-[46px]"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Openings / Headcount</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={formData.headcount}
                                onChange={e => setFormData({ ...formData, headcount: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 h-[46px]"
                            />
                        </div>
                    </div>

                    {/* Requirements */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Requirements (comma separated)</label>
                        <input
                            value={formData.requirements}
                            onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                            placeholder="Next.js, Tailwind CSS, 5+ yrs exp..."
                        />
                    </div>

                    {/* Job Description */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Job Description</label>
                        <textarea
                            required
                            minLength={10}
                            rows={5}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                            placeholder="Detailed role description..."
                        ></textarea>
                    </div>
                </form>
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SyndicateModal({ job, onClose }) {
    const publicJobUrl = `${window.location.origin}/careers/${job._id}`;
    const xmlFeedUrl = `${window.location.origin}/api/v1/public/careers/feed.xml${job.organizationId ? `?orgId=${job.organizationId._id || job.organizationId}` : ''}`;

    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        toast.success(`${type} copied to clipboard!`);
    };

    const handleLinkedInShare = () => {
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicJobUrl)}`;
        window.open(shareUrl, '_blank', 'width=600,height=600');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-white rounded-[40px] w-full max-w-lg border border-slate-200 overflow-hidden scale-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Share2 className="w-6 h-6 text-indigo-500" /> Syndicate & Share</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-8 space-y-8 bg-slate-50/50">
                    {/* LinkedIn Share */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Linkedin className="w-3.5 h-3.5" /> 1-Click Social Posting</h4>
                        <button onClick={handleLinkedInShare} className="w-full flex items-center justify-between p-5 rounded-3xl bg-white border-2 border-[#0077B5]/20 hover:border-[#0077B5] hover: hover:-[#0077B5]/10 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#0077B5]/10 flex items-center justify-center">
                                    <Linkedin className="w-6 h-6 text-[#0077B5]" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-black text-slate-800">Share to LinkedIn Feed</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Post to your professional network</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#0077B5] transition-colors">
                                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                            </div>
                        </button>
                    </div>

                    {/* Direct Link */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Link className="w-3.5 h-3.5" /> Direct Public Link</h4>
                        <div className="flex items-center gap-3 p-2 bg-white rounded-3xl border-2 border-slate-200">
                            <div className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 flex items-center gap-3 overflow-hidden">
                                <span className="text-xs font-mono text-indigo-600 truncate font-medium tracking-tight">{publicJobUrl}</span>
                            </div>
                            <button onClick={() => handleCopy(publicJobUrl, 'Job Link')} className="h-12 px-6 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-colors shrink-0">
                                Copy Link
                            </button>
                        </div>
                    </div>

                    {/* XML Feed */}
                    <div className="pt-8 border-t-2 border-dashed border-slate-200">
                        <div className="flex items-center gap-2 mb-3">
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Rss className="w-4 h-4 text-amber-500" /> Global XML Job Feed</h4>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg ml-auto border border-emerald-100">Live API</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-5 font-semibold leading-relaxed">Submit this XML feed URL to your Indeed or Naukri representative. They will automatically sync and scrape your open jobs every 24 hours.</p>
                        
                        <div className="bg-slate-900 rounded-3xl p-2 flex items-center gap-3">
                            <div className="flex-1 px-4 overflow-x-auto custom-scrollbar flex items-center">
                                <span className="text-emerald-400 font-mono text-[10px] font-black mr-3">GET</span>
                                <span className="text-slate-300 font-mono text-xs whitespace-nowrap">{xmlFeedUrl}</span>
                            </div>
                            <button onClick={() => handleCopy(xmlFeedUrl, 'XML Feed URL')} className="h-10 px-6 bg-white/10 text-white hover:bg-white text-[10px] hover:text-slate-900 font-black uppercase tracking-widest rounded-2xl transition-all shrink-0">
                                Copy XML
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

