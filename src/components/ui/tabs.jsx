'use client';

import { useState } from 'react';

export function Tabs({ value, onValueChange, className, children }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function TabsList({ className, children }) {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children }) {
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}