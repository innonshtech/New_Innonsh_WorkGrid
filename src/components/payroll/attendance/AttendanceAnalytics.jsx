import React from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertCircle, 
  MinusCircle, 
  TrendingUp, 
  Calendar,
  ArrowRight
} from 'lucide-react';

export default function AttendanceAnalytics({ stats, viewMode, role }) {
  const analyticsItems = [
    {
      title: "Total Employees",
      value: stats.total,
      subValue: viewMode === "weekly" ? "Active this week" : "Tracked this month",
      icon: Users,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: viewMode === "weekly" ? "Present (Weekly)" : "Total Present",
      value: stats.present,
      subValue: viewMode === "weekly" && stats.total > 0
        ? `${((stats.present / (stats.total * 7)) * 100).toFixed(1)}% present`
        : "Days present",
      icon: UserCheck,
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: viewMode === "weekly" ? "Absent (Weekly)" : "Total Absent",
      value: stats.absent,
      subValue: viewMode === "weekly" && stats.total > 0
        ? `${((stats.absent / (stats.total * 7)) * 100).toFixed(1)}% absent`
        : "Days absent",
      icon: UserX,
      color: "from-rose-500 to-pink-600",
    },
    {
      title: "On Leave",
      value: stats.leave,
      subValue: stats.total > 0
        ? `${((stats.leave / stats.total) * 100).toFixed(1)}% on leave`
        : "On leave",
      icon: Calendar,
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "Late Arrivals",
      value: stats.late || 0,
      subValue: "After shift start",
      icon: AlertCircle,
      color: "from-orange-500 to-amber-600",
    },
    {
      title: "Missing Punches",
      value: stats.missingPunches || 0,
      subValue: "Check-out pending",
      icon: MinusCircle,
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Overtime Employees",
      value: stats.overtimeCount || 0,
      subValue: "Above regular hours",
      icon: TrendingUp,
      color: "from-indigo-500 to-violet-600",
    },
    {
      title: "Attendance %",
      value: stats.attendancePercentage ? `${stats.attendancePercentage}%` : "0%",
      subValue: "Rollup average",
      icon: UserCheck,
      color: "from-cyan-500 to-blue-600",
    }
  ];

  // Filter items for employees
  const displayItems = role === "employee" 
    ? analyticsItems.filter(item => 
        ["Present (Weekly)", "Total Present", "Absent (Weekly)", "Total Absent", "Missing Punches", "Overtime Employees"].includes(item.title)
      )
    : analyticsItems;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {displayItems.map((item, index) => (
        <div
          key={index}
          className="group relative bg-white hover:bg-slate-50/50 rounded-2xl p-6 border border-slate-200 hover: transition-all cursor-pointer overflow-hidden active:scale-[0.99]"
        >
          <div className="space-y-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.title}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">{item.value}</p>
            </div>
            <p className="text-xs font-medium text-slate-500 leading-tight">{item.subValue}</p>
          </div>
          <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      ))}
    </div>
  );
}
