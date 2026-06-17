// components/modals/DocumentAdd.jsx
"use client"

import { useState } from "react";
import {
  X,
  Save,
  FileText,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function DocumentAdd({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    documentCategory: "", // New field
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [duplicateError, setDuplicateError] = useState("");

  // Predefined document categories
  const documentCategories = ["Personal", "Educational", "Professional", "Other"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user types
    setError("");
    setDuplicateError("");
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError("");
      setDuplicateError("");

      const res = await fetch("/api/v1/admin/crm/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setDuplicateError(data.error || "A document with this name already exists.");
          return;
        }
        throw new Error(data.error || "Failed to create document");
      }

      toast.success("Documents Created Successfully.")

      onSuccess();
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong while creating the document.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      documentCategory: "",
    });
    setError("");
    setDuplicateError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submitDisabled =
    isSubmitting ||
    !formData.name.trim() ||
    !formData.documentCategory; // Require documentCategory

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Toaster/>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-4 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add New Document
                </h2>
                <p className="text-slate-600 text-sm">
                  Create a new supported document for employee categories
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Messages */}
        {(error || duplicateError) && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-red-800">Error</h4>
                <p className="text-sm text-red-700 mt-1">{error || duplicateError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-slate-900">
                Document Details
              </h3>
            </div>

            {/* Document Category */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Document Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="documentCategory"
                  value={formData.documentCategory}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all appearance-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  <option value="">Select a category</option>
                  {documentCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <p className="text-xs text-slate-500">
                Select the category for this document
              </p>
            </div>

            {/* Document Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Document Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="e.g., Passport, Work Permit"
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-500">
                Enter a unique name for the document
              </p>
            </div>

            {/* Document Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-y"
                placeholder="e.g., Official identification document issued by the government"
                rows={4}
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-500">
                Provide a brief description of the document (optional)
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 sticky bottom-0 bg-white">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitDisabled}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}