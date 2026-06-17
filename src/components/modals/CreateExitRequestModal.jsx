import { useState } from "react";
import { X, Save, LogOut, AlertCircle, Loader2 } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";

export default function CreateExitRequestModal({ isOpen, onClose, onSuccess }) {
    const { user } = useSession();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        resignationDate: new Date().toISOString().split('T')[0],
        lastWorkingDate: "",
        reason: "",
        comments: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setError("");

            if (!formData.lastWorkingDate || !formData.reason) {
                setError(t("fillRequiredFields"));
                setIsSubmitting(false);
                return;
            }

            const endpoint = user?.role === 'employee' ? "/api/v1/employee/exit" : "/api/v1/admin/exit";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    employee: user?._id || user?.id,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to submit request");
            }

            onSuccess();
            onClose();
            setFormData({ resignationDate: new Date().toISOString().split('T')[0], lastWorkingDate: "", reason: "", comments: "" });
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
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <LogOut size={24} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">{t("submitResignation")}</h2>
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t("resignationDate")}</label>
                            <input type="date" name="resignationDate" value={formData.resignationDate} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t("lastWorkingDate")} *</label>
                            <input type="date" name="lastWorkingDate" value={formData.lastWorkingDate} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" min={new Date().toISOString().split('T')[0]} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t("reasonForLeaving")} *</label>
                        <select name="reason" value={formData.reason} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white">
                            <option value="">{t("selectReason")}</option>
                            <option value="Better Opportunity">{t("betterOpportunity")}</option>
                            <option value="Personal Reasons">{t("personalReasons")}</option>
                            <option value="Relocation">{t("relocation")}</option>
                            <option value="Higher Education">{t("higherEducation")}</option>
                            <option value="Health Issues">{t("healthIssues")}</option>
                            <option value="Other">{t("other")}</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t("comments")}</label>
                        <textarea name="comments" value={formData.comments} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none h-24" placeholder={t("additionalComments")} />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors">
                        {t("cancel")}
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {t("submitRequest")}
                    </button>
                </div>
            </div>
        </div>
    );
}
