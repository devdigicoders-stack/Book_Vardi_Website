import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, CheckCircle2, ShoppingBag } from 'lucide-react';
import { HERO_SLIDES } from '../../data/mockData';

export default function HeroSection({ onNavigate }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = HERO_SLIDES[activeSlide];

  // Auto-scroll functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleShopNow = () => {
    if (onNavigate) onNavigate('products');
  };

  const handleExplore = () => {
    if (onNavigate) onNavigate('products');
  };

  return (
    <section className="relative py-12 sm:py-16 lg:py-16 border-b border-gray-100 overflow-hidden bg-brand-teal-dark lg:bg-transparent lg:bg-gradient-to-b lg:from-gray-50 lg:to-white">
      {/* Small Devices Background Hero Image & Dark Overlay (hidden on lg+) */}
      <div className="absolute inset-0 lg:hidden overflow-hidden pointer-events-none">
        <img
          src={slide.image}
          alt="Hero Background"
          className="w-full h-full object-cover object-center transform scale-105 filter brightness-[0.32] contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-teal-dark via-brand-teal-dark/85 to-brand-teal-dark/65" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Content Column */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-4 sm:space-y-5">
            <span className="inline-block bg-brand-yellow text-brand-teal-dark text-xs font-extrabold uppercase px-3 py-1 rounded tracking-wider shadow-xs">
              {slide.eyebrow}
            </span>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white lg:text-brand-teal tracking-tight leading-[1.15]">
              Everything You Need,{' '}
              <span className="text-brand-yellow lg:text-brand-pink block sm:inline">All in One Place.</span>
            </h1>

            <p className="text-white/90 lg:text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-lg">
              {slide.description}
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-3 sm:gap-4 pt-1 sm:pt-2 flex-wrap">
              <button
                className="inline-flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm cursor-pointer"
                onClick={handleShopNow}
              >
                <ShoppingBag size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>{slide.primaryCta}</span>
              </button>

              <button
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 lg:bg-white lg:hover:bg-brand-teal/5 lg:text-brand-teal lg:border-gray-300 font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all text-xs sm:text-sm cursor-pointer backdrop-blur-xs shadow-xs"
                onClick={handleExplore}
              >
                <span>{slide.secondaryCta}</span>
                <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            {/* Mobile Feature Badges (< lg) */}
            <div className="flex items-center gap-2.5 pt-1 lg:hidden flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-white/90 text-[11px] font-semibold bg-white/10 backdrop-blur px-2.5 py-1 rounded-full border border-white/15">
                <Sparkles size={12} className="text-brand-yellow" />
                Curated Study Kits
              </span>
              <span className="inline-flex items-center gap-1.5 text-white/90 text-[11px] font-semibold bg-white/10 backdrop-blur px-2.5 py-1 rounded-full border border-white/15">
                <CheckCircle2 size={12} className="text-brand-yellow" />
                100% Eco-Friendly
              </span>
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center gap-2 pt-2 sm:pt-4">
              {HERO_SLIDES.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activeSlide === index
                      ? 'w-8 bg-brand-yellow lg:bg-brand-teal'
                      : 'w-2 bg-white/40 lg:bg-gray-300 hover:bg-white/60 lg:hover:bg-gray-400'
                  }`}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Visual Showcase Card (Desktop lg+ only) */}
          <div className="hidden lg:block lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden p-3 bg-gradient-to-br from-brand-yellow/20 via-pink-50 to-brand-pink/20 border border-gray-200 shadow-xl">
              <img
                src={slide.image}
                alt="Book Vardi Stationery Showcase"
                className="w-full h-80 sm:h-96 object-cover rounded-xl transition-transform duration-500 hover:scale-[1.02]"
              />

              {/* Floating Top Badge */}
              <div className="absolute top-6 right-6 bg-white/95 backdrop-blur border border-gray-200 border-l-4 border-l-brand-pink rounded-xl px-4 py-2.5 shadow-md flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-pink/15 text-brand-pink flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Make It Happen</div>
                  <div className="text-[10px] text-gray-500">Curated Study Kits</div>
                </div>
              </div>

              {/* Floating Bottom Badge */}
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur border border-gray-200 border-l-4 border-l-brand-yellow rounded-xl px-4 py-2.5 shadow-md flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-yellow/25 text-brand-ochre flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">100% Eco-Friendly</div>
                  <div className="text-[10px] text-gray-500">Certified Non-Toxic Paper</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
