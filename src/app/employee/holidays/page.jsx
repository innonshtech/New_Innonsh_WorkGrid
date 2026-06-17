"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Info, Clock, CheckCircle, XCircle, AlertCircle, Sun } from "lucide-react";
import { toast } from "react-hot-toast";

export default function EmployeeHolidaysPage() {
    const [data, setData] = useState({
        holidayList: null,
        mandatoryHolidays: [],
        restrictedHolidays: [],
        claims: [],
        quota: 0
    });
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/v1/employee/holidays");
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            setData(result);
        } catch (error) {
            toast.error(error.message || "Failed to load holidays");
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (holidayId) => {
        try {
            setProcessingId(holidayId);
            const res = await fetch("/api/v1/employee/holidays/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ holidayId })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);

            toast.success("Holiday successfully claimed!");
            // Refresh data
            fetchHolidays();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelClaim = async (claimId) => {
        if (!window.confirm("Are you sure you want to cancel this holiday claim?")) return;
        try {
            setProcessingId(claimId);
            const res = await fetch(`/api/v1/employee/holidays/claim?id=${claimId}`, {
                method: "DELETE"
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);

            toast.success("Claim cancelled!");
            fetchHolidays();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const getClaimStatus = (holidayId) => {
        return data.claims.find(c => c.holidayId === holidayId);
    };

    const approvedClaimsCount = data.claims.filter(c => c.status !== 'Rejected').length;
    const remainingQuota = Math.max(0, data.quota - approvedClaimsCount);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!data.holidayList) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Calendar className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No Holiday List Assigned</h2>
                <p className="text-slate-500 max-w-md">
                    Your account is currently not linked to an active office location or holiday list. Please contact your HR or Administrator to resolve this.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Module Hero */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                            My Holidays
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 max-w-xl">
                            View upcoming holidays, mandatory leaves, and claim your restricted optional holidays.
                        </p>
                    </div>
                </div>
                
                {/* Context Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <p className="text-slate-500 flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4" /> 
                            Showing holidays for <span className="font-semibold text-slate-700">{data.holidayList.name}</span>
                        </p>
                    </div>
                    {data.quota > 0 && (
                        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <Sun className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Optional Quota</p>
                                <p className="text-xl font-bold text-slate-800">
                                    <span className="text-indigo-600">{remainingQuota}</span> <span className="text-slate-400 text-base font-medium">/ {data.quota} remaining</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Mandatory Holidays - Spans 2 cols */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                            <h2 className="text-lg font-bold text-slate-800">Mandatory Holidays</h2>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                                {data.mandatoryHolidays.length}
                            </span>
                        </div>

                        {data.mandatoryHolidays.length === 0 ? (
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
                                No mandatory holidays scheduled.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {data.mandatoryHolidays.map((holiday, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={holiday._id || holiday.id || idx}
                                        className="bg-white p-5 rounded-2xl border border-slate-200 hover: transition- relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className="flex flex-col items-center justify-center min-w-[3.5rem] p-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl">
                                                <span className="text-sm font-semibold uppercase">{new Date(holiday.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'short' })}</span>
                                                <span className="text-2xl font-bold leading-none mt-1">{new Date(holiday.date).getDate()}</span>
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <h3 className="font-bold text-slate-800 line-clamp-1" title={holiday.name}>{holiday.name}</h3>
                                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(holiday.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'long' })}
                                                </p>
                                                {holiday.numberOfDays > 1 && (
                                                    <p className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-2 inline-block border border-indigo-100">
                                                        {holiday.numberOfDays} Days Off
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Restricted Holidays - Spans 1 col */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-6 bg-amber-500 rounded-full"></div>
                            <h2 className="text-lg font-bold text-slate-800">Restricted Holidays</h2>
                            <div className="group relative ml-1 cursor-help">
                                <Info className="w-4 h-4 text-slate-400" />
                                <div className="absolute bottom-full mb-2 -left-1/2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    You can pick and claim holidays from this list up to your allowed quota.
                                </div>
                            </div>
                        </div>

                        {data.quota === 0 ? (
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <AlertCircle className="w-6 h-6 text-slate-400" />
                                </div>
                                <h3 className="font-bold text-slate-700 mb-1">No Optional Quota</h3>
                                <p className="text-xs text-slate-500">Your holiday list does not allow optional holidays this year.</p>
                            </div>
                        ) : data.restrictedHolidays.length === 0 ? (
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-500">
                                No restricted holidays configured.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.restrictedHolidays.map((holiday, idx) => {
                                    const claim = getClaimStatus(holiday._id);
                                    const isClaimed = !!claim && claim.status !== 'Rejected';
                                    const isAutoApproved = claim?.status === 'Approved';
                                    const dateObj = new Date(holiday.date);
                                    const isPast = dateObj < new Date(new Date().setHours(0,0,0,0));

                                    return (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            key={holiday._id}
                                            className={`p-4 rounded-2xl border transition-all ${isClaimed ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{holiday.name}</h3>
                                                    <p className="text-sm text-slate-500 mt-0.5">
                                                        {dateObj.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' })} • {dateObj.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short' })}
                                                    </p>
                                                </div>

                                                <div>
                                                    {isClaimed ? (
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg">
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                                {isAutoApproved ? 'Claimed' : 'Pending'}
                                                            </span>
                                                            {!isPast && (
                                                                <button
                                                                    onClick={() => handleCancelClaim(claim._id)}
                                                                    disabled={processingId === claim._id}
                                                                    className="text-[10px] uppercase font-bold text-slate-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : isPast ? (
                                                        <span className="text-xs font-medium text-slate-400 px-3 py-1.5 bg-slate-50 rounded-lg">Past</span>
                                                    ) : remainingQuota > 0 ? (
                                                        <button 
                                                            onClick={() => handleClaim(holiday._id)}
                                                            disabled={processingId === holiday._id}
                                                            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                                        >
                                                            {processingId === holiday._id ? '...' : 'Claim'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs font-medium text-amber-600 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">Quota Full</span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Icon helper
function MapPin(props) {
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
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
