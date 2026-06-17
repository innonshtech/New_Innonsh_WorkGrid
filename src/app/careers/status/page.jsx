"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, ChevronRight, Briefcase, Mail, KeyRound, Loader2, User, Building2, Calendar, FileText, PartyPopper, XCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { format } from "date-fns";

const PIPELINE_STAGES = ['Applied', 'Screening', 'Interview', 'Offered', 'Confirmed'];

export default function StatusPage() {
    const [loading, setLoading] = useState(false);
    const [responding, setResponding] = useState(false);
    const [email, setEmail] = useState("");
    const [trackingId, setTrackingId] = useState("");
    const [application, setApplication] = useState(null);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleCheck = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        
        if (!email || !trackingId) {
            setError("Both tracking ID and email are required.");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/v1/public/careers/status?email=${encodeURIComponent(email)}&id=${encodeURIComponent(trackingId)}`);
            const data = await res.json();
            
            if (data.success) {
                setApplication(data.application);
            } else {
                setError(data.error || "Application not found. Please double-check your details.");
                setApplication(null);
            }
        } catch (err) {
            setError("Network error. Please try again.");
            setApplication(null);
        } finally {
            setLoading(false);
        }
    };

    const handleOfferResponse = async (action) => {
        try {
            setResponding(true);
            setError("");
            setSuccessMsg("");

            const res = await fetch('/api/v1/public/careers/offer-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: application._id,
                    email: email,
                    action: action
                })
            });

            const data = await res.json();
            if (data.success) {
                setSuccessMsg(data.message);
                // Update local state to reflect the new status
                setApplication(prev => ({ ...prev, status: data.newStatus }));
            } else {
                setError(data.error || "Something went wrong. Please try again.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setResponding(false);
        }
    };

    const getStageIndex = (status) => {
        if (status === 'Rejected' || status === 'On Hold' || status === 'Withdrawn' || status === 'Declined') return -1;
        if (status === 'Confirmed') return 4;
        if (status === 'Hired' || status === 'Offer Sent') return 3;
        if (['Technical Interview', 'Managerial Interview', 'HR Interview'].includes(status)) return 2;
        if (status === 'Screening') return 1;
        return 0; // Applied
    };

    const currentStageIndex = application ? getStageIndex(application.status) : -1;
    const isOfferPending = application && ['Hired', 'Offer Sent'].includes(application.status);
    const isConfirmed = application?.status === 'Confirmed';
    const isDeclined = application?.status === 'Declined';
    const isRejected = application?.status === 'Rejected';

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-indigo-200 py-20 px-4 md:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white mx-auto">
                        <Search className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Track Your Application</h1>
                    <p className="text-slate-500 font-medium">Enter the tracking details sent to your email to view real-time updates.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleCheck} className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-200 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            required
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            placeholder="Tracking ID (e.g., 65f...)"
                            className="w-full h-16 pl-14 pr-6 rounded-3xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white text-sm transition-all font-mono"
                        />
                    </div>
                    <div className="flex-1 relative group">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            className="w-full h-16 pl-14 pr-6 rounded-3xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white text-sm transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-16 px-8 rounded-3xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check Status"}
                    </button>
                </form>

                {error && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-center text-sm font-bold pt-4 border border-rose-100">
                        {error}
                    </motion.div>
                )}

                {successMsg && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 text-emerald-700 p-5 rounded-2xl text-center text-sm font-bold border border-emerald-100">
                        {successMsg}
                    </motion.div>
                )}

                {/* Application Details */}
                <AnimatePresence>
                    {application && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[40px] border border-slate-200 overflow-hidden"
                        >
                            {/* Profile Header */}
                            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[28px] bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{application.name}</h2>
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 mt-2">
                                            <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {application.jobRequisition?.title || 'Unknown Role'}</span>
                                            <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {application.jobRequisition?.department || 'General'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`px-6 py-3 rounded-2xl flex items-center gap-2 ${
                                    isRejected || isDeclined ? 'bg-rose-50 text-rose-600' :
                                    isConfirmed ? 'bg-emerald-50 text-emerald-600' :
                                    isOfferPending ? 'bg-amber-50 text-amber-600' :
                                    'bg-indigo-50 text-indigo-600'
                                }`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest block">Current Status</span>
                                    <span className="text-lg font-black tracking-tight">{application.status}</span>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3.5 h-3.5"/> Timeline</h3>
                                    <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                        <p className="text-xs text-slate-500 font-medium">Applied On</p>
                                        <p className="text-sm font-bold text-slate-800">{format(new Date(application.createdAt), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText className="w-3.5 h-3.5"/> AI Analysis Profile</h3>
                                    <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                        <p className="text-xs text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Skills Detected: {(application.parsedResume?.skills || []).slice(0, 5).join(', ')}{application.parsedResume?.skills?.length > 5 ? '...' : ''}</p>
                                        <p className="text-sm font-bold text-indigo-600 mt-1">Ready for Review ✨</p>
                                    </div>
                                </div>
                            </div>

                            {/* === OFFER ACCEPTANCE SECTION === */}
                            {isOfferPending && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 border-b border-slate-100"
                                >
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[32px] border-2 border-emerald-200 p-8 text-center space-y-6">
                                        <div className="w-16 h-16 rounded-3xl bg-emerald-100 flex items-center justify-center mx-auto">
                                            <PartyPopper className="w-8 h-8 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">🎉 Congratulations!</h3>
                                            <p className="text-slate-600 font-medium mt-2 max-w-md mx-auto">
                                                You have received an offer for the <strong>{application.jobRequisition?.title || application.appliedRole || 'position'}</strong> role. 
                                                Please review the offer letter sent to your email and respond below.
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                                            <button
                                                onClick={() => handleOfferResponse('accept')}
                                                disabled={responding}
                                                className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[11px] transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                                Accept Offer
                                            </button>
                                            <button
                                                onClick={() => handleOfferResponse('decline')}
                                                disabled={responding}
                                                className="h-14 px-10 rounded-2xl bg-white hover:bg-rose-50 border-2 border-rose-200 text-rose-600 font-black uppercase tracking-widest text-[11px] transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                                                Decline Offer
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Confirmed Banner */}
                            {isConfirmed && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 border-b border-slate-100"
                                >
                                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-[32px] border-2 border-emerald-200 p-8 text-center space-y-4">
                                        <div className="w-16 h-16 rounded-3xl bg-emerald-500 flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-black text-emerald-700 tracking-tight">Offer Accepted ✅</h3>
                                        <p className="text-emerald-600 font-medium max-w-md mx-auto">
                                            Welcome aboard! Our HR team will be in touch shortly with onboarding details and next steps.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Declined Banner */}
                            {isDeclined && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 border-b border-slate-100"
                                >
                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-[32px] border border-slate-200 p-8 text-center space-y-4">
                                        <div className="w-16 h-16 rounded-3xl bg-slate-200 flex items-center justify-center mx-auto">
                                            <XCircle className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-500 tracking-tight">Offer Declined</h3>
                                        <p className="text-slate-400 font-medium max-w-md mx-auto">
                                            Thank you for your time throughout the process. We wish you the very best in your career.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Visual Pipeline */}
                            <div className="p-8 md:p-12">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center text-balance">Hiring Pipeline Progress</h3>
                                
                                <div className="relative">
                                    {/* Main Track */}
                                    <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-100 -translate-y-1/2 rounded-full hidden md:block" />
                                    
                                    {/* Progress Track */}
                                    {currentStageIndex >= 0 && (
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(currentStageIndex / (PIPELINE_STAGES.length - 1)) * 100}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="absolute top-1/2 left-0 h-1.5 bg-indigo-500 -translate-y-1/2 rounded-full hidden md:block" 
                                        />
                                    )}

                                    <div className="relative flex flex-col md:flex-row justify-between gap-6">
                                        {PIPELINE_STAGES.map((stage, idx) => {
                                            const isPast = currentStageIndex > idx;
                                            const isCurrent = currentStageIndex === idx;

                                            return (
                                                <div key={stage} className="flex md:flex-col items-center gap-4 md:gap-3 z-10 w-full md:w-auto relative">
                                                    {/* Vertical connection line for mobile */}
                                                    {idx !== PIPELINE_STAGES.length - 1 && (
                                                        <div className={`absolute left-[19px] top-10 bottom-[-24px] w-0.5 md:hidden ${isPast ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                                                    )}
                                                    
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-colors duration-500 ${
                                                        isPast ? 'bg-indigo-500 border-indigo-500 text-white' : 
                                                        isCurrent && !isRejected && !isDeclined ? 'bg-white border-indigo-500 text-indigo-600' :
                                                        isCurrent && isConfirmed ? 'bg-emerald-500 border-emerald-500 text-white' :
                                                        'bg-white border-slate-200 text-slate-300'
                                                    }`}>
                                                        {isPast || (isCurrent && isConfirmed) ? <CheckCircle2 className="w-5 h-5" /> : <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-indigo-500 animate-pulse' : 'bg-slate-200'}`} />}
                                                    </div>
                                                    
                                                    <div className="md:text-center flex-1">
                                                        <p className={`text-sm font-bold ${
                                                            isPast || isCurrent ? 'text-slate-800' : 'text-slate-400'
                                                        }`}>
                                                            {stage}
                                                        </p>
                                                        {isCurrent && isConfirmed && (
                                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Accepted ✅</p>
                                                        )}
                                                        {isCurrent && !isRejected && !isDeclined && !isConfirmed && (
                                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">In Progress</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Rejected/Declined overlay */}
                                    {(isRejected || isDeclined) && (
                                        <div className="mt-8 text-center">
                                            <span className="inline-flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-sm font-black uppercase tracking-widest border border-rose-100">
                                                <XCircle className="w-4 h-4" />
                                                {isRejected ? 'Application Unsuccessful' : 'Offer Declined'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}