import React from 'react';

export function EnterpriseTableWrapper({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {children}
        </table>
      </div>
    </div>
  );
}

export function EnterpriseTableHeader({ children, className = '' }) {
  return (
    <thead className={`bg-slate-50/50 border-b border-slate-200 ${className}`}>
      {children}
    </thead>
  );
}

export function EnterpriseTableRow({ children, className = '', onClick }) {
  return (
    <tr 
      onClick={onClick}
      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function EnterpriseTableTh({ children, className = '' }) {
  return (
    <th className={`px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function EnterpriseTableTd({ children, className = '' }) {
  return (
    <td className={`px-6 py-4 text-sm text-slate-700 ${className}`}>
      {children}
    </td>
  );
}
