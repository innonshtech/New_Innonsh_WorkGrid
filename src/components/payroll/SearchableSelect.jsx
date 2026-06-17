"use client";

import React, { useState, useRef, useEffect } from "react";
import { AlertCircle, ChevronDown, Check } from "lucide-react";

export default function SearchableSelect({
    value,
    onChange,
    options = [],
    placeholder = "Select...",
    className = "",
    error,
    disabled = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef(null);

    // Find the currently selected option
    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    // Handle clicks outside the component to close the dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter options based on search term
    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (optionValue) => {
        onChange(optionValue); // Call the exact same onChange behavior
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm flex items-center justify-between transition-colors ${
                    error
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-300"
                } ${
                    disabled
                        ? "bg-slate-100 cursor-not-allowed text-slate-500"
                        : "bg-white cursor-pointer hover:border-slate-400"
                } ${className}`}
            >
                <span className={`truncate ${!selectedOption && !value ? "text-slate-500" : "text-slate-900"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100">
                        <input
                            type="text"
                            autoFocus
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="Type to search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-slate-500 text-center">
                                No results found
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`px-3 py-2 text-sm rounded-md cursor-pointer flex items-center justify-between ${
                                        String(option.value) === String(value)
                                            ? "bg-yellow-50 text-yellow-700 font-medium"
                                            : "hover:bg-slate-50 text-slate-700"
                                    }`}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {String(option.value) === String(value) && (
                                        <Check className="w-4 h-4 text-yellow-600 flex-shrink-0 ml-2" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center space-x-1 text-red-600 text-xs mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
