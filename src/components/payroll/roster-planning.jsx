'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft, ChevronRight, Search, Filter, Save,
    Download, RefreshCw, Calendar as CalendarIcon,
    Users, UserCheck, Clock, CheckCircle2, AlertCircle, X,
    ChevronDown, Grid3X3, List, MoreHorizontal
} from 'lucide-react';
import { format, startOfWeek, addDays, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, isToday } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

export default function RosterPlanning() {
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('weekly'); // weekly or monthly
    const [saving, setSaving] = useState(false);

    // Selection for bulk actions
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkShiftId, setBulkShiftId] = useState('');

    // Date helpers
    const dates = useMemo(() => {
        if (viewMode === 'weekly') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            return eachDayOfInterval({ start, end: addDays(start, 6) });
        } else {
            const start = startOfMonth(currentDate);
            return eachDayOfInterval({ start, end: endOfMonth(currentDate) });
        }
    }, [currentDate, viewMode]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchRoster();
    }, [dates]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [empRes, shiftRes] = await Promise.all([
                fetch('/api/v1/admin/payroll/employees'),
                fetch('/api/v1/admin/payroll/shifts')
            ]);
            const empData = await empRes.json();
            const shiftData = await shiftRes.json();

            if (empData.success) setEmployees(empData.data || empData.employees || []);
            if (shiftData.success) setShifts(shiftData.shifts || []);

        } catch (error) {
            toast.error("Failed to load initial data");
        } finally {
            setLoading(false);
        }
    };

    const fetchRoster = async () => {
        try {
            const startDate = dates[0].toISOString();
            const endDate = dates[dates.length - 1].toISOString();
            const response = await fetch(`/api/v1/admin/payroll/roster?startDate=${startDate}&endDate=${endDate}`);
            const data = await response.json();
            if (data.success) {
                setRoster(data.roster || []);
            }
        } catch (error) {
            toast.error("Failed to load roster");
        }
    };

    const filteredEmployees = employees.filter(emp =>
        `${emp.personalDetails?.firstName} ${emp.personalDetails?.lastName} ${emp.employeeId}`
            .toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getShiftForDate = (employeeId, date) => {
        const rosterEntry = roster.find(r => {
            const empId = r.employeeId?.id || r.employeeId?._id || r.employeeId;
            return empId && String(empId) === String(employeeId) && isSameDay(new Date(r.date), date);
        });
        if (!rosterEntry || !rosterEntry.shiftId) return null;
        return shifts.find(s => String(s.id || s._id) === String(rosterEntry.shiftId)) || null;
    };

    const handleShiftChange = async (employeeId, date, shiftId) => {
        if (!shiftId) {
            try {
                const response = await fetch(`/api/v1/admin/payroll/roster?employeeId=${employeeId}&date=${date.toISOString()}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                if (data.success) {
                    toast.success("Shift removed");
                    fetchRoster();
                } else {
                    toast.error(data.error || "Failed to remove shift");
                }
            } catch (error) {
                toast.error("Failed to remove shift");
            }
            return;
        }

        try {
            const response = await fetch('/api/v1/admin/payroll/roster', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignments: [{ employeeId, date, shiftId }]
                })
            });
            const data = await response.json();
            if (data.success) {
                fetchRoster();
            } else {
                toast.error(data.error || "Failed to update shift");
            }
        } catch (error) {
            toast.error("Failed to update shift");
        }
    };

    const handleBulkAssign = async () => {
        if (!bulkShiftId || selectedEmployees.length === 0) return;

        setSaving(true);
        try {
            const assignments = [];
            selectedEmployees.forEach(empId => {
                dates.forEach(date => {
                    assignments.push({ employeeId: empId, date, shiftId: bulkShiftId });
                });
            });

            const response = await fetch('/api/v1/admin/payroll/roster', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignments
                    // organizationId and assignedBy are securely handled by the backend
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`Assigned shifts to ${selectedEmployees.length} employees`);
                setShowBulkModal(false);
                fetchRoster();
                setSelectedEmployees([]);
            }
        } catch (error) {
            toast.error("Bulk assignment failed");
        } finally {
            setSaving(false);
        }
    };

    const navigateDate = (amount) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'weekly') {
            newDate.setDate(newDate.getDate() + (amount * 7));
        } else {
            newDate.setMonth(newDate.getMonth() + amount);
        }
        setCurrentDate(newDate);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Toaster />
            <div className="max-w-full p-8 mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Roster Planning</h1>
                        <p className="text-slate-500 mt-1 font-medium">Schedule shifts and manage employee workforce availability</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex bg-white rounded-2xl p-1 border border-slate-200">
                            <button
                                onClick={() => setViewMode('weekly')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'weekly' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Weekly
                            </button>
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Monthly
                            </button>
                        </div>

                        <div className="flex items-center gap-2 bg-white rounded-2xl p-2 border border-slate-200 font-bold text-slate-900">
                            <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-4 min-w-[150px] text-center">
                                {viewMode === 'weekly'
                                    ? `${format(dates[0], 'MMM dd')} - ${format(dates[dates.length - 1], 'MMM dd, yyyy')}`
                                    : format(currentDate, 'MMMM yyyy')}
                            </span>
                            <button onClick={() => navigateDate(1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <button
                            disabled={selectedEmployees.length === 0}
                            onClick={() => setShowBulkModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:"
                        >
                            Bulk Assign
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden flex flex-col">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search staff..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                            />
                        </div>

                        <div className="flex gap-4">
                            {shifts.map((s, index) => (
                                <div key={s.id || s._id || index} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{s.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grid View */}
                    <div className="overflow-x-auto pb-4">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="p-6 border-r border-b border-slate-100 text-left sticky left-0 bg-slate-50/50 z-20 min-w-[250px]">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                                                onChange={() => {
                                                    if (selectedEmployees.length === filteredEmployees.length) {
                                                        setSelectedEmployees([]);
                                                    } else {
                                                        setSelectedEmployees(filteredEmployees.map(e => (e.id || e._id).toString()));
                                                    }
                                                }}
                                                className="w-4 h-4 accent-indigo-600"
                                            />
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Employee</span>
                                        </div>
                                    </th>
                                    {dates.map(date => (
                                        <th key={date.toString()} className={`p-4 border-b border-slate-100 min-w-[120px] ${isToday(date) ? 'bg-indigo-50/50' : ''}`}>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{format(date, 'EEE')}</span>
                                                <span className={`text-sm font-black mt-1 w-8 h-8 flex items-center justify-center rounded-full ${isToday(date) ? 'bg-indigo-600 text-white' : 'text-slate-900'}`}>
                                                    {format(date, 'dd')}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map((emp, index) => (
                                    <tr key={emp.id || emp._id || index} className="group hover:bg-slate-50/30 transition-colors">
                                        <td className="p-6 border-r border-b border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEmployees.includes((emp.id || emp._id).toString())}
                                                    onChange={() => {
                                                        const empIdStr = (emp.id || emp._id).toString();
                                                        if (selectedEmployees.includes(empIdStr)) {
                                                            setSelectedEmployees(prev => prev.filter(id => id !== empIdStr));
                                                        } else {
                                                            setSelectedEmployees(prev => [...prev, empIdStr]);
                                                        }
                                                    }}
                                                    className="w-4 h-4 accent-indigo-600"
                                                />
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-xs uppercase">
                                                    {emp.personalDetails?.firstName[0]}{emp.personalDetails?.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{emp.personalDetails?.firstName} {emp.personalDetails?.lastName}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{emp.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {dates.map(date => {
                                            const assignedShift = getShiftForDate(emp.id || emp._id, date);
                                            return (
                                                <td key={date.toString()} className={`p-2 border-b border-r border-slate-100 ${isToday(date) ? 'bg-indigo-50/20' : ''}`}>
                                                    <select
                                                        value={assignedShift?.id || assignedShift?._id || ''}
                                                        onChange={(e) => handleShiftChange(emp.id || emp._id, date, e.target.value)}
                                                        className="w-full h-12 bg-transparent border-none focus:ring-0 outline-none text-xs font-bold text-center appearance-none cursor-pointer rounded-xl transition-all hover:bg-slate-50"
                                                        style={assignedShift ? {
                                                            backgroundColor: `${assignedShift.color}15`,
                                                            color: assignedShift.color,
                                                        } : { color: '#cbd5e1' }}
                                                    >
                                                        <option value="">Off</option>
                                                        {shifts.map((s, sIndex) => <option key={s.id || s._id || sIndex} value={s.id || s._id} style={{ color: s.color }}>{s.name}</option>)}
                                                    </select>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Bulk Assign Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 bg-indigo-600 text-white flex justify-between items-center">
                            <h2 className="text-2xl font-black">Bulk Assign Shift</h2>
                            <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Selected Population</p>
                                    <p className="text-sm font-black text-indigo-900">{selectedEmployees.length} Staff Members</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Shift to Apply</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {shifts.map((s, index) => (
                                        <button
                                            key={s.id || s._id || index}
                                            onClick={() => setBulkShiftId(s.id || s._id)}
                                            className={`p-4 rounded-2xl border text-left transition-all ${bulkShiftId === (s.id || s._id)
                                                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100'
                                                : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: s.color }} />
                                            <p className="text-sm font-black text-slate-900">{s.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{s.startTime} - {s.endTime}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button
                                    onClick={() => setShowBulkModal(false)}
                                    className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-[1.5rem] font-bold hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={saving || !bulkShiftId}
                                    onClick={handleBulkAssign}
                                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Processing...' : 'Assign to Selection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
