"use client";

import { useState, useEffect } from "react";
import { Check, X, Clock, Calendar, Search, Filter } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { useSession } from "@/context/SessionContext";

export default function AdminOTApprovals() {
    const { user } = useSession();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("Pending");

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/admin/payroll/overtime?status=${filterStatus}`);
            const data = await res.json();
            if (data.success) {
                setRequests(data.requests);
            }
        } catch (error) {
            toast.error("Failed to fetch OT requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        const adminNotes = status === 'Rejected' ? prompt("Reason for rejection:") : "Approved by Admin";
        if (status === 'Rejected' && !adminNotes) return;

        try {
            const res = await fetch(`/api/v1/admin/payroll/overtime/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminNotes, approvedBy: user?.id })
            });
            if (res.ok) {
                toast.success(`Request ${status} successfully`);
                fetchRequests();
            } else {
                const data = await res.json();
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Process failed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Overtime Approvals</h2>
                    <p className="text-sm text-slate-500">Review and approve employee overtime requests</p>
                </div>
                <div className="flex gap-2">
                    {['Pending', 'Approved', 'Rejected'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Hours</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Reason</th>
                            {filterStatus === 'Pending' && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>}
                            {filterStatus !== 'Pending' && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Processed At</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 animate-pulse">Loading requests...</td></tr>
                        ) : requests.length > 0 ? requests.map((r) => (
                            <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                                            {r.employee?.personalDetails?.firstName?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{r.employee?.personalDetails?.firstName} {r.employee?.personalDetails?.lastName}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{r.employee?.employeeId}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-600">{format(new Date(r.date), 'dd MMM yyyy')}</td>
                                <td className="px-6 py-4 text-sm font-bold text-indigo-600">{r.hours} Hrs</td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-slate-600 truncate max-w-xs">{r.reason}</p>
                                </td>
                                <td className="px-6 py-4">
                                    {filterStatus === 'Pending' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction(r._id, 'Approved')}
                                                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleAction(r._id, 'Rejected')}
                                                className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-slate-400 font-medium italic">
                                            {format(new Date(r.updatedAt), 'dd MMM, HH:mm')}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">No {filterStatus.toLowerCase()} requests found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
