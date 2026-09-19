import React, { useState, useEffect, useMemo } from 'react';
import ProductCarouselRow from './ProductCarouselRow';
import KitCard from './KitCard';
import { fetchKitsFromBackend } from '../../utils/api';

export default function SchoolKitsRow({ onNavigate }) {
  const [kits, setKits] = useState([]);
  const [filterSchool, setFilterSchool] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  useEffect(() => {
    fetchKitsFromBackend()
      .then((res) => {
        const list = res?.kits || [];
        setKits(Array.isArray(list) ? list : []);
      })
      .catch(() => setKits([]));
  }, []);

  useEffect(() => {
    // Check local storage on initial load
    const savedSchool = localStorage.getItem('grabKitSchool') || '';
    const savedClass = localStorage.getItem('grabKitClass') || 'all';

    // Ignore placeholder strings stored in localStorage
    const isPlaceholderSchool = ['select school', 'all schools', 'any school'].includes(savedSchool.toLowerCase().trim());
    if (savedSchool && !isPlaceholderSchool) {
      setFilterSchool(savedSchool);
    }
    if (savedClass) {
      setFilterClass(savedClass);
    }

    const handleSearchUpdate = (e) => {
      const incomingSchool = e?.detail?.school || '';
      const incomingClass = e?.detail?.className || 'all';
      setFilterSchool(incomingSchool);
      setFilterClass(incomingClass);
    };

    window.addEventListener('kitSearchUpdate', handleSearchUpdate);
    return () => window.removeEventListener('kitSearchUpdate', handleSearchUpdate);
  }, []);

  const { filteredKits, hasFilter } = useMemo(() => {
    const sourceKits = Array.isArray(kits) ? kits : [];

    const cleanSchool = (filterSchool || '').trim().toLowerCase();
    const isSchoolBlank = !cleanSchool || ['all', 'any school', 'select school', 'all schools'].includes(cleanSchool);

    const cleanClass = (filterClass || 'all').trim().toLowerCase();
    const isClassBlank = !cleanClass || ['all', 'any class', 'select class'].includes(cleanClass);

    const activeFilter = !isSchoolBlank || !isClassBlank;

    if (!activeFilter) {
      return { filteredKits: sourceKits, hasFilter: false };
    }

    const matches = sourceKits.filter((kit) => {
      const kSchool = (kit.school || kit.schoolName || 'Any School').trim().toLowerCase();
      const kClass = (kit.className || kit.classGrade || 'all').trim().toLowerCase();
      const kTitle = (kit.name || kit.title || '').trim().toLowerCase();
      const kSubtitle = (kit.subtitle || kit.description || '').trim().toLowerCase();

      let matchSchool = true;
      if (!isSchoolBlank) {
        matchSchool =
          kSchool === 'any school' ||
          kSchool.includes(cleanSchool) ||
          cleanSchool.includes(kSchool) ||
          kTitle.includes(cleanSchool) ||
          kSubtitle.includes(cleanSchool);
      }

      let matchClass = true;
      if (!isClassBlank) {
        matchClass =
          kClass === 'all' ||
          kClass === 'any class' ||
          kClass.includes(cleanClass) ||
          cleanClass.includes(kClass);
      }

      return matchSchool && matchClass;
    });

    // If specific filter yielded zero results, fallback to showing general "Any School" kits or full list so row is never blank
    if (matches.length === 0) {
      const fallbackKits = sourceKits.filter(k => (k.school || '').toLowerCase().includes('any school')) || sourceKits;
      return { filteredKits: fallbackKits.length > 0 ? fallbackKits : sourceKits, hasFilter: activeFilter };
    }

    return { filteredKits: matches, hasFilter: activeFilter };
  }, [kits, filterSchool, filterClass]);

  const resetFilter = () => {
    setFilterSchool('');
    setFilterClass('all');
    localStorage.removeItem('grabKitSchool');
    localStorage.removeItem('grabKitClass');
    window.dispatchEvent(new CustomEvent('kitSearchUpdate', { detail: { school: '', className: 'all' } }));
  };

  return (
    <div id="school-kits-row" className="bg-gray-50/70 pt-4 pb-4 border-b border-gray-100">
      <ProductCarouselRow 
        title={hasFilter ? `School Kits (${filteredKits.length} found)` : "School Kits"}
        products={filteredKits}
        onViewAll={() => onNavigate('products')}
        autoScroll={!hasFilter}
        autoScrollInterval={4500}
        renderCard={(kit) => <KitCard kit={kit} />}
        onResetFilter={hasFilter ? resetFilter : null}
      />
    </div>
  );
}
