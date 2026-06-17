"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Plus,
  Search,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  Tag,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import StaffingStepper from "./StaffingStepper";

export default function RequirementsList() {
  const router = useRouter();
  const [requirements, setRequirements] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentReqId, setCurrentReqId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    skillsRequired: "",
    minExperience: 0,
    maxExperience: 0,
    budgetRange: "",
    durationMonths: 0,
    openingsCount: 1,
    status: "open",
    description: "",
  });

  useEffect(() => {
    fetchRequirements();
    fetchClients();
  }, []);

  // Handle auto-open if clientId is present in URL
  useEffect(() => {
    if (clients.length > 0 && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryClientId = params.get("clientId");
      if (queryClientId) {
        const hasClient = clients.some(c => c._id === queryClientId);
        if (hasClient) {
          setFormData({
            clientId: queryClientId,
            title: "",
            skillsRequired: "",
            minExperience: 0,
            maxExperience: 0,
            budgetRange: "",
            durationMonths: 0,
            openingsCount: 1,
            status: "open",
            description: "",
          });
          setEditMode(false);
          setModalOpen(true);
        }
      }
    }
  }, [clients]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/staffing/requirements");
      const result = await res.json();
      if (result.success) {
        setRequirements(result.requirements || []);
      } else {
        toast.error(result.error || "Failed to load requirements.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while loading requirements.");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/v1/admin/staffing/clients");
      const result = await res.json();
      if (result.success) {
        setClients(result.clients?.filter(c => c.status === "active") || []);
      }
    } catch (err) {
      console.error("Fetch clients failed:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClick = () => {
    if (clients.length === 0) {
      toast.warning("Please onboard at least one active Client Company before adding a requirement.");
      return;
    }
    setFormData({
      clientId: clients[0]._id,
      title: "",
      skillsRequired: "",
      minExperience: 0,
      maxExperience: 0,
      budgetRange: "",
      durationMonths: 0,
      openingsCount: 1,
      status: "open",
      description: "",
    });
    setEditMode(false);
    setModalOpen(true);
  };

  const handleEditClick = (req) => {
    setFormData({
      clientId: req.clientId?._id || "",
      title: req.title,
      skillsRequired: Array.isArray(req.skillsRequired) ? req.skillsRequired.join(", ") : "",
      minExperience: req.minExperience || 0,
      maxExperience: req.maxExperience || 0,
      budgetRange: req.budgetRange || "",
      durationMonths: req.durationMonths || 0,
      openingsCount: req.openingsCount || 1,
      status: req.status || "open",
      description: req.description || "",
    });
    setCurrentReqId(req._id);
    setEditMode(true);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.clientId) {
      toast.error("Client and Job Title are required.");
      return;
    }

    try {
      let res, result;
      if (editMode) {
        res = await fetch(`/api/v1/admin/staffing/requirements/${currentReqId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        res = await fetch("/api/v1/admin/staffing/requirements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      result = await res.json();
      if (result.success) {
        toast.success(result.message || (editMode ? "Requirement updated successfully" : "Requirement created successfully"));
        setModalOpen(false);
        fetchRequirements();
      } else {
        toast.error(result.error || "Failed to save requirement.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving the requirement.");
    }
  };

  const handleDeleteClick = async (id, title) => {
    if (!confirm(`Are you sure you want to delete requirement "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/staffing/requirements/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message || "Requirement deleted successfully");
        fetchRequirements();
      } else {
        toast.error(result.error || "Failed to delete requirement.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting the requirement.");
    }
  };

  const filteredRequirements = requirements.filter(
    (req) =>
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.clientId?.name &&
        req.clientId.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      <StaffingStepper currentStep={2} />
      
      {/* Header and Add requirement */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Client Job Requirements
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Create, configure, and monitor job requisitions and contract roles from clients
          </p>
        </div>
        
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" /> Add Requirement
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex bg-white rounded-xl border border-slate-200 p-3 max-w-md items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Search by job title or client company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none border-none focus:ring-0 p-0.5"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl space-y-4 text-slate-400">
          <Briefcase className="w-12 h-12 opacity-35" />
          <p className="text-sm font-medium">No open requirements found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequirements.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 flex flex-col justify-between hover: transition- relative"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{req.title}</h3>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-300" />
                        <span>{req.clientId?.name || "Unknown Client"}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                      req.status === "open"
                        ? "bg-emerald-50 text-emerald-600"
                        : req.status === "closed"
                        ? "bg-rose-50 text-rose-500"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Sourcing parameters */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-3 border border-slate-100/50 text-xs font-semibold text-slate-600">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Experience</p>
                    <p className="text-slate-800">{req.minExperience} - {req.maxExperience} Yrs</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Budget / CTC</p>
                    <p className="text-slate-800 truncate" title={req.budgetRange}>{req.budgetRange || "Not declared"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Duration</p>
                    <p className="text-slate-800">{req.durationMonths ? `${req.durationMonths} Months` : "Long Term"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Openings</p>
                    <p className="text-slate-800">{req.openingsCount} Open Position(s)</p>
                  </div>
                </div>

                {req.skillsRequired && req.skillsRequired.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {req.skillsRequired.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {req.description && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brief Description</p>
                    <p className="text-xs font-medium text-slate-500 line-clamp-2">{req.description}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => router.push(`/admin/staffing/talent-pool?reqId=${req._id}`)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <Users className="w-3.5 h-3.5" /> Source
                  </button>
                  <button
                    onClick={() => router.push(`/admin/staffing/matching?reqId=${req._id}`)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AI Match
                  </button>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditClick(req)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(req._id, req.title)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4 sm:my-0">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-extrabold text-slate-800">
                {editMode ? "✏️ Edit Requirement" : "📋 Create Job Requirement"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Client Company *</label>
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Job Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Senior Angular Developer"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Required Skills * (comma-separated)</label>
                <input
                  type="text"
                  name="skillsRequired"
                  value={formData.skillsRequired}
                  onChange={handleInputChange}
                  placeholder="e.g. Angular, RxJS, TypeScript, CSS"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Experience Range (Min - Max Yrs)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="minExperience"
                      value={formData.minExperience}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                    <span className="text-slate-400 text-xs font-bold">to</span>
                    <input
                      type="number"
                      name="maxExperience"
                      value={formData.maxExperience}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Budget / Target CTC</label>
                  <input
                    type="text"
                    name="budgetRange"
                    value={formData.budgetRange}
                    onChange={handleInputChange}
                    placeholder="e.g. ₹8,00,000 - ₹12,00,000 L.P.A."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Openings Count</label>
                  <input
                    type="number"
                    name="openingsCount"
                    value={formData.openingsCount}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Contract (Months)</label>
                  <input
                    type="number"
                    name="durationMonths"
                    value={formData.durationMonths}
                    onChange={handleInputChange}
                    placeholder="0 = Permanent"
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Requirement Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="open">Open / Sourcing</option>
                    <option value="on-hold">On Hold</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Detailed Job Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter detailed job requirements, qualifications, shift timings, interview process, and responsibilities..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98] transition-all"
                >
                  {editMode ? "Update Details" : "Create Requirement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
