"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import { Gift, Plus, Search, CheckCircle2, XCircle, Clock, Trash2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import IssueBonusModal from "@/components/modals/IssueBonusModal";

export default function BonusManagementPage() {
    const { user } = useSession();
    const [bonuses, setBonuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("active"); // active, history
    const [searchTerm, setSearchTerm] = useState("");

    const isAdmin = user?.role === "admin";

    useEffect(() => {
        if (user) fetchBonuses();
    }, [user]);

    const fetchBonuses = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/v1/admin/payroll/bonuses");
            if (res.ok) {
                const data = await res.json();
                setBonuses(data.bonuses || []);
            } else {
                toast.error("Failed to fetch bonuses");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error loading data");
        } finally {
            setLoading(false);
        }
    };

    const handleIssueBonus = async (formData) => {
        try {
            const res = await fetch("/api/v1/admin/payroll/bonuses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                fetchBonuses();
                return true;
            } else {
                const data = await res.json();
                throw new Error(data.message || "Failed to create bonus");
            }
        } catch (error) {
            throw error; // Let modal handle error toast
        }
    };

    const handleUpdateStatus = async (id, status) => {
        if (!confirm(`Are you sure you want to ${status === 'Approved' ? 'approve' : 'reject'} this bonus?`)) return;

        try {
            const res = await fetch(`/api/v1/admin/payroll/bonuses/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                toast.success(`Bonus ${status.toLowerCase()} successfully`);
                fetchBonuses();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("Error updating status");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this bonus request?")) return;

        try {
            const res = await fetch(`/api/v1/admin/payroll/bonuses/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Bonus deleted successfully");
                fetchBonuses();
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to delete bonus");
            }
        } catch (error) {
            toast.error("Error deleting bonus");
        }
    };

    const filteredBonuses = bonuses.filter(bonus => {
        const matchesSearch = bonus.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bonus.type.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === "active") {
            return matchesSearch && (bonus.status === "Pending" || bonus.status === "Approved");
        } else {
            return matchesSearch && (bonus.status === "Paid" || bonus.status === "Cancelled" || bonus.status === "Rejected");
        }
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case "Approved":
                return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
            case "Paid":
                return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3" /> Paid</span>;
            case "Pending":
                return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center w-fit gap-1"><Clock className="w-3 h-3" /> Pending</span>;
            case "Cancelled":
            case "Rejected":
                return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center w-fit gap-1"><XCircle className="w-3 h-3" /> {status}</span>;
            default:
                return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Gift className="w-8 h-8 text-pink-600" />
                        Bonus & Incentives
                    </h1>
                    <p className="text-gray-500 mt-1">Manage employee rewards, bonuses, and incentives.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:"
                    >
                        <Plus className="w-4 h-4" />
                        Issue Bonus
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                    <div className="flex bg-gray-200 p-1 rounded-lg w-fit">
                        <button
                            onClick={() => setActiveTab("active")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "active" ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            Active & Pending
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "history" ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            History
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search bonuses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none w-full md:w-64"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading bonuses...</div>
                ) : filteredBonuses.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center text-gray-500">
                        <Gift className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="font-medium">No bonuses found</p>
                        <p className="text-sm mt-1">Try changing tabs or search filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 bg-gray-50/30">
                                    <th className="px-6 py-4 font-semibold">Title/Type</th>
                                    <th className="px-6 py-4 font-semibold">Details</th>
                                    <th className="px-6 py-4 font-semibold">Target Audience</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    {isAdmin && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredBonuses.map((bonus) => (
                                    <tr key={bonus._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{bonus.title}</div>
                                            <div className="text-xs text-gray-500">{bonus.type}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{new Date(bonus.paymentDate).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-sm text-gray-600 truncate" title={bonus.description}>{bonus.description || "-"}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium text-gray-700">{bonus.targetAudience}</span>
                                                {bonus.targetAudience === 'Individual' && (
                                                    <span className="text-xs text-gray-500">{bonus.employees?.length || 0} Employees</span>
                                                )}
                                                {bonus.targetAudience === 'Department' && (
                                                    <span className="text-xs text-gray-500">{bonus.department?.departmentName || "Unknown Dept"}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">
                                                {bonus.issuanceType === 'Fixed'
                                                    ? `$${bonus.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}`
                                                    : `${bonus.amount}% of ${bonus.percentageBasis}`
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(bonus.status)}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {bonus.status === 'Pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateStatus(bonus._id, 'Approved')}
                                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(bonus._id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {bonus.status === 'Approved' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(bonus._id, 'Paid')}
                                                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Mark Paid"
                                                        >
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <IssueBonusModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleIssueBonus}
            />
        </div>
    );
}
