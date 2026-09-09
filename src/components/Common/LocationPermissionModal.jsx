import React from 'react';
import { MapPin, Navigation, Compass, Check, AlertCircle, X, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={() => setIsPermissionModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* Header Hero Banner */}
        <div className="bg-linear-to-br from-brand-teal via-teal-900 to-teal-950 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-yellow/20 rounded-full blur-xl pointer-events-none" />
          <div className="w-14 h-14 bg-brand-yellow text-brand-teal-dark rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-3">
            <MapPin size={28} />
          </div>
          <h3 className="font-display font-extrabold text-xl tracking-tight text-white">
            Find Schools Near You
          </h3>
          <p className="text-teal-100/90 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
            Allow location access to discover official school uniforms & book sets within the admin-defined <strong className="text-brand-yellow font-bold">{schoolRadiusKm} km</strong> radius.
          </p>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-5">
          {locationError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Primary Action: Use Browser GPS */}
          <button
            onClick={requestBrowserLocation}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-75"
          >
            {isLocating ? (
              <>
                <div className="w-4 h-4 border-2 border-brand-teal-dark border-t-transparent rounded-full animate-spin" />
                <span>Locating Your Area...</span>
              </>
            ) : (
              <>
                <Navigation size={18} className="fill-brand-teal-dark" />
                <span>Use Current GPS Location</span>
              </>
            )}
          </button>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>We never store or share your exact coordinates</span>
          </div>

          {/* Separator */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Or Choose City
            </span>
          </div>

          {/* Manual City Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide">
              Popular Cities & Hubs
            </label>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city.id}
                  onClick={() => selectManualCity(city)}
                  className={`px-3 py-2 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    locationLabel === city.name
                      ? 'bg-brand-teal text-white border-brand-teal shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200/80 hover:bg-brand-teal/5 hover:border-brand-teal/30'
                  }`}
                >
                  <span className="truncate">{city.name.split(' ')[0]}</span>
                  {locationLabel === city.name && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Current Setting Note */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Current Active Filter</span>
              <span className="font-bold text-gray-900">{locationLabel}</span>
            </div>
            <span className="px-2.5 py-1 bg-teal-50 text-brand-teal font-extrabold text-[11px] rounded-lg">
              {nearbySchoolsCount} / {allSchoolsCount} in {schoolRadiusKm} km
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
