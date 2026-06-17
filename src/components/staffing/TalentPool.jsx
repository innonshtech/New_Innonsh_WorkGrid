"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  UploadCloud,
  FileText,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  X,
  Cpu,
  CheckCircle,
  Tag,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  UserPlus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import StaffingStepper from "./StaffingStepper";

export default function TalentPool() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // Upload & Instant Match States
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [activeTab, setActiveTab] = useState("bank"); // "bank" or "upload"

  // Submission State
  const [requirements, setRequirements] = useState([]);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [submittingToReq, setSubmittingToReq] = useState(false);
  const [submittingCandidateId, setSubmittingCandidateId] = useState(null);
  const [selectedReqId, setSelectedReqId] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");

  // API Error State
  const [apiErrorModalOpen, setApiErrorModalOpen] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");

  useEffect(() => {
    fetchCandidates();
    fetchRequirements();
  }, []);

  const fetchCandidates = async (searchVal = "") => {
    try {
      setLoading(true);
      const url = searchVal 
        ? `/api/v1/admin/staffing/candidates?search=${encodeURIComponent(searchVal)}`
        : "/api/v1/admin/staffing/candidates";
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        setCandidates(result.candidates || []);
      } else {
        toast.error(result.error || "Failed to load candidates.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while loading candidates.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      const res = await fetch("/api/v1/admin/staffing/requirements?status=open");
      const result = await res.json();
      if (result.success) {
        setRequirements(result.requirements || []);
      }
    } catch (err) {
      console.error("Fetch requirements failed:", err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCandidates(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchCandidates("");
  };

  // Drag and Drop Upload Handlers
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF resumes are supported at this time.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum allowed size is 10MB.");
      return;
    }

    try {
      setUploading(true);
      setUploadResult(null);
      
      const formData = new FormData();
      formData.append("file", file);

      toast.info("Gemini AI is reading and structuring the resume... Please wait.", { duration: 5000 });

      const res = await fetch("/api/v1/admin/staffing/candidates", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        toast.success(result.message || "Resume parsed successfully!");
        setUploadResult({
          candidate: result.candidate,
          matches: result.instantMatches || [],
        });
        fetchCandidates(); // Refresh list in background
      } else {
        if (result.errorType === 'GOOGLE_API_KEY_ERROR') {
          setApiErrorMessage(result.error || "Google Gemini API Key quota exhausted or key is blocked.");
          setApiErrorModalOpen(true);
        } else {
          toast.error(result.error || "Failed to parse resume.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while uploading the file.");
    } finally {
      setUploading(false);
    }
  };

  // Submit Candidate to JD
  const handleOpenSubmissionModal = (candidateId) => {
    if (requirements.length === 0) {
      toast.warning("No open client requirements available to submit to.");
      return;
    }
    
    let defaultReqId = requirements[0]._id;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryReqId = params.get("reqId");
      if (queryReqId && requirements.some(r => r._id === queryReqId)) {
        defaultReqId = queryReqId;
      }
    }
    
    setSubmittingCandidateId(candidateId);
    setSelectedReqId(defaultReqId);
    setSubmissionNotes("");
    setSubmissionModalOpen(true);
  };

  const handleSubmitCandidate = async () => {
    if (!selectedReqId || !submittingCandidateId) return;

    try {
      setSubmittingToReq(true);
      
      // Check if we already have AI match score for this candidate & requirement in the current upload results
      let matchDetails = {};
      if (uploadResult && uploadResult.matches) {
        const foundMatch = uploadResult.matches.find(m => m.requirement._id === selectedReqId);
        if (foundMatch) {
          matchDetails = {
            fitScore: foundMatch.fitScore,
            fitAnalysis: foundMatch.analysis,
            fitStrengths: foundMatch.strengths,
            fitGaps: foundMatch.gaps,
            fitRecommendation: foundMatch.recommendation
          };
        }
      }

      const res = await fetch("/api/v1/admin/staffing/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: submittingCandidateId,
          requirementId: selectedReqId,
          stage: "submitted",
          notes: submissionNotes,
          ...matchDetails
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(result.message || "Candidate submitted to requirement successfully!");
        setSubmissionModalOpen(false);
        fetchCandidates(); // Refresh candidate status (interviewing)
        if (selectedCandidate && selectedCandidate._id === submittingCandidateId) {
          setSelectedCandidate(prev => ({ ...prev, status: "interviewing" }));
        }
      } else {
        toast.error(result.error || "Failed to submit candidate.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting candidate.");
    } finally {
      setSubmittingToReq(false);
    }
  };

  const handleInstantMatchSubmit = async (candidateId, reqId, match) => {
    try {
      const res = await fetch("/api/v1/admin/staffing/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          requirementId: reqId,
          stage: "submitted",
          notes: `Instant Match submission: ${match.fitScore}% fit score calculated by Gemini.`,
          fitScore: match.fitScore,
          fitAnalysis: match.analysis,
          fitStrengths: match.strengths,
          fitGaps: match.gaps,
          fitRecommendation: match.recommendation
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(result.message || "Candidate submitted successfully!");
        
        // Remove requirement from instant matches array to give UI feedback
        setUploadResult(prev => ({
          ...prev,
          matches: prev.matches.filter(m => m.requirement._id !== reqId)
        }));
        fetchCandidates();
      } else {
        toast.error(result.error || "Failed to submit candidate.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting candidate.");
    }
  };

  const handleDeleteCandidate = async (id, name) => {
    if (!confirm(`Are you sure you want to delete candidate "${name}"? This will permanently remove their parsed profile from the talent pool.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/staffing/candidates/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message || "Candidate deleted successfully!");
        setSelectedCandidate(null); // Close drawer
        fetchCandidates(); // Refresh list
      } else {
        toast.error(result.error || "Failed to delete candidate.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting the candidate.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      <StaffingStepper currentStep={3} />
      
      {/* Header and Toggle Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Global Sourcing Pool & Resume Bank
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Persistent global pool of parsed, searchable candidate CVs matching client open requirements
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
          <button
            onClick={() => { setActiveTab("bank"); setUploadResult(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "bank"
                ? "bg-white text-indigo-700"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🔍 Search Resume Bank
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "upload"
                ? "bg-white text-indigo-700"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📤 Upload & AI Parse
          </button>
        </div>
      </div>

      {activeTab === "bank" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sourcing Search list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Input Card */}
            <form onSubmit={handleSearchSubmit} className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3 items-center">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search skills (e.g. Angular, React, Python), name, or summaries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none border-none focus:ring-0 p-0"
                />
                {searchTerm && (
                  <button type="button" onClick={handleClearSearch} className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all active:scale-[0.98]"
              >
                Search
              </button>
            </form>

            {/* Candidates List */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
              </div>
            ) : candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl space-y-4 text-slate-400">
                <Users className="w-12 h-12 opacity-35" />
                <p className="text-sm font-medium">No candidates in the resume pool yet</p>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-semibold text-xs px-4 py-2 rounded-xl transition-colors border border-indigo-100/50"
                >
                  Onboard Your First Candidate
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate._id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`bg-white rounded-2xl border p-5 flex items-center justify-between gap-6 hover: transition-all cursor-pointer relative overflow-hidden active:scale-[0.99] ${
                      selectedCandidate?._id === candidate._id
                        ? "border-indigo-500 ring-1 ring-indigo-500/20"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="space-y-3 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-extrabold text-slate-800 text-base truncate">{candidate.name}</h3>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            candidate.status === "available"
                              ? "bg-emerald-50 text-emerald-600"
                              : candidate.status === "interviewing"
                              ? "bg-amber-50 text-amber-600"
                              : candidate.status === "deployed"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {candidate.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold text-slate-500">
                        <p className="truncate">{candidate.email}</p>
                        {candidate.parsedResume?.totalExperienceYears > 0 && (
                          <p className="shrink-0 text-slate-400 sm:border-l sm:border-slate-200 sm:pl-4">
                            💼 {candidate.parsedResume.totalExperienceYears} Yrs Exp
                          </p>
                        )}
                        {candidate.parsedResume?.currentRole && (
                          <p className="truncate text-slate-400 sm:border-l sm:border-slate-200 sm:pl-4">
                            🏢 {candidate.parsedResume.currentRole}
                          </p>
                        )}
                        <p className="shrink-0 text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100/30 text-[10px] sm:border-l sm:border-slate-200 sm:pl-4 flex items-center gap-1">
                          👤 {candidate.uploadedByName || "Uploaded by Admin"}
                        </p>
                      </div>

                      {candidate.parsedResume?.skills && candidate.parsedResume.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {candidate.parsedResume.skills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200/55"
                            >
                              {skill}
                            </span>
                          ))}
                          {candidate.parsedResume.skills.length > 5 && (
                            <span className="text-[10px] font-bold text-slate-400 px-1 py-0.5">
                              +{candidate.parsedResume.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 p-2 text-slate-400 group-hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Detailed Candidate View Drawer */}
          <div className="lg:col-span-1">
            {selectedCandidate ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-6 sticky top-6 max-h-[85vh] overflow-y-auto no-scrollbar">
                {/* Header Profile */}
                <div className="flex items-start justify-between border-b border-slate-50 pb-4 gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="text-xl font-extrabold text-slate-900 leading-tight truncate">{selectedCandidate.name}</h3>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        selectedCandidate.status === "available"
                          ? "bg-emerald-50 text-emerald-600"
                          : selectedCandidate.status === "interviewing"
                          ? "bg-amber-50 text-amber-600"
                          : selectedCandidate.status === "deployed"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {selectedCandidate.status}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sourcing Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenSubmissionModal(selectedCandidate._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl active:scale-[0.98] transition-all"
                  >
                    <UserPlus className="w-4.5 h-4.5" /> Submit to Job
                  </button>
                  {selectedCandidate.resumeUrl && (
                    <a
                      href={selectedCandidate.resumeUrl.includes('cloudinary') ? selectedCandidate.resumeUrl.replace(/\/v\d+\//, '/v2/') : selectedCandidate.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors shrink-0"
                    >
                      <FileText className="w-4 h-4 text-indigo-500" /> CV <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteCandidate(selectedCandidate._id, selectedCandidate.name)}
                    className="flex items-center justify-center p-2.5 rounded-xl border border-red-150 text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    title="Delete Candidate"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* AI Summary Block */}
                {selectedCandidate.parsedResume?.summary && (
                  <div className="bg-gradient-to-b from-indigo-50/50 to-indigo-100/15 rounded-2xl border border-indigo-100/50 p-4 space-y-2">
                    <p className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-indigo-600" /> AI Executive Summary
                    </p>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
                      "{selectedCandidate.parsedResume.summary}"
                    </p>
                  </div>
                )}

                {/* Sourcing Metadata */}
                <div className="space-y-2.5 border-t border-slate-50 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sourcing Metadata</h4>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span className="text-slate-400">Uploaded By:</span>
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-150 text-[11px] font-bold">
                      {selectedCandidate.uploadedByName || "Uploaded by Admin"}
                    </span>
                  </div>
                </div>

                {/* Contact parameters */}
                <div className="space-y-2.5 border-t border-slate-50 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Details</h4>
                  <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a href={`mailto:${selectedCandidate.email}`} className="hover:text-indigo-600 truncate">{selectedCandidate.email}</a>
                    </div>
                    {selectedCandidate.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <a href={`tel:${selectedCandidate.phone}`} className="hover:text-indigo-600">{selectedCandidate.phone}</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills tags */}
                {selectedCandidate.parsedResume?.skills && selectedCandidate.parsedResume.skills.length > 0 && (
                  <div className="space-y-2.5 border-t border-slate-50 pt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analyzed Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.parsedResume.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience History */}
                {selectedCandidate.parsedResume?.experience && selectedCandidate.parsedResume.experience.length > 0 && (
                  <div className="space-y-4 border-t border-slate-50 pt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience History</h4>
                    <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-4">
                      {selectedCandidate.parsedResume.experience.map((exp, idx) => (
                        <div key={idx} className="relative space-y-1">
                          {/* Timeline dot */}
                          <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white"></div>
                          
                          <p className="text-xs font-bold text-slate-800">{exp.role}</p>
                          <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-slate-300" /> {exp.company} • <Calendar className="w-3 h-3 text-slate-300" /> {exp.duration}
                          </p>
                          {exp.highlights && exp.highlights.length > 0 && (
                            <ul className="text-[11px] font-medium text-slate-500 pl-3 list-disc space-y-0.5 mt-1">
                              {exp.highlights.slice(0, 2).map((high, hIdx) => (
                                <li key={hIdx}>{high}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400 sticky top-6">
                <Users className="w-10 h-10 opacity-30 mx-auto mb-2" />
                <p className="text-xs font-bold">Select a Candidate</p>
                <p className="text-[11px] leading-relaxed max-w-[200px] mx-auto mt-1">
                  Click on a candidate profile to view complete experience, skills analysis, and documents
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Upload & AI parse screen */
        <div className="max-w-3xl mx-auto space-y-8 py-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" /> AI Resume Parsing Console
            </h3>

            {/* Drop Zone */}
            <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-8 text-center transition-all cursor-pointer group">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6 animate-pulse" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700">Drag and drop resume PDF here, or browse files</p>
                  <p className="text-[11px] font-semibold text-slate-400">Accepting PDF files (Maximum size 10MB)</p>
                </div>
              </div>
            </div>

            {/* Loading Indicator */}
            {uploading && (
              <div className="bg-slate-50 rounded-2xl border border-indigo-100 p-6 flex flex-col items-center justify-center space-y-4">
                <div className="relative w-12 h-12">
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                  <Cpu className="absolute inset-0 w-5 h-5 text-indigo-600 m-auto animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-extrabold text-slate-800">Gemini Parsing Engine Active</p>
                  <p className="text-xs font-semibold text-slate-400">Reading text blocks, mapping skills, and scanning experience timeline...</p>
                </div>
              </div>
            )}

            {/* Upload results & Instant Matches */}
            {uploadResult && (
              <div className="space-y-6 border-t border-slate-100 pt-6 animate-in slide-in-from-bottom-5 duration-300">
                {/* Result header */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-800">AI Parsing Successful!</h4>
                    <p className="text-xs font-semibold text-emerald-600">Candidate profiles successfully indexed forever in Global Sourcing Pool.</p>
                  </div>
                </div>

                {/* Extracted Details */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4 text-xs font-semibold text-slate-700">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Profile Collected</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Full Name</span>
                      <span className="text-sm font-bold text-slate-800">{uploadResult.candidate.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Email Address</span>
                      <span className="text-sm font-bold text-slate-800">{uploadResult.candidate.email}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Role</span>
                      <span className="text-slate-800 font-bold">{uploadResult.candidate.parsedResume?.currentRole || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Experience</span>
                      <span className="text-slate-800 font-bold">{uploadResult.candidate.parsedResume?.totalExperienceYears} Year(s)</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Parsed Skills ({uploadResult.candidate.parsedResume?.skills?.length || 0})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {uploadResult.candidate.parsedResume?.skills?.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 bg-white rounded border border-slate-200 text-[10px] text-slate-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Instant Matches display */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-600" /> Proactive Requirement Matches
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-400">Instant AI score assessment against active open client job roles</p>
                  </div>

                  {uploadResult.matches.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-slate-400 text-xs">
                      No open client requirements currently matching this candidate's skills.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {uploadResult.matches.map((match) => (
                        <div
                          key={match.requirement._id}
                          className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-extrabold text-slate-800 truncate">{match.requirement.title}</span>
                              <span className="text-xs font-semibold text-slate-400">• {match.requirement.clientName}</span>
                            </div>
                            
                            <p className="text-xs text-slate-500 font-medium line-clamp-1 italic">
                              "{match.analysis}"
                            </p>

                            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500 uppercase pt-0.5">
                              <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/50">
                                Match Score: {match.fitScore}%
                              </span>
                              <span className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-150">
                                {match.recommendation}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleInstantMatchSubmit(uploadResult.candidate._id, match.requirement._id, match)}
                            className="shrink-0 flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-indigo-200/50 hover:border-indigo-600 transition-all active:scale-[0.98]"
                          >
                            Submit <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submission Popup Modal */}
      {submissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-extrabold text-slate-800">
                🚀 Submit Candidate to Client Role
              </h3>
              <button
                onClick={() => setSubmissionModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Select Job Requirement *</label>
                <select
                  value={selectedReqId}
                  onChange={(e) => setSelectedReqId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  {requirements.map((req) => (
                    <option key={req._id} value={req._id}>
                      {req.title} ({req.clientId?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Submission Notes & Remarks</label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Enter remarks for the hiring pipeline, salary expectations, interview availability details..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setSubmissionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitCandidate}
                  disabled={submittingToReq}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  {submittingToReq ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    "Submit Candidate"
                  )}
                </button>
              </div>
            </div>
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
                  Please update your GOOGLE_API_KEY environment variable with a premium billing-enabled key to continue using AI parsing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
