import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { fetchAnnouncementsFromBackend } from '../../utils/api';

const DEFAULT_ANNOUNCEMENTS = [
  { id: 1, text: 'Free Shipping on Orders Over ₹499', badge: 'FREE SHIPPING', link: '', priority: 1, isActive: true },
  { id: 2, text: '10% OFF Your First Order | Use Code: SCHOOL10', badge: '10% OFF', link: '', priority: 2, isActive: true },
  { id: 3, text: '30-Day Hassle-Free Returns on Uniforms', badge: 'EASY RETURNS', link: '', priority: 3, isActive: true }
];

export default function TopAnnouncementBar({ onNavigate }) {
  const [announcements, setAnnouncements] = useState(DEFAULT_ANNOUNCEMENTS);

  useEffect(() => {
    let isMounted = true;
    async function loadAnnouncements() {
      try {
        const res = await fetchAnnouncementsFromBackend();
        const list = res?.data || res?.announcements;
        if (Array.isArray(list) && isMounted) {
          setAnnouncements(list);
        }
      } catch (err) {
        console.warn('Failed to load live announcements for TopAnnouncementBar, using defaults:', err);
      }
    }

    loadAnnouncements();

    const interval = setInterval(loadAnnouncements, 10000); // 10s auto-refresh interval
    window.addEventListener('focus', loadAnnouncements);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', loadAnnouncements);
    };
  }, []);

  // Filter active and non-expired announcements, sorted by priority (1 = highest)
  const activeAnnouncements = announcements
    .filter(item => {
      if (!item || item.isActive === false) return false;
      if (item.expiryDate && new Date(item.expiryDate) <= new Date()) return false;
      return true;
    })
    .sort((a, b) => (a.priority || 1) - (b.priority || 1));

  if (activeAnnouncements.length === 0) {
    return null;
  }

  // Use the highest priority item's custom colors if provided, or default brand teal
  const topItem = activeAnnouncements[0];
  const barBgColor = topItem?.bgColor || null;
  const barTextColor = topItem?.textColor || null;

  return (
    <div 
      style={{
        backgroundColor: barBgColor || undefined,
        color: barTextColor || undefined
      }}
      className={`fixed top-0 left-0 right-0 z-[60] text-xs font-medium py-1.5 border-b border-white/10 ${
        !barBgColor ? 'bg-brand-teal text-white/85' : ''
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap w-full justify-center sm:justify-start">
          {activeAnnouncements.map((item, index) => {
            const itemId = item.id || item._id || index;
            const handleClick = () => {
              if (item.link && typeof onNavigate === 'function') {
                onNavigate(item.link);
              }
            };

            return (
              <div 
                key={itemId}
                onClick={item.link ? handleClick : undefined}
                className={`inline-flex items-center gap-1.5 transition-colors ${
                  item.link ? 'cursor-pointer hover:underline' : ''
                } ${index > 0 ? 'hidden sm:inline-flex' : 'inline-flex'}`}
              >
                {item.badge ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-brand-yellow text-brand-teal-dark uppercase shrink-0">
                    {item.badge}
                  </span>
                ) : (
                  <Sparkles size={14} className="text-brand-yellow shrink-0" />
                )}
                <span>{item.text}</span>
                {item.link && <ArrowUpRight size={12} className="shrink-0 opacity-70" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
