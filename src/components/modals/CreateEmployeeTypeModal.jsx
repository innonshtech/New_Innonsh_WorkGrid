"use client"

import { useState, useEffect } from "react";
import {
  X,
  Save,
  Users,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useValidation } from "@/hooks/useValidation";

const validationSchema = {
  organizationName: 'required',
  departmentName: 'required',
  employeeType: 'required',
};

export default function CreateEmployeeTypeModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  organizations 
}) {
  const [formData, setFormData] = useState({
    organizationName: "",
    departmentName: "",
    employeeType: "",
  });
  const [departments, setDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [duplicateError, setDuplicateError] = useState("");
const {user} = useSession()
  const { errors, validateField, handleBlur, touched, setErrors } = useValidation(formData, validationSchema);
  // Fetch departments when organization changes
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!formData.organizationName) {
        setDepartments([]);
        setFormData(prev => ({ ...prev, departmentName: "" }));
        return;
      }

      try {
        setIsLoadingDepartments(true);
        setError("");
        
        const selectedOrg = organizations.find(org => org.name === formData.organizationName);
        
        if (!selectedOrg) {
          setDepartments([]);
          return;
        }

        // Fetch departments for this organization using organizationId
        const response = await fetch(`/api/v1/admin/crm/departments?organizationId=${selectedOrg._id}`);
        
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.data || []);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to fetch departments");
          setDepartments([]);
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
        setError("Failed to fetch departments");
        setDepartments([]);
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [formData.organizationName, organizations]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value);

    // Clear department and employee type when organization changes
    if (name === "organizationName") {
      setFormData(prev => ({
        ...prev,
        departmentName: "",
        employeeType: ""
      }));
    }
    
    // Clear employee type when department changes
    if (name === "departmentName") {
      setFormData(prev => ({
        ...prev,
        employeeType: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError("");
      setDuplicateError("");

      // Validate form data
      let isValid = true;
      for (const key in validationSchema) {
        if (!validateField(key, formData[key])) isValid = false;
      }

      if (!isValid) {
        setError("All fields are required");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        organizationName: formData.organizationName.trim(),
        departmentName: formData.departmentName.trim(),
        employeeType: formData.employeeType.trim(),
         createdBy: user.id,
      };

      console.log("Submitting employee type:", payload);

      const res = await fetch("/api/v1/admin/crm/employeetype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 409) {
          setDuplicateError(data.error || "Employee type already exists for this department.");
          return;
        }
        throw new Error(data.error || "Failed to create employee type");
      }
      
      onSuccess(data.employeeType);
      resetForm();
      onClose();
    } catch (err) {
      console.error("Error creating employee type:", err);
      setError(err.message || "Something went wrong while creating employee type.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      organizationName: "",
      departmentName: "",
      employeeType: ""
    });
    setDepartments([]);
    setDepartments([]);
    setError("");
    setDuplicateError("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submitDisabled = isSubmitting ||
    !formData.organizationName.trim() ||
    !formData.departmentName.trim() ||
    !formData.employeeType.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-4 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create Employee Type
                </h2>
                <p className="text-slate-600 text-sm">
                  Define a new employee category for your organization
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Messages */}
        {(error || duplicateError) && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-red-800">Error</h4>
                <p className="text-sm text-red-700 mt-1">{error || duplicateError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Organization Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Organization Details
                </h3>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Organization <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    onBlur={(e) => handleBlur('organizationName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all appearance-none bg-white ${
                      errors.organizationName ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select an organization</option>
                    {organizations.map((org) => (
                      <option key={org._id} value={org.name}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Employee Type Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Employee Type Configuration
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Department Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="departmentName"
                      value={formData.departmentName}
                      onChange={handleInputChange}
                      onBlur={(e) => handleBlur('departmentName', e.target.value)}
                      disabled={!formData.organizationName || isLoadingDepartments}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all appearance-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed ${
                        errors.departmentName ? 'border-red-500 bg-red-50' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Select a department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept.departmentName}>
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                    {isLoadingDepartments && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {!isLoadingDepartments && (
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    )}
                  </div>
                  {!formData.organizationName && (
                    <p className="text-sm text-slate-500">Please select an organization first</p>
                  )}
                  {formData.organizationName && departments.length === 0 && !isLoadingDepartments && (
                    <p className="text-sm text-slate-500">No departments found for this organization</p>
                  )}
                </div>

                {/* Employee Type Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Employee Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="employeeType"
                    value={formData.employeeType}
                    onChange={handleInputChange}
                    onBlur={(e) => handleBlur('employeeType', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all ${
                      errors.employeeType ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                    placeholder="e.g., Full-time, Contractor, Intern"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Employee Type
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}