import React from 'react';
import { ArrowRight } from 'lucide-react';

export function EnterpriseKpiCard({ title, value, description, icon: Icon, color = "from-indigo-500 to-violet-600", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white hover:bg-slate-50/50 rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''} overflow-hidden`}
    >
      <div className="space-y-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">{value}</p>
        </div>
        {description && <p className="text-xs font-medium text-slate-500 leading-tight">{description}</p>}
      </div>
      {/* Hover arrow */}
      {onClick && (
        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>
      )}
    </div>
  );
}
