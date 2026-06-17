import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  Calendar, 
  User, 
  Building2, 
  Timer, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  MinusCircle
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function EmployeeDetailsDrawer({ isOpen, onClose, record }) {
  if (!record) return null;

  const fullName = `${record.employee?.personalDetails?.firstName || ''} ${record.employee?.personalDetails?.lastName || ''}`.trim();
  const employeeId = record.employee?.employeeId || 'N/A';
  const department = record.employee?.jobDetails?.department || 'N/A';
  const designation = record.employee?.jobDetails?.designation || 'N/A';

  const formatTime = (time) => {
    if (!time) return '--:--';
    return new Date(time).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const timelineItems = [
    { label: 'Check In', time: record.checkIn, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Break Start', time: null, icon: MinusCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Break End', time: null, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Check Out', time: record.checkOut, icon: CheckCircle2, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
                  <p className="text-sm font-medium text-slate-500">ID: {employeeId}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
              {/* Employee Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{department}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Designation</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{designation}</p>
                </div>
              </div>

              {/* Attendance Status */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  Attendance Status
                </h3>
                <div className="p-4 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Current Status</span>
                    <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">{record.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Working Hours</span>
                    <span className="text-sm font-bold text-slate-900">{record.totalHours || '0'}h 00m</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(((record.totalHours || 0) / 9) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-center font-bold text-slate-400">Target: 9.0 Hours</p>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  Activity Timeline
                </h3>
                <div className="space-y-6 ml-4">
                  {timelineItems.map((item, idx) => (
                    <div key={idx} className="relative pl-8 border-l-2 border-slate-100 last:border-l-0 pb-6 last:pb-0">
                      <div className={`absolute -left-[17px] top-0 h-8 w-8 rounded-full ${item.bg} flex items-center justify-center border-4 border-white`}>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.label}</p>
                          <p className="text-xs font-medium text-slate-500">{item.time ? 'Captured at Terminal' : 'No record'}</p>
                        </div>
                        <p className={`text-sm font-black ${item.time ? 'text-slate-900' : 'text-slate-300'}`}>
                          {formatTime(item.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payroll Integration */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Timer className="h-4 w-4 text-indigo-600" />
                  Payroll Impact
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payable Days</p>
                    <p className="text-sm font-black text-slate-900">0.0 Days</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loss of Pay</p>
                    <p className="text-sm font-black text-red-600">0.0 Days</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OT Payable</p>
                    <p className="text-sm font-black text-green-600">0.00 Hours</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deductions</p>
                    <p className="text-sm font-black text-slate-900">₹0.00</p>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="p-4 rounded-2xl bg-indigo-600 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    <span className="font-bold">Weekly Performance</span>
                  </div>
                  <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">Top 10%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-[10px] font-bold text-indigo-200 uppercase">Avg In</p>
                    <p className="text-sm font-black">09:05 AM</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-indigo-200 uppercase">Total Hrs</p>
                    <p className="text-sm font-black">45.5h</p>
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/30 grid grid-cols-2 gap-4">
              <button 
                onClick={onClose}
                className="px-4 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Close Drawer
              </button>
              <button className="px-4 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                Export Report
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
