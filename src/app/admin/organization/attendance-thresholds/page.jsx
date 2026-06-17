'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Settings, AlertTriangle, Building, Users,
  Save, X, Loader2, RefreshCw, CheckCircle, AlertCircle,
  BarChart3, TrendingUp, Package, Minus
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import toast, { Toaster } from 'react-hot-toast';

export default function AttendanceThresholds() {
  const [thresholds, setThresholds] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  // Cache categories for each organization to avoid repeated fetches
  const [categoriesCache, setCategoriesCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  const [formData, setFormData] = useState({
    criteria: [
      { organizationId: '', categoryId: '', subType: '' } // Initial empty row
    ],
    threshold: '',
    isActive: true
  });

  const [departmentsCache, setDepartmentsCache] = useState({});

  useEffect(() => {
    fetchThresholds();
    fetchOrganizations();
  }, []);

  const fetchThresholds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/payroll/attendance-thresholds');
      const data = await response.json();

      if (data.success) {
        setThresholds(data.thresholds);
      } else {
        toast.error('Failed to fetch thresholds');
      }
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      toast.error('Error loading thresholds');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch('/api/v1/admin/crm/organizations?limit=1000');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch organizations');
      }
      const orgsList = data.data || data.organizations || [];
      const organizationOptions = orgsList.map(org => ({
        value: org._id,
        label: org.name,
        orgId: org.orgId
      }));

      setOrganizations(organizationOptions);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchDepartments = async (organizationId) => {
    if (departmentsCache[organizationId]) return departmentsCache[organizationId];

    try {
      if (!organizationId) return [];

      const params = new URLSearchParams();
      params.set('organizationId', organizationId);
      params.set('limit', '1000');
      const response = await fetch(`/api/v1/admin/crm/departments?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch departments');
      }
      const departmentOptions = data.data.map(dept => ({
        value: dept._id,
        label: dept.departmentName
      }));

      setDepartmentsCache(prev => ({ ...prev, [organizationId]: departmentOptions }));
      return departmentOptions;
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  };

  const fetchCategories = async (departmentId) => {
    // If already cached, don't fetch again
    if (categoriesCache[departmentId]) return categoriesCache[departmentId];

    try {
      if (!departmentId) return [];

      const params = new URLSearchParams();
      params.set('departmentId', departmentId);
      params.set('limit', '1000');
      const response = await fetch(`/api/v1/admin/crm/employeecategory?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }
      const categoryOptions = data.data
        .map(item => ({
          value: item._id,
          label: item.employeeCategory,
          categoryName: item.employeeCategory
        }));

      setCategoriesCache(prev => ({ ...prev, [departmentId]: categoryOptions }));
      return categoryOptions;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  };

  const addCriterion = () => {
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { organizationId: '', departmentId: '', categoryId: '', subType: '' }]
    });
  };

  const removeCriterion = (index) => {
    if (formData.criteria.length === 1) {
      toast.error("At least one criterion is required");
      return;
    }
    const newCriteria = formData.criteria.filter((_, i) => i !== index);
    setFormData({ ...formData, criteria: newCriteria });
  };

  const updateCriterion = async (index, field, value) => {
    const newCriteria = [...formData.criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };

    // If organization changes, clear department/category
    if (field === 'organizationId') {
      newCriteria[index].departmentId = '';
      newCriteria[index].categoryId = '';
      if (value) {
        await fetchDepartments(value);
      }
    }

    // If department changes, clear category
    if (field === 'departmentId') {
      newCriteria[index].categoryId = '';
      if (value) {
        await fetchCategories(value);
      }
    }

    setFormData({ ...formData, criteria: newCriteria });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.threshold) {
      toast.error('Please enter a threshold value');
      return;
    }

    for (const item of formData.criteria) {
      if (!item.organizationId || !item.departmentId || !item.categoryId) {
        toast.error('Please select Organization, Department, and Category for all rows');
        return;
      }
    }

    try {
      setSaving(true);

      const url = editingThreshold
        ? `/api/v1/admin/payroll/attendance-thresholds?id=${editingThreshold._id}`
        : '/api/v1/admin/payroll/attendance-thresholds';

      const payload = { ...formData };
      if (editingThreshold) {
        payload.id = editingThreshold._id;
      }

      const method = editingThreshold ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingThreshold ? 'Threshold updated successfully' : 'Threshold created successfully');
        setShowForm(false);
        setEditingThreshold(null);
        resetForm();
        fetchThresholds();
      } else {
        toast.error(data.error || 'Failed to save threshold');
      }
    } catch (error) {
      console.error('Error saving threshold:', error);
      toast.error('Error saving threshold');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (threshold) => {
    setEditingThreshold(threshold);

    // transform populated data back to form structure
    let formattedCriteria = (threshold.criteria || []).map(c => ({
      organizationId: c.organizationId?._id || '',
      departmentId: c.departmentId?._id || '',
      categoryId: c.categoryId?._id || '',
      subType: c.subType || ''
    }));

    // If legacy data or empty, default to one empty row
    if (formattedCriteria.length === 0) {
      formattedCriteria = [{ organizationId: '', departmentId: '', categoryId: '', subType: '' }];
    }

    // Prefetch depts and cats for all rows
    for (const c of formattedCriteria) {
      if (c.organizationId) {
        await fetchDepartments(c.organizationId);
      }
      if (c.departmentId) {
        await fetchCategories(c.departmentId);
      }
    }

    setFormData({
      criteria: formattedCriteria,
      threshold: threshold.threshold,
      isActive: threshold.isActive
    });

    setShowForm(true);
  };

  const handleDelete = async (thresholdId) => {
    if (!confirm('Are you sure you want to delete this threshold?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/payroll/attendance-thresholds?id=${thresholdId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Threshold deleted successfully');
        fetchThresholds();
      } else {
        toast.error('Failed to delete threshold');
      }
    } catch (error) {
      console.error('Error deleting threshold:', error);
      toast.error('Error deleting threshold');
    }
  };

  const resetForm = () => {
    setFormData({
      criteria: [{ organizationId: '', categoryId: '', subType: '' }],
      threshold: '',
      isActive: true
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingThreshold(null);
    resetForm();
  };

  // Calculate statistics
  const activeThresholds = thresholds.filter(t => t.isActive).length;
  // Count unique organizations across all criteria
  const allOrgIds = thresholds.flatMap(t => t.criteria?.map(c => c.organizationId._id) || []);
  const totalOrganizations = [...new Set(allOrgIds)].length;
  const avgThreshold = thresholds.length > 0
    ? Math.round(thresholds.reduce((sum, t) => sum + t.threshold, 0) / thresholds.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Skeleton className="h-20 w-full mb-6" />
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Attendance Thresholds</h1>
                <p className="text-slate-600 text-sm mt-0.5">Configure attendance limits for grouped employee categories</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">

              <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border-2 border-slate-200 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Thresholds</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{thresholds.length}</p>
                <p className="text-xs text-slate-500 mt-1">Configured rules</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border-2 border-slate-200 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Rules</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{activeThresholds}</p>
                <p className="text-xs text-slate-500 mt-1">Currently enforced</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border-2 border-slate-200 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Organizations</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{totalOrganizations}</p>
                <p className="text-xs text-slate-500 mt-1">Involved in rules</p>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-blue-100">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border-2 border-slate-200 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg. Threshold</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{avgThreshold}</p>
                <p className="text-xs text-slate-500 mt-1">Average count</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border-2 border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-slate-900">Configured Thresholds</h2>
                {thresholds.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full border border-indigo-200">
                    {thresholds.length} Rules
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchThresholds}
                  disabled={fetchLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border-2 border-slate-200 disabled:opacity-50 transition-colors font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${fetchLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-all hover:"
                >
                  <Plus className="w-4 h-4" />
                  Add Threshold
                </button>
              </div>
            </div>
          </div>

          {/* Thresholds List */}
          <div className="p-6">
            {thresholds.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-indigo-200">
                  <AlertTriangle className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No thresholds configured</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                  Add your first attendance threshold to set limits for employee categories and track attendance compliance.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-all hover:"
                >
                  <Plus className="w-4 h-4" />
                  Add First Threshold
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {thresholds.map((threshold) => (
                  <div
                    key={threshold._id}
                    className="border-2 border-slate-200 rounded-xl p-5 hover: transition-all hover:border-indigo-200 bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            {threshold.criteria?.length > 1
                              ? `${threshold.criteria.length} Combined Groups`
                              : threshold.criteria?.[0]?.organizationId?.name || 'Unknown'
                            }
                          </span>
                          <span className="text-xs text-slate-500">
                            {threshold.criteria?.length > 1 ? 'Multi-Organization/Category' : 'Single Target'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(threshold)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(threshold._id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {/* Summary of criteria */}
                      <div className="p-3 bg-slate-50 rounded-lg max-h-40 overflow-y-auto custom-scrollbar">
                        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Included Groups:</h4>
                        <ul className="space-y-2">
                          {threshold.criteria?.map((c, i) => (
                            <li key={i} className="text-sm text-slate-700 pb-2 border-b border-slate-200 last:border-0 last:pb-0">
                              <div className="font-medium">{c.organizationId?.name}</div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{c.categoryId?.employeeCategory}</span>
                                {c.subType && (
                                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                                    {c.subType}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs text-blue-600 block">Total Threshold Limit</span>
                          <span className="text-lg font-bold text-blue-600 block">
                            {threshold.threshold}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Status</span>
                        {threshold.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border-2 bg-green-50 text-green-700 border-green-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border-2 bg-red-50 text-red-700 border-red-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <AlertCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-6 py-4 border-b-2 border-blue-600 rounded-t-xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {editingThreshold ? 'Edit Threshold Rule' : 'Add Threshold Rule'}
                  </h2>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form onSubmit={handleSubmit} id="thresholdForm" className="space-y-6">

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">
                      Employee Groups Criteria
                    </label>
                    <button
                      type="button"
                      onClick={addCriterion}
                      className="text-xs flex items-center gap-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-3 py-1.5 rounded-md font-medium transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Group
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.criteria.map((criterion, index) => (
                      <div key={index} className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-200 relative group">
                        <span className="absolute -left-2 -top-2 w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold border border-slate-300">
                          {index + 1}
                        </span>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                          {/* Organization */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Organization *</label>
                            <select
                              value={criterion.organizationId}
                              onChange={(e) => updateCriterion(index, 'organizationId', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            >
                              <option value="">Select Org</option>
                              {organizations.map((org) => (
                                <option key={org.value} value={org.value}>
                                  {org.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Department */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Department *</label>
                            <select
                              value={criterion.departmentId}
                              onChange={(e) => updateCriterion(index, 'departmentId', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"
                              required
                              disabled={!criterion.organizationId}
                            >
                              <option value="">Select Dept</option>
                              {(departmentsCache[criterion.organizationId] || []).map((dept) => (
                                <option key={dept.value} value={dept.value}>
                                  {dept.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Category */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Category *</label>
                            <select
                              value={criterion.categoryId}
                              onChange={(e) => updateCriterion(index, 'categoryId', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"
                              required
                              disabled={!criterion.departmentId}
                            >
                              <option value="">Select Category</option>
                              {(categoriesCache[criterion.departmentId] || []).map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* SubType */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Sub-Type</label>
                            <input
                              type="text"
                              value={criterion.subType}
                              onChange={(e) => updateCriterion(index, 'subType', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Optional"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeCriterion(index)}
                          className="mt-6 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove row"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Total Threshold Count *
                    </label>
                    <input
                      type="number"
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="e.g., 52"
                      min="1"
                      required
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Total combined limit for all groups above
                    </p>
                  </div>

                  <div className="flex items-center h-full pt-6">
                    <div className="flex items-center p-3 bg-slate-50 rounded-lg border-2 border-slate-200 w-full">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-3 text-sm font-medium text-slate-700 cursor-pointer select-none">
                        Active (Enable this rule)
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-4 border-t-2 border-slate-200 bg-slate-50 rounded-b-xl flex-shrink-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 bg-white text-slate-700 rounded-lg hover:bg-slate-100 font-semibold transition-colors border-2 border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="thresholdForm"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white py-2.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingThreshold ? 'Update' : 'Save'} Threshold
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}