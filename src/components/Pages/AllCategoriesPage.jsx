import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight, Layers } from 'lucide-react';
import { fetchCategoryTreeFromBackend } from '../../utils/api';
import { CATEGORY_STRUCTURE } from '../../constants/categories';

export default function AllCategoriesPage({ onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryTreeFromBackend()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(CATEGORY_STRUCTURE);
        }
        setLoading(false);
      })
      .catch(() => {
        setCategories(CATEGORY_STRUCTURE);
        setLoading(false);
      });
  }, []);

  const displayList = categories && categories.length > 0 ? categories : CATEGORY_STRUCTURE;

  return (
    <div className="min-h-screen bg-gray-50/60 pb-20">
      {/* Header Banner */}
      <div className="bg-brand-teal text-white py-12 px-4 border-b border-white/10 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
            All Product Categories
          </h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm">
            Browse our complete catalog of school supplies, uniforms, NCERT textbooks, stationary, footwear and backpacks.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayList.map((cat, idx) => {
            const catName = cat.name || cat.title || 'Category';
            const catImg = cat.imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop&q=80';
            const subList = Array.isArray(cat.subCategories) ? cat.subCategories : [];

            return (
              <div
                key={cat._id || cat.id || idx}
                className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 hover:shadow-xl hover:border-brand-teal/20 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Category Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand-teal/10 p-0.5 bg-gray-50 shrink-0 group-hover:scale-105 transition-transform">
                      <img
                        src={catImg}
                        alt={catName}
                        className="w-full h-full object-cover rounded-xl"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-brand-teal group-hover:text-brand-pink transition-colors">
                        {catName}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {cat.description || `${subList.length} subcategories available`}
                      </p>
                    </div>
                  </div>

                  {/* Subcategories Badges List */}
                  <div className="space-y-2 mb-6">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Sub-Categories
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {subList.map((sub, sIdx) => {
                        const subName = typeof sub === 'string' ? sub : (sub.name || sub.title);
                        return (
                          <button
                            key={sub._id || sub.slug || sIdx}
                            onClick={() => onNavigate('products', catName, subName)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-brand-teal hover:text-white transition-all cursor-pointer border border-gray-100 hover:border-brand-teal"
                          >
                            {subName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* View All In Category Action */}
                <button
                  onClick={() => onNavigate('products', catName)}
                  className="w-full py-2.5 px-4 bg-brand-teal/5 hover:bg-brand-teal hover:text-white text-brand-teal rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer group/btn"
                >
                  <span>Explore All {catName}</span>
                  <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
