'use client';

import React, { useState } from 'react';
import TeamLeaveApprovals from '@/components/payroll/team-leave-approvals';
import TimesheetApprovals from '@/components/tasks/TimesheetApprovals';
import { CalendarRange, ClipboardCheck, LayoutGrid } from 'lucide-react';

/* ─── Premium Tab Button ─── */
const TabButton = ({ active, label, icon: Icon, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`group relative flex items-center gap-2.5 px-6 py-3.5 text-xs font-black tracking-wider uppercase transition-all duration-300 rounded-xl whitespace-nowrap ${
            active
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 border border-transparent'
        }`}
    >
        <Icon className={`w-4 h-4 transition-transform duration-300 ${active ? 'text-white scale-110' : 'text-slate-400 group-hover:text-indigo-500 group-hover:scale-110'}`} />
        {label}
    </button>
);

export default function TeamApprovalsPage() {
    const [activeTab, setActiveTab] = useState('timesheets'); // Default to timesheets to show our work!

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-6 bg-slate-50/20 min-h-screen">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 border border-slate-800">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <ClipboardCheck className="w-3.5 h-3.5" /> Supervisor Approvals Desk
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">
                        Team Request Control Center
                    </h1>
                    <p className="text-slate-400 text-sm max-w-xl">
                        Unified workspace for team supervisors to review timesheet time logs and approve leave applications instantly.
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-2 max-w-md">
                <nav className="flex gap-2">
                    <TabButton 
                        active={activeTab === 'timesheets'} 
                        label="Timesheet Approvals" 
                        icon={ClipboardCheck} 
                        onClick={() => setActiveTab('timesheets')} 
                    />
                    <TabButton 
                        active={activeTab === 'leaves'} 
                        label="Leave Applications" 
                        icon={CalendarRange} 
                        onClick={() => setActiveTab('leaves')} 
                    />
                </nav>
            </div>

            {/* Render Selected View */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden p-2">
                {activeTab === 'timesheets' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <TimesheetApprovals />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <TeamLeaveApprovals />
                    </div>
                )}
            </div>
        </div>
    );
}
