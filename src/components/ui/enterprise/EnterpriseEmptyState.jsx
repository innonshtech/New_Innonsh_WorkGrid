import React from 'react';

export function EnterpriseEmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className = '' 
}) {
  return (
    <div className={`text-center py-16 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
      {Icon && (
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
