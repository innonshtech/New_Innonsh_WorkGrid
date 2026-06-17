"use client";

import React, { useState, useEffect } from "react";
import {
  GitGraph,
  Search,
  Building2,
  Briefcase,
  Users,
  Award,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle,
  X,
  FileText,
  User,
  ArrowRight,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import StaffingStepper from "./StaffingStepper";

export default function SubmissionsPipeline() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStageFilter, setActiveStageFilter] = useState("all");
  const [selectedSub, setSelectedSub] = useState(null);
  
  // Update Stage State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [updatingSubId, setUpdatingSubId] = useState(null);
  const [newStage, setNewStage] = useState("");
  const [stageNotes, setStageNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/staffing/submissions");
      const result = await res.json();
      if (result.success) {
        setSubmissions(result.submissions || []);
      } else {
        toast.error(result.error || "Failed to load pipeline submissions.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while loading submissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (subId, currentStage) => {
    setUpdatingSubId(subId);
    setNewStage(currentStage);
    setStageNotes("");
    setStatusModalOpen(true);
  };

  const handleUpdateStage = async () => {
    if (!updatingSubId || !newStage) return;

    try {
      setUpdating(true);
      const res = await fetch("/api/v1/admin/staffing/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updatingSubId,
          stage: newStage,
          notes: stageNotes,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(result.message || "Pipeline stage updated successfully!");
        setStatusModalOpen(false);
        fetchSubmissions();
        
        // Refresh details modal in place if currently open
        if (selectedSub && selectedSub._id === updatingSubId) {
          const updatedItem = {
            ...selectedSub,
            stage: result.submission.stage,
            statusHistory: result.submission.statusHistory,
            notes: result.submission.notes
          };
          setSelectedSub(updatedItem);
        }
      } else {
        toast.error(result.error || "Failed to update pipeline stage.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating stage.");
    } finally {
      setUpdating(false);
    }
  };

  const stagesList = [
    { key: "submitted", label: "Submitted", color: "border-t-slate-400 bg-slate-50/50" },
    { key: "l1-round", label: "L1 Tech Round", color: "border-t-indigo-400 bg-indigo-50/10" },
    { key: "l2-round", label: "L2 Tech Round", color: "border-t-purple-400 bg-purple-50/10" },
    { key: "client-interview", label: "Client Round", color: "border-t-amber-400 bg-amber-50/10" },
    { key: "offered", label: "Offered", color: "border-t-teal-400 bg-teal-50/10" },
    { key: "deployed", label: "Deployed", color: "border-t-emerald-500 bg-emerald-50/10" },
    { key: "rejected", label: "Rejected", color: "border-t-rose-500 bg-rose-50/10" },
    { key: "withdrawn", label: "Withdrawn", color: "border-t-slate-500 bg-slate-50/10" },
  ];

  // Group submissions by stage key for Kanban rendering
  const getSubmissionsByStage = (stageKey) => {
    return submissions.filter((sub) => sub.stage === stageKey);
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 90) return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    if (score >= 75) return "bg-blue-50 text-blue-600 border border-blue-100";
    if (score >= 60) return "bg-amber-50 text-amber-600 border border-amber-100";
    return "bg-rose-50 text-rose-500 border border-rose-100";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <StaffingStepper currentStep={5} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <GitGraph className="w-6 h-6 text-indigo-600" /> Sourcing Hiring Pipeline
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Monitor, shortlist, and track staffing deployments across client accounts
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
        </div>
      ) : (
        /* Kanban Board Scrollable Layout */
        <div className="flex flex-row gap-6 overflow-x-auto pb-4 custom-scrollbar min-w-full">
          {stagesList.map((stage) => {
            const stageSubs = getSubmissionsByStage(stage.key);
            
            return (
              <div
                key={stage.key}
                className="flex flex-col min-w-[280px] w-[280px] bg-slate-50 border border-slate-200/50 rounded-2xl p-4 space-y-4 max-h-[75vh] shrink-0"
              >
                {/* Column Header */}
                <div className={`border-t-4 ${stage.color} pt-2 flex items-center justify-between`}>
                  <span className="text-xs font-extrabold text-slate-800 tracking-tight">{stage.label}</span>
                  <span className="inline-flex px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-black rounded-full">
                    {stageSubs.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                  {stageSubs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-[10px] font-semibold border border-dashed border-slate-200 rounded-xl">
                      No candidates in this stage
                    </div>
                  ) : (
                    stageSubs.map((sub) => (
                      <div
                        key={sub._id}
                        onClick={() => setSelectedSub(sub)}
                        className="bg-white rounded-xl border border-slate-200 p-4 hover: hover:ring-1 hover:ring-indigo-100 transition-all cursor-pointer space-y-3 relative group"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                            {sub.candidateId?.name || "Unknown"}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 truncate">
                            {sub.requirementId?.title || "Role"}
                          </p>
                          <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 truncate">
                            <Building2 className="w-3 h-3 text-slate-300 shrink-0" />
                            <span>{sub.requirementId?.clientId?.name || "Client"}</span>
                          </div>
                        </div>

                        {sub.fitScore > 0 && (
                          <div className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase ${getScoreBadgeColor(sub.fitScore)}`}>
                            {sub.fitScore}% Match
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] font-bold">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStatusModal(sub._id, sub.stage);
                            }}
                            className="text-indigo-600 hover:text-indigo-500 font-extrabold"
                          >
                            Update Stage
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Side-Drawer / Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-extrabold text-slate-800">
                🔍 Pipeline Details & AI Report
              </h3>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              {/* Profile Overview */}
              <div className="flex items-start justify-between border-b border-slate-50 pb-4 gap-4">
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900 leading-tight">{selectedSub.candidateId?.name}</h4>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    Submitted for: <span className="text-slate-700 font-bold">{selectedSub.requirementId?.title}</span> • {selectedSub.requirementId?.clientId?.name}
                  </p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    Current stage: <span className="text-indigo-600 font-extrabold uppercase bg-indigo-50 px-2 py-0.5 rounded-full text-[10px] ml-1">{selectedSub.stage}</span>
                  </p>
                </div>

                {selectedSub.candidateId?.resumeUrl && (
                  <a
                    href={selectedSub.candidateId.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors shrink-0"
                  >
                    <FileText className="w-4 h-4 text-indigo-500" /> View CV
                  </a>
                )}
              </div>

              {/* AI matching report */}
              {selectedSub.fitScore > 0 && (
                <div className="space-y-4 bg-gradient-to-b from-indigo-50/50 to-indigo-100/10 rounded-2xl border border-indigo-150 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-600 animate-pulse" /> Gemini AI Matching Report
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${getScoreBadgeColor(selectedSub.fitScore)}`}>
                      {selectedSub.fitScore}% Match
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-700 leading-relaxed italic border-l-2 border-indigo-200 pl-3">
                    "{selectedSub.fitAnalysis}"
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold pt-2 border-t border-indigo-100/60">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-emerald-600 uppercase tracking-wider block">Core Matches</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedSub.fitStrengths?.map((str) => (
                          <span key={str} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px]">
                            + {str}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-amber-600 uppercase tracking-wider block">Gaps Detected</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedSub.fitGaps?.map((gap) => (
                          <span key={gap} className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px]">
                            ! {gap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks */}
              {selectedSub.notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Hiring Remarks</h4>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    {selectedSub.notes}
                  </p>
                </div>
              )}

              {/* Status Timeline History */}
              <div className="space-y-4 border-t border-slate-50 pt-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pipeline Progression</h4>
                <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-4">
                  {selectedSub.statusHistory?.map((hist, idx) => (
                    <div key={idx} className="relative space-y-1">
                      {/* Timeline dot */}
                      <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white"></div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 uppercase">{hist.stage}</span>
                        <span className="text-[9px] font-semibold text-slate-400">
                          {new Date(hist.changedAt).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: "numeric", minute: "numeric", day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 italic">"{hist.notes || 'Pipeline transitioned'}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end bg-slate-50 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => handleOpenStatusModal(selectedSub._id, selectedSub.stage)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl active:scale-[0.98] transition-all"
              >
                Promote Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Stage Popup Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-extrabold text-slate-800">
                ⚙️ Update Pipeline Transition
              </h3>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Pipeline Stage *</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="submitted">Submitted to client</option>
                    <option value="l1-round">L1 Tech Round</option>
                    <option value="l2-round">L2 Tech Round</option>
                    <option value="client-interview">Client Interview Round</option>
                    <option value="offered">Offered</option>
                    <option value="deployed">Deployed / Joined</option>
                    <option value="rejected">Rejected by client</option>
                    <option value="withdrawn">Withdrawn by candidate</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Transition Remarks & Notes</label>
                <textarea
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  placeholder="Provide interview details, comments from hiring manager, or compensation negotiations..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStage}
                  disabled={updating}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  {updating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-white rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    "Save Progress"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
