"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContext";
import Link from "next/link";
import FnFSettlement from "@/components/payroll/fnf-settlement";

export default function ExitRequestDetails() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useSession();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState("");
    const [comments, setComments] = useState("");

    useEffect(() => {
        if (id) fetchRequest();
    }, [id]);

    const fetchRequest = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/employee/exit/${id}`);
            if (res.ok) {
                const data = await res.json();
                setRequest(data);
            } else {
                toast.error("Failed to load request");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (role, decision) => {
        try {
            setProcessing(decision);
            const outcome = role === 'manager'
                ? (decision === 'approve' ? 'ManagerApprove' : 'ManagerReject')
                : (decision === 'approve' ? 'HRApprove' : 'HRReject');

            const res = await fetch(`/api/v1/employee/exit/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    outcome,
                    approvedBy: user?._id || user?.id,
                    comments
                })
            });

            if (res.ok) {
                toast.success(`${role === 'manager' ? 'Manager' : 'HR'} review submitted`);
                fetchRequest();
                setComments("");
            } else {
                toast.error("Failed to submit review");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing("");
        }
    };

    const updateClearance = async (type, status) => {
        try {
            const res = await fetch(`/api/v1/employee/exit/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clearanceType: type,
                    status,
                    clearedBy: user?._id || user?.id,
                    remarks: "Cleared via dashboard"
                })
            });
            if (res.ok) {
                toast.success(`${type.toUpperCase()} clearance updated`);
                fetchRequest();
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading details...</div>;
    if (!request) return <div className="p-8 text-center text-red-500">Request not found</div>;

    const isManager = user?.role === "manager" || user?.role === "admin";
    const isHR = user?.role === "admin" || user?.role === "hr";

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <Link href="/employee/exit" className="inline-flex items-center text-slate-500 hover:text-slate-900 transition-colors mb-4">
                <ArrowLeft size={16} className="mr-2" /> Back to List
            </Link>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Resignation Request</h1>
                        <p className="text-slate-500 mt-1">
                            Employee: <span className="font-semibold text-slate-900">{request.employee?.personalDetails?.firstName} {request.employee?.personalDetails?.lastName}</span>
                        </p>
                        <p className="text-slate-500">
                            Designation: {request.employee?.jobDetails?.designation}
                        </p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${request.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        request.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                        {request.status.replace(/_/g, " ")}
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500">Resignation Date</div>
                        <div className="font-medium text-slate-900 mt-1">{new Date(request.resignationDate).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500">Last Working Date</div>
                        <div className="font-medium text-slate-900 mt-1">{new Date(request.lastWorkingDate).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500">Reason</div>
                        <div className="font-medium text-slate-900 mt-1">{request.reason}</div>
                    </div>
                </div>

                {request.comments && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-2">Employee Comments</h3>
                        <p className="text-slate-600 bg-slate-50 p-4 rounded-lg">{request.comments}</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Approval Workflow */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Approvals</h2>

                    {/* Manager Approval */}
                    <div className="mb-6 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-slate-900">Manager Approval</h3>
                            {request.managerApproval?.status === 'Approved' ? (
                                <span className="text-emerald-600 flex items-center gap-1 text-sm"><CheckCircle2 size={16} /> Approved</span>
                            ) : request.managerApproval?.status === 'Rejected' ? (
                                <span className="text-red-600 flex items-center gap-1 text-sm"><XCircle size={16} /> Rejected</span>
                            ) : (
                                <span className="text-amber-600 flex items-center gap-1 text-sm"><Clock size={16} /> Pending</span>
                            )}
                        </div>

                        {request.status === 'Pending' && isManager && (
                            <div className="mt-4 space-y-3">
                                <textarea
                                    className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Add comments (optional)..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApproval('manager', 'approve')}
                                        disabled={!!processing}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleApproval('manager', 'reject')}
                                        disabled={!!processing}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}
                        {request.managerApproval?.comments && (
                            <p className="text-sm text-slate-500 mt-2 italic">"{request.managerApproval.comments}"</p>
                        )}
                    </div>

                    {/* HR Approval */}
                    <div className="pb-0">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-slate-900">HR Approval</h3>
                            {request.hrApproval?.status === 'Approved' ? (
                                <span className="text-emerald-600 flex items-center gap-1 text-sm"><CheckCircle2 size={16} /> Approved</span>
                            ) : request.hrApproval?.status === 'Rejected' ? (
                                <span className="text-red-600 flex items-center gap-1 text-sm"><XCircle size={16} /> Rejected</span>
                            ) : (
                                <span className="text-slate-400 flex items-center gap-1 text-sm"><Clock size={16} /> Pending</span>
                            )}
                        </div>

                        {request.status === 'Manager_Approved' && isHR && (
                            <div className="mt-4 space-y-3">
                                <textarea
                                    className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Add comments (optional)..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApproval('hr', 'approve')}
                                        disabled={!!processing}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleApproval('hr', 'reject')}
                                        disabled={!!processing}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}
                        {request.hrApproval?.comments && (
                            <p className="text-sm text-slate-500 mt-2 italic">"{request.hrApproval.comments}"</p>
                        )}
                    </div>
                </div>

                {/* Clearance Checklist */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Clearance Checklist</h2>

                    {['it', 'finance', 'admin'].map((type) => (
                        <div key={type} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg mb-3 last:mb-0">
                            <div>
                                <h3 className="font-medium text-slate-900 uppercase text-sm tracking-wide">{type}</h3>
                                {request.clearanceStatus?.[type]?.updatedAt && (
                                    <p className="text-xs text-slate-400 mt-1">Updated: {new Date(request.clearanceStatus[type].updatedAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                                )}
                            </div>

                            {request.clearanceStatus?.[type]?.status === 'Cleared' ? (
                                <span className="text-emerald-600 flex items-center gap-1 text-sm font-medium"><CheckCircle2 size={16} /> Cleared</span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-sm italic mr-2">Pending</span>
                                    {isHR && (
                                        <button
                                            onClick={() => updateClearance(type, 'Cleared')}
                                            className="px-3 py-1 bg-white border border-slate-200 hover:border-indigo-300 text-xs font-medium rounded-md text-slate-600 hover:text-indigo-600 transition-all"
                                        >
                                            Mark Cleared
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                <FnFSettlement
                    exitRequestId={id}
                    employeeId={request.employee?._id}
                    isHR={isHR}
                    status={request.fnfStatus?.status}
                />
            </div>
        </div>
    );
}
