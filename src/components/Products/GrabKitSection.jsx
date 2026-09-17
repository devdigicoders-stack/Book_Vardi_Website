import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, School, GraduationCap, ArrowRight, Package, ChevronDown, Check, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import KitCard from './KitCard';

export default function GrabKitSection({ onNavigate }) {
  const { addToCart, openProductDetails } = useCart();
  const [schoolQuery, setSchoolQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const classDropdownRef = useRef(null);

  useEffect(() => {
    const savedSchool = localStorage.getItem('grabKitSchool');
    const savedClass = localStorage.getItem('grabKitClass');
    if (savedSchool) setSchoolQuery(savedSchool);
    if (savedClass) setSelectedClass(savedClass);

    const handleSearchUpdate = (e) => {
      setSchoolQuery(e.detail.school);
      setSelectedClass(e.detail.className);
    };

    window.addEventListener('kitSearchUpdate', handleSearchUpdate);
    return () => window.removeEventListener('kitSearchUpdate', handleSearchUpdate);
  }, []);

  useEffect(() => {
    localStorage.setItem('grabKitSchool', schoolQuery);
    localStorage.setItem('grabKitClass', selectedClass);
  }, [schoolQuery, selectedClass]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSchoolDropdown(false);
      }
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target)) {
        setShowClassDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { userLocation, locationLabel, schools: partnerSchools } = useLocation();

  // Extract user pincode and its 3rd digit (index 2, reading left-to-right)
  const userPincode = useMemo(() => {
    if (userLocation?.pincode) return String(userLocation.pincode).trim();
    const match = (locationLabel || '').match(/\b\d{6}\b/);
    return match ? match[0] : '226010'; // Default Lucknow pin
  }, [userLocation, locationLabel]);

  const pincode3rdDigit = useMemo(() => {
    return userPincode && userPincode.length >= 3 ? userPincode.charAt(2) : '6';
  }, [userPincode]);

  // Group schools into nearby district matches (pincode 3rd digit) and other partner schools
  const { nearby3rdDigitSchools, otherSchools } = useMemo(() => {
    const matched = [];
    const others = [];

    const allSchoolNames = [...new Set([
      ...partnerSchools.map((s) => ({ name: s.shortName || s.name, fullObj: s }))
    ])].filter((item, index, self) => item.name && self.findIndex(t => t.name === item.name) === index);

    allSchoolNames.forEach((item) => {
      const schObj = item.fullObj;
      const schPin = (schObj?.pincode || '').toString().trim();
      if (schPin.length >= 3 && schPin.charAt(2) === pincode3rdDigit) {
        matched.push(item.name);
      } else {
        others.push(item.name);
      }
    });

    return {
      nearby3rdDigitSchools: matched.sort(),
      otherSchools: others.sort()
    };
  }, [partnerSchools, pincode3rdDigit]);

  // Combined list for search filtering
  const filteredNearbySchools = useMemo(() => {
    const q = schoolQuery.toLowerCase().trim();
    if (!q) return nearby3rdDigitSchools;
    return nearby3rdDigitSchools.filter(s => s.toLowerCase().includes(q));
  }, [nearby3rdDigitSchools, schoolQuery]);

  const filteredOtherSchools = useMemo(() => {
    const q = schoolQuery.toLowerCase().trim();
    if (!q) return otherSchools;
    return otherSchools.filter(s => s.toLowerCase().includes(q));
  }, [otherSchools, schoolQuery]);

  // Dynamic class list for selected school (or all unique classes if none selected)
  const availableClasses = useMemo(() => {
    if (schoolQuery.trim()) {
      const selectedSchoolObj = partnerSchools.find(
        (s) =>
          (s.name && s.name.toLowerCase().includes(schoolQuery.toLowerCase())) ||
          (s.shortName && s.shortName.toLowerCase().includes(schoolQuery.toLowerCase()))
      );

      if (selectedSchoolObj && Array.isArray(selectedSchoolObj.classes) && selectedSchoolObj.classes.length > 0) {
        return selectedSchoolObj.classes;
      }
    }

    // Default full sequence of classes
    const defaultClasses = [
      'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3',
      'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8',
      'Class 9', 'Class 10', 'Class 11', 'Class 12'
    ];
    const kitClasses = [];
    return [...new Set([...defaultClasses, ...kitClasses])];
  }, [schoolQuery, partnerSchools]);

  return (
    <section className="py-6 bg-gradient-to-r from-brand-teal/5 via-brand-teal/10 to-brand-yellow/10 border-b border-gray-100 relative z-30 h-full">
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Package className="text-brand-yellow" size={24} />
            <div>
              <h2 className="font-display text-xl font-extrabold text-brand-teal">Grab Your School Kit</h2>
              <p className="text-xs text-gray-600">Complete combos for your school</p>
            </div>
          </div>

          <div className="w-full bg-white rounded-2xl md:rounded-full shadow-sm border border-gray-100 p-2 md:p-1 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-1">
            <div className="w-full flex-1 relative" ref={dropdownRef}>
              <School className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search school or kit..."
                value={schoolQuery}
                onFocus={() => setShowSchoolDropdown(true)}
                onChange={(e) => {
                  setSchoolQuery(e.target.value);
                  setShowSchoolDropdown(true);
                }}
                className="w-full pl-9 pr-3 py-3 md:py-2 bg-transparent text-sm md:text-base focus:outline-none"
              />
              {showSchoolDropdown && (filteredNearbySchools.length > 0 || filteredOtherSchools.length > 0) && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto py-2">
                  {filteredNearbySchools.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 border-y border-teal-100/60 flex items-center justify-between">
                        <span>Nearby Schools (PIN 3rd digit match: {pincode3rdDigit})</span>
                        <span className="text-[9px] font-bold text-teal-600 bg-white px-1.5 py-0.2 rounded">PIN {userPincode}</span>
                      </div>
                      {filteredNearbySchools.map((school, i) => (
                        <button
                          key={`nearby-${i}`}
                          type="button"
                          className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-gray-800 hover:bg-brand-teal/5 hover:text-brand-teal font-medium transition-colors flex items-center justify-between"
                          onClick={() => {
                            setSchoolQuery(school);
                            setShowSchoolDropdown(false);
                          }}
                        >
                          <span className="font-semibold">{school}</span>
                          <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-bold">Nearby</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredOtherSchools.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 bg-gray-50 border-y border-gray-100">
                        Other Partner Schools & Catalog
                      </div>
                      {filteredOtherSchools.map((school, i) => (
                        <button
                          key={`other-${i}`}
                          type="button"
                          className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-brand-teal/5 hover:text-brand-teal transition-colors"
                          onClick={() => {
                            setSchoolQuery(school);
                            setShowSchoolDropdown(false);
                          }}
                        >
                          {school}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full md:w-48 relative border-t md:border-t-0 md:border-l border-gray-100" ref={classDropdownRef}>
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <button
                type="button"
                onClick={() => setShowClassDropdown(!showClassDropdown)}
                className="w-full pl-9 pr-4 py-3 md:py-2 bg-transparent text-sm md:text-base text-left focus:outline-none flex items-center justify-between"
              >
                <span className={`truncate ${selectedClass === 'all' ? 'text-gray-400' : 'text-gray-900'}`}>
                  {selectedClass === 'all' ? 'Any Class' : selectedClass}
                </span>
                <ChevronDown className="text-gray-400 shrink-0" size={16} />
              </button>
              
              {showClassDropdown && (
                <div className="absolute top-full right-0 w-full min-w-[160px] mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto py-2">
                  <button
                    className={`w-full text-left px-4 py-3 md:py-2 text-sm transition-colors ${selectedClass === 'all' ? 'bg-brand-teal/10 text-brand-teal font-bold' : 'text-gray-700 hover:bg-brand-teal/5'}`}
                    onClick={() => {
                      setSelectedClass('all');
                      setShowClassDropdown(false);
                    }}
                  >
                    Any Class
                  </button>
                  {availableClasses.map((cls, i) => (
                    <button
                      key={i}
                      className={`w-full text-left px-4 py-3 md:py-2 text-sm transition-colors ${selectedClass === cls ? 'bg-brand-teal/10 text-brand-teal font-bold' : 'text-gray-700 hover:bg-brand-teal/5'}`}
                      onClick={() => {
                        setSelectedClass(cls);
                        setShowClassDropdown(false);
                      }}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowSchoolDropdown(false);
                window.dispatchEvent(new CustomEvent('kitSearchUpdate', { detail: { school: schoolQuery, className: selectedClass } }));
                const kitRow = document.getElementById('school-kits-row');
                if (kitRow) {
                  kitRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="w-full md:w-auto bg-brand-teal hover:bg-brand-teal-light text-white font-bold px-6 py-3 md:py-2 rounded-xl md:rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base"
            >
              <Search size={16} />
              <span>Find</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
