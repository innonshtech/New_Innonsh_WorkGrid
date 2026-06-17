"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Plus, 
  Mail, 
  LayoutTemplate,
  Trash2,
  Edit,
  CheckCircle2
} from "lucide-react";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/v1/admin/templates");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type) => {
    if (type.includes("email")) return <Mail className="h-5 w-5 text-blue-500" />;
    return <FileText className="h-5 w-5 text-indigo-500" />;
  };

  const formatType = (type) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <LayoutTemplate className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Custom Templates</h1>
            <p className="text-slate-500 text-sm mt-1">Design your own Offer Letters, Payslips, and Emails.</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/admin/organization/templates/new")}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" /> Create Template
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <LayoutTemplate className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Templates Found</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            You haven't created any custom templates yet. The system is currently using the default standard templates.
          </p>
          <button
            onClick={() => router.push("/admin/organization/templates/new")}
            className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" /> Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template._id} className="bg-white rounded-2xl border border-slate-200 p-6 hover: transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-50 rounded-lg">
                  {getIconForType(template.type)}
                </div>
                {template.isDefault && (
                  <span className="flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Default
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{template.name}</h3>
              <p className="text-slate-500 text-sm mt-1 mb-4">{formatType(template.type)}</p>
              
              <div className="flex gap-2 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 flex justify-center items-center gap-2 text-sm text-indigo-600 bg-indigo-50 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                  <Edit className="h-4 w-4" /> Edit
                </button>
                <button className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
