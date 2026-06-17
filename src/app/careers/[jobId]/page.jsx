import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, MapPin, Building2, Clock, Terminal, ArrowRight, Share2 } from "lucide-react";
import prisma from '@/lib/db/prisma';

// 1. DYNAMIC SEO GENERATION FOR LINKEDIN/TWITTER
export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const job = await prisma.jobRequisition.findFirst({
        where: { OR: [{ id: resolvedParams.jobId }, { mongoId: resolvedParams.jobId }] }
    });

    if (!job) {
        return { title: 'Job Not Found - Xpertance Careers' };
    }

    const jobData = job.jobData || {};
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const cleanDescription = (jobData.description || '')?.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...';

    return {
        title: `${job.title} at Xpertance | Careers`,
        description: cleanDescription,
        openGraph: {
            title: `Hiring: ${job.title} - ${jobData.location || ''}`,
            description: cleanDescription,
            url: `${baseUrl}/careers/${job.id}`,
            siteName: 'Xpertance Careers',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `Hiring: ${job.title}`,
            description: cleanDescription,
        }
    };
}

// 2. SERVER-SIDE RENDERED PAGE FOR VISIBILITY
export default async function JobLandingPage({ params }) {
    const resolvedParams = await params;
    const job = await prisma.jobRequisition.findFirst({
        where: { OR: [{ id: resolvedParams.jobId }, { mongoId: resolvedParams.jobId }] }
    });

    if (!job || job.status !== 'Open') {
        notFound();
    }

    const jobData = job.jobData || {};
    const enrichedJob = {
        _id: job.id,
        id: job.id,
        title: job.title,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        ...jobData
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-indigo-200 font-sans">
            {/* Nav */}
            <nav className="fixed top-0 inset-x-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 z-40 flex items-center justify-between px-8">
                <Link href="/careers" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-black text-slate-800 tracking-tight">Xpertance Careers</span>
                </Link>
                <Link href="/careers" className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">
                    View All Jobs
                </Link>
            </nav>

            <main className="max-w-4xl mx-auto pt-32 pb-20 px-8">
                {/* Header Section */}
                <div className="bg-white rounded-[40px] p-10 md:p-14 border border-slate-200 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                    
                    <div className="mb-6 inline-flex p-4 rounded-3xl bg-indigo-50 text-indigo-600">
                        <Briefcase className="w-8 h-8" />
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6">{enrichedJob.title}</h1>
                    
                    <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500 mb-10">
                        <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                            <Building2 className="w-4 h-4 text-slate-400" /> {enrichedJob.department}
                        </span>
                        <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                            <MapPin className="w-4 h-4 text-slate-400" /> {enrichedJob.location}
                        </span>
                        <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl uppercase tracking-widest text-[10px] text-indigo-600">
                            <Clock className="w-4 h-4" /> {enrichedJob.type}
                        </span>
                    </div>

                    <Link 
                        href={`/careers?jobId=${enrichedJob._id}`}
                        className="inline-flex items-center justify-center px-10 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all hover: hover:-translate-y-1 gap-3"
                    >
                        Apply For This Role <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Body Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-10 bg-white p-10 md:p-14 rounded-[40px] border border-slate-200">
                        
                        <div>
                            <h2 className="text-xl font-black text-slate-900 mb-6">About the Role</h2>
                            <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{enrichedJob.description}</p>
                        </div>

                        {enrichedJob.requirements && enrichedJob.requirements.length > 0 && (
                            <div>
                                <h2 className="text-xl font-black text-slate-900 mb-6">Requirements</h2>
                                <ul className="space-y-4">
                                    {enrichedJob.requirements.map((req, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                            <span className="text-slate-600 font-medium leading-relaxed">{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-[32px] p-8 text-white">
                            <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest">Job Details</h3>
                            <ul className="space-y-6">
                                <li>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Experience Required</p>
                                    <p className="font-medium text-slate-200">{enrichedJob.experienceLevel || "Not Specified"}</p>
                                </li>
                                <li>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Salary Range</p>
                                    <p className="font-medium text-slate-200">
                                        {enrichedJob.salaryRange?.min ? `${enrichedJob.salaryRange.min} - ${enrichedJob.salaryRange.max}` : "Competitive"}
                                    </p>
                                </li>
                                <li>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Posted On</p>
                                    <p className="font-medium text-slate-200">{new Date(enrichedJob.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                                </li>
                            </ul>
                        </div>
                        
                        {/* Fallback Share Button */}
                        <div className="bg-white rounded-[32px] border border-slate-200 p-8 text-center">
                            <Share2 className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-sm font-black text-slate-800 mb-2">Share this role</h3>
                            <p className="text-xs text-slate-500 font-medium mb-4">Know someone perfect?</p>
                            <a 
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${baseUrl}/careers/${enrichedJob._id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block w-full py-3 bg-[#0077B5]/10 text-[#0077B5] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#0077B5]/20 transition-colors"
                            >
                                Share via LinkedIn
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
