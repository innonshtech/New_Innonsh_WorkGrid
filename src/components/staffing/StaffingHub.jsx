"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Briefcase,
  Building2,
  GitGraph,
  ArrowRight,
  UploadCloud,
  Cpu,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export default function StaffingHub() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/staffing/dashboard");
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        toast.error(result.error || "Failed to load dashboard statistics.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while loading dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
        </div>
        <p className="text-slate-500 font-medium text-sm">Loading staffing intelligence...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    activeClients: 0,
    openRequirements: 0,
    totalCandidates: 0,
    activeSubmissions: 0,
    totalDeployments: 0,
    recruitersCount: 0,
  };

  const statCards = [
    {
      title: "Active Clients",
      value: stats.activeClients,
      icon: Building2,
      color: "from-blue-500 to-indigo-600",
      description: "Partner companies managed",
      link: "/admin/staffing/clients",
    },
    {
      title: "Open Requirements",
      value: stats.openRequirements,
      icon: Briefcase,
      color: "from-amber-500 to-orange-600",
      description: "Roles currently sourcing",
      link: "/admin/staffing/requirements",
    },
    {
      title: "Global Resume Bank",
      value: stats.totalCandidates,
      icon: FileText,
      color: "from-emerald-500 to-teal-600",
      description: "Persistent candidate profiles",
      link: "/admin/staffing/talent-pool",
    },
    {
      title: "Active Recruiters",
      value: stats.recruitersCount,
      icon: Users,
      color: "from-rose-500 to-pink-600",
      description: "Dedicated sourcing team",
      link: "/admin/staffing/talent-pool",
    },
    {
      title: "Active Submissions",
      value: stats.activeSubmissions,
      icon: GitGraph,
      color: "from-purple-500 to-pink-600",
      description: "In the hiring pipeline",
      link: "/admin/staffing/submissions",
    },
    {
      title: "Successful Deployments",
      value: stats.totalDeployments,
      icon: CheckCircle,
      color: "from-cyan-500 to-blue-600",
      description: "Hired candidates deployed",
      link: "/admin/staffing/submissions",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in p-4 sm:p-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-800">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="w-3.5 h-3.5" /> Staffing Intelligence Suite v1.0
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Recruiter & Talent Matching Workspace
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              Upload resumes, search candidate skills instantly across our global resume bank, and trigger AI requirement matching to deploy top professionals.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/admin/staffing/talent-pool")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              <UploadCloud className="w-4 h-4" /> Upload & Parse Resume
            </button>
            <button
              onClick={() => router.push("/admin/staffing/matching")}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white font-semibold text-sm px-5 py-3 rounded-xl border border-slate-700 transition-all active:scale-[0.98]"
            >
              <Cpu className="w-4 h-4" /> Run AI Matcher
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        {statCards.map((card) => (
          <div
            key={card.title}
            onClick={() => router.push(card.link)}
            className="group relative bg-white hover:bg-slate-50/50 rounded-2xl p-6 border border-slate-200 hover: transition-all cursor-pointer overflow-hidden active:scale-[0.99]"
          >
            <div className="space-y-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">{card.value}</p>
              </div>
              <p className="text-[10px] font-bold text-slate-500 leading-tight">{card.description}</p>
            </div>
            {/* Hover arrow */}
            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Activity Feeds */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Candidates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Recent Candidate Uploads</h3>
                <p className="text-xs font-medium text-slate-400">Newly analyzed talent bank candidates</p>
              </div>
              <button
                onClick={() => router.push("/admin/staffing/talent-pool")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 group"
              >
                View Resume Bank <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {data?.recentCandidates?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-400">
                <FileText className="w-8 h-8 opacity-40" />
                <p className="text-sm font-medium">No candidates in the pool yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data?.recentCandidates?.map((candidate) => (
                  <div key={candidate._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 truncate">{candidate.name}</p>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 capitalize">
                          {candidate.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 flex flex-wrap items-center gap-1.5 truncate">
                        <span>{candidate.email} • {candidate.parsedResume?.totalExperienceYears} yrs experience</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                          {candidate.uploadedByName || "Uploaded by Admin"}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {candidate.parsedResume?.skills?.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.parsedResume?.skills?.length > 4 && (
                          <span className="text-[10px] font-bold text-slate-400 px-1 py-0.5">
                            +{candidate.parsedResume.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/admin/staffing/talent-pool?id=${candidate._id}`)}
                      className="shrink-0 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Submissions Activity</h3>
                <p className="text-xs font-medium text-slate-400">Recent hiring pipeline events</p>
              </div>
              <button
                onClick={() => router.push("/admin/staffing/submissions")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 group"
              >
                Open Kanban Pipeline <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {data?.recentSubmissions?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-400">
                <Clock className="w-8 h-8 opacity-40" />
                <p className="text-sm font-medium">No submissions tracked yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data?.recentSubmissions?.map((sub) => (
                  <div key={sub._id} className="flex items-start gap-4 p-3 hover:bg-slate-50/50 rounded-xl transition-all border border-slate-50">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">
                        {sub.candidateId?.name || "Candidate"} submitted for {sub.requirementId?.title || "Role"}
                      </p>
                      <p className="text-xs font-medium text-slate-400">
                        Hiring stage: <span className="text-indigo-600 font-bold capitalize">{sub.stage}</span> • Fit Score: <span className="font-bold text-slate-700">{sub.fitScore}%</span>
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 italic mt-1 line-clamp-1">"{sub.notes || 'Submitted candidate to requirement'}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workflow Shortcuts */}
        <div className="space-y-8">
          <div className="bg-gradient-to-b from-indigo-50 to-indigo-100/50 rounded-2xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-lg font-bold text-indigo-950 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" /> Quick Sourcing Tools
            </h3>
            
            <div className="space-y-4">
              <button
                onClick={() => router.push("/admin/staffing/clients")}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/60 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">Client Companies</p>
                    <p className="text-[11px] font-medium text-slate-400">Manage client CRM & contacts</p>
                  </div>
                </div>
                <PlusCircle className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <button
                onClick={() => router.push("/admin/staffing/requirements")}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/60 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">Job Requirements</p>
                    <p className="text-[11px] font-medium text-slate-400">Create client job specifications</p>
                  </div>
                </div>
                <PlusCircle className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <button
                onClick={() => router.push("/admin/staffing/talent-pool")}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/60 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">Resume Sourcing Bank</p>
                    <p className="text-[11px] font-medium text-slate-400">Central resume pool & upload</p>
                  </div>
                </div>
                <PlusCircle className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <button
                onClick={() => router.push("/admin/staffing/matching")}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/60 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                    <Cpu className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">AI Matching Engine</p>
                    <p className="text-[11px] font-medium text-slate-400">Select requirement, scan pool</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>
            </div>
          </div>

          {/* Active Recruiting Team */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="border-b border-slate-50 pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Recruiting Team
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Active sourcing team members</p>
            </div>

            {!data?.recruiters || data.recruiters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                <Users className="w-8 h-8 opacity-45 mb-2" />
                <p className="text-xs font-semibold">No recruiters configured yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recruiters.map((recruiter) => (
                  <div key={recruiter._id} className="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-all border border-slate-100/50">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      {recruiter.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{recruiter.name}</p>
                      <p className="text-[11px] font-medium text-slate-400 truncate">{recruiter.email}</p>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mt-0.5">{recruiter.designation}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100/40">
                        {recruiter.candidatesCount} Resumes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400">AI Matching Tip</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              When uploading a resume, our <strong>Gemini parser</strong> automatically maps experience, skills, and contact data. 
              It then runs an instant scan against all open jobs. 
              You can search candidate skills (e.g. "Angular") from the Resume Sourcing Bank at any time to find people uploaded months ago.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
