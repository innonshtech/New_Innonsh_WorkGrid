"use client"

import { useState, useEffect, useRef } from "react";
import {
  X,
  Save,
  Tag,
  ChevronDown,
  AlertCircle,
  Loader2,
  FileText,
  Search,
  Check,
  XCircle,
  Building,
  Users,
  Folder,
  File,
} from "lucide-react";

import { useValidation } from "@/hooks/useValidation";

const validationSchema = {
  organizationName: 'required',
  departmentName: 'required',
  employeeType: 'required',
  employeeCategory: 'required',
};

export default function EditCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  organizations,
  category,
}) {
  const [formData, setFormData] = useState({
    organizationName: "",
    departmentName: "",
    employeeType: "",
    employeeCategory: "",
    supportedDocuments: [],
  });
  const [availableDepts, setAvailableDepts] = useState([]);
  const [availableEmployeeTypes, setAvailableEmployeeTypes] = useState([]);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);
  const [isLoadingEmployeeTypes, setIsLoadingEmployeeTypes] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [duplicateError, setDuplicateError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { errors, validateField, handleBlur, touched, setErrors } = useValidation(formData, validationSchema);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter documents based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDocuments(availableDocuments);
    } else {
      const filtered = availableDocuments.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [searchQuery, availableDocuments]);

  // Initialize form with category data
  useEffect(() => {
    if (category) {
      setFormData({
        organizationName: category.organizationId?.name || "",
        departmentName: category.departmentId?.departmentName || "",
        employeeType: category.employeeTypeId?.employeeType || "",
        employeeCategory: category.employeeCategory || "",
        supportedDocuments: category.supportedDocuments?.map(doc => doc._id) || [],
      });
    }
  }, [category]);

  // Load departments when organization is set
  useEffect(() => {
    if (formData.organizationName) {
      loadDepartments(formData.organizationName);
    } else {
      setAvailableDepts([]);
      // Only clear dependent fields if we are NOT in the initial load phase (simplification: if user changes org)
      // Actually, if organizationName changes, we should clear dependents. 
      // But on initial load, we don't want to clear them.
    }
  }, [formData.organizationName]);

  // Load employee types when department is set
  useEffect(() => {
    if (formData.organizationName && formData.departmentName && availableDepts.length > 0) {
      loadEmployeeTypes(formData.organizationName, formData.departmentName);
    } else {
      setAvailableEmployeeTypes([]);
    }
  }, [formData.organizationName, formData.departmentName, availableDepts]);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value);
    
    // Reset dependent fields only on user interaction (not initial load)
    if (name === "organizationName") {
      setFormData(prev => ({
        ...prev,
        departmentName: "",
        employeeType: "",
        employeeCategory: prev.employeeCategory, // Keep category name
        supportedDocuments: [],
      }));
      setAvailableDepts([]);
      setAvailableEmployeeTypes([]);
    } else if (name === "departmentName") {
      setFormData(prev => ({
        ...prev,
        employeeType: "",
        employeeCategory: prev.employeeCategory,
        supportedDocuments: [],
      }));
      setAvailableEmployeeTypes([]);
    }
  };

  // Enhanced document selection handlers
  const toggleDocument = (docId) => {
    setFormData(prev => {
      if (prev.supportedDocuments.includes(docId)) {
        return {
          ...prev,
          supportedDocuments: prev.supportedDocuments.filter(id => id !== docId)
        };
      } else {
        return {
          ...prev,
          supportedDocuments: [...prev.supportedDocuments, docId]
        };
      }
    });
  };

  const removeDocument = (docId) => {
    setFormData(prev => ({
      ...prev,
      supportedDocuments: prev.supportedDocuments.filter(id => id !== docId)
    }));
  };

  const getSelectedDocumentNames = () => {
    return formData.supportedDocuments.map(docId => {
      const doc = availableDocuments.find(d => d._id === docId);
      return doc ? doc.name : docId; // Fallback to ID if not found
    });
  };

  const clearAllDocuments = () => {
    setFormData(prev => ({ ...prev, supportedDocuments: [] }));
  };

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
        const dept = data.data.filter((dept) => dept.organizationId === selectedOrg._id);
        setAvailableDepts(dept || []);
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
        // This might happen if depts are not loaded yet.
        console.warn("Department not found in availableDepts:", deptName);
        setAvailableEmployeeTypes([]);
        return;
      }
      const response = await fetch(
        `/api/v1/admin/crm/employeetype?organizationId=${selectedOrg._id}&departmentId=${selectedDept._id}&limit=1000`
      );
      if (response.ok) {
        const data = await response.json();
        
        if (!data.data || !Array.isArray(data.data)) {
          console.warn("Invalid data format for employee types:", data);
          setAvailableEmployeeTypes([]);
          return;
        }
        
        const employeeTypes = [
          ...new Set(
            data.data.map(item => item.employeeType).filter(Boolean)
          )
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

  async function loadDocuments() {
    try {
      setIsLoadingDocuments(true);
      setError("");
      const response = await fetch(`/api/v1/admin/crm/documents?limit=1000`);
      if (response.ok) {
        const data = await response.json();
        
        // Add metadata
        const enhancedDocs = (data.data || []).map(doc => ({
          ...doc,
          category: doc.category || "Uncategorized",
          isMandatory: doc.isMandatory || false,
          fileType: doc.fileType || "document"
        }));
        
        setAvailableDocuments(enhancedDocs);
        setFilteredDocuments(enhancedDocs);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch documents");
        setAvailableDocuments([]);
      }
    } catch (err) {
      console.error("Error loading documents:", err);
      setError("Failed to fetch documents");
      setAvailableDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
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
      
      const res = await fetch(`/api/v1/admin/crm/employeecategory/${category._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setDuplicateError(data.error || "Category already exists for this organization and department.");
          return;
        }
        throw new Error(data.error || "Failed to update employee category");
      }
      onSuccess();
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong while updating employee category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    // We don't fully reset to empty here to avoid flickering if modal is kept open, 
    // but typically onClose handles the unmount/remount or parent state clearing.
    // For safety:
    setFormData({
      organizationName: "",
      departmentName: "",
      employeeType: "",
      employeeCategory: "",
      supportedDocuments: [],
    });
    setAvailableDepts([]);
    setAvailableEmployeeTypes([]);
    setSearchQuery("");
    setIsDropdownOpen(false);
    setError("");
    setDuplicateError("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submitDisabled = isSubmitting ||
    !formData.organizationName ||
    !formData.departmentName ||
    !formData.employeeType ||
    !formData.employeeCategory.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-4 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Category
                </h2>
                <p className="text-slate-600 text-sm">
                  Update employee category details
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
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
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
                  className="w-full pl-11 pr-10 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all appearance-none bg-white"
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
          
          {/* Department Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-slate-900">
                Department Selection
              </h3>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Department <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                 <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Folder className="w-4 h-4 text-slate-400" />
                 </div>
                <select
                  name="departmentName"
                  value={formData.departmentName}
                  onChange={handleInputChange}
                  disabled={!formData.organizationName || isLoadingDepts}
                  className="w-full pl-11 pr-10 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all appearance-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select a department</option>
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
          </div>
          
          {/* Category Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-slate-900">
                Category Configuration
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Employee Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <select
                    name="employeeType"
                    value={formData.employeeType}
                    onChange={handleInputChange}
                    disabled={!formData.departmentName || isLoadingEmployeeTypes}
                    className="w-full pl-11 pr-10 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all appearance-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
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
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Employee Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Tag className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    name="employeeCategory"
                    value={formData.employeeCategory}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="e.g., Senior Developer, Team Lead"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Update category name
                </p>
              </div>
            </div>
          </div>
          
          {/* Enhanced Document Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Supported Documents
                </h3>
              </div>
              {formData.supportedDocuments.length > 0 && (
                <button
                  onClick={clearAllDocuments}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            {/* Selected Documents Preview */}
            {formData.supportedDocuments.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Selected Documents ({formData.supportedDocuments.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getSelectedDocumentNames().map((docName, index) => {
                    const docId = formData.supportedDocuments[index];
                    return (
                      <div
                        key={docId}
                        className="inline-flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-1.5 hover:border-green-300 transition-colors"
                      >
                        <FileText className="w-3 h-3 text-green-600" />
                        <span className="text-sm text-slate-800">{docName}</span>
                        <button
                          onClick={() => removeDocument(docId)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Document Search and Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Select Documents <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              
              <div className="relative" ref={dropdownRef}>
                {/* Search and Dropdown Trigger */}
                <div 
                  className="flex items-center gap-2 px-4 py-3 border border-slate-300 rounded-xl cursor-pointer hover:border-slate-400 transition-colors"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent outline-none placeholder-slate-400"
                  />
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Document Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl max-h-80 overflow-y-auto">
                    {/* Loading State */}
                    {isLoadingDocuments ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                        <span className="ml-2 text-slate-600">Loading documents...</span>
                      </div>
                    ) : filteredDocuments.length === 0 ? (
                      <div className="p-6 text-center text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p>No documents found</p>
                        {searchQuery && (
                          <p className="text-sm mt-1">Try a different search term</p>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {filteredDocuments.map((doc) => {
                          const isSelected = formData.supportedDocuments.includes(doc._id);
                          return (
                            <div
                              key={doc._id}
                              className={`flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                                isSelected ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                              }`}
                              onClick={() => toggleDocument(doc._id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 border rounded flex items-center justify-center mt-0.5 ${
                                  isSelected 
                                    ? 'bg-green-500 border-green-500' 
                                    : 'border-slate-300'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-900">
                                      {doc.name}
                                    </span>
                                    {doc.isMandatory && (
                                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                  {doc.description && (
                                    <p className="text-sm text-slate-600 mt-1">
                                      {doc.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    {doc.category && (
                                      <span className="inline-block text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                        {doc.category}
                                      </span>
                                    )}
                                    {doc.fileType && (
                                      <span className="inline-block text-xs text-blue-600 bg-slate-50 px-2 py-0.5 rounded">
                                        {doc.fileType}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Help Text */}
              <div className="flex flex-col gap-1">
                <p className="text-xs text-slate-500">
                  Select documents that are required for this employee category
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Click to select/deselect
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-100 rounded-full"></div>
                    <span className="text-red-800 font-medium">Required</span> documents are mandatory
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
        {/* Form Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 sticky bottom-0 bg-white">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitDisabled}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Category
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}