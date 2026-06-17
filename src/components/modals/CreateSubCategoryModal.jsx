// components/modals/CreateSubCategoryModal.jsx
"use client"

import { useState, useEffect } from "react";
import {
  X,
  Save,
  Layers,
  ChevronDown,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useValidation } from "@/hooks/useValidation";

const validationSchema = {
  organizationName: 'required',
  departmentName: 'required',
  employeeType: 'required',
  employeeCategory: 'required',
  employeeSubCategory: 'required',
};

export default function CreateSubCategoryModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  organizations 
}) {
  const [formData, setFormData] = useState({
    organizationName: "",
    departmentName: "",
    employeeType: "",
    employeeCategory: "",
    employeeSubCategory: "",
  });
  const [availableDepts, setAvailableDepts] = useState([]);
  const [availableEmployeeTypes, setAvailableEmployeeTypes] = useState([]);
  const [availableCats, setAvailableCats] = useState([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);
  const [isLoadingEmployeeTypes, setIsLoadingEmployeeTypes] = useState(false);
  const [isLoadingCats, setIsLoadingCats] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [duplicateError, setDuplicateError] = useState("");

  const { errors, validateField, handleBlur, touched, setErrors } = useValidation(formData, validationSchema);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value);

    // Reset dependent fields
    if (name === "organizationName") {
      setFormData(prev => ({
        ...prev,
        departmentName: "",
        employeeType: "",
        employeeCategory: "",
        employeeSubCategory: ""
      }));
      setAvailableDepts([]);
      setAvailableEmployeeTypes([]);
      setAvailableCats([]);
    } else if (name === "departmentName") {
      setFormData(prev => ({
        ...prev,
        employeeType: "",
        employeeCategory: "",
        employeeSubCategory: ""
      }));
      setAvailableEmployeeTypes([]);
      setAvailableCats([]);
    } else if (name === "employeeType") {
      setFormData(prev => ({
        ...prev,
        employeeCategory: "",
        employeeSubCategory: ""
      }));
      setAvailableCats([]);
    }
  };

  // Load departments when organization changes
  useEffect(() => {
    if (formData.organizationName) {
      loadDepartments(formData.organizationName);
    } else {
      setAvailableDepts([]);
    }
  }, [formData.organizationName]);

  // Load employee types when department changes
  useEffect(() => {
    if (formData.organizationName && formData.departmentName) {
      loadEmployeeTypes(formData.organizationName, formData.departmentName);
    } else {
      setAvailableEmployeeTypes([]);
    }
  }, [formData.organizationName, formData.departmentName]);

  // Load categories when employee type changes
  useEffect(() => {
    if (formData.organizationName && formData.departmentName && formData.employeeType) {
      loadCategories(formData.organizationName, formData.departmentName, formData.employeeType);
    } else {
      setAvailableCats([]);
    }
  }, [formData.organizationName, formData.departmentName, formData.employeeType]);

  async function loadDepartments(orgName) {
    try {
      setIsLoadingDepts(true);
      setError("");
      
      const selectedOrg = organizations.find(org => org.name === orgName);
      if (!selectedOrg) {
        setAvailableDepts([]);
        return;
      }

      const response = await fetch(`/api/v1/admin/crm/departments?organizationId=${selectedOrg._id}&limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        setAvailableDepts(data.data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch departments");
        setAvailableDepts([]);
      }
    } catch (err) {
      console.error("Error loading departments:", err);
      setError("Failed to fetch departments");
      setAvailableDepts([]);
    } finally {
      setIsLoadingDepts(false);
    }
  }

  async function loadEmployeeTypes(orgName, deptName) {
    try {
      setIsLoadingEmployeeTypes(true);
      setError("");

      const selectedOrg = organizations.find(org => org.name === orgName);
      if (!selectedOrg) {
        setAvailableEmployeeTypes([]);
        return;
      }

      const selectedDept = availableDepts.find(dept => dept.departmentName === deptName);
      if (!selectedDept) {
        setAvailableEmployeeTypes([]);
        return;
      }

      const response = await fetch(
        `/api/v1/admin/crm/employeetype?organizationId=${selectedOrg._id}&departmentId=${selectedDept._id}&limit=1000`
      );
      
      if (response.ok) {
        const data = await response.json();
        const employeeTypes = [
          ...new Set(data.data.map(item => item.employeeType).filter(Boolean))
        ].sort();
        setAvailableEmployeeTypes(employeeTypes);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch employee types");
        setAvailableEmployeeTypes([]);
      }
    } catch (err) {
      console.error("Error loading employee types:", err);
      setError("Failed to fetch employee types");
      setAvailableEmployeeTypes([]);
    } finally {
      setIsLoadingEmployeeTypes(false);
    }
  }

  async function loadCategories(orgName, deptName, empType) {
    try {
      setIsLoadingCats(true);
      setError("");

      const selectedOrg = organizations.find(org => org.name === orgName);
      if (!selectedOrg) {
        setAvailableCats([]);
        return;
      }

      const selectedDept = availableDepts.find(dept => dept.departmentName === deptName);
      if (!selectedDept) {
        setAvailableCats([]);
        return;
      }

      // First get the employee type ID
      const empTypeResponse = await fetch(
        `/api/v1/admin/crm/employeetype?organizationId=${selectedOrg._id}&departmentId=${selectedDept._id}&limit=1000`
      );
      
      if (!empTypeResponse.ok) {
        setAvailableCats([]);
        return;
      }

      const empTypeData = await empTypeResponse.json();
      const employeeTypeDoc = empTypeData.data.find(item => item.employeeType === empType);
      
      if (!employeeTypeDoc) {
        setAvailableCats([]);
        return;
      }

      // Now fetch categories for this employee type
      const response = await fetch(
        `/api/v1/admin/crm/employeecategory?organizationId=${selectedOrg._id}&departmentId=${selectedDept._id}&employeeTypeId=${employeeTypeDoc._id}&limit=1000`
      );
      
      if (response.ok) {
        const data = await response.json();
        const categories = [
          ...new Set(data.data.map(item => item.employeeCategory).filter(Boolean))
        ].sort();
        setAvailableCats(categories);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch categories");
        setAvailableCats([]);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      setError("Failed to fetch categories");
      setAvailableCats([]);
    } finally {
      setIsLoadingCats(false);
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError("");

      setDuplicateError("");

      // Validate all fields
      let isValid = true;
      for (const key in validationSchema) {
        if (!validateField(key, formData[key])) isValid = false;
      }

      if (!isValid) {
        setError("Please fill in all required fields.");
        setIsSubmitting(false);
        return;
      }
      
      const res = await fetch("/api/v1/admin/crm/employeesubcategory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 409) {
          setDuplicateError(data.error || "Sub category already exists for this category.");
          return;
        }
        throw new Error(data.error || "Failed to create employee sub category");
      }
      
      onSuccess();
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong while creating employee sub category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      organizationName: "",
      departmentName: "",
      employeeType: "",
      employeeCategory: "",
      employeeSubCategory: "",
    });
    setAvailableDepts([]);
    setAvailableEmployeeTypes([]);
    setAvailableCats([]);
    setError("");
    setDuplicateError("");
    setErrors({});
  };

  const submitDisabled = isSubmitting ||
    !formData.organizationName ||
    !formData.departmentName ||
    !formData.employeeType ||
    !formData.employeeCategory ||
    !formData.employeeSubCategory.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-4 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-500 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Sub Category
                </h2>
                <p className="text-slate-600 text-sm">
                  Add a sub category to an existing employee category
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
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
        <div className="p-6 space-y-6">
          {/* Organization Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
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
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white ${
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

          {/* Department & Employee Type */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-slate-900">
                Department & Employee Type
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
                    disabled={!formData.organizationName || isLoadingDepts}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed ${
                      errors.departmentName ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select department</option>
                    {availableDepts.map((dept) => (
                      <option key={dept._id} value={dept.departmentName}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                  {isLoadingDepts ? (
                    <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                  ) : (
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Employee Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="employeeType"
                    value={formData.employeeType}
                    onChange={handleInputChange}
                    onBlur={(e) => handleBlur('employeeType', e.target.value)}
                    disabled={!formData.departmentName || isLoadingEmployeeTypes}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed ${
                      errors.employeeType ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select employee type</option>
                    {availableEmployeeTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {isLoadingEmployeeTypes ? (
                    <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                  ) : (
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-slate-900">
                Category Selection
              </h3>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Employee Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="employeeCategory"
                  value={formData.employeeCategory}
                  onChange={handleInputChange}
                  onBlur={(e) => handleBlur('employeeCategory', e.target.value)}
                  disabled={!formData.employeeType || isLoadingCats}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed ${
                    errors.employeeCategory ? 'border-red-500 bg-red-50' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select category</option>
                  {availableCats.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {isLoadingCats ? (
                  <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                ) : (
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                )}
              </div>
              {!formData.employeeType && (
                <p className="text-xs text-slate-500">Please select employee type first</p>
              )}
              {formData.employeeType && availableCats.length === 0 && !isLoadingCats && (
                <p className="text-xs text-slate-500">No categories found for this employee type</p>
              )}
            </div>
          </div>

          {/* Sub Category Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-slate-900">
                Sub Category Details
              </h3>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Employee Sub Category <span className="text-red-500">*</span>
              </label>
              <input
                name="employeeSubCategory"
                value={formData.employeeSubCategory}
                onChange={handleInputChange}
                onBlur={(e) => handleBlur('employeeSubCategory', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.employeeSubCategory ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="e.g., Senior Developer, Junior Analyst"
              />
              <p className="text-xs text-slate-500">
                New sub category name
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitDisabled}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Sub Category
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}