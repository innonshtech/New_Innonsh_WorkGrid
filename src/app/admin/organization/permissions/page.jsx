'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Eye, Search, Filter,
  Shield, Check, X, Save, ArrowLeft, RefreshCw, AlertCircle, CheckCircle,
  MoreHorizontal, ChevronLeft, ChevronRight, FilterX
} from 'lucide-react';

const API_URL = '/api/v1/admin/crm/permissions';

const initialFormData = {
  name: '',
  slug: '',
  module: '',
  description: '',
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('list');
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10,
  });

  const fetchPermissions = async (options = {}) => {
    const {
      page = pagination.page || 1,
      limit = pagination.limit || 10,
      search = searchTerm,
      module = moduleFilter,
    } = options;

    try {
      setLoading(!permissions.length);
      setRefreshing(permissions.length > 0);
      setError('');

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (search) params.set('search', search);
      if (module !== 'all') params.set('module', module);

      const res = await fetch(`${API_URL}?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch permissions: ${res.status}`);
      }

      const data = await res.json();
      const permissionsList = data.data || [];

      setPermissions(permissionsList);
      setPagination(data.pagination || {
        page,
        total: data.total || permissionsList.length,
        pages: Math.ceil((data.total || permissionsList.length) / limit),
        limit
      });

    } catch (err) {
      console.error('Fetch permissions error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPermissions({ page: 1 });
  }, []);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, moduleFilter]);

  useEffect(() => {
    fetchPermissions({ page: pagination.page });
  }, [pagination.page, pagination.limit, searchTerm, moduleFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newData = { ...prev, [name]: value };
        // Auto-generate slug from name if slug hasn't been manually edited and we're creating
        if (name === 'name' && view === 'create') {
            newData.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        }
        return newData;
    });
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedPermission(null);
    setError('');
    setSuccess('');
  };

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      if (!formData.name || !formData.slug || !formData.module) {
        setError('Name, Slug and Module are required');
        return;
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create permission');

      setSuccess('Permission created successfully');
      await fetchPermissions({ page: 1 });
      resetForm();
      setView('list');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPermission?._id) return;

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      const res = await fetch(`${API_URL}/${selectedPermission._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update permission');

      setSuccess('Permission updated successfully');
      await fetchPermissions({ page: pagination.page });
      resetForm();
      setView('list');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this permission?')) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete permission');

      await fetchPermissions({ page: pagination.page });

    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (perm) => {
    setSelectedPermission(perm);
    setFormData({
      name: perm.name,
      slug: perm.slug,
      module: perm.module,
      description: perm.description || '',
    });
    setView('edit');
  };

  // Helper arrays
  const moduleOptions = [...new Set(permissions.map(p => p.module))].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-indigo-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Permissions</h1>
                <p className="text-slate-600 text-sm mt-0.5">Manage system access controls</p>
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
                Add Permission
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {view === 'list' ? (
             <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                       {/* Search and Filter Controls - Similar to Department Page */}
                       <div className="flex-1 flex gap-4">
                           <div className="relative flex-1 max-w-md">
                               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                               <input
                                   type="text"
                                   placeholder="Search permissions..."
                                   value={searchTerm}
                                   onChange={(e) => setSearchTerm(e.target.value)}
                                   className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                               />
                           </div>
                           <select
                               value={moduleFilter}
                               onChange={(e) => setModuleFilter(e.target.value)}
                               className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                           >
                               <option value="all">All Modules</option>
                               {moduleOptions.map(m => (
                                   <option key={m} value={m}>{m}</option>
                               ))}
                           </select>
                       </div>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                              <th className="px-6 py-4">Name</th>
                              <th className="px-6 py-4">Slug</th>
                              <th className="px-6 py-4">Module</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {loading ? (
                              <tr><td colSpan="4" className="text-center py-8">Loading...</td></tr>
                          ) : permissions.length === 0 ? (
                              <tr><td colSpan="4" className="text-center py-8 text-slate-500">No permissions found</td></tr>
                          ) : (
                              permissions.map((perm) => (
                                  <tr key={perm._id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4 font-medium text-slate-900">{perm.name}</td>
                                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{perm.slug}</td>
                                      <td className="px-6 py-4">
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                              {perm.module}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right space-x-2">
                                          <button
                                              onClick={() => handleEdit(perm)}
                                              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                                          >
                                              <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                              onClick={() => handleDelete(perm._id)}
                                              className="p-1 hover:bg-red-50 rounded text-slate-500 hover:text-red-600 transition-colors"
                                          >
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
             </div>
        ) : (
             <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-8 py-6 flex items-center justify-between">
                     <h2 className="text-xl font-bold text-slate-900">
                         {view === 'create' ? 'Create Permission' : 'Edit Permission'}
                     </h2>
                     <button onClick={() => setView('list')} className="text-slate-500 hover:text-slate-700">
                         <X className="w-5 h-5" />
                     </button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      {error && (
                          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                              <AlertCircle className="w-5 h-5" />
                              {error}
                          </div>
                      )}

                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Permission Name *</label>
                              <input
                                  type="text"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                  placeholder="e.g. Manage Employees"
                              />
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
                              <input
                                  type="text"
                                  name="slug"
                                  value={formData.slug}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-mono text-sm"
                                  placeholder="e.g. manage_employees"
                              />
                              <p className="text-xs text-slate-500 mt-1">Unique identifier used in code</p>
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Module *</label>
                              <input
                                  type="text"
                                  name="module"
                                  value={formData.module}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                  placeholder="e.g. CRM, Payroll, HR"
                              />
                          </div>
                          
                           <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                              <textarea
                                  name="description"
                                  value={formData.description}
                                  onChange={handleInputChange}
                                  rows={3}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                  placeholder="Describe what this permission allows..."
                              />
                          </div>
                      </div>

                      <div className="flex justify-end pt-6 border-t border-slate-100">
                          <button
                              onClick={() => setView('list')}
                              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg mr-2"
                          >
                              Cancel
                          </button>
                          <button
                              onClick={view === 'create' ? handleCreate : handleUpdate}
                              disabled={isSubmitting}
                              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                          >
                              <Save className="w-4 h-4" />
                              {isSubmitting ? 'Saving...' : 'Save Permission'}
                          </button>
                      </div>
                  </div>
             </div>
        )}
      </div>
    </div>
  );
}
