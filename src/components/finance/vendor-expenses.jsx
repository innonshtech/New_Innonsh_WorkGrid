"use client";

import { useState, useEffect } from "react";
import { 
    Plus, Search, Filter, FileText, 
    MoreVertical, Trash2, Edit3, CheckCircle2, 
    Clock, AlertCircle, Loader2, IndianRupee,
    X, Save, Calendar, Upload
} from "lucide-react";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const EXPENSE_CATEGORIES = [
    'IT Services', 'Office Supplies', 'Benefits Provider', 'Consultant', 
    'Travel', 'Software', 'Maintenance', 'Marketing', 'Legal', 'Other'
];

export default function VendorExpenses() {
    const [expenses, setExpenses] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // CRUD States
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const [formData, setFormData] = useState({
        vendor: "",
        invoiceNumber: "",
        invoiceDate: format(new Date(), 'yyyy-MM-dd'),
        category: "Other",
        description: "",
        totalAmount: 0,
        subTotal: 0,
        totalTax: 0,
        status: "Pending",
        items: []
    });

    useEffect(() => {
        fetchExpenses();
        fetchVendors();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/admin/finance/vendors/invoices');
            const data = await res.json();
            setExpenses(data.invoices || []);
        } catch (error) {
            toast.error("Failed to load expenses");
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/v1/admin/finance/vendors');
            const data = await res.json();
            setVendors(data.vendors || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenCreate = () => {
        setFormData({
            vendor: "",
            invoiceNumber: "",
            invoiceDate: format(new Date(), 'yyyy-MM-dd'),
            category: "Other",
            description: "",
            totalAmount: 0,
            subTotal: 0,
            totalTax: 0,
            status: "Pending",
            items: []
        });
        setIsEditing(false);
        setEditingId(null);
        setShowModal(true);
    };

    const handleOpenEdit = (exp) => {
        setFormData({
            vendor: exp.vendor?._id || "",
            invoiceNumber: exp.invoiceNumber,
            invoiceDate: format(new Date(exp.invoiceDate), 'yyyy-MM-dd'),
            category: exp.category || "Other",
            description: exp.description || "",
            totalAmount: exp.totalAmount,
            subTotal: exp.subTotal || exp.totalAmount,
            totalTax: exp.totalTax || 0,
            status: exp.status || "Pending",
            items: exp.items || []
        });
        setIsEditing(true);
        setEditingId(exp._id);
        setShowModal(true);
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await fetch('/api/v1/admin/finance/vendors/invoices', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });
            if (!res.ok) throw new Error("Failed to update status");
            toast.success(`Bill marked as ${newStatus}`);
            fetchExpenses();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!confirm("Are you sure you want to delete this expense record?")) return;
        try {
            const res = await fetch(`/api/v1/admin/finance/vendors/invoices?id=${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Failed to delete expense");
            toast.success("Expense record deleted successfully");
            fetchExpenses();
            if (showViewModal && selectedExpense?._id === id) {
                setShowViewModal(false);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const recalculateTotals = (itemsList) => {
        let sub = 0;
        let tax = 0;
        itemsList.forEach(item => {
            const amt = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
            const txAmt = amt * ((Number(item.taxPercent) || 0) / 100);
            sub += amt;
            tax += txAmt;
        });
        return {
            subTotal: sub,
            totalTax: tax,
            totalAmount: sub + tax
        };
    };

    const handleAddItem = () => {
        const newItem = { description: "", quantity: 1, rate: 0, taxPercent: 0, amount: 0, taxAmount: 0 };
        const updatedItems = [...(formData.items || []), newItem];
        const totals = recalculateTotals(updatedItems);
        setFormData(prev => ({
            ...prev,
            items: updatedItems,
            totalAmount: totals.totalAmount,
            subTotal: totals.subTotal,
            totalTax: totals.totalTax
        }));
    };

    const handleRemoveItem = (index) => {
        const updatedItems = formData.items.filter((_, i) => i !== index);
        const totals = recalculateTotals(updatedItems);
        setFormData(prev => ({
            ...prev,
            items: updatedItems,
            totalAmount: totals.totalAmount,
            subTotal: totals.subTotal,
            totalTax: totals.totalTax
        }));
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = formData.items.map((item, i) => {
            if (i === index) {
                const updated = { ...item, [field]: value };
                const quantity = field === 'quantity' ? Number(value) : Number(updated.quantity || 0);
                const rate = field === 'rate' ? Number(value) : Number(updated.rate || 0);
                const taxPercent = field === 'taxPercent' ? Number(value) : Number(updated.taxPercent || 0);
                
                updated.amount = quantity * rate;
                updated.taxAmount = updated.amount * (taxPercent / 100);
                return updated;
            }
            return item;
        });
        const totals = recalculateTotals(updatedItems);
        setFormData(prev => ({
            ...prev,
            items: updatedItems,
            totalAmount: totals.totalAmount,
            subTotal: totals.subTotal,
            totalTax: totals.totalTax
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.vendor || !formData.totalAmount || !formData.invoiceNumber) {
            toast.error("Please fill required fields (Vendor, Amount, Invoice #)");
            return;
        }

        try {
            setSubmitting(true);
            const url = '/api/v1/admin/finance/vendors/invoices';
            const method = isEditing ? 'PUT' : 'POST';
            const payload = isEditing 
                ? { id: editingId, ...formData, invoiceDate: new Date(formData.invoiceDate) }
                : { ...formData, invoiceDate: new Date(formData.invoiceDate) };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(isEditing ? "Failed to update expense" : "Failed to record expense");
            toast.success(isEditing ? "Expense updated successfully" : "Expense recorded successfully");
            setShowModal(false);
            fetchExpenses();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Approved': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'Pending': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'Cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Toaster />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Vendor Expenses</h3>
                    <p className="text-slate-500 text-xs font-medium">Track and approve bills from external providers.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                >
                    <Plus className="w-4 h-4" /> Record New Bill
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            placeholder="Search by vendor or invoice..." 
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all"><Filter className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-8 py-10 bg-slate-50/10"></td>
                                    </tr>
                                ))
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                                        No expense records found.
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((exp) => (
                                    <tr key={exp._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-indigo-600 text-xs">
                                                    {exp.vendor?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{exp.vendor?.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold">{exp.vendor?.companyName || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-slate-800">#{exp.invoiceNumber}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{format(new Date(exp.invoiceDate), 'dd MMM yyyy')}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-tight">{exp.category}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-slate-900">
                                            ₹{exp.totalAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(exp.status)}`}>
                                                {exp.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedExpense(exp);
                                                        setShowViewModal(true);
                                                    }}
                                                    title="View Bill Details"
                                                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition-all active:scale-95">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44 bg-slate-900 border border-slate-800 text-slate-350 rounded-xl p-1 shadow-xl z-50">
                                                        <DropdownMenuItem 
                                                            onClick={() => handleOpenEdit(exp)}
                                                            className="flex items-center gap-2 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                                                            Edit Bill
                                                        </DropdownMenuItem>
                                                        
                                                        {exp.status === 'Pending' && (
                                                            <DropdownMenuItem 
                                                                onClick={() => handleStatusChange(exp._id, 'Approved')}
                                                                className="flex items-center gap-2 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                                                                Approve Bill
                                                            </DropdownMenuItem>
                                                        )}
                                                        
                                                        {exp.status !== 'Paid' && (
                                                            <DropdownMenuItem 
                                                                onClick={() => handleStatusChange(exp._id, 'Paid')}
                                                                className="flex items-center gap-2 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                                                            >
                                                                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                                                                Mark as Paid
                                                            </DropdownMenuItem>
                                                        )}
                                                        
                                                        {exp.status !== 'Paid' && exp.status !== 'Cancelled' && (
                                                            <DropdownMenuItem 
                                                                onClick={() => handleStatusChange(exp._id, 'Cancelled')}
                                                                className="flex items-center gap-2 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                                                            >
                                                                <X className="w-3.5 h-3.5 text-rose-400" />
                                                                Cancel Bill
                                                            </DropdownMenuItem>
                                                        )}
                                                        
                                                        <DropdownMenuSeparator className="border-slate-800 my-1" />
                                                        
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDeleteExpense(exp._id)}
                                                            className="flex items-center gap-2 text-rose-500 hover:bg-rose-950/20 hover:text-rose-400 focus:bg-rose-950/20 focus:text-rose-400 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Delete Record
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Expense Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                                        <IndianRupee className="w-6 h-6 text-white" />
                                    </div>
                                    {isEditing ? "Modify Vendor Bill" : "Record Vendor Bill"}
                                </h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white hover: rounded-2xl transition-all text-slate-400 hover:text-slate-900">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Vendor *</label>
                                    <select
                                        required
                                        value={formData.vendor}
                                        onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all appearance-none"
                                    >
                                        <option value="">Choose a vendor</option>
                                        {vendors.map(v => (
                                            <option key={v._id} value={v._id}>{v.name} ({v.companyName || 'N/A'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹) *</label>
                                        {formData.items && formData.items.length > 0 && (
                                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">Auto-Calculated</span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">₹</span>
                                        <input
                                            required
                                            type="number"
                                            value={formData.totalAmount}
                                            readOnly={formData.items && formData.items.length > 0}
                                            onChange={e => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                                            className={`w-full pl-12 pr-5 py-4 border-2 border-slate-100 rounded-2xl text-sm font-black outline-none transition-all ${
                                                formData.items && formData.items.length > 0
                                                    ? 'bg-indigo-50/30 text-indigo-700 border-indigo-100 cursor-not-allowed'
                                                    : 'bg-slate-50 focus:border-indigo-500 text-slate-900'
                                            }`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Invoice # *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="INV-2024-001"
                                        value={formData.invoiceNumber}
                                        onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all appearance-none"
                                    >
                                        {EXPENSE_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="date"
                                            value={formData.invoiceDate}
                                            onChange={e => setFormData({ ...formData, invoiceDate: e.target.value })}
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status Indicator</label>
                                    <div className="flex gap-2">
                                        {['Pending', 'Approved'].map(st => (
                                            <button
                                                key={st}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, status: st })}
                                                className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                                    formData.status === st 
                                                    ? 'bg-slate-900 border-slate-900 text-white' 
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                }`}
                                            >
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2 border-t border-slate-100 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Daily Consumptions / Line Items</h4>
                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Log daily deliveries here to automatically sum totals & taxes.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddItem}
                                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Line Log
                                        </button>
                                    </div>

                                    {(!formData.items || formData.items.length === 0) ? (
                                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider italic">No line items logged yet.</p>
                                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">Click "Add Line Log" to start logging daily deliveries.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                                            {formData.items.map((item, index) => (
                                                <div key={index} className="flex gap-3 items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                                    <div className="flex-1">
                                                        <input 
                                                            type="text"
                                                            placeholder="Description (e.g. 02 June - 10 Teas)"
                                                            required
                                                            value={item.description}
                                                            onChange={e => handleItemChange(index, 'description', e.target.value)}
                                                            className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-slate-350"
                                                        />
                                                    </div>
                                                    <div className="w-16">
                                                        <input 
                                                            type="number"
                                                            placeholder="Qty"
                                                            required
                                                            min="1"
                                                            value={item.quantity || ''}
                                                            onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                                                            className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-center outline-none focus:border-indigo-500 transition-all"
                                                        />
                                                    </div>
                                                    <div className="w-20">
                                                        <input 
                                                            type="number"
                                                            placeholder="Rate"
                                                            required
                                                            min="0"
                                                            value={item.rate || ''}
                                                            onChange={e => handleItemChange(index, 'rate', e.target.value)}
                                                            className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-center outline-none focus:border-indigo-500 transition-all"
                                                        />
                                                    </div>
                                                    <div className="w-16">
                                                        <input 
                                                            type="number"
                                                            placeholder="GST %"
                                                            min="0"
                                                            value={item.taxPercent === 0 ? '0' : (item.taxPercent || '')}
                                                            onChange={e => handleItemChange(index, 'taxPercent', e.target.value)}
                                                            className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-center outline-none focus:border-indigo-500 transition-all"
                                                        />
                                                    </div>
                                                    <div className="text-right w-20">
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Subtotal</p>
                                                        <p className="text-xs font-black text-slate-800">₹{((item.quantity || 0) * (item.rate || 0)).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                                                        title="Remove Line Log"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center px-3 py-2 bg-indigo-50/20 border border-indigo-100 rounded-2xl">
                                                <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Consolidated Monthly Summary</p>
                                                <p className="text-xs font-black text-indigo-900">
                                                    Subtotal: ₹{(formData.subTotal || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })} • Tax: ₹{(formData.totalTax || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })} • Total Amount: ₹{(formData.totalAmount || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                    <textarea
                                        rows="2"
                                        placeholder="What was this expense for?"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            </div>

                            <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50">
                                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 disabled:opacity-70"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {submitting ? "Processing..." : "Save Record"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {showViewModal && selectedExpense && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                    Bill Details
                                </h2>
                                <p className="text-xs text-slate-500 font-bold mt-0.5">#{selectedExpense.invoiceNumber}</p>
                            </div>
                            <button onClick={() => setShowViewModal(false)} className="p-3 hover:bg-white hover: rounded-2xl transition-all text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</p>
                                    <p className="text-base font-black text-slate-900 mt-1">{selectedExpense.vendor?.name}</p>
                                    <p className="text-xs font-bold text-slate-500 mt-0.5">{selectedExpense.vendor?.companyName || 'N/A'}</p>
                                </div>
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(selectedExpense.status)}`}>
                                    {selectedExpense.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Date</p>
                                    <p className="text-xs font-bold text-slate-800 mt-1">
                                        {format(new Date(selectedExpense.invoiceDate), 'dd MMM yyyy')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                                    <span className="inline-block mt-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-650 uppercase tracking-tight">
                                        {selectedExpense.category}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                                <p className="text-3xl font-black text-slate-900 mt-1">₹{selectedExpense.totalAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                            </div>

                            {selectedExpense.status === 'Paid' && selectedExpense.paymentDetails && (
                                <div className="space-y-3 bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Payment Settlement Details</p>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Payment Mode</p>
                                            <p className="font-bold text-slate-800 mt-0.5">{selectedExpense.paymentDetails.paymentMode || 'Bank Transfer'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Settlement Date</p>
                                            <p className="font-bold text-slate-800 mt-0.5">
                                                {selectedExpense.paymentDetails.paymentDate 
                                                    ? format(new Date(selectedExpense.paymentDetails.paymentDate), 'dd MMM yyyy') 
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Reference / Transaction ID</p>
                                            <p className="font-black text-slate-950 mt-0.5 select-all">{selectedExpense.paymentDetails.referenceNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Payment Receipt</p>
                                            {selectedExpense.paymentDetails.receiptUrl ? (
                                                <a 
                                                    href={selectedExpense.paymentDetails.receiptUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest mt-1"
                                                >
                                                    <Receipt className="w-3.5 h-3.5" /> View Receipt ↗
                                                </a>
                                            ) : (
                                                <p className="text-slate-400 font-bold mt-0.5 italic">No receipt uploaded</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedExpense.items && selectedExpense.items.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged Line Items</p>
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                                        <table className="w-full text-left border-collapse text-[11px]">
                                            <thead>
                                                <tr className="bg-slate-100/50 font-black text-slate-500 border-b border-slate-200/55 uppercase tracking-wider">
                                                    <th className="px-4 py-2">Item / Delivery</th>
                                                    <th className="px-4 py-2 text-center">Qty</th>
                                                    <th className="px-4 py-2 text-center">Rate</th>
                                                    <th className="px-4 py-2 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                                {selectedExpense.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2.5 font-bold text-slate-800">{item.description}</td>
                                                        <td className="px-4 py-2.5 text-center">{item.quantity}</td>
                                                        <td className="px-4 py-2.5 text-center">₹{(item.rate || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</td>
                                                        <td className="px-4 py-2.5 text-right font-bold text-slate-850">₹{((item.quantity || 0) * (item.rate || 0)).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {(selectedExpense.subTotal > 0 || selectedExpense.totalTax > 0) && (
                                            <div className="p-3 bg-indigo-50/20 border-t border-slate-100 flex justify-between items-center text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                                                <span>Subtotal: ₹{selectedExpense.subTotal?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                                                <span>Tax: ₹{selectedExpense.totalTax?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedExpense.description && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        {selectedExpense.description}
                                    </p>
                                </div>
                            )}

                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 justify-end">
                            {selectedExpense.status === 'Pending' && (
                                <button 
                                    onClick={() => {
                                        handleStatusChange(selectedExpense._id, 'Approved');
                                        setShowViewModal(false);
                                    }}
                                    className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-660 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Approve
                                </button>
                            )}
                            {selectedExpense.status !== 'Paid' && (
                                <button 
                                    onClick={() => {
                                        handleStatusChange(selectedExpense._id, 'Paid');
                                        setShowViewModal(false);
                                    }}
                                    className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Mark as Paid
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleOpenEdit(selectedExpense);
                                }}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-200/60"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleDeleteExpense(selectedExpense._id);
                                }}
                                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
