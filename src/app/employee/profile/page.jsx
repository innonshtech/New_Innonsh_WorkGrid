"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    User, Mail, Phone, MapPin, Calendar, Briefcase, Building2, Shield,
    Lock, Eye, EyeOff, Save, Loader2, ChevronRight, BadgeCheck,
    Heart, UserCheck, Users, GitGraph, Clock, CreditCard, FileText,
    AlertTriangle, CheckCircle2, ArrowLeft, Key, Fingerprint,
    Calculator, DollarSign, Plus, Minus, TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-2xl border border-slate-200 hover: transition- duration-300 ${className}`}>
        {children}
    </div>
);

const InfoRow = ({ label, value, icon: Icon, mono = false }) => (
    <div className="flex items-start justify-between py-3 border-b border-slate-50 last:border-0 gap-4">
        <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            <span className="text-xs font-medium text-slate-500">{label}</span>
        </div>
        <span className={`text-xs font-semibold text-slate-900 text-right ${mono ? 'font-mono' : ''}`}>
            {value || <span className="text-slate-300 italic">Not provided</span>}
        </span>
    </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
            <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-[10px] text-slate-500 font-medium mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

const HierarchyPerson = ({ label, person, color = "indigo" }) => {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (typeof person === 'string' && person.length > 0) {
            fetch(`/api/v1/employee/payroll/employees/${person}`)
                .then(res => res.json())
                .then(data => {
                    if(!data.error) setProfile(data);
                })
                .catch(console.error);
        } else {
            setProfile(person);
        }
    }, [person]);

    const displayPerson = profile || (typeof person === 'object' ? person : null);

    const colorClasses = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        violet: "bg-violet-50 text-violet-600 border-violet-100",
    };

    if (!displayPerson) {
        return (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-xs text-slate-400 italic mt-0.5">{typeof person === 'string' && person ? 'Loading...' : 'Not assigned'}</p>
                </div>
            </div>
        );
    }

    const name = `${displayPerson.personalDetails?.firstName || displayPerson.firstName || ''} ${displayPerson.personalDetails?.lastName || displayPerson.lastName || ''}`.trim();
    const initial = name.charAt(0).toUpperCase() || '?';

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${colorClasses[color]}`}>
                <span className="font-bold text-sm">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{name || 'Unknown User'}</p>
                {displayPerson.employeeId && (
                    <p className="text-[10px] text-slate-500 font-mono">{displayPerson.employeeId}</p>
                )}
            </div>
            <BadgeCheck className={`w-4 h-4 shrink-0 ${colorClasses[color].split(' ')[1]}`} />
        </div>
    );
};

