"use client";
import React, { useState, useEffect } from "react";
import {
    Calendar,
    DollarSign,
    AlertCircle,
    Plus,
    Trash2,
    Minus,
    Calculator,
    Download,
    TrendingUp,
    BadgeDollarSign,
    FileWarning,
    Users
} from "lucide-react";
import { calculateProfessionalTax, calculatePF } from "@/utils/validation";

function MonthSelector({ value, onChange }) {
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    return (
        <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
        >
            <option value="">Select Month</option>
            {months.map((month) => (
                <option key={month} value={month}>
                    {month}
                </option>
            ))}
        </select>
    );
}

export default function PayslipStructureSection({
    payslipStructure,
    onStructureChange,
    errors = {},
    employeeGender = "",
    pfApplicable = "",
    workState = "Maharashtra",
    isCompliant = true
}) {
    const [selectedMonth, setSelectedMonth] = useState("");
    const [statutoryConfigs, setStatutoryConfigs] = useState([]);

    useEffect(() => {
        const fetchStatutoryConfigs = async () => {
            try {
                const res = await fetch("/api/v1/admin/payroll/settings/statutory");
                const data = await res.json();
                if (Array.isArray(data)) {
                    setStatutoryConfigs(data);
                }
            } catch (error) {
                console.error("Failed to fetch statutory configs on client side", error);
            }
        };
        fetchStatutoryConfigs();
    }, []);

    // Synchronize isCompliant prop with the checkbox enabled state
    useEffect(() => {
        const ptIndex = payslipStructure.deductions.findIndex(
            (d) => d.name === "Professional Tax"
        );
        if (ptIndex !== -1) {
            const currentPT = payslipStructure.deductions[ptIndex];
            const shouldBeEnabled = isCompliant !== undefined ? isCompliant : true;
            if (currentPT.enabled !== shouldBeEnabled) {
                const updatedDeductions = [...payslipStructure.deductions];
                updatedDeductions[ptIndex] = { ...currentPT, enabled: shouldBeEnabled };
                onStructureChange({ ...payslipStructure, deductions: updatedDeductions });
            }
        }
    }, [isCompliant]);

    const addEarning = () => {
        const newEarning = {
            name: "New Earning",
            enabled: true,
            editable: true,
            calculationType: "percentage",
            percentage: 0,
            fixedAmount: 0,
        };
        onStructureChange({
            ...payslipStructure,
            earnings: [...payslipStructure.earnings, newEarning],
        });
    };

    const addDeduction = () => {
        const newDeduction = {
            name: "New Deduction",
            enabled: true,
            editable: true,
            calculationType: "percentage",
            percentage: 0,
            fixedAmount: 0,
        };
        onStructureChange({
            ...payslipStructure,
            deductions: [...payslipStructure.deductions, newDeduction],
        });
    };

    const updateEarning = (index, field, value) => {
        const updatedEarnings = [...payslipStructure.earnings];
        updatedEarnings[index] = { ...updatedEarnings[index], [field]: value };
        onStructureChange({ ...payslipStructure, earnings: updatedEarnings });
    };

    const updateDeduction = (index, field, value) => {
        const updatedDeductions = [...payslipStructure.deductions];
        updatedDeductions[index] = { ...updatedDeductions[index], [field]: value };
        onStructureChange({ ...payslipStructure, deductions: updatedDeductions });
    };

    const removeEarning = (index) => {
        const updatedEarnings = payslipStructure.earnings.filter((_, i) => i !== index);
        onStructureChange({ ...payslipStructure, earnings: updatedEarnings });
    };

    const removeDeduction = (index) => {
        const updatedDeductions = payslipStructure.deductions.filter(
            (_, i) => i !== index
        );
        onStructureChange({ ...payslipStructure, deductions: updatedDeductions });
    };

    const calculatePFContributions = () => {
        const basicSalary = parseFloat(payslipStructure.basicSalary) || 0;
        if (pfApplicable !== "yes") {
            return { employeePF: 0, employerPF: 0, totalPF: 0 };
        }
        
        const employeePFObj = payslipStructure.deductions?.find(d => d.name === "Provident Fund (Employee)");
        const employerPFObj = payslipStructure.deductions?.find(d => d.name === "Provident Fund (Employer)");
        
        const employeePF = employeePFObj && employeePFObj.enabled ? calculateDeductionAmount(employeePFObj) : 0;
        const employerPF = employerPFObj && employerPFObj.enabled ? calculateDeductionAmount(employerPFObj) : 0;
        
        return {
            employeePF,
            employerPF,
            totalPF: employeePF + employerPF,
        };
    };

    const calculatePT = () => {
        // If Professional Tax deduction is unchecked/disabled, return 0
        const ptDeduction = payslipStructure.deductions.find(d => d.name === "Professional Tax");
        if (ptDeduction && !ptDeduction.enabled) {
            return 0;
        }

        const grossSalary = calculateTotalEarnings();
        const activeState = workState || "Maharashtra";

        // Find statutory configuration for the state (case-insensitive)
        const stateConfig = statutoryConfigs.find(
            (c) => c.state.toLowerCase() === activeState.toLowerCase() && c.isEnabled && c.ptApplicable
        );

        if (stateConfig && Array.isArray(stateConfig.ptSlabs) && stateConfig.ptSlabs.length > 0) {
            const currentMonthNum = selectedMonth
                ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(selectedMonth) + 1
                : new Date().getMonth() + 1;

            const slab = stateConfig.ptSlabs.find(
                (s) => grossSalary >= s.minSalary && grossSalary <= s.maxSalary
            );
            if (slab) {
                if (slab.exceptionMonth === currentMonthNum && slab.exceptionTaxAmount !== null) {
                    return slab.exceptionTaxAmount;
                }
                return slab.taxAmount;
            }
            return 0;
        }

        // Fallback to hardcoded validation utility
        return calculateProfessionalTax(grossSalary, employeeGender, selectedMonth);
    };

    const calculateEarningAmount = (earning) => {
        const basicSalary = parseFloat(payslipStructure.basicSalary) || 0;
        if (earning.calculationType === "fixed") {
            return earning.fixedAmount || 0;
        }
        if (earning.calculationType === "percentage") {
            return (basicSalary * (earning.percentage || 0)) / 100;
        }
        return 0;
    };

    const calculateDeductionAmount = (deduction) => {
        const basicSalary = parseFloat(payslipStructure.basicSalary) || 0;
        if (deduction.name === "Professional Tax") {
            return calculatePT();
        }
        if (deduction.calculationType === "fixed") {
            return deduction.fixedAmount || 0;
        }
        if (deduction.calculationType === "percentage") {
            return (basicSalary * (deduction.percentage || 0)) / 100;
        }
        return 0;
    };

    const calculateTotalEarnings = () => {
        const basicSalary = parseFloat(payslipStructure.basicSalary) || 0;
        const additionalEarnings = payslipStructure.earnings
            .filter((e) => e.enabled)
            .reduce((sum, e) => sum + calculateEarningAmount(e), 0);
        return basicSalary + additionalEarnings;
    };

    const calculateTotalDeductions = () => {
        return payslipStructure.deductions
            .filter((d) => d.enabled && !d.name.toLowerCase().includes("(employer)"))
            .reduce((sum, d) => sum + calculateDeductionAmount(d), 0);
    };

    const calculateNetSalary = () => {
        return calculateTotalEarnings() - calculateTotalDeductions();
    };

    const handleBasicSalaryChange = (basicSalary) => {
        onStructureChange({
            ...payslipStructure,
            basicSalary: basicSalary,
        });
    };

    useEffect(() => {
        const totalGross = calculateTotalEarnings();
        if (payslipStructure.grossSalary !== totalGross) {
            onStructureChange({
                ...payslipStructure,
                grossSalary: totalGross,
            });
        }
    }, [payslipStructure.basicSalary, payslipStructure.earnings]);

    useEffect(() => {
        const hasPT = payslipStructure.deductions.some(
            (d) => d.name === "Professional Tax"
        );
        if (!hasPT) {
            const ptDeduction = {
                name: "Professional Tax",
                enabled: true,
                editable: false,
                calculationType: "fixed",
                percentage: 0,
                fixedAmount: 0,
            };
            onStructureChange({
                ...payslipStructure,
                deductions: [...payslipStructure.deductions, ptDeduction],
            });
        }
    }, []);

    useEffect(() => {
        if (pfApplicable === "yes") {
            const hasEmployeePF = payslipStructure.deductions.some(
                (d) => d.name === "Provident Fund (Employee)"
            );
            if (!hasEmployeePF) {
                const pfDeduction = {
                    name: "Provident Fund (Employee)",
                    enabled: true,
                    editable: true,
                    calculationType: "percentage",
                    percentage: 12,
                    fixedAmount: 0,
                };
                onStructureChange({
                    ...payslipStructure,
                    deductions: [...payslipStructure.deductions, pfDeduction],
                });
            }
        }
    }, [pfApplicable]);

    return (
        <div className="space-y-8">
            {/* Month Selection for PT Calculation */}
            <div className="bg-slate-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Month Selection for Professional Tax
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Select Month
                        </label>
                        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
                        <p className="text-xs text-slate-500">
                            Professional Tax varies by month. February has fixed ₹300 deduction.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Employee Gender
                        </label>
                        <div className="flex items-center space-x-2">
                            {employeeGender === "Female" ? (
                                <span className="text-sm text-green-600 font-medium">Female</span>
                            ) : employeeGender === "Male" ? (
                                <span className="text-sm text-blue-600 font-medium">Male</span>
                            ) : (
                                <span className="text-sm text-slate-500">Not specified</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">
                            {employeeGender === "Female"
                                ? "PT exempt if salary < ₹25,000"
                                : employeeGender === "Male"
                                    ? "PT applicable if salary > ₹10,000"
                                    : "Select gender for PT calculation"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Basic Salary Configuration */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Basic Salary Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">
                            Salary Type <span className="text-red-500">*</span>
                        </label>
                        <div className="flex space-x-6">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="monthly"
                                    checked={payslipStructure.salaryType === "monthly"}
                                    onChange={(e) =>
                                        onStructureChange({
                                            ...payslipStructure,
                                            salaryType: e.target.value,
                                        })
                                    }
                                    className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                                />
                                <span className="text-sm text-slate-700">Monthly Salary</span>
                                <p className="text-xs text-slate-500">Fixed monthly amount</p>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="perday"
                                    checked={payslipStructure.salaryType === "perday"}
                                    onChange={(e) =>
                                        onStructureChange({
                                            ...payslipStructure,
                                            salaryType: e.target.value,
                                        })
                                    }
                                    className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                                />
                                <span className="text-sm text-slate-700">Per Day Salary</span>
                                <p className="text-xs text-slate-500">Daily rate × days</p>
                            </label>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Basic Salary (₹) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="number"
                                value={payslipStructure.basicSalary || ""}
                                onChange={(e) =>
                                    handleBasicSalaryChange(parseFloat(e.target.value) || 0)
                                }
                                placeholder={payslipStructure.salaryType === "monthly" ? "50000" : "2000"}
                                step="0.01"
                                className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["payslipStructure.basicSalary"]
                                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                    : "border-slate-300"
                                    }`}
                            />
                            {payslipStructure.salaryType === "perday" && (
                                <p className="text-xs text-slate-500 mt-1">(Per Day Amount)</p>
                            )}
                        </div>
                        {errors["payslipStructure.basicSalary"] && (
                            <div className="flex items-center space-x-1 text-red-600 text-xs">
                                <AlertCircle className="w-3 h-3" />
                                <span>{errors["payslipStructure.basicSalary"]}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Gross Salary Input */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                    Gross Salary (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="number"
                        value={calculateTotalEarnings() || ""}
                        readOnly
                        placeholder="0"
                        className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-lg text-sm bg-slate-100 cursor-not-allowed text-slate-700 transition-colors ${errors["payslipStructure.grossSalary"]
                            ? "border-red-300"
                            : "border-slate-200"
                            }`}
                    />
                </div>
                <p className="text-xs text-slate-500">
                    Gross Salary is automatically calculated as the sum of Basic Salary and all Earnings.
                </p>
                {errors["payslipStructure.grossSalary"] && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors["payslipStructure.grossSalary"]}</span>
                    </div>
                )}
            </div>

            {/* Earnings Components */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Earnings Components (
                    {payslipStructure.earnings.filter((e) => e.enabled).length} enabled)
                </h3>
                <button
                    type="button"
                    onClick={addEarning}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Earning
                </button>
                {payslipStructure.earnings.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <p className="text-sm text-slate-600">
                            No earning components added yet
                            <br />
                            Click "Add Earning" to create your first component
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {payslipStructure.earnings.map((earning, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-white border border-slate-200 rounded-lg"
                            >
                                <div className="md:col-span-1">
                                    <input
                                        type="checkbox"
                                        checked={earning.enabled}
                                        onChange={(e) =>
                                            updateEarning(index, "enabled", e.target.checked)
                                        }
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <input
                                        type="text"
                                        value={earning.name}
                                        onChange={(e) => updateEarning(index, "name", e.target.value)}
                                        placeholder="Earning name"
                                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <select
                                        value={earning.calculationType}
                                        onChange={(e) =>
                                            updateEarning(index, "calculationType", e.target.value)
                                        }
                                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-3">
                                    {earning.calculationType === "percentage" ? (
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={earning.percentage || ""}
                                                onChange={(e) =>
                                                    updateEarning(
                                                        index,
                                                        "percentage",
                                                        parseFloat(e.target.value) || 0
                                                    )
                                                }
                                                placeholder="0"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-slate-500">
                                                %
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="number"
                                                value={earning.fixedAmount || ""}
                                                onChange={(e) =>
                                                    updateEarning(
                                                        index,
                                                        "fixedAmount",
                                                        parseFloat(e.target.value) || 0
                                                    )
                                                }
                                                placeholder="0"
                                                step="0.01"
                                                min="0"
                                                className="w-full pl-8 pr-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2 flex items-center space-x-2">
                                    <span className="text-sm font-medium text-green-600">
                                        ₹
                                        {calculateEarningAmount(earning).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                        })}
                                    </span>
                                    {earning.editable && (
                                        <button
                                            type="button"
                                            onClick={() => removeEarning(index)}
                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove earning"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Deductions Components */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Minus className="w-5 h-5 text-red-600" />
                    Deductions Components (
                    {payslipStructure.deductions.filter((d) => d.enabled).length} enabled)
                </h3>
                <button
                    type="button"
                    onClick={addDeduction}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Deduction
                </button>
                {payslipStructure.deductions.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <p className="text-sm text-slate-600">
                            No deduction components added yet
                            <br />
                            Click "Add Deduction" to create your first component
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {payslipStructure.deductions.map((deduction, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-white border border-slate-200 rounded-lg"
                            >
                                <div className="md:col-span-1">
                                    <input
                                        type="checkbox"
                                        checked={deduction.enabled}
                                        onChange={(e) =>
                                            updateDeduction(index, "enabled", e.target.checked)
                                        }
                                        className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <input
                                        type="text"
                                        value={deduction.name}
                                        onChange={(e) =>
                                            updateDeduction(index, "name", e.target.value)
                                        }
                                        placeholder="Deduction name"
                                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <select
                                        value={deduction.calculationType}
                                        onChange={(e) =>
                                            updateDeduction(index, "calculationType", e.target.value)
                                        }
                                        disabled={
                                            deduction.name === "Professional Tax"
                                        }
                                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-3">
                                    {deduction.calculationType === "percentage" ? (
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={deduction.percentage || ""}
                                                onChange={(e) =>
                                                    updateDeduction(
                                                        index,
                                                        "percentage",
                                                        parseFloat(e.target.value) || 0
                                                    )
                                                }
                                                placeholder="0"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                disabled={
                                                    deduction.name === "Professional Tax"
                                                }
                                                className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            />
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-slate-500">
                                                %
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="number"
                                                value={deduction.fixedAmount || ""}
                                                onChange={(e) =>
                                                    updateDeduction(
                                                        index,
                                                        "fixedAmount",
                                                        parseFloat(e.target.value) || 0
                                                    )
                                                }
                                                placeholder="0"
                                                step="0.01"
                                                min="0"
                                                disabled={
                                                    deduction.name === "Professional Tax"
                                                }
                                                className="w-full pl-8 pr-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2 flex items-center space-x-2">
                                    {deduction.name === "Professional Tax" ? (
                                        <span className="text-sm font-medium text-red-600">
                                            ₹
                                            {calculatePT().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                            })}{" "}
                                            ({selectedMonth || "Month"})
                                        </span>
                                    ) : (
                                        <span className="text-sm font-medium text-red-600">
                                            -₹
                                            {calculateDeductionAmount(deduction).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    )}
                                    {(deduction.editable || true) && (
                                            <button
                                                type="button"
                                                onClick={() => removeDeduction(index)}
                                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove deduction"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    {deduction.name === "Professional Tax" && (
                                        <p className="text-xs text-slate-500">
                                            {employeeGender === "Female"
                                                ? `Female employee: ${calculatePT() === 0
                                                    ? "PT exempt (salary < ₹25,000)"
                                                    : "PT applicable"
                                                }`
                                                : employeeGender === "Male"
                                                    ? `Male employee: ${calculatePT() === 0
                                                        ? "PT exempt (salary ≤ ₹10,000)"
                                                        : "PT applicable"
                                                    }`
                                                    : "Select gender for PT calculation"}
                                            {selectedMonth === "February" && " • February: Fixed ₹300"}
                                        </p>
                                    )}
                                    {deduction.name === "Provident Fund (Employee)" && (
                                        <p className="text-xs text-slate-500">
                                            Employee PF: 12% of Basic Salary • Employer PF: 13% of Basic
                                            Salary
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Salary Breakdown Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-purple-600" />
                    Salary Breakdown & Calculation Preview
                </h3>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors mb-4"
                >
                    <Download className="w-4 h-4" />
                    Export Breakdown
                </button>

                {/* Gross Salary Section */}
                <div className="space-y-2 mb-6">
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        Gross Salary (Total Earnings)
                    </h4>
                    <p className="text-2xl font-bold text-green-600">
                        ₹
                        {calculateTotalEarnings().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                        })}
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1">
                        <li>
                            Basic Salary: ₹
                            {(payslipStructure.basicSalary || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                            })}
                        </li>
                        {payslipStructure.earnings
                            .filter((e) => e.enabled)
                            .map((earning, idx) => (
                                <li key={idx}>
                                    {earning.name}: ₹
                                    {calculateEarningAmount(earning).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                    })}
                                </li>
                            ))}
                    </ul>
                </div>

                {/* Deductions Section */}
                <div className="space-y-4">
                    {/* PF Breakdown */}
                    {pfApplicable === "yes" && payslipStructure.deductions.some(d => d.name === "Provident Fund (Employee)" && d.enabled) && (
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <BadgeDollarSign className="w-4 h-4 text-red-600" />
                                Provident Fund (PF) Breakdown
                            </h4>
                            <ul className="text-sm text-slate-600 space-y-1 mt-2">
                                <li>
                                    Employee PF (12%): -₹
                                    {calculatePFContributions().employeePF.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                    })}
                                </li>
                                <li>
                                    Employer PF (13%): ₹
                                    {calculatePFContributions().employerPF.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                    })}
                                </li>
                                <li>
                                    Total PF Contribution: ₹
                                    {calculatePFContributions().totalPF.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                    })}
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* Professional Tax Section */}
                    {payslipStructure.deductions.some(d => d.name === "Professional Tax" && d.enabled) && (
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <FileWarning className="w-4 h-4 text-red-600" />
                                Professional Tax (PT) <span>({selectedMonth || "Select Month"})</span>
                            </h4>
                            <p className="text-lg font-medium text-red-600">
                                ₹{calculatePT().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                            </p>
                            <p className="text-xs text-slate-500">
                                {selectedMonth === "February"
                                    ? "Fixed ₹300 for February"
                                    : employeeGender === "Female" && calculatePT() === 0
                                        ? "Female employee exempt (salary < ₹25,000)"
                                        : employeeGender === "Male" && calculatePT() === 0
                                            ? "Male employee exempt (salary ≤ ₹10,000)"
                                            : "Applicable as per rules"}
                            </p>
                            <div className="flex space-x-2 mt-2">
                                {employeeGender === "Female" ? (
                                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                        <Users className="w-3 h-3 mr-1" />
                                        Female
                                    </span>
                                ) : employeeGender === "Male" ? (
                                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                        <Users className="w-3 h-3 mr-1" />
                                        Male
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">
                                        <Users className="w-3 h-3 mr-1" />
                                        Not specified
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Other Deductions */}
                    {payslipStructure.deductions.filter(
                        (d) =>
                            d.enabled &&
                            d.name !== "Professional Tax" &&
                            d.name !== "Provident Fund (Employee)" &&
                            !d.name.toLowerCase().includes("(employer)")
                    ).length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    <Minus className="w-4 h-4 text-red-600" />
                                    Other Deductions
                                </h4>
                                <ul className="text-sm text-slate-600 space-y-1 mt-2">
                                    {payslipStructure.deductions
                                        .filter(
                                            (d) =>
                                                d.enabled &&
                                                d.name !== "Professional Tax" &&
                                                d.name !== "Provident Fund (Employee)" &&
                                                !d.name.toLowerCase().includes("(employer)")
                                        )
                                        .map((deduction, idx) => (
                                            <li key={idx}>
                                                {deduction.name}: -₹
                                                {calculateDeductionAmount(deduction).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                                })}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        )}

                    {/* Employer Contributions (Informational) */}
                    {payslipStructure.deductions.filter(
                        (d) => d.enabled && d.name.toLowerCase().includes("(employer)")
                    ).length > 0 && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <BadgeDollarSign className="w-4 h-4 text-slate-600" />
                                Employer Contributions (Not deducted from Net Salary)
                            </h4>
                            <ul className="text-sm text-slate-600 space-y-1 mt-2">
                                {payslipStructure.deductions
                                    .filter((d) => d.enabled && d.name.toLowerCase().includes("(employer)"))
                                    .map((deduction, idx) => (
                                        <li key={idx} className="flex justify-between">
                                            <span>{deduction.name}</span>
                                            <span className="font-medium text-slate-700">
                                                ₹{calculateDeductionAmount(deduction).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 })}
                                            </span>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Net Salary Summary */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-purple-600" />
                        Net Salary Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <p className="text-sm text-slate-600">Total Earnings</p>
                            <p className="text-lg font-medium text-green-600">
                                ₹
                                {calculateTotalEarnings().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Total Deductions</p>
                            <p className="text-lg font-medium text-red-600">
                                -₹
                                {calculateTotalDeductions().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                })}
                            </p>
                            <p className="text-xs text-slate-500">
                                Includes: 
                                {payslipStructure.deductions.some(d => d.name === "Provident Fund (Employee)" && d.enabled) && calculatePFContributions().employeePF > 0
                                    ? ` PF (₹${calculatePFContributions().employeePF.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })})`
                                    : ""}{" "}
                                {payslipStructure.deductions.some(d => d.name === "Professional Tax" && d.enabled) && calculatePT() > 0
                                    ? ` , PT (₹${calculatePT().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })})`
                                    : ""}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Net Payable Salary</p>
                            <p className="text-2xl font-bold text-purple-600">
                                ₹
                                {calculateNetSalary().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                })}
                            </p>
                            <p className="text-xs text-slate-500">
                                Take home amount{" "}
                                {payslipStructure.salaryType === "perday" && "(per day)"}
                            </p>
                        </div>
                    </div>
                    <div
                        className={`mt-4 p-4 rounded-lg text-sm font-medium text-white ${calculateNetSalary() > 0 ? "bg-green-400" : "bg-red-400"
                            }`}
                    >
                        {calculateNetSalary() > 0
                            ? "Positive balance - Ready for processing"
                            : "Needs adjustment - Deductions exceed earnings"}
                    </div>
                    {payslipStructure.salaryType === "perday" && (
                        <div className="mt-4 bg-slate-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm font-semibold text-blue-800">
                                Per Day Salary Configuration
                            </p>
                            <p className="text-sm text-blue-600 mt-1">
                                The amounts shown above are for one working day. Actual monthly
                                salary will be calculated by multiplying these amounts with the
                                number of working days in the month.
                            </p>
                            <ul className="text-sm text-blue-600 mt-2 space-y-1">
                                {[22, 24, 26, 30].map((days) => (
                                    <li key={days}>
                                        For {days} days: ₹
                                        {(calculateNetSalary() * days).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                        })}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
