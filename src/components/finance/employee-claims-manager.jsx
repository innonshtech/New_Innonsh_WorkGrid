"use client";

import { useState, useEffect } from "react";
import { 
    Plus, Wallet, Clock, CheckCircle2, XCircle, 
    IndianRupee, Search, Calendar as CalendarIcon, 
    FileText, Eye, Edit2, Trash2, ChevronRight, ChevronDown, User, Loader2
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { ExpenseFormModal } from "./expense-manager";

export default function EmployeeClaimsManager({ employeeId }) {
    const [activeTab, setActiveTab] = useState('Personal');
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        paid: 0
    });

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            let url = `/api/v1/admin/finance/expenses`;
            const params = new URLSearchParams();
            if (employeeId) params.append('employeeId', employeeId);
            // We fetch all relevant claims and filter locally to handle Drafts correctly across tabs
            
            // Note: We're fetching all for the current tab to calculate stats correctly, 
            // then we'll filter them locally for the table if needed.
            // But if we use API filters, stats will only reflect filtered data.
            // For a perfect UX, stats should reflect the WHOLE tab, so we fetch all 
            // and filter locally for the table.
            
            const res = await fetch(`${url}?${params.toString()}`);
            const data = await res.json();
            
            const expenseList = data.expenses || [];
            
            // Calculate stats for the active tab overall
            const s = expenseList.reduce((acc, curr) => {
                acc.total++;
                if (curr.status === 'Pending') acc.pending++;
                if (curr.status === 'Approved') acc.approved++;
                if (curr.status === 'Rejected') acc.rejected++;
                if (curr.status === 'Paid') acc.paid++;
                return acc;
            }, { total: 0, pending: 0, approved: 0, rejected: 0, paid: 0 });
            
            setStats(s);
            setExpenses(expenseList);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [employeeId, activeTab]);

    const handleDelete = async (id, status) => {
        const message = status === 'Draft' 
            ? "Are you sure you want to reject this admin request?" 
            : "Are you sure you want to delete this pending claim?";
            
        if (!confirm(message)) return;
        try {
            const res = await fetch(`/api/v1/admin/finance/expenses?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to delete');
            }
            toast.success("Claim deleted successfully");
            fetchExpenses();
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Apply local filters to the table data
    const filteredExpenses = expenses.filter(exp => {
        // Filter by Tab
        if (activeTab === 'Personal') {
            // Personal tab shows: My own claims OR Drafts (Admin Requests)
            const currentEmpId = (exp.employee?._id || exp.employee || "").toString();
            const isPersonal = exp.claimType === 'Personal' || currentEmpId === employeeId.toString();
            const isDraft = exp.status === 'Draft';
            if (!isPersonal && !isDraft) return false;
        } else {
            // Team tab shows: Historical team claims (not drafts, as drafts move to personal once completed)
            if (exp.claimType !== 'Team' && exp.claimType !== 'Department') return false;
            if (exp.status === 'Draft') return false; // Drafts show in Personal as tasks
        }

        if (filterStatus !== 'all' && exp.status !== filterStatus) return false;
        if (filterCategory !== 'all' && exp.category !== filterCategory) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!exp.title?.toLowerCase().includes(query) && !exp.description?.toLowerCase().includes(query)) return false;
        }
        if (dateRange.start && new Date(exp.date) < new Date(dateRange.start)) return false;
        if (dateRange.end && new Date(exp.date) > new Date(dateRange.end)) return false;
        return true;
    });

    const resetFilters = () => {
        setFilterStatus('all');
        setFilterCategory('all');
        setSearchQuery('');
        setDateRange({ start: '', end: '' });
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Pending': 'bg-orange-100 text-orange-700',
            'Approved': 'bg-emerald-100 text-emerald-700',
            'Rejected': 'bg-rose-100 text-rose-700',
            'Paid': 'bg-indigo-100 text-indigo-700'
        };
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${styles[status] || 'bg-slate-100 text-slate-700'}`}>{status}</span>;
    };

    const getCategoryBadge = (category) => {
        const colors = ['blue', 'emerald', 'purple', 'rose', 'amber', 'cyan'];
        const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const color = colors[hash % colors.length];
        
        // Tailwind requires complete class names, so we map them
        const colorMap = {
            'blue': 'bg-blue-50 text-blue-600',
            'emerald': 'bg-emerald-50 text-emerald-600',
            'purple': 'bg-purple-50 text-purple-600',
            'rose': 'bg-rose-50 text-rose-600',
            'amber': 'bg-amber-50 text-amber-600',
            'cyan': 'bg-cyan-50 text-cyan-600'
        };
        
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${colorMap[color]}`}>{category}</span>;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            
            {/* Header */}
            <div className="flex justify-end mb-8">
                <button 
                    onClick={() => { setEditData(null); setShowModal(true); }}
                    className="bg-[#2563eb] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" /> New Expense Claim
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
                <button 
                    onClick={() => setActiveTab('Personal')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'Personal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <User className="w-4 h-4" /> My Claims (Personal)
                </button>
                <button 
                    onClick={() => setActiveTab('Team')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'Team' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <UsersIcon className={`w-4 h-4`} /> Team Claims
                </button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className={`p-4 rounded-xl border ${activeTab === 'Personal' ? 'bg-blue-50/50 border-blue-100' : 'border-slate-100 opacity-50'}`}>
                    <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-1">
                        <User className="w-4 h-4" /> My Claims (Personal)
                    </div>
                    <p className="text-xs text-slate-500">View and manage your personal expense claims</p>
                </div>
                <div className={`p-4 rounded-xl border ${activeTab === 'Team' ? 'bg-emerald-50/50 border-emerald-100' : 'border-slate-100 opacity-50'}`}>
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
                        <UsersIcon className="w-4 h-4" /> Team Claims
                    </div>
                    <p className="text-xs text-slate-500">View and manage claims submitted by your team members (if you are the team lead/manager)</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Claims</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.total}</p>
                        <p className="text-[10px] text-slate-400 mt-1">This Month</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="bg-orange-50 p-3 rounded-full text-orange-500 border-4 border-orange-100/50">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.pending}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Awaiting Approval</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-full text-emerald-500 border-4 border-emerald-100/50">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approved</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.approved}</p>
                        <p className="text-[10px] text-slate-400 mt-1">This Month</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="bg-rose-50 p-3 rounded-full text-rose-500 border-4 border-rose-100/50">
                        <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rejected</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.rejected}</p>
                        <p className="text-[10px] text-slate-400 mt-1">This Month</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="bg-purple-50 p-3 rounded-full text-purple-600 border-4 border-purple-100/50">
                        <IndianRupee className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paid</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.paid}</p>
                        <p className="text-[10px] text-slate-400 mt-1">This Month</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-8">
                <div className="relative border border-slate-200 rounded-lg bg-white overflow-hidden flex-1 min-w-[150px]">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full h-10 pl-3 pr-8 text-sm outline-none appearance-none bg-transparent">
                        <option value="all">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Paid">Paid</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                
                <div className="relative border border-slate-200 rounded-lg bg-white flex-1 min-w-[150px]">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full h-10 pl-9 pr-3 text-sm outline-none bg-transparent" placeholder="From Date" />
                </div>
                
                <div className="relative border border-slate-200 rounded-lg bg-white flex-1 min-w-[150px]">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full h-10 pl-9 pr-3 text-sm outline-none bg-transparent" placeholder="To Date" />
                </div>

                <div className="relative border border-slate-200 rounded-lg bg-white overflow-hidden flex-1 min-w-[150px]">
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full h-10 pl-3 pr-8 text-sm outline-none appearance-none bg-transparent">
                        <option value="all">All Categories</option>
                        <option value="Travel">Travel</option>
                        <option value="Food">Food</option>
                        <option value="Accommodation">Accommodation</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Software">Software</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative border border-slate-200 rounded-lg bg-white flex-[2] min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by description or amount..." className="w-full h-10 pl-9 pr-3 text-sm outline-none bg-transparent" />
                </div>

                <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 rounded-lg text-sm font-medium h-10 transition-colors">
                    Search
                </button>
                <button onClick={resetFilters} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 rounded-lg text-sm font-medium h-10 transition-colors">
                    Reset
                </button>
            </div>

            {/* Table Container */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-blue-600 border-b-2 border-blue-600 pb-1 -mb-[17px] inline-block">{activeTab === 'Personal' ? 'My Claims (Personal)' : 'Team Claims'}</h3>
                        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{filteredExpenses.length}</span>
                    </div>
                    <button className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:underline">
                        View {activeTab === 'Personal' ? 'Team Claims' : 'All Team Claims'} <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-white border-b border-slate-200 text-slate-900 font-bold">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                {activeTab === 'Team' && <th className="px-6 py-4">Employee</th>}
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Amount (₹)</th>
                                <th className="px-6 py-4">Receipt</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={activeTab === 'Team' ? 8 : 7} className="py-20 text-center">
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                                        <p className="text-slate-400 font-medium">Loading claims...</p>
                                    </td>
                                </tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={activeTab === 'Team' ? 8 : 7} className="py-20 text-center text-slate-500 font-medium">
                                        No claims found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">{format(new Date(expense.date), 'dd MMM yyyy')}</td>
                                        
                                        {activeTab === 'Team' && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-xs">
                                                        {expense.employee?.personalDetails?.firstName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{expense.employee?.personalDetails?.firstName} {expense.employee?.personalDetails?.lastName}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase">{expense.employee?.employeeId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getCategoryBadge(expense.category)}
                                        </td>
                                        
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <p className="line-clamp-1 font-semibold text-slate-800">{expense.title}</p>
                                                {expense.status === 'Draft' && (
                                                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-[4px] text-[9px] font-black uppercase tracking-widest border border-indigo-100 animate-pulse">Admin Request</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1 mt-0.5">
                                                {expense.description && <p className="text-xs text-slate-500 line-clamp-1">{expense.description}</p>}
                                                {expense.status === 'Draft' && expense.maxAmount > 0 && (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        <span className="text-[10px] font-bold text-emerald-600">Approved Budget: ₹{expense.maxAmount}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                            {expense.status === 'Draft' && expense.maxAmount > 0 ? (
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400 text-[10px] line-through">₹{(expense.amount || 0).toFixed(2)}</span>
                                                    <span className="text-indigo-600 font-black">Up to ₹{expense.maxAmount}</span>
                                                </div>
                                            ) : (
                                                (expense.amount || 0).toFixed(2)
                                            )}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-600 cursor-pointer hover:text-blue-600">
                                                <FileText className="w-4 h-4" />
                                                <span className="text-xs">receipt_{expense._id.substring(18)}.pdf</span>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(expense.status)}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded bg-blue-50/50 border border-blue-100 transition-colors" title="View Details">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {(expense.status === 'Pending' || expense.status === 'Draft') && (
                                                    <>
                                                        <button 
                                                            onClick={() => { setEditData(expense); setShowModal(true); }}
                                                            className={`p-1.5 rounded border transition-all flex items-center gap-1 ${expense.status === 'Draft' ? 'bg-indigo-600 text-white border-indigo-700 px-3' : 'text-blue-600 hover:bg-blue-50 bg-blue-50/50 border-blue-100'}`}
                                                            title={expense.status === 'Draft' ? "Complete Claim" : "Edit Claim"}
                                                        >
                                                            {expense.status === 'Draft' ? (
                                                                <>
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    <span className="text-[10px] font-black uppercase">Complete</span>
                                                                </>
                                                            ) : (
                                                                <Edit2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(expense._id, expense.status)}
                                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded bg-rose-50/50 border border-rose-100 transition-colors" 
                                                            title={expense.status === 'Draft' ? "Reject Request" : "Delete Claim"}
                                                        >
                                                            {expense.status === 'Draft' ? (
                                                                <div className="flex items-center gap-1 px-2">
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    <span className="text-[10px] font-black uppercase">Reject</span>
                                                                </div>
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Test Banner for Debugging */}
            <div className="mt-6 p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider mb-1">Testing & Debug Info</h4>
                        <p className="text-xs text-indigo-600 font-bold">
                            Total claims fetched from API: <span className="text-base">{expenses.length}</span>
                        </p>
                    </div>
                    {expenses.some(e => e.status === 'Draft') && (
                        <div className="flex items-center gap-3 animate-bounce">
                            <span className="text-xl">📢</span>
                            <span className="text-lg font-black text-indigo-700 uppercase tracking-tighter italic bg-white px-4 py-2 rounded-full border-2 border-indigo-500">
                                ADMIN NE REQUEST BHEJI HAI - CLAIM KARO!
                            </span>
                        </div>
                    )}
                    <button 
                        onClick={() => fetchExpenses()}
                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg hover:bg-indigo-700 transition-all"
                    >
                        REFRESH DATA
                    </button>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <ExpenseFormModal 
                    employeeId={employeeId}
                    editData={editData}
                    defaultClaimType={activeTab}
                    onClose={() => {
                        setShowModal(false);
                        setEditData(null);
                    }}
                    onSuccess={() => {
                        setShowModal(false);
                        setEditData(null);
                        fetchExpenses();
                    }}
                />
            )}
        </div>
    );
}

// Missing Users icon wrapper for consistency
function UsersIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}
