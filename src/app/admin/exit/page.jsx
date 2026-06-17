"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";
import CreateExitRequestModal from "@/components/modals/CreateExitRequestModal";
import Link from "next/link";

export default function ExitPage() {
    const { user } = useSession();
    const { t } = useLanguage();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState("");

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            if (filterStatus) query.append("status", filterStatus);
            if (user?.role === "employee") query.append("employee", user._id || user.id);

            const res = await fetch(`/api/v1/admin/exit?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch exit requests", error);
            toast.error(t("failedLoadRequests"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchRequests();
        }
    }, [user, filterStatus]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t("exitManagement")}</h1>
                    <p className="text-slate-500">{t("manageExitDesc")}</p>
                </div>
                {user?.role === "employee" && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium hover:"
                    >
                        <LogOut size={18} />
                        {t("submitResignation")}
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder={t("searchRequests")} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-slate-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="">{t("allStatus")}</option>
                            <option value="Pending">{t("pending")}</option>
                            <option value="Manager_Approved">{t("manager_approved")}</option>
                            <option value="HR_Approved">{t("hr_approved")}</option>
                            <option value="Completed">{t("completed")}</option>
                            <option value="Rejected">{t("rejected")}</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">{t("employee")}</th>
                                <th className="px-6 py-3">{t("resignationDate")}</th>
                                <th className="px-6 py-3">{t("lastWorkingDate")}</th>
                                <th className="px-6 py-3">{t("status")}</th>
                                <th className="px-6 py-3 text-right">{t("action")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">{t("loadingRequests")}</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">{t("noExitRequests")}</td></tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                                                    {req.employee?.personalDetails?.firstName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{req.employee?.personalDetails?.firstName} {req.employee?.personalDetails?.lastName}</div>
                                                    <div className="text-xs text-slate-500">{req.employee?.jobDetails?.designation}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{new Date(req.resignationDate).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</td>
                                        <td className="px-6 py-4">{new Date(req.lastWorkingDate).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${req.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    req.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        req.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                            'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                {t(req.status?.toLowerCase()) || req.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/admin/exit/${req._id}`} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                                                {t("viewDetails")}
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateExitRequestModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchRequests();
                    toast.success(t("resignationSubmitted"));
                }}
            />
        </div>
    );
}
