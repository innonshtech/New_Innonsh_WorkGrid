import React from 'react';
import { 
  Eye, 
  MoreVertical, 
  Clock, 
  User, 
  Building2, 
  MapPin, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AttendanceTable({ 
  attendance, 
  onViewDetails, 
  onRegularize,
  userRole,
  loading 
}) {
  const getStatusBadge = (status) => {
    const badgeStyleMap = {
      Present: "bg-emerald-50 text-emerald-700 border-emerald-100",
      Absent: "bg-rose-50 text-rose-700 border-rose-100",
      "Half-day": "bg-amber-50 text-amber-700 border-amber-100",
      Leave: "bg-indigo-50 text-indigo-700 border-indigo-100",
      Holiday: "bg-purple-50 text-purple-700 border-purple-100",
      "Weekly Off": "bg-slate-50 text-slate-650 border-slate-100",
      "Missing Punch": "bg-orange-50 text-orange-700 border-orange-100",
      WFH: "bg-teal-50 text-teal-700 border-teal-100"
    };

    const style = badgeStyleMap[status] || "bg-slate-50 text-slate-650 border-slate-100";

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${style}`}>
        {status || 'N/A'}
      </span>
    );
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    return new Date(time).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading operations feeds...</p>
      </div>
    );
  }

  if (attendance.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
          <User className="h-8 w-8 text-slate-350" />
        </div>
        <h3 className="text-sm font-extrabold text-slate-800">No Operations Feeds</h3>
        <p className="text-slate-400 text-xs font-semibold">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-450 text-[10px] font-extrabold uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-4 font-bold">Employee</th>
              <th className="text-left px-6 py-4 font-bold">Shift Details</th>
              <th className="text-left px-6 py-4 font-bold">Check In</th>
              <th className="text-left px-6 py-4 font-bold">Check Out</th>
              <th className="text-center px-6 py-4 font-bold">Working Hours</th>
              <th className="text-center px-6 py-4 font-bold">Status</th>
              <th className="text-right px-6 py-4 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {attendance.map((record) => {
              const fullName = `${record.employee?.personalDetails?.firstName || ''} ${record.employee?.personalDetails?.lastName || ''}`.trim();
              const employeeId = record.employee?.employeeId || 'N/A';
              const department = record.employee?.jobDetails?.department || 'N/A';
              const organization = record.employee?.jobDetails?.organizationId?.name || record.employee?.jobDetails?.organizationType || 'Unassigned';

              const getInitials = (name) => {
                if (!name) return "EE";
                return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
              };

              return (
                <tr key={record._id} className="hover:bg-slate-50/50 transition-colors group/row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/10 group-hover/row:scale-105 transition-transform shrink-0">
                        {getInitials(fullName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-slate-800 tracking-tight truncate">{fullName}</p>
                          {(record.lateMinutes > 0 || (record.checkIn && !record.checkOut)) && (
                            <AlertCircle className="h-3.5 w-3.5 text-rose-500 animate-pulse shrink-0" title="Attendance Alert" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex px-1 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-500 uppercase mt-0.5 tracking-wider">ID: {employeeId}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-350 shrink-0"></span>
                          <span className="text-xs font-semibold text-slate-400 truncate">{department}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-650 font-bold">Regular Shift</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-extrabold text-slate-800">{formatTime(record.checkIn)}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Punched In</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-extrabold text-slate-800">{formatTime(record.checkOut)}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Punched Out</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-2 text-center">
                      <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-inner">
                        <Timer className="h-4 w-4 text-blue-650" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-extrabold text-slate-800">{record.totalHours || '0'}h</p>
                        
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col gap-1 items-center justify-center">
                      {getStatusBadge(record.status)}
                      {record.lateMinutes > 0 && (
                        <span className="inline-flex px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold uppercase rounded-md shadow-inner">
                          Late Arrival ({record.lateMinutes}m)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => onViewDetails(record)}
                        className="p-2 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 active:scale-95"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-slate-900 border border-slate-800 text-slate-350">
                          <DropdownMenuLabel className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Quick Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="border-slate-805" />
                          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white" onClick={() => onViewDetails(record)}>
                            <Eye className="mr-2 h-3.5 w-3.5" /> View Full Details
                          </DropdownMenuItem>
                          {userRole === 'admin' && (
                            <>
                              <DropdownMenuItem className="hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white">
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Approve Punch
                              </DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white">
                                <XCircle className="mr-2 h-3.5 w-3.5 text-rose-500" /> Reject Punch
                              </DropdownMenuItem>
                            </>
                          )}
                          {userRole === 'employee' && (record.status === 'Absent' || record.status === 'Missing Punch') && (
                            <DropdownMenuItem className="hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white" onClick={() => onRegularize(record)}>
                              <AlertCircle className="mr-2 h-3.5 w-3.5 text-amber-500" /> Regularize
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
