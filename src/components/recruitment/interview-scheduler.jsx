"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Calendar, Clock, Video, Users,
    MoreHorizontal, CheckCircle2, XCircle,
    Plus, Search, Filter, Mail,
    Phone, ChevronRight, MessageSquare,
    Star, ArrowUpRight, Loader2, Link as LinkIcon,
    Briefcase, Building2, MapPin, Sparkles, Bot, AlertCircle,
    Activity, Trophy, Archive, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isTomorrow, isPast } from "date-fns";
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

export default function InterviewScheduler() {
    const [interviews, setInterviews] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [interviewers, setInterviewers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [intRes, candRes] = await Promise.all([
                fetch('/api/v1/admin/recruitment/interviews'),
                fetch('/api/v1/admin/recruitment/candidates')
            ]);

            const intData = await intRes.json();
            const candData = await candRes.json();

            setInterviews(intData.interviews || []);
            setInterviewers(intData.interviewers || []);
            setCandidates(candData.candidates || []);
        } catch (error) {
            toast.error("Failed to sync interview pipeline");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateStatus = async (candidateId, interviewId, newStatus) => {
        try {
            const res = await fetch('/api/v1/admin/recruitment/interviews', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId,
                    interviewId,
                    updateData: { status: newStatus }
                })
            });

            if (!res.ok) throw new Error("Update failed");
            toast.success(`Interview marked as ${newStatus}`);
            fetchData();
        } catch (error) {
            toast.error(error.message);
        }
    };

    // --- SMART PIPELINE GROUPING (Group by Candidate) ---
    const candidatesMap = interviews.reduce((acc, current) => {
        const cid = current.candidateId;
        if (!acc[cid]) {
            acc[cid] = {
                candidateId: cid,
                candidateName: current.candidateName,
                role: current.role,
                status: current.status, // Candidate's overall status
                interviews: []
            };
        }
        acc[cid].interviews.push(current);
        return acc;
    }, {});

    const candidateList = Object.values(candidatesMap).map(c => {
        // Find the latest/current interview
        const sorted = [...c.interviews].sort((a, b) => new Date(b.date) - new Date(a.date));
        return {
            ...c,
            latestInterview: sorted[0],
            allInterviews: sorted
        };
    }).filter(c => 
        c.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 🏆 Selection Vault (Hired / Offer Sent)
    const hiredCandidates = candidateList.filter(c => ['Hired', 'Offer Sent', 'Confirmed'].includes(c.status));
    
    // ❌ Rejected Candidates
    const rejectedCandidates = candidateList.filter(c => c.status === 'Rejected' || c.status === 'Declined');
    
    // 🚀 Active Pipeline (Everyone else)
    const activeCandidates = candidateList.filter(c => 
        !['Hired', 'Offer Sent', 'Confirmed', 'Rejected', 'Declined'].includes(c.status)
    );

    return (
        <div className="pt-16 pb-20 px-10 space-y-12">
            {/* Ultra-Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-600 text-white p-1 rounded-lg">
                            <Activity className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Dynamic Recruitment Pipeline</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                        Talent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-6xl">Command Centre.</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xl text-lg leading-relaxed">
                        Track candidate progress throughout the lifecycle. Manage assessments, feedback, and selection in one unified, high-performance flow.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setShowScheduleModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 h-16 rounded-[24px] px-8 text-white font-black uppercase tracking-widest group transition-all"
                    >
                        <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
                        Book Initial Round
                    </Button>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: "Pipeline Depth", value: activeCandidates.length, icon: Users, color: "blue", gradient: "from-blue-600 to-indigo-600" },
                    { label: "Pending Assessment", value: activeCandidates.filter(c => isPast(new Date(c.latestInterview?.date)) && !c.latestInterview?.decision).length, icon: MessageSquare, color: "orange", gradient: "from-orange-500 to-amber-500" },
                    { label: "Selection Rate", value: hiredCandidates.length > 0 ? `${Math.round((hiredCandidates.length / (hiredCandidates.length + rejectedCandidates.length)) * 100)}%` : "0%", icon: Star, color: "emerald", gradient: "from-emerald-500 to-teal-500" },
                    { label: "Upcoming Session", value: activeCandidates.filter(c => !isPast(new Date(c.latestInterview?.date))).length, icon: Clock, color: "purple", gradient: "from-purple-600 to-violet-600" }
                ].map((stat, i) => (
                    <Card key={i} className=" rounded-[40px] overflow-hidden group hover:scale-[1.03] transition-all duration-700 bg-white relative">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-[0.03] -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-1000`}></div>
                        <CardContent className="pt-14 pb-10 px-10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">{stat.label}</p>
                                    <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h4>
                                </div>
                                <div className={`w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 space-y-16">
                    {/* 1. ACTIVE PIPELINE SECTION */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                                    Active Talent Pipeline
                                </h3>
                            </div>
                            <Badge className="bg-indigo-50 text-indigo-600 border-none font-black py-2 px-6 rounded-full text-xs uppercase tracking-widest">
                                {activeCandidates.length} In Progress
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <AnimatePresence mode="popLayout">
                                {activeCandidates.length > 0 ? (
                                    activeCandidates.map((cand, index) => (
                                        <motion.div
                                            key={cand.candidateId}
                                            layout
                                            initial={{ opacity: 0, scale: 0.98, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <InterviewCard
                                                interview={cand.latestInterview}
                                                onStatusUpdate={updateStatus}
                                                onAddFeedback={(interviewItem) => {
                                                    setSelectedInterviewForFeedback(interviewItem);
                                                    setShowFeedbackModal(true);
                                                }}
                                                onAddAction={(interviewItem) => {
                                                    setSelectedInterviewForFeedback(interviewItem);
                                                    setShowActionModal(true);
                                                }}
                                            />
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div className="py-32 flex flex-col items-center justify-center bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[60px]">
                                        <div className="w-24 h-24 rounded-[40px] bg-white flex items-center justify-center mb-8">
                                            <Users className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-sm">Pipeline Clear</p>
                                        <p className="text-slate-400 text-xs mt-3 font-medium">Ready to welcome new applications</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* 2. SELECTION VAULT (HIRED) */}
                    {hiredCandidates.length > 0 && (
                        <section className="space-y-8 pt-8 border-t border-slate-100">
                            <div className="flex items-center gap-4 px-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                                    Selection Vault
                                </h3>
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold ml-auto px-6 py-2 rounded-full uppercase tracking-widest text-[10px]">
                                    {hiredCandidates.length} Secured
                                </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {hiredCandidates.map((cand) => (
                                    <InterviewCard
                                        key={cand.candidateId}
                                        interview={cand.latestInterview}
                                        onStatusUpdate={updateStatus}
                                        onAddFeedback={(interviewItem) => {
                                            setSelectedInterviewForFeedback(interviewItem);
                                            setShowFeedbackModal(true);
                                        }}
                                        onAddAction={(interviewItem) => {
                                            setSelectedInterviewForFeedback(interviewItem);
                                            setShowActionModal(true);
                                        }}
                                        minimal
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 3. DECLINED ARCHIVES (REJECTED) */}
                    {rejectedCandidates.length > 0 && (
                        <section className="space-y-8 pt-8 border-t border-slate-100">
                            <div className="flex items-center gap-4 px-4 opacity-50">
                                <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-600">
                                    <Archive className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-400 tracking-tight uppercase leading-none">
                                    Rejected Candidates
                                </h3>
                                <span className="ml-auto text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                                    {rejectedCandidates.length} Records
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 grayscale opacity-60 hover:opacity-100 transition-opacity">
                                {rejectedCandidates.map((cand) => (
                                    <InterviewCard
                                        key={cand.candidateId}
                                        interview={cand.latestInterview}
                                        onStatusUpdate={updateStatus}
                                        onAddFeedback={(interviewItem) => {
                                            setSelectedInterviewForFeedback(interviewItem);
                                            setShowFeedbackModal(true);
                                        }}
                                        onAddAction={(interviewItem) => {
                                            setSelectedInterviewForFeedback(interviewItem);
                                            setShowActionModal(true);
                                        }}
                                        minimal
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column: Insights & Quick Actions */}
                <div className="xl:col-span-4 space-y-8">
                    <Card className="rounded-[40px] border-slate-200 bg-white">
                        <CardContent className="pt-12 pb-8 px-8">
                            <h5 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" /> Top Interviewers
                            </h5>
                            <div className="space-y-6">
                                {interviewers.slice(0, 4).map((emp, i) => (
                                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                                                {emp.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                                                <p className="text-[10px] font-medium text-slate-400">{emp.designation}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">Available</Badge>
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" className="w-full mt-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-indigo-600">
                                View Panel Directory <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showScheduleModal && (
                    <ScheduleModal
                        onClose={() => setShowScheduleModal(false)}
                        candidates={candidates}
                        interviewers={interviewers}
                        prefill={typeof showScheduleModal === 'object' ? showScheduleModal : null}
                        onSuccess={() => {
                            setShowScheduleModal(false);
                            fetchData();
                        }}
                    />
                )}
                {showFeedbackModal && selectedInterviewForFeedback && (
                    <FeedbackModal
                        onClose={() => setShowFeedbackModal(false)}
                        interview={selectedInterviewForFeedback}
                        onSuccess={async () => {
                            setShowFeedbackModal(false);
                            await fetchData();
                        }}
                    />
                )}
                {showActionModal && selectedInterviewForFeedback && (
                    <ActionModal
                        onClose={() => setShowActionModal(false)}
                        interview={selectedInterviewForFeedback}
                        onSuccess={async (promoData) => {
                            setShowActionModal(false);
                            await fetchData();
                            
                            if (promoData && promoData.nextRound) {
                                toast.success("Opening scheduler for next round...");
                                setTimeout(() => {
                                    setShowScheduleModal({
                                        candidateId: promoData.candidateId,
                                        round: promoData.nextRound
                                    });
                                }, 500);
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function InterviewCard({ interview, onStatusUpdate, onAddFeedback, onAddAction, minimal = false }) {
    const isComp = interview.status === 'Completed';
    const isCanc = interview.status === 'Cancelled';
    const hasFeedback = !!interview.rawNotes;
    const hasDecision = !!interview.decision;
    const date = new Date(interview.date);

    // Decision display helper
    const getDecisionBadge = () => {
        if (!hasDecision) return null;
        const d = interview.decision;
        if (d === 'Offer Sent') return { label: 'OFFER SENT', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: '✉️' };
        if (d === 'Confirmed') return { label: 'OFFER ACCEPTED ✅', color: 'bg-emerald-600 text-white border-emerald-700', icon: '🎉' };
        if (d === 'Onboarded') return { label: 'ONBOARDED', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: '🚀' };
        if (d === 'Rejected') return { label: 'REJECTED', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: '✗' };
        if (d === 'On Hold') return { label: 'ON HOLD', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: '⏸' };
        if (d === 'Hired') return { label: 'HIRED', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: '🎉' };
        return { label: d || 'PENDING', color: 'bg-slate-50 text-slate-600 border-slate-100', icon: '•' };
    };
    const decisionBadge = getDecisionBadge();

    return (
        <div className={`group relative bg-white rounded-[40px] border ${isComp ? 'border-emerald-100' : isCanc ? 'border-slate-200 grayscale' : 'border-slate-200'} hover:border-indigo-400 transition-all duration-700 overflow-hidden min-h-[140px] flex items-stretch`}>
            {/* Status Indicator Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${hasDecision && interview.decision === 'Rejected' ? 'bg-rose-400' : hasDecision && interview.decision === 'On Hold' ? 'bg-amber-400' : isComp ? 'bg-emerald-500' : isCanc ? 'bg-slate-300' : 'bg-indigo-600'} group-hover:w-4 transition-all duration-700`}></div>

            <div className="p-6 pl-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    {/* Time/Date Block */}
                    <div className="flex flex-col items-center justify-center min-w-[80px] h-[80px] rounded-[28px] bg-slate-50 border border-slate-200 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-700  shrink-0">
                        <p className="text-[9px] font-black text-slate-400 group-hover:text-indigo-200 uppercase tracking-[0.2em] transition-colors">{format(date, 'MMM')}</p>
                        <p className="text-2xl font-black text-slate-900 group-hover:text-white leading-none py-1 transition-colors">{format(date, 'dd')}</p>
                        <p className="text-[10px] font-black text-indigo-600 group-hover:text-white mt-0.5 uppercase transition-colors">{format(date, 'HH:mm')}</p>
                    </div>

                    {/* Info Block */}
                    <div className="space-y-2.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-xl font-black text-slate-900 tracking-tighter leading-none truncate">{interview.candidateName}</h4>
                            <Badge className={`${isComp ? 'bg-emerald-50 text-emerald-600' : isCanc ? 'bg-slate-50 text-slate-400' : 'bg-indigo-600 text-white'} border-none font-black text-[9px] uppercase py-1.5 px-4 rounded-xl shrink-0`}>
                                {interview.round || "Assessment Round"}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-slate-500">
                            <span className="flex items-center gap-2 text-slate-400 uppercase tracking-[0.15em] text-[9px] font-black">
                                <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> {interview.role}
                            </span>
                            <span className="flex items-center gap-2.5 px-4 py-1.5 bg-slate-50 rounded-[14px] border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-all">
                                <Users className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col">
                                    <span className="text-slate-400 font-black uppercase text-[7px] tracking-widest leading-none mb-0.5">Panelist</span>
                                    <span className="text-slate-800 text-[11px] font-black uppercase leading-tight">{interview.interviewer?.name || "Pending"}</span>
                                </div>
                            </span>
                        </div>
                        {/* Inline Decision Status */}
                        {decisionBadge && (
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest mt-1 ${decisionBadge.color}`}>
                                <span>{decisionBadge.icon}</span> {decisionBadge.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                    {!minimal && !isComp && !isCanc && (
                        <>
                            <Button
                                className="h-14 rounded-[20px] bg-slate-900 text-white hover:bg-slate-800 font-black uppercase tracking-widest text-[10px] px-6 flex items-center gap-2.5 group/btn"
                                onClick={() => window.open(interview.meetingLink || '#', '_blank')}
                            >
                                <Video className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                Join
                            </Button>
                            <Button
                                variant="ghost"
                                className={`h-14 rounded-[20px] font-black uppercase tracking-widest text-[10px] px-5 flex items-center gap-1.5 ${hasFeedback ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'}`}
                                onClick={() => onAddFeedback && onAddFeedback(interview)}
                            >
                                {hasFeedback ? <><Sparkles className="w-4 h-4" /> View Feedback</> : <><MessageSquare className="w-4 h-4" /> Feedback</>}
                            </Button>
                            <Button
                                variant="ghost"
                                className="h-14 rounded-[20px] bg-amber-50 text-amber-700 hover:bg-amber-100 font-black uppercase tracking-widest text-[10px] px-5 flex items-center gap-1.5 border border-amber-100"
                                onClick={() => onAddAction && onAddAction(interview)}
                            >
                                <ArrowUpRight className="w-4 h-4" /> Action
                            </Button>
                        </>
                    )}
                    {isComp && (
                        <div className="flex items-center gap-3 pr-4">
                            <Button
                                variant="ghost"
                                onClick={() => onAddFeedback && onAddFeedback(interview)}
                                className="h-12 rounded-[16px] bg-purple-50 text-purple-600 hover:bg-purple-100 font-black uppercase tracking-widest text-[9px] px-5 flex items-center gap-1.5 border border-purple-100 transition-all"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> View Feedback
                            </Button>
                            {interview.decision === 'Confirmed' && (
                                <Button
                                    variant="ghost"
                                    className="h-12 rounded-[16px] bg-emerald-600 text-white hover:bg-emerald-700 font-black uppercase tracking-widest text-[9px] px-5 flex items-center gap-1.5 border-none transition-all hover:scale-105 active:scale-95"
                                    onClick={() => onAddAction && onAddAction(interview)}
                                >
                                    <Sparkles className="w-3.5 h-3.5" /> HIRE / ONBOARD
                                </Button>
                            )}
                            {(interview.decision === 'On Hold' || !['Confirmed', 'Onboarded', 'Rejected'].includes(interview.decision)) && (
                                <Button
                                    variant="ghost"
                                    className="h-12 rounded-[16px] bg-amber-50 text-amber-700 hover:bg-amber-100 font-black uppercase tracking-widest text-[9px] px-5 flex items-center gap-1.5 border border-amber-100 transition-all"
                                    onClick={() => onAddAction && onAddAction(interview)}
                                >
                                    <ArrowUpRight className="w-3.5 h-3.5" /> Action
                                </Button>
                            )}
                        </div>
                    )}
                    {isCanc && (
                        <div className="flex items-center gap-4 pr-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cancelled</p>
                            <div className="w-12 h-12 rounded-[18px] flex items-center justify-center bg-slate-100 text-slate-300">
                                <XCircle className="w-6 h-6" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ScheduleModal({ onClose, candidates, interviewers, onSuccess, prefill = null }) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        candidateId: prefill?.candidateId || '',
        round: prefill?.round || 'Technical Interview',
        interviewer: '',
        date: '',
        mode: 'Online',
        location: 'Company Corporate Office',
        meetingLink: '',
        notes: ''
    });

    // Update if prefill changes while open
    useEffect(() => {
        if (prefill) {
            setFormData(prev => ({
                ...prev,
                candidateId: prefill.candidateId || prev.candidateId,
                round: prefill.round || prev.round
            }));
        }
    }, [prefill]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.candidateId || !formData.date || !formData.interviewer) {
            toast.error("Required infrastructure data missing");
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch('/api/v1/admin/recruitment/interviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: formData.candidateId,
                    interview: {
                        round: formData.round,
                        interviewer: formData.interviewer,
                        date: formData.date,
                        mode: formData.mode,
                        location: formData.mode === 'Offline' ? formData.location : '',
                        meetingLink: formData.mode === 'Online' ? formData.meetingLink : '',
                        status: 'Scheduled'
                    }
                })
            });

            if (!res.ok) throw new Error("Scheduling operation failed");
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-[12px]"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-white rounded-[48px] w-full max-w-3xl border border-white/20 overflow-hidden relative z-10 p-12 overflow-y-auto max-h-[90vh]"
            >
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[28px] bg-indigo-600 flex items-center justify-center text-white">
                            <Plus className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Book Session</h2>
                            <p className="text-slate-400 text-sm font-medium mt-2">Initialize a new assessment round in the pipeline</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Target Candidate</label>
                        <Select
                            value={formData.candidateId}
                            onValueChange={val => setFormData({ ...formData, candidateId: val })}
                        >
                            <SelectTrigger className="h-16 rounded-[24px] border-slate-100 font-bold px-8 text-slate-700 bg-slate-50/50">
                                <SelectValue placeholder="Identify candidate from pipeline...">
                                    {candidates.find(c => c._id === formData.candidateId)?.name}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-[24px] p-2">
                                {candidates.map(c => (
                                    <SelectItem key={c._id} value={c._id} className="rounded-2xl p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{c.name}</span>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.appliedRole || c.jobRequisition?.title}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Round Specification</label>
                        <Select
                            value={formData.round}
                            onValueChange={val => setFormData({ ...formData, round: val })}
                        >
                            <SelectTrigger className="h-16 rounded-[24px] border-slate-100 font-bold px-8 text-slate-700 bg-slate-50/50">
                                <SelectValue placeholder="Select round type...">
                                    {formData.round}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {['Screening', 'Interviewing'].map(r => (
                                    <SelectItem key={r} value={r} className="rounded-xl p-3">{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Session Commander</label>
                        <Select
                            value={formData.interviewer}
                            onValueChange={val => setFormData({ ...formData, interviewer: val })}
                        >
                            <SelectTrigger className="h-16 rounded-[24px] border-slate-100 font-bold px-8 text-slate-700 bg-slate-50/50">
                                <SelectValue placeholder="Select from active panel...">
                                    {interviewers.find(i => i._id === formData.interviewer)?.name}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-[24px] p-2">
                                {interviewers.map(i => (
                                    <SelectItem key={i._id} value={i._id} className="rounded-2xl p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{i.name}</span>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{i.designation}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Interview Mode</label>
                        <Select
                            value={formData.mode}
                            onValueChange={val => setFormData({ ...formData, mode: val })}
                        >
                            <SelectTrigger className="h-16 rounded-[24px] border-slate-100 font-bold px-8 text-slate-700 bg-slate-50/50">
                                <SelectValue>
                                    {formData.mode}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="Online" className="rounded-xl p-3">Online (Virtual)</SelectItem>
                                <SelectItem value="Offline" className="rounded-xl p-3">Offline (In-Person)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Temporal coordinates</label>
                        <Input
                            type="datetime-local"
                            value={formData.date || ''}
                            className="h-16 rounded-[24px] border-slate-100 font-bold px-8 bg-slate-50/50"
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2">
                        {formData.mode === 'Online' ? (
                            <>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Virtual Bridge (Meeting Link)</label>
                                <Input
                                    placeholder="Zoom / Meet / Teams URL..."
                                    value={formData.meetingLink || ''}
                                    className="h-16 rounded-[24px] border-slate-100 font-bold px-8 bg-slate-50/50"
                                    onChange={e => setFormData({ ...formData, meetingLink: e.target.value })}
                                />
                            </>
                        ) : (
                            <>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">📍 Reporting Location</label>
                                <Input
                                    placeholder="Office Address / Meeting Room..."
                                    value={formData.location || ''}
                                    className="h-16 rounded-[24px] border-slate-100 font-bold px-8 bg-slate-50/50"
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </>
                        )}
                    </div>

                    <div className="md:col-span-2 flex gap-4 pt-8">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-20 rounded-[32px] border-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
                        >
                            Abort Session
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="flex-3 h-20 rounded-[32px] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs transition-all flex-[2]"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Authorize Scheduling"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function FeedbackModal({ onClose, interview, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [feedbackText, setFeedbackText] = useState(interview.rawNotes || '');
    const hasSavedFeedback = !!interview.rawNotes;

    const handleSaveFeedback = async () => {
        if (!feedbackText.trim()) { toast.error("Please enter feedback notes"); return; }
        try {
            setSubmitting(true);
            const res = await fetch('/api/v1/admin/recruitment/interviews', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: interview.candidateId,
                    interviewId: interview.interviewId,
                    updateData: { rawNotes: feedbackText, status: 'Completed' }
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Feedback saved successfully!");
                onSuccess(null);
            } else { throw new Error(data.error); }
        } catch (err) { toast.error(err.message); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-[12px]"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-white rounded-[40px] w-full max-w-2xl border border-white/20 overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
                <div className="p-8 border-b border-slate-100 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                    {hasSavedFeedback ? 'View Feedback' : 'Save Feedback'}
                                </h2>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">
                                    {interview.candidateName} — {interview.round || 'Post Session'}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl w-10 h-10 hover:bg-slate-50">
                            <XCircle className="w-5 h-5 text-slate-400" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">
                                📝 Interviewer Notes & Observations
                            </label>
                            <textarea
                                value={feedbackText}
                                readOnly={hasSavedFeedback}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Enter the interviewer's detailed feedback here..."
                                className={`w-full h-64 p-6 rounded-[32px] border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 text-slate-700 bg-white resize-none transition-all text-sm leading-relaxed ${hasSavedFeedback ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`}
                            />
                        </div>

                        {!hasSavedFeedback && (
                            <Button
                                onClick={handleSaveFeedback}
                                disabled={submitting || !feedbackText.trim()}
                                className="w-full h-14 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Save Feedback
                            </Button>
                        )}

                        {hasSavedFeedback && (
                            <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Feedback Recorded
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function ActionModal({ onClose, interview, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [showRoundPicker, setShowRoundPicker] = useState(false);

    const handleSubmitDecision = async (decision, nextRound = null) => {

        try {
            setSubmitting(true);
            console.log("SENDING DECISION:", { candidateId: interview.candidateId, interviewId: interview.interviewId, decision });
            
            if (decision === 'Offer Sent') {
                toast("Generating offer letter and notifying candidate...", { icon: '📄' });
            }

            const res = await fetch('/api/v1/admin/recruitment/interviews', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: interview.candidateId,
                    interviewId: interview.interviewId,
                    updateData: {
                        decision,
                        status: 'Completed',
                        ...(nextRound ? { nextRound } : {})
                    }
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Server Error (${res.status}): ${errText}`);
            }

            const data = await res.json();
            if (data.success) {
                const msg = decision === 'Promoted' ? 'Promoted to ' + nextRound 
                    : decision === 'Offer Sent' ? 'Offer letter sent! Awaiting candidate response' 
                    : decision;
                toast.success(`${msg}`);
                onSuccess(decision === 'Promoted' ? { candidateId: interview.candidateId, nextRound } : null);
            } else { throw new Error(data.error || "Unknown server error"); }
        } catch (err) { 
            console.error("DECISION SUBMISSION FAILED:", err);
            toast.error(err.message); 
        }
        finally { setSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-[12px]"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-white rounded-[40px] w-full max-w-lg border border-white/20 overflow-hidden relative z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white">
                                <ArrowUpRight className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Take Action</h2>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">
                                    {interview.candidateName} — {interview.round || 'Current Round'}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl w-10 h-10 hover:bg-slate-50">
                            <XCircle className="w-5 h-5 text-slate-400" />
                        </Button>
                    </div>
                </div>

                <div className="p-8 space-y-4">
                    {showRoundPicker ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest text-center border-b pb-4">Select Next Round</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {['Screening', 'Interviewing'].map(round => (
                                    <button 
                                        key={round}
                                        onClick={() => handleSubmitDecision('Promoted', round)}
                                        disabled={submitting}
                                        style={{ color: '#1e293b' }}
                                        className="h-14 rounded-2xl border-2 border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50 font-bold text-sm flex items-center justify-between px-6 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        <span className="font-black text-slate-900">{round}</span> 
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> : <ArrowRight className="w-5 h-5 text-indigo-500" />}
                                    </button>
                                ))}
                            </div>
                            <Button variant="ghost" onClick={() => setShowRoundPicker(false)} className="w-full text-slate-400 font-bold uppercase text-[10px]">← Back</Button>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {interview.decision === 'Confirmed' ? (
                                <button
                                    onClick={() => {
                                        const name = interview.candidateName.split(' ');
                                        const query = new URLSearchParams({
                                            firstName: name[0] || '',
                                            lastName: name.slice(1).join(' ') || '',
                                            email: interview.candidateEmail || '',
                                            designation: interview.role || '',
                                            candidateId: interview.candidateId
                                        }).toString();
                                        window.location.href = `/admin/employees/new?${query}`;
                                    }}
                                    style={{ color: '#fff', backgroundColor: '#059669', border: '2px solid #059669', boxSizing: 'border-box', height: '60px', borderRadius: '16px' }}
                                    className="w-full hover:opacity-90 font-black text-xs uppercase tracking-widest flex items-center gap-3 pl-8 cursor-pointer transition-all"
                                >
                                    <Sparkles className="w-5 h-5 shrink-0" /> Onboard Candidate
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setShowRoundPicker(true)}
                                        disabled={submitting}
                                        style={{ color: '#fff', backgroundColor: '#0f172a', border: '2px solid #0f172a', boxSizing: 'border-box', height: '60px', borderRadius: '16px' }}
                                        className="w-full hover:opacity-90 font-black text-xs uppercase tracking-widest flex items-center gap-3 pl-8 cursor-pointer disabled:opacity-50 transition-all"
                                    >
                                        <ArrowUpRight className="w-5 h-5 shrink-0" /> Promote to Next Round
                                    </button>
                                    <button
                                        onClick={() => handleSubmitDecision('Offer Sent')}
                                        disabled={submitting}
                                        style={{ color: '#fff', backgroundColor: '#059669', border: '2px solid #059669', boxSizing: 'border-box', height: '60px', borderRadius: '16px' }}
                                        className="w-full hover:opacity-90 font-black text-xs uppercase tracking-widest flex items-center gap-3 pl-8 cursor-pointer disabled:opacity-50 transition-all"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <Trophy className="w-5 h-5 shrink-0" />}
                                        {submitting ? 'Processing...' : 'Send Offer Letter'}
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => handleSubmitDecision('On Hold')}
                                disabled={submitting}
                                style={{ color: '#92400e', backgroundColor: '#fffbeb', border: '2px solid #f59e0b', boxSizing: 'border-box', height: '60px', borderRadius: '16px' }}
                                className="w-full hover:opacity-90 font-black text-xs uppercase tracking-widest flex items-center gap-3 pl-8 cursor-pointer disabled:opacity-50 transition-all font-bold"
                            >
                                <Clock className="w-5 h-5 shrink-0" /> Hold / Draft
                            </button>
                            <button
                                onClick={() => handleSubmitDecision('Rejected')}
                                disabled={submitting}
                                style={{ color: '#dc2626', backgroundColor: '#fff1f2', border: '2px solid #fb7185', boxSizing: 'border-box', height: '60px', borderRadius: '16px' }}
                                className="w-full hover:opacity-90 font-black text-xs uppercase tracking-widest flex items-center gap-3 pl-8 cursor-pointer disabled:opacity-50 transition-all font-bold"
                            >
                                <XCircle className="w-5 h-5 shrink-0" /> Reject Candidate
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

