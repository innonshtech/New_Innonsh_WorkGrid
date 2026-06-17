"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  Search,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Tag,
  AlertTriangle,
  Award,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import StaffingStepper from "./StaffingStepper";

export default function AIMatching() {
  const [requirements, setRequirements] = useState([]);
  const [selectedReqId, setSelectedReqId] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [matchingResults, setMatchingResults] = useState(null);
  const [shortlistedMap, setShortlistedMap] = useState({});
  const [cappedWarning, setCappedWarning] = useState(false);
  const [failedMatchesList, setFailedMatchesList] = useState([]);

  // API Error State
  const [apiErrorModalOpen, setApiErrorModalOpen] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      const res = await fetch("/api/v1/admin/staffing/requirements?status=open");
      const result = await res.json();
      if (result.success) {
        const reqs = result.requirements || [];
        setRequirements(reqs);
        
        let activeReq = reqs[0] || null;
        let activeReqId = activeReq?._id || "";
        
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const queryReqId = params.get("reqId");
          if (queryReqId) {
            const found = reqs.find(r => r._id === queryReqId);
            if (found) {
              activeReq = found;
              activeReqId = queryReqId;
            }
          }
        }
        
        setSelectedReqId(activeReqId);
        setSelectedReq(activeReq);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load client requirements.");
    }
  };

  // Trigger auto-matching on load if reqId is in query params
  useEffect(() => {
    if (selectedReqId && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryReqId = params.get("reqId");
      if (queryReqId === selectedReqId) {
        triggerAutoMatch(selectedReqId);
      }
    }
  }, [selectedReqId]);

  const triggerAutoMatch = async (reqId) => {
    try {
      setLoading(true);
      setMatchingResults(null);
      setShortlistedMap({});
      setCappedWarning(false);
      setFailedMatchesList([]);
      
      const res = await fetch("/api/v1/admin/staffing/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementId: reqId }),
      });

      const result = await res.json();
      if (result.success) {
        setMatchingResults(result.matches || []);
        setCappedWarning(!!result.cappedAt25);
        setFailedMatchesList(result.failedMatches || []);
      }
    } catch (err) {
      console.error("Auto match error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReqChange = (e) => {
    const id = e.target.value;
    setSelectedReqId(id);
    const found = requirements.find((r) => r._id === id);
    setSelectedReq(found || null);
    setMatchingResults(null); // Clear previous matchings
    setCappedWarning(false);
    setFailedMatchesList([]);
  };

  const handleRunAIMatch = async () => {
    if (!selectedReqId) return;

    try {
      setLoading(true);
      setMatchingResults(null);
      setShortlistedMap({});
      setCappedWarning(false);
      setFailedMatchesList([]);
      
      toast.info("Gemini AI is parsing matching matrices across entire candidate bank...", { duration: 4000 });

      const res = await fetch("/api/v1/admin/staffing/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementId: selectedReqId }),
      });

      const result = await res.json();
      if (result.success) {
        setMatchingResults(result.matches || []);
        setCappedWarning(!!result.cappedAt25);
        setFailedMatchesList(result.failedMatches || []);

        if (result.failedMatches && result.failedMatches.length > 0) {
          const firstError = result.failedMatches[0].errorType;
          if (firstError === 'GOOGLE_API_KEY_ERROR') {
            setApiErrorMessage(result.failedMatches[0].errorMessage || "Google Gemini API Key quota exhausted.");
            setApiErrorModalOpen(true);
          } else {
            toast.warning(`Analyzed ${result.totalScored} candidates, but ${result.failedMatches.length} failed due to AI timeouts.`);
          }
        } else {
          toast.success(`Successfully analyzed and ranked ${result.totalScored} candidates!`);
        }
      } else {
        if (result.errorType === 'GOOGLE_API_KEY_ERROR') {
          setApiErrorMessage(result.error || "Google Gemini API Key quota exhausted or key is blocked.");
          setApiErrorModalOpen(true);
        } else {
          toast.error(result.error || "Failed to calculate AI matchings.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during AI matching.");
    } finally {
      setLoading(false);
    }
  };

  const handleShortlistCandidate = async (candidateId, match) => {
    try {
      const res = await fetch("/api/v1/admin/staffing/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          requirementId: selectedReqId,
          stage: "submitted",
          notes: `AI Match Shortlist: ${match.fitScore}% fit score calculated by Gemini.`,
          fitScore: match.fitScore,
          fitAnalysis: match.analysis,
          fitStrengths: match.strengths,
          fitGaps: match.gaps,
          fitRecommendation: match.recommendation
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Candidate successfully shortlisted & submitted to hiring pipeline!");
        // Mark as shortlisted in UI
        setShortlistedMap((prev) => ({ ...prev, [candidateId]: true }));
      } else {
        toast.error(result.error || "Failed to shortlist candidate.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while shortlisting candidate.");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (score >= 75) return "bg-blue-50 text-blue-600 border-blue-100";
    if (score >= 60) return "bg-amber-50 text-amber-600 border-amber-100";
    return "bg-rose-50 text-rose-500 border-rose-100";
  };

  const getRecommendationBadgeColor = (rec) => {
    if (rec === "Strong Hire") return "bg-emerald-600 text-white";
    if (rec === "Potential Fit") return "bg-blue-600 text-white";
    if (rec === "Weak Match") return "bg-amber-500 text-white";
    return "bg-slate-500 text-white";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6">
      <StaffingStepper currentStep={4} />
      
      {/* Header and selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-600 animate-pulse" /> AI Match Workspace
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Compare resumes against client requirement specs using Gemini 2.5 Flash
          </p>
        </div>

        {/* Dropdown Select Requirement */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="space-y-0.5 text-left flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Requirement</span>
            <select
              value={selectedReqId}
              onChange={handleReqChange}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full sm:w-64 md:w-80"
            >
              {requirements.map((req) => (
                <option key={req._id} value={req._id}>
                  {req.title} ({req.clientId?.name})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunAIMatch}
            disabled={loading || !selectedReqId}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl active:scale-[0.98] transition-all self-end"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" /> Run AI Match
          </button>
        </div>
      </div>

      {selectedReq && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Requirement Profile Spec Summary */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">{selectedReq.title}</h3>
                <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-300" /> {selectedReq.clientId?.name}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Experience Limit</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">{selectedReq.minExperience} - {selectedReq.maxExperience} Yrs</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sourcing Budget</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block truncate" title={selectedReq.budgetRange}>
                    {selectedReq.budgetRange || "Unstated"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">Required Skill Set</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedReq.skillsRequired?.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200"
                    >
                      <Tag className="w-2.5 h-2.5 text-slate-400" /> {skill}
                    </span>
                  ))}
                </div>
              </div>

              {selectedReq.description && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Role Description</span>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-4">{selectedReq.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Columns: AI Match Result Cards */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-5">
                <div className="relative w-14 h-14">
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                  <Cpu className="absolute inset-0 w-6 h-6 text-indigo-600 m-auto animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-base font-extrabold text-slate-800">Gemini AI Sourcing Evaluator Active</p>
                  <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto">
                    Analyzing raw resumes, scanning career milestones, scoring skill alignment, and generating custom recruitment matrices...
                  </p>
                </div>
              </div>
            ) : !matchingResults ? (
              <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
                <Sparkles className="w-12 h-12 opacity-35 mx-auto mb-3 text-indigo-500 animate-pulse" />
                <h3 className="text-sm font-extrabold text-slate-700">Ready to Match</h3>
                <p className="text-xs font-semibold text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  Select a requirement from the dropdown above and click <strong>"Run AI Match"</strong> to score the resume bank!
                </p>
              </div>
            ) : matchingResults.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h3 className="text-sm font-extrabold text-slate-700">No Candidates Found</h3>
                <p className="text-xs font-semibold text-slate-400 max-w-xs mx-auto mt-1">
                  Ensure you have uploaded candidates in the Sourcing Bank who match some of the required skills.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-600" /> Matched Results ({matchingResults.length})
                    </h3>
                    <span className="text-xs font-bold text-slate-400">Ranked by Score</span>
                  </div>

                  {cappedWarning && (
                    <div className="bg-amber-50/80 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                      To optimize performance and respect API limits, only the top 25 pre-filtered candidates in the sourcing pool were scored by the AI.
                    </div>
                  )}

                  {failedMatchesList.length > 0 && (
                    <div className="bg-rose-50/80 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                      {failedMatchesList.length} candidate(s) were excluded because the AI engine failed to process their profiles.
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {matchingResults.map((match, index) => {
                    const cand = match.candidate;
                    const isShortlisted = shortlistedMap[cand._id];
                    
                    return (
                      <div
                        key={cand._id}
                        className="bg-white rounded-3xl border border-slate-150 p-6 space-y-4 flex flex-col justify-between hover: transition- relative overflow-hidden"
                      >
                        {/* Rank Badge */}
                        <div className="absolute top-0 left-0 w-8 h-8 bg-slate-900 text-white rounded-br-2xl flex items-center justify-center font-black text-xs">
                          #{index + 1}
                        </div>

                        <div className="space-y-3.5 pl-4">
                          {/* Title block */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
                            <div className="space-y-0.5">
                              <h4 className="text-base font-extrabold text-slate-800 truncate">{cand.name}</h4>
                              <p className="text-xs font-semibold text-slate-400 truncate">
                                {cand.parsedResume?.currentRole || "Candidate"} • {cand.parsedResume?.totalExperienceYears} Yrs Exp
                              </p>
                            </div>

                            {/* Score and Recommendation badges */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`inline-flex px-3 py-1.5 rounded-xl border text-sm font-extrabold ${getScoreColor(match.fitScore)}`}>
                                Fit Score: {match.fitScore}%
                              </span>
                              <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-black ${getRecommendationBadgeColor(match.recommendation)}`}>
                                {match.recommendation}
                              </span>
                            </div>
                          </div>

                          {/* Fit analysis comment */}
                          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Match Report</span>
                            <p className="text-xs font-medium text-slate-700 leading-relaxed">
                              {match.analysis}
                            </p>
                          </div>

                          {/* Strengths & Gaps lists */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                            {/* Strengths */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Core Matches
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {match.strengths?.map((str) => (
                                  <span key={str} className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 text-[10px]">
                                    + {str}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {/* Gaps */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-amber-600 uppercase tracking-wider block flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Gaps & Warnings
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {match.gaps?.length === 0 ? (
                                  <span className="text-[10px] font-medium text-slate-400 italic">None detected</span>
                                ) : (
                                  match.gaps?.map((gap) => (
                                    <span key={gap} className="inline-flex px-2 py-0.5 bg-amber-50/70 text-amber-600 rounded-md border border-amber-100 text-[10px]">
                                      ! {gap}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Shortlist actions */}
                        <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-4 mt-2">
                          {cand.resumeUrl && (
                            <a
                              href={cand.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
                            >
                              Download CV
                            </a>
                          )}
                          {isShortlisted ? (
                            <button
                              disabled
                              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold text-xs"
                            >
                              <Check className="w-4 h-4" /> Shortlisted
                            </button>
                          ) : (
                            <button
                              onClick={() => handleShortlistCandidate(cand._id, match)}
                              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl active:scale-[0.98] transition-all"
                            >
                              Shortlist & Submit <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google API Error Modal */}
      {apiErrorModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-red-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 flex flex-col items-center justify-center text-center space-y-3 relative">
              <button
                onClick={() => setApiErrorModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">API Quota Exhausted</h3>
              <p className="text-red-100 text-sm font-medium">Google Gemini AI Engine Error</p>
            </div>

            <div className="p-8 space-y-6 text-center">
              <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                The free tier Google Gemini API key used by the Staff Augmentation module has reached its rate limit, quota, or has been blocked.
              </p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Error Details</p>
                <p className="text-xs font-mono font-medium text-rose-500">{apiErrorMessage}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setApiErrorModalOpen(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl active:scale-[0.98] transition-all"
                >
                  Understood
                </button>
                <p className="text-[10px] font-semibold text-slate-400">
                  Please update your GOOGLE_API_KEY environment variable with a premium billing-enabled key to continue using AI matching.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
