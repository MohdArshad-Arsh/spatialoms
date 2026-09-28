import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

/**
 * Multi-Select Dropdown Component
 * Allows users to select multiple options from a dropdown list
 */
const MultiSelectDropdown = ({ 
    label, 
    options = [], 
    selected = [], 
    onChange, 
    placeholder = "Select options...",
    disabled = false 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = (value) => {
        const newSelected = selected.includes(value)
            ? selected.filter(v => v !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange([]);
    };

    const handleSelectAll = () => {
        if (selected.length === options.length) {
            onChange([]);
        } else {
            onChange(options);
        }
    };

    const displayText = selected.length === 0
        ? placeholder
        : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

    return (
        <div className="flex flex-col" ref={dropdownRef}>
            {label && (
                <span className="text-xs font-bold text-gray-600 mb-1">{label}</span>
            )}
            
            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`appearance-none w-full px-4 py-3 pr-10 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer font-semibold transition-all text-base flex items-center justify-between ${
                        disabled 
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                >
                    <span className={selected.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                        {displayText}
                    </span>
                    
                    <div className="flex items-center gap-1">
                        {selected.length > 0 && !disabled && (
                            <button
                                onClick={handleClear}
                                className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                                title="Clear all"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        )}
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {isOpen && !disabled && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                        {/* Select All Option */}
                        <div 
                            onClick={handleSelectAll}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b-2 border-gray-200 font-bold text-blue-700 flex items-center gap-3"
                        >
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                                selected.length === options.length 
                                    ? 'bg-blue-600 border-blue-600' 
                                    : 'border-gray-300 bg-white'
                            }`}>
                                {selected.length === options.length && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span>Select All ({options.length})</span>
                        </div>

                        {/* Options List */}
                        {options.map((option) => {
                            const isSelected = selected.includes(option);
                            return (
                                <div
                                    key={option}
                                    onClick={() => handleToggle(option)}
                                    className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors flex items-center gap-3 ${
                                        isSelected ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                                        isSelected 
                                            ? 'bg-blue-600 border-blue-600' 
                                            : 'border-gray-300 bg-white'
                                    }`}>
                                        {isSelected && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className={`text-sm font-medium ${
                                        isSelected ? 'text-blue-900 font-semibold' : 'text-gray-700'
                                    }`}>
                                        {option}
                                    </span>
                                </div>
                            );
                        })}

                        {options.length === 0 && (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                No options available
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Selected Items Display */}
            {selected.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.map((item) => (
                        <span
                            key={item}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-semibold border border-blue-200"
                        >
                            {item}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggle(item);
                                }}
                                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;
