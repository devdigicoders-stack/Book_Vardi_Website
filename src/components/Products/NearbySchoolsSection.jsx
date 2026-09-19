import React, { useState, useMemo } from 'react';
import { School as SchoolIcon, MapPin, ArrowRight, ChevronDown, CheckCircle2, Building2 } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

export default function NearbySchoolsSection({ onNavigate }) {
  const {
    schools: allSchools,
    nearbySchools,
    userSubdistrict,
    locationLabel,
    schoolRadiusKm,
    setIsPermissionModalOpen
  } = useLocation();

  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Derive district and subdistrict strings from user location label/subdistrict
  const { userDistrictStr, userSubdistrictStr } = useMemo(() => {
    let subStr = (userSubdistrict || locationLabel || '').trim();
    let distStr = '';
    
    if (subStr.includes(',')) {
      const parts = subStr.split(',').map(s => s.trim());
      subStr = parts[0];
      distStr = parts[1] || parts[0];
    } else {
      distStr = subStr;
    }
    return { userDistrictStr: distStr, userSubdistrictStr: subStr };
  }, [userSubdistrict, locationLabel]);

  // Filter schools matching user's subdistrict and district first, fallback to nearbySchools
  const matchedSchools = useMemo(() => {
    const list = nearbySchools && nearbySchools.length > 0 ? nearbySchools : allSchools;
    if (!list || list.length === 0) return [];

    const lowSub = userSubdistrictStr.toLowerCase();
    const lowDist = userDistrictStr.toLowerCase();

    // Direct district / subdistrict matches first
    const directMatches = list.filter((school) => {
      const schDist = (school.district || '').toLowerCase();
      const schSub = (school.subdistrict || '').toLowerCase();
      const schAddr = (school.address || '').toLowerCase();
      const schCity = (school.city || '').toLowerCase();

      return (
        (schSub && lowSub.includes(schSub)) ||
        (schDist && lowDist.includes(schDist)) ||
        (schAddr && (schAddr.includes(lowSub) || schAddr.includes(lowDist))) ||
        (schCity && lowDist.includes(schCity))
      );
    });

    const candidateList = directMatches.length > 0 ? directMatches : list;

    // Optional class filter
    if (selectedClassFilter === 'all') return candidateList;

    return candidateList.filter((school) => {
      if (!school.classes) return true;
      if (Array.isArray(school.classes)) {
        return school.classes.includes(selectedClassFilter);
      }
      return String(school.classes).toLowerCase().includes(selectedClassFilter.toLowerCase());
    });
  }, [allSchools, nearbySchools, userDistrictStr, userSubdistrictStr, selectedClassFilter]);

  const displayedSchools = useMemo(() => {
    return matchedSchools.slice(0, visibleCount);
  }, [matchedSchools, visibleCount]);

  const hasMore = visibleCount < matchedSchools.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  const AVAILABLE_CLASSES = [
    'all', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3',
    'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9',
    'Class 10', 'Class 11', 'Class 12'
  ];

  return (
    <section id="nearby-schools-section" className="py-12 bg-white border-b border-gray-100">
      <div className="container mx-auto max-w-7xl px-4">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200/80 rounded-full text-xs font-bold text-teal-800 mb-2.5">
              <MapPin size={13} className="text-brand-teal" />
              <span>Partner Schools in {userSubdistrictStr || locationLabel}</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Nearby Partner Schools & Textbooks
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-2xl">
              Discover verified partner schools near <strong className="text-gray-800">{userSubdistrictStr}</strong> ({userDistrictStr}) offering authorized uniforms, textbook sets, and official school supply kits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPermissionModalOpen(true)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <MapPin size={14} className="text-brand-teal" />
              <span>Change Location</span>
            </button>
            <button
              onClick={() => onNavigate('school-directory')}
              className="px-4 py-2 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
            >
              <span>Full Directory</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Quick Class Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
            Filter Grade:
          </span>
          {AVAILABLE_CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => {
                setSelectedClassFilter(cls);
                setVisibleCount(10);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                selectedClassFilter === cls
                  ? 'bg-brand-yellow text-brand-teal-dark border-brand-yellow font-extrabold shadow-xs'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cls === 'all' ? 'All Classes' : cls}
            </button>
          ))}
        </div>

        {/* Schools List / Grid */}
        {displayedSchools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {displayedSchools.map((school) => {
              const classesList = Array.isArray(school.classes)
                ? school.classes
                : (school.classes ? String(school.classes).split(',').map(s => s.trim()) : []);

              return (
                <div
                  key={school.id || school.name}
                  className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-brand-teal/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Badge & Distance */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-extrabold uppercase rounded-md">
                          {school.board || 'CBSE'}
                        </span>
                        {school.exclusiveKit && (
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                            <CheckCircle2 size={10} className="text-amber-600" />
                            Official Kit Partner
                          </span>
                        )}
                      </div>

                      {school.distanceKm != null ? (
                        <span className="text-[11px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full shrink-0">
                          {school.distanceKm} km away
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                          {school.subdistrict || school.city || 'Matched'}
                        </span>
                      )}
                    </div>

                    {/* School Title & Address */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center font-bold shrink-0 border border-teal-100 group-hover:bg-brand-teal group-hover:text-white transition-colors">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h3 
                          onClick={() => onNavigate('school-details', school.shortName || school.name)}
                          className="font-extrabold text-base text-gray-900 group-hover:text-brand-teal transition-colors cursor-pointer line-clamp-1"
                        >
                          {school.name}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-gray-400 shrink-0" />
                          <span className="truncate">{school.address || school.city}</span>
                        </p>
                      </div>
                    </div>

                    {/* Classes Array List Pills */}
                    <div className="mb-4">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Available Grade Levels ({classesList.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {classesList.map((clsName) => (
                          <span
                            key={clsName}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                              selectedClassFilter === clsName
                                ? 'bg-brand-teal text-white border-brand-teal font-extrabold'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-200'
                            }`}
                          >
                            {clsName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Est. Students: <strong className="text-gray-800 font-bold">{school.studentCount || 1000}+</strong>
                    </span>
                    <button
                      onClick={() => onNavigate('school-details', school.shortName || school.name)}
                      className="px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>Explore Uniforms & Kits</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200 max-w-md mx-auto">
            <SchoolIcon size={36} className="text-gray-400 mx-auto mb-2" />
            <h4 className="font-extrabold text-gray-800 text-sm">No schools matching "{selectedClassFilter}"</h4>
            <p className="text-xs text-gray-500 mt-1">Try selecting a different grade filter or reset location.</p>
            <button
              onClick={() => setSelectedClassFilter('all')}
              className="mt-3 px-4 py-1.5 bg-brand-teal text-white text-xs font-bold rounded-lg"
            >
              Show All Classes
            </button>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-brand-teal font-extrabold text-xs rounded-xl border-2 border-brand-teal shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <span>Load More Partner Schools ({matchedSchools.length - visibleCount} remaining)</span>
              <ChevronDown size={16} />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
