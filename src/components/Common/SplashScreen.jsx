import React, { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('bv_splash_shown')) {
        return false;
      }
    } catch {}
    return true;
  });
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    try {
      sessionStorage.setItem('bv_splash_shown', 'true');
    } catch {}

    const timer = setTimeout(() => {
      setIsFadingOut(true);
    }, 600);

    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 900);

    return () => {
      clearTimeout(timer);
      clearTimeout(exitTimer);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#172725] text-white flex flex-col items-center justify-center p-6 select-none transition-opacity duration-400 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center">
        {/* Brand Logo */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl p-2.5 shadow-xl flex items-center justify-center mb-4">
          <img
            src="/logo.png"
            alt="Bookvardi"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Brand Name */}
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
          BOOK<span className="text-brand-yellow">VARDI</span>
        </h1>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-medium text-white/70 tracking-wider uppercase mb-6">
          School & Academic Store
        </p>

        {/* Minimal Spinner */}
        <div className="w-5 h-5 border-2 border-white/20 border-t-brand-yellow rounded-full animate-spin" />
      </div>
    </div>
  );
}

