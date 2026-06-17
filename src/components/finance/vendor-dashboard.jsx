"use client";

import { useState, useEffect } from "react";
import { 
    Users, DollarSign, CreditCard, Clock, 
    ArrowUpRight, ArrowDownRight, Activity,
    TrendingUp, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

export default function VendorDashboard() {
    const [stats, setStats] = useState({
        totalVendors: 0,
        totalExpenses: 0,
        paidAmount: 0,
        pendingPayments: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/v1/admin/finance/vendors/stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            toast.error("Failed to load dashboard stats");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

    const cards = [
        {
            label: "Total Vendors",
            value: stats.totalVendors,
            Icon: Users,
            color: "indigo",
            trend: "+2 this month",
            isCurrency: false
        },
        {
            label: "Total Vendor Expenses",
            value: stats.totalExpenses,
            Icon: DollarSign,
            color: "orange",
            trend: "+12% vs last month",
            isCurrency: true
        },
        {
            label: "Total Paid Amount",
            value: stats.paidAmount,
            Icon: CreditCard,
            color: "emerald",
            trend: "85% payout rate",
            isCurrency: true
        },
        {
            label: "Pending Payments",
            value: stats.pendingPayments,
            Icon: Clock,
            color: "rose",
            trend: "Action required",
            isCurrency: true
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 hover: transition-all duration-500 group relative overflow-hidden border-l-4 ${
                        card.color === 'indigo' ? 'border-l-indigo-500' :
                        card.color === 'orange' ? 'border-l-orange-500' :
                        card.color === 'emerald' ? 'border-l-emerald-500' : 'border-l-rose-500'
                    }`}>
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700 ${
                            card.color === 'indigo' ? 'bg-indigo-50' :
                            card.color === 'orange' ? 'bg-orange-50' :
                            card.color === 'emerald' ? 'bg-emerald-50' : 'bg-rose-50'
                        }`}></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                    card.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                                    card.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                                    card.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                }`}>
                                    <card.Icon className="w-6 h-6" />
                                </div>
                                <span className={`flex items-center text-[10px] font-black uppercase tracking-widest ${card.color === 'rose' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {card.color === 'rose' ? <ArrowDownRight className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />}
                                    {card.trend}
                                </span>
                            </div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                                {card.isCurrency ? `₹${(card.value || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}` : (card.value || 0)}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                            <Activity className="w-5 h-5 text-indigo-600" /> Expense Analysis
                        </h4>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-xl hover:bg-slate-100 transition-all">Week</button>
                            <button className="px-4 py-2 bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white rounded-xl">Month</button>
                        </div>
                    </div>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Chart visualization will be populated as data grows</p>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] relative overflow-hidden text-white border border-slate-800">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                            <TrendingUp className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight mb-2">Vendor Compliance</h4>
                        <p className="text-slate-400 text-xs font-medium mb-8">Maintain healthy relations with your partners.</p>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Paid on Time</span>
                                    <span className="text-emerald-400">92%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Invoice Accuracy</span>
                                    <span className="text-indigo-400">98%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '98%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
