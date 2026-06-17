"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Save, ArrowLeft, Tags, Loader2 } from "lucide-react";
import "react-quill-new/dist/quill.snow.css";
import toast from "react-hot-toast";

// Dynamically import Quill to avoid SSR window errors
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false, loading: () => <p>Loading editor...</p> });

const VARIABLE_TAGS = [
  { label: "Candidate Name", tag: "{{candidate_name}}" },
  { label: "Job Title", tag: "{{job_title}}" },
  { label: "Organization Name", tag: "{{company_name}}" },
  { label: "CTC / Salary", tag: "{{salary}}" },
  { label: "Joining Date", tag: "{{joining_date}}" },
  { label: "Employee Name", tag: "{{employee_name}}" },
  { label: "Net Pay", tag: "{{net_pay}}" },
];

export default function TemplateBuilder() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "offer_letter",
    subject: "",
    content: "",
    isDefault: true
  });

  const handleSave = async () => {
    if (!formData.name || !formData.content) {
      toast.error("Name and content are required");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Template saved successfully");
        router.push("/admin/organization/templates");
      } else {
        toast.error(data.message || "Failed to save template");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (tag) => {
    // Basic approach: append to content. 
    // A better approach involves using a Quill ref to insert at cursor, but this works for v1.
    setFormData(prev => ({ ...prev, content: prev.content + ` ${tag} ` }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex gap-6">
      {/* Main Editor Section */}
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
          <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Template
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Senior Dev Offer Letter"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="offer_letter">Offer Letter (PDF)</option>
                <option value="relieving_letter">Relieving Letter (PDF)</option>
                <option value="email_onboarding">Welcome Email</option>
                <option value="email_payslip">Payslip Email</option>
              </select>
            </div>
          </div>

          {formData.type.includes("email") && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Subject Line</label>
              <input 
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Welcome to {{company_name}}!"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Template Content</label>
            <div className="h-[500px] border border-slate-200 rounded-lg overflow-hidden">
              <ReactQuill 
                theme="snow" 
                value={formData.content} 
                onChange={(val) => setFormData({...formData, content: val})} 
                className="h-[450px]"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <input 
                type="checkbox" 
                id="isDefault" 
                checked={formData.isDefault}
                onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                className="rounded text-indigo-600 focus:ring-indigo-500"
             />
             <label htmlFor="isDefault" className="text-sm text-slate-700">Set as default template for this type</label>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Variables */}
      <div className="w-80 space-y-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 sticky top-6">
          <div className="flex items-center gap-2 mb-4 text-slate-800">
            <Tags className="h-5 w-5 text-indigo-500" />
            <h3 className="font-bold text-lg">Dynamic Variables</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Click a variable to append it to your template. The system will automatically replace these with real data.
          </p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {VARIABLE_TAGS.map((v, i) => (
              <button 
                key={i}
                onClick={() => insertVariable(v.tag)}
                className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
              >
                <div className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">{v.label}</div>
                <code className="text-xs text-slate-500 group-hover:text-indigo-500">{v.tag}</code>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
