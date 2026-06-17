"use client";

import React, { useState, useEffect } from "react";
import {
    ShieldCheck,
    Search,
    Filter,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Eye,
    ArrowUpRight,
    AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import InvestmentReviewModal from "@/components/payroll/InvestmentReviewModal";

export default function HRInvestmentsPage() {
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [selectedDeclaration, setSelectedDeclaration] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchDeclarations();
    }, []);

    const fetchDeclarations = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/admin/payroll/investments?financialYear=2025-26');
            const data = await res.json();
            setDeclarations(Array.isArray(data) ? data : []);
            if (data && data.error) {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Failed to fetch declarations");
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
            'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'Rejected': 'bg-red-50 text-red-700 border-red-200',
            'Draft': 'bg-slate-50 text-slate-600 border-slate-200'
        };
        const icons = {
            'Pending': <Clock className="w-3 h-3" />,
            'Approved': <CheckCircle2 className="w-3 h-3" />,
            'Rejected': <XCircle className="w-3 h-3" />,
            'Draft': <FileText className="w-3 h-3" />
        };

        return (
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
                {icons[status]}
                {status}
            </span>
        );
    };

    const filteredDeclarations = declarations.filter(decl => {
        const fullName = `${decl.employeeId?.personalDetails?.firstName || ''} ${decl.employeeId?.personalDetails?.lastName || ''}`.toLowerCase();
        const empId = decl.employeeId?.employeeId?.toLowerCase() || "";
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || empId.includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "All" || decl.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleReview = (decl) => {
        setSelectedDeclaration(decl);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <ShieldCheck className="w-10 h-10 text-indigo-600" />
                            Investment Reviews
                        </h1>
                        <p className="text-slate-500 mt-2">Manage employee tax declarations for Financial Year 2025-26</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4">
                            <div className="p-2 bg-emerald-500 rounded-lg text-white">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Approved</p>
                                <p className="text-xl font-black text-slate-900">{Array.isArray(declarations) ? declarations.filter(d => d.status === 'Approved').length : 0}</p>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4">
                            <div className="p-2 bg-amber-500 rounded-lg text-white">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending</p>
                                <p className="text-xl font-black text-slate-900">{Array.isArray(declarations) ? declarations.filter(d => d.status === 'Pending').length : 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or employee ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none"
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Draft">Draft</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Declared Amount</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredDeclarations.length > 0 ? (
                                filteredDeclarations.map((decl) => (
                                    <tr key={decl._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                    {(decl.employeeId?.personalDetails?.firstName?.[0] || '') + (decl.employeeId?.personalDetails?.lastName?.[0] || '')}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{decl.employeeId?.personalDetails?.firstName} {decl.employeeId?.personalDetails?.lastName}</p>
                                                    <p className="text-xs text-slate-500 font-mono tracking-tighter">{decl.employeeId?.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900">₹{((decl.sections?.section80C?.total || 0) + (decl.sections?.section80D?.total || 0) + (decl.sections?.hra?.annualRent || 0)).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                                                <p className="text-[10px] text-slate-400">Total Declaration</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={decl.status} />
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleReview(decl)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                                            >
                                                Review <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-400">
                                            <AlertCircle className="w-12 h-12 opacity-20" />
                                            <p className="font-medium">No tax declarations found matching your criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <InvestmentReviewModal
                    declaration={selectedDeclaration}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={fetchDeclarations}
                />
            )}
        </div>
    );
}