const MaskedInfoRow = ({ label, value, icon: Icon, mono = false, visibleChars = 4 }) => {
    const [isVisible, setIsVisible] = useState(false);

    if (!value) {
        return <InfoRow label={label} value={value} icon={Icon} mono={mono} />;
    }

    const str = String(value);
    const maskedValue = str.length <= visibleChars ? str : '•'.repeat(str.length - visibleChars) + str.slice(-visibleChars);

    return (
        <div className="flex items-start justify-between py-3 border-b border-slate-50 last:border-0 gap-4 group">
            <div className="flex items-center gap-2 min-w-0">
                {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <span className="text-xs font-medium text-slate-500">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold text-slate-900 text-right ${mono ? 'font-mono tracking-wider' : ''}`}>
                    {isVisible ? value : maskedValue}
                </span>
                <button
                    onClick={() => setIsVisible(!isVisible)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none"
                    title={isVisible ? "Hide details" : "Show details"}
                >
                    {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>
    );
};

export default function EmployeeProfilePage() {
    const router = useRouter();
    const { user, loading: sessionLoading } = useSession();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(false);

    // Change Password state
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        if (user?.id) {
            fetchEmployeeProfile(user.id);
            fetchTeamMembers(user.id);
        } else if (!sessionLoading && !user) {
            setLoading(false);
        }
    }, [user, sessionLoading]);

    const fetchEmployeeProfile = async (employeeId) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/employee/payroll/employees/${employeeId}`);
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                const data = await res.json();
                setEmployee(data);
            } else {
                toast.error("Failed to load profile");
            }
        } catch (error) {
            console.error("Failed to load profile:", error);
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamMembers = async (employeeId) => {
        try {
            setLoadingTeam(true);
            // Fetch employees whose reportingManager is the current employee
            const res = await fetch(`/api/v1/employee/payroll/employees?reportingManager=${employeeId}`);
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                const data = await res.json();
                const members = data.employees || data || [];
                setTeamMembers(Array.isArray(members) ? members : []);
            }
        } catch (error) {
            console.error("Failed to fetch team members:", error);
        } finally {
            setLoadingTeam(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (passwordData.newPassword.length < 8) {
            toast.error("New password must be at least 8 characters");
            return;
        }

        try {
            setChangingPassword(true);
            const res = await fetch("/api/v1/employee/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                    confirmPassword: passwordData.confirmPassword
                })
            });
            const result = await res.json();
            if (result.success) {
                toast.success("Password changed successfully!");
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setShowPasswordSection(false);
            } else {
                toast.error(result.error || "Password change failed");
            }
        } catch (error) {
            toast.error("Error changing password");
        } finally {
            setChangingPassword(false);
        }
    };

    const formatAddress = (addr) => {
        if (!addr) return null;
        const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : null;
    };



    if (loading || sessionLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-sm text-slate-500 mt-3 font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="text-sm text-slate-700 mt-3 font-bold">Profile not found</p>
                    <button
                        onClick={() => router.push("/employee/dashboard")}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const pd = employee.personalDetails || {};
    const jd = employee.jobDetails || {};
    const sd = employee.salaryDetails || {};
    const ba = sd.bankAccount || {};
    const ps = employee.payslipStructure || {};

    const calcAmount = (item, basic) => {
        if (item.calculationType === 'fixed') return item.fixedAmount || 0;
        if (item.calculationType === 'percentage') return (basic * (item.percentage || 0)) / 100;
        return 0;
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {t("myProfile") || "My Profile"}
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            View your personal information, job details, and team hierarchy
                        </p>
                    </div>
                </div>

                {/* Profile Hero Card */}
                <Card className="p-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 px-8 py-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
                        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30">
                                <span className="text-white font-black text-3xl">
                                    {pd.firstName?.charAt(0)?.toUpperCase() || 'E'}
                                </span>
                            </div>
                            <div className="text-white flex-1">
                                <h2 className="text-2xl font-black tracking-tight">
                                    {pd.firstName} {pd.lastName}
                                </h2>
                                <p className="text-white/70 text-sm font-medium mt-1">{jd.designation || 'Employee'}</p>
                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                                        {employee.employeeId}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 backdrop-blur px-3 py-1 rounded-full">
                                        {employee.status || 'Active'}
                                    </span>
                                    {jd.department && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur px-3 py-1 rounded-full">
                                            {jd.departmentId?.departmentName || jd.department}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Personal Information */}
                        <Card className="p-6">
                            <SectionHeader icon={User} title="Personal Information" subtitle="Your personal details" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                                <div>
                                    <InfoRow icon={User} label="Full Name" value={`${pd.firstName || ''} ${pd.lastName || ''}`} />
                                    <InfoRow icon={Mail} label="Email" value={pd.email} />
                                    <InfoRow icon={Phone} label="Phone" value={pd.phone} />
                                    <InfoRow icon={Calendar} label="Date of Birth" value={pd.dateOfBirth ? format(new Date(pd.dateOfBirth), 'dd MMM yyyy') : null} />
                                </div>
                                <div>
                                    <InfoRow label="Gender" value={pd.gender} />
                                    <InfoRow label="Blood Group" value={pd.bloodGroup} icon={Heart} />
                                    <InfoRow icon={Calendar} label="Date of Joining" value={pd.dateOfJoining ? format(new Date(pd.dateOfJoining), 'dd MMM yyyy') : null} />
                                    <InfoRow label="Employee ID" value={employee.employeeId} mono />
                                </div>
                            </div>
                        </Card>

                        {/* Address Information */}
                        <Card className="p-6">
                            <SectionHeader icon={MapPin} title="Address" subtitle="Your registered addresses" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current / Temporary</p>
                                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                        {formatAddress(pd.temporaryAddress || pd.address) || <span className="text-slate-400 italic">Not provided</span>}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Permanent</p>
                                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                        {formatAddress(pd.permanentAddress) || <span className="text-slate-400 italic">Not provided</span>}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Job Details */}
                        <Card className="p-6">
                            <SectionHeader icon={Briefcase} title="Job Details" subtitle="Your employment information" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                                <div>
                                    <InfoRow icon={Briefcase} label="Designation" value={jd.designation} />
                                    <InfoRow icon={Building2} label="Department" value={jd.departmentId?.departmentName || jd.department} />
                                    <InfoRow label="Organization" value={jd.organizationId?.name || jd.organization} />
                                    <InfoRow label="Employee Type" value={jd.employeeTypeId?.employeeType || jd.employeeType} />
                                </div>
                                <div>
                                    <InfoRow icon={MapPin} label="Work Location" value={jd.workLocation} />
                                    <InfoRow icon={Clock} label="Working Shift" value={jd.defaultShift?.name || "General Shift"} />
                                    {jd.defaultShift && (
                                        <InfoRow icon={Clock} label="Shift Timing" value={`${jd.defaultShift.startTime} - ${jd.defaultShift.endTime}`} />
                                    )}
                                    <InfoRow label="Work State" value={jd.workState} />
                                </div>
                            </div>
                        </Card>

                        {/* Bank & Financial */}
                        <Card className="p-6">
                            <SectionHeader icon={CreditCard} title="Bank & Financial Details" subtitle="Your salary account and tax information" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                                <div>
                                    <InfoRow label="Bank Name" value={ba.bankName} />
                                    <MaskedInfoRow label="Account Number" value={ba.accountNumber} mono />
                                    <InfoRow label="IFSC Code" value={ba.ifscCode} mono />
                                    <InfoRow label="Branch" value={ba.branch} />
                                </div>
                                <div>
                                    <MaskedInfoRow icon={Fingerprint} label="PAN Number" value={sd.panNumber} mono />
                                    <MaskedInfoRow icon={Fingerprint} label="Aadhaar Number" value={sd.aadharNumber} mono />
                                    <InfoRow label="PF Applicable" value={employee.pfApplicable === 'yes' ? 'Yes' : 'No'} />
                                    <InfoRow label="ESIC Applicable" value={employee.esicApplicable === 'yes' ? 'Yes' : 'No'} />
                                </div>
                            </div>
                        </Card>

                        {/* Salary Structure */}
                        {ps && (ps.basicSalary || ps.grossSalary) && (
                            <Card className="p-6">
                                <SectionHeader icon={Calculator} title="Salary Structure" subtitle="Your approved salary breakdown" />
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Basic Salary</p>
                                            <p className="text-lg font-bold text-slate-900">₹{(ps.basicSalary || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gross Salary</p>
                                            <p className="text-lg font-bold text-emerald-600">₹{(ps.grossSalary || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Earnings */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <Plus className="w-4 h-4 text-emerald-500" />
                                                Earnings
                                            </h4>
                                            {ps.earnings && ps.earnings.filter(e => e.enabled).length > 0 ? (
                                                <div className="space-y-2">
                                                    {ps.earnings.filter(e => e.enabled).map((earning, i) => (
                                                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                                            <span className="text-xs text-slate-600 font-medium">{earning.name}</span>
                                                            <span className="text-xs font-bold text-emerald-600">+₹{calcAmount(earning, ps.basicSalary).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">No additional earnings.</p>
                                            )}
                                        </div>

                                        {/* Deductions */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <Minus className="w-4 h-4 text-rose-500" />
                                                Deductions
                                            </h4>
                                            {ps.deductions && ps.deductions.filter(d => d.enabled).length > 0 ? (
                                                <div className="space-y-2">
                                                    {ps.deductions.filter(d => d.enabled).map((deduction, i) => (
                                                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                                            <span className="text-xs text-slate-600 font-medium">{deduction.name}</span>
                                                            <span className="text-xs font-bold text-rose-600">-₹{calcAmount(deduction, ps.basicSalary).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">No deductions.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Emergency Contact */}
                        {pd.emergencyContact && (pd.emergencyContact.name || pd.emergencyContact.phone) && (
                            <Card className="p-6">
                                <SectionHeader icon={Phone} title="Emergency Contact" subtitle="Your emergency contact information" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                                    <div>
                                        <InfoRow label="Contact Name" value={pd.emergencyContact.name} />
                                        <InfoRow label="Relationship" value={pd.emergencyContact.relationship} />
                                    </div>
                                    <div>
                                        <InfoRow icon={Phone} label="Phone" value={pd.emergencyContact.phone} />
                                        {pd.emergencyContact.address && (
                                            <InfoRow icon={MapPin} label="Address" value={pd.emergencyContact.address} />
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Change Password Section */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <SectionHeader icon={Key} title="Security" subtitle="Manage your password" />
                                <button
                                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                                >
                                    {showPasswordSection ? 'Cancel' : 'Change Password'}
                                    <ChevronRight className={`w-3 h-3 transition-transform ${showPasswordSection ? 'rotate-90' : ''}`} />
                                </button>
                            </div>

                            {showPasswordSection && (
                                <form onSubmit={handleChangePassword} className="space-y-4 border-t border-slate-100 pt-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                placeholder="Enter current password"
                                                required
                                            />
                                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                    placeholder="Min 8 characters"
                                                    required
                                                />
                                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="password"
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                    placeholder="Re-enter password"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all disabled:opacity-50 disabled:"
                                        >
                                            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            )}

                            {!showPasswordSection && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <p className="text-xs text-slate-600 font-medium">
                                        Your password was last set when your account was created. Click "Change Password" to update it.
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column: Hierarchy & Team */}
                    <div className="space-y-8">
                        {/* Reporting Hierarchy */}
                        <Card className="p-6">
                            <SectionHeader icon={GitGraph} title="Reporting Hierarchy" subtitle="Your reporting chain" />
                            <div className="space-y-3">
                                <HierarchyPerson
                                    label="Reporting Manager"
                                    person={jd.reportingManager}
                                    color="indigo"
                                />
                                <HierarchyPerson
                                    label="Team Lead"
                                    person={jd.teamLead}
                                    color="violet"
                                />

                                {/* Current Employee - "You" */}
                                <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-indigo-200 bg-indigo-50/50">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">
                                            {pd.firstName?.charAt(0)?.toUpperCase() || 'Y'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">You</p>
                                        <p className="text-sm font-bold text-slate-900 truncate">{pd.firstName} {pd.lastName}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{jd.designation}</p>
                                    </div>
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                </div>
                            </div>
                        </Card>



                        {/* Quick Info Cards */}
                        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100/50">
                            <h4 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                Employment Summary
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Status</span>
                                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                                        employee.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {employee.status}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Tax Regime</span>
                                    <span className="font-bold text-slate-900 uppercase">{employee.taxRegime || 'New'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Probation</span>
                                    <span className="font-bold text-slate-900">{employee.probation === 'yes' ? `Yes (${employee.probationDuration || 0} months)` : 'No'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">OT Applicable</span>
                                    <span className="font-bold text-slate-900">{employee.otApplicable === 'yes' ? 'Yes' : 'No'}</span>
                                </div>
                                {pd.dateOfJoining && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Tenure</span>
                                        <span className="font-bold text-indigo-600">
                                            {Math.floor((new Date() - new Date(pd.dateOfJoining)) / (1000 * 60 * 60 * 24 * 365.25))} yrs {Math.floor(((new Date() - new Date(pd.dateOfJoining)) % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44))} mos
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Documents Count */}
                        {employee.documents && employee.documents.length > 0 && (
                            <Card className="p-6">
                                <h4 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                    Documents
                                </h4>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{employee.documents.length}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Documents uploaded</p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
