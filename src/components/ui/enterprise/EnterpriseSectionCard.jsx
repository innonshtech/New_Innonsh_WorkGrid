import React from 'react';

export function EnterpriseSectionCard({ title, icon: Icon, description, action, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between border-b border-slate-50 pb-4 ${children ? 'mb-6' : ''}`}>
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5 text-indigo-600" />} {title}
              </h3>
            )}
            {description && (
              <p className="text-xs font-medium text-slate-400">{description}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
