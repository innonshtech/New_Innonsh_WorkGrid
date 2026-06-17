"use client";
import { useState } from "react";
import { X, Save, UploadCloud, AlertCircle, Loader2, File } from "lucide-react";
import { toast } from "sonner";

export default function UploadDocumentModal({ isOpen, onClose, onSuccess, userId }) {
    const [formData, setFormData] = useState({
        title: "",
        category: "Policies",
        fileUrl: "", // We'll store Base64 here for simplicity
    });
    const [fileName, setFileName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError("File size must be less than 5MB");
            return;
        }

        setFileName(file.name);
        setError("");

        // Convert to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, fileUrl: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setError("");

            if (!formData.title || !formData.fileUrl) {
                setError("Please provide a title and select a file.");
                setIsSubmitting(false);
                return;
            }

            const payload = {
                ...formData,
                uploadedBy: userId,
            };

            const res = await fetch("/api/handbook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to upload document");
            }

            onSuccess();
            onClose();
            setFormData({ title: "", category: "Policies", fileUrl: "" });
            setFileName("");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg transform transition-all">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <UploadCloud size={24} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Document Title *</label>
                        <input name="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="e.g. Employee Handbook 2024" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                            <option value="Policies">Policies</option>
                            <option value="Guides">Guides</option>
                            <option value="Forms">Forms</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">File (Max 5MB) *</label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative cursor-pointer">
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.png,.jpg"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {fileName ? (
                                <div className="flex flex-col items-center gap-2 text-indigo-600">
                                    <File size={32} />
                                    <span className="font-medium text-sm break-all">{fileName}</span>
                                    <span className="text-xs text-indigo-400">Click to change</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <UploadCloud size={32} />
                                    <span className="font-medium text-sm">Click to upload file</span>
                                    <span className="text-xs">PDF, Word, or Images</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Upload
                    </button>
                </div>
            </div>
        </div>
    );
}
