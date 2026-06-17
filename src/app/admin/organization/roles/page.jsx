'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';

const PERMISSION_MODULES = {
  Employees: ['employees.view', 'employees.manage'],
  Payroll: ['payroll.view', 'payroll.manage'],
  Attendance: ['attendance.view', 'attendance.manage'],
  Leaves: ['leaves.view', 'leaves.manage'],
  Finance: ['finance.view', 'finance.manage'],
  Settings: ['settings.manage'],
};

export default function RolesManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/v1/admin/roles');
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles);
      } else {
        setError(data.error?.message || 'Failed to fetch roles');
      }
    } catch (err) {
      setError('Network error loading roles');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (perm) => {
    setFormData(prev => {
      const perms = prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm];
      return { ...prev, permissions: perms };
    });
  };

  const handleSave = async () => {
    try {
      const url = editingRole ? `/api/v1/admin/roles/${editingRole._id}` : '/api/v1/admin/roles';
      const method = editingRole ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        fetchRoles();
        setIsModalOpen(false);
        setEditingRole(null);
      } else {
        alert(data.error?.message || 'Error saving role');
      }
    } catch (err) {
      alert('Error saving role');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this role? Users with this role will lose their permissions.')) return;
    
    try {
      const res = await fetch(`/api/v1/admin/roles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRoles(roles.filter(r => r._id !== id));
      } else {
        alert(data.error?.message || 'Error deleting role');
      }
    } catch (err) {
      alert('Error deleting role');
    }
  };

  const openNewModal = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    if (role.isSystemRole) {
      alert("System roles cannot be edited.");
      return;
    }
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '', permissions: role.permissions || [] });
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8">Loading roles...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-indigo-600" />
            Roles & Permissions
          </h1>
          <p className="text-gray-500 mt-1">Manage access control and define custom roles for your organization.</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {roles.map(role => (
          <div key={role._id} className="bg-white border border-gray-200 rounded-xl p-5 hover: transition-">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                  {role.isSystemRole && (
                    <span className="ml-3 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full font-medium">System Role</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{role.description || 'No description provided.'}</p>
              </div>
              
              {!role.isSystemRole && (
                <div className="flex space-x-2">
                  <button onClick={() => openEditModal(role)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(role._id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {role.permissions.map(perm => (
                <span key={perm} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-100 font-medium">
                  {perm}
                </span>
              ))}
              {role.permissions.length === 0 && (
                <span className="text-xs text-gray-400 italic">No permissions assigned</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-150">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {editingRole ? 'Edit Role' : 'Create Custom Role'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1 no-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Role Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all"
                    placeholder="e.g., HR Assistant"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all"
                    placeholder="Brief description of this role"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Assign Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(PERMISSION_MODULES).map(([moduleName, perms]) => (
                    <div key={moduleName} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3">{moduleName}</h4>
                      <div className="space-y-2">
                        {perms.map(perm => (
                          <label key={perm} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm)}
                              onChange={() => handleTogglePermission(perm)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 font-mono">{perm}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
