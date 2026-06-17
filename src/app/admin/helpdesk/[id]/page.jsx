"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, CheckCircle, Clock, AlertCircle, User, Loader2, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { toast } from "sonner";

export default function TicketDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useSession();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [assignees, setAssignees] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState("");
    const dropdownRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchTicket = async () => {
        try {
            const res = await fetch(`/api/v1/admin/helpdesk/${id}`);
            if (res.ok) {
                const data = await res.json();
                setTicket(data);
                if (data.error) throw new Error(data.error);
            } else {
                toast.error("Failed to load ticket");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignees = async () => {
        try {
            const res = await fetch(`/api/v1/admin/helpdesk?fetchUsers=true`);
            if (res.ok) {
                const data = await res.json();
                setAssignees(data);
            }
        } catch (error) {
            console.error("Failed to fetch assignees", error);
        }
    };

    useEffect(() => {
        fetchTicket();
        fetchAssignees();
    }, [id]);

    useEffect(() => {
        // Scroll to bottom on load/comment update
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [ticket?.comments]);

    const handleSendComment = async () => {
        if (!comment.trim()) return;

        try {
            setSending(true);
            const payload = {
                newComment: {
                    userId: user?._id || user?.id,
                    userName: user?.name || `${user?.personalDetails?.firstName || ""} ${user?.personalDetails?.lastName || ""}`.trim() || "User",
                    message: comment
                }
            };

            const res = await fetch(`/api/v1/admin/helpdesk/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setComment("");
                fetchTicket();
            } else {
                toast.error("Failed to post comment");
            }
        } catch (error) {
            toast.error("Error posting comment");
        } finally {
            setSending(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            setUpdatingStatus(true);
            const res = await fetch(`/api/v1/admin/helpdesk/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                toast.success(`Status updated to ${newStatus}`);
                fetchTicket();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("Error updating status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleAssigneeUpdate = async (newAssigneeId) => {
        try {
            const res = await fetch(`/api/v1/admin/helpdesk/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assignedTo: newAssigneeId || null })
            });

            if (res.ok) {
                toast.success(newAssigneeId ? "Ticket assigned successfully" : "Ticket unassigned");
                fetchTicket();
            } else {
                toast.error("Failed to update assignment");
            }
        } catch (error) {
            toast.error("Error updating assignment");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Open": return "bg-blue-50 text-blue-700 border-blue-100";
            case "In Process": return "bg-yellow-50 text-yellow-700 border-yellow-100";
            case "Resolved": return "bg-green-50 text-green-700 border-green-100";
            case "Closed": return "bg-gray-50 text-gray-700 border-gray-100";
            default: return "bg-gray-50 text-gray-700 border-gray-100";
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading ticket details...</div>;
    if (!ticket) return <div className="p-10 text-center text-red-500">Ticket not found</div>;

    const isAdmin = user?.role === "admin" || user?.role === "hr" || user?.role === "super_admin";

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
                <ArrowLeft size={18} /> Back to Helpdesk
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Ticket Info + Comments */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <h1 className="text-xl font-bold text-slate-900">{ticket.subject}</h1>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                            </span>
                        </div>
                        <p className="text-slate-600 whitespace-pre-wrap">{ticket.description}</p>
                        <div className="text-sm text-slate-400">
                            Raised by {ticket.employee?.personalDetails?.firstName} • {new Date(ticket.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[500px]">
                        <div className="p-4 border-b border-slate-200 font-semibold text-slate-700">Discussion</div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {ticket.comments.length === 0 ? (
                                <div className="text-center text-slate-400 my-10">No comments yet. Start the conversation.</div>
                            ) : (
                                ticket.comments.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-3 ${(msg.user?._id || msg.user) === (user?._id || user?.id) ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                            <User size={14} />
                                        </div>
                                        <div className={`max-w-[80%] rounded-xl p-3 ${(msg.user?._id || msg.user) === (user?._id || user?.id)
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                            <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                                                <span>{msg.userName}</span>
                                                <span>{new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={bottomRef} />
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
                            <div className="flex gap-2">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1 resize-none border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none h-12 min-h-[48px] max-h-32"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendComment();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSendComment}
                                    disabled={sending || !comment.trim()}
                                    className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                                >
                                    {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Meta Info & Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                        <h3 className="font-semibold text-slate-900 border-b border-gray-100 pb-3">Ticket Details</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Category</label>
                                <div className="text-slate-900">{ticket.category}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Priority</label>
                                <div className="flex items-center gap-2 mt-1">
                                    {ticket.priority === "High" ? <AlertCircle size={16} className="text-red-500" /> :
                                        ticket.priority === "Medium" ? <Clock size={16} className="text-yellow-500" /> :
                                            <CheckCircle size={16} className="text-blue-500" />}
                                    <span className="text-slate-900">{ticket.priority}</span>
                                </div>
                            </div>                              <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Assigned To</label>
                                {isAdmin ? (
                                    <div className="relative mt-1" ref={dropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setDropdownOpen(!dropdownOpen)}
                                            className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer font-medium transition-all"
                                        >
                                            <span className="truncate">
                                                {(() => {
                                                    const currentAssigneeId = ticket.assignedTo?._id || ticket.assignedTo || "";
                                                    const selectedAssignee = assignees.find(a => a._id === currentAssigneeId);
                                                    return selectedAssignee ? `${selectedAssignee.name} (${selectedAssignee.role})` : "Unassigned";
                                                })()}
                                            </span>
                                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {dropdownOpen && (
                                            <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                                                    <Search size={14} className="text-slate-400 shrink-0" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search assignee..."
                                                        value={assigneeSearch}
                                                        onChange={(e) => setAssigneeSearch(e.target.value)}
                                                        className="w-full bg-transparent border-none text-xs outline-none text-slate-700 placeholder-slate-400 py-1"
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>

                                                <div className="max-h-56 overflow-y-auto py-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleAssigneeUpdate("");
                                                            setDropdownOpen(false);
                                                            setAssigneeSearch("");
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                                                            !(ticket.assignedTo?._id || ticket.assignedTo || "")
                                                                ? 'bg-indigo-50 text-indigo-700'
                                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        Unassigned
                                                    </button>
                                                    {(() => {
                                                        const currentAssigneeId = ticket.assignedTo?._id || ticket.assignedTo || "";
                                                        const filteredAssignees = assignees.filter(assignee =>
                                                            assignee.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                                                            assignee.role?.toLowerCase().includes(assigneeSearch.toLowerCase())
                                                        );
                                                        
                                                        if (filteredAssignees.length === 0) {
                                                            return (
                                                                <div className="px-3 py-3 text-xs text-slate-400 text-center">
                                                                    No active team members found
                                                                </div>
                                                            );
                                                        }

                                                        return filteredAssignees.map((assignee) => (
                                                            <button
                                                                key={assignee._id}
                                                                type="button"
                                                                onClick={() => {
                                                                    handleAssigneeUpdate(assignee._id);
                                                                    setDropdownOpen(false);
                                                                    setAssigneeSearch("");
                                                                }}
                                                                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors font-medium ${
                                                                    currentAssigneeId === assignee._id
                                                                        ? 'bg-indigo-50 text-indigo-700'
                                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                                }`}
                                                            >
                                                                <span className="truncate">{assignee.name}</span>
                                                                <span className="text-[10px] uppercase font-bold opacity-60 ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                    {assignee.role}
                                                                </span>
                                                            </button>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-slate-900 mt-1">
                                        {ticket.assignedTo?.name || "Unassigned"}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                <label className="text-xs text-slate-500 uppercase font-bold">Update Status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["Open", "In Process", "Resolved", "Closed"].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusUpdate(status)}
                                            disabled={updatingStatus || ticket.status === status}
                                            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all
                                                ${ticket.status === status
                                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
