import React, { useState, useEffect, useMemo } from 'react';
import ProductCarouselRow from './ProductCarouselRow';
import KitCard from './KitCard';
import { KIT_BUNDLES } from '../../data/mockData';

export default function SchoolKitsRow({ onNavigate }) {
  const [filterSchool, setFilterSchool] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  useEffect(() => {
    // Check local storage on initial load
    const savedSchool = localStorage.getItem('grabKitSchool');
    const savedClass = localStorage.getItem('grabKitClass');
    if (savedSchool) setFilterSchool(savedSchool);
    if (savedClass) setFilterClass(savedClass);

    const handleSearchUpdate = (e) => {
      setFilterSchool(e.detail.school);
      setFilterClass(e.detail.className);
    };

    window.addEventListener('kitSearchUpdate', handleSearchUpdate);
    return () => window.removeEventListener('kitSearchUpdate', handleSearchUpdate);
  }, []);

  const filteredKits = useMemo(() => {
    return KIT_BUNDLES.filter((kit) => {
      const matchSchool = filterSchool === '' || kit.school.toLowerCase().includes(filterSchool.toLowerCase()) || kit.name.toLowerCase().includes(filterSchool.toLowerCase());
      const matchClass = filterClass === 'all' || kit.className === filterClass;
      return matchSchool && matchClass;
    });
  }, [filterSchool, filterClass]);

  const hasFilter = filterSchool !== '' || filterClass !== 'all';

  const resetFilter = () => {
    setFilterSchool('');
    setFilterClass('all');
    localStorage.removeItem('grabKitSchool');
    localStorage.removeItem('grabKitClass');
    // Notify GrabKitSection to reset its UI
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
