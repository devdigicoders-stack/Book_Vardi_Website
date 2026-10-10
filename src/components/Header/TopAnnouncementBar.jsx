import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { fetchAnnouncementsFromBackend } from '../../utils/api';

export default function TopAnnouncementBar({ onNavigate, onVisibilityChange }) {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadAnnouncements() {
      try {
        const res = await fetchAnnouncementsFromBackend();
        const list = res?.data || res?.announcements;
        if (Array.isArray(list) && list.length > 0 && isMounted) {
          setAnnouncements(list);
        }
      } catch (err) {
        // Fallback to defaults
      }
    }

    loadAnnouncements();

    const interval = setInterval(loadAnnouncements, 15000);
    window.addEventListener('focus', loadAnnouncements);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', loadAnnouncements);
    };
  }, []);

  const activeAnnouncements = announcements
    .filter(item => {
      if (!item || item.isActive === false) return false;
      if (item.expiryDate && new Date(item.expiryDate) <= new Date()) return false;
      return true;
    })
    .sort((a, b) => (a.priority || 1) - (b.priority || 1));

  useEffect(() => {
    if (typeof onVisibilityChange === 'function') {
      onVisibilityChange(activeAnnouncements.length > 0);
    }
  }, [activeAnnouncements.length, onVisibilityChange]);

  if (activeAnnouncements.length === 0) {
    return null;
  }

  const topItem = activeAnnouncements[0];
  const barBgColor = topItem?.bgColor || null;
  const barTextColor = topItem?.textColor || null;

  // Calculate repetitions and smooth duration so the ticker scrolls gently and is easy to read
  const repeatCount = Math.max(4, Math.ceil(8 / Math.max(1, activeAnnouncements.length)));
  const safeRepeatCount = repeatCount % 2 === 0 ? repeatCount : repeatCount + 1;
  const marqueeItems = Array.from({ length: safeRepeatCount }, () => activeAnnouncements).flat();

  // Set duration to ~18-20s per item in the 50% loop for a calm, comfortable reading pace (minimum 70s)
  const scrollDurationSeconds = Math.max(70, Math.round((safeRepeatCount / 2) * activeAnnouncements.length * 18));

  return (
    <>
      <style>{`
        @keyframes bvSeamlessMarquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .animate-bv-seamless-marquee {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: bvSeamlessMarquee ${scrollDurationSeconds}s linear infinite;
        }
        .animate-bv-seamless-marquee:hover,
        .animate-bv-seamless-marquee:active {
          animation-play-state: paused;
        }
      `}</style>
      <div 
        style={{
          backgroundColor: barBgColor || undefined,
          color: barTextColor || undefined
        }}
        className={`fixed top-0 left-0 right-0 z-[60] text-[11px] sm:text-xs font-semibold h-[28px] max-h-[28px] border-b border-white/10 flex items-center overflow-hidden whitespace-nowrap select-none ${
          !barBgColor ? 'bg-brand-teal text-white' : ''
        }`}
      >
        <div className="w-full flex items-center overflow-hidden whitespace-nowrap">
          <div className="animate-bv-seamless-marquee flex items-center">
            {marqueeItems.map((item, index) => {
              const itemId = item.id || item._id || index;
              const handleClick = () => {
                if (item.link && typeof onNavigate === 'function') {
                  onNavigate(item.link);
                }
              };

              return (
                <div
                  key={`${itemId}-${index}`}
                  onClick={item.link ? handleClick : undefined}
                  className={`inline-flex items-center gap-2 mx-8 shrink-0 ${
                    item.link ? 'cursor-pointer hover:underline' : ''
                  }`}
                >
                  {item.badge ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-brand-yellow text-brand-teal-dark uppercase shrink-0 shadow-2xs">
                      {item.badge}
                    </span>
                  ) : (
                    <Sparkles size={12} className="text-brand-yellow shrink-0 inline-block align-middle" />
                  )}
                  <span className="font-bold">{item.text}</span>
                  {item.link && <ArrowUpRight size={11} className="shrink-0 opacity-80 inline-block align-middle" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
