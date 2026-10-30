import React from 'react';
import { MapPin, Navigation, Check, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { useLocation, POPULAR_CITIES } from '../../context/LocationContext';

export default function LocationPermissionModal() {
  const {
    isPermissionModalOpen,
    setIsPermissionModalOpen,
    requestBrowserLocation,
    selectManualCity,
    isLocating,
    locationError,
    locationLabel,
    schoolRadiusKm,
    nearbySchoolsCount,
    allSchoolsCount
  } = useLocation();

  if (!isPermissionModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={() => setIsPermissionModalOpen(false)}
          className="absolute top-2.5 right-2.5 p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X size={15} />
        </button>

        {/* Ultra-Compact Header Banner */}
        <div className="bg-linear-to-r from-brand-teal via-teal-900 to-teal-950 px-3.5 py-2.5 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-brand-yellow/20 rounded-full blur-md pointer-events-none" />
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-yellow text-brand-teal-dark rounded-lg flex items-center justify-center shadow-xs shrink-0 font-bold">
              <MapPin size={15} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-xs tracking-tight text-white leading-none">
                Find Schools Near You
              </h3>
              <p className="text-teal-100/90 text-[10px] mt-0.5 leading-none">
                Uniforms & books within <strong className="text-brand-yellow font-bold">{schoolRadiusKm} km</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body - Reduced Height */}
        <div className="p-3 space-y-2">
          {locationError && (
            <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[10px] flex items-center gap-1.5">
              <AlertCircle size={13} className="text-amber-600 shrink-0" />
              <span className="leading-tight">{locationError}</span>
            </div>
          )}

          {/* Primary GPS Action Button */}
          <button
            onClick={requestBrowserLocation}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-75"
          >
            {isLocating ? (
              <>
                <div className="w-3 h-3 border-2 border-brand-teal-dark border-t-transparent rounded-full animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Navigation size={13} className="fill-brand-teal-dark" />
                <span>Use Current GPS Location</span>
              </>
            )}
          </button>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-1 text-[9px] text-gray-400">
            <ShieldCheck size={11} className="text-emerald-600" />
            <span>Coordinates are never stored or shared</span>
          </div>

          {/* Separator */}
          <div className="relative flex items-center justify-center my-0.5">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-2 text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">
              Or Choose City
            </span>
          </div>

          {/* Manual City Selector - Ultra Compact 3-Column Grid */}
          <div className="grid grid-cols-3 gap-1">
            {POPULAR_CITIES.map((city) => {
              const isActive = locationLabel === city.name;
              return (
                <button
                  key={city.id}
                  onClick={() => selectManualCity(city)}
                  title={city.name}
                  className={`px-1.5 py-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer flex items-center justify-between gap-0.5 leading-tight ${
                    isActive
                      ? 'bg-brand-teal text-white border-brand-teal shadow-2xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200/80 hover:bg-brand-teal/5 hover:border-brand-teal/30'
                  }`}
                >
                  <span className="truncate">{city.name}</span>
                  {isActive && <Check size={10} className="shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Current Active Filter Badge */}
          <div className="p-2 bg-gray-50 rounded-lg border border-gray-200/70 flex items-center justify-between text-[10px] mt-1">
            <div className="min-w-0 pr-1">
              <span className="text-[8px] text-gray-400 uppercase font-extrabold block leading-none">Active Area</span>
              <span className="font-bold text-gray-900 truncate block text-[11px] leading-tight">{locationLabel}</span>
            </div>
            <span className="px-2 py-0.5 bg-teal-50 border border-teal-100 text-brand-teal font-extrabold text-[10px] rounded-md shrink-0">
              {nearbySchoolsCount} / {allSchoolsCount} in {schoolRadiusKm} km
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
