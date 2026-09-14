import React from 'react';
import { Truck, Tag, RotateCcw, MapPin, ChevronDown } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

export default function TopAnnouncementBar({ onNavigate }) {
  const { userSubdistrict, locationLabel, setIsPermissionModalOpen } = useLocation();

  const displayLocality = userSubdistrict || locationLabel || 'Kamta, Lucknow';

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-brand-teal text-white/85 text-xs font-medium py-1.5 border-b border-white/10">
      <div className="container mx-auto px-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="inline-flex items-center gap-1.5 text-white/80 hover:text-brand-yellow transition-colors">
            <Truck size={14} className="text-brand-yellow shrink-0" />
            <span>Free Shipping on Orders Over <strong className="text-brand-yellow font-bold">₹499</strong></span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1.5 text-white/80 hover:text-brand-yellow transition-colors">
            <Tag size={14} className="text-brand-yellow shrink-0" />
            <span>10% OFF First Order | Code: <strong className="text-brand-yellow font-bold">SCHOOL10</strong></span>
          </div>
          <div className="hidden md:inline-flex items-center gap-1.5 text-white/80 hover:text-brand-yellow transition-colors">
            <RotateCcw size={14} className="text-brand-yellow shrink-0" />
            <span>30-Day Easy Returns</span>
          </div>
        </div>

        {/* User Subdistrict Location Badge (Kamta Lucknow, Jajmau Kanpur, RTO Azamgarh) */}
        {/* <button
          type="button"
          onClick={() => setIsPermissionModalOpen(true)}
          className="sm:hidden inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer shadow-2xs shrink-0"
          title="Click to change your delivery locality or city"
        >
          <MapPin size={12} className="text-brand-yellow shrink-0" />
          <span className="text-white/70 font-normal">Delivering to:</span>
          <span className="text-brand-yellow font-extrabold">{displayLocality}</span>
          <ChevronDown size={12} className="text-white/60 shrink-0" />
        </button> */}
      </div>
    </div>
  );
}
