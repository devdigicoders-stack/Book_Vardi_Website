import React from 'react';
import { Truck, Tag, RotateCcw, Store } from 'lucide-react';

export default function TopAnnouncementBar({ onNavigate }) {
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
      </div>
    </div>
  );
}
