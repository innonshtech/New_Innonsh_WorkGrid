"use client"

import { useState, useEffect } from "react";
import {
  Plus, Edit2, Trash2, Search, RefreshCw, FilterX, AlertCircle, Users, Tag, Layers,
  ChevronDown, ChevronUp, Building
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EnterprisePageHeader } from "@/components/ui/enterprise/EnterprisePageHeader";
import { EnterpriseSectionCard } from "@/components/ui/enterprise/EnterpriseSectionCard";
import { EnterpriseButton } from "@/components/ui/enterprise/EnterpriseButton";
import { EnterpriseEmptyState } from "@/components/ui/enterprise/EnterpriseEmptyState";
import { EnterpriseIconContainer } from "@/components/ui/enterprise/EnterpriseIconContainer";

import CreateEmployeeTypeModal from "@/components/modals/CreateEmployeeTypeModal";
import CreateCategoryModal from "@/components/modals/CreateCategoryModal";
import CreateSubCategoryModal from "@/components/modals/CreateSubCategoryModal";
import EditCategoryModal from "@/components/modals/EditCategoryModal";
import EditEmployeeTypeModal from "@/components/modals/EditEmployeeTypeModal";
import DocumentAdd from "@/components/modals/DocumentsAdd";

export default function EmployeeTypesPage() {
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDocumentsAddModal, setShowDocumentsAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showEditTypeModal, setShowEditTypeModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const [expandedTypes, setExpandedTypes] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  async function fetchOrganizations() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "100");
      params.set("status", "Active");
      const res = await fetch(`/api/v1/admin/crm/organizations?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setOrganizations(data.data || []);
        if (!data.data || data.data.length === 0) {
          setLoading(false);
        }
      } else {
        setError(data.message || "Failed to fetch organizations");
        setLoading(false);
      }
    } catch (err) {
      console.error("Organizations fetch error:", err);
      setError("Network error while fetching organizations");
      setLoading(false);
    }
  }

  async function fetchDepartments(organizationId) {
    if (!organizationId) {
      setDepartments([]);
      return;
    }
    try {
      const response = await fetch(`/api/v1/admin/crm/departments?organizationId=${organizationId}&limit=100`);
      const data = await response.json();
      if (response.ok) {
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.error("Departments fetch error:", err);
    }
  }

  async function fetchEmployeeTypes(organizationId, departmentId) {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.set("organizationId", organizationId);
      if (departmentId) params.set("departmentId", departmentId);
      params.set("limit", "1000");
      const res = await fetch(`/api/v1/admin/crm/employeetype?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setEmployeeTypes(data.data || []);
      }
    } catch (err) {
      console.error("Employee types fetch error:", err);
    }
  }

  async function fetchCategories(organizationId, departmentId) {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.set("organizationId", organizationId);
      if (departmentId) params.set("departmentId", departmentId);
      params.set("limit", "1000");
      const res = await fetch(`/api/v1/admin/crm/employeecategory?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error("Categories fetch error:", err);
    }
  }

  async function fetchSubCategories(organizationId, departmentId) {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.set("organizationId", organizationId);
      if (departmentId) params.set("departmentId", departmentId);
      params.set("limit", "1000");
      const res = await fetch(`/api/v1/admin/crm/employeesubcategory?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setSubCategories(data.data || []);
      }
    } catch (err) {
      console.error("Sub-categories fetch error:", err);
    }
  }

  async function fetchAllData() {
    try {
      if (employeeTypes.length === 0 && categories.length === 0) {
        setLoading(true);
      }
      setError("");
      const selectedOrg = organizations.find(org => org.name === selectedOrganization);
      const orgId = selectedOrg?.id || selectedOrg?._id || "";
      const selectedDept = departments.find(dept => dept.departmentName === selectedDepartment);
      const deptId = selectedDept?.id || selectedDept?._id || "";
      await Promise.all([
        fetchEmployeeTypes(orgId, deptId),
        fetchCategories(orgId, deptId),
        fetchSubCategories(orgId, deptId)
      ]);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (organizations.length === 1 && !selectedOrganization) {
      setSelectedOrganization(organizations[0].name);
    }
    if (selectedOrganization) {
      const selectedOrg = organizations.find(org => org.name === selectedOrganization);
      if (selectedOrg) {
        fetchDepartments(selectedOrg.id || selectedOrg._id);
      }
    } else {
      setDepartments([]);
      setSelectedDepartment("");
    }
  }, [selectedOrganization, organizations]);

  useEffect(() => {
    fetchAllData();
  }, [selectedOrganization, selectedDepartment, organizations]);

  const handleModalSuccess = () => {
    fetchAllData();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedOrganization("");
    setSelectedDepartment("");
  };

  const refreshData = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const toggleTypeExpand = (typeId) => {
    setExpandedTypes(prev => ({ ...prev, [typeId]: !prev[typeId] }));
  };

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowEditCategoryModal(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/v1/admin/crm/employeecategory/${categoryId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete category");
      }
      fetchAllData();
    } catch (err) {
      setError(err.message || "Failed to delete category");
    }
  };

  const handleDeleteType = async (typeId) => {
    if (!confirm("Are you sure you want to delete this employee type? This will also delete all associated categories and sub-categories.")) return;
    try {
      const res = await fetch(`/api/v1/admin/crm/employeetype/${typeId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete employee type");
      }
      fetchAllData();
    } catch (err) {
      setError(err.message || "Failed to delete employee type");
    }
  };

  const buildHierarchy = () => {
    const hierarchy = [];
    employeeTypes.forEach(type => {
      const typeId = type.id || type._id;
      const typeMongoId = type.mongoId;
      const typeCategories = categories.filter(cat => {
        const ref = cat.employeeTypeId?.id || cat.employeeTypeId?._id || cat.employeeTypeId;
        return ref === typeId || (typeMongoId && ref === typeMongoId);
      });
      const categoriesWithSubs = typeCategories.map(category => {
        const catId = category.id || category._id;
        const catMongoId = category.mongoId;
        const categorySubs = subCategories.filter(sub => {
          const ref = sub.employeeCategoryId?.id || sub.employeeCategoryId?._id || sub.employeeCategoryId;
          return ref === catId || (catMongoId && ref === catMongoId);
        });
        return { ...category, subCategories: categorySubs };
      });
      hierarchy.push({ ...type, categories: categoriesWithSubs });
    });
    return hierarchy;
  };

  const hierarchy = buildHierarchy();

  const filteredHierarchy = hierarchy.filter(type => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    if (type.employeeType.toLowerCase().includes(searchLower)) return true;
    const hasMatchingCategory = type.categories.some(cat => cat.employeeCategory.toLowerCase().includes(searchLower));
    if (hasMatchingCategory) return true;
    const hasMatchingSubCategory = type.categories.some(cat =>
      cat.subCategories.some(sub => sub.employeeSubCategory.toLowerCase().includes(searchLower))
    );
    return hasMatchingSubCategory;
  });

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      <EnterprisePageHeader 
        title="Employee Hierarchy"
        subtitle="Manage employee types, categories & sub-categories"
        icon={Users}
        actions={
          <EnterpriseButton icon={Plus} onClick={() => setShowCreateModal(true)}>
            Add Employee Type
          </EnterpriseButton>
        }
      />

      <EnterpriseSectionCard>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="col-span-1 md:col-span-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search types, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 transition-all"
              />
            </div>
          </div>
          {organizations.length > 1 && (
            <div className="col-span-1 md:col-span-3">
              <select
                value={selectedOrganization}
                onChange={(e) => {
                  setSelectedOrganization(e.target.value);
                  setSelectedDepartment("");
                }}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 transition-all"
              >
                <option value="">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org.id || org._id} value={org.name}>{org.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="col-span-1 md:col-span-3">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={!selectedOrganization}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 transition-all disabled:opacity-50"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id || dept._id} value={dept.departmentName}>{dept.departmentName}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-2">
            {(searchTerm || selectedOrganization || selectedDepartment) && (
              <EnterpriseButton variant="secondary" icon={FilterX} onClick={clearFilters}>
                Clear
              </EnterpriseButton>
            )}
            <EnterpriseButton variant="secondary" icon={RefreshCw} onClick={refreshData} disabled={refreshing}>
              Refresh
            </EnterpriseButton>
          </div>
        </div>
      </EnterpriseSectionCard>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800">Error</h4>
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        </div>
      )}

      {filteredHierarchy.length === 0 ? (
        <EnterpriseEmptyState 
          icon={Users}
          title="No employee hierarchy found"
          description={searchTerm || selectedOrganization || selectedDepartment ? "Try adjusting your search or filters" : "Get started by creating your first employee type"}
          action={
            <EnterpriseButton icon={Plus} onClick={() => setShowCreateModal(true)}>
              Create Employee Type
            </EnterpriseButton>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredHierarchy.map((type) => {
            const typeId = type.id || type._id;
            return (
            <div key={typeId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover: transition-all">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <EnterpriseButton variant="ghost" size="sm" onClick={() => toggleTypeExpand(typeId)} icon={expandedTypes[typeId] ? ChevronUp : ChevronDown} />
                  <div className="flex items-center gap-3">
                    <EnterpriseIconContainer icon={Users} color="indigo" size="md" />
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{type.employeeType}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Building className="w-3 h-3" /> {type.organizationId?.name || "N/A"}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold text-slate-400">{type.departmentId?.departmentName || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pr-2">
                  <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                    {type.categories.length} {type.categories.length === 1 ? 'category' : 'categories'}
                  </span>
                  <EnterpriseButton variant="ghost" size="sm" icon={Edit2} onClick={() => { setSelectedType(type); setShowEditTypeModal(true); }} />
                  <EnterpriseButton variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" icon={Trash2} onClick={() => handleDeleteType(typeId)} />
                </div>
              </div>

              {expandedTypes[typeId] && type.categories.length > 0 && (
                <div className="p-6 bg-white space-y-4">
                  {type.categories.map((category) => {
                    const catId = category.id || category._id;
                    return (
                    <div key={catId} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <EnterpriseButton variant="ghost" size="sm" onClick={() => toggleCategoryExpand(catId)} icon={expandedCategories[catId] ? ChevronUp : ChevronDown} />
                          <EnterpriseIconContainer icon={Tag} color="emerald" size="sm" />
                          <h4 className="font-bold text-slate-800 text-sm">{category.employeeCategory}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 mr-2">
                            {category.subCategories.length} sub-{category.subCategories.length === 1 ? 'category' : 'categories'}
                          </span>
                          <EnterpriseButton variant="ghost" size="sm" icon={Edit2} onClick={() => handleEditCategory(category)} />
                          <EnterpriseButton variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" icon={Trash2} onClick={() => handleDeleteCategory(catId)} />
                        </div>
                      </div>

                      {expandedCategories[catId] && category.subCategories.length > 0 && (
                        <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {category.subCategories.map((sub) => {
                            const subId = sub.id || sub._id;
                            return (
                            <div key={subId} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors">
                              <div className="flex items-center gap-3">
                                <Layers className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-bold text-slate-700">{sub.employeeSubCategory}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                <EnterpriseButton variant="ghost" size="sm" icon={Edit2} />
                                <EnterpriseButton variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" icon={Trash2} />
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <DocumentAdd isOpen={showDocumentsAddModal} onClose={() => setShowDocumentsAddModal(false)} onSuccess={handleModalSuccess} />
      <CreateEmployeeTypeModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={handleModalSuccess} organizations={organizations} />
      <CreateCategoryModal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} onSuccess={handleModalSuccess} organizations={organizations} />
      <CreateSubCategoryModal isOpen={showSubCategoryModal} onClose={() => setShowSubCategoryModal(false)} onSuccess={handleModalSuccess} organizations={organizations} />
      <EditCategoryModal isOpen={showEditCategoryModal} onClose={() => { setShowEditCategoryModal(false); setSelectedCategory(null); }} onSuccess={handleModalSuccess} organizations={organizations} category={selectedCategory} />
      <EditEmployeeTypeModal isOpen={showEditTypeModal} onClose={() => { setShowEditTypeModal(false); setSelectedType(null); }} onSuccess={handleModalSuccess} organizations={organizations} employeeTypeData={selectedType} />
    </div>
  );
}