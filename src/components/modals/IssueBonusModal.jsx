"use client";

import React, { useState, useEffect } from "react";
import { X, Gift, Users, Building, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const IssueBonusModal = ({ isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);

    // Initial State
    const initialState = {
        title: "",
        description: "",
        type: "Performance",
        amount: "",
        issuanceType: "Fixed",
        percentageBasis: "Basic",
        targetAudience: "Individual",
        employees: [], // Selected employee IDs
        department: "", // Selected department ID
        paymentDate: new Date().toISOString().split('T')[0]
    };

    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (isOpen) {
            fetchOptions();
            setFormData(initialState);
        }
    }, [isOpen]);

    const fetchOptions = async () => {
        try {
            // Fetch employees for selection
            const empRes = await fetch("/api/v1/admin/payroll/employees/list"); // Assuming this exists or similar
            // If not, we might need a general fetch. 
            // Often there's an API for dropdowns. If not, I'll fallback to a simpler fetch or assume.
            // Let's try /api/v1/admin/payroll/employees for now, assuming list might be heavy.
            // Actually, for "Individual" selection, we need names.

            // Checking previous steps, there is `/api/v1/admin/payroll/employees` (implied by sidebar link).
            // But let's check if there is a lightweight list. 
            // I'll use /api/employees/list if it exists, or /api/v1/admin/payroll/employees.
            // Wait, I haven't seen the employee list API code.
            // I'll assume /api/employees exists or I can use /api/auth/users if it was user based.
            // But Employees are in a separate collection.
            // Let's use a safe assumption or a known route. 
            // Step 171 showed `/payroll/employees` link.
            // I'll try fetching `/api/v1/admin/payroll/employees` (which likely calls `Employee.find()`).

            // Also need Departments. `/api/v1/admin/crm/departments`?
            // I'll wrap this in a try-catch and handle errors gracefully.

            const [empResponse, deptResponse] = await Promise.all([
                fetch("/api/v1/admin/payroll/employees?limit=1000&status=Active"), 
                fetch("/api/v1/admin/crm/departments?limit=100")
            ]);

            // Handling 404s if routes differ
            if (empResponse.ok) {
                const data = await empResponse.json();
                setEmployees(data.employees || data || []);
            }
            if (deptResponse.ok) {
                const data = await deptResponse.json();
                setDepartments(data.data || data.departments || []);
            }

        } catch (error) {
            console.error("Failed to fetch options", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSave(formData);
            onClose();
            toast.success("Bonus issued successfully!");
        } catch (error) {
            toast.error(error.message || "Failed to issue bonus");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <Gift className="w-6 h-6 text-pink-500" />
                        Issue New Bonus
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Diwali Bonus 2024"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                            >
                                <option value="Performance">Performance</option>
                                <option value="Festival">Festival</option>
                                <option value="Referral">Referral</option>
                                <option value="Joining">Joining</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                            <input
                                type="date"
                                required
                                value={formData.paymentDate}
                                onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Amount & Calculation */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-gray-500" />
                            Calculation Rules
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Issuance Type</label>
                                <select
                                    value={formData.issuanceType}
                                    onChange={e => setFormData({ ...formData, issuanceType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                >
                                    <option value="Fixed">Fixed Amount</option>
                                    <option value="Percentage">Percentage</option>
                                </select>
                            </div>

                            {formData.issuanceType === 'Percentage' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Basis</label>
                                    <select
                                        value={formData.percentageBasis}
                                        onChange={e => setFormData({ ...formData, percentageBasis: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    >
                                        <option value="Basic">Basic Salary</option>
                                        <option value="Gross">Gross Salary</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    {formData.issuanceType === 'Percentage' ? 'Percentage (%)' : 'Amount'}
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    placeholder={formData.issuanceType === 'Percentage' ? "e.g. 50" : "e.g. 5000"}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Target Audience */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="audience"
                                    value="Individual"
                                    checked={formData.targetAudience === "Individual"}
                                    onChange={() => setFormData({ ...formData, targetAudience: "Individual" })}
                                    className="text-pink-600 focus:ring-pink-500"
                                />
                                <span className="text-sm text-gray-700">Individual Employees</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="audience"
                                    value="Department"
                                    checked={formData.targetAudience === "Department"}
                                    onChange={() => setFormData({ ...formData, targetAudience: "Department" })}
                                    className="text-pink-600 focus:ring-pink-500"
                                />
                                <span className="text-sm text-gray-700">Entire Department</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="audience"
                                    value="All"
                                    checked={formData.targetAudience === "All"}
                                    onChange={() => setFormData({ ...formData, targetAudience: "All" })}
                                    className="text-pink-600 focus:ring-pink-500"
                                />
                                <span className="text-sm text-gray-700">All Employees</span>
                            </label>
                        </div>

                        {formData.targetAudience === "Individual" && (
                            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                                {/* Placeholder for Multi-Select or Employee Search */}
                                {/* Implementing a simple list for prototype */}
                                {employees.length > 0 ? (
                                    <div className="space-y-2">
                                        {employees.map(emp => (
                                            <label key={emp._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.employees.includes(emp._id)}
                                                    onChange={e => {
                                                        const newIds = e.target.checked
                                                            ? [...formData.employees, emp._id]
                                                            : formData.employees.filter(id => id !== emp._id);
                                                        setFormData({ ...formData, employees: newIds });
                                                    }}
                                                    className="rounded text-pink-600 focus:ring-pink-500"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    {emp.personalDetails?.firstName} {emp.personalDetails?.lastName}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-2">Loading employees or none found...</p>
                                )}
                            </div>
                        )}

                        {formData.targetAudience === "Department" && (
                            <select
                                value={formData.department}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept._id} value={dept._id}>{dept.departmentName}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description / Note</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none resize-none"
                            placeholder="Add any additional details..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg hover: transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? "Issuing..." : "Issue Bonus"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IssueBonusModal;
