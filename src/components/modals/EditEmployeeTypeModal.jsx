"use client"

import { useState, useEffect } from "react";
import {
  X,
  Save,
  Users,
  ChevronDown,
  AlertCircle,
  Building,
} from "lucide-react";
import { useValidation } from "@/hooks/useValidation";

const validationSchema = {
  organizationName: 'required',
  departmentName: 'required',
  employeeType: 'required',
};

export default function EditEmployeeTypeModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  organizations,
  employeeTypeData 
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
  
  const { errors, validateField, handleBlur, touched, setErrors } = useValidation(formData, validationSchema);

  // Initial load of data
  useEffect(() => {
    if (employeeTypeData) {
      setFormData({
        organizationName: employeeTypeData.organizationId?.name || "",
        departmentName: employeeTypeData.departmentId?.departmentName || "",
        employeeType: employeeTypeData.employeeType || "",
      });
    }
  }, [employeeTypeData]);

  // Fetch departments when organization changes or on initial load if org is present
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!formData.organizationName) {
        setDepartments([]);
        return;
      }

      // Avoid refetching if departments are already loaded for this org (optimization)
      // But for simplicity and correctness in edit mode, we'll fetch.
      
      try {
        setIsLoadingDepartments(true);
        setError("");
        
        const selectedOrg = organizations.find(org => org.name === formData.organizationName);
        
        if (!selectedOrg) {
          setDepartments([]);
          return;
        }

        const response = await fetch(`/api/v1/admin/crm/departments?organizationId=${selectedOrg._id}&limit=100`);
        
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.data || []);
        } else {
          setDepartments([]);
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
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

    // Dependent field logic
    if (name === "organizationName") {
      setFormData(prev => ({
        ...prev,
        departmentName: "",
        employeeType: prev.employeeType // Keep current type if just Org changed (though unlikely user workflow)
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
      };

      const res = await fetch(`/api/v1/admin/crm/employeetype/${employeeTypeData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 409) {
          setDuplicateError(data.error || "Employee type already exists for this department.");
          return;
        }
        throw new Error(data.error || "Failed to update employee type");
      }
      
      onSuccess(data.employeeType);
      handleClose();
    } catch (err) {
      console.error("Error updating employee type:", err);
      setError(err.message || "Something went wrong while updating employee type.");
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
                  Edit Employee Type
                </h2>
                <p className="text-slate-600 text-sm">
                  Update employee type details
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
                 <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                   <Building className="w-4 h-4 text-slate-400" />
                 </div>
                  <select
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    onBlur={(e) => handleBlur('organizationName', e.target.value)}
                    className={`w-full pl-11 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all appearance-none bg-white ${
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Employee Type
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
