'use client';

import React from 'react';
import TimesheetApprovals from '@/components/tasks/TimesheetApprovals';
import { ClipboardCheck } from 'lucide-react';

export default function TimesheetApprovalsPage() {
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
                        Timesheet Approvals
                    </h1>
                    <p className="text-slate-400 text-sm max-w-xl">
                        Dedicated workspace for team supervisors to review and approve employee timesheet time logs.
                    </p>
                </div>
            </div>

            {/* Render Timesheet Approvals View */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden p-2">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <TimesheetApprovals />
                </div>
            </div>
        </div>
    );
}
