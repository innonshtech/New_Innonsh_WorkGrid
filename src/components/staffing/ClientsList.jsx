"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  Mail,
  Phone,
  Globe,
  Edit2,
  Trash2,
  X,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import StaffingStepper from "./StaffingStepper";

export default function ClientsList() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentClientId, setCurrentClientId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    website: "",
    status: "active",
    notes: "",
    // Requirement optional fields
    addFirstRequirement: false,
    reqTitle: "",
    reqSkills: "",
    reqMinExp: "0",
    reqMaxExp: "0",
    reqBudget: "",
    reqOpenings: "1",
    reqDescription: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/staffing/clients");
      const result = await res.json();
      if (result.success) {
        setClients(result.clients || []);
      } else {
        toast.error(result.error || "Failed to load clients.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while loading clients.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      status: "active",
      notes: "",
      addFirstRequirement: false,
      reqTitle: "",
      reqSkills: "",
      reqMinExp: "0",
      reqMaxExp: "0",
      reqBudget: "",
      reqOpenings: "1",
      reqDescription: "",
    });
    setEditMode(false);
    setModalOpen(true);
  };

  const handleEditClick = (client) => {
    setFormData({
      name: client.name,
      contactPerson: client.contactPerson || "",
      email: client.email || "",
      phone: client.phone || "",
      website: client.website || "",
      status: client.status || "active",
      notes: client.notes || "",
    });
    setCurrentClientId(client._id);
    setEditMode(true);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Company Name is required.");
      return;
    }

    try {
      let res, result;
      const clientPayload = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        status: formData.status,
        notes: formData.notes,
      };

      if (editMode) {
        res = await fetch(`/api/v1/admin/staffing/clients/${currentClientId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientPayload),
        });
      } else {
        res = await fetch("/api/v1/admin/staffing/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientPayload),
        });
      }

      result = await res.json();
      if (result.success) {
        if (!editMode && formData.addFirstRequirement) {
          try {
            const reqRes = await fetch("/api/v1/admin/staffing/requirements", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientId: result.client._id,
                title: formData.reqTitle,
                skillsRequired: formData.reqSkills,
                minExperience: Number(formData.reqMinExp) || 0,
                maxExperience: Number(formData.reqMaxExp) || 0,
                budgetRange: formData.reqBudget,
                openingsCount: Number(formData.reqOpenings) || 1,
                description: formData.reqDescription,
              }),
            });
            const reqResult = await reqRes.json();
            if (reqResult.success) {
              toast.success(`Client "${formData.name}" onboarded & Requirement created successfully!`);
            } else {
              toast.warning(`Client created, but first requirement failed: ${reqResult.error}`);
            }
          } catch (reqErr) {
            console.error("Requirement creation error:", reqErr);
            toast.warning(`Client created, but failed to create first requirement.`);
          }
        } else {
          toast.success(result.message || (editMode ? "Client updated successfully" : "Client created successfully"));
        }
        setModalOpen(false);
        fetchClients();
      } else {
        toast.error(result.error || "Failed to save client.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving the client.");
    }
  };

  const handleDeleteClick = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will remove all matching reference logs.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/staffing/clients/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message || "Client deleted successfully");
        fetchClients();
      } else {
        toast.error(result.error || "Failed to delete client.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting the client.");
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.contactPerson &&
        client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      <StaffingStepper currentStep={1} />
      
      {/* Header and Add client */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Client Company CRM
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Onboard client companies, contract accounts, and contact persons
          </p>
        </div>
        
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" /> Add Client Company
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex bg-white rounded-xl border border-slate-200 p-3 max-w-md items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Search by company name or contact person..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none border-none focus:ring-0 p-0.5"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl space-y-4 text-slate-400">
          <Building2 className="w-12 h-12 opacity-35" />
          <p className="text-sm font-medium">No clients found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 flex flex-col justify-between hover: transition- relative"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{client.name}</h3>
                      <p className="text-xs font-semibold text-slate-400">
                        Contact: {client.contactPerson || "Not specified"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                      client.status === "active"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {client.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-semibold text-slate-500 border-t border-slate-50 pt-4">
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${client.email}`} className="hover:text-indigo-600 truncate">{client.email}</a>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${client.phone}`} className="hover:text-indigo-600">{client.phone}</a>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <a
                        href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-indigo-600 truncate"
                      >
                        {client.website}
                      </a>
                    </div>
                  )}
                </div>

                {client.notes && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company Notes</p>
                    <p className="text-xs font-medium text-slate-600 line-clamp-2">{client.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-4">
                <button
                  onClick={() => router.push(`/admin/staffing/requirements?clientId=${client._id}`)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Requirement
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditClick(client)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(client._id, client.name)}
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
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4 sm:my-0">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-extrabold text-slate-800">
                {editMode ? "✏️ Edit Client Company" : "🏢 Onboard Client Company"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Company Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. TCS Digital, Wipro Limited"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. contact@client.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Website</label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="e.g. www.client.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Contract & Sourcing Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Enter details like contract start date, specific pricing, tech stack, SLA expectations..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {/* Optional Job Requirement Toggle */}
              {!editMode && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="addFirstRequirement"
                      checked={formData.addFirstRequirement}
                      onChange={(e) => setFormData(prev => ({ ...prev, addFirstRequirement: e.target.checked }))}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                    />
                    <span className="text-xs font-extrabold text-indigo-950">💼 Add First Job Requirement Now?</span>
                  </label>

                  {formData.addFirstRequirement && (
                    <div className="bg-indigo-50/40 rounded-2xl border border-indigo-100 p-4 space-y-3 animate-in slide-in-from-top-3 duration-250">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider">Job Requirement Title *</label>
                        <input
                          type="text"
                          name="reqTitle"
                          value={formData.reqTitle}
                          onChange={handleInputChange}
                          placeholder="e.g. Senior Angular Developer"
                          required={formData.addFirstRequirement}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider">Required Skills (comma-separated)</label>
                        <input
                          type="text"
                          name="reqSkills"
                          value={formData.reqSkills}
                          onChange={handleInputChange}
                          placeholder="e.g. Angular, TypeScript, CSS"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider">Experience (Min - Max Yrs)</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              name="reqMinExp"
                              value={formData.reqMinExp}
                              onChange={handleInputChange}
                              min="0"
                              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 outline-none"
                            />
                            <span className="text-slate-400 text-xs">-</span>
                            <input
                              type="number"
                              name="reqMaxExp"
                              value={formData.reqMaxExp}
                              onChange={handleInputChange}
                              min="0"
                              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 outline-none"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider">Openings Count</label>
                          <input
                            type="number"
                            name="reqOpenings"
                            value={formData.reqOpenings}
                            onChange={handleInputChange}
                            min="1"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider">Budget / Target CTC</label>
                          <input
                            type="text"
                            name="reqBudget"
                            value={formData.reqBudget}
                            onChange={handleInputChange}
                            placeholder="e.g. ₹8,00,000 - ₹12,00,000 L.P.A."
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider">Brief Description</label>
                          <textarea
                            name="reqDescription"
                            value={formData.reqDescription}
                            onChange={handleInputChange}
                            placeholder="Shift details, roles, etc..."
                            rows={1.5}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  {editMode ? "Update Details" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
