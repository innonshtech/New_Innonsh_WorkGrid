import React from "react";
import { AlertCircle } from "lucide-react";

export default function SimpleSelect({
    value,
    onChange,
    options,
    placeholder,
    className = "",
    error,
    disabled = false,
}) {
    console.log(`Dropdown [${placeholder}]: value=${value}, optionsCount=${options?.length}, disabled=${disabled}`);
    return (
        <div>
            <select
                value={value || ""}
                onChange={onChange}
                disabled={disabled}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white ${error
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-slate-300"
                    } ${disabled ? "bg-slate-100 cursor-not-allowed" : ""} ${className}`}
            >
                <option value="">{placeholder}</option>
                {options.map((option, idx) => {
                    const isObj = typeof option === 'object' && option !== null;
                    const val = isObj ? (option.value !== undefined ? option.value : (option.id || option._id)) : option;
                    const label = isObj ? (option.label !== undefined ? option.label : (option.name || option.title || val)) : option;
                    return (
                        <option key={`opt-${idx}`} value={val !== undefined && val !== null ? val : ""}>
                            {label}
                        </option>
                    );
                })}
            </select>
            {error && (
                <div className="flex items-center space-x-1 text-red-600 text-xs mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
