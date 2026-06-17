"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Bell, Users, Building, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

const SendNotificationModal = ({ isOpen, onClose, onSave }) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);

    // Initial State
    const initialState = {
        title: "",
        message: "",
        priority: "medium",
        type: "system",
        audienceType: "individual",
        employees: [], // Selected employee IDs
        targetId: "", // Selected department ID
    };

    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (isOpen) {
            fetchOptions();
            setFormData(initialState);
        }
    }, [isOpen]);

    const fetchOptions = async () => {
        try {
            const [empResponse, deptResponse] = await Promise.all([
                fetch("/api/v1/admin/payroll/employees?limit=1000&status=Active").catch(() => null),
                fetch("/api/v1/admin/crm/departments?limit=100").catch(() => null)
            ]);

            if (empResponse && empResponse.ok) {
                const data = await empResponse.json();
                setEmployees(data.data || data.employees || []);
            }
            if (deptResponse && deptResponse.ok) {
                const data = await deptResponse.json();
                setDepartments(data.data || data.departments || []);
            }
        } catch (error) {
            console.error("Failed to fetch options", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (formData.audienceType === "individual" && formData.employees.length === 0) {
            toast.error(t('selectAtLeastOneEmployee') || "Please select at least one employee.");
            setLoading(false);
            return;
        }

        if (formData.audienceType === "team" && !formData.targetId) {
            toast.error(t('selectDepartment') || "Please select a department.");
            setLoading(false);
            return;
        }

        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            toast.error(error.message || t('failedToIssueNotification') || "Failed to send notification");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <Send className="w-6 h-6 text-indigo-500" />
                        {t('composeNotification') || "Compose Notification"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('notificationTitle') || "Notification Title"}</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder={t('eGWelcomeMessage') || "e.g. Server Maintenance"}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('notificationType') || "Type"}</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            >
                                <option value="system">{t('system') || "System"}</option>
                                <option value="event">{t('event') || "Event"}</option>
                                <option value="bonus">{t('bonus') || "Bonus"}</option>
                                <option value="alert">{t('alert') || "Alert"}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('priority') || "Priority"}</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            >
                                <option value="low">{t('low') || "Low"}</option>
                                <option value="medium">{t('medium') || "Medium"}</option>
                                <option value="high">{t('high') || "High"}</option>
                            </select>
                        </div>
                    </div>

                    {/* Target Audience */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('targetAudience') || "Target Audience"}</label>
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="audienceType"
                                    value="individual"
                                    checked={formData.audienceType === "individual"}
                                    onChange={() => setFormData({ ...formData, audienceType: "individual" })}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">{t('individualEmployees') || "Individual Employees"}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="audienceType"
                                    value="team"
                                    checked={formData.audienceType === "team"}
                                    onChange={() => setFormData({ ...formData, audienceType: "team" })}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">{t('entireDepartment') || "Entire Department"}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="audienceType"
                                    value="organization"
                                    checked={formData.audienceType === "organization"}
                                    onChange={() => setFormData({ ...formData, audienceType: "organization" })}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">{t('allEmployees') || "All Employees"}</span>
                            </label>
                        </div>

                        {formData.audienceType === "individual" && (
                            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                                {employees.length > 0 ? (
                                    <div className="space-y-2">
                                        {employees.map(emp => (
                                            <label key={emp._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.employees.includes(emp._id)}
                                                    onChange={e => {
                                                        const newIds = e.target.checked
                                                            ? [...formData.employees, emp._id]
                                                            : formData.employees.filter(id => id !== emp._id);
                                                        setFormData({ ...formData, employees: newIds });
                                                    }}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    {emp.personalDetails?.firstName} {emp.personalDetails?.lastName}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-2">{t('loadingEmployees') || "Loading employees..."}</p>
                                )}
                            </div>
                        )}

                        {formData.audienceType === "team" && (
                            <select
                                value={formData.targetId}
                                onChange={e => setFormData({ ...formData, targetId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                            >
                                <option value="">{t('selectDepartment') || "Select Department"}</option>
                                {departments.map(dept => (
                                    <option key={dept._id} value={dept._id}>{dept.departmentName}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('message') || "Message"}</label>
                        <textarea
                            value={formData.message}
                            required
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none resize-none"
                            placeholder={t('enterYourMessage') || "Enter your message here..."}
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {t('cancel') || "Cancel"}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg hover: transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {loading ? (t('sending') || "Sending...") : (t('sendNotification') || "Send Notification")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SendNotificationModal;
