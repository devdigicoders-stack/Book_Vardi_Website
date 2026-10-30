import React from 'react';
import { Truck, ShieldCheck, Award, RotateCcw, Headphones } from 'lucide-react';
const FEATURES = [
  { id: 1, title: '100% Genuine Books', desc: 'Direct from NCERT & top publishers', icon: 'Award' },
  { id: 2, title: 'School-Approved Uniforms', desc: 'Exact color, pattern & embroidery', icon: 'ShieldCheck' },
  { id: 3, title: 'Fast Doorstep Delivery', desc: 'Pan-India shipping within 3-5 days', icon: 'Truck' },
  { id: 4, title: 'Easy Returns & Swap', desc: 'Hassle-free 7-day exchange guarantee', icon: 'RotateCcw' },
  { id: 5, title: '24/7 Student Support', desc: 'Instant WhatsApp & phone helpdesk', icon: 'Headphones' }
];

export default function FeaturesBar() {
  return (
    <section className="bg-white py-8 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {FEATURES.map((item, idx) => {
            const iconMap = { Truck, ShieldCheck, Award, RotateCcw, Headphones };
            const IconComponent = iconMap[item.icon] || Award;
            const isLast = idx === FEATURES.length - 1;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 transition-colors group ${
                  isLast ? 'col-span-2 md:col-span-1 justify-center md:justify-start' : ''
                }`}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0 group-hover:bg-brand-yellow group-hover:text-brand-teal-dark group-hover:scale-105 transition-all">
                  <IconComponent size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] sm:text-xs font-extrabold tracking-wider text-brand-teal uppercase">
                    {item.title}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-500">
                    {item.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
