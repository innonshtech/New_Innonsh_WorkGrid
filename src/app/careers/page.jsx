"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Briefcase, ChevronRight, TrendingUp, Sparkles, Building2, Terminal } from "lucide-react";
import CandidateApplicationForm from "@/components/recruitment/candidate-application-form";

export default function CareersPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedJob, setSelectedJob] = useState(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await fetch('/api/v1/public/careers/jobs');
                const data = await res.json();
                if (data.success) {
                    setJobs(data.jobs);
                }
            } catch (error) {
                console.error("Failed to load jobs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(search.toLowerCase()) || 
        job.department.toLowerCase().includes(search.toLowerCase()) ||
        job.location.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-indigo-200">
            {/* Nav */}
            <nav className="fixed top-0 inset-x-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 z-40 flex items-center justify-between px-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-black text-slate-800 tracking-tight">Xpertance Careers</span>
                </div>
                <a href="/careers/status" className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">
                    Check Application Status
                </a>
            </nav>

            {/* Hero */}
            <section className="pt-32 pb-20 px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 -z-10" />
                
                <div className="max-w-5xl mx-auto text-center space-y-6 relative">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4">
                        <Sparkles className="w-3.5 h-3.5" /> AI-Powered Hiring
                    </motion.div>
                    
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-tight">
                        Do the best work <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">of your life.</span>
                    </motion.h1>
                    
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                        Join our mission to build incredible products. Browse open roles below and apply in seconds with our AI-powered resume parser.
                    </motion.p>
                    
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-8 max-w-2xl mx-auto relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by role, department, or location..."
                            className="w-full h-16 pl-16 pr-6 rounded-[2rem] bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 text-lg transition-all"
                        />
                    </motion.div>
                </div>
            </section>

            {/* Job Board */}
            <section className="py-20 px-8 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-slate-400" /> Open Positions
                    </h2>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                        {filteredJobs.length} {filteredJobs.length === 1 ? 'Role' : 'Roles'}
                    </span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-500 animate-spin mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Opportunities...</p>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                        <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No open roles found matching your search.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredJobs.map((job, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                key={job._id}
                                onClick={() => setSelectedJob(job)}
                                className="group bg-white hover:bg-slate-50 p-6 md:p-8 rounded-[32px] border border-slate-200 hover:border-indigo-200 hover: hover: cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mb-3 group-hover:text-indigo-600 transition-colors">
                                        {job.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
                                        <span className="flex items-center gap-1.5 bg-slate-100 group-hover:bg-white px-3 py-1 rounded-xl transition-colors">
                                            <Building2 className="w-4 h-4 text-slate-400" /> {job.department}
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-slate-100 group-hover:bg-white px-3 py-1 rounded-xl transition-colors">
                                            <MapPin className="w-4 h-4 text-slate-400" /> {job.location}
                                        </span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-2">
                                            {job.type}
                                        </span>
                                    </div>
                                </div>
                                
                                <button className="shrink-0 w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-indigo-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-all">
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            <CandidateApplicationForm 
                isOpen={!!selectedJob} 
                onClose={() => setSelectedJob(null)} 
                job={selectedJob} 
            />
        </div>
    );
}
