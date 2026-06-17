"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    CalendarDays,
    Save,
    Send,
    CheckCircle2,
    Calendar,
    Clock,
    Plus,
    X,
    Building,
    FileText,
    ListTodo,
    ChevronLeft,
    ChevronRight,
    Trash2,
    User,
    UserCheck,
    Users,
    AlertCircle,
    Info,
    CheckCircle,
    Edit3,
    Search,
    RefreshCcw
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";

/* ─── Premium Glass Card ─── */
const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-2xl border border-slate-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 ${className}`}>
        {children}
    </div>
);

/* ─── Premium Stat Card ─── */
const StatCard = ({ title, value, subText, icon: Icon, color = "indigo" }) => {
    const colorStyles = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100"
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</p>
                    <p className="text-xs font-medium text-slate-400">{subText}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${colorStyles[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </Card>
    );
};

/* ─── Status Badge ─── */
const StatusBadge = ({ status }) => {
    const styles = {
        'Draft': 'bg-slate-50 text-slate-700 border-slate-200',
        'Submitted': 'bg-blue-50 text-blue-700 border-blue-200',
        'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Rejected': 'bg-rose-50 text-rose-700 border-rose-200'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
            {status}
        </span>
    );
};


/* ─── Hours Input Formatter ─── */
const HoursInput = ({ value, onChange, disabled }) => {
    const [localValue, setLocalValue] = React.useState('');
    
    React.useEffect(() => {
        if (value == null || value === '') {
            setLocalValue('');
            return;
        }
        const num = parseFloat(value);
        if (isNaN(num)) return;
        const h = Math.floor(num);
        const m = Math.round((num - h) * 60);
        setLocalValue(`${h}h ${m.toString().padStart(2, '0')}m`);
    }, [value]);

    const handleBlur = () => {
        let parsed = parseFloat(localValue);
        if (typeof localValue === 'string' && localValue.includes('h')) {
            const parts = localValue.split('h');
            const h = parseFloat(parts[0]) || 0;
            const mPart = parts[1] ? parts[1].replace('m', '').trim() : '0';
            const m = parseFloat(mPart) || 0;
            parsed = h + (m / 60);
        }
        if (!isNaN(parsed)) {
            onChange(parsed);
            const h = Math.floor(parsed);
            const m = Math.round((parsed - h) * 60);
            setLocalValue(`${h}h ${m.toString().padStart(2, '0')}m`);
        } else {
            setLocalValue('');
            onChange(0);
        }
    };

    return (
        <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="0h 00m"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 text-center"
        />
    );
};

export default function TimesheetsPage() {
    const { user, loading: sessionLoading } = useSession();
    const { t } = useLanguage();
    const router = useRouter();

    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [timesheet, setTimesheet] = useState(null);
    const [timesheetEntries, setTimesheetEntries] = useState([]);
    const [isSavingTimesheet, setIsSavingTimesheet] = useState(false);
    const [isSavingEntry, setIsSavingEntry] = useState(false);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [editingEntryIndex, setEditingEntryIndex] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Employee details & manager selection
    const [currentUserEmployee, setCurrentUserEmployee] = useState(null);
    const [reportingManager, setReportingManager] = useState(null);
    const [selectedManagerId, setSelectedManagerId] = useState("");

    const [weekStartDate, setWeekStartDate] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    });

    // Helper: Days of the week
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

    // Fetch projects
    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/v1/employee/tasks/projects?status=Active', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.success) setProjects(data.projects);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };

    // Fetch active employees (potential managers)
    const fetchEmployeesList = async () => {
        try {
            const res = await fetch('/api/v1/employee/payroll/employees?status=Active&limit=1000', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.employees) {
                    setEmployees(data.employees);
                }
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    // Fetch current employee's details (to auto-get reporting manager)
    const fetchEmployeeProfile = async (empId) => {
        try {
            const res = await fetch(`/api/v1/employee/payroll/employees/${empId}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setCurrentUserEmployee(data);
                if (data.jobDetails?.reportingManager) {
                    const managerId = data.jobDetails.reportingManager._id || data.jobDetails.reportingManager;
                    setSelectedManagerId(managerId);
                    
                    // Fetch manager's full profile to bypass employee API restrictions
                    try {
                        const mgrRes = await fetch(`/api/v1/employee/payroll/employees/${managerId}`, { cache: 'no-store' });
                        if (mgrRes.ok) {
                            const mgrData = await mgrRes.json();
                            setReportingManager(mgrData);
                            setEmployees(prev => {
                                if (Array.isArray(prev) && !prev.some(e => e.id === mgrData.id || (e.mongoId && e.mongoId === mgrData.mongoId))) {
                                    return [...prev, mgrData];
                                }
                                return prev;
                            });
                        } else {
                            setReportingManager(managerId);
                        }
                    } catch (e) {
                        setReportingManager(managerId);
                        console.error("Error fetching manager profile:", e);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching employee profile:", error);
        }
    };

    // Fetch Timesheet
    const fetchTimesheet = async (empId, weekDate) => {
        try {
            const res = await fetch(`/api/v1/employee/tasks/timesheets?employeeId=${empId}&weekStartDate=${weekDate.toISOString()}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setTimesheet(data.timesheet);
                    setTimesheetEntries(data.entries || []);
                    if (data.timesheet?.submittedTo) {
                        setSelectedManagerId(data.timesheet.submittedTo._id || data.timesheet.submittedTo);
                    }
                    return;
                }
            }
            setTimesheet(null);
            setTimesheetEntries([]);
        } catch (error) {
            console.error("Error fetching timesheet:", error);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (user?.id && mounted) {
            fetchProjects();
            fetchEmployeesList();
            fetchEmployeeProfile(user.id);
            fetchTimesheet(user.id, weekStartDate);
        }
    }, [user, weekStartDate, mounted]);

    const changeWeek = (offset) => {
        const newDate = new Date(weekStartDate);
        newDate.setDate(newDate.getDate() + (offset * 7));
        setWeekStartDate(newDate);
    };

    // Add entry inline to a specific day
    const handleAddEntryForDay = (date) => {
        if (timesheet?.status === 'Approved' || timesheet?.status === 'Submitted') {
            toast.error(`Cannot edit timesheet in ${timesheet?.status} status.`);
            return;
        }
        if (editingEntryIndex !== null) {
            toast.error("Please save or cancel your current edit before adding a new log.");
            return;
        }

        const newIndex = timesheetEntries.length;
        setTimesheetEntries([
            ...timesheetEntries,
            {
                project: '',
                date: date.toISOString(),
                hours: 8,
                description: ''
            }
        ]);
        setEditingEntryIndex(newIndex);
        toast.success(`Entry added for ${format(date, 'EEEE')}`);
    };

    const handleUpdateEntry = (index, field, value) => {
        const updated = [...timesheetEntries];
        updated[index][field] = value;
        setTimesheetEntries(updated);
    };

    const handleRemoveEntry = async (index) => {
        if (timesheet?.status === 'Approved' || timesheet?.status === 'Submitted') {
            toast.error(`Cannot edit timesheet in ${timesheet?.status} status.`);
            return;
        }

        const updated = timesheetEntries.filter((_, i) => i !== index);
        setTimesheetEntries(updated);

        setIsSavingEntry(true);
        try {
            const res = await fetch('/api/v1/employee/tasks/timesheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee: user.id,
                    weekStartDate: weekStartDate.toISOString(),
                    entries: updated,
                    status: 'Draft',
                    submittedTo: selectedManagerId || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    toast.success('Entry deleted successfully!');
                    fetchTimesheet(user.id, weekStartDate);
                } else {
                    toast.error(data.error || "Failed to delete entry.");
                }
            } else {
                toast.error("Failed to delete entry.");
            }
        } catch (error) {
            console.error("Error deleting entry:", error);
            toast.error("An error occurred while deleting.");
        } finally {
            setIsSavingEntry(false);
        }
    };

    const handleCancelEdit = (index) => {
        const entry = timesheetEntries[index];
        if (!entry || !entry._id) {
            // Remove the unsaved entry entirely
            const updated = timesheetEntries.filter((_, i) => i !== index);
            setTimesheetEntries(updated);
        } else {
            // Revert changes by refetching from db
            fetchTimesheet(user.id, weekStartDate);
        }
        setEditingEntryIndex(null);
    };

    // Save as Draft or Submit
    const handleSaveTimesheet = async (isSubmit = false) => {
        if (isSubmit && timesheetEntries.length === 0) {
            toast.error("Please add at least one entry before submitting.");
            return;
        }

        // Validate entries
        const invalidEntry = timesheetEntries.find(e => !e.project || !e.date || !e.hours);
        if (invalidEntry) {
            toast.error("Please ensure all entries have a project, date, and hours specified.");
            return;
        }

        // Validate daily hour limits
        const dailyHours = {};
        timesheetEntries.forEach(e => {
            const dateStr = format(new Date(e.date), 'yyyy-MM-dd');
            dailyHours[dateStr] = (dailyHours[dateStr] || 0) + parseFloat(e.hours);
        });

        const overLoggedDate = Object.entries(dailyHours).find(([_, hrs]) => hrs > 24);
        if (overLoggedDate) {
            toast.error(`Hours on ${overLoggedDate[0]} cannot exceed 24. Currently: ${overLoggedDate[1]} hrs`);
            return;
        }

        setIsSavingTimesheet(true);
        try {
            const res = await fetch('/api/v1/employee/tasks/timesheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee: user.id,
                    weekStartDate: weekStartDate.toISOString(),
                    entries: timesheetEntries,
                    status: isSubmit ? 'Submitted' : 'Draft',
                    submittedTo: selectedManagerId || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    toast.success(isSubmit ? 'Timesheet Submitted successfully!' : 'Draft Saved successfully!');
                    fetchTimesheet(user.id, weekStartDate);
                    setIsSubmitModalOpen(false);
                } else {
                    toast.error(data.error || "Failed to save timesheet.");
                }
            } else {
                toast.error("Failed to save timesheet.");
            }
        } catch (error) {
            console.error("Error saving timesheet:", error);
            toast.error("An error occurred while saving.");
        } finally {
            setIsSavingTimesheet(false);
        }
    };

    // Save a single entry (saves entire timesheet but scoped UX to one entry)
    const handleSaveEntry = async (entryIndex) => {
        const entry = timesheetEntries[entryIndex];
        if (!entry.project || !entry.date || !entry.hours) {
            toast.error("Please ensure the entry has a project, date, and hours.");
            return;
        }

        setIsSavingEntry(true);
        try {
            const res = await fetch('/api/v1/employee/tasks/timesheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee: user.id,
                    weekStartDate: weekStartDate.toISOString(),
                    entries: timesheetEntries,
                    status: 'Draft',
                    submittedTo: selectedManagerId || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    toast.success('Entry saved successfully!');
                    setEditingEntryIndex(null);
                    fetchTimesheet(user.id, weekStartDate);
                } else {
                    toast.error(data.error || "Failed to save entry.");
                }
            } else {
                toast.error("Failed to save entry.");
            }
        } catch (error) {
            console.error("Error saving entry:", error);
            toast.error("An error occurred while saving.");
        } finally {
            setIsSavingEntry(false);
        }
    };

    if (sessionLoading || !user || !mounted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="relative w-12 h-12">
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                </div>
                <p className="text-slate-500 font-medium text-sm">Loading timesheet workspace...</p>
            </div>
        );
    }

    // Metric summary calculations
    const totalHours = timesheetEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);
    const projectsCount = new Set(timesheetEntries.map(e => e.project?._id || e.project).filter(Boolean)).size;
    const progressPercent = Math.min(100, Math.round((totalHours / 40) * 100));

    // Group entries by week days for rendering
    const getEntriesForDay = (date) => {
        return timesheetEntries.map((e, idx) => ({ ...e, index: idx }))
            .filter(e => isSameDay(new Date(e.date), date));
    };

    const filteredWeekDays = weekDays.filter(day => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        
        const dateStr1 = format(day, 'dd MMM').toLowerCase();
        const dateStr2 = format(day, 'd MMMM').toLowerCase();
        const dateStr3 = format(day, 'EEEE').toLowerCase();
        if (dateStr1.includes(query) || dateStr2.includes(query) || dateStr3.includes(query)) return true;
        
        const dayEntries = getEntriesForDay(day);
        return dayEntries.some(entry => {
            const entryProjectId = entry.project?.id || entry.project?._id || entry.project?.mongoId || entry.project;
            const projectName = projects.find(p => p.id === entryProjectId || p._id === entryProjectId || p.mongoId === entryProjectId)?.name?.toLowerCase() || '';
            const desc = (entry.description || '').toLowerCase();
            return projectName.includes(query) || desc.includes(query);
        });
    });

    const formatTotalHoursDisplay = (decimal) => {
        if (!decimal) return '0h 00m';
        const h = Math.floor(decimal);
        const m = Math.round((decimal - h) * 60);
        return `${h}h ${m.toString().padStart(2, '0')}m`;
    };

    const handleAddEntryWithData = (date, field, value) => {
        if (timesheet?.status === 'Approved' || timesheet?.status === 'Submitted') return;
        const newEntry = {
            project: field === 'project' ? value : '',
            date: date.toISOString(),
            hours: field === 'hours' ? value : 0,
            description: field === 'description' ? value : ''
        };
        setTimesheetEntries([...timesheetEntries, newEntry]);
        setEditingEntryIndex(timesheetEntries.length);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-6 bg-slate-50/30 min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">
                        My Timesheet
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Log and track your daily work hours and activities.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/employee/timesheet-approvals')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors shadow-sm"
                    >
                        <CheckCircle className="w-4 h-4" /> Approvals Portal
                    </button>
                </div>
            </div>

            {/* Timesheet Table Container */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Table Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-3">
                        <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-300 transition-colors cursor-pointer min-w-[120px]">
                            <option value="weekly">Weekly</option>
                        </select>
                        <div className="flex items-center justify-between border border-slate-200 rounded-lg px-2 py-1 bg-white min-w-[160px]">
                            <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-slate-50 rounded text-slate-500 transition-colors"><ChevronLeft className="w-3.5 h-3.5"/></button>
                            <span className="text-xs font-medium text-slate-700">
                                {format(weekStartDate, 'MMM dd')} - {format(addDays(weekStartDate, 6), 'MMM dd')}
                            </span>
                            <button onClick={() => changeWeek(1)} className="p-1 hover:bg-slate-50 rounded text-slate-500 transition-colors"><ChevronRight className="w-3.5 h-3.5"/></button>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by project, task, or date (e.g. 7 Jun)..." 
                                className="w-full sm:w-[240px] bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-300 transition-colors" 
                            />
                        </div>
                        <button 
                            onClick={async () => {
                                const toastId = toast.loading("Refreshing timesheet...");
                                await fetchTimesheet(user.id, weekStartDate);
                                toast.success("Timesheet refreshed!", { id: toastId });
                            }} 
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <RefreshCcw className="w-3.5 h-3.5" /> Refresh
                        </button>
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr className="">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 text-center">#</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32 text-left">DATE</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">PROJECT</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32 text-left">HOURS</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">ACTIVITY / TASK DETAILS</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32 text-center">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody className="">
                        {filteredWeekDays.map((day, dayIndex) => {
                            const dayEntries = getEntriesForDay(day);
                            const entriesToRender = dayEntries.length > 0 ? dayEntries : [{ _isPlaceholder: true, date: day.toISOString() }];
                            
                            return (
                                <React.Fragment key={day.toISOString()}>
                                    {entriesToRender.map((entry, entryIdx) => {
                                        const isLastEntry = entryIdx === entriesToRender.length - 1;
                                        const showBottomBorder = dayEntries.length === 0 || (isLastEntry && dayEntries.length > 0);
                                        return (
                                        <tr key={entry.index ?? `placeholder-${entryIdx}`} className={`hover:bg-slate-50/30 transition-colors ${showBottomBorder && dayEntries.length === 0 ? 'border-b border-slate-100' : ''}`}>
                                            {entryIdx === 0 ? (
                                                <>
                                                    <td className="px-6 py-5 align-middle">
                                                        <span className="font-bold text-slate-800 text-sm">{dayIndex + 1}</span>
                                                    </td>
                                                    <td className="px-6 py-5 align-middle">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100/50">
                                                                {format(day, 'dd')}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">{format(day, 'EEE')}</p>
                                                                <p className="text-[11px] font-medium text-slate-500">{format(day, 'MMM')}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-3"></td>
                                                    <td className="px-6 py-3"></td>
                                                </>
                                            )}
                                            
                                            <td className="px-6 py-3 align-middle w-64">
                                                <div className="space-y-1">
                                                    <select
                                                        value={entry.project?.id || entry.project?._id || entry.project?.mongoId || entry.project || ''}
                                                        onChange={(e) => {
                                                            if(entry._isPlaceholder) {
                                                                handleAddEntryWithData(day, 'project', e.target.value);
                                                            } else {
                                                                handleUpdateEntry(entry.index, 'project', e.target.value);
                                                            }
                                                        }}
                                                        disabled={timesheet?.status === 'Approved' || timesheet?.status === 'Submitted' || (!entry._isPlaceholder && editingEntryIndex !== entry.index)}
                                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 appearance-none bg-white"
                                                    >
                                                        <option value="">Select Project</option>
                                                        {projects.map(p => {
                                                            const projectId = p.id || p._id || p.mongoId;
                                                            return <option key={projectId} value={projectId}>{p.name}</option>
                                                        })}
                                                    </select>
                                                    {(() => {
                                                        const entryProjectId = entry.project?.id || entry.project?._id || entry.project?.mongoId || entry.project;
                                                        const proj = entry.project && projects.find(p => p.id === entryProjectId || p._id === entryProjectId || p.mongoId === entryProjectId);
                                                        return proj && proj.projectId && (
                                                            <p className="text-[10px] text-slate-400 font-semibold px-1">
                                                                {proj.projectId}
                                                            </p>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
                                            
                                            <td className="px-6 py-3 align-middle w-32">
                                                <HoursInput
                                                    value={entry.hours}
                                                    onChange={(val) => {
                                                        if(entry._isPlaceholder) {
                                                            handleAddEntryWithData(day, 'hours', val);
                                                        } else {
                                                            handleUpdateEntry(entry.index, 'hours', val);
                                                        }
                                                    }}
                                                    disabled={timesheet?.status === 'Approved' || timesheet?.status === 'Submitted' || (!entry._isPlaceholder && editingEntryIndex !== entry.index)}
                                                />
                                            </td>
                                            
                                            <td className="px-6 py-3 align-middle">
                                                <textarea
                                                    rows={1}
                                                    placeholder="What did you work on?"
                                                    value={entry.description || ''}
                                                    onInput={(e) => {
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                                    }}
                                                    onChange={(e) => {
                                                        const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s.,?!'-]/g, '');
                                                        if(entry._isPlaceholder) {
                                                            handleAddEntryWithData(day, 'description', sanitizedValue);
                                                        } else {
                                                            handleUpdateEntry(entry.index, 'description', sanitizedValue);
                                                        }
                                                    }}
                                                    disabled={timesheet?.status === 'Approved' || timesheet?.status === 'Submitted' || (!entry._isPlaceholder && editingEntryIndex !== entry.index)}
                                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:border-indigo-500 resize-none overflow-hidden min-h-[44px] break-words"
                                                    style={{ height: 'auto' }}
                                                />
                                            </td>
                                            
                                            <td className="px-6 py-3 align-middle">
                                                <div className="flex items-center justify-center gap-2 mt-1">
                                                    {!entry._isPlaceholder && editingEntryIndex !== entry.index ? (
                                                        <button 
                                                            onClick={() => setEditingEntryIndex(entry.index)}
                                                            disabled={timesheet?.status === 'Approved' || timesheet?.status === 'Submitted'}
                                                            className={`p-1.5 text-indigo-500 hover:bg-indigo-50 border border-indigo-100 rounded transition-colors ${timesheet?.status === 'Approved' || timesheet?.status === 'Submitted' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            title="Edit"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => !entry._isPlaceholder && handleSaveEntry(entry.index)}
                                                            disabled={entry._isPlaceholder || isSavingEntry}
                                                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 border border-emerald-100 rounded transition-colors disabled:opacity-50"
                                                            title="Save"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => !entry._isPlaceholder && handleRemoveEntry(entry.index)}
                                                        disabled={entry._isPlaceholder || timesheet?.status === 'Approved' || timesheet?.status === 'Submitted'}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 border border-rose-100 rounded transition-colors disabled:opacity-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                    
                                    {/* Add Another Project Button */}
                                    {dayEntries.length > 0 && (
                                        <tr className="border-b border-slate-100">
                                            <td colSpan={2} className="px-6 pb-4"></td>
                                            <td colSpan={4} className="px-6 pb-4">
                                                <button 
                                                    onClick={() => handleAddEntryForDay(day)}
                                                    className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-slate-300 text-blue-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Add Another Project
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
                
                {/* Table Footer */}
                <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-semibold">
                        Showing {filteredWeekDays.length > 0 ? 1 : 0} to {filteredWeekDays.length} of 7 days
                    </p>
                    <div className="flex items-center gap-6">
                        <p className="text-sm text-slate-600 font-semibold">
                            Total Hours: <span className="text-[#3B82F6] font-bold">{formatTotalHoursDisplay(totalHours)}</span>
                        </p>
                        <button
                            onClick={() => setIsSubmitModalOpen(true)}
                            disabled={isSavingTimesheet || timesheet?.status === 'Approved' || timesheet?.status === 'Submitted'}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-sm"
                        >
                            <Send className="w-4 h-4" /> Submit Timesheet
                        </button>
                    </div>
                </div>
            </div>

            {/* Submission Modal with Manager Selection */}
            {isSubmitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-8 border border-slate-100 flex flex-col space-y-6 animate-scale-up">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-850">Submit Timesheet for Approval</h3>
                                <p className="text-xs font-medium text-slate-400">Review selected manager and confirm submission</p>
                            </div>
                            <button 
                                onClick={() => setIsSubmitModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-indigo-50/60 border border-indigo-100/50 rounded-2xl p-5 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-bold">Total Work Hours:</span>
                                <span className="text-indigo-700 font-extrabold">{totalHours} Hrs</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-bold">Work Period:</span>
                                <span className="text-slate-700 font-extrabold">
                                    {format(weekStartDate, 'MMM dd')} - {format(addDays(weekStartDate, 6), 'MMM dd, yyyy')}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                                Verification Routing (Select Manager)
                            </label>
                            
                            {/* Manager profile summary */}
                            {selectedManagerId ? (
                                (() => {
                                    const selectedManager = employees.find(e => e.id === selectedManagerId || e._id === selectedManagerId || e.mongoId === selectedManagerId);
                                    const name = selectedManager 
                                        ? `${selectedManager.personalDetails?.firstName || selectedManager.firstName || ''} ${selectedManager.personalDetails?.lastName || selectedManager.lastName || ''}`.trim()
                                        : reportingManager 
                                            ? `${reportingManager.personalDetails?.firstName || reportingManager.firstName || ''} ${reportingManager.personalDetails?.lastName || reportingManager.lastName || ''}`.trim()
                                            : "Reporting Supervisor";
                                    const designation = selectedManager?.jobDetails?.designation || selectedManager?.designation || "Assigned Manager";

                                    return (
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-sm uppercase">
                                                {name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-slate-800 truncate">{name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium truncate">{designation}</p>
                                            </div>
                                            <div className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase">
                                                Auto Selected
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-extrabold text-sm">
                                        ?
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-slate-500 truncate">No Manager Selected</p>
                                        <p className="text-[10px] text-slate-400 font-medium truncate">Timesheet will be submitted directly to Admin</p>
                                    </div>
                                </div>
                            )}

                            {/* Searchable/selectable dropdown list of managers */}
                            <div className="pt-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Change/Unselect Manager</label>
                                <select
                                    value={(() => {
                                        const selected = employees.find(e => e.id === selectedManagerId || e._id === selectedManagerId || e.mongoId === selectedManagerId);
                                        return selected ? (selected.id || selected._id || selected.mongoId) : (selectedManagerId || '');
                                    })()}
                                    onChange={(e) => setSelectedManagerId(e.target.value)}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                >
                                    <option value="">No manager (Submit directly to Admin)</option>
                                    {employees.map(emp => {
                                        const empId = emp.id || emp._id || emp.mongoId;
                                        const label = `${emp.personalDetails?.firstName || emp.firstName || ''} ${emp.personalDetails?.lastName || emp.lastName || ''} (${emp.jobDetails?.designation || emp.designation || 'Staff'})`;
                                        return (
                                            <option key={empId} value={empId}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setIsSubmitModalOpen(false)}
                                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-extrabold rounded-2xl text-xs transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSaveTimesheet(true)}
                                disabled={isSavingTimesheet}
                                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold rounded-2xl text-xs transition-all active:scale-[0.98]"
                            >
                                Confirm Submission
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

