import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';

export default function AllCategoriesPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Banner */}
      <div className="bg-brand-teal text-white py-12 px-4 border-b border-white/10 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
            All Categories
          </h1>
          <p className="text-white/80 max-w-xl mx-auto">
            Browse our complete catalog of school supplies, from notebooks and pens to art materials and backpacks.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 mt-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className="group flex flex-col items-center bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-teal/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer text-center"
              onClick={() => {
                if (cat.id === 'school_specific') {
                  onNavigate('school-directory');
                } else {
                  onNavigate('products', cat.id);
                }
              }}
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-4 border-2 border-gray-100 group-hover:border-brand-yellow group-hover:ring-4 group-hover:ring-brand-yellow/20 transition-all p-1 bg-gray-50 shadow-xs">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <h3 className="text-sm font-extrabold tracking-wider text-brand-teal uppercase mb-2 group-hover:text-brand-pink transition-colors">
                {cat.name}
              </h3>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-brand-teal bg-brand-teal/5 group-hover:bg-brand-pink group-hover:text-white px-3 py-1.5 rounded-lg transition-colors mt-auto">
                <span>Explore</span>
                <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
