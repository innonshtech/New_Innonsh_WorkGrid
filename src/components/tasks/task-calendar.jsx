'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Calendar, Plus, ArrowLeft,
  CheckCircle, Clock, AlertCircle, User, Activity,
  Zap, Timer, Target, TrendingUp, Filter, RefreshCw,
  Eye, Edit, Bookmark, Star, Settings,
  ChevronDown, Grid3X3, List, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/context/SessionContext';

export default function TaskCalendar() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { user } = useSession();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const endpoint = '/api/v1/admin/tasks';

      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok) {
        setTasks(data.data);
      } else {
        console.error('Failed to fetch tasks:', data.error);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Add this function to filter tasks based on user role
  const getFilteredTasks = (tasks) => {
    if (!tasks || !user) return [];

    // If user is an employee, only show tasks assigned to them
    if (user.role === "Employee") {
      return tasks.filter(task => {
        // Check if the task is assigned to the current user
        return task.assignedTo && task.assignedTo._id === user.id;
      });
    }

    // For other roles (Admin, Manager, etc.), show all tasks
    return tasks;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getTasksForDate = (date) => {
    // Use the filtered tasks based on user role
    const filteredTasks = getFilteredTasks(tasks);

    let dateFilteredTasks = filteredTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });

    if (priorityFilter) {
      dateFilteredTasks = dateFilteredTasks.filter(task => task.priority === priorityFilter);
    }
    if (statusFilter) {
      dateFilteredTasks = dateFilteredTasks.filter(task => task.status === statusFilter);
    }

    return dateFilteredTasks;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
      'In Progress': { color: 'bg-slate-50 text-blue-700 border-blue-200', icon: Activity },
      Completed: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
      Blocked: { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
    };

    const { color, icon: Icon } = statusConfig[status] || statusConfig.Pending;

    return (
      <Badge className={`${color} border flex items-center gap-1 font-medium text-xs`}>
        <Icon className="h-2 w-2" />
        {status}
      </Badge>
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 border-red-300 text-red-700';
      case 'High': return 'bg-orange-100 border-orange-300 text-orange-700';
      case 'Medium': return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'Low': return 'bg-slate-100 border-slate-300 text-slate-700';
      default: return 'bg-slate-100 border-slate-300 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'In Progress': return <Activity className="h-3 w-3 text-blue-600" />;
      case 'Pending': return <Clock className="h-3 w-3 text-amber-600" />;
      case 'Blocked': return <AlertCircle className="h-3 w-3 text-red-600" />;
      default: return <Clock className="h-3 w-3 text-slate-600" />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'Urgent': return <Zap className="h-3 w-3" />;
      case 'High': return <Star className="h-3 w-3" />;
      case 'Medium': return <Target className="h-3 w-3" />;
      case 'Low': return <Timer className="h-3 w-3" />;
      default: return <Timer className="h-3 w-3" />;
    }
  };

  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isOverdue = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const weeks = [];
    let day = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];

      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < firstDay) || day > daysInMonth) {
          week.push(<div key={j} className="h-28 p-1 border border-slate-100"></div>);
        } else {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dateTasks = getTasksForDate(date);
          const hasOverdue = dateTasks?.some(task =>
            task.status !== 'Completed' && isOverdue(new Date(task.dueDate))
          );

          week.push(
            <div
              key={j}
              className={`h-28 p-2 border cursor-pointer transition-all duration-200 hover: ${isToday(date) ? 'bg-yellow-50 border-yellow-300' :
                isSelected(date) ? 'bg-slate-50 border-blue-300' :
                  hasOverdue ? 'bg-red-50 border-red-200' :
                    'border-slate-200 hover:bg-slate-50'
                }`}
              onClick={() => setSelectedDate(date)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-semibold ${isToday(date) ? 'text-yellow-700' :
                  isSelected(date) ? 'text-blue-700' :
                    hasOverdue ? 'text-red-700' :
                      'text-slate-700'
                  }`}>
                  {day}
                </span>
                <div className="flex items-center gap-1">
                  {dateTasks?.length > 0 && (
                    <Badge className="h-5 px-1.5 text-xs bg-slate-100 text-slate-700 border border-slate-300">
                      {dateTasks.length}
                    </Badge>
                  )}
                  {hasOverdue && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>

              <div className="space-y-1 max-h-16 overflow-y-auto">
                {dateTasks?.slice(0, 2).map((task) => (
                  <div
                    key={task._id || task.id}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs border ${getPriorityColor(task.priority)}`}
                    title={`${task.title} - ${task.priority} Priority`}
                  >
                    {getPriorityIcon(task.priority)}
                    <span className="truncate font-medium">{task.title}</span>
                  </div>
                ))}
                {dateTasks?.length > 2 && (
                  <div className="text-xs text-slate-500 text-center font-medium">
                    +{dateTasks.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
          day++;
        }
      }

      weeks.push(
        <div key={i} className="grid grid-cols-7 gap-1">
          {week}
        </div>
      );

      if (day > daysInMonth) break;
    }

    return weeks;
  };

  const getSelectedDateTasks = () => {
    return getTasksForDate(selectedDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCalendarStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredTasks = getFilteredTasks(tasks);

    return {
      total: filteredTasks.length,
      completed: filteredTasks.filter(t => t.status === 'Completed').length,
      overdue: filteredTasks.filter(t =>
        new Date(t.dueDate) < today && t.status !== 'Completed'
      ).length,
      thisMonth: filteredTasks.filter(t => {
        const taskDate = new Date(t.dueDate);
        return taskDate.getMonth() === currentDate.getMonth() &&
          taskDate.getFullYear() === currentDate.getFullYear();
      }).length
    };
  };

  const stats = getCalendarStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Task Calendar</h1>
                <p className="text-slate-600 text-sm mt-0.5">Loading your calendar view...</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-200 border-t-yellow-500"></div>
              <p className="text-slate-600 font-medium">Loading calendar...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Task Calendar</h1>
                <p className="text-slate-600 text-sm mt-0.5">Visualize and manage your task timeline</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh calendar"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2.5 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                title="Toggle filters"
              >
                <Filter className="h-5 w-5" />
              </button>

              {user?.role !== "Employee" && (
                <Link href="/tasks/create">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Statistics Overview */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  Calendar Overview
                </h2>
                <p className="text-slate-600 text-sm mt-1">Task distribution and performance metrics</p>
              </div>
              <div className="text-sm text-slate-500">
                {currentDate.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-slate-600" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-slate-600 text-sm font-medium">Total Tasks</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </div>
                </div>
                <p className="text-green-600 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>

                </div>
                <p className="text-red-600 text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                  </div>
                  <Star className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-yellow-600 text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.thisMonth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                  <Filter className="w-4 h-4 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Calendar Filters</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>

              {(priorityFilter || statusFilter) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setPriorityFilter('');
                      setStatusFilter('');
                    }}
                    className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar Navigation & Controls */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth(-1)}
                  className="px-3 py-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <h2 className="text-2xl font-bold text-slate-900">
                  {currentDate.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'long', year: 'numeric' })}
                </h2>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth(1)}
                  className="px-3 py-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentDate(new Date());
                    setSelectedDate(new Date());
                  }}
                  className="px-4 py-2"
                >
                  Today
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span className="text-slate-600">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                <span className="text-slate-600">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-slate-600">Has Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-slate-600">Overdue Indicator</span>
              </div>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-slate-700 py-3 bg-slate-50 rounded-lg">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="space-y-1">
              {renderCalendar()}
            </div>
          </div>
        </div>

        {/* Selected Date Tasks */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  Tasks for {formatDate(selectedDate)}
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                  {getSelectedDateTasks()?.length} task{getSelectedDateTasks()?.length !== 1 ? 's' : ''} due on this date
                </p>
              </div>
              {isToday(selectedDate) && (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 font-medium">
                  Today
                </Badge>
              )}
            </div>
          </div>

          <div className="p-6">
            {getSelectedDateTasks()?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">No tasks scheduled</h4>
                <p className="text-slate-600 mb-6">No tasks are due on {formatDate(selectedDate)}</p>
                {user?.role !== 'Employee' && (
                  <Link href="/tasks/create">
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 font-semibold">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task for This Date
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {getSelectedDateTasks()?.map((task) => (
                  <div
                    key={task._id || task.id}
                    className="group flex items-center justify-between p-4 border border-slate-200 rounded-lg hover: transition-all duration-200"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPriorityColor(task.priority)}`}>
                        {getPriorityIcon(task.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-yellow-600 transition-colors">{task.title}</h4>
                        <div className="flex items-center gap-3 text-sm">
                          {getStatusBadge(task.status)}
                          <Badge className={`${getPriorityColor(task.priority)} border font-medium`}>
                            {task.priority} Priority
                          </Badge>
                          {task.category && (
                            <span className="text-slate-500 font-medium">{task.category}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* <button
                        className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Bookmark task"
                      >
                        <Bookmark className="h-4 w-4" />
                      </button> */}
                      {/* <Link href={`/tasks/${task._id}?edit=true`}>
                        <Button variant="ghost" size="sm" className="px-3 py-1.5 opacity-0 group-hover:opacity-100">
                          <Edit className="h-3 w-3 mr-1.5" />
                          Edit
                        </Button>
                      </Link> */}
                      <Link href={`/tasks/calendar/${task._id}`}>
                        <Button variant="outline" size="sm" className="px-3 py-1.5">
                          <Eye className="h-3 w-3 mr-1.5" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}