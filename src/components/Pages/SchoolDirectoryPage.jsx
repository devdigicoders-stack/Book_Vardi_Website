import React, { useState } from 'react';
import { ArrowRight, School as SchoolIcon, MapPin, Navigation, Compass, AlertCircle } from 'lucide-react';
import { KIT_BUNDLES } from '../../data/mockData';
import { useLocation } from '../../context/LocationContext';

export default function SchoolDirectoryPage({ onNavigate }) {
  const { 
    nearbySchools, 
    schools: allSchools, 
    schoolRadiusKm, 
    locationLabel, 
    setIsPermissionModalOpen 
  } = useLocation();

  const [filterQuery, setFilterQuery] = useState('');

  // Extract unique schools from KIT_BUNDLES and match them with location-filtered schools
  const displayedSchools = nearbySchools.filter((school) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      (school.name && school.name.toLowerCase().includes(q)) ||
      (school.shortName && school.shortName.toLowerCase().includes(q)) ||
      (school.city && school.city.toLowerCase().includes(q)) ||
      (school.board && school.board.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Banner */}
      <div className="bg-brand-teal text-white py-12 px-4 border-b border-white/10 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-xs rounded-full text-xs font-semibold text-teal-100 mb-3 border border-white/20">
            <MapPin size={13} className="text-brand-yellow" />
            <span>Active Discovery Radius: <strong className="text-brand-yellow font-extrabold">{schoolRadiusKm} km</strong> from {locationLabel}</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
            Partner School Directory
          </h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm leading-relaxed">
            Showing verified partner schools located within {schoolRadiusKm} km of your location with exclusive uniforms and textbook bundles.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={() => setIsPermissionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Navigation size={14} className="fill-brand-teal-dark" />
              <span>Change Location / City</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 mt-8">
        {/* Results summary bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="font-bold text-gray-900">{displayedSchools.length} Schools</span>
            <span>found within</span>
            <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
              {schoolRadiusKm} km of {locationLabel.split(' ')[0]}
            </span>
          </div>

          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter school by name, board..."
            className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden w-full sm:w-64"
          />
        </div>

        {/* Schools Grid */}
        {displayedSchools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {displayedSchools.map((school) => {
              const kitForSchool = KIT_BUNDLES.find(
                (k) =>
                  k.school.toLowerCase().includes(school.name.toLowerCase()) ||
                  school.name.toLowerCase().includes(k.school.toLowerCase()) ||
                  (school.shortName && k.school.toLowerCase().includes(school.shortName.toLowerCase()))
              );

              return (
                <button
                  key={school.id || school.name}
                  className="group flex flex-col items-center bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80 hover:shadow-xl hover:border-brand-teal/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer text-center relative"
                  onClick={() => onNavigate('school-details', school.shortName || school.name)}
                >
                  {/* Distance Badge */}
                  <div className="absolute top-3 right-3">
                    {school.distanceKm != null ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full shadow-2xs">
                        <MapPin size={11} className="text-teal-600" />
                        {school.distanceKm} km away
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        In Radius
                      </span>
                    )}
                  </div>

                  <div className="w-20 h-20 rounded-full overflow-hidden mt-3 mb-4 border-2 border-gray-100 group-hover:border-brand-yellow group-hover:ring-4 group-hover:ring-brand-yellow/20 transition-all bg-gray-50 shadow-xs flex items-center justify-center">
                    {kitForSchool && kitForSchool.image ? (
                      <img
                        src={kitForSchool.image}
                        alt={school.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <SchoolIcon size={34} className="text-gray-400 group-hover:text-brand-teal transition-colors" />
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-gray-900 mb-1 group-hover:text-brand-teal transition-colors line-clamp-1">
                    {school.name}
                  </h3>

                  <div className="text-[11px] text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md">
                      {school.board || 'CBSE'}
                    </span>
                    <span>•</span>
                    <span>{school.city}</span>
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs font-bold text-brand-teal bg-brand-teal/5 group-hover:bg-brand-teal group-hover:text-white px-4 py-2 rounded-xl transition-colors mt-auto">
                    <span>View School Kits & Uniforms</span>
                    <ArrowRight size={14} />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Empty State when no school matches radius */
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-xs max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
              <Compass size={32} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg text-gray-900">
                No Schools Found Within {schoolRadiusKm} km
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                No partner institutions were found within the administrator's discovery radius for <strong className="text-gray-800">{locationLabel}</strong>.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={() => setIsPermissionModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Change Location / City
              </button>
              <button
                onClick={() => setFilterQuery('')}
                className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
