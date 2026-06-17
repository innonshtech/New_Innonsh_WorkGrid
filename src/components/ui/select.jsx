'use client';

import { useState, useRef, useEffect } from 'react';
import React from 'react';
export function Select({ children, value, onValueChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {React.Children.map(children, child => {
        if (child?.type === SelectTrigger) {
          return React.cloneElement(child, {
            onClick: () => setIsOpen(!isOpen)
          });
        }
        return null;
      })}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
          {React.Children.map(children, child => {
            if (child?.type === SelectContent) {
              return React.cloneElement(child, {
                onValueChange: (val) => {
                  onValueChange(val);
                  setIsOpen(false);
                }
              });
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}

export function SelectTrigger({ children, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ${className}`}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 opacity-50"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

export function SelectValue({ children, placeholder }) {
  return (
    <span className="text-left">
      {children || <span className="text-gray-400">{placeholder}</span>}
    </span>
  );
}

export function SelectContent({ children, onValueChange, className = '' }) {
  return (
    <div className={`py-1 ${className}`}>
      {React.Children.map(children, child => {
        if (child?.type === SelectItem) {
          return React.cloneElement(child, {
            onSelect: onValueChange
          });
        }
        return child;
      })}
    </div>
  );
}

export function SelectItem({ children, value, onSelect, className = '' }) {
  return (
    <div
      className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 ${className}`}
      onClick={() => onSelect(value)}
    >
      {children}
    </div>
  );
}