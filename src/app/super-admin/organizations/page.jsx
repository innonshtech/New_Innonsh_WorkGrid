'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Edit2, Trash2, Eye, Search, Filter,
  Building2, Users, MapPin, Phone, Mail, Calendar,
  X, Save, ArrowLeft, ExternalLink, ChevronDown, Check,
  RefreshCw, FilterX, AlertCircle, CheckCircle, TrendingUp,
  ChevronLeft, ChevronRight, MoreHorizontal
} from 'lucide-react';
import { useValidation } from '@/hooks/useValidation';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = '/api/v1/super-admin/organizations';

const initialFormData = {
  name: '',
  description: '',
  email: '',
  phone: '',
  address: '',
  memberCount: '',
  established: '',
  status: 'Active',
  website: '',
  logoFile: null,
};

const validationSchema = {
  name: 'name',
  email: 'email',
  phone: (v) => !v || /^\d{10,12}$/.test(v?.replace(/\D/g, '') || ''), // Optional, 10-12 digits
  website: 'website',
  memberCount: (v) => !v || parseInt(v) >= 0, // Optional, non-negative
};

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [view, setView] = useState('list');
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 9,
  });

  const { errors, validateField, handleBlur, touched } = useValidation(formData, validationSchema);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function fetchOrganizations(options = {}) {
    const {
      page = pagination.page || 1,
      limit = pagination.limit || 9,
      search = debouncedSearch,
      status = statusFilter,
    } = options;

    try {
      setLoading(!organizations.length);
      setRefreshing(organizations.length > 0);
      setError('');

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (search) params.set('search', search);
      params.set('status', status);

      console.log("Fetching from:", API_URL);
      const res = await fetch(`${API_URL}?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch organizations');

      setOrganizations(data.organizations || []);
      setPagination(data.pagination || {
        page,
        total: data.total || data.organizations?.length || 0,
        pages: Math.ceil((data.total || data.organizations?.length || 0) / limit),
        limit,
      });

    } catch (err) {
      setError(err.message);
      setOrganizations([]);
      setPagination(prev => ({ ...prev, total: 0, pages: 1 }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOrganizations({ page: 1 });
  }, []);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchOrganizations({ page: pagination.page });
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedOrganization(null);
  };

  const handleCreate = async () => {
    // Validate all fields
    let isValid = true;
    for (const key in validationSchema) {
      if (!validateField(key, formData[key])) isValid = false;
    }

    if (!isValid) {
      setError('Please fix the validation errors');
      return;
    }

    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const fd = new FormData();
      for (const key in formData) {
        if (key !== 'logoFile') fd.append(key, formData[key]);
      }
      if (formData.logoFile) fd.append('logo', formData.logoFile);

      console.log(fd);
      const res = await fetch(API_URL, {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchOrganizations({ page: 1 });
      resetForm();
      setView('list');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedOrganization?.id) return;

    // Validate all fields
    let isValid = true;
    for (const key in validationSchema) {
      if (!validateField(key, formData[key])) isValid = false;
    }

    if (!isValid) {
      setError('Please fix the validation errors');
      return;
    }

    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const fd = new FormData();
      for (const key in formData) {
        if (key !== 'logoFile') fd.append(key, formData[key]);
      }
      if (formData.logoFile) fd.append('logo', formData.logoFile);

      const res = await fetch(`${API_URL}/${selectedOrganization.id}`, {
        method: 'PUT',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchOrganizations({ page: pagination.page });
      resetForm();
      setView('list');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const nextPage = organizations.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page;

      await fetchOrganizations({ page: nextPage });

    } catch (err) {
      setError(err.message);
    }
  };

  const handleView = async (org) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`${API_URL}/${org.id}`);
      const fullOrg = await res.json();
      if (!res.ok) throw new Error(fullOrg.error);

      setSelectedOrganization(fullOrg);
      setView('view');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleEdit = async (org) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`${API_URL}/${org.id}`);
      const fullOrg = await res.json();
      if (!res.ok) throw new Error(fullOrg.error);

      setSelectedOrganization(fullOrg);

      setFormData({
        name: fullOrg.name || '',
        description: fullOrg.description || '',
        email: fullOrg.email || '',
        phone: fullOrg.phone || '',
        address: fullOrg.address || (typeof fullOrg.address === 'object' ? fullOrg.address.street || '' : ''),
        memberCount: fullOrg.memberCount?.toString() || '0',
        established: fullOrg.established ? new Date(fullOrg.established).toISOString().split('T')[0] : '',
        status: fullOrg.status || 'Active',
        website: fullOrg.website || '',
        logoFile: null,
      });

      setView('edit');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    await fetchOrganizations({ page: newPage });
  };

  const handleLimitChange = (value) => {
    setPagination(prev => ({ ...prev, limit: Number(value), page: 1 }));
  };

  const hasActiveFilters = debouncedSearch || statusFilter !== 'all';

  const StatusPill = ({ status }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${status === 'Active'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-red-50 text-red-700 border-red-200'
      }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
      {status}
    </span>
  );

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-lg border border-slate-200">
        <div className="text-sm text-slate-600">
          Showing <span className="font-semibold">{startIndex}-{endIndex}</span> of{' '}
          <span className="font-semibold">{total}</span> organizations
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-slate-600">Show:</span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
            className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNum, index) => (
              <div key={index}>
                {pageNum === "..." ? (
                  <span className="flex items-center justify-center h-9 w-9 text-sm text-slate-500">
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                ) : (
                  <button
                    onClick={() => handlePageChange(pageNum)}
                    className={`h-9 w-9 flex items-center justify-center text-sm font-medium border transition-colors rounded-md ${page === pageNum
                      ? "bg-indigo-500 border-indigo-500 text-white hover:bg-indigo-600"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
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
            className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  // Loading Skeleton
  if ((loading && !refreshing) || (view !== 'list' && isLoadingDetail)) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="w-11 h-11 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Analytics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-xl" />
                </div>
              </div>
            ))}
          </div>

          {/* Controls Skeleton */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between mb-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-24" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-6">
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="lg:col-span-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            {/* List Skeleton */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-indigo-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
                <p className="text-slate-600 text-sm mt-0.5">Manage companies, teams, and access</p>
              </div>
            </div>
            {view === 'list' && (
              <button
                onClick={() => {
                  resetForm();
                  setView('create');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Organization
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Analytics Overview */}
        {view === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Organizations</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{pagination.total}</p>
                  <p className="text-xs text-slate-500 mt-1">All companies</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {organizations.filter(org => org.status === 'Active').length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Operational companies (page)</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Members</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {organizations.reduce((sum, org) => sum + (org.memberCount || 0), 0)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Across all teams (page)</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-blue-100">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Controls Panel */}
        <div className="bg-white rounded-xl border border-slate-200">
          {view === 'list' && (
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-slate-900">Organizations ({pagination.total})</h2>
                  {hasActiveFilters && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full border border-indigo-200">
                      Filtered Results
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => fetchOrganizations({ page: pagination.page })}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 disabled:opacity-50 transition-colors font-medium"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
              {/* Search and Filters */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Search Organizations</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or description..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="lg:col-span-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="lg:col-span-2 flex items-end">
                  {hasActiveFilters && (
                    <button
                      onClick={async () => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        await fetchOrganizations({ page: 1 });
                      }}
                      className="w-full px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors font-medium"
                      title="Clear all filters"
                    >
                      <FilterX className="w-4 h-4 mr-2" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Content */}
          <div className="p-6">
            {view === 'list' ? (
              <>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-red-800">Error</h4>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                {organizations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {hasActiveFilters ? 'No organizations match your criteria' : 'No organizations found'}
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                      {hasActiveFilters
                        ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                        : 'Get started by adding your first organization to manage your companies.'
                      }
                    </p>
                    {hasActiveFilters ? (
                      <button
                        onClick={async () => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          await fetchOrganizations({ page: 1 });
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border border-indigo-200 text-sm font-medium transition-colors"
                      >
                        <FilterX className="w-4 h-4" />
                        Clear All Filters
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          resetForm();
                          setView('create');
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Organization
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {organizations.map((org) => (
                        <div key={org.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover: transition-">
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                                  <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-slate-900 text-sm">{org.name}</h3>
                                  <p className="text-xs text-slate-500 mt-0.5">{org.memberCount} members</p>
                                </div>
                              </div>
                              <StatusPill status={org.status} />
                            </div>
                            <div className="space-y-3 mb-4">
                              <p className="text-sm text-slate-600 line-clamp-2">{org.description}</p>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-slate-50 border-slate-100">
                                  <Calendar className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    Est. {org.established ? new Date(org.established).getFullYear() : 'N/A'}
                                  </p>
                                  <p className="text-xs text-slate-500">Established</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleView(org)}
                                  className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(org)}
                                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(org.id)}
                                  className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Pagination />
                  </>
                )}
              </>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-red-800">Error</h4>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="max-w-4xl mx-auto">
                  <button
                    onClick={() => {
                      resetForm();
                      setView('list');
                    }}
                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors mb-6 group"
                  >
                    <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                    <span className="font-medium">Back to List</span>
                  </button>
                  {view === 'view' ? (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {selectedOrganization?.logo ? (
                              <img
                                src={selectedOrganization.logo}
                                alt="Logo"
                                className="w-16 h-16 rounded-lg object-cover border"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-indigo-500 rounded-lg flex items-center justify-center">
                                <Building2 className="w-7 h-7 text-white" />
                              </div>
                            )}
                            <div>
                              <h2 className="text-xl font-bold text-slate-900">{selectedOrganization?.name}</h2>
                              <StatusPill status={selectedOrganization?.status} />
                            </div>
                          </div>
                          <button
                            onClick={() => handleEdit(selectedOrganization)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium transition-colors hover:"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        </div>
                      </div>
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            Contact Information
                          </h3>
                          {selectedOrganization?.email && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                              <Mail className="w-4 h-4 text-slate-600" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase">Email</p>
                                <p className="font-medium text-sm">{selectedOrganization.email}</p>
                              </div>
                            </div>
                          )}
                          {selectedOrganization?.phone && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                              <Phone className="w-4 h-4 text-slate-600" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase">Phone</p>
                                <p className="font-medium text-sm">{selectedOrganization.phone}</p>
                              </div>
                            </div>
                          )}
                          {(selectedOrganization?.address) && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                              <MapPin className="w-4 h-4 text-slate-600" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase">Address</p>
                                <p className="font-medium text-sm">
                                  {typeof selectedOrganization.address === 'object'
                                    ? selectedOrganization.address.street || 'N/A'
                                    : selectedOrganization.address}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            Organization Details
                          </h3>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <Building2 className="w-4 h-4 text-slate-600" />
                            <div>
                              <p className="text-xs text-slate-500 uppercase">Organization ID</p>
                              <p className="font-medium text-sm">{selectedOrganization?.orgId || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <Users className="w-4 h-4 text-slate-600" />
                            <div>
                              <p className="text-xs text-slate-500 uppercase">Team Size</p>
                              <p className="font-medium text-sm">{selectedOrganization?.memberCount || 0} members</p>
                            </div>
                          </div>
                          {selectedOrganization?.established && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                              <Calendar className="w-4 h-4 text-slate-600" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase">Established</p>
                                <p className="font-medium text-sm">
                                  {new Date(selectedOrganization.established).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedOrganization?.createdAt && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                              <Calendar className="w-4 h-4 text-slate-600" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase">Created At</p>
                                <p className="font-medium text-sm">
                                  {new Date(selectedOrganization.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })} {new Date(selectedOrganization.createdAt).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedOrganization?.updatedAt && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                              <Calendar className="w-4 h-4 text-slate-600" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase">Updated At</p>
                                <p className="font-medium text-sm">
                                  {new Date(selectedOrganization.updatedAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })} {new Date(selectedOrganization.updatedAt).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedOrganization?.website && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                              <ExternalLink className="w-4 h-4 text-slate-600" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase">Website</p>
                                <a
                                  href={selectedOrganization.website.startsWith('http') ? selectedOrganization.website : `https://${selectedOrganization.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-sm text-indigo-600 hover:text-indigo-700"
                                >
                                  {selectedOrganization.website}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-slate-900">
                                {view === 'create' ? "Create New Organization" : "Edit Organization"}
                              </h2>
                              <p className="text-slate-600 text-sm mt-1">
                                {view === "create" ? "Add a new organization" : "Update organization details"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 space-y-6">
                        {error && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-red-700">{error}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Organization Name *</label>
                                <input
                                  name="name"
                                  value={formData.name}
                                  onChange={handleInputChange}
                                  onBlur={(e) => handleBlur('name', e.target.value)}
                                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.name ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-indigo-500'
                                    }`}
                                  placeholder="Enter name"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                                <select
                                  name="status"
                                  value={formData.status}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                                <input
                                  name="email"
                                  value={formData.email}
                                  onChange={handleInputChange}
                                  onBlur={(e) => handleBlur('email', e.target.value)}
                                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.email ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-indigo-500'
                                    }`}
                                />
                                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                                <input
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleInputChange}
                                  onBlur={(e) => handleBlur('phone', e.target.value)}
                                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.phone ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-indigo-500'
                                    }`}
                                />
                                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                                <input
                                  name="website"
                                  value={formData.website}
                                  onChange={handleInputChange}
                                  onBlur={(e) => handleBlur('website', e.target.value)}
                                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.website ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-indigo-500'
                                    }`}
                                  placeholder="example.com"
                                />
                                {errors.website && <p className="text-xs text-red-500 mt-1">{errors.website}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                                <input
                                  name="address"
                                  value={formData.address}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900">Additional Details</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Team Size</label>
                                <input
                                  name="memberCount"
                                  value={formData.memberCount}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  type="number"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Established Date</label>
                                <input
                                  name="established"
                                  type="date"
                                  value={formData.established}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900">Logo</h3>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Logo</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  setFormData(prev => ({ ...prev, logoFile: e.target.files[0] }))
                                }
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              {formData.logoFile && (
                                <img
                                  src={URL.createObjectURL(formData.logoFile)}
                                  alt="Preview"
                                  className="h-20 mt-2 rounded-lg border object-cover"
                                />
                              )}
                              {view === "edit" && selectedOrganization?.logo && !formData.logoFile && (
                                <img
                                  src={selectedOrganization.logo}
                                  className="h-20 mt-2 rounded-lg border object-cover"
                                  alt="Current Logo"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                          <button
                            onClick={() => {
                              resetForm();
                              setView('list');
                            }}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={view === "create" ? handleCreate : handleUpdate}
                            disabled={isSubmitting || !formData.name || !formData.email}
                            className="px-4 py-2 bg-indigo-500 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-600 transition-colors flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {view === "create" ? "Create Organization" : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}