"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, Loader2, FileText, Send, User, Mail, Phone, Briefcase, UploadCloud } from "lucide-react";
import { toast } from "sonner";

export default function CandidateApplicationForm({ isOpen, onClose, job }) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        resumeFile: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.resumeFile) {
            toast.error("Please fill all required fields and attach your resume PDF.");
            return;
        }

        try {
            setSubmitting(true);
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('email', formData.email);
            payload.append('phone', formData.phone);
            payload.append('jobId', job._id);
            payload.append('resume', formData.resumeFile);

            const res = await fetch('/api/v1/public/careers/apply', {
                method: 'POST',
                body: payload
            });

            const data = await res.json();
            if (data.success) {
                toast.success(<div>
                    <p className="font-bold">Application Submitted!</p>
                <p className="text-xs">Your Tracking ID: {data.applicationId}</p>
                </div>, { duration: 8000 });
                setFormData({ name: "", email: "", phone: "", resumeFile: null });
                onClose();
            } else {
                toast.error(data.error || "Failed to submit application");
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !job) return null;

    return (
        <AnimatePresence>
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
                    className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
                >
                    <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                <Briefcase className="w-6 h-6 text-indigo-500" /> Apply for Role
                            </h2>
                            <p className="text-slate-500 text-sm font-medium mt-1 ml-9">
                                {job.title} — {job.department}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <XCircle className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar">
                        <form id="apply-form" onSubmit={handleSubmit} className="space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" /> Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-12 px-4 rounded-2xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none text-sm transition-all"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5" /> Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full h-12 px-4 rounded-2xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none text-sm transition-all"
                                        placeholder="jane.doe@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5" /> Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full h-12 px-4 rounded-2xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none text-sm transition-all"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <UploadCloud className="w-3.5 h-3.5" /> Resume Document *
                                </label>
                                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:bg-slate-50 hover:border-indigo-400 cursor-pointer transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                                        {formData.resumeFile ? (
                                            <>
                                                <FileText className="w-10 h-10 text-emerald-500 mb-3" />
                                                <p className="text-sm font-bold text-slate-700">{formData.resumeFile.name}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-2 bg-emerald-50 px-3 py-1 rounded-full">Ready to Submit</p>
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud className="w-10 h-10 text-slate-300 mb-3" />
                                                <p className="mb-2 text-sm text-slate-500"><span className="font-bold text-indigo-600">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">PDF Documents Only</p>
                                            </>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        required
                                        accept="application/pdf"
                                        onChange={(e) => setFormData({ ...formData, resumeFile: e.target.files[0] })}
                                    />
                                </label>
                            </div>
                        </form>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="apply-form"
                            disabled={submitting}
                            className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[11px] transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {submitting ? "Submitting..." : "Submit Application"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
