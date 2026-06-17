'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, FileText, Clock,
    Plus, Loader2, CheckCircle2,
    XCircle, AlertCircle, ChevronRight,
    MoreVertical, CalendarDays, Search, UserPlus, Trash2, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function ESSLeaveManagement({ employeeId, payrollConfig }) {
    const [activeView, setActiveView] = useState('list'); // 'list' or 'apply'
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    
    // Determine leave quota from payroll config, defaulting to 20
    const leaveQuota = payrollConfig?.annualPaidLeaveQuota || 20;
    
    // Automatic Overdraft Split (Option 1 logic)
    const approvedPaidLeaves = applications
        .filter(a => a.status === 'Approved' && a.leaveType !== 'Unpaid' && a.leaveCategory !== 'Unpaid')
        .reduce((acc, curr) => acc + curr.totalDays, 0);

    const approvedExplicitUnpaidLeaves = applications
        .filter(a => a.status === 'Approved' && (a.leaveType === 'Unpaid' || a.leaveCategory === 'Unpaid'))
        .reduce((acc, curr) => acc + curr.totalDays, 0);

    const leavesTaken = Math.min(approvedPaidLeaves, leaveQuota);
    const remainingBalance = Math.max(0, leaveQuota - approvedPaidLeaves);
    const unpaidLeaves = approvedExplicitUnpaidLeaves + Math.max(0, approvedPaidLeaves - leaveQuota);
    
    // New Calculation State
    const [calculationResult, setCalculationResult] = useState(null);
    const [calculating, setCalculating] = useState(false);
    
    // Multi-Level Approval State
    const [employeeProfile, setEmployeeProfile] = useState(null);
    const [selectedApprovers, setSelectedApprovers] = useState([]); // Array of employee IDs
    
    // Team Approvals State
    const [teamApprovals, setTeamApprovals] = useState([]);
    const [loadingApprovals, setLoadingApprovals] = useState(false);
    const [actioningId, setActioningId] = useState(null);
    const [showActionModal, setShowActionModal] = useState(null); // { id, action: 'approve'|'reject' }
    const [actionRemark, setActionRemark] = useState('');

    const [formData, setFormData] = useState({
        leaveType: 'Full Day Leave',
        leaveCategory: 'Casual',
        startDate: '',
        endDate: '',
        reason: '',
        contactNumber: '',
        addressDuringLeave: '',
        isAdvanceLeave: false,
    });

    // Custom Approver Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [customApprovers, setCustomApprovers] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // All Managers List (org-wide)
    const [allManagers, setAllManagers] = useState([]);
    const [loadingManagers, setLoadingManagers] = useState(false);

    useEffect(() => {
        if (employeeId) {
            fetchMyLeaves();
            fetchEmployeeProfile();
            fetchAllManagers();
        }
    }, [employeeId]);

    const fetchAllManagers = async () => {
        try {
            setLoadingManagers(true);
            const res = await fetch('/api/v1/employee/leaves/approvers?mode=managers');
            if (res.ok) {
                const data = await res.json();
                setAllManagers(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch managers list:', error);
        } finally {
            setLoadingManagers(false);
        }
    };

    useEffect(() => {
        if (activeView === 'approvals') {
            fetchTeamApprovals();
        }
    }, [activeView]);

    const fetchTeamApprovals = async () => {
        try {
            setLoadingApprovals(true);
            const res = await fetch(`/api/v1/employee/leaves/team-approvals`);
            if (!res.ok) throw new Error("Failed to fetch approvals");
            const data = await res.json();
            setTeamApprovals(data.data || []);
        } catch (error) {
            toast.error("Error loading team approvals");
        } finally {
            setLoadingApprovals(false);
        }
    };

    const handleApprovalAction = async (id, action) => {
        try {
            setActioningId(id);
            const res = await fetch(`/api/v1/employee/leaves/team-approvals/${id}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, remarks: actionRemark })
            });
            if (!res.ok) throw new Error("Failed to process action");
            toast.success(`Leave request ${action}d successfully`);
            setShowActionModal(null);
            setActionRemark('');
            fetchTeamApprovals(); // Refresh list
        } catch (error) {
            toast.error(error.message);
        } finally {
            setActioningId(null);
        }
    };

    const fetchEmployeeProfile = async () => {
        try {
            const res = await fetch(`/api/v1/employee/payroll/employees/${employeeId}`);
            if (res.ok) {
                const data = await res.json();
                setEmployeeProfile(data);
                
                // Default selection: Both TL and Manager if they exist (deduplicated as strings)
                const defaults = new Set();
                if (data.jobDetails?.teamLead?._id) defaults.add(data.jobDetails.teamLead._id.toString());
                if (data.jobDetails?.reportingManager?._id) defaults.add(data.jobDetails.reportingManager._id.toString());
                setSelectedApprovers(Array.from(defaults));
            }
        } catch (error) {
            console.error("Failed to fetch profile for approver selection");
        }
    };

    // Debounced search for approvers
    useEffect(() => {
        if (searchQuery.length >= 2) {
            const delayDebounceFn = setTimeout(() => {
                performSearch(searchQuery);
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else if (isSearchFocused && searchQuery.length < 2) {
            // Do not fetch random suggestions on focus to avoid cluttering.
            // Only show results when user actually searches.
            setSearchResults([]);
        } else if (!isSearchFocused && searchQuery.length < 2) {
            setSearchResults([]);
        }
    }, [searchQuery, isSearchFocused]);

    const performSearch = async (query = searchQuery) => {
        setSearching(true);
        try {
            const res = await fetch(`/api/v1/employee/leaves/approvers?mode=search&search=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.data || []);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setSearching(false);
        }
    };

    const addCustomApprover = (emp) => {
        if (!selectedApprovers.includes(emp._id)) {
            setSelectedApprovers(prev => [...prev, emp._id]);
            setCustomApprovers(prev => [...prev, emp]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeCustomApprover = (id) => {
        setSelectedApprovers(prev => prev.filter(aid => aid !== id));
        setCustomApprovers(prev => prev.filter(emp => emp._id !== id));
    };

    const fetchMyLeaves = async () => {
        try {
            const res = await fetch(`/api/v1/employee/leaves/applications`);
            if (!res.ok) throw new Error("Failed to fetch leaves");
            const data = await res.json();
            setApplications(data.applications || []);
        } catch (error) {
            toast.error("Error loading leave history");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const toggleApprover = (id) => {
        setSelectedApprovers(prev => 
            prev.includes(id) 
                ? prev.filter(a => a !== id) 
                : [...prev, id]
        );
    };

    // Smart Calculation Hook
    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            const calculateLeaveDays = async () => {
                const start = new Date(formData.startDate);
                const end = new Date(formData.endDate);
                if (start > end) {
                    setCalculationResult(null);
                    return;
                }
                
                try {
                    setCalculating(true);
                    const res = await fetch('/api/v1/employee/leaves/calculate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            employeeId: employeeProfile?._id || employeeId,
                            startDate: formData.startDate,
                            endDate: formData.endDate,
                            leaveType: formData.leaveType
                        })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        setCalculationResult(data);
                    } else {
                        setCalculationResult(null);
                        toast.error(data.error || "Failed to calculate days");
                    }
                } catch (error) {
                    setCalculationResult(null);
                } finally {
                    setCalculating(false);
                }
            };
            calculateLeaveDays();
        } else {
            setCalculationResult(null);
        }
    }, [formData.startDate, formData.endDate, formData.leaveType, employeeId]);

    const calculateTotalDays = () => {
        return calculationResult?.totalEffectiveDays || 0;
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        const totalDays = calculateTotalDays();
        if (formData.leaveType !== 'WFH' && totalDays <= 0) {
            toast.error("Invalid date range");
            return;
        }

        try {
            setSubmitLoading(true);
            const res = await fetch('/api/v1/employee/leaves/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    employeeId: employeeProfile?._id || employeeId,
                    totalDays,
                    selectedApproverIds: selectedApprovers
                })
            });

            if (!res.ok) throw new Error("Failed to submit");
            toast.success("Leave application submitted!");
            setActiveView('list');
            fetchMyLeaves();
            setFormData({
                leaveType: 'Full Day Leave',
                leaveCategory: 'Casual',
                startDate: '',
                endDate: '',
                reason: '',
                contactNumber: '',
                addressDuringLeave: '',
                isAdvanceLeave: false,
            });
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'Cancelled': return 'bg-slate-50 text-slate-600 border-slate-100';
            default: return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckCircle2 className="w-4 h-4" />;
            case 'Rejected': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    if (activeView === 'apply') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">New Leave Application</h2>
                    <button
                        onClick={() => setActiveView('list')}
                        className="text-sm font-semibold text-slate-500 hover:text-slate-700 px-4 py-2"
                    >
                        Back to List
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <form onSubmit={handleApplyLeave} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Leave Type</label>
                                    <select
                                        name="leaveType"
                                        value={formData.leaveType}
                                        onChange={handleInputChange}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        required
                                    >
                                        <option value="Full Day Leave">Full Day Leave</option>
                                        <option value="Half Day">Half Day</option>
                                        <option value="WFH">WFH</option>
                                    </select>
                                </div>
                                {(formData.leaveType === 'Full Day Leave' || formData.leaveType === 'Half Day') && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Leave Category</label>
                                        <select
                                            name="leaveCategory"
                                            value={formData.leaveCategory}
                                            onChange={handleInputChange}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            required
                                        >
                                            <option value="Casual">Casual Leave</option>
                                            <option value="Sick">Sick Leave</option>
                                            <option value="Earned">Earned Leave</option>
                                            <option value="Unpaid">Unpaid Leave</option>
                                            <option value="Maternity">Maternity Leave</option>
                                            <option value="Paternity">Paternity Leave</option>
                                            <option value="Bereavement">Bereavement Leave</option>
                                            <option value="Compensatory">Compensatory Leave</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Contact During Leave</label>
                                <input
                                    type="tel"
                                    name="contactNumber"
                                    value={formData.contactNumber}
                                    onChange={handleInputChange}
                                    placeholder="Phone number"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Reason</label>
                            <textarea
                                name="reason"
                                value={formData.reason}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="Reason for leave..."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                                required
                            />
                        </div>

                        {/* Multi-Approver Selection */}
                        <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 relative">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Select Approver(s)</h3>
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase">
                                    {selectedApprovers.length} Selected
                                </span>
                            </div>
                            
                            <p className="text-xs text-slate-500">
                                Select one or more managers to approve your leave. You can also search for any employee.
                            </p>

                            {/* Profile-based Approvers (TL / Manager) — auto-selected */}
                            {(employeeProfile?.jobDetails?.teamLead || employeeProfile?.jobDetails?.reportingManager) && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Assigned Supervisors</p>
                                    <div className="flex flex-col md:flex-row gap-3">
                                        {employeeProfile.jobDetails.teamLead && (
                                            <button
                                                type="button"
                                                onClick={() => toggleApprover(employeeProfile.jobDetails.teamLead._id)}
                                                className={`flex-1 flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                                    selectedApprovers.includes(employeeProfile.jobDetails.teamLead._id)
                                                        ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/10'
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-[10px]">TL</div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Lead</p>
                                                        <p className="text-sm font-black text-slate-900 truncate">
                                                            {employeeProfile.jobDetails.teamLead.personalDetails?.firstName} {employeeProfile.jobDetails.teamLead.personalDetails?.lastName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    selectedApprovers.includes(employeeProfile.jobDetails.teamLead._id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                                                }`}>
                                                    {selectedApprovers.includes(employeeProfile.jobDetails.teamLead._id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                            </button>
                                        )}
                                        {employeeProfile.jobDetails.reportingManager && 
                                         employeeProfile.jobDetails.reportingManager._id !== employeeProfile.jobDetails.teamLead?._id && (
                                            <button
                                                type="button"
                                                onClick={() => toggleApprover(employeeProfile.jobDetails.reportingManager._id)}
                                                className={`flex-1 flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                                    selectedApprovers.includes(employeeProfile.jobDetails.reportingManager._id)
                                                        ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/10'
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-[10px]">RM</div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reporting Manager</p>
                                                        <p className="text-sm font-black text-slate-900 truncate">
                                                            {employeeProfile.jobDetails.reportingManager.personalDetails?.firstName} {employeeProfile.jobDetails.reportingManager.personalDetails?.lastName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    selectedApprovers.includes(employeeProfile.jobDetails.reportingManager._id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                                                }`}>
                                                    {selectedApprovers.includes(employeeProfile.jobDetails.reportingManager._id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* All Managers List (org-wide) */}
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="w-4 h-4 text-slate-500" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All Managers / Leads</p>
                                </div>
                                {loadingManagers ? (
                                    <div className="flex items-center justify-center p-6">
                                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                        <span className="ml-2 text-xs text-slate-500">Loading managers...</span>
                                    </div>
                                ) : allManagers.length === 0 ? (
                                    <p className="text-xs text-slate-400 p-4 text-center bg-white rounded-xl border border-dashed border-slate-200">No managers found in the organization.</p>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                                        {allManagers.map((mgr) => {
                                            const isSelected = selectedApprovers.includes(mgr._id);
                                            const isProfileApprover = mgr._id === employeeProfile?.jobDetails?.teamLead?._id || mgr._id === employeeProfile?.jobDetails?.reportingManager?._id;
                                            if (isProfileApprover) return null;
                                            return (
                                                <button
                                                    key={mgr._id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            removeCustomApprover(mgr._id);
                                                        } else {
                                                            addCustomApprover(mgr);
                                                        }
                                                    }}
                                                    className={`w-full flex items-center gap-3 p-3 transition-colors text-left ${
                                                        isSelected ? 'bg-indigo-50/80' : 'hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {mgr.personalDetails?.firstName?.[0]}{mgr.personalDetails?.lastName?.[0]}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-bold text-slate-900 truncate">
                                                            {mgr.personalDetails?.firstName} {mgr.personalDetails?.lastName}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 truncate font-medium">
                                                            {mgr.jobDetails?.designation} {mgr.jobDetails?.department ? `• ${mgr.jobDetails.department}` : ''} • {mgr.employeeId}
                                                        </p>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                        isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                                                    }`}>
                                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Search ANY Employee */}
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Search Any Employee</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name, Employee ID, or designation..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                                    />
                                    {searching && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Search Results Dropdown */}
                                {searchResults.length > 0 && (
                                    <div className="absolute z-[60] left-6 right-6 mt-1 bg-white border border-slate-200 rounded-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                                        {searchResults.map((emp) => (
                                            <button
                                                key={emp._id}
                                                type="button"
                                                onClick={() => addCustomApprover(emp)}
                                                disabled={selectedApprovers.includes(emp._id)}
                                                className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left ${
                                                    selectedApprovers.includes(emp._id) ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                            >
                                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                                    {emp.personalDetails?.firstName?.[0]}{emp.personalDetails?.lastName?.[0]}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-slate-900 truncate">
                                                        {emp.personalDetails?.firstName} {emp.personalDetails?.lastName}
                                                        {selectedApprovers.includes(emp._id) && <span className="ml-2 text-[10px] text-indigo-600">(Selected)</span>}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 truncate font-medium">
                                                        {emp.jobDetails?.designation} {emp.jobDetails?.department ? `• ${emp.jobDetails.department}` : ''} • {emp.employeeId}
                                                    </p>
                                                </div>
                                                {!selectedApprovers.includes(emp._id) && <UserPlus className="w-4 h-4 text-slate-400" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected Approvers Chips */}
                            {customApprovers.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {customApprovers.map((emp) => (
                                        <div 
                                            key={emp._id} 
                                            className="flex items-center gap-3 px-3 py-2 bg-indigo-600 text-white rounded-xl group animate-in slide-in-from-bottom-1 duration-200"
                                        >
                                            <div className="text-left">
                                                <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">Approver</p>
                                                <p className="text-xs font-black truncate max-w-[120px]">
                                                    {emp.personalDetails?.firstName} {emp.personalDetails?.lastName}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCustomApprover(emp._id)}
                                                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Info if no approver selected */}
                            {selectedApprovers.length === 0 && customApprovers.length === 0 && (
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                        No approver selected. Please select a manager from the list above or search for any employee. If you proceed without selection, the leave will be routed to the HR Administrator.
                                    </p>
                                </div>
                            )}
                        </div>

                        {calculating ? (
                            <div className="p-4 bg-indigo-50 rounded-xl flex items-center gap-3 text-indigo-600">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-bold">Calculating effective leave days...</span>
                            </div>
                        ) : calculationResult && (
                            <div className="p-4 bg-indigo-50 rounded-xl flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                            <CalendarDays className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Leave Deduction</p>
                                            <p className="text-lg font-black text-indigo-900">{calculationResult.totalEffectiveDays} Days</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-slate-500">Selected Range: {calculationResult.totalCalendarDays} Days</p>
                                    </div>
                                </div>
                                
                                {/* Smart Breakdown */}
                                {calculationResult.details && calculationResult.totalCalendarDays !== calculationResult.totalEffectiveDays && (
                                    <div className="mt-2 pt-3 border-t border-indigo-100 flex flex-col gap-1.5">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Days Automatically Excluded:</p>
                                        {calculationResult.details.filter(d => !d.isDeductable).map((day, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 bg-white/50 p-2 rounded-lg">
                                                <span className="font-semibold w-24">{format(new Date(day.date), 'MMM dd')} - {day.dayOfWeek}:</span>
                                                <span className="text-indigo-600 font-medium">{day.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setActiveView('list')}
                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitLoading || calculating || !calculationResult || (formData.leaveType !== 'WFH' && calculateTotalDays() <= 0)}
                                className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2"
                            >
                                {submitLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : calculating ? (
                                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</span>
                                ) : (
                                    "Submit Application"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Leave History</h2>
                    <p className="text-xs text-slate-500 mt-1">Track your past and pending leave requests</p>
                </div>
                
                <div className="flex bg-slate-100 p-1.5 rounded-xl self-start gap-1">
                    <button
                        onClick={() => setActiveView('list')}
                        className={`text-sm font-bold px-5 py-2 rounded-lg transition-all ${activeView === 'list' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                        My Leave & WFH
                    </button>
                    <button
                        onClick={() => setActiveView('approvals')}
                        className={`text-sm font-bold px-5 py-2 rounded-lg transition-all ${activeView === 'approvals' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                        Team Approvals
                    </button>
                    <button
                        onClick={() => setActiveView('apply')}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all ml-4"
                    >
                        <Plus className="w-4 h-4" /> Apply Leave
                    </button>
                </div>
            </div>

            {/* Team Approvals View */}
            {activeView === 'approvals' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {loadingApprovals ? (
                        <div className="p-20 flex justify-center">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                    ) : teamApprovals.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 bg-slate-50 rounded-full">
                                <CheckCircle2 className="w-8 h-8 text-slate-300" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">You're all caught up!</p>
                                <p className="text-xs text-slate-500 mt-1">No pending leave requests require your approval.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Employee</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Leave Details</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Duration</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {teamApprovals.map((app) => (
                                        <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {app.employee?.personalDetails?.thumbnail ? (
                                                        <img src={app.employee.personalDetails.thumbnail} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                            {app.employee?.personalDetails?.firstName?.[0] || '?'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{app.employee?.personalDetails?.firstName} {app.employee?.personalDetails?.lastName}</p>
                                                        <p className="text-[10px] font-medium text-slate-500">{app.employee?.jobDetails?.designation}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{app.leaveType}</span>
                                                    {app.isFinalApprover && <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Final Approver</span>}
                                                </div>
                                                <p className="text-xs font-semibold text-slate-600 mt-1">"{app.reason}"</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-black text-indigo-600">{app.totalDays} Days</p>
                                                <p className="text-[10px] font-semibold text-slate-400">
                                                    {format(new Date(app.startDate), 'MMM dd')} - {format(new Date(app.endDate), 'MMM dd')}
                                                </p>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => setShowActionModal({ id: app._id, action: 'reject' })}
                                                        className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button 
                                                        onClick={() => setShowActionModal({ id: app._id, action: 'approve' })}
                                                        className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100 flex gap-1 items-center"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Application List View */}
            {activeView === 'list' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* LEAVE BALANCES WIDGETS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-6 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between  transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-slate-50 rounded-xl">
                                    <CalendarDays className="w-5 h-5 text-slate-400" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Paid Quota</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">{leaveQuota}</p>
                                <p className="text-xs text-slate-400 font-medium mt-1">Allocated for this year</p>
                            </div>
                        </div>

                        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex flex-col justify-between  transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-100 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                </div>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Leaves Taken</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-indigo-700">
                                    {leavesTaken}
                                </p>
                                <p className="text-xs text-indigo-500/80 font-medium mt-1">Approved paid leaves</p>
                            </div>
                        </div>

                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col justify-between  transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-100 rounded-xl">
                                    <Calendar className="w-5 h-5 text-emerald-500" />
                                </div>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Remaining Balance</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-emerald-700">
                                    {remainingBalance}
                                </p>
                                <p className="text-xs text-emerald-600/80 font-medium mt-1">Available to use</p>
                            </div>
                        </div>

                        <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex flex-col justify-between  transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-100 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                </div>
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Unpaid Leaves</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-amber-700">
                                    {unpaidLeaves}
                                </p>
                                <p className="text-xs text-amber-600/80 font-medium mt-1">Loss of pay days</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">Leave History</h3>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                                    Total: {applications.length}
                                </span>
                            </div>
                        </div>
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                            <p className="text-sm text-slate-500 font-medium">Loading your leaves...</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 bg-slate-50 rounded-full">
                                <Calendar className="w-8 h-8 text-slate-300" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">No leaves found</p>
                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">You haven't submitted any leave applications yet.</p>
                            </div>
                        </div>
                    ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Leave Type</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Dates</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Duration</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {applications.map((app) => (
                                    <tr key={app._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {app.leaveType === 'WFH' ? 'W' : (app.leaveCategory?.[0] || 'L')}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-900">
                                                    {app.leaveType === 'WFH' ? 'WFH' : `${app.leaveCategory || 'Leave'} (${app.leaveType === 'Half Day' ? 'Half Day' : 'Full Day'})`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-slate-700">
                                                    {format(new Date(app.startDate), 'MMM dd, yyyy')} - {format(new Date(app.endDate), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-bold text-slate-900">{app.totalDays} Days</span>
                                        </td>
                                        <td className="p-4">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(app.status)}`}>
                                                {getStatusIcon(app.status)}
                                                {app.status}
                                            </div>
                                            {app.status === 'Rejected' && app.rejectionReason && (
                                                <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Remark: {app.rejectionReason}
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    )}
                </div>
                </div>
            )}
            {/* Action Modal */}
            {showActionModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 uppercase">
                                {showActionModal.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}
                            </h3>
                            <button onClick={() => setShowActionModal(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <XCircle className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remarks (Optional)</label>
                                <textarea
                                    value={actionRemark}
                                    onChange={(e) => setActionRemark(e.target.value)}
                                    placeholder="Enter your comments here..."
                                    rows={3}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowActionModal(null)}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleApprovalAction(showActionModal.id, showActionModal.action)}
                                    disabled={actioningId}
                                    className={`flex-1 py-3 rounded-xl text-sm font-black text-white transition-all flex items-center justify-center gap-2 ${
                                        showActionModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    {actioningId ? <Loader2 className="w-4 h-4 animate-spin" /> : showActionModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

