'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Eye, Search, Filter,
  Building2, Users, MapPin, Phone, Mail, Calendar,
  X, Save, ArrowLeft, ExternalLink, ChevronDown, Check,
  RefreshCw, FilterX, AlertCircle, CheckCircle, TrendingUp,
  ChevronLeft, ChevronRight, MoreHorizontal, FolderOpen, Layers
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { EnterprisePageHeader } from "@/components/ui/enterprise/EnterprisePageHeader";
import { EnterpriseKpiCard } from "@/components/ui/enterprise/EnterpriseKpiCard";
import { EnterpriseSectionCard } from "@/components/ui/enterprise/EnterpriseSectionCard";
import { EnterpriseButton } from "@/components/ui/enterprise/EnterpriseButton";
import { EnterpriseStatusBadge } from "@/components/ui/enterprise/EnterpriseStatusBadge";
import { EnterpriseEmptyState } from "@/components/ui/enterprise/EnterpriseEmptyState";
import { EnterpriseIconContainer } from "@/components/ui/enterprise/EnterpriseIconContainer";

const API_URL = '/api/v1/admin/crm/departments';
const ORGANIZATIONS_API = '/api/v1/admin/crm/organizations';

const initialFormData = {
  organizationId: '',
  departmentName: '',
  status: 'Active',
  permissions: [],
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('list');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 9,
  });

  const fetchOrganizations = async () => {
    try {
      const orgsRes = await fetch(`${ORGANIZATIONS_API}?page=1&limit=100`);
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        const orgsList = orgsData.organizations || orgsData.data || [];
        setOrganizations(orgsList);
      } else {
        console.error('Failed to fetch organizations:', orgsRes.status);
        setError('Failed to load organizations');
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations');
    }
  };

  async function fetchDepartments(options = {}) {
    const {
      page = pagination.page || 1,
      limit = pagination.limit || 9,
      search = searchTerm,
      status = statusFilter,
    } = options;

    try {
      setLoading(!departments.length);
      setRefreshing(departments.length > 0);
      setError('');

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (search) params.set('search', search);
      if (status !== 'all') params.set('status', status);

      const res = await fetch(`${API_URL}?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to fetch departments: ${res.status}`);
      }

      const data = await res.json();
      const departmentsList = data.data || data.departments || [];
      setDepartments(departmentsList);

      setPagination(data.pagination || {
        page,
        total: data.total || departmentsList.length,
        pages: Math.ceil((data.total || departmentsList.length) / limit),
        limit
      });
    } catch (err) {
      console.error('Fetch departments error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/v1/admin/crm/permissions?limit=-1');
      if (res.ok) {
        const data = await res.json();
        setAvailablePermissions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  useEffect(() => {
    fetchDepartments({ page: 1 });
    fetchOrganizations();
    fetchPermissions();
  }, []);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchDepartments({ page: pagination.page });
  }, [pagination.page, pagination.limit, searchTerm, statusFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => {
      const currentPermissions = prev.permissions || [];
      if (currentPermissions.includes(permission)) {
        return {
          ...prev,
          permissions: currentPermissions.filter(p => p !== permission)
        };
      } else {
        return {
          ...prev,
          permissions: [...currentPermissions, permission]
        };
      }
    });
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedDepartment(null);
    setError('');
    setSuccess('');
  };

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      if (!formData.organizationId || !formData.departmentName.trim()) {
        setError('Organization and Department Name are required');
        return;
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create department');

      setSuccess('Department created successfully');
      await fetchDepartments({ page: 1 });
      resetForm();
      setView('list');
    } catch (err) {
      console.error('Create department error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!(selectedDepartment?.id || selectedDepartment?._id)) return;
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      const res = await fetch(`${API_URL}/${selectedDepartment.id || selectedDepartment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update department');

      setSuccess('Department updated successfully');
      await fetchDepartments({ page: pagination.page });
      resetForm();
      setView('list');
    } catch (err) {
      console.error('Update department error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete department');

      const nextPage = departments.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page;

      await fetchDepartments({ page: nextPage });
    } catch (err) {
      console.error('Delete department error:', err);
      setError(err.message);
    }
  };

  const handleView = async (dept) => {
    try {
      const res = await fetch(`${API_URL}/${dept.id || dept._id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch department details');
      }

      const fullDept = await res.json();
      setSelectedDepartment(fullDept);
      setView('view');
    } catch (err) {
      console.error('View department error:', err);
      setError(err.message);
    }
  };

  const handleEdit = async (dept) => {
    try {
      const res = await fetch(`${API_URL}/${dept.id || dept._id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch department details');
      }

      const fullDept = await res.json();
      setSelectedDepartment(fullDept);
      setFormData({
        organizationId: fullDept.organizationId || '',
        departmentName: fullDept.departmentName || '',
        status: fullDept.status || 'Active',
        permissions: fullDept.permissions || [],
      });
      setView('edit');
    } catch (err) {
      console.error('Edit department error:', err);
      setError(err.message);
    }
  };

  const getOrganizationName = (dept) => {
    return dept?.organizationName || 'Unknown Organization';
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    await fetchDepartments({ page: newPage });
  };

  const handleLimitChange = (value) => {
    setPagination(prev => ({ ...prev, limit: Number(value), page: 1 }));
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all';

  const Pagination = () => {
    const { pages, page, total, limit } = pagination;
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);
    if (pages <= 1) return null;
    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];
      for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || (i >= page - delta && i <= page + delta)) {
          range.push(i);
        }
      }
      let prev = 0;
      for (const i of range) {
        if (i - prev > 1) {
          rangeWithDots.push("...");
        }
        rangeWithDots.push(i);
        prev = i;
      }
      return rangeWithDots;
    };
    const pageNumbers = getPageNumbers();
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-2xl border border-slate-200">
        <div className="text-sm font-medium text-slate-500">
          Showing <span className="font-bold text-slate-800">{total === 0 ? 0 : startIndex}-{endIndex}</span> of{' '}
          <span className="font-bold text-slate-800">{total}</span> departments
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm font-medium text-slate-500">Show:</span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(e.target.value)}
              className="border border-slate-200 rounded-xl px-2 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={18}>18</option>
              <option value={24}>24</option>
            </select>
          </div>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNum, index) => (
              <div key={index}>
                {pageNum === "..." ? (
                  <span className="flex items-center justify-center h-9 w-9 text-sm font-bold text-slate-400">
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                ) : (
                  <button
                    onClick={() => handlePageChange(pageNum)}
                    className={`h-9 w-9 flex items-center justify-center text-sm font-bold border transition-colors rounded-xl ${page === pageNum
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200"
                      }`}
                  >
                    {pageNum}
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pages}
            className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      <EnterprisePageHeader 
        title="Departments"
        subtitle="Manage departments, teams, and access"
        icon={Layers}
        actions={
          view === 'list' && (
            <EnterpriseButton icon={Plus} onClick={() => { resetForm(); setView('create'); }}>
              Add Department
            </EnterpriseButton>
          )
        }
      />

      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EnterpriseKpiCard 
            title="Total Departments"
            value={pagination.total}
            description="All registered departments"
            icon={Layers}
            color="from-indigo-500 to-violet-600"
          />
          <EnterpriseKpiCard 
            title="Active"
            value={departments.filter(dept => dept.status === 'Active').length}
            description="Operational departments"
            icon={CheckCircle}
            color="from-emerald-500 to-green-600"
          />
          <EnterpriseKpiCard 
            title="Organizations"
            value={new Set(departments.map(dept => dept.organizationId)).size}
            description="Active organizations"
            icon={Building2}
            color="from-blue-500 to-cyan-600"
          />
        </div>
      )}

      {view === 'list' ? (
        <div className="space-y-6">
          <EnterpriseSectionCard>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-slate-800">Departments ({pagination.total})</h2>
                {hasActiveFilters && <EnterpriseStatusBadge status="Filtered" type="info" />}
              </div>
              <EnterpriseButton variant="secondary" icon={RefreshCw} onClick={() => fetchDepartments({ page: pagination.page })} disabled={refreshing}>
                Refresh
              </EnterpriseButton>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="col-span-1 md:col-span-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by department name"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 transition-all"
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-2 flex items-end">
                {hasActiveFilters && (
                  <EnterpriseButton variant="ghost" className="w-full" icon={FilterX} onClick={async () => { setSearchTerm(''); setStatusFilter('all'); await fetchDepartments({ page: 1 }); }}>
                    Clear
                  </EnterpriseButton>
                )}
              </div>
            </div>
          </EnterpriseSectionCard>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-red-800">Error</h4>
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-800">Success</h4>
                <p className="text-sm font-medium text-emerald-700">{success}</p>
              </div>
            </div>
          )}

          {departments.length === 0 ? (
            <EnterpriseEmptyState 
              icon={Layers}
              title={hasActiveFilters ? 'No departments found' : 'No departments yet'}
              description={hasActiveFilters ? 'Try adjusting your filters.' : 'Add your first department to start managing teams.'}
              action={
                hasActiveFilters ? (
                  <EnterpriseButton variant="secondary" icon={FilterX} onClick={async () => { setSearchTerm(''); setStatusFilter('all'); await fetchDepartments({ page: 1 }); }}>
                    Clear Filters
                  </EnterpriseButton>
                ) : (
                  <EnterpriseButton icon={Plus} onClick={() => { resetForm(); setView('create'); }}>
                    Add Department
                  </EnterpriseButton>
                )
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                  <div key={dept.id || dept._id || Math.random()} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover: transition-all flex flex-col group">
                    <div className="p-6 flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <EnterpriseIconContainer icon={Layers} color="indigo" size="md" />
                          <div>
                            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight group-hover:text-indigo-600 transition-colors">
                              {dept.departmentName}
                            </h3>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {getOrganizationName(dept)}
                            </p>
                          </div>
                        </div>
                        <EnterpriseStatusBadge status={dept.status} />
                      </div>
                    </div>
                    <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-1">
                      <EnterpriseButton size="sm" variant="ghost" icon={Eye} onClick={() => handleView(dept)} />
                      <EnterpriseButton size="sm" variant="ghost" icon={Edit2} onClick={() => handleEdit(dept)} />
                      <EnterpriseButton size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" icon={Trash2} onClick={() => handleDelete(dept.id || dept._id)} />
                    </div>
                  </div>
                ))}
              </div>
              <Pagination />
            </>
          )}
        </div>
      ) : view === 'view' ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <EnterpriseButton variant="ghost" icon={ArrowLeft} onClick={() => { resetForm(); setView('list'); }}>
            Back to List
          </EnterpriseButton>
          
          <EnterpriseSectionCard 
            title={selectedDepartment?.departmentName}
            icon={Layers}
            description={getOrganizationName(selectedDepartment)}
            action={
              <div className="flex items-center gap-3">
                <EnterpriseStatusBadge status={selectedDepartment?.status} />
                <EnterpriseButton variant="secondary" icon={Edit2} onClick={() => handleEdit(selectedDepartment)}>
                  Edit
                </EnterpriseButton>
              </div>
            }
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Basic Info</h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                  <EnterpriseIconContainer icon={Building2} color="indigo" size="sm" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organization</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{getOrganizationName(selectedDepartment)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Timeline</h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                  <EnterpriseIconContainer icon={Calendar} color="blue" size="sm" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{new Date(selectedDepartment?.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Permissions</h4>
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-6">
                {selectedDepartment?.permissions?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedDepartment.permissions.map((permSlug, index) => {
                      const permObj = availablePermissions.find(p => p.slug === permSlug);
                      const permLabel = permObj ? permObj.name : permSlug;
                      return (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700">
                          {permLabel}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-400">No permissions assigned.</p>
                )}
              </div>
            </div>
          </EnterpriseSectionCard>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <EnterpriseButton variant="ghost" icon={ArrowLeft} onClick={() => { resetForm(); setView('list'); }}>
            Back to List
          </EnterpriseButton>

          <EnterpriseSectionCard 
            title={view === 'create' ? "Create Department" : "Edit Department"}
            icon={Layers}
            description={view === 'create' ? "Add a new department under an organization" : "Update department details"}
          >
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}
            
            <div className="space-y-8">
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Basic Info</h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Organization *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      name="organizationId"
                      value={formData.organizationId}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 transition-all"
                    >
                      <option value="">-- Select Organization --</option>
                      {organizations.map((org) => (
                        <option key={org.id || org._id} value={org.id || org._id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Department Name *</label>
                    <input
                      name="departmentName"
                      value={formData.departmentName}
                      onChange={handleInputChange}
                      placeholder="e.g. Engineering"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50 transition-all"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availablePermissions.map((permission) => {
                    const checked = formData.permissions?.includes(permission.slug);
                    return (
                      <label key={permission.slug} className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${checked ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-200'}`}>
                        <input
                          type="checkbox"
                          className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mr-3"
                          checked={checked || false}
                          onChange={() => handlePermissionChange(permission.slug)}
                        />
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${checked ? 'text-indigo-900' : 'text-slate-700'}`}>{permission.name}</span>
                          {permission.description && (
                            <span className="text-xs font-medium text-slate-500 mt-1">{permission.description}</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <EnterpriseButton variant="secondary" onClick={() => { resetForm(); setView('list'); }}>
                  Cancel
                </EnterpriseButton>
                <EnterpriseButton 
                  icon={Save}
                  onClick={view === "create" ? handleCreate : handleUpdate}
                  disabled={isSubmitting || !formData.organizationId || !formData.departmentName.trim()}
                  loading={isSubmitting}
                >
                  {view === "create" ? "Create Department" : "Save Changes"}
                </EnterpriseButton>
              </div>
            </div>
          </EnterpriseSectionCard>
        </div>
      )}
    </div>
  );
}
