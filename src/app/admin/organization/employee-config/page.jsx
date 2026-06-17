'use client';

import { useState, useEffect } from 'react';

export default function EmployeeConfigPage() {
  const [employeeConfigs, setEmployeeConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    organizationId: '',
    employeeTypeId: '',
    departmentId: '',
    employeeCategoryId: '',
    employeeSubCategoryId: '',
  });

  // Fetch all employee configs
  const fetchEmployeeConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employee-configs');
      if (!response.ok) throw new Error('Failed to fetch employee configs');
      const data = await response.json();
      setEmployeeConfigs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeConfigs();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await fetch('/api/employee-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create employee config');
      }

      const newConfig = await response.json();
      setEmployeeConfigs(prev => [...prev, newConfig]);
      setFormData({
        organizationId: '',
        employeeTypeId: '',
        departmentId: '',
        employeeCategoryId: '',
        employeeSubCategoryId: '',
      });
      alert('Employee configuration created successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete employee config
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      const response = await fetch(`/api/employee-configs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete employee config');

      setEmployeeConfigs(prev => prev.filter(config => config._id !== id));
      alert('Employee configuration deleted successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Employee Configurations</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Employee Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization ID
            </label>
            <input
              type="text"
              name="organizationId"
              value={formData.organizationId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Type ID
            </label>
            <input
              type="text"
              name="employeeTypeId"
              value={formData.employeeTypeId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department ID
            </label>
            <input
              type="text"
              name="departmentId"
              value={formData.departmentId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Category ID
            </label>
            <input
              type="text"
              name="employeeCategoryId"
              value={formData.employeeCategoryId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee SubCategory ID
            </label>
            <input
              type="text"
              name="employeeSubCategoryId"
              value={formData.employeeSubCategoryId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-slate-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Configuration
        </button>
      </form>

      {/* Employee Configs List */}
      <div className="bg-white rounded-lg">
        <h2 className="text-xl font-semibold p-6 border-b">Existing Configurations</h2>

        {employeeConfigs.length === 0 ? (
          <p className="p-6 text-gray-500">No employee configurations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SubCategory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employeeConfigs.map((config) => (
                  <tr key={config._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {config.organizationId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {config.employeeTypeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {config.departmentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {config.employeeCategoryId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {config.employeeSubCategoryId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(config._id)}
                        className="text-red-600 hover:text-red-900 ml-4"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}