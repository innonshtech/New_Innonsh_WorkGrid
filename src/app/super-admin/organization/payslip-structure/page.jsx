"use client";
import { useState, useEffect } from "react";
import {
  Building2,
  User,
  DollarSign,
  Calendar,
  Download,
  Plus,
  Trash2,
  Edit3,
  Save,
  FileText,
  BadgeDollarSign,
  Calculator,
  FolderOpen,
  PlusCircle,
  Copy,
  Star,
  StarIcon,
  AlertCircle,
  Percent,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import toast, { Toaster } from "react-hot-toast";

const PayslipTemplate = () => {
  const [templates, setTemplates] = useState([]);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newEarning, setNewEarning] = useState({
    name: "",
    percentage: 0,
    calculationType: "percentage",
  });
  const [newDeduction, setNewDeduction] = useState({
    name: "",
    percentage: 0,
    calculationType: "percentage",
  });
  const [newField, setNewField] = useState("");
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewTemplate, setIsNewTemplate] = useState(false);

  const { user } = useSession();

  console.log(user);

  // Default template structure with percentages
  const defaultTemplate = {
    id: null,
    name: "New Template",
    organizationName: "TechCorp Inc.",
    organizationLogo: "",
    address: "123 Business Ave, Suite 100\nNew York, NY 10001",
    contact: "HR: (555) 123-4567 | payroll@techcorp.com",
    isDefault: false,
    salaryType: "monthly",
    earnings: [
      // {
      //   name: "Basic Salary",
      //   enabled: true,
      //   editable: false,
      //   calculationType: "fixed",
      //   percentage: 0,
      //   fixedAmount: 0,
      // },
      {
        name: "House Rent Allowance",
        enabled: true,
        editable: true,
        calculationType: "percentage",
        percentage: 40,
        fixedAmount: 0,
      },
      {
        name: "Transport Allowance",
        enabled: true,
        editable: true,
        calculationType: "percentage",
        percentage: 10,
        fixedAmount: 0,
      },
      {
        name: "Medical Allowance",
        enabled: true,
        editable: true,
        calculationType: "percentage",
        percentage: 5,
        fixedAmount: 0,
      },
      {
        name: "Special Allowance",
        enabled: false,
        editable: true,
        calculationType: "percentage",
        percentage: 10,
        fixedAmount: 0,
      },
      {
        name: "Bonus",
        enabled: false,
        editable: true,
        calculationType: "fixed",
        percentage: 0,
        fixedAmount: 0,
      },
    ],
    deductions: [
      {
        name: "Provident Fund",
        enabled: true,
        editable: true,
        calculationType: "percentage",
        percentage: 12,
        fixedAmount: 0,
      },
      {
        name: "Professional Tax",
        enabled: true,
        editable: true,
        calculationType: "fixed",
        percentage: 0,
        fixedAmount: 200,
      },
      {
        name: "Income Tax",
        enabled: true,
        editable: true,
        calculationType: "percentage",
        percentage: 10,
        fixedAmount: 0,
      },
      {
        name: "ESI",
        enabled: false,
        editable: true,
        calculationType: "percentage",
        percentage: 0.75,
        fixedAmount: 0,
      },
      {
        name: "Insurance",
        enabled: false,
        editable: true,
        calculationType: "percentage",
        percentage: 2,
        fixedAmount: 0,
      },
    ],
    additionalFields: [
      { name: "Bank Account Number", enabled: true },
      { name: "PAN Number", enabled: true },
      { name: "UAN Number", enabled: true },
      { name: "Working Days", enabled: true },
    ],
    styling: {
      primaryColor: "#6366f1",
      secondaryColor: "#eef2ff",
      fontFamily: "Inter",
      showWatermark: true,
      showOrganizationLogo: true,
    },
  };

  const sampleEmployee = {
    name: "John Doe",
    employeeId: "EMP-001",
    department: "Engineering",
    designation: "Senior Developer",
    payPeriod: "January 2024",
    paymentDate: "31 Jan 2024",
    bankAccount: "XXXX-XXXX-1234",
    panNumber: "ABCDE1234F",
    uanNumber: "123456789012",
    workingDays: 26,
    totalDays: 31,
    basicSalary: 50000,
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/admin/crm/template");
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setTemplates(data.data);
        const defaultTemplate = data.data.find((t) => t.isDefault);
        setCurrentTemplateId(defaultTemplate?._id || data.data[0]._id);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const currentTemplate = templates.find((t) => t._id === currentTemplateId);

  const saveTemplateToDb = async (templateData) => {
    try {
      setSaving(true);

      const cleanedData = {
        name: templateData.name,
        organizationName: templateData.organizationName,
        organizationLogo: templateData.organizationLogo || "",
        address: templateData.address,
        contact: templateData.contact,
        isDefault: templateData.isDefault || false,
        salaryType: templateData.salaryType || "monthly",
        earnings: templateData.earnings,
        deductions: templateData.deductions,
        additionalFields: templateData.additionalFields,
        styling: templateData.styling,
        createdBy: user.id,
      };

      const response = await fetch("/api/v1/admin/crm/template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        throw new Error("Failed to save template");
      }

      const savedTemplate = await response.json();

      await fetchTemplates();
      setCurrentTemplateId(savedTemplate._id);
      setIsNewTemplate(false);
      toast.success("Template saved successfully!");

      return savedTemplate;
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateTemplateInDb = async (templateId, updates) => {
    try {
      setSaving(true);

      const response = await fetch(`/api/v1/admin/crm/template/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update template");
      }

      const updatedTemplate = await response.json();

      await fetchTemplates();
      toast.success("Template updated successfully!");

      return updatedTemplate;
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplateFromDb = async (templateId) => {
    try {
      const response = await fetch(`/api/v1/admin/crm/template/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      await fetchTemplates();
      toast.success("Template deleted successfully!");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const createNewTemplate = () => {
    const newTemplate = {
      ...defaultTemplate,
      _id: "new-" + Date.now(),
      name: `Template ${templates.length + 1}`,
      organizationName: "New Organization",
      address: "Enter organization address",
      contact: "Enter contact information",
      isDefault: false,
    };
    setTemplates([...templates, newTemplate]);
    setCurrentTemplateId(newTemplate._id);
    setIsNewTemplate(true);
    setShowTemplateManager(false);
  };

  const duplicateTemplate = async (templateId) => {
    const templateToDuplicate = templates.find((t) => t._id === templateId);
    if (templateToDuplicate) {
      const duplicatedTemplate = {
        name: `${templateToDuplicate.name} (Copy)`,
        organizationName: templateToDuplicate.organizationName,
        organizationLogo: templateToDuplicate.organizationLogo,
        address: templateToDuplicate.address,
        contact: templateToDuplicate.contact,
        isDefault: false,
        salaryType: templateToDuplicate.salaryType,
        earnings: templateToDuplicate.earnings,
        deductions: templateToDuplicate.deductions,
        additionalFields: templateToDuplicate.additionalFields,
        styling: templateToDuplicate.styling,
      };

      await saveTemplateToDb(duplicatedTemplate);
      setShowTemplateManager(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (templates.length <= 1) {
      toast.error("You must have at least one template");
      return;
    }

    if (confirm("Are you sure you want to delete this template?")) {
      await deleteTemplateFromDb(templateId);

      if (currentTemplateId === templateId) {
        const remainingTemplates = templates.filter((t) => t._id !== templateId);
        if (remainingTemplates.length > 0) {
          setCurrentTemplateId(remainingTemplates[0]._id);
        }
      }
    }
  };

  const setDefaultTemplate = async (templateId) => {
    try {
      await updateTemplateInDb(templateId, { isDefault: true });
    } catch (error) {
      console.error("Error setting default template:", error);
    }
  };

  const updateCurrentTemplate = (updates) => {
    setTemplates(
      templates.map((template) =>
        template._id === currentTemplateId ? { ...template, ...updates } : template
      )
    );
  };

  const handleSaveChanges = async () => {
    if (!currentTemplate) return;

    if (isNewTemplate) {
      await saveTemplateToDb(currentTemplate);
    } else {
      await updateTemplateInDb(currentTemplateId, currentTemplate);
    }
    setIsEditing(false);
  };

  const toggleEarning = (index) => {
    const updatedEarnings = [...currentTemplate.earnings];
    updatedEarnings[index].enabled = !updatedEarnings[index].enabled;
    updateCurrentTemplate({ earnings: updatedEarnings });
  };

  const updateEarning = (index, field, value) => {
    const updatedEarnings = [...currentTemplate.earnings];
    updatedEarnings[index][field] = value;
    updateCurrentTemplate({ earnings: updatedEarnings });
  };

  const toggleDeduction = (index) => {
    const updatedDeductions = [...currentTemplate.deductions];
    updatedDeductions[index].enabled = !updatedDeductions[index].enabled;
    updateCurrentTemplate({ deductions: updatedDeductions });
  };

  const updateDeduction = (index, field, value) => {
    const updatedDeductions = [...currentTemplate.deductions];
    updatedDeductions[index][field] = value;
    updateCurrentTemplate({ deductions: updatedDeductions });
  };

  const toggleField = (index) => {
    const updatedFields = [...currentTemplate.additionalFields];
    updatedFields[index].enabled = !updatedFields[index].enabled;
    updateCurrentTemplate({ additionalFields: updatedFields });
  };

  const addEarning = () => {
    if (newEarning.name.trim()) {
      updateCurrentTemplate({
        earnings: [
          ...currentTemplate.earnings,
          {
            name: newEarning.name,
            enabled: true,
            editable: true,
            calculationType: newEarning.calculationType,
            percentage: parseFloat(newEarning.percentage) || 0,
            fixedAmount: 0,
          },
        ],
      });
      setNewEarning({ name: "", percentage: 0, calculationType: "percentage" });
    }
  };

  const addDeduction = () => {
    if (newDeduction.name.trim()) {
      updateCurrentTemplate({
        deductions: [
          ...currentTemplate.deductions,
          {
            name: newDeduction.name,
            enabled: true,
            editable: true,
            calculationType: newDeduction.calculationType,
            percentage: parseFloat(newDeduction.percentage) || 0,
            fixedAmount: 0,
          },
        ],
      });
      setNewDeduction({ name: "", percentage: 0, calculationType: "percentage" });
    }
  };

  const addField = () => {
    if (newField.trim()) {
      updateCurrentTemplate({
        additionalFields: [...currentTemplate.additionalFields, { name: newField, enabled: true }],
      });
      setNewField("");
    }
  };

  const removeEarning = (index) => {
    const updatedEarnings = currentTemplate.earnings.filter((_, i) => i !== index);
    updateCurrentTemplate({ earnings: updatedEarnings });
  };

  const removeDeduction = (index) => {
    const updatedDeductions = currentTemplate.deductions.filter((_, i) => i !== index);
    updateCurrentTemplate({ deductions: updatedDeductions });
  };

  const removeField = (index) => {
    const updatedFields = currentTemplate.additionalFields.filter((_, i) => i !== index);
    updateCurrentTemplate({ additionalFields: updatedFields });
  };

  const calculateEarningAmount = (earning) => {
    if (earning.name === "Basic Salary") {
      return currentTemplate.salaryType === "perday"
        ? sampleEmployee.basicSalary * sampleEmployee.workingDays
        : sampleEmployee.basicSalary;
    }

    if (earning.calculationType === "fixed") {
      return earning.fixedAmount || 0;
    }

    if (earning.calculationType === "percentage") {
      const basicSalary = currentTemplate.salaryType === "perday"
        ? sampleEmployee.basicSalary * sampleEmployee.workingDays
        : sampleEmployee.basicSalary;
      return (basicSalary * (earning.percentage || 0)) / 100;
    }

    return 0;
  };

  const calculateDeductionAmount = (deduction) => {
    if (deduction.calculationType === "fixed") {
      return deduction.fixedAmount || 0;
    }

    if (deduction.calculationType === "percentage") {
      const basicSalary = currentTemplate.salaryType === "perday"
        ? sampleEmployee.basicSalary * sampleEmployee.workingDays
        : sampleEmployee.basicSalary;
      return (basicSalary * (deduction.percentage || 0)) / 100;
    }

    return 0;
  };

  const calculateTotalEarnings = () => {
    if (!currentTemplate) return 0;

    return currentTemplate.earnings
      .filter((earning) => earning.enabled)
      .reduce((total, earning) => total + calculateEarningAmount(earning), 0);
  };

  const calculateTotalDeductions = () => {
    if (!currentTemplate) return 0;

    return currentTemplate.deductions
      .filter((deduction) => deduction.enabled)
      .reduce((total, deduction) => total + calculateDeductionAmount(deduction), 0);
  };

  const calculateNetSalary = () => {
    return calculateTotalEarnings() - calculateTotalDeductions();
  };

  const TemplateManagerModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Manage Templates</h2>
          <button
            onClick={() => setShowTemplateManager(false)}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4 mb-6">
          {templates.map((template) => (
            <div
              key={template._id}
              className={`p-4 border rounded-lg flex items-center justify-between ${template._id === currentTemplateId
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200"
                }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDefaultTemplate(template._id)}
                  className="text-indigo-500 hover:text-indigo-600"
                >
                  {template.isDefault ? (
                    <Star className="w-5 h-5 fill-indigo-500" />
                  ) : (
                    <StarIcon className="w-5 h-5" />
                  )}
                </button>
                <div>
                  <h3 className="font-semibold text-slate-900">{template.name}</h3>
                  <p className="text-sm text-slate-600">{template.organizationName}</p>
                  <p className="text-xs text-slate-500 capitalize">
                    Salary Type: {template.salaryType}
                  </p>
                </div>
                {template.isDefault && (
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentTemplateId(template._id);
                    setShowTemplateManager(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-slate-50"
                  title="Open"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>
                <button
                  onClick={() => duplicateTemplate(template._id)}
                  className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                  title="Duplicate"
                >
                  <Copy className="w-5 h-5" />
                </button>
                {!template.isDefault && (
                  <button
                    onClick={() => deleteTemplate(template._id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={createNewTemplate}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            New Template
          </button>
          <button
            onClick={() => setShowTemplateManager(false)}
            className="flex-1 bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-slate-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (!currentTemplate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-indigo-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">No Templates Found</h2>
          <p className="text-slate-600 mb-4">Create your first payslip template to get started</p>
          <button
            onClick={createNewTemplate}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Create Template
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Toaster />
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payslip Template Designer</h1>
          <p className="text-sm text-slate-600">
            Manage multiple payslip templates with percentage-based calculations
          </p>
        </div>

        {/* Template Selection Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
              <select
                value={currentTemplateId}
                onChange={(e) => {
                  setCurrentTemplateId(e.target.value);
                  setIsNewTemplate(false);
                }}
                className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name} {template.isDefault && "★"}
                  </option>
                ))}
              </select>
              <div className="text-sm text-slate-600">
                {currentTemplate.organizationName} •{" "}
                {currentTemplate.salaryType === "monthly" ? "Monthly" : "Per Day"} Salary
              </div>
              {isNewTemplate && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Not Saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* <button
                onClick={() => setShowTemplateManager(true)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FolderOpen className="w-5 h-5" />
                Manage Templates
              </button> */}
              <button
                onClick={createNewTemplate}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                New Template
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-h-[800px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-indigo-600" />
                Template Configuration
              </h2>
              <div className="flex items-center gap-3">
                {isNewTemplate && (
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? "Saving..." : "Create Template"}
                  </button>
                )}
                {!isNewTemplate && (
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleSaveChanges();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    disabled={saving}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-5 h-5" />
                        {saving ? "Saving..." : "Save Changes"}
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-5 h-5" />
                        Edit Template
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={currentTemplate.name}
                  onChange={(e) => updateCurrentTemplate({ name: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Template Name"
                  disabled={!isEditing}
                />
              </div>

              {/* Salary Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Salary Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="salaryType"
                      value="monthly"
                      checked={currentTemplate.salaryType === "monthly"}
                      onChange={(e) => updateCurrentTemplate({ salaryType: e.target.value })}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      disabled={!isEditing}
                    />
                    <span className="text-slate-700">Monthly Salary</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="salaryType"
                      value="perday"
                      checked={currentTemplate.salaryType === "perday"}
                      onChange={(e) => updateCurrentTemplate({ salaryType: e.target.value })}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      disabled={!isEditing}
                    />
                    <span className="text-slate-700">Per Day Salary</span>
                  </label>
                </div>
              </div>

              {/* Organization Details */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Organization Details
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={currentTemplate.organizationName}
                    onChange={(e) => updateCurrentTemplate({ organizationName: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Organization Name"
                    disabled={!isEditing}
                  />
                  <textarea
                    value={currentTemplate.address}
                    onChange={(e) => updateCurrentTemplate({ address: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Organization Address"
                    disabled={!isEditing}
                  />
                  <input
                    type="text"
                    value={currentTemplate.contact}
                    onChange={(e) => updateCurrentTemplate({ contact: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contact Information"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Earnings Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <BadgeDollarSign className="w-5 h-5 text-indigo-600" />
                  Earnings Components
                </h3>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {currentTemplate.earnings.map((earning, index) => (
                    <div
                      key={index}
                      className="p-3 bg-indigo-50 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={earning.enabled}
                          onChange={() => toggleEarning(index)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          disabled={!isEditing}
                        />
                        <span
                          className={
                            earning.enabled ? "text-slate-800 font-medium" : "text-slate-400"
                          }
                        >
                          {earning.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {earning.name !== "Basic Salary" && isEditing && (
                          <>
                            <select
                              value={earning.calculationType}
                              onChange={(e) =>
                                updateEarning(index, "calculationType", e.target.value)
                              }
                              className="text-xs border border-slate-300 rounded px-2 py-1"
                              disabled={!isEditing}
                            >
                              <option value="percentage">%</option>
                              <option value="fixed">₹</option>
                            </select>
                            {earning.calculationType === "percentage" ? (
                              <input
                                type="number"
                                value={earning.percentage}
                                onChange={(e) =>
                                  updateEarning(index, "percentage", parseFloat(e.target.value))
                                }
                                className="w-20 text-xs border border-slate-300 rounded px-2 py-1"
                                placeholder="%"
                                step="0.1"
                                disabled={!isEditing}
                              />
                            ) : (
                              <input
                                type="number"
                                value={earning.fixedAmount}
                                onChange={(e) =>
                                  updateEarning(index, "fixedAmount", parseFloat(e.target.value))
                                }
                                className="w-20 text-xs border border-slate-300 rounded px-2 py-1"
                                placeholder="₹"
                                disabled={!isEditing}
                              />
                            )}
                          </>
                        )}
                        {earning.editable && isEditing && (
                          <button
                            onClick={() => removeEarning(index)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newEarning.name}
                      onChange={(e) =>
                        setNewEarning({ ...newEarning, name: e.target.value })
                      }
                      placeholder="Add custom earning..."
                      className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={newEarning.calculationType}
                      onChange={(e) =>
                        setNewEarning({
                          ...newEarning,
                          calculationType: e.target.value,
                        })
                      }
                      className="border border-slate-300 rounded-lg px-3 py-1"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">₹</option>
                    </select>
                    <input
                      type="number"
                      value={newEarning.percentage}
                      onChange={(e) =>
                        setNewEarning({
                          ...newEarning,
                          percentage: e.target.value,
                        })
                      }
                      placeholder={newEarning.calculationType === "percentage" ? "%" : "₹"}
                      className="w-20 p-3 border border-slate-300 rounded-lg"
                      step="0.1"
                    />
                    <button
                      onClick={addEarning}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Deductions Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  Deductions Components
                </h3>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {currentTemplate.deductions.map((deduction, index) => (
                    <div
                      key={index}
                      className="p-3 bg-indigo-50 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={deduction.enabled}
                          onChange={() => toggleDeduction(index)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          disabled={!isEditing}
                        />
                        <span
                          className={
                            deduction.enabled ? "text-slate-800 font-medium" : "text-slate-400"
                          }
                        >
                          {deduction.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing && (
                          <>
                            <select
                              value={deduction.calculationType}
                              onChange={(e) =>
                                updateDeduction(index, "calculationType", e.target.value)
                              }
                              className="text-xs border border-slate-300 rounded px-2 py-1"
                              disabled={!isEditing}
                            >
                              <option value="percentage">%</option>
                              <option value="fixed">₹</option>
                            </select>
                            {deduction.calculationType === "percentage" ? (
                              <input
                                type="number"
                                value={deduction.percentage}
                                onChange={(e) =>
                                  updateDeduction(index, "percentage", parseFloat(e.target.value))
                                }
                                className="w-20 text-xs border border-slate-300 rounded px-2 py-1"
                                placeholder="%"
                                step="0.1"
                                disabled={!isEditing}
                              />
                            ) : (
                              <input
                                type="number"
                                value={deduction.fixedAmount}
                                onChange={(e) =>
                                  updateDeduction(index, "fixedAmount", parseFloat(e.target.value))
                                }
                                className="w-20 text-xs border border-slate-300 rounded px-2 py-1"
                                placeholder="₹"
                                disabled={!isEditing}
                              />
                            )}
                          </>
                        )}
                        {deduction.editable && isEditing && (
                          <button
                            onClick={() => removeDeduction(index)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDeduction.name}
                      onChange={(e) =>
                        setNewDeduction({ ...newDeduction, name: e.target.value })
                      }
                      placeholder="Add custom deduction..."
                      className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={newDeduction.calculationType}
                      onChange={(e) =>
                        setNewDeduction({
                          ...newDeduction,
                          calculationType: e.target.value,
                        })
                      }
                      className="border border-slate-300 rounded-lg px-3 py-1"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">₹</option>
                    </select>
                    <input
                      type="number"
                      value={newDeduction.percentage}
                      onChange={(e) =>
                        setNewDeduction({
                          ...newDeduction,
                          percentage: e.target.value,
                        })
                      }
                      placeholder={newDeduction.calculationType === "percentage" ? "%" : "₹"}
                      className="w-20 p-3 border border-slate-300 rounded-lg"
                      step="0.1"
                    />
                    <button
                      onClick={addDeduction}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Additional Fields */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Additional Fields
                </h3>
                <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                  {currentTemplate.additionalFields.map((field, index) => (
                    <div
                      key={index}
                      className="p-3 bg-indigo-50 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={field.enabled}
                          onChange={() => toggleField(index)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          disabled={!isEditing}
                        />
                        <span
                          className={field.enabled ? "text-slate-800" : "text-slate-400"}
                        >
                          {field.name}
                        </span>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeField(index)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newField}
                      onChange={(e) => setNewField(e.target.value)}
                      placeholder="Add custom field..."
                      className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onKeyPress={(e) => e.key === "Enter" && addField()}
                    />
                    <button
                      onClick={addField}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payslip Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                Payslip Preview
              </h2>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 max-h-[700px] overflow-y-auto">
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-slate-900 mb-2">
                  {currentTemplate.organizationName}
                </h1>
                <p className="text-sm text-slate-600 whitespace-pre-line">
                  {currentTemplate.address}
                </p>
                <p className="text-sm text-slate-600">{currentTemplate.contact}</p>
                <div className="border-t border-slate-300 my-4"></div>
                <h2 className="text-lg font-semibold text-indigo-600">SALARY SLIP</h2>
                <p className="text-sm text-slate-600 mt-1">
                  ({currentTemplate.salaryType === "monthly" ? "Monthly Salary" : "Per Day Salary"})
                </p>
              </div>

              {/* Employee Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-slate-700">Employee Name:</span>
                  </div>
                  <p className="text-sm">{sampleEmployee.name}</p>
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-slate-700">Employee ID:</span>
                  </div>
                  <p className="text-sm">{sampleEmployee.employeeId}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-slate-700">Pay Period:</span>
                  </div>
                  <p className="text-sm">{sampleEmployee.payPeriod}</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-slate-700">Payment Date:</span>
                  </div>
                  <p className="text-sm">{sampleEmployee.paymentDate}</p>
                </div>
              </div>

              {/* Working Days Info */}
              {currentTemplate.salaryType === "perday" && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-indigo-700">Total Days:</span>{" "}
                      {sampleEmployee.totalDays}
                    </div>
                    <div>
                      <span className="font-medium text-indigo-700">Working Days:</span>{" "}
                      {sampleEmployee.workingDays}
                    </div>
                  </div>
                </div>
              )}

              {/* Earnings and Deductions */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Earnings */}
                <div>
                  <h3 className="font-semibold text-indigo-700 mb-3 border-b border-indigo-300 pb-2">
                    EARNINGS
                  </h3>
                  <div className="space-y-2">
                    {currentTemplate.earnings
                      .filter((earning) => earning.enabled)
                      .map((earning, index) => {
                        const amount = calculateEarningAmount(earning);
                        return (
                          <div
                            key={index}
                            className="flex justify-between text-sm border-b border-slate-200 py-1"
                          >
                            <span className="flex items-center gap-1 text-slate-800">
                              {earning.name}
                              {earning.calculationType === "percentage" &&
                                earning.name !== "Basic Salary" && (
                                  <span className="text-xs text-slate-500">
                                    ({earning.percentage}%)
                                  </span>
                                )}
                              :
                            </span>
                            <span className="font-medium text-slate-800">
                              ₹{amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}
                    <div className="flex justify-between border-t border-indigo-300 pt-2 font-bold text-indigo-700">
                      <span>Total Earnings:</span>
                      <span>
                        ₹{calculateTotalEarnings().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="font-semibold text-indigo-700 mb-3 border-b border-indigo-300 pb-2">
                    DEDUCTIONS
                  </h3>
                  <div className="space-y-2">
                    {currentTemplate.deductions
                      .filter((deduction) => deduction.enabled)
                      .map((deduction, index) => {
                        const amount = calculateDeductionAmount(deduction);
                        return (
                          <div
                            key={index}
                            className="flex justify-between text-sm border-b border-slate-200 py-1"
                          >
                            <span className="flex items-center gap-1 text-slate-800">
                              {deduction.name}
                              {deduction.calculationType === "percentage" && (
                                <span className="text-xs text-slate-500">
                                  ({deduction.percentage}%)
                                </span>
                              )}
                              :
                            </span>
                            <span className="font-medium text-slate-800">
                              ₹{amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}
                    <div className="flex justify-between border-t border-indigo-300 pt-2 font-bold text-indigo-700">
                      <span>Total Deductions:</span>
                      <span>
                        ₹{calculateTotalDeductions().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-indigo-700">NET SALARY:</span>
                  <span className="text-xl font-bold text-indigo-700">
                    ₹{calculateNetSalary().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Additional Fields */}
              <div className="mt-6">
                <h3 className="font-semibold text-indigo-700 mb-3 border-b border-indigo-300 pb-2">
                  ADDITIONAL INFORMATION
                </h3>
                <div className="space-y-2">
                  {currentTemplate.additionalFields
                    .filter((field) => field.enabled)
                    .map((field, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm border-b border-slate-200 py-1"
                      >
                        <span className="text-slate-800">{field.name}:</span>
                        <span className="font-medium text-slate-800">
                          {sampleEmployee[field.name.toLowerCase().replace(" ", "")] || "N/A"}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-6 text-sm text-slate-500">
                <p>
                  This is a computer-generated document and does not require a signature.
                </p>
                <p>Generated on {new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Manager Modal */}
      {showTemplateManager && <TemplateManagerModal />}
    </div>
  );
};

export default PayslipTemplate;