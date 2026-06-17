"use client";

import React, { useState, useEffect } from "react";
import {
    Shield,
    Save,
    Building,
    Settings,
    Info,
    CheckCircle2,
    AlertCircle,
    Building2,
    MapPin,
    Calendar,
    Clock,
    TrendingUp,
    CreditCard,
    User,
    Minus,
    ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import StatutorySettings from "@/components/payroll/settings/StatutorySettings";

import VariablePaySettings from "@/components/payroll/settings/VariablePaySettings";
import OfficeLocationSettings from "@/components/payroll/settings/OfficeLocationSettings";

const EditPayrollSettings = ({ organizationId, onBack }) => {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Filter states to match screenshot
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedEmpType, setSelectedEmpType] = useState("");

    // Fetch employees for dropdown
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch(`/api/v1/admin/payroll/employees?organizationId=${organizationId}&limit=1000`);
                const data = await res.json();
                if (data.success) {
                    setEmployees(data.data);
                }
            } catch (error) {
                console.error("Error fetching employees:", error);
            }
        };

        if (organizationId) fetchEmployees();
    }, [organizationId]);

    const handleEmployeeSelect = async (empId) => {
        if (!empId) {
            setSelectedEmployee(null);
            return;
        }
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/admin/payroll/employees/${empId}`);
            const data = await res.json();
            setSelectedEmployee(data);
        } catch (error) {
            toast.error("Failed to load employee details");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedEmployee) return;
        try {
            setSaving(true);
            const res = await fetch(`/api/v1/admin/payroll/employees/${selectedEmployee._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedEmployee)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update employee");
            }
            toast.success("Employee payroll settings updated successfully");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        if (selectedDept && emp.jobDetails?.department !== selectedDept) return false;
        if (selectedEmpType && emp.jobDetails?.employeeType !== selectedEmpType) return false;
        return true;
    });

    const departments = Array.from(new Set(employees.map(e => e.jobDetails?.department).filter(Boolean)));
    const empTypes = Array.from(new Set(employees.map(e => e.jobDetails?.employeeType).filter(Boolean)));

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 font-bold text-sm"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Edit Payroll Individual Overrides</h2>
                        <p className="text-xs text-slate-500">Configure specific salary components and statutory flags for this employee</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedEmployee}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left Column: Employee Selection (Matches Screenshot) */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100">
                                <User size={18} />
                            </div>
                            <h3 className="font-bold text-slate-800">Employee Details</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Department</label>
                                <select 
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
                                >
                                    <option value="">All Departments...</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Employee Type</label>
                                <select 
                                    value={selectedEmpType}
                                    onChange={(e) => setSelectedEmpType(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
                                >
                                    <option value="">All Employee Types...</option>
                                    {empTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Employee <span className="text-red-500">*</span></label>
                                <select 
                                    value={selectedEmployee?._id || ""}
                                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">Choose an employee...</option>
                                    {filteredEmployees.map(emp => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.employeeId} - {emp.personalDetails?.firstName} {emp.personalDetails?.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedEmployee && (
                                <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {selectedEmployee.personalDetails?.firstName?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{selectedEmployee.personalDetails?.firstName} {selectedEmployee.personalDetails?.lastName}</p>
                                        <p className="text-xs text-slate-500 font-medium">{selectedEmployee.jobDetails?.designation}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Salary Summary Card */}
                    {selectedEmployee && (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
                                    <TrendingUp size={18} />
                                </div>
                                <h3 className="font-bold text-slate-800">Salary Summary</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Basic Salary:</span>
                                    <span className="font-bold text-slate-900">₹{selectedEmployee.payslipStructure?.basicSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Gross Salary:</span>
                                    <span className="font-bold text-slate-900">₹{selectedEmployee.payslipStructure?.grossSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <span className="font-bold text-slate-900">Net Salary:</span>
                                    <span className="text-lg font-bold text-emerald-600">₹{selectedEmployee.payslipStructure?.netSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Detailed Cards */}
                <div className="xl:col-span-8 space-y-6">
                    {selectedEmployee ? (
                        <>
                            {/* Basic Salary & Attendance (Matching Look) */}
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 border border-slate-200">
                                        <CreditCard size={18} />
                                    </div>
                                    <h3 className="font-bold text-slate-800">Basic Salary & Attendance Rules</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Basic Salary <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                                <input 
                                                    type="number" 
                                                    value={selectedEmployee.payslipStructure?.basicSalary || 0} 
                                                    onChange={(e) => setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, basicSalary: parseFloat(e.target.value) || 0}})}
                                                    className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">Override basic salary</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Overtime Rate (Per Hour)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                                <input 
                                                    type="number" 
                                                    value={selectedEmployee.jobDetails?.overtimeRate || 0} 
                                                    onChange={(e) => setSelectedEmployee({...selectedEmployee, jobDetails: {...selectedEmployee.jobDetails, overtimeRate: parseFloat(e.target.value) || 0}})}
                                                    className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Statutory Toggles in a grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                                        {[
                                            { label: 'PF Applicable', key: 'pfApplicable', val: 'yes' },
                                            { label: 'ESIC Applicable', key: 'esicApplicable', val: 'yes' },
                                            { label: 'TDS Applicable', key: 'isTDSApplicable', val: true },
                                            { label: 'Gratuity Applicable', key: 'gratuityApplicable', val: 'yes' }
                                        ].map(item => (
                                            <div key={item.key} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase text-center">{item.label}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newVal = selectedEmployee[item.key] === item.val ? (typeof item.val === 'boolean' ? false : 'no') : item.val;
                                                        setSelectedEmployee({...selectedEmployee, [item.key]: newVal});
                                                    }}
                                                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedEmployee[item.key] === item.val ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                                                >
                                                    {selectedEmployee[item.key] === item.val ? 'ENABLED' : 'DISABLED'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Earnings & Allowances */}
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 border border-green-100">
                                            <TrendingUp size={18} />
                                        </div>
                                        <h3 className="font-bold text-slate-800">Earnings & Allowances</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Calculated on Basic Salary only</span>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {selectedEmployee.payslipStructure?.earnings?.map((earning, idx) => (
                                            <div key={idx} className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl relative group">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <input 
                                                            type="text" 
                                                            value={earning.name} 
                                                            onChange={(e) => {
                                                                const newEarnings = [...selectedEmployee.payslipStructure.earnings];
                                                                newEarnings[idx].name = e.target.value;
                                                                setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, earnings: newEarnings}});
                                                            }}
                                                            placeholder="Component Name"
                                                            className="w-full bg-white border border-emerald-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                const newEarnings = selectedEmployee.payslipStructure.earnings.filter((_, i) => i !== idx);
                                                                setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, earnings: newEarnings}});
                                                            }}
                                                            className="ml-2 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <select 
                                                                value={earning.calculationType}
                                                                onChange={(e) => {
                                                                    const newEarnings = [...selectedEmployee.payslipStructure.earnings];
                                                                    newEarnings[idx].calculationType = e.target.value;
                                                                    setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, earnings: newEarnings}});
                                                                }}
                                                                className="w-full px-2 py-1.5 bg-white border border-emerald-100 rounded-lg text-[10px] font-bold text-slate-500 outline-none"
                                                            >
                                                                <option value="fixed">Fixed</option>
                                                                <option value="percentage">Percentage</option>
                                                            </select>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{earning.calculationType === 'percentage' ? '%' : '₹'}</span>
                                                                <input 
                                                                    type="number" 
                                                                    value={earning.calculationType === 'percentage' ? earning.percentage : earning.fixedAmount} 
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value) || 0;
                                                                        const newEarnings = [...selectedEmployee.payslipStructure.earnings];
                                                                        if (earning.calculationType === 'percentage') newEarnings[idx].percentage = val;
                                                                        else newEarnings[idx].fixedAmount = val;
                                                                        setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, earnings: newEarnings}});
                                                                    }}
                                                                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-emerald-100 rounded-lg text-sm font-medium outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] font-bold text-slate-400 px-1 py-1.5">Calculated Amount</div>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                                                                <input 
                                                                    type="number" 
                                                                    value={earning.calculationType === 'percentage' ? ((selectedEmployee.payslipStructure.basicSalary * earning.percentage) / 100).toFixed(0) : earning.fixedAmount} 
                                                                    disabled
                                                                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50/50 border border-emerald-50 rounded-lg text-sm font-bold text-slate-500 cursor-not-allowed"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={earning.enabled} 
                                                            onChange={(e) => {
                                                                const newEarnings = [...selectedEmployee.payslipStructure.earnings];
                                                                newEarnings[idx].enabled = e.target.checked;
                                                                setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, earnings: newEarnings}});
                                                            }}
                                                            className="w-4 h-4 rounded text-emerald-600 border-emerald-200"
                                                        />
                                                        <span className="text-xs font-bold text-slate-600 uppercase">Enabled</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Button */}
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const newEarnings = [...(selectedEmployee.payslipStructure.earnings || [])];
                                                newEarnings.push({ name: "New Allowance", calculationType: "fixed", fixedAmount: 0, percentage: 0, enabled: true });
                                                setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, earnings: newEarnings}});
                                            }}
                                            className="p-4 border-2 border-dashed border-emerald-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-50 transition-colors group min-h-[120px]"
                                        >
                                            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <TrendingUp size={16} />
                                            </div>
                                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">+ Add Custom Earning</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600 border border-red-100">
                                        <Minus size={18} />
                                    </div>
                                    <h3 className="font-bold text-slate-800">Deductions</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* STATUTORY TDS PREVIEW */}
                                        {selectedEmployee.isTDSApplicable && (
                                            <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-2xl relative group ring-2 ring-amber-100/50">
                                                <div className="absolute top-3 right-3">
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded-full border border-amber-200">Statutory</span>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="w-full bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm font-black text-amber-800 outline-none">
                                                            Income Tax (TDS)
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <div className="w-full px-2 py-1.5 bg-amber-100/50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-700">
                                                                Auto-Calculated
                                                            </div>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 text-xs">₹</span>
                                                                <input 
                                                                    type="text" 
                                                                    value="Based on Slabs" 
                                                                    disabled
                                                                    className="w-full pl-7 pr-3 py-1.5 bg-amber-50/30 border border-amber-100 rounded-lg text-sm font-medium text-amber-600 cursor-not-allowed italic"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] font-bold text-amber-400 px-1 py-1.5">Estimated Deduction</div>
                                                            <div className="relative text-amber-600 text-xs font-bold px-1">
                                                                Calculated during payroll batch run
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 bg-amber-500 rounded flex items-center justify-center">
                                                            <CheckCircle2 size={10} className="text-white" />
                                                        </div>
                                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Enabled via Statutory Settings</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedEmployee.payslipStructure?.deductions?.map((deduction, idx) => (
                                            <div key={idx} className="p-4 bg-red-50/30 border border-red-100 rounded-2xl relative group">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <input 
                                                            type="text" 
                                                            value={deduction.name} 
                                                            onChange={(e) => {
                                                                const newDeductions = [...selectedEmployee.payslipStructure.deductions];
                                                                newDeductions[idx].name = e.target.value;
                                                                setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, deductions: newDeductions}});
                                                            }}
                                                            placeholder="Deduction Name"
                                                            className="w-full bg-white border border-red-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                const newDeductions = selectedEmployee.payslipStructure.deductions.filter((_, i) => i !== idx);
                                                                setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, deductions: newDeductions}});
                                                            }}
                                                            className="ml-2 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <select 
                                                                value={deduction.calculationType}
                                                                onChange={(e) => {
                                                                    const newDeductions = [...selectedEmployee.payslipStructure.deductions];
                                                                    newDeductions[idx].calculationType = e.target.value;
                                                                    setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, deductions: newDeductions}});
                                                                }}
                                                                className="w-full px-2 py-1.5 bg-white border border-red-100 rounded-lg text-[10px] font-bold text-slate-500 outline-none"
                                                            >
                                                                <option value="fixed">Fixed</option>
                                                                <option value="percentage">Percentage</option>
                                                            </select>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{deduction.calculationType === 'percentage' ? '%' : '₹'}</span>
                                                                <input 
                                                                    type="number" 
                                                                    value={deduction.calculationType === 'percentage' ? deduction.percentage : deduction.fixedAmount} 
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value) || 0;
                                                                        const newDeductions = [...selectedEmployee.payslipStructure.deductions];
                                                                        if (deduction.calculationType === 'percentage') newDeductions[idx].percentage = val;
                                                                        else newDeductions[idx].fixedAmount = val;
                                                                        setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, deductions: newDeductions}});
                                                                    }}
                                                                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-red-100 rounded-lg text-sm font-medium outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] font-bold text-slate-400 px-1 py-1.5">Deducted Amount</div>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                                                                <input 
                                                                    type="number" 
                                                                    value={deduction.calculationType === 'percentage' ? ((selectedEmployee.payslipStructure.basicSalary * deduction.percentage) / 100).toFixed(0) : deduction.fixedAmount} 
                                                                    disabled
                                                                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50/50 border border-red-50 rounded-lg text-sm font-bold text-slate-500 cursor-not-allowed"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={deduction.enabled} 
                                                            onChange={(e) => {
                                                                const newDeductions = [...selectedEmployee.payslipStructure.deductions];
                                                                newDeductions[idx].enabled = e.target.checked;
                                                                setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, deductions: newDeductions}});
                                                            }}
                                                            className="w-4 h-4 rounded text-red-600 border-red-200"
                                                        />
                                                        <span className="text-xs font-bold text-slate-600 uppercase">Enabled</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Button */}
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const newDeductions = [...(selectedEmployee.payslipStructure.deductions || [])];
                                                newDeductions.push({ name: "New Deduction", calculationType: "fixed", fixedAmount: 0, percentage: 0, enabled: true });
                                                setSelectedEmployee({...selectedEmployee, payslipStructure: {...selectedEmployee.payslipStructure, deductions: newDeductions}});
                                            }}
                                            className="p-4 border-2 border-dashed border-red-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-red-50 transition-colors group min-h-[120px]"
                                        >
                                            <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Minus size={16} />
                                            </div>
                                            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">+ Add Custom Deduction</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-24 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <User className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No Employee Selected</h3>
                            <p className="text-slate-500 mt-2 max-w-sm mx-auto">Please select an employee to view and modify their individual payroll settings.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default function ComplianceSettingsPage() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [orgs, setOrgs] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState("");
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const orgsRes = await fetch("/api/v1/admin/crm/organizations");
            const orgsResponse = await orgsRes.json();
            const orgsData = orgsResponse.data || [];
            setOrgs(orgsData);

            if (orgsData.length > 0) {
                const firstOrg = orgsData[0]._id;
                setSelectedOrg(firstOrg);
                await fetchConfig(firstOrg);
            }
        } catch (error) {
            toast.error("Failed to fetch initial data");
        } finally {
            setLoading(false);
        }
    };

    const fetchConfig = async (orgId) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/admin/payroll/settings?orgId=${orgId}`);
            const data = await res.json();
            if (data && !data.error) {
                setConfig(data);
            } else {
                toast.error(data.error || "Failed to fetch configuration");
            }
        } catch (error) {
            toast.error("Failed to fetch configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleOrgChange = (e) => {
        const orgId = e.target.value;
        setSelectedOrg(orgId);
        fetchConfig(orgId);
    };

    const handleSave = async (updatedData) => {
        try {
            setSaving(true);
            // Sanitize data: remove system fields that can break update/upsert
            const { _id, __v, createdAt, updatedAt, ...saveData } = updatedData || config || {};

            const res = await fetch(`/api/v1/admin/payroll/settings?orgId=${selectedOrg}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...saveData, company: selectedOrg })
            });
            const data = await res.json();
            if (!data.error) {
                setConfig(data);
                toast.success("Settings saved successfully");
            } else {
                toast.error(data.error || "Failed to save settings");
            }
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading && !config) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 font-medium">Loading payroll configurations...</p>
                </div>
            </div>
        );
    }


    // Hide sidebar if activeTab is 'edit-payroll'
    const isEditPayroll = activeTab === 'edit-payroll';

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Global Header - Only show if not editing individual payroll */}
                {!isEditPayroll && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    Payroll Settings
                                </h1>
                                <p className="text-slate-500 font-medium mt-1">
                                    Manage statutory compliance, locations, and components
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200">
                            <div className="flex items-center gap-3 px-4 py-2 border-r border-slate-100">
                                <Building2 className="w-5 h-5 text-slate-400" />
                                <select
                                    value={selectedOrg}
                                    onChange={handleOrgChange}
                                    className="bg-transparent font-bold text-slate-700 outline-none min-w-[200px]"
                                >
                                    {orgs.map((org) => (
                                        <option key={org._id} value={org._id}>
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => handleSave(config)}
                                disabled={saving}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                Save Settings
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-12 gap-8">
                    {/* Sidebar Navigation - Hidden when isEditPayroll is true */}
                    {!isEditPayroll && (
                        <div className="col-span-12 lg:col-span-3 space-y-4">
                            <div className="bg-white rounded-3xl border border-slate-200 p-3 sticky top-8">
                                <div className="space-y-1">
                                    {[
                                        { id: "general", label: "General & Statutory", icon: Shield, desc: "Organization-wide rules" },
                                        { id: "statutory-rules", label: "Statutory Settings", icon: Building2, desc: "State-wise PT rules" },
                                        { id: "variable-pay", label: "Variable Pay", icon: TrendingUp, desc: "Incentives & bonuses" },
                                        { id: "locations", label: "Office Locations", icon: MapPin, desc: "Organization locations" },
                                        { id: "edit-payroll", label: "Edit Payroll", icon: Settings, desc: "Individual overrides" },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                                                activeTab === tab.id
                                                    ? "bg-indigo-600 text-white translate-x-2"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                        >
                                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-white" : "group-hover:scale-110 transition-transform"}`} />
                                            <div className="text-left">
                                                <p className="font-bold text-sm leading-tight">{tab.label}</p>
                                                <p className={`text-[10px] mt-0.5 ${activeTab === tab.id ? "text-indigo-100" : "text-slate-400 font-medium"}`}>
                                                    {tab.desc}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info className="w-4 h-4 text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Help</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                        Changes here affect how monthly payroll is calculated across the organization.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content Area - Full width if isEditPayroll is true */}
                    <div className={`${isEditPayroll ? 'col-span-12' : 'col-span-12 lg:col-span-9'} transition-all duration-500`}>
                        {activeTab === "general" && config && (
                            <form onSubmit={(e) => { e.preventDefault(); handleSave(config); }} className="space-y-6">
                                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                                                <Shield className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900">General & Statutory Rules</h3>
                                                <p className="text-slate-500 text-sm font-medium">Global payroll configuration & statutory toggles</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {/* Statutory Toggles */}
                                        <div className="col-span-full mb-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Statutory Deductions</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${config.pfEnabled ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.pfEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                            <span className="font-bold text-xs">PF</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-sm">Provident Fund</p>
                                                            <p className="text-[10px] text-slate-500 font-medium">Employee & Employer contribution</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setConfig({ ...config, pfEnabled: !config.pfEnabled })}
                                                        className={`w-12 h-6 rounded-full transition-all relative ${config.pfEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                                    >
                                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.pfEnabled ? 'right-1' : 'left-1'}`} />
                                                    </button>
                                                </div>

                                                <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${config.esicEnabled ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.esicEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                            <span className="font-bold text-xs">ESI</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-sm">ESIC Compliance</p>
                                                            <p className="text-[10px] text-slate-500 font-medium">Employee health insurance</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setConfig({ ...config, esicEnabled: !config.esicEnabled })}
                                                        className={`w-12 h-6 rounded-full transition-all relative ${config.esicEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                                    >
                                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.esicEnabled ? 'right-1' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Payment Frequency</label>
                                            <select
                                                value={config?.paymentFrequency || 'Monthly'}
                                                onChange={(e) => setConfig({ ...config, paymentFrequency: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                            >
                                                <option value="Monthly">Monthly (Default)</option>
                                                <option value="Weekly">Weekly</option>
                                                <option value="Bi-Weekly">Bi-Weekly</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">PF Wage Limit (₹)</label>
                                            <input
                                                type="number"
                                                value={config?.pfWageLimit || 0}
                                                onChange={(e) => setConfig({ ...config, pfWageLimit: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">ESIC Wage Limit (₹)</label>
                                            <input
                                                type="number"
                                                value={config?.esicWageLimit || 0}
                                                onChange={(e) => setConfig({ ...config, esicWageLimit: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                            />
                                        </div>


                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Overtime Type</label>
                                            <select
                                                value={config?.overtimeCalculationType || 'Multiplier'}
                                                onChange={(e) => setConfig({ ...config, overtimeCalculationType: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                            >
                                                <option value="Multiplier">Salary Multiplier (e.g. 1.5x)</option>
                                                <option value="Fixed">Fixed Amount / Hour (e.g. ₹500)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                {config?.overtimeCalculationType === 'Fixed' ? 'OT Rate (₹ / Hour)' : 'OT Multiplier (x)'}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step={config?.overtimeCalculationType === 'Fixed' ? "1" : "0.1"}
                                                    value={config?.overtimeRate || 0}
                                                    onChange={(e) => setConfig({ ...config, overtimeRate: parseFloat(e.target.value) || 0 })}
                                                    className="w-full pr-12 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                                    {config?.overtimeCalculationType === 'Fixed' ? 'CASH' : 'FACTOR'}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Payment Day</label>
                                            <select
                                                value={config?.paymentDay || 1}
                                                onChange={(e) => setConfig({ ...config, paymentDay: parseInt(e.target.value) || 1 })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                            >
                                                {[...Array(31)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}th of Month</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Monthly Paid Leave Quota</label>
                                            <input
                                                type="number"
                                                value={config?.annualPaidLeaveQuota || 0}
                                                onChange={(e) => setConfig({ ...config, annualPaidLeaveQuota: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-2 px-1">Maximum allowed paid leaves per month.</p>
                                        </div>

                                        <div className={`col-span-1 md:col-span-2 p-5 rounded-2xl border-2 transition-all ${config?.enableLeaveRollover ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="font-bold text-slate-900 text-base">Enable Leave Rollover</p>
                                                    <p className="text-xs text-slate-500 font-medium mt-1">Carry forward unused leaves to the next month</p>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setConfig({ ...config, enableLeaveRollover: !config?.enableLeaveRollover });
                                                    }}
                                                    className={`w-14 h-7 rounded-full transition-all relative shrink-0 ${config?.enableLeaveRollover ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${config?.enableLeaveRollover ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>
                                            
                                            {config?.enableLeaveRollover && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200/60 mt-2">
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2">Max Rollover Leaves</label>
                                                        <input
                                                            type="number"
                                                            value={config?.maxLeaveRollover !== undefined ? config.maxLeaveRollover : 6}
                                                            onChange={(e) => setConfig({ ...config, maxLeaveRollover: parseInt(e.target.value) || 0 })}
                                                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        />
                                                        <p className="text-[10px] text-slate-500 mt-1">Max leaves an employee can carry at once.</p>
                                                    </div>
                                                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">Year-End Reset</p>
                                                            <p className="text-[10px] text-slate-500 mt-0.5">Reset balance to 0 on Jan 1st</p>
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const current = config?.resetRolloverYearly !== undefined ? config.resetRolloverYearly : true;
                                                                setConfig({ ...config, resetRolloverYearly: !current });
                                                            }}
                                                            className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${config?.resetRolloverYearly !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                        >
                                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${config?.resetRolloverYearly !== false ? 'right-0.5' : 'left-0.5'}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => fetchConfig(selectedOrg)}
                                        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 group disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 transition-transform group-hover:scale-110" />
                                        )}
                                        Save Configuration
                                    </button>
                                </div>
                            </form>
                        )}
                        {activeTab === "statutory-rules" && config && (
                            <StatutorySettings
                                config={config}
                                onUpdate={(data) => setConfig({ ...config, ...data })}
                            />
                        )}
                        {activeTab === "variable-pay" && (
                            <VariablePaySettings organizationId={selectedOrg} />
                        )}
                        {activeTab === "locations" && (
                            <OfficeLocationSettings organizationId={selectedOrg} />
                        )}
                        {activeTab === "edit-payroll" && (
                            <EditPayrollSettings 
                                organizationId={selectedOrg} 
                                onBack={() => setActiveTab('general')} 
                            />
                        )}

                        <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0">
                                <AlertCircle className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-900">Configuring Payroll Rules</h4>
                                <p className="text-sm text-indigo-700 leading-relaxed mt-1">
                                    Ensure that these settings align with your organization's legal registration and employment contracts.
                                    Variable Pay components should be assigned to specific employees in their profiles after creation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
