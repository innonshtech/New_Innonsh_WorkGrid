"use client";

import React, { useState, useRef, useEffect, useContext, createContext } from "react";
import { createPortal } from "react-dom";

const DropdownMenuContext = createContext({
  isOpen: false,
  setIsOpen: () => { },
  toggle: () => { },
});

export function DropdownMenu({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggle = () => setIsOpen((prev) => !prev);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, className = "", asChild, ...props }) {
  const { toggle } = useContext(DropdownMenuContext);
  return (
    <div
      onClick={toggle}
      className={`cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuContent({ children, className = "", align = "end" }) {
  const { isOpen } = useContext(DropdownMenuContext);

  if (!isOpen) return null;

  const alignClass = align === "end" ? "right-0" : "left-0";

  return (
    <div
      className={`absolute ${alignClass} z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${className}`}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, className = "", onClick, ...props }) {
  const { setIsOpen } = useContext(DropdownMenuContext);

  const handleClick = (e) => {
    if (onClick) onClick(e);
    setIsOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children, className = "", ...props }) {
  return (
    <div
      className={`px-2 py-1.5 text-sm font-semibold ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className = "", ...props }) {
  return (
    <div className={`-mx-1 my-1 h-px bg-slate-100 ${className}`} {...props} />
  );
}