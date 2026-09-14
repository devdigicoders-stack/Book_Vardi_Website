import React, { useState, useEffect, useMemo } from 'react';
import ProductCarouselRow from './ProductCarouselRow';
import KitCard from './KitCard';
import { useLocation } from '../../context/LocationContext';
import { fetchKitsFromBackend } from '../../utils/api';
import { KIT_BUNDLES } from '../../data/mockData';

export default function SchoolKitsRow({ onNavigate }) {
  const { isSchoolWithinRadius } = useLocation();
  const [kits, setKits] = useState(KIT_BUNDLES);
  const [filterSchool, setFilterSchool] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  useEffect(() => {
    fetchKitsFromBackend()
      .then((res) => {
        const list = res?.kits || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setKits(list);
        } else {
          setKits(KIT_BUNDLES);
        }
      })
      .catch(() => setKits(KIT_BUNDLES));
  }, []);

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
    return kits.filter((kit) => {
      const kitSchool = kit.schoolName || kit.school || 'Any School';
      const kitClass = kit.classGrade || kit.className || 'all';
      const kitTitle = kit.title || kit.name || '';

      const withinRadius = kitSchool === 'Any School' || isSchoolWithinRadius(kitSchool);
      if (!withinRadius) return false;

      const matchSchool = filterSchool === '' || kitSchool.toLowerCase().includes(filterSchool.toLowerCase()) || kitTitle.toLowerCase().includes(filterSchool.toLowerCase());
      const matchClass = filterClass === 'all' || kitClass === filterClass;
      return matchSchool && matchClass;
    });
  }, [kits, filterSchool, filterClass, isSchoolWithinRadius]);


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
