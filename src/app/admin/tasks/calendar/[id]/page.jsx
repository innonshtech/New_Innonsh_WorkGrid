'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar, User, Flag, Tag, Clock, FileText,
  Target, Users, Activity, Star, CheckCircle,
  TrendingUp, Info, Zap, XCircle
} from 'lucide-react';

// --- Helper Components for better readability/reusability (not strictly necessary but good practice) ---
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-blue-50 p-8">
    <div className="max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-slate-200 mb-8 p-6 rounded-xl animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content Skeleton */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-100 rounded"></div>
            <div className="h-24 bg-slate-100 rounded"></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-10 bg-slate-100 rounded"></div>
              <div className="h-10 bg-slate-100 rounded"></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-20 bg-slate-100 rounded"></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-10 bg-slate-100 rounded"></div>
              <div className="h-10 bg-slate-100 rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-10 bg-slate-100 rounded"></div>
              <div className="h-10 bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
// --- End Helper Components ---


export default function ViewTaskPage() {
  const params = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignedEmployee, setAssignedEmployee] = useState(null);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState(null); // New state for employee fetch error

  // Use memoization for stability, though the original version's functions were fine
  const taskId = useMemo(() => params.id, [params.id]);

  // Use useCallback to prevent unnecessary re-creations
  const fetchEmployeeDetails = useCallback(async (employeeId) => {
    setEmployeesLoading(true);
    setEmployeeError(null);
    try {
      const response = await fetch(`/api/v1/admin/payroll/employees/${employeeId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.employee) {
          const emp = result.employee;
          setAssignedEmployee({
            name: `${emp.personalDetails.firstName} ${emp.personalDetails.lastName}`,
            email: emp.personalDetails.email,
            role: emp.jobDetails.designation,
            department: emp.jobDetails.department,
            employeeId: emp.employeeId,
            workLocation: emp.jobDetails.workLocation
          });
        } else {
          // Explicitly handle case where response is OK but employee is null/undefined
          setAssignedEmployee(null);
          setEmployeeError(`Employee ID ${employeeId} not found.`);
        }
      } else {
        const errorResult = await response.json();
        setAssignedEmployee(null);
        setEmployeeError(errorResult.error || `Failed to fetch employee details for ID ${employeeId}`);
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      setAssignedEmployee(null);
      setEmployeeError('A network error occurred while fetching employee details.');
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/tasks/${taskId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch task');
      }

      setTask(result.task);

      // Fetch assigned employee details if assignedTo exists
      if (result.task.assignedTo) {
        fetchEmployeeDetails(result.task.assignedTo);
      } else {
        setAssignedEmployee(null);
      }

    } catch (err) {
      console.error('Error fetching task:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId, fetchEmployeeDetails]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]); // Dependency on memoized fetchTask

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // NEW: Added Time to the format
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'low': return 'text-slate-600 bg-blue-50 border-slate-200';
      default: return 'text-slate-600 bg-blue-50 border-slate-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'blocked': return 'text-red-600 bg-red-50 border-red-200';
      case 'deferred': return 'text-slate-600 bg-blue-50 border-slate-200';
      default: return 'text-slate-600 bg-blue-50 border-slate-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'development': return Zap; // Changed from FileText for more flair
      case 'design': return Star;
      case 'testing': return CheckCircle;
      case 'documentation': return FileText;
      case 'meeting': return Users;
      case 'support': return Activity;
      case 'other': return Target;
      default: return Target;
    }
  };

  if (loading) {
    return <LoadingSkeleton />; // Enhanced loading state
  }

  if (error || !task) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-center bg-white m-8 rounded-xl border border-slate-200">
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Task Not Found</h2>
        <p className="text-slate-600 max-w-md">{error || `The requested task with ID ${taskId} could not be found.`}</p>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(task.category);
  const isCompleted = task.status?.toLowerCase() === 'completed';

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-indigo-500 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Task Details</h1>
                <p className="text-slate-600 text-sm mt-0.5 font-medium">Task ID: <span className="font-mono text-xs">{task._id || task.id}</span></p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                <span className="capitalize">{task.status || 'No status'}</span>
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                <span className="capitalize">{task.priority || 'No priority'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  Basic Information
                </h2>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Task Title</label>
                  <div className="text-lg font-semibold text-slate-900 p-3 bg-blue-50 rounded-lg border border-slate-200">
                    {task.title || 'No title'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <div className="text-slate-700 p-3 bg-blue-50 rounded-lg border border-slate-200 min-h-[100px] whitespace-pre-wrap">
                    {task.description || <span className="text-slate-500">No description provided.</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-slate-200">
                      <CategoryIcon className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-700">{task.category || 'Other'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated Hours</label>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-slate-200">
                      <Clock className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-700">
                        {task.estimatedHours !== undefined && task.estimatedHours !== null ? task.estimatedHours : 0} hours
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment & Timeline */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  Assignment & Timeline
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Assign To Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Assign To</label>
                  {employeesLoading ? (
                    <div className="flex items-center space-x-2 py-3 px-4 border border-slate-300 rounded-lg bg-blue-50">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                      <span className="text-slate-500 text-sm">Loading employee details...</span>
                    </div>
                  ) : assignedEmployee ? (
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{assignedEmployee.name}</div>
                          <div className="text-sm text-slate-600">
                            {assignedEmployee.role} • {assignedEmployee.department}
                          </div>
                          <div className="text-sm text-slate-600">
                            {assignedEmployee.email} • {assignedEmployee.workLocation}
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            Employee ID: {assignedEmployee.employeeId}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : employeeError ? ( // Handle explicit employee fetch error
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 flex items-center space-x-2">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">{employeeError}</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 rounded-lg border border-slate-200 text-slate-500">
                      Not assigned to any employee
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                    <div className={`p-3 rounded-lg border ${getStatusColor(task.status)}`}>
                      <span className="font-medium capitalize">{task.status || 'Not set'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                    <div className={`p-3 rounded-lg border ${getPriorityColor(task.priority)}`}>
                      <span className="font-medium capitalize">{task.priority || 'Not set'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Created Date</label>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-slate-200">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-700">{formatDate(task.createdAt)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-slate-200">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-700">{formatDate(task.dueDate)}</span>
                    </div>
                  </div>

                  {/* NEW: Completed Date */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Completed Date</label>
                    <div className={`flex items-center gap-2 p-3 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-slate-200'}`}>
                      <Calendar className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-slate-600'}`} />
                      <span className="text-slate-700">{isCompleted ? formatDate(task.completedAt) : 'N/A'}</span>
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
              </div>

              <div className="p-6 space-y-6">
                {/* Tags Section */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
                  {task.tags?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-slate-200">
                      {task.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 rounded-lg border border-slate-200 text-slate-500">
                      No tags applied.
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Notes</label>
                  <div className="text-slate-700 p-3 bg-blue-50 rounded-lg border border-slate-200 whitespace-pre-wrap min-h-[50px]">
                    {task.notes || <span className="text-slate-500">No additional notes provided.</span>}
                  </div>
                </div>

                {/* Dependencies */}
                {task.dependencies?.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Dependencies</label>
                    <div className="p-3 bg-blue-50 rounded-lg border border-slate-200">
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {task.dependencies.map((dep, index) => (
                          <li key={index} className="pl-1">{dep}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
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
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-600">Status:</span>
                  <span className={`font-medium capitalize ${getStatusColor(task.status).split(' ')[0]}`}>{task.status || 'Not set'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-600">Priority:</span>
                  <span className={`font-medium capitalize ${getPriorityColor(task.priority).split(' ')[0]}`}>{task.priority || 'Not set'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-600">Category:</span>
                  <span className="font-medium text-slate-900">{task.category || 'Other'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-600">Assigned To:</span>
                  <span className="font-medium text-slate-900 text-right">
                    {assignedEmployee ? assignedEmployee.name : 'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-600">Estimated Hours:</span>
                  <span className="font-medium text-slate-900">
                    {task.estimatedHours !== undefined && task.estimatedHours !== null ? task.estimatedHours : 0} hours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tags Count:</span>
                  <span className="font-medium text-slate-900">{task.tags?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Metadata & Audit
                </h3>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Created:</span>
                  <span className="font-medium text-slate-900 text-right">{formatDateTime(task.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Last Updated:</span>
                  {/* Used formatDateTime for more precision on update time */}
                  <span className="font-medium text-slate-900 text-right">{formatDateTime(task.updatedAt)}</span>
                </div>
                {isCompleted && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Completed On:</span>
                    <span className="font-medium text-green-700 text-right">{formatDateTime(task.completedAt)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed pt-4 mt-4">
                  <span className="text-slate-600">Task ID:</span>
                  <span className="font-medium text-slate-900 font-mono text-xs text-right">{task._id || task.id}</span>
                </div>
                {task.assignedBy && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Creator/Assigned By:</span>
                    <span className="font-medium text-slate-900 text-right">{task.assignedBy.name || 'System'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}