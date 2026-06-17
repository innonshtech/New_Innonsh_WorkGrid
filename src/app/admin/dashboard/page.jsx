'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  CheckSquare, TrendingUp, Target, Zap, Activity, Calendar, FileText, ArrowUp, ArrowDown,
  ChevronRight, Plus, RefreshCw, Settings, PieChart, LineChart, Building2, Container, Timer,
  Boxes, CheckCircle2, AlertCircle, Star, Award, List, Users, Truck, Package, AlertTriangle,
  Clock, ShoppingCart, DollarSign, Globe, MapPin, Shield, Factory, Warehouse, BarChart3,
  UserCheck, ClipboardList, BarChart, Users2, Eye, Filter, Briefcase, Banknote,
  ArrowRight, Cpu, UserPlus
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSession } from '@/context/SessionContext';

const ResourceUtilization = dynamic(() => import('@/components/tasks/ResourceUtilization'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-slate-50 animate-pulse rounded-lg border border-slate-100">
      <div className="text-slate-400 font-medium flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        Loading Chart...
      </div>
    </div>
  )
});
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading: sessionLoading } = useSession();
  const { t } = useLanguage();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalEmployees: 0,
    pendingTimesheets: 0,
    averageProgress: 0,
    topProjects: [],
    topContributors: [],
    recentActivity: []
  });
  const router = useRouter();

  useEffect(() => {
    if (sessionLoading) return;

    try {
      if (user && user.role) {
        const userRole = user.role.toLowerCase();
        setRole(userRole);

        // Redirect specific roles to their dedicated dashboards
        if (userRole === 'attendance_only') {
          router.push('/admin/attendance');
        } else if (userRole === 'employee') {
          router.push('/employee/dashboard');
        }
      } else {
        setRole(null);
        router.push('/login');
      }
    } catch (err) {
      console.error('Failed to read user role from session', err);
      setRole(null);
    } finally {
      if (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super_admin') {
        fetchStats();
      } else {
        setLoading(false);
      }
    }
  }, [user, sessionLoading]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/admin/dashboard/stats');
      if (!res.ok) throw new Error("Failed to fetch statistics");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
        </div>
        <p className="text-slate-500 font-medium text-sm">{t("loadingDashboard")}</p>
      </div>
    );
  }

  // Admin & Super Admin Dashboard
  if (role === 'admin' || role === 'super_admin') {
    const adminStats = [
      {
        title: t("totalEmployees"),
        value: stats.totalEmployees.toString(),
        icon: Users,
        color: "from-blue-500 to-indigo-600",
        description: "Active workforce directory",
        href: '/admin/employees'
      },
      {
        title: t("activeProjects"),
        value: stats.activeProjects.toString(),
        icon: Briefcase,
        color: "from-indigo-500 to-violet-600",
        description: "Client projects tracking",
        href: '/admin/tasks/projects'
      },
      {
        title: t("activeTasks"),
        value: (stats.totalTasks - stats.completedTasks).toString(),
        icon: CheckSquare,
        color: "from-rose-500 to-pink-600",
        description: "Pending operational tasks",
        href: '/admin/tasks'
      },
      {
        title: t("pendingApprovals"),
        value: stats.pendingTimesheets.toString(),
        icon: Clock,
        color: "from-amber-500 to-orange-600",
        description: "Timesheets awaiting review",
        href: '/admin/tasks/approvals'
      }
    ];

    const quickActions = [
      {
        title: t("createNewProject"),
        icon: Plus,
        href: "/admin/tasks/projects",
        color: "bg-indigo-500",
        description: "Initiate new client milestone"
      },
      {
        title: t("employeeDirectory"),
        icon: Users,
        href: "/admin/employees",
        color: "bg-blue-500",
        description: "Manage system user profiles"
      },
      {
        title: t("payrollRun"),
        icon: Banknote,
        href: "/admin/payroll/run",
        color: "bg-emerald-500",
        description: "Execute monthly payroll batch"
      }
    ];

    return (
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in p-4 sm:p-6">
        {/* Header Banner Section (Staffing Hub Style) */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-800">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Cpu className="w-3.5 h-3.5 animate-pulse" /> {t("adminDashboard")} Suite v1.0
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                Enterprise Operations & HR Hub
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
                Manage your organizational workforce, track project timelines, execute precise automated payroll processes, and review regulatory statutory compliance.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/admin/employees/new")}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4" /> Add Employee
              </button>
              <button
                onClick={fetchStats}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-slate-700 transition-all active:scale-[0.98]"
                title="Refresh statistics"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" /> Refresh Stats
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {adminStats.map((card) => (
            <div
              key={card.title}
              onClick={() => router.push(card.href)}
              className="group relative bg-white hover:bg-slate-50/50 rounded-2xl p-5 border border-slate-200 hover: transition-all cursor-pointer overflow-hidden active:scale-[0.99]"
            >
              <div className="space-y-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">{card.value}</p>
                </div>
                <p className="text-xs font-medium text-slate-500 leading-tight">{card.description}</p>
              </div>
              {/* Hover arrow */}
              <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Access & Operations Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Area: Feeds and Widgets */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Recent Activity Feed */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600 animate-pulse" /> {t("recentActivity")}
                  </h3>
                  <p className="text-xs font-medium text-slate-400">Newly recorded audit and workforce modifications</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 no-scrollbar">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((log, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border-l-4 border-indigo-500 bg-indigo-50/10">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        log.action === 'created' ? 'bg-green-100 text-green-600' :
                        log.action === 'updated' ? 'bg-blue-100 text-blue-600' :
                        log.action === 'deleted' ? 'bg-red-100 text-red-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        <Zap className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-slate-900 capitalize">{log.entity} {log.action}</p>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-1">{log.description}</p>
                        <p className="text-[10px] text-slate-500 mt-1">By {log.performedBy?.name || 'System'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No recent activity found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Projects Tracker */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" /> {t("activeProjects")}
                  </h3>
                  <p className="text-xs font-medium text-slate-400">Current active customer milestones and progress</p>
                </div>
                <Link href="/admin/tasks/projects" className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 group">
                  {t("viewAll")} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {stats.topProjects.map((project, idx) => (
                  <div key={idx} className="bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl p-4 flex items-center justify-between transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200/50">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{project.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Manager: {project.projectManager ? `${project.projectManager.personalDetails.firstName} ${project.projectManager.personalDetails.lastName}` : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 w-1/3">
                      <div className="flex justify-between w-full text-[10px] font-black text-slate-600">
                        <span>PROGRESS</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.topProjects.length === 0 && (
                  <p className="text-center py-6 text-sm text-slate-400 font-medium">No active projects found.</p>
                )}
              </div>
            </div>

            {/* Resource Utilization Widget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 overflow-hidden">
              <div className="border-b border-slate-50 pb-4 mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" /> Resource Management
                </h3>
                <p className="text-xs font-medium text-slate-400">Total workforce workload allocation levels</p>
              </div>
              <ResourceUtilization />
            </div>
          </div>

          {/* Right Sidebar: Controls and Feeds */}
          <div className="space-y-6 sm:space-y-8">
            {/* Quick Actions Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" /> {t("quickActions")}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action, i) => (
                  <Link key={i} href={action.href}>
                    <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group cursor-pointer hover: active:scale-[0.99]">
                      <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors text-sm">{action.title}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{action.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-indigo-500 transition-all group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Team Contributions Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="border-b border-slate-50 pb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" /> Team Contributions
                </h3>
                <p className="text-xs font-medium text-slate-400">Top 5 workforce members by logged timesheet hours</p>
              </div>

              <div className="space-y-4">
                {stats.topContributors.map((contributor, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6.5 h-6.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black uppercase">
                          {contributor.name.charAt(0)}
                        </div>
                        <span className="text-slate-700 font-bold">{contributor.name}</span>
                      </div>
                      <span className="text-slate-900 font-black">{contributor.hours.toFixed(1)}h</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min((contributor.hours / 160) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {stats.topContributors.length === 0 && (
                  <p className="text-center py-4 text-xs text-slate-400 font-medium">No team timesheet data found.</p>
                )}
              </div>
            </div>

            {/* Operations ATS Integration Promo Banner */}
            <div 
              className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white overflow-hidden relative group cursor-pointer" 
              onClick={() => router.push('/admin/recruitment')}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Briefcase className="w-32 h-32" />
              </div>
              <h4 className="text-lg font-black mb-1">{t("recruitment")} Suite</h4>
              <p className="text-indigo-100 text-xs mb-4 leading-relaxed">Launch recruitments, monitor candidates, schedule evaluations and automate employee onboarding pipelines.</p>
              <div className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3.5 py-2 rounded-lg backdrop-blur-md text-xs font-bold border border-white/20 transition-all">
                {t("viewDetails")} <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unauthorized or no role
  return (
    <div className="p-6">
      <div className="text-center text-slate-500">{t("accessRestricted")}</div>
    </div>
  );
}