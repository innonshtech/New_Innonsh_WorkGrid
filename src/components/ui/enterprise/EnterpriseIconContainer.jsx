import React from 'react';

export function EnterpriseIconContainer({ 
  icon: Icon, 
  color = 'blue', 
  size = 'md', 
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    slate: 'bg-slate-100 text-slate-600'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} flex items-center justify-center shrink-0 shadow-sm ${className}`}>
      {Icon && <Icon className={iconSizeClasses[size]} />}
    </div>
  );
}
