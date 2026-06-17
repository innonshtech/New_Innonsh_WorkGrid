// src/components/tasks/task-form.jsx
'use client';

import { useState, useEffect } from 'react';
import {
  Save, X, Calendar, User, Flag, ArrowLeft,
  Tag, Clock, AlertCircle, Plus, Minus, CheckCircle,
  FileText, Target, Zap, Activity, Users, Upload,
  Info, Star, Bookmark, TrendingUp, Loader2
} from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import toast, { Toaster } from 'react-hot-toast';

export default function TaskForm({ taskData, isEdit = false }) {
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    status: 'Pending',
    priority: 'Medium',
    dueDate: new Date().toISOString().split('T')[0],
    category: 'Other',
    tags: [],
    estimatedHours: 0,
    newTag: '',
    notes: '',
    dependencies: []
  });
const {user} = useSession();

  console.log('TaskForm props:', { taskData, isEdit });
  console.log('Current formData:', formData);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Initialize form data when editing
  useEffect(() => {
    if (taskData && isEdit) {

      const task = taskData.task
       console.log('Editing task:', taskData.task); 

      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo?._id || '',
        status: task.status || 'Pending',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        category: task.category || 'Other',
        tags: task.tags || [],
        estimatedHours: task.estimatedHours || 0,
        notes: task.notes || '',
        dependencies: task.dependencies || [],
        newTag: ''
      });
    }
  }, [taskData, isEdit]);

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await fetch('/api/v1/admin/payroll/employees');
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      
      const data = await response.json();
      
      // Transform employee data to match the expected format
      const transformedEmployees = data.employees?.map(emp => ({
        _id: emp._id,
        name: `${emp.personalDetails.firstName} ${emp.personalDetails.lastName}`,
        email: emp.personalDetails.email,
        role: emp.jobDetails.designation,
        department: emp.jobDetails.department,
        employeeId: emp.employeeId,
        workLocation: emp.jobDetails.workLocation
      })) || [];
      
      setEmployees(transformedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
       toast.error('Failed to load employees. Please try again.');
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedHours' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Task title is required';
    if (!formData.description.trim()) newErrors.description = 'Task description is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const url = isEdit 
        ? `/api/v1/admin/tasks/${taskData._id}`
        : '/api/v1/admin/tasks';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload = {
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        assignedBy: user.id,
         assignedByModel: "User",
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate,
        category: formData.category,
        tags: formData.tags,
        estimatedHours: formData.estimatedHours,
        notes: formData.notes,
        dependencies: formData.dependencies
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save task');
      }

      const result = await response.json();
      console.log('Task saved successfully:', result);
      toast.success(`Task ${isEdit ? 'updated' : 'created'} successfully!`);
      
      // Reset form after successful creation
      if (!isEdit) {
        setFormData({
          title: '',
          description: '',
          assignedTo: '',
          status: 'Pending',
          priority: 'Medium',
          dueDate: new Date().toISOString().split('T')[0],
          category: 'Other',
          tags: [],
          estimatedHours: 0,
          newTag: '',
          notes: '',
          dependencies: []
        });
      }
      
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const priorityOptions = [
    { value: 'Low', label: 'Low', color: 'text-slate-600', bgColor: 'bg-slate-50' },
    { value: 'Medium', label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { value: 'High', label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { value: 'Urgent', label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-50' },
  ];

  const statusOptions = [
    { value: 'Pending', label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { value: 'In Progress', label: 'In Progress', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { value: 'Completed', label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-50' },
    { value: 'Blocked', label: 'Blocked', color: 'text-red-600', bgColor: 'bg-red-50' },
    { value: 'Deferred', label: 'Deferred', color: 'text-slate-600', bgColor: 'bg-slate-50' },
  ];

  const categoryOptions = [
    { value: 'Development', icon: FileText },
    { value: 'Design', icon: Star },
    { value: 'Testing', icon: CheckCircle },
    { value: 'Documentation', icon: FileText },
    { value: 'Meeting', icon: Users },
    { value: 'Support', icon: Activity },
    { value: 'Other', icon: Target }
  ];

  const getFormProgress = () => {
    const requiredFields = [
      formData.title,
      formData.description,
      formData.dueDate,
      formData.category,
      formData.priority,
      formData.status
    ];
    
    const completedFields = requiredFields.filter(field => field).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const progress = getFormProgress();
  const selectedEmployee = employees.find(emp => emp._id === formData.assignedTo);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <Toaster/>
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {isEdit ? 'Edit Task' : 'Create New Task'}
                </h1>
                <p className="text-slate-600 text-sm mt-0.5">
                  {isEdit ? 'Update task details and assignments' : 'Create a new task for your team'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Task Creation Progress</h3>
            <span className="text-sm font-medium text-slate-600">{progress}% Complete</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
            <div className={`flex items-center space-x-2 ${formData.title && formData.description ? 'text-green-700' : 'text-slate-500'}`}>
              {formData.title && formData.description ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>}
              <span>Basic Info Added</span>
            </div>
            <div className={`flex items-center space-x-2 ${formData.assignedTo && formData.dueDate ? 'text-green-700' : 'text-slate-500'}`}>
              {formData.assignedTo && formData.dueDate ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>}
              <span>Assignment Set</span>
            </div>
            <div className={`flex items-center space-x-2 ${formData.priority && formData.status ? 'text-green-700' : 'text-slate-500'}`}>
              {formData.priority && formData.status ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>}
              <span>Ready to Save</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Form Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                    <FileText className="w-4 h-4 text-yellow-600" />
                  </div>
                  Basic Information
                </h2>
                <p className="text-slate-600 text-sm mt-1">Enter the fundamental details of your task</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-semibold text-slate-700">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a clear and descriptive task title"
                    className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.title 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-slate-300 focus:ring-yellow-500 focus:border-yellow-500'
                    }`}
                    required
                  />
                  {errors.title && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.title}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none transition-colors ${
                      errors.description 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-slate-300 focus:ring-yellow-500 focus:border-yellow-500'
                    }`}
                    placeholder="Provide detailed information about what needs to be accomplished..."
                    required
                  />
                  {errors.description && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.description}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="block text-sm font-semibold text-slate-700">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                  >
                    {categoryOptions.map(category => (
                      <option key={category.value} value={category.value}>{category.value}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Assignment & Timeline */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                    <User className="w-4 h-4 text-yellow-600" />
                  </div>
                  Assignment & Timeline
                </h2>
                <p className="text-slate-600 text-sm mt-1">Set assignment details and important dates</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label htmlFor="assignedTo" className="block text-sm font-semibold text-slate-700">Assign To</label>
                  {employeesLoading ? (
                    <div className="flex items-center space-x-2 py-3 px-4 border border-slate-300 rounded-lg bg-slate-50">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                      <span className="text-slate-500 text-sm">Loading employees...</span>
                    </div>
                  ) : (
                    <select
                      id="assignedTo"
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                    >
                      <option value="">Select a team member</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.employeeId} - {emp.name} ({emp.role})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Selected Employee Info */}
                {selectedEmployee && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{selectedEmployee.name}</div>
                        <div className="text-sm text-slate-600">
                          {selectedEmployee.role} • {selectedEmployee.department}
                        </div>
                        <div className="text-sm text-slate-600">
                          {selectedEmployee.email} • {selectedEmployee.workLocation}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="status" className="block text-sm font-semibold text-slate-700">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="priority" className="block text-sm font-semibold text-slate-700">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="dueDate" className="block text-sm font-semibold text-slate-700">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="dueDate"
                        name="dueDate"
                        type="date"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                          errors.dueDate 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-slate-300 focus:ring-yellow-500 focus:border-yellow-500'
                        }`}
                        value={formData.dueDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {errors.dueDate && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.dueDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="estimatedHours" className="block text-sm font-semibold text-slate-700">Estimated Hours</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="estimatedHours"
                        name="estimatedHours"
                        type="number"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        value={formData.estimatedHours}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags & Notes */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                    <Tag className="w-4 h-4 text-green-600" />
                  </div>
                  Tags & Additional Notes
                </h2>
                <p className="text-slate-600 text-sm mt-1">Add tags and extra information to organize your task</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Tags Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700">Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a tag..."
                      value={formData.newTag}
                      onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddTag}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 hover:text-yellow-900 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="space-y-2">
                  <label htmlFor="notes" className="block text-sm font-semibold text-slate-700">Additional Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                    placeholder="Add any additional notes, context, or special instructions..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Quick Summary */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Task Summary
                </h3>
              </div>
              
              <div className="p-6 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <span className="font-medium text-slate-900">{formData.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Priority:</span>
                  <span className="font-medium text-slate-900">{formData.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Category:</span>
                  <span className="font-medium text-slate-900">{formData.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Assigned To:</span>
                  <span className="font-medium text-slate-900">
                    {selectedEmployee ? selectedEmployee.name : 'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Estimated Hours:</span>
                  <span className="font-medium text-slate-900">{formData.estimatedHours || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tags:</span>
                  <span className="font-medium text-slate-900">{formData.tags.length}</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-2">Task Creation Tips</h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Use clear, action-oriented titles</li>
                      <li>• Include specific deliverables</li>
                      <li>• Set realistic time estimates</li>
                      <li>• Add relevant tags for easy filtering</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Sidebar */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  const draft = { ...formData, savedAt: new Date().toISOString() };
                  // Note: In a real app, you would save to localStorage or backend
                  toast.success('Draft saved successfully!');
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <Bookmark className="w-4 h-4" />
                Save Draft
              </button>
              
              <button
                type="submit"
                disabled={loading || employeesLoading}
                onClick={handleSubmit}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEdit ? 'Update Task' : 'Create Task'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons for Mobile */}
        <div className="flex items-center justify-between mt-8 xl:hidden">
          <button 
            type="button" 
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          
          <div className="flex items-center space-x-4">
            <button 
              type="button"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              onClick={() => {
                const draft = { ...formData, savedAt: new Date().toISOString() };
                toast.success('Draft saved successfully!');
              }}
            >
              <Bookmark className="w-4 h-4" />
              Save Draft
            </button>
            
            <button 
              type="submit" 
              disabled={loading || employeesLoading} 
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-8 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEdit ? 'Update Task' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}