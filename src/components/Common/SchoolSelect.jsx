import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GraduationCap, Search, Check, MapPin, Sparkles, ChevronDown, Plus, BookOpen } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

export default function SchoolSelect({
  value = '',
  onChange,
  onSelectSchool,
  placeholder = 'Select or search your school...',
  disabled = false,
  readOnly = false,
  required = false,
  className = ''
}) {
  const { schools = [], top10Schools = [], userSubdistrict, userLocation } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered schools list
  const filteredSchools = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return schools;
    return schools.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.shortName?.toLowerCase().includes(query) ||
        s.city?.toLowerCase().includes(query) ||
        s.board?.toLowerCase().includes(query) ||
        s.address?.toLowerCase().includes(query)
    );
  }, [schools, searchQuery]);

  // Display top 10 recommended schools when search query is empty
  const isSearching = searchQuery.trim().length > 0;

  const handleSelect = (schoolName, schoolObj = null) => {
    if (onChange) {
      onChange(schoolName);
    }
    if (onSelectSchool && schoolObj) {
      onSelectSchool(schoolObj);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  if (readOnly) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-700 font-semibold cursor-default">
          <GraduationCap size={16} className="text-brand-teal shrink-0" />
          <span className="truncate">{value || 'No school selected'}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected Box / Input Toggle */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-white border-2 border-brand-teal rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 flex items-center justify-between gap-2 cursor-pointer shadow-2xs transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : 'hover:border-brand-teal-light'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <GraduationCap size={16} className="text-brand-teal shrink-0" />
          <span className={`truncate ${!value ? 'text-gray-400 font-normal' : 'font-bold text-gray-900'}`}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-[100] max-h-80 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Header */}
          <div className="p-2.5 border-b border-gray-100 bg-gray-50/80">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search school by name, board, or city..."
                autoFocus
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
              />
            </div>
          </div>

          {/* List Area - 3/4 height (max-h-48) & hidden scrollbars */}
          <div className="overflow-y-auto max-h-48 p-1.5 space-y-2 divide-y divide-gray-100 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Top 10 Location Recommended Section (Shown when query is empty) */}
            {!isSearching && top10Schools.length > 0 && (
              <div className="pb-2">
                <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-brand-teal bg-brand-teal/5 rounded-lg mb-1">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-500" />
                    <span>Top 10 Recommended Schools</span>
                  </span>
                  <span className="text-gray-500 font-normal">Near {userSubdistrict || 'Your Location'}</span>
                </div>

                {top10Schools.map((school) => {
                  const isSelected = value === school.name;
                  return (
                    <button
                      key={school.id || school.name}
                      type="button"
                      onClick={() => handleSelect(school.name, school)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-brand-teal text-white shadow-xs'
                          : 'hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-brand-teal'}`}>
                            {school.name}
                          </span>
                          {school.board && (
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded shrink-0 ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                              {school.board}
                            </span>
                          )}
                        </div>

                        <div className={`flex items-center gap-3 text-[11px] mt-1 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin size={11} className="shrink-0" />
                            <span>{school.city || school.address}</span>
                          </span>

                          {school.classes && (
                            <span className="flex items-center gap-1 shrink-0">
                              <BookOpen size={11} className="shrink-0" />
                              <span>{school.classes}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {school.distanceKm !== null && school.distanceKm !== undefined && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {school.distanceKm} km
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* All Schools List */}
            <div className="pt-1">
              {!isSearching && (
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  All Partner Schools
                </div>
              )}

              {filteredSchools.map((school) => {
                const isSelected = value === school.name;
                return (
                  <button
                    key={school.id || school.name}
                    type="button"
                    onClick={() => handleSelect(school.name, school)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-teal text-white shadow-xs'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {school.name}
                        </span>
                        {school.board && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {school.board}
                          </span>
                        )}
                      </div>

                      <div className={`flex items-center gap-3 text-[11px] mt-1 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                        <span className="truncate">{school.city || school.address}</span>
                        {school.classes && <span className="shrink-0">• {school.classes}</span>}
                      </div>
                    </div>

                    {isSelected && <Check size={14} className="text-white shrink-0 mt-1" />}
                  </button>
                );
              })}

              {/* Custom Search Entry option */}
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => handleSelect(searchQuery.trim())}
                  className="w-full text-left p-2.5 rounded-xl bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-teal-dark text-xs font-bold flex items-center gap-2 mt-1 cursor-pointer border border-brand-yellow/30"
                >
                  <Plus size={14} className="text-brand-teal" />
                  <span>Use custom school: <strong>"{searchQuery.trim()}"</strong></span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
