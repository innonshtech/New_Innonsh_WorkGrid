"use client";
import { useState } from "react";
import { X, Save, MessageSquare, AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

export default function CreateTicketModal({ isOpen, onClose, onSuccess, employeeId }) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        subject: "",
        category: "General",
        priority: "Medium",
        description: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        console.log("CreateTicketModal: Submitting with employeeId:", employeeId);
        console.log("CreateTicketModal: FormData:", formData);
        try {
            setIsSubmitting(true);
            setError("");

            if (!formData.subject || !formData.description) {
                setError("Please fill in all required fields.");
                setIsSubmitting(false);
                return;
            }

            const payload = {
                ...formData,
                employee: employeeId, // Pass the employee ID
            };
            console.log("CreateTicketModal: Payload:", payload);

            const res = await fetch("/api/v1/admin/helpdesk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create ticket");
            }

            onSuccess(); // Parent handles toast
            onClose();
            setFormData({ subject: "", category: "General", priority: "Medium", description: "" });
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
                            <MessageSquare size={24} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">{t("raiseTicket")}</h2>
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
                        <label className="text-sm font-medium text-gray-700">{t("subject") || "Subject"} *</label>
                        <input name="subject" value={formData.subject} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder={t("enterSubject") || "e.g. Issue with Payroll"} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t("category") || "Category"}</label>
                            <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                                <option value="IT">{t("itSupport") || "IT Support"}</option>
                                <option value="Payroll">{t("payroll") || "Payroll"}</option>
                                <option value="HR">{t("hr") || "HR"}</option>
                                <option value="Leave">{t("leave") || "Leave"}</option>
                                <option value="General">{t("general") || "General"}</option>
                                <option value="Other">{t("other") || "Other"}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t("priority") || "Priority"}</label>
                            <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                                <option value="Low">{t("low") || "Low"}</option>
                                <option value="Medium">{t("medium") || "Medium"}</option>
                                <option value="High">{t("high") || "High"}</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t("description") || "Description"} *</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-32" placeholder={t("describeIssue") || "Describe your issue..."} />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors">
                        {t("cancel")}
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {t("submitTicket") || "Submit Ticket"}
                    </button>
                </div>
            </div>
        </div>
    );
}
