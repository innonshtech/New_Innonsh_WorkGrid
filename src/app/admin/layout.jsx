"use client";

import { useState, useEffect, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Cog,
  Users,
  CreditCard,
  CheckSquare,
  BarChart3,
  Menu,
  X,
  Award,
  ChevronDown,
  Home,

  User,
  Shield,
  Calculator,
  FileText,
  List,
  Plus,
  Target,
  Calendar,
  LogOut,
  UserCheck,
  Eye,
  ShoppingCart,
  History,
  Banknote,
  Aperture,
  BanknoteArrowUp,
  CalculatorIcon,
  File,
  Building2,
  ShieldCheck,
  Contact,
  CalendarRange,
  Receipt,
  Clock,
  Lock,
  GitGraph,
  Settings2,
  Briefcase,
  Bell,
  Monitor,
  BookOpen,
  MessageSquare,
  ListTodo,
} from "lucide-react";
import "../globals.css";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";
import SetupWizard from "@/components/ui/SetupWizard";
import { Toaster } from "sonner";
import {
  Languages,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

function DashboardLayoutContent({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const { user, loading: isLoading, logout } = useSession();
  const { locale, changeLanguage, t } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [unreadCount, setUnreadCount] = useState(0);

  // Auto-close sidebar on mobile when page route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (user) {
      setRole(user.role);
      setLoadingRole(false);
      fetchUnreadNotifications();
    } else {
      // If session check finished but there is no user, stop loading and redirect
      setLoadingRole(false);
      if (pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [user, isLoading, router, pathname]);

  // Poll for notifications every minute
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchUnreadNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await fetch('/api/v1/admin/notifications');
      const data = await res.json();
      if (data.success) {
        const unread = data.notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  const toggleMenu = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const isActive = (href) => {
    if (!pathname) return false;

    // Custom check for Workflow Payroll v2 default tab when no parameter is present
    if (pathname === '/admin/payroll/v2' && !searchParams.get('tab')) {
      if (href === '/admin/payroll/v2?tab=dashboard') return true;
    }

    // Check if the link itself contains a query param (e.g., /ess?tab=timesheets)
    const hrefHasParams = href.includes('?');
    const [hrefPath, hrefQuery] = href.split('?');

    // 1. Exact Match (Path + Query Params if applicable)
    if (hrefHasParams) {
      const currentParams = searchParams.toString();
      const fullCurrentPath = currentParams ? `${pathname}?${currentParams}` : pathname;
      if (fullCurrentPath === href) return true;
    }

    // 2. Exact Path Match (No Query Params in Link)
    // Only highlight the base route (e.g. /ess) if there are NO query params in the current URL,
    // OR if the query param is exactly the default one for that page (none currently defined)
    if (!hrefHasParams && pathname === href) {
      // If the current URL has query params, do NOT highlight the generic parent link
      // This stops "/ess" from being highlighted when visiting "/ess?tab=timesheets"
      const hasQueryParams = Array.from(searchParams.keys()).length > 0;
      if (!hasQueryParams) {
        return true;
      }
    }

    // 3. Child Route Match (e.g., /finance matches /finance/expenses)
    // Only check this if the href doesn't have query params (we don't want /ess?tab=timesheets to match /ess?tab=timesheets/details)
    if (!hrefHasParams && pathname.startsWith(href + "/") && href !== "/") {
      return true;
    }

    return false;
  };

  // Helper to check if any child route is active (for parent menu highlighting)
  const isParentActive = (item) => {
    if (!pathname || !item.children) return false;
    // Check if any child is active
    return item.children.some(child => isActive(child.href));
  };

  const hasAccess = (item) => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'super_admin') return true;
    if (!item.requiredPermissions) return true;
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    return item.requiredPermissions.some(p => user.permissions.includes(p));
  };

  const adminNavigation = [
    { name: t("dashboard"), href: "/admin/dashboard", icon: Home },
    {
      name: t("crmManagement"),
      href: "/admin/organization",
      icon: Cog,
      requiredPermissions: ['employees.view', 'employees.manage', 'settings.manage'],
      children: [
        { name: t("department"), href: "/admin/organization/department", icon: Building2 },
        { name: t("employee"), href: "/admin/organization/employeeType", icon: Contact },
        // {
        //   name: t("attendanceThresholds"),
        //   href: "/admin/organization/attendance-thresholds",
        //   icon: Target,
        // },
        { name: t("orgChart"), href: "/admin/organization/org-chart", icon: GitGraph },
        { name: t("orgSettings"), href: "/admin/organization/org-settings", icon: Settings2 },
        { name: "Roles & Permissions", href: "/admin/organization/roles", icon: Shield },
        { name: "Document Templates", href: "/admin/organization/templates", icon: FileText },
      ],
    },
    { name: t("employeeDirectory"), href: "/admin/employees", icon: Users, requiredPermissions: ['employees.view', 'employees.manage'] },
    {
      name: t("payrollManagement"),
      href: "/admin/payroll",
      icon: CreditCard,
      requiredPermissions: ['payroll.view', 'payroll.manage', 'attendance.view', 'attendance.manage', 'leaves.view', 'leaves.manage'],
      children: [
        {
          name: t("attendanceDirectory"),
          href: "/admin/attendance",
          icon: UserCheck,
        },


        {
          name: t("holidayManagement"),
          href: "/admin/holidays",
          icon: Calendar,
        },
        {
          name: t("shiftManagement"),
          href: "/admin/payroll/shifts",
          icon: Clock,
        },
        {
          name: t("rosterPlanning"),
          href: "/admin/payroll/roster",
          icon: CalendarRange,
        },
        {
          name: t("payslipGeneration"),
          href: "/admin/payroll/payslip",
          icon: FileText,
        },
        {
          name: t("payrollRun"),
          href: "/admin/payroll/run",
          icon: Banknote,
        },
        // {
        //   name: t("salaryComponents"),
        //   href: "/admin/payroll/components",
        //   icon: CalculatorIcon,
        // },
        {
          name: "Tax Calculations",
          href: "/admin/payroll/tax-calculations",
          icon: Calculator,
        },
        {
          name: t("loansAdvances"),
          href: "/admin/payroll/loans",
          icon: BanknoteArrowUp,
        },
        {
          name: t("bonusIncentives"),
          href: "/admin/payroll/bonuses",
          icon: Award,
        },
        {
          name: t("settings"),
          href: "/admin/payroll/settings",
          icon: Shield,
        },
        {
          name: t("leaveManagement"),
          href: "/admin/payroll/leaves",
          icon: CalendarRange,
        },
        {
          name: t("leaveApprovals"),
          href: "/admin/payroll/leave-approvals",
          icon: CheckSquare,
        },
        {
          name: t("otApprovals"),
          href: "/admin/payroll/ot-approvals",
          icon: Clock,
        },
        {
          name: t("coApprovals"),
          href: "/admin/payroll/co-approvals",
          icon: CalendarRange,
        },
        {
          name: t("investmentReviews"),
          href: "/admin/payroll/investments",
          icon: ShieldCheck,
        },
        {
          name: t("talentManagement"),
          href: "/admin/talent",
          icon: Award,
        },
        {
          name: t("comparisonReports"),
          href: "/admin/payroll/reports/comparison",
          icon: BarChart3,
        },
      ],
    },
    {
      name: "Workflow Payroll",
      href: "/admin/payroll/v2",
      icon: CreditCard,
      requiredPermissions: ['payroll.view', 'payroll.manage'],
      children: [
        { name: "Command Center", href: "/admin/payroll/v2?tab=dashboard", icon: Home },
        { name: "Run Wizard", href: "/admin/payroll/v2?tab=payroll-run", icon: CreditCard },
        { name: "Salary Structures", href: "/admin/payroll/v2?tab=salary-structures", icon: Users },
        { name: "Queries Desk", href: "/admin/payroll/v2?tab=queries", icon: MessageSquare },
        { name: "Workflow Approvals", href: "/admin/payroll/v2?tab=approvals", icon: CheckSquare },
        { name: "Master Settings", href: "/admin/payroll/v2?tab=configs", icon: Settings2 },
      ]
    },
    {

      name: t("projectTracking"),
      href: "/admin/tasks/projects",
      icon: Briefcase,
      children: [
        { name: t("projects"), href: "/admin/tasks/projects", icon: Briefcase },
        { name: t("timesheetApprovals"), href: "/admin/tasks/approvals", icon: CheckSquare },
      ],
    },
    {
      name: t("recruitment"),
      href: "/admin/recruitment",
      icon: Briefcase,
      children: [
        { name: t("recruitmentHub"), href: "/admin/recruitment", icon: GitGraph },
        { name: t("applicantTrackingAts"), href: "/admin/recruitment/ats", icon: Users },
        { name: t("interviewScheduling"), href: "/admin/recruitment/interviews", icon: Calendar },
        { name: t("onboardingTracker"), href: "/admin/recruitment/onboarding", icon: UserCheck },
      ],
    },
    {
      name: "Staff Augmentation",
      href: "/admin/staffing",
      icon: Briefcase,
      children: [
        { name: "Staffing Hub", href: "/admin/staffing", icon: Home },
        { name: "Clients", href: "/admin/staffing/clients", icon: Building2 },
        { name: "Requirements", href: "/admin/staffing/requirements", icon: ListTodo },
        { name: "Talent Pool", href: "/admin/staffing/talent-pool", icon: Users },
        { name: "AI Matching", href: "/admin/staffing/matching", icon: Target },
        { name: "Hiring Pipeline", href: "/admin/staffing/submissions", icon: GitGraph },
      ],
    },
    {
      name: t("financeAccounting"),
      href: "/admin/finance",
      icon: CreditCard,
      children: [
        { name: t("financeHub"), href: "/admin/finance", icon: GitGraph },
        { name: t("expenseClaims"), href: "/admin/finance/expenses", icon: Receipt },
        { name: t("generalLedger"), href: "/admin/finance/ledger", icon: History },
        { name: t("vendorManagement"), href: "/admin/finance/vendors", icon: Users },
      ],
    },
    {
      name: t("engagement"),
      href: "/admin/engagement",
      icon: Target,
      children: [
        { name: t("engagementHub"), href: "/admin/engagement", icon: BarChart3 },
        { name: t("socialFeed"), href: "/admin/engagement/feed", icon: GitGraph },
        { name: t("pulseSurveys"), href: "/admin/engagement/surveys", icon: MessageSquare },
      ],
    },
    {
      name: t("notifications"),
      href: "/admin/notifications",
      icon: Bell,
    },
    {
      name: t("assetManagement"),
      href: "/admin/assets",
      icon: Monitor,
    },
    {
      name: t("exitManagement"),
      href: "/admin/exit",
      icon: LogOut,
    },
    {
      name: t("hrHelpdesk"),
      href: "/admin/helpdesk",
      icon: MessageSquare,
    },
    {
      name: t("employeeHandbook") || "Employee Handbook",
      href: "/admin/handbook",
      icon: BookOpen,
    },
    {
      name: t("activityLogs"),
      href: "/super-admin/audit-logs",
      icon: Clock,
    },
    {
      name: "Billing & Subscriptions",
      href: "/admin/billing",
      icon: Banknote,
      requiredPermissions: ['finance.view', 'finance.manage', 'settings.manage']
    }
  ];

  // Filter navigation based on permissions
  const filteredNavigation = adminNavigation
    .map(item => {
      // Filter parent
      if (!hasAccess(item)) return null;
      
      // Filter children if they exist (we can also assign requiredPermissions to children if needed, 
      // but for now we filter at parent level to match the modules)
      return item;
    })
    .filter(Boolean);

  // Employee navigation with only Dashboard and My Payslip
  let employeeNavigation = [
    { name: t("myPortal"), href: "/employee/dashboard", icon: Eye },
    { name: t("myTimesheet"), href: "/employee/timesheets", icon: ListTodo },
    { name: t("myProjects"), href: "/admin/tasks/projects", icon: Briefcase },
    { name: t("myPayslip"), href: "/admin/payroll/my-payslip", icon: Receipt },
    { name: t("myLoans"), href: "/admin/payroll/loans", icon: BanknoteArrowUp },
    { name: t("myAttendance"), href: "/employee/attendance", icon: UserCheck },
    { name: t("exitManagement"), href: "/admin/exit", icon: LogOut },
    { name: t("hrHelpdesk"), href: "/admin/helpdesk", icon: MessageSquare },
    { name: t("employeeHandbook"), href: "/admin/handbook", icon: BookOpen },
    {
      name: t("myEngagement"),
      href: "/admin/engagement",
      icon: Target,
      children: [
        { name: t("engagementHub"), href: "/admin/engagement", icon: BarChart3 },
        { name: t("socialFeed"), href: "/admin/engagement/feed", icon: GitGraph },
        { name: t("pulseSurveys"), href: "/admin/engagement/surveys", icon: MessageSquare },
      ],
    },
    { name: t("notifications"), href: "/admin/notifications", icon: Bell },
  ];

  if (role === 'admin' || role === 'super_admin') {
    if (!employeeNavigation.some(item => item.href === '/admin/dashboard')) {
      employeeNavigation.unshift({ name: "Admin Panel", href: "/admin/dashboard", icon: Shield });
    }
  }

  // Attendance-only user navigation - minimal access
  const attendanceOnlyNavigation = [
    {
      name: t("attendanceDirectory"),
      href: "/admin/attendance",
      icon: UserCheck,
    },
  ];

  const superAdminNavigation = [
    { name: "Admin Dashboard", href: "/super-admin/dashboard", icon: Home },
    { name: "Client Approvals", href: "/super-admin/approvals", icon: Clock },
    { name: "Organizations", href: "/super-admin/organizations", icon: Building2 },
    { name: "System Logs", href: "/super-admin/audit-logs", icon: List },
  ];

  const recruiterNavigation = [
    {
      name: "Staff Augmentation",
      href: "/hr_recurter/staffing/clients",
      icon: Briefcase,
      children: [
        { name: "Clients", href: "/hr_recurter/staffing/clients", icon: Building2 },
        { name: "Requirements", href: "/hr_recurter/staffing/requirements", icon: ListTodo },
        { name: "Talent Pool", href: "/hr_recurter/staffing/talent-pool", icon: Users },
        { name: "AI Matching", href: "/hr_recurter/staffing/matching", icon: Target },
        { name: "Hiring Pipeline", href: "/hr_recurter/staffing/submissions", icon: GitGraph },
      ],
    },
  ];

  // Define mapping of permissions to navigation items
  // You can extend this map to include any other permissions and their corresponding routes
  const PERMISSION_NAV_MAP = {
    'employees.view': { name: t("employeeDirectory"), href: "/admin/employees", icon: Users },
    'payroll.view': { name: t("payrollManagement"), href: "/admin/payroll", icon: CreditCard },
    'attendance.view': { name: "Company Attendance", href: "/admin/attendance", icon: UserCheck },
    'leaves.view': { name: "Leave Management", href: "/admin/payroll/leaves", icon: CalendarRange },
    'finance.view': { name: "Billing & Subscriptions", href: "/admin/billing", icon: Banknote },
    'settings.manage': { name: t("orgSettings"), href: "/admin/organization/org-settings", icon: Settings2 },
  };

  // Dynamically add items to employee navigation based on permissions
  console.log('[RBAC DEBUG] role:', role, 'permissions:', user?.permissions);
  if (role === 'employee' && user?.permissions?.length > 0) {
    user.permissions.forEach(permSlug => {
      const navItem = PERMISSION_NAV_MAP[permSlug];
      console.log('[RBAC DEBUG] processing permission:', permSlug, 'navItem:', navItem);
      if (navItem) {
        const existingIndex = employeeNavigation.findIndex(item => item.href === navItem.href);
        if (existingIndex >= 0) {
          // Replace existing item (e.g. "My Attendance" becomes "Company Attendance")
          console.log('[RBAC DEBUG] Replacing existing at index', existingIndex, employeeNavigation[existingIndex].name, '->', navItem.name);
          employeeNavigation[existingIndex] = navItem;
        } else {
          // Insert near the top so it's clearly visible
          console.log('[RBAC DEBUG] Inserting new item:', navItem.name);
          employeeNavigation.splice(1, 0, navItem);
        }
      }
    });
    console.log('[RBAC DEBUG] Final employeeNavigation:', employeeNavigation.map(i => i.name));
  }

  let navigation = [];
  const isEmployeePath = pathname?.startsWith('/employee');

  if (role === "super_admin") {
    navigation = superAdminNavigation;
  } else if (role === "admin") {
    // If admin is visiting an employee page, show employee navigation
    navigation = isEmployeePath ? employeeNavigation : filteredNavigation;
  } else if (role === "employee") {
    navigation = employeeNavigation;
  } else if (role === "recruiter") {
    navigation = recruiterNavigation;
  } else if (role === "attendance_only") {
    navigation = attendanceOnlyNavigation;
  } else {
    navigation = [];
  }

  const isAuthRoute =
    pathname?.startsWith("/auth") || pathname === "/login";
  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (isLoading || loadingRole) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-700 font-semibold">
        Loading dashboard...
      </div>
    );
  }

  if (!role) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col h-screen`}
      >
        <div className="flex-shrink-0 px-4 py-6 border-b border-slate-200 bg-white">
          <div className="flex items-center px-3">
            <Link
              href={
                role === "admin" ? "/admin/dashboard" :
                  role === "employee" ? "/employee/dashboard" :
                    role === 'attendance_only' ? '/payroll/attendance' :
                      '/dashboard'
              }
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <Image src="/name_logo.png" alt="WorkGrid Logo" width={32} height={32} className="rounded-lg shrink-0 object-contain bg-indigo-600 mr-3" />
              <span className="text-xl font-bold text-slate-900 tracking-tight">WorkGrid</span>
            </Link>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
          {navigation?.map((item) => (
            <div key={item.name} className="space-y-1">
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`flex items-center w-full p-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${isParentActive(item)
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                      }`}
                    aria-expanded={openMenu === item.name}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${isParentActive(item)
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-100/50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                        }`}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-left">{item.name}</span>
                    <div
                      className={`transition-transform duration-200 ${openMenu === item.name ? "rotate-180" : ""
                        }`}
                    >
                      <ChevronDown className={`h-4 w-4 ${isParentActive(item) ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500"}`} />
                    </div>
                  </button>

                  {openMenu === item.name && (
                    <div className="ml-4 pl-4 mt-2 space-y-1 border-l-2 border-slate-100">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={`flex items-center p-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive(child.href)
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                            }`}
                        >
                          {child.icon && (
                            <child.icon
                              className={`h-4 w-4 mr-3 ${isActive(child.href)
                                ? "text-indigo-600"
                                : "text-slate-400 group-hover:text-indigo-500"
                                }`}
                            />
                          )}
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive(item.href)
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                    }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${isActive(item.href)
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-100/50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {user?.name || user?.personalDetails?.firstName ||
                    (role === "admin" ? "Admin User" : "Employee User")}
                </p>
                <p className="text-xs text-indigo-600 font-medium capitalize bg-indigo-50 px-2 py-0.5 rounded-full w-fit mt-0.5">{user?.designation || role}</p>
              </div>
            </div>
            <button
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
                  aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  {sidebarOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>

                
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center gap-2 outline-none">
                    <Languages className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase">{locale}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40 bg-white border border-slate-200 shadow-xl rounded-xl p-1 mt-2">
                    <DropdownMenuItem onClick={() => changeLanguage("en")}>English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeLanguage("hi")}>हिन्दी (Hindi)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeLanguage("mr")}>मराठी (Marathi)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeLanguage("kn")}>ಕನ್ನಡ (Kannada)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeLanguage("ta")}>தமிழ் (Tamil)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {role !== "recruiter" && (
                  <button
                    onClick={() => router.push('/admin/notifications')}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative"
                    aria-label="Notifications"
                  >
                    <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-indigo-600' : ''}`} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                      </span>
                    )}
                  </button>
                )}

                <div className="flex items-center space-x-1.5 sm:space-x-3 pl-2 sm:pl-4 border-l border-slate-200">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center space-x-3 outline-none group">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {t("welcome")},{" "}
                          {user?.name || user?.personalDetails?.firstName ||
                            (role === "admin" ? "Admin" : "Employee")}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{user?.designation || role}</p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-white group-hover:ring-indigo-100 transition-all">
                        <span className="text-white font-bold text-sm">
                          {(user?.name || user?.personalDetails?.firstName || role)
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-white border border-slate-200 shadow-xl rounded-xl p-1 mt-2">
                      <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t("myAccount")}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="-mx-1 my-1 border-t border-slate-100" />

                      <DropdownMenuItem onClick={() => router.push("/admin/profile")}>
                        <User className="w-4 h-4 mr-2 text-slate-500" />
                        {t("myPortal")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/change-password")}>
                        <Lock className="w-4 h-4 mr-2 text-slate-500" />
                        {t("changePassword")}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="-mx-1 my-1 border-t border-slate-100" />
                      <DropdownMenuItem onClick={() => { logout(); router.push("/login"); }} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                        <LogOut className="w-4 h-4 mr-2" />
                        {t("logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="bg-slate-50 min-h-[calc(100vh-80px)]">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* First-login Setup Wizard â€” only shows for admin with no org yet */}
      {role === "admin" && (
        <SetupWizard user={user} onComplete={() => {}} />
      )}

      {/* Toast notifications */}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center font-bold text-slate-700">Loading Dashboard...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
