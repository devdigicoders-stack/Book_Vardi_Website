import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, ChevronDown, Check } from 'lucide-react';

export const ALL_CLASSES = [
  { value: 'Nursery', label: 'Nursery', group: 'Pre-Primary & Primary' },
  { value: 'LKG', label: 'LKG (Lower Kindergarten)', group: 'Pre-Primary & Primary' },
  { value: 'UKG', label: 'UKG (Upper Kindergarten)', group: 'Pre-Primary & Primary' },
  { value: 'Class 1', label: 'Class 1 (1st Standard)', group: 'Pre-Primary & Primary' },
  { value: 'Class 2', label: 'Class 2 (2nd Standard)', group: 'Pre-Primary & Primary' },
  { value: 'Class 3', label: 'Class 3 (3rd Standard)', group: 'Pre-Primary & Primary' },
  { value: 'Class 4', label: 'Class 4 (4th Standard)', group: 'Pre-Primary & Primary' },
  { value: 'Class 5', label: 'Class 5 (5th Standard)', group: 'Pre-Primary & Primary' },
  { value: 'Class 6', label: 'Class 6 (6th Standard)', group: 'Middle & High School' },
  { value: 'Class 7', label: 'Class 7 (7th Standard)', group: 'Middle & High School' },
  { value: 'Class 8', label: 'Class 8 (8th Standard)', group: 'Middle & High School' },
  { value: 'Class 9', label: 'Class 9 (9th Standard)', group: 'Middle & High School' },
  { value: 'Class 10', label: 'Class 10 (10th Standard)', group: 'Middle & High School' },
  { value: 'Class 11', label: 'Class 11 (11th Standard)', group: 'Senior Secondary (11th & 12th)' },
  { value: 'Class 12th', label: 'Class 12th (12th Senior Secondary)', group: 'Senior Secondary (11th & 12th)' }
];

export default function ClassSelect({
  value = '',
  onChange,
  selectedSchoolName = '',
  placeholder = 'Select Class / Standard...',
  disabled = false,
  readOnly = false,
  required = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (onChange) {
      onChange(val);
    }
    setIsOpen(false);
  };

  const selectedClassObj = ALL_CLASSES.find((c) => c.value === value);

  if (readOnly) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-700 font-semibold cursor-default">
          <BookOpen size={16} className="text-brand-teal shrink-0" />
          <span className="truncate">{selectedClassObj?.label || value || 'No class selected'}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Box matching SchoolSelect */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-white border-2 border-brand-teal rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 flex items-center justify-between gap-2 cursor-pointer shadow-2xs transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : 'hover:border-brand-teal-light'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <BookOpen size={16} className="text-brand-teal shrink-0" />
          <span className={`truncate ${!value ? 'text-gray-400 font-normal' : 'font-bold text-gray-900'}`}>
            {selectedClassObj?.label || value || placeholder}
          </span>
        </div>
        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu - 3/4 height (max-h-48) and hidden scrollbars */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-[100] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="overflow-y-auto max-h-48 p-1.5 space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Pre-Primary & Primary */}
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/80 rounded-md mb-1">
                Pre-Primary & Primary
              </div>
              {ALL_CLASSES.slice(0, 8).map((cls) => {
                const isSelected = value === cls.value;
                return (
                  <button
                    key={cls.value}
                    type="button"
                    onClick={() => handleSelect(cls.value)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-brand-teal text-white font-bold shadow-xs'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <span>{cls.label}</span>
                    {isSelected && <Check size={14} className="text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Middle & High School */}
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/80 rounded-md mb-1">
                Middle & High School
              </div>
              {ALL_CLASSES.slice(8, 13).map((cls) => {
                const isSelected = value === cls.value;
                return (
                  <button
                    key={cls.value}
                    type="button"
                    onClick={() => handleSelect(cls.value)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-brand-teal text-white font-bold shadow-xs'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <span>{cls.label}</span>
                    {isSelected && <Check size={14} className="text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Senior Secondary */}
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/80 rounded-md mb-1">
                Senior Secondary (11th & 12th)
              </div>
              {ALL_CLASSES.slice(13).map((cls) => {
                const isSelected = value === cls.value;
                return (
                  <button
                    key={cls.value}
                    type="button"
                    onClick={() => handleSelect(cls.value)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-brand-teal text-white font-bold shadow-xs'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <span>{cls.label}</span>
                    {isSelected && <Check size={14} className="text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
