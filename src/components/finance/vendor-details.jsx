"use client";

import { useState, useEffect } from "react";
import { 
    ArrowLeft, Building2, Mail, Phone, 
    MapPin, Landmark, FileText, IndianRupee,
    CreditCard, Clock, CheckCircle2, Loader2,
    Calendar, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function VendorDetails({ vendor, onBack }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalExpense: 0,
        totalPaid: 0,
        pendingBalance: 0
    });

    useEffect(() => {
        if (vendor) {
            fetchVendorHistory();
        }
    }, [vendor]);

    const fetchVendorHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/admin/finance/vendors/invoices?vendorId=${vendor._id}`);
            const data = await res.json();
            const invs = data.invoices || [];
            setInvoices(invs);
            
            const stats = invs.reduce((acc, inv) => {
                acc.totalExpense += inv.totalAmount || 0;
                if (inv.status === 'Paid') {
                    acc.totalPaid += inv.totalAmount || 0;
                } else if (inv.status !== 'Cancelled') {
                    acc.pendingBalance += inv.totalAmount || 0;
                }
                return acc;
            }, { totalExpense: 0, totalPaid: 0, pendingBalance: 0 });
            
            setSummary(stats);
        } catch (error) {
            toast.error("Failed to load vendor history");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-all"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Directory
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Profile Card */}
                <div className="w-full lg:w-1/3 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10 text-center">
                            <div className="w-20 h-20 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Building2 className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 leading-tight">{vendor.name}</h3>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-2 bg-indigo-50 px-4 py-1.5 rounded-full inline-block">{vendor.category}</p>
                            
                            <div className="mt-10 space-y-4 text-left border-t border-slate-50 pt-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                                        <p className="text-xs font-bold text-slate-900 truncate">{vendor.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                                        <p className="text-xs font-bold text-slate-900">{vendor.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Billing Address</p>
                                        <p className="text-xs font-bold text-slate-900 leading-relaxed">{vendor.address || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 flex items-center gap-2">
                            <Landmark className="w-4 h-4" /> Bank Account Info
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Holder Name</p>
                                <p className="text-xs font-bold">{vendor.bankDetails?.accountName || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Account Number</p>
                                <p className="text-xs font-bold font-mono tracking-wider">{vendor.bankDetails?.accountNumber || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">IFSC Code</p>
                                    <p className="text-xs font-bold">{vendor.bankDetails?.ifsc || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Bank Name</p>
                                    <p className="text-xs font-bold">{vendor.bankDetails?.bankName || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 border-l-4 border-l-indigo-500">
                            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Total Expense</p>
                            <h4 className="text-xl font-black text-slate-900">₹{summary.totalExpense.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h4>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 border-l-4 border-l-emerald-500">
                            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Total Paid</p>
                            <h4 className="text-xl font-black text-emerald-600">₹{summary.totalPaid.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h4>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 border-l-4 border-l-orange-500">
                            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Pending Balance</p>
                            <h4 className="text-xl font-black text-orange-600">₹{summary.pendingBalance.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h4>
                        </div>
                    </div>

                    {/* Transaction Tabs */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                <FileText className="w-5 h-5 text-indigo-600" /> Transaction Timeline
                            </h4>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                                                No transaction history with this vendor.
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((inv) => (
                                            <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <p className="text-sm font-bold text-slate-900">{format(new Date(inv.invoiceDate), 'dd MMM yyyy')}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-bold text-slate-800">#{inv.invoiceNumber}</p>
                                                    <p className="text-[10px] text-slate-500 italic truncate max-w-[150px]">{inv.description || 'Service/Bill'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-tight">{inv.category}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right font-black text-slate-900">
                                                    ₹{inv.totalAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        inv.status === 'Approved' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                                                    }`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
