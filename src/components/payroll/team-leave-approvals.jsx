'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircle2, XCircle, Clock,
    Search, Filter, Loader2,
    MessageSquare, User, Calendar,
    ChevronRight, AlertCircle, Info,
    MoreHorizontal
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useSession } from '@/context/SessionContext';

export default function TeamLeaveApprovals() {
    const { user } = useSession();
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('Pending');
    const [activeTab, setActiveTab] = useState('leaves');
    const [regRequests, setRegRequests] = useState([]);

    useEffect(() => {
        if (user) {
            if (activeTab === 'leaves') fetchApplications();
            else fetchAttendanceRequests();
        }
    }, [filterStatus, user, activeTab]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/admin/payroll/leave-applications?status=${filterStatus}&managerId=${user.id}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
            });
            if (!res.ok) throw new Error("Failed to fetch applications");
            const data = await res.json();
            setApplications(data.applications || []);
        } catch (error) {
            toast.error("Error loading leave applications");
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/admin/approvals/attendance?status=${filterStatus}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
            if (!res.ok) throw new Error("Failed to fetch attendance requests");
            const data = await res.json();
            setRegRequests(data.requests || []);
        } catch (error) {
            toast.error("Error loading attendance requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (appId, status, reason = '') => {
        try {
            setActionLoading(true);
            const res = await fetch(`/api/v1/admin/payroll/leave-applications/${appId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    rejectionReason: reason,
                    approvedBy: user?.id
                })
            });

            if (!res.ok) throw new Error(`Failed to ${status.toLowerCase()} leave`);

            toast.success(`Leave ${status.toLowerCase()}ed successfully`);
            setShowRejectModal(false);
            setRejectionReason('');
            fetchApplications();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRegAction = async (requestId, status, reason = '') => {
        try {
            setActionLoading(true);
            const res = await fetch(`/api/v1/admin/approvals/attendance`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId,
                    status,
                    remarks: reason
                })
            });

            if (!res.ok) throw new Error(`Failed to ${status.toLowerCase()} request`);

            toast.success(`Request ${status.toLowerCase()}ed successfully`);
            setShowRejectModal(false);
            setRejectionReason('');
            fetchAttendanceRequests();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const openRejectModal = (app) => {
        setSelectedApp(app);
        setShowRejectModal(true);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-end gap-4 bg-white p-6 rounded-2xl border border-slate-200">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 bg-indigo-50/50 p-1 rounded-xl self-end">
                        <button
                            onClick={() => setActiveTab('leaves')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'leaves' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Leave Apps
                        </button>
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'attendance' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Attendance
                        </button>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {['Pending', 'Approved', 'Rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterStatus === status
                                    ? 'bg-white text-indigo-600 border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <p className="text-sm text-slate-500 font-medium font-mono uppercase tracking-widest">Scanning Team Requests...</p>
                    </div>
                ) : (activeTab === 'leaves' && applications.length === 0) || (activeTab === 'attendance' && regRequests.length === 0) ? (
                    <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-6 bg-slate-50 rounded-full border border-slate-100">
                            <CheckCircle2 className="w-10 h-10 text-slate-300" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">No {filterStatus} Requests</p>
                            <p className="text-xs text-slate-500 mt-1">Everything is cleared! No requests found in this category.</p>
                        </div>
                    </div>
                ) : activeTab === 'leaves' ? (
                    /* Leave Applications Table */
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Employee</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Type & Duration</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Dates</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Reason</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {applications.map((app) => (
                                    <tr key={app._id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-xs">
                                                    {app.employee?.personalDetails?.firstName[0]}
                                                    {app.employee?.personalDetails?.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{app.employee?.personalDetails?.firstName} {app.employee?.personalDetails?.lastName}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono">{app.employee?.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{app.leaveType}</span>
                                                <p className="text-sm font-black text-slate-900">{app.totalDays} Days</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                <span>{format(new Date(app.startDate), 'MMM dd')}</span>
                                                <ChevronRight className="w-3 h-3 text-slate-300" />
                                                <span>{format(new Date(app.endDate), 'MMM dd')}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 font-mono">{format(new Date(app.startDate), 'yyyy')}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="max-w-[200px]">
                                                <p className="text-sm text-slate-600 italic line-clamp-2">"{app.reason}"</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {app.status === 'Pending' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleAction(app._id, 'Approved')}
                                                        disabled={actionLoading}
                                                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openRejectModal(app)}
                                                        disabled={actionLoading}
                                                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all border border-rose-100"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-tighter ${getStatusBadge(app.status)}`}>
                                                        {app.status}
                                                    </div>
                                                    {app.status === 'Rejected' && app.rejectionReason && (
                                                        <p className="text-[9px] text-rose-400 italic font-medium max-w-[100px] truncate">"{app.rejectionReason}"</p>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Attendance Requests Table */
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Employee</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Request Type</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">For Date</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Reason</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {regRequests.map((req) => (
                                    <tr key={req._id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-xs">
                                                    {req.employee?.personalDetails?.firstName[0]}
                                                    {req.employee?.personalDetails?.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{req.employee?.personalDetails?.firstName} {req.employee?.personalDetails?.lastName}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono">{req.employee?.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter border ${
                                                    req.type === 'Half-Day' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                                                }`}>
                                                    {req.type}
                                                </span>
                                                {req.type === 'Half-Day' && req.halfDaySlot !== 'None' && (
                                                    <span className="ml-1.5 text-[9px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 uppercase">
                                                        {req.halfDaySlot === 'First Half' ? '1st Half' : '2nd Half'}
                                                    </span>
                                                )}
                                                <p className="text-xs font-bold text-slate-400 uppercase mt-1">Paid Request</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                                                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>{format(new Date(req.date), 'MMMM dd, yyyy')}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="max-w-[250px]">
                                                <p className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">"{req.reason}"</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {req.status === 'Pending' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleRegAction(req._id, 'Approved')}
                                                        disabled={actionLoading}
                                                        className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openRejectModal(req)}
                                                        disabled={actionLoading}
                                                        className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all border border-rose-100"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-tighter ${getStatusBadge(req.status)}`}>
                                                        {req.status}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300 border border-slate-200">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 mx-auto border border-rose-100">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 text-center mb-2">Reject Request</h3>
                            <p className="text-sm text-slate-500 text-center mb-8">
                                Provide a reason for rejecting the request from
                                <span className="font-bold text-slate-900"> {selectedApp?.employee?.personalDetails?.firstName}</span>.
                            </p>

                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Ex: Project deadline approaching, insufficient team coverage..."
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none min-h-[120px]"
                                autoFocus
                            />

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-all"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={() => {
                                        if (activeTab === 'leaves') handleAction(selectedApp._id, 'Rejected', rejectionReason);
                                        else handleRegAction(selectedApp._id, 'Rejected', rejectionReason);
                                    }}
                                    disabled={!rejectionReason.trim() || actionLoading}
                                    className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Rejection"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
