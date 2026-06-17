"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp, ArrowDownRight, ArrowUpRight,
    BarChart3, PieChart, Activity, DollarSign,
    Calendar, Filter, Search, Download,
    Building2, Users, FileText, Landmark,
    CheckCircle2, AlertCircle, Clock, Loader2,
    Settings, X, Save, Plus, CreditCard, XCircle,
    MoreVertical, LayoutDashboard, ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import VendorManager from "./vendor-manager";
import JournalEntryModal from "./journal-entry-modal"; // Import Modal

export default function FinanceDashboard({ initialTab = "overview" }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || initialTab);
    const [vendorSection, setVendorSection] = useState('dashboard');
    const [isVendorMenuOpen, setIsVendorMenuOpen] = useState(false);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        // Optional: Update URL to reflect tab change without full reload
        router.push(`/admin/finance?tab=${tabId}`, { scroll: false });
    };

    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false); // Modal state
    const [stats, setStats] = useState({
        totalPayroll: 0,
        totalExpenses: 0,
        pendingReimbursements: 0,
        paidAmount: 0
    });
    const [alerts, setAlerts] = useState({
        pendingApprovals: 0,
        pendingPayments: 0,
        payrollPending: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/admin/finance/stats');
            const data = await res.json();
            if (data.stats) setStats(data.stats);
            if (data.alerts) setAlerts(data.alerts);
            if (data.recentActivity) setRecentActivity(data.recentActivity);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await fetch('/api/v1/admin/finance/ledger');
            const data = await res.json();

            if (!data.entries || data.entries.length === 0) {
                toast.error("No data to export");
                return;
            }

            // Convert to CSV
            const headers = ["Date", "Reference", "Description", "Source", "TotalDebit", "TotalCredit"];
            const csvRows = [headers.join(',')];

            data.entries.forEach(entry => {
                const row = [
                    format(new Date(entry.date), 'yyyy-MM-dd'),
                    entry.referenceNumber,
                    `"${entry.description.replace(/"/g, '""')}"`, // Escape quotes
                    entry.source,
                    entry.totalDebit,
                    entry.totalCredit
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ledger-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Report Exported Successfully");
        } catch (error) {
            console.error(error);
            toast.error("Export Failed");
        }
    };

    const tabs = [
        { id: "overview", label: "Overview", icon: Activity },
        { id: "approvals", label: "Approvals", icon: CheckCircle2 },
        { id: "payments", label: "Reimbursements / Payments", icon: CreditCard },
        { id: "cost-centers", label: "Cost Centers", icon: Building2 },
        { id: "vendors", label: "Vendor Management", icon: Users },
        { id: "reports", label: "Reports", icon: BarChart3 },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Analyzing financial records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finance Command Center</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Real-time financial visibility and payroll-accounting integration.</p>
                </div>
            </div>

            {/* Tabbed Interface */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden min-h-[500px]">
                <div className="flex justify-between items-center border-b border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {activeTab === 'vendors' ? (
                            <>
                                {[
                                    { id: 'dashboard', label: 'Overview', Icon: LayoutDashboard },
                                    { id: 'master', label: 'Directory', Icon: Users },
                                    { id: 'expenses', label: 'Bills/Expenses', Icon: FileText },
                                    { id: 'payments', label: 'Payments', Icon: CreditCard }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setVendorSection(item.id)}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            vendorSection === item.id
                                            ? "bg-white text-indigo-600 ring-1 ring-slate-200"
                                            : "text-slate-500 hover:bg-white hover:text-indigo-600"
                                        }`}
                                    >
                                        <item.Icon className="w-4 h-4" /> {item.label}
                                    </button>
                                ))}
                            </>
                        ) : (
                            tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                        ? "bg-white text-indigo-600 ring-1 ring-slate-200"
                                        : "text-slate-500 hover:bg-white hover:text-indigo-600"
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" /> {tab.label}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Right side Back button */}
                    <button
                        onClick={() => {
                            if (activeTab === 'vendors') {
                                if (vendorSection !== 'dashboard') {
                                    setVendorSection('dashboard');
                                } else {
                                    setActiveTab('overview');
                                }
                            } else {
                                setActiveTab('overview');
                            }
                        }}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:bg-white transition-all border border-transparent hover:border-rose-100 group shrink-0"
                    >
                        <span>Back</span> <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === "overview" && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Financial Overview stats - only in overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 hover: transition-all duration-500 group relative overflow-hidden border-l-4 border-l-indigo-500">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-[1rem] flex items-center justify-center">
                                                <Users className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <span className="flex items-center text-[10px] font-black text-emerald-500">
                                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                                +12%
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Payroll</p>
                                        <h3 className="text-2xl font-black text-slate-900 mt-1">₹{(stats.totalPayroll || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h3>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 hover: transition-all duration-500 group relative overflow-hidden border-l-4 border-l-orange-500">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 bg-orange-100 rounded-[1rem] flex items-center justify-center">
                                                <Activity className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <span className="flex items-center text-[10px] font-black text-emerald-500">
                                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                                +5%
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Expenses</p>
                                        <h3 className="text-2xl font-black text-slate-900 mt-1">₹{(stats.totalExpenses || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h3>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 hover: transition-all duration-500 group relative overflow-hidden border-l-4 border-l-emerald-500">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-[1rem] flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <span className="flex items-center text-[10px] font-black text-rose-500">
                                                <ArrowDownRight className="w-3 h-3 mr-1" />
                                                -2%
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Pending Reimbursements</p>
                                        <h3 className="text-2xl font-black text-slate-900 mt-1">₹{(stats.pendingReimbursements || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h3>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 hover: transition-all duration-500 group relative overflow-hidden border-l-4 border-l-blue-500">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-[1rem] flex items-center justify-center">
                                                <Landmark className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <span className="flex items-center text-[10px] font-black text-emerald-500">
                                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                                +8%
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Paid Amount</p>
                                        <h3 className="text-2xl font-black text-slate-900 mt-1">₹{(stats.paidAmount || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col">
                                    <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-rose-500" /> To-Do / Alerts
                                    </h4>
                                    <div className="flex-1 space-y-4">
                                        <button onClick={() => router.push('/admin/finance/expenses')} className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all text-left">
                                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                            <span className="text-sm font-bold text-slate-700">{alerts.pendingApprovals} Pending approvals</span>
                                        </button>
                                        <button onClick={() => router.push('/admin/finance/expenses')} className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all text-left">
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            <span className="text-sm font-bold text-slate-700">{alerts.pendingPayments} Pending payments</span>
                                        </button>
                                        <button onClick={() => router.push('/admin/payroll/run')} className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all text-left">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                            <span className="text-sm font-bold text-slate-700">{alerts.payrollPending} Payroll pending</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col">
                                    <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-indigo-600" /> Quick Actions
                                    </h4>
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <button onClick={() => router.push('/admin/finance/expenses')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 hover: transition-all hover:border-slate-200 group">
                                            <Plus className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Add Expense</span>
                                        </button>
                                        <button onClick={() => router.push('/admin/finance/expenses')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 hover: transition-all hover:border-emerald-100 group">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Approve Expense</span>
                                        </button>
                                        <button onClick={() => router.push('/admin/payroll/run')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 hover: transition-all hover:border-slate-200 group">
                                            <Building2 className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Process Payroll</span>
                                        </button>

                                    </div>
                                </div>
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col">
                                    <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-slate-600" /> Recent Activity
                                    </h4>
                                    <div className="flex-1 space-y-4">
                                        {recentActivity.length === 0 ? (
                                            <p className="text-slate-400 text-xs italic">No recent activity</p>
                                        ) : (
                                            recentActivity.map((act) => (
                                                <div key={act.id} className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${act.type === 'payroll' ? 'bg-purple-100' : 'bg-indigo-100'}`}>
                                                        {act.type === 'payroll' ? <Building2 className="w-4 h-4 text-purple-600" /> : <FileText className="w-4 h-4 text-indigo-600" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900">{act.action}</p>
                                                        <p className="text-[10px] font-medium text-slate-400">{format(new Date(act.timestamp), 'dd MMM yyyy, hh:mm a')} • <span className="line-clamp-1 truncate block">{act.title}</span></p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "approvals" && <ApprovalsManager />}
                    {activeTab === "payments" && <PaymentsManager />}
                    {activeTab === "cost-centers" && <CostCenterManager />}
                    {activeTab === "vendors" && <VendorManager activeSection={vendorSection} setActiveSection={setVendorSection} />}
                    {activeTab === "reports" && <ReportsViewer />}
                </div>
            </div>

            <JournalEntryModal
                isOpen={isEntryModalOpen}
                onClose={() => setIsEntryModalOpen(false)}
                onEntrySaved={() => {
                    if (activeTab === "ledger") {
                        setActiveTab("overview");
                        setTimeout(() => setActiveTab("ledger"), 50);
                    }
                }}
            />
        </div>
    );
}

function ApprovalsManager() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionModal, setActionModal] = useState({ open: false, type: '', expense: null, comment: '' });

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/admin/finance/expenses?status=Pending');
            const data = await res.json();
            setExpenses(data.expenses || []);
        } catch (error) {
            toast.error("Failed to load approvals");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        try {
            const { type, expense, comment } = actionModal;
            const res = await fetch('/api/v1/admin/finance/expenses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: expense._id,
                    status: type === 'approve' ? 'Approved' : 'Rejected',
                    adminComments: comment || '',
                    rejectionReason: type === 'reject' ? comment : ''
                })
            });
            if (!res.ok) throw new Error("Action failed");
            toast.success(`Expense ${type === 'approve' ? 'Approved' : 'Rejected'} successfully`);
            setActionModal({ open: false, type: '', expense: null, comment: '' });
            fetchPending();
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Manager Approvals</h3>
                    <p className="text-slate-500 text-sm font-medium">Review and authorize pending expense claims</p>
                </div>
            </div>

            {expenses.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">All caught up!</p>
                    <p className="text-slate-400 text-xs">No pending approvals at the moment.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {expenses.map((expense) => (
                        <div key={expense._id} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900">{expense.title}</h4>
                                    <p className="text-sm text-slate-500 font-medium">By {expense.employee?.personalDetails?.firstName || 'Employee'} • {expense.category}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{format(new Date(expense.date), 'dd MMM yyyy')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Claim Amount</p>
                                    <p className="text-lg font-black text-indigo-600">₹{(expense.amount || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setActionModal({ open: true, type: 'reject', expense, comment: '' })}
                                        className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => setActionModal({ open: true, type: 'approve', expense, comment: '' })}
                                        className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-1"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {actionModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md">
                        <h3 className="text-xl font-black text-slate-900 mb-2">
                            {actionModal.type === 'approve' ? 'Approve Expense' : 'Reject Expense'}
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">
                            You are about to {actionModal.type} the claim for <span className="font-bold">₹{actionModal.expense.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>.
                        </p>
                        
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Manager Comments (Optional)</label>
                        <textarea
                            value={actionModal.comment}
                            onChange={(e) => setActionModal({ ...actionModal, comment: e.target.value })}
                            rows={3}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Add your remarks here..."
                        />
                        
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setActionModal({ open: false, type: '', expense: null, comment: '' })}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                className={`flex-1 py-3 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${actionModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                            >
                                Confirm {actionModal.type}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PaymentsManager() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('Approved'); // 'Approved' or 'Paid'
    const [paymentModal, setPaymentModal] = useState({ open: false, expense: null });
    const [paymentForm, setPaymentForm] = useState({ mode: 'Bank Transfer', reference: '', date: format(new Date(), 'yyyy-MM-dd') });

    useEffect(() => {
        fetchExpenses();
    }, [filterStatus]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/admin/finance/expenses?status=${filterStatus}`);
            const data = await res.json();
            setExpenses(data.expenses || []);
        } catch (error) {
            toast.error("Failed to load approved expenses");
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!paymentForm.reference) {
            toast.error("Reference number is required");
            return;
        }
        try {
            const res = await fetch('/api/v1/admin/finance/expenses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: paymentModal.expense._id,
                    status: 'Paid',
                    paymentDetails: {
                        paymentMode: paymentForm.mode,
                        referenceNumber: paymentForm.reference,
                        paymentDate: new Date(paymentForm.date)
                    }
                })
            });
            if (!res.ok) throw new Error("Failed to mark as paid");
            toast.success("Payment recorded successfully!");
            setPaymentModal({ open: false, expense: null });
            fetchExpenses();
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Reimbursements / Payments</h3>
                    <p className="text-slate-500 text-sm font-medium">Process payments for approved expenses</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button
                        onClick={() => setFilterStatus('Approved')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'Approved' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pending Payment
                    </button>
                    <button
                        onClick={() => setFilterStatus('Paid')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'Paid' ? 'bg-white text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Completed
                    </button>
                </div>
            </div>

            {expenses.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">{filterStatus === 'Approved' ? 'All approved claims are paid!' : 'No payments found.'}</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {expenses.map((expense) => (
                        <div key={expense._id} className={`bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-l-4 ${filterStatus === 'Paid' ? 'border-l-emerald-500' : 'border-l-orange-500'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${filterStatus === 'Paid' ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                                    <CreditCard className={`w-6 h-6 ${filterStatus === 'Paid' ? 'text-emerald-600' : 'text-orange-600'}`} />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-lg font-black text-slate-900">{expense.title}</h4>
                                    <p className="text-sm text-slate-500 font-medium">To: <span className="font-bold">{expense.employee?.personalDetails?.firstName || 'Employee'}</span> • {expense.category}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{format(new Date(expense.date), 'dd MMM yyyy')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{filterStatus === 'Paid' ? 'Paid Amount' : 'Payable Amount'}</p>
                                    <p className={`text-xl font-black ${filterStatus === 'Paid' ? 'text-emerald-600' : 'text-orange-600'}`}>₹{expense.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                                </div>
                                {filterStatus === 'Approved' ? (
                                    <button
                                        onClick={() => setPaymentModal({ open: true, expense })}
                                        className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Mark as Paid
                                    </button>
                                ) : (
                                    <div className="text-right bg-slate-50 px-4 py-2 rounded-xl">
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Ref: {expense.paymentDetails?.referenceNumber || 'N/A'}</p>
                                        <p className="text-[10px] text-slate-600 font-bold">{expense.paymentDetails?.paymentMode || 'N/A'} • {expense.paymentDetails?.paymentDate ? format(new Date(expense.paymentDetails.paymentDate), 'dd MMM yyyy') : 'N/A'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {paymentModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Record Payment</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">₹{paymentModal.expense.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })} to {paymentModal.expense.employee?.personalDetails?.firstName}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Date</label>
                                <input
                                    type="date"
                                    value={paymentForm.date}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Mode</label>
                                <select
                                    value={paymentForm.mode}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none font-bold"
                                >
                                    <option>Bank Transfer</option>
                                    <option>UPI</option>
                                    <option>Cash</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Transaction Reference No.</label>
                                <input
                                    type="text"
                                    value={paymentForm.reference}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                    placeholder="e.g. UTR123456789"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setPaymentModal({ open: false, expense: null })}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayment}
                                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ReportsViewer() {
    const [stats, setStats] = useState({ totalPayroll: 0, totalExpenses: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const res = await fetch('/api/v1/admin/finance/stats');
                const data = await res.json();
                if (data.stats) setStats(data.stats);
            } catch (error) {
                toast.error("Failed to load reports");
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, []);

    if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

    const totalCost = stats.totalPayroll + stats.totalExpenses;

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Company Financial Reports</h3>
                    <p className="text-slate-500 text-sm font-medium">Aggregated overview of company spending</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">
                    <Download className="w-4 h-4" /> Export PDF
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Cost Card */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] relative overflow-hidden md:col-span-3 lg:col-span-1 border border-slate-800">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Company Cost</p>
                        <h3 className="text-4xl font-black text-white tracking-tight">₹{totalCost.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h3>
                        <p className="text-slate-400 text-xs mt-4 font-medium">Combined payroll and expense outlay.</p>
                    </div>
                </div>

                {/* Payroll Report */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 relative overflow-hidden">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                        <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Payroll Report</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">₹{stats.totalPayroll.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h3>
                    
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500">% of Total Cost</span>
                            <span className="font-black text-indigo-600">{totalCost > 0 ? ((stats.totalPayroll / totalCost) * 100).toFixed(1) : 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${totalCost > 0 ? (stats.totalPayroll / totalCost) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Expenses Report */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 relative overflow-hidden">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
                        <Activity className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Expense Report</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">₹{stats.totalExpenses.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h3>
                    
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500">% of Total Cost</span>
                            <span className="font-black text-orange-600">{totalCost > 0 ? ((stats.totalExpenses / totalCost) * 100).toFixed(1) : 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${totalCost > 0 ? (stats.totalExpenses / totalCost) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CostCenterManager() {
    const [costCenters, setCostCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [selectedCC, setSelectedCC] = useState(null);

    useEffect(() => {
        fetchCostCenters();
    }, []);

    const fetchCostCenters = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/admin/finance/cost-centers');
            const data = await res.json();
            setCostCenters(data.data || []);
        } catch (error) {
            toast.error("Failed to load cost centers");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBudget = async (id, payload) => {
        try {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `/api/v1/admin/finance/cost-centers?id=${id}` : '/api/v1/admin/finance/cost-centers';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Operation failed");
            toast.success(data.message || "Plan updated successfully");
            fetchCostCenters();
            setIsBudgetModalOpen(false);
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Active Cost Centers</h3>
                    <p className="text-xs text-slate-500 font-medium">Real-time budget utilization and allocation tracking.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setSelectedCC(null);
                            setIsBudgetModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" /> Provision New Center
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {costCenters.map((cc, i) => {
                    const utilization = cc.budget > 0 ? (cc.spent / cc.budget) * 100 : 0;
                    const isOverBudget = utilization > 100;
                    const isNearLimit = utilization > 85;

                    return (
                        <div key={cc._id} className="p-8 bg-white border border-slate-200 rounded-[2.5rem] hover: hover: transition-all group relative overflow-hidden border-b-4 border-b-transparent hover:border-b-indigo-500">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <Building2 className={`w-6 h-6 text-indigo-600`} />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{cc.code}</span>
                                    <button
                                        onClick={() => {
                                            setSelectedCC(cc);
                                            setIsBudgetModalOpen(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h4 className="text-xl font-black text-slate-900 mb-1">{cc.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">Manager: {cc.manager?.personalDetails?.firstName || 'Universal'} {cc.manager?.personalDetails?.lastName || 'Alloc'}</p>

                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500 italic">Utilization</span>
                                    <span className={isOverBudget ? "text-rose-600 animate-pulse" : isNearLimit ? "text-orange-600" : "text-emerald-600"}>
                                        {utilization.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-rose-500' : isNearLimit ? 'bg-orange-500' : 'bg-indigo-600'}`}
                                        style={{ width: `${Math.min(utilization, 100)}%` }}
                                    ></div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-4">
                                    <div className="bg-slate-50 rounded-2xl p-3 text-center transition-colors group-hover:bg-white border border-transparent group-hover:border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">Budget</p>
                                        <p className="text-xs font-black text-slate-900">₹{(cc.budget / 100000).toFixed(1)}L</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-3 text-center transition-colors group-hover:bg-white border border-transparent group-hover:border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">Spent</p>
                                        <p className="text-xs font-black text-indigo-600">₹{(cc.spent / 100000).toFixed(1)}L</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-3 text-center transition-colors group-hover:bg-white border border-transparent group-hover:border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">Avail</p>
                                        <p className={`text-xs font-black ${cc.budget - cc.spent < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{((cc.budget - cc.spent) / 100000).toFixed(1)}L</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Budget Planner Modal */}
            {isBudgetModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-slate-100 bg-slate-50/50 relative">
                            <button onClick={() => setIsBudgetModalOpen(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                            <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center mb-6">
                                <DollarSign className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCC ? "Budget Planner" : "New Cost Center"}</h3>
                            <p className="text-slate-500 font-medium text-sm mt-1">{selectedCC ? `Adjust allocation for ${selectedCC.name}` : "Define a new financial tracking center"}</p>
                        </div>
                        <div className="p-10 space-y-6">
                            {!selectedCC && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Center Name</label>
                                        <input id="cc-name" placeholder="e.g. Research & Dev" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Center Code</label>
                                        <input id="cc-code" placeholder="e.g. RD-001" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none text-sm font-bold" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Planned Budget (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">₹</span>
                                    <input
                                        type="number"
                                        defaultValue={selectedCC?.budget || 0}
                                        id="budget-input"
                                        autoFocus
                                        className="w-full pl-12 pr-8 py-6 bg-slate-50 rounded-3xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 text-2xl font-black text-slate-900 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={() => setIsBudgetModalOpen(false)}
                                    className="py-4 rounded-2xl bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        const budget = document.getElementById('budget-input').value;
                                        if (selectedCC) {
                                            handleUpdateBudget(selectedCC._id, { budget });
                                        } else {
                                            const name = document.getElementById('cc-name').value;
                                            const code = document.getElementById('cc-code').value;
                                            handleUpdateBudget(null, { name, code, budget });
                                        }
                                    }}
                                    className="py-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> {selectedCC ? "Save Plan" : "Create Center"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
