"use client";

import React, { useState, useEffect } from "react";
import {
    CheckCircle,
    XCircle,
    Eye,
    Search,
    Filter,
    Clock,
    Calendar,
    MessageSquare,
    ChevronRight,
    Loader2,
    X,
    User,
    UserCheck,
    Users
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSession } from "@/context/SessionContext";

const TimesheetApprovals = () => {
    const { user } = useSession();
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTimesheet, setSelectedTimesheet] = useState(null);
    const [entries, setEntries] = useState([]);
    const [adminNotes, setAdminNotes] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("Submitted");
    
    useEffect(() => {
        fetchTimesheets();
    }, [statusFilter]);

    const fetchTimesheets = async () => {
        try {
            setLoading(true);
            const url = `/api/v1/admin/tasks/timesheets?status=${statusFilter}`;
            const res = await fetch(url, { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setTimesheets(data.timesheets);
            }
        } catch (error) {
            toast.error("Failed to fetch timesheets");
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (timesheet) => {
        try {
            const res = await fetch(`/api/v1/admin/tasks/timesheets?employeeId=${timesheet.employee._id || timesheet.employee.id}&weekStartDate=${timesheet.weekStartDate}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setEntries(data.entries);
                setSelectedTimesheet(timesheet);
                setAdminNotes(timesheet.adminNotes || timesheet.rejectionReason || "");
            }
        } catch (error) {
            toast.error("Failed to fetch details");
        }
    };

    const handleAction = async (status) => {
        try {
            const res = await fetch(`/api/v1/admin/tasks/timesheets/${selectedTimesheet._id || selectedTimesheet.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    adminNotes,
                    rejectionReason: status === 'Rejected' ? adminNotes : '',
                    approvedBy: user?.id
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Timesheet ${status}`);
                setSelectedTimesheet(null);
                fetchTimesheets();
            }
        } catch (error) {
            toast.error(`Failed to ${status} timesheet`);
        }
    };

    const filteredTimesheets = timesheets.filter(t =>
        t.employee?.personalDetails?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.employee?.personalDetails?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.employee?.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && timesheets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium">Loading approval queue...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Timesheet Approvals</h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Review and approve employee weekly time logs</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search employee or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Status filter dropdown */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="Submitted">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Draft">Drafts</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTimesheets.map((ts) => (
                    <div key={ts._id || ts.id} className="bg-white rounded-3xl border border-slate-200 hover: transition-all group overflow-hidden">
                        <div className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-sm uppercase">
                                        {ts.employee?.personalDetails?.firstName?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-slate-900 text-sm">
                                            {ts.employee?.personalDetails?.firstName} {ts.employee?.personalDetails?.lastName}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ts.employee?.employeeId}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${
                                    ts.status === 'Submitted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    ts.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    ts.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                    'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                    {ts.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Week Range</p>
                                    <p className="text-xs font-bold text-slate-700">
                                        {format(new Date(ts.weekStartDate), 'MMM dd')} - {format(new Date(new Date(ts.weekStartDate).setDate(new Date(ts.weekStartDate).getDate() + 6)), 'MMM dd')}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Hours</p>
                                    <p className="text-xs font-black text-indigo-600">{ts.totalHours} Hrs</p>
                                </div>
                            </div>

                            {/* Show selected manager routing details */}
                            {ts.submittedTo && (
                                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1">
                                    <span className="text-indigo-500">Manager:</span> {ts.submittedTo.personalDetails?.firstName} {ts.submittedTo.personalDetails?.lastName}
                                </p>
                            )}

                            <button
                                onClick={() => fetchDetails(ts)}
                                className="w-full py-2.5 bg-slate-50 text-slate-650 hover:text-slate-900 rounded-xl text-xs font-extrabold hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-100"
                            >
                                <Eye className="w-4 h-4" /> Review Details
                            </button>
                        </div>
                    </div>
                ))}

                {filteredTimesheets.length === 0 && (
                    <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                        <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-450 font-medium">No pending timesheets found for this selection.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedTimesheet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden scale-in duration-300 max-h-[90vh] flex flex-col border border-slate-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600 text-lg uppercase">
                                    {selectedTimesheet.employee?.personalDetails?.firstName?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">
                                        Review {selectedTimesheet.employee?.personalDetails?.firstName}'s Timesheet
                                    </h3>
                                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                        Week: {format(new Date(selectedTimesheet.weekStartDate), 'MMM dd')} - {format(new Date(new Date(selectedTimesheet.weekStartDate).setDate(new Date(selectedTimesheet.weekStartDate).getDate() + 6)), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTimesheet(null)} className="p-2 hover:bg-slate-200/80 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 overflow-y-auto flex-1">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Hours</p>
                                    <p className="text-2xl font-black text-indigo-900 mt-1">{selectedTimesheet.totalHours} Hrs</p>
                                </div>
                                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projects Worked</p>
                                    <p className="text-2xl font-black text-slate-800 mt-1">{new Set((entries || []).map(e => e.project?._id || e.project?.id || e.project)).size}</p>
                                </div>
                                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission Date</p>
                                    <p className="text-2xl font-black text-slate-800 mt-1">
                                        {selectedTimesheet.submittedAt ? format(new Date(selectedTimesheet.submittedAt), 'MMM dd, HH:mm') : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Entries Table */}
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(entries || []).map((entry, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 text-xs font-bold text-slate-600">{format(new Date(entry.date), 'EEE, MMM dd')}</td>
                                                <td className="p-4">
                                                    <span className="text-xs font-bold text-indigo-600 block">{entry.project?.name}</span>
                                                    {entry.task && <span className="text-[10px] text-slate-400">{entry.task?.title}</span>}
                                                </td>
                                                <td className="p-4 text-xs text-slate-500 italic max-w-xs truncate">{entry.description || '-'}</td>
                                                <td className="p-4 text-right text-sm font-black text-slate-900">{entry.hours}h</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Actions & Remarks */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Admin/Manager Remarks & Feedback
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                                        placeholder="Add feedback notes for the employee (required if rejecting)..."
                                    />
                                </div>

                                {selectedTimesheet.status === 'Submitted' && (
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => {
                                                if (!adminNotes.trim()) {
                                                    toast.error("Please add rejection remarks first.");
                                                    return;
                                                }
                                                handleAction('Rejected');
                                            }}
                                            className="flex-1 px-5 py-3.5 border-2 border-rose-100 text-rose-600 rounded-2xl font-black text-xs hover:bg-rose-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            <XCircle className="w-4.5 h-4.5" /> Reject Timesheet
                                        </button>
                                        
                                        <button
                                            onClick={() => handleAction('Approved')}
                                            className="flex-1 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            <CheckCircle className="w-4.5 h-4.5" /> Approve Timesheet
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimesheetApprovals;
