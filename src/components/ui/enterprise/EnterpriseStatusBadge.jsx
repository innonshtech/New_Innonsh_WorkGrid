import React from 'react';

export function EnterpriseStatusBadge({ status, type = 'auto', className = '' }) {
  let colorClass = '';
  
  const s = (status || '').toLowerCase();
  let resolvedType = type;

  if (type === 'auto') {
    if (s.includes('active') || s.includes('success') || s.includes('completed') || s.includes('approved')) {
      resolvedType = 'success';
    } else if (s.includes('inactive') || s.includes('failed') || s.includes('rejected') || s.includes('error')) {
      resolvedType = 'danger';
    } else if (s.includes('pending') || s.includes('warning') || s.includes('hold')) {
      resolvedType = 'warning';
    } else if (s.includes('new') || s.includes('info')) {
      resolvedType = 'info';
    } else {
      resolvedType = 'neutral';
    }
  }

  switch (resolvedType) {
    case 'success':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'warning':
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'danger':
      colorClass = 'bg-red-50 text-red-700 border-red-200';
      break;
    case 'info':
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'purple':
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'neutral':
    default:
      colorClass = 'bg-slate-50 text-slate-700 border-slate-200';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${colorClass} ${className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${resolvedType === 'success' ? 'bg-emerald-500' : resolvedType === 'danger' ? 'bg-red-500' : resolvedType === 'warning' ? 'bg-amber-500' : resolvedType === 'info' ? 'bg-blue-500' : resolvedType === 'purple' ? 'bg-indigo-500' : 'bg-slate-400'}`}></div>
      {status}
    </span>
  );
}
