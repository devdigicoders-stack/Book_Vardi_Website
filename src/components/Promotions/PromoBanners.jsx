import React, { useState, useEffect } from 'react';
import { ArrowRight, Tag, Sparkles } from 'lucide-react';
import GrabKitSection from '../Products/GrabKitSection';

const COMBINED_PROMOS = [
  {
    id: 1,
    type: 'OFFER',
    title: 'Up to 25% Off',
    subtitle: 'On Select School Uniforms & Winter Wear.',
    image: 'https://plus.unsplash.com/premium_photo-1673356302067-aac3b545a362?w=400&auto=format&fit=crop&q=80',
    color: 'from-pink-50 via-rose-50 to-brand-pink/15',
    borderColor: 'border-pink-100',
    btnColor: 'bg-brand-pink hover:bg-brand-pink-hover',
    iconColor: 'text-brand-pink',
    icon: Tag,
    action: 'SHOP THE DEALS'
  },
  {
    id: 2,
    type: 'NEW',
    title: 'Fresh Arrivals',
    subtitle: 'Explore our latest winter uniform collection.',
    image: 'https://images.unsplash.com/photo-1588622153496-c67bfae6f4df?w=400&auto=format&fit=crop&q=80',
    color: 'from-teal-50/70 via-cyan-50/30 to-brand-teal/10',
    borderColor: 'border-teal-100',
    btnColor: 'bg-brand-teal hover:bg-brand-teal-light',
    iconColor: 'text-brand-teal',
    icon: Sparkles,
    action: 'DISCOVER NOW'
  },
  {
    id: 3,
    type: 'OFFER',
    title: 'Buy 1 Get 1 Free',
    subtitle: 'On select Practice & Drawing Books.',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&auto=format&fit=crop&q=80',
    color: 'from-amber-50 via-yellow-50 to-brand-yellow/30',
    borderColor: 'border-amber-100',
    btnColor: 'bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark',
    iconColor: 'text-brand-teal-dark',
    icon: Tag,
    action: 'SHOP THE DEALS'
  },
  {
    id: 4,
    type: 'NEW',
    title: 'Latest NCERT Guides',
    subtitle: 'Updated editions for all classes now in stock.',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    color: 'from-blue-50 via-indigo-50 to-indigo-200/40',
    borderColor: 'border-blue-100',
    btnColor: 'bg-indigo-500 hover:bg-indigo-600',
    iconColor: 'text-indigo-600',
    icon: Sparkles,
    action: 'DISCOVER NOW'
  }
];

export default function PromoBanners({ onNavigate }) {
  const [promoIndex, setPromoIndex] = useState(0);

  const handlePromoClick = (type) => {
    if (onNavigate) {
      onNavigate(type === 'NEW' ? 'new-arrivals' : 'offers');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % COMBINED_PROMOS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const promo = COMBINED_PROMOS[promoIndex];
  const Icon = promo.icon;

  return (
    <section className="py-6 bg-white border-b border-gray-100 relative z-40" id="promotions">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* Banner 1: Combined Promo Carousel */}

          <div className="lg:col-span-7 h-full">
            <div className="h-full rounded-2xl shadow-sm border border-gray-100">
              <GrabKitSection onNavigate={onNavigate} />
            </div>
          </div>
          {/* Banner 2: Grab Your School Kit (Compact) */}
          <div className={`lg:col-span-5 rounded-2xl p-5 sm:p-6 bg-gradient-to-br ${promo.color} border ${promo.borderColor} flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-500`}>
            <div className="flex flex-col items-start space-y-2 w-full sm:w-auto h-full justify-center">
              <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider ${promo.iconColor}`}>
                <Icon size={12} />
                {promo.type === 'NEW' ? 'NEW ARRIVALS' : 'LIMITED TIME OFFER'}
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight transition-opacity duration-300">
                {promo.title}
              </h3>
              <p className="text-xs text-gray-700 pb-1 sm:pb-2 transition-opacity duration-300 line-clamp-2">
                {promo.subtitle}
              </p>
              <button
                className={`inline-flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer mt-auto ${promo.btnColor}`}
                onClick={() => handlePromoClick(promo.type)}
              >
                <span>{promo.action}</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="w-full sm:w-36 md:w-40 h-32 shrink-0 rounded-xl overflow-hidden shadow-xs bg-white relative">
              {COMBINED_PROMOS.map((item, idx) => (
                <img
                  key={item.id}
                  src={item.image}
                  alt={item.title}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${idx === promoIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                  loading="lazy"
                />
              ))}
            </div>

            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 hidden">
              {COMBINED_PROMOS.map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === promoIndex ? 'bg-gray-800' : 'bg-gray-300'}`} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
