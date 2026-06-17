import React from 'react';

export function EnterprisePageHeader({ title, subtitle, icon: Icon, actions, label }) {
  return (
    <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl shadow-indigo-950/20 border border-slate-800 animate-fade-in">
      <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl pointer-events-none">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {Icon && (
             <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-md shadow-lg shrink-0">
                <Icon className="w-6 h-6 text-indigo-300 animate-pulse" />
             </div>
          )}
          <div className="space-y-1.5">
            {label && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
                {label}
              </div>
            )}
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
            {subtitle && (
               <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
                 {subtitle}
               </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
