"use client";
import { useState, useEffect } from "react";
import { Plus, Search, Filter, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import CreateTicketModal from "@/components/modals/CreateTicketModal";
import { useSession } from "@/context/SessionContext"; // Assuming we have this
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

export default function HelpdeskPage() {
    const { user } = useSession(); // Corrected destructuring
    const { t } = useLanguage();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [assignmentFilter, setAssignmentFilter] = useState("my");

    const filteredTickets = tickets.filter((ticket) => {
        const query = searchQuery.toLowerCase();
        const empName = `${ticket.employee?.personalDetails?.firstName || ""} ${ticket.employee?.personalDetails?.lastName || ""}`.toLowerCase();
        
        const matchesSearch = 
            ticket.subject?.toLowerCase().includes(query) ||
            ticket.category?.toLowerCase().includes(query) ||
            ticket.description?.toLowerCase().includes(query) ||
            empName.includes(query);

        // Check if ticket is raised by employee or assigned to employee
        const isRaisedByMe = ticket.employee?._id?.toString() === user?.id?.toString() || ticket.employee?.toString() === user?.id?.toString();
        const isAssignedToMe = ticket.assignedTo?._id?.toString() === user?.id?.toString() || ticket.assignedTo?.toString() === user?.id?.toString();
        
        const matchesAssignment = 
            assignmentFilter === "my" ? isRaisedByMe : isAssignedToMe;
            
        return matchesSearch && matchesAssignment;
    });

    const fetchTickets = async () => {
        try {
            setLoading(true);
            let url = `/api/v1/admin/helpdesk`;
            const params = new URLSearchParams();

            // If employee, backend automatically secures role isolation scoping.
            // No need to pass employeeId param to allow viewing assigned tickets as well!
            if (filterStatus) params.append("status", filterStatus);

            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (error) {
            console.error("Failed to fetch tickets", error);
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTickets();
        }
    }, [user, filterStatus]);

    const getStatusColor = (status) => {
        switch (status) {
            case "Open": return "bg-blue-50 text-blue-700 border-blue-100";
            case "In Process": return "bg-yellow-50 text-yellow-700 border-yellow-100";
            case "Resolved": return "bg-green-50 text-green-700 border-green-100";
            case "Closed": return "bg-gray-50 text-gray-700 border-gray-100";
            default: return "bg-gray-50 text-gray-700 border-gray-100";
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case "High": return <AlertCircle size={16} className="text-red-500" />;
            case "Medium": return <Clock size={16} className="text-yellow-500" />;
            case "Low": return <CheckCircle size={16} className="text-blue-500" />;
            default: return null;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4 mt-2">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        HR Helpdesk
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 max-w-xl">
                        Raise support requests, track resolutions and communicate with HR.
                    </p>
                </div>
            </div>
            <div className="flex justify-end">
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium hover:"
                >
                    <Plus size={18} />
                    {t("raiseTicket")}
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder={t("searchTickets")} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none" 
                        />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                        <button
                            onClick={() => setAssignmentFilter("my")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                                assignmentFilter === "my"
                                    ? "bg-white text-slate-900"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            My Tickets
                        </button>
                        <button
                            onClick={() => setAssignmentFilter("assigned")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                                assignmentFilter === "assigned"
                                    ? "bg-white text-slate-900"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            Assigned to Me
                        </button>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <Filter size={18} className="text-slate-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="">{t("all")}</option>
                            <option value="Open">{t("open")}</option>
                            <option value="In Process">{t("inProcess")}</option>
                            <option value="Resolved">{t("resolved")}</option>
                            <option value="Closed">{t("closed")}</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">{t("subject")}</th>
                                {assignmentFilter === "assigned" && (
                                    <th className="px-6 py-3">{t("raisedBy") || "Raised By"}</th>
                                )}
                                <th className="px-6 py-3">{t("category")}</th>
                                <th className="px-6 py-3">{t("priority")}</th>
                                <th className="px-6 py-3">{t("status")}</th>
                                <th className="px-6 py-3">{t("created")}</th>
                                <th className="px-6 py-3 text-right">{t("actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                             {loading ? (
                                <tr><td colSpan={assignmentFilter === "assigned" ? 7 : 6} className="p-8 text-center text-slate-500">{t("loading")}</td></tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr><td colSpan={assignmentFilter === "assigned" ? 7 : 6} className="p-8 text-center text-slate-500">{t("noTicketsFound")}</td></tr>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <tr key={ticket._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                    <MessageSquare size={16} />
                                                </div>
                                                <div className="font-semibold text-slate-900">{ticket.subject}</div>
                                            </div>
                                        </td>
                                        {assignmentFilter === "assigned" && (
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">
                                                    {ticket.employee?.personalDetails?.firstName || ""} {ticket.employee?.personalDetails?.lastName || ""}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">{ticket.category}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getPriorityIcon(ticket.priority)}
                                                <span>{ticket.priority}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{new Date(ticket.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/employee/helpdesk/${ticket._id}`}
                                                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                                            >
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

            <CreateTicketModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchTickets();
                    toast.success("Ticket raised successfully");
                }}
                employeeId={user?.id || user?._id || user?.employeeId} // Pass correct ID
            />
        </div>
    );
}
