import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, GraduationCap, ShieldCheck } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Loading academic store...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Progress animation timeline
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 15) + 8;
        return next > 100 ? 100 : next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 40) {
      setStatusText('Connecting to Bookvardi network...');
    } else if (progress < 75) {
      setStatusText('Loading partner schools & uniforms...');
    } else if (progress < 100) {
      setStatusText('Preparing your academic storefront...');
    } else {
      setStatusText('Welcome to Bookvardi! ✨');
      
      // Initiate fade-out after hitting 100%
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        const exitTimer = setTimeout(() => {
          setIsVisible(false);
          if (onComplete) onComplete();
        }, 600); // 600ms fade out transition
        return () => clearTimeout(exitTimer);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-[#0c3c40] via-brand-teal to-[#08292c] text-white flex flex-col items-center justify-center p-6 select-none transition-all duration-700 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Animated Ambient Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-yellow/15 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-brand-pink/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Animated Brand Badge */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-brand-yellow via-brand-pink to-brand-yellow rounded-3xl blur-md opacity-75 animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-brand-teal-dark border-2 border-brand-yellow/40 rounded-3xl flex items-center justify-center shadow-2xl transform transition-transform duration-500 hover:scale-105">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-brand-yellow animate-bounce" />
            <GraduationCap className="w-5 h-5 text-white absolute top-2 right-2 opacity-80" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-1 drop-shadow-md">
          Book<span className="text-brand-yellow">vardi</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-white/80 tracking-wide uppercase mb-8 flex items-center gap-1.5 justify-center">
          <Sparkles className="w-3.5 h-3.5 text-brand-yellow" />
          <span>One-Stop School & Academic Store</span>
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-white/10 p-1.5 rounded-full backdrop-blur-md border border-white/15 mb-3 shadow-inner">
          <div
            className="h-2 bg-gradient-to-r from-brand-yellow via-amber-300 to-emerald-400 rounded-full transition-all duration-200 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Text & Percentage */}
        <div className="w-full flex items-center justify-between text-[11px] font-bold text-white/75 px-1">
          <span className="animate-pulse">{statusText}</span>
          <span className="font-mono text-brand-yellow font-extrabold">{progress}%</span>
        </div>

        {/* Footer Trust Badge */}
        <div className="mt-12 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-yellow" />
          <span>100% Verified Student Supplies</span>
        </div>
      </div>
    </div>
  );
}
