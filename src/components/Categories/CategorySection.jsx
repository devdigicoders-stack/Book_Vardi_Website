export const getCategoryDefaultImage = (name = '') => {
  const n = String(name || '').toLowerCase().trim();
  if (n.includes('uniform') || n.includes('dress') || n.includes('shirt') || n.includes('pant') || n.includes('coat') || n.includes('skirt') || n.includes('blazer')) {
    return 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&auto=format&fit=crop&q=80'; // School Uniform
  }
  if (n.includes('book') || n.includes('notebook') || n.includes('copy') || n.includes('ncert') || n.includes('guide') || n.includes('pustak')) {
    return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80'; // Books & Textbooks
  }
  if (n.includes('footwear') || n.includes('shoe') || n.includes('shoes') || n.includes('boot') || n.includes('sock') || n.includes('sneaker')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80'; // Shoes & Footwear
  }
  if (n.includes('cap') || n.includes('hat') || n.includes('belt') || n.includes('tie') || n.includes('badge') || n.includes('access')) {
    return 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&auto=format&fit=crop&q=80'; // Cap & Accessories
  }
  if (n.includes('bag') || n.includes('backpack') || n.includes('bottle') || n.includes('lunch')) {
    return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80'; // School Bags
  }
  if (n.includes('station') || n.includes('pen') || n.includes('pencil') || n.includes('geometry') || n.includes('art') || n.includes('craft')) {
    return 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80'; // Stationery Supplies
  }
  return 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&auto=format&fit=crop&q=80'; // Education General
};

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { fetchCategoriesFromBackend } from '../../utils/api';

export default function CategorySection({ activeCategory, onSelectCategory, onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchCategoriesFromBackend()
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setCategories([]);
        setLoading(false);
      });
  }, []);


  return (
    <section className="py-10 md:py-14 bg-white border-b border-gray-100 overflow-hidden" id="categories">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-10 text-center sm:text-left">
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wider uppercase text-brand-teal inline-block relative pb-2 mx-auto sm:mx-0">
            SHOP BY CATEGORY
            <span className="absolute bottom-0 left-1/2 sm:left-0 transform -translate-x-1/2 sm:translate-x-0 w-12 h-0.5 bg-brand-yellow rounded-full" />
          </h2>
          
          <button
            onClick={() => onNavigate && onNavigate('all-categories')}
            className="text-xs font-bold text-brand-teal hover:text-brand-pink transition-colors inline-flex items-center justify-center gap-1 uppercase tracking-wider cursor-pointer mx-auto sm:mx-0 bg-brand-teal/5 hover:bg-brand-teal/10 px-4 py-2 rounded-xl"
          >
            <span>VIEW ALL CATEGORIES</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Categories: Horizontal X-Axis Scrollable */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex flex-nowrap gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x snap-mandatory touch-pan-x scroll-smooth"
          >
            {categories.length === 0 ? (
              <div className="w-full text-center py-6 text-xs font-semibold text-gray-500">
                No categories related found.
              </div>
            ) : (
              categories.map((cat) => {
                const catId = cat.slug || cat.id || cat._id || cat.name?.toLowerCase().replace(/\s+/g, '_');
                const isSelected = activeCategory === catId;
                const rawImg = cat.imageUrl || cat.image;
                const catImg = (rawImg && typeof rawImg === 'string' && rawImg.trim() !== '') ? rawImg : getCategoryDefaultImage(cat.name);

                return (
                  <button
                    key={cat._id || cat.id || catId}
                    className={`flex flex-col items-center text-center p-2 rounded-xl transition-all transform hover:-translate-y-1 group shrink-0 min-w-[100px] sm:min-w-[110px] md:min-w-[120px] snap-center cursor-pointer ${
                      isSelected ? 'scale-105' : ''
                    }`}
                    onClick={() => onSelectCategory(catId === activeCategory ? null : catId)}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-20 h-20 sm:w-24 sm:h-24 md:w-26 md:h-26 rounded-full overflow-hidden mb-2.5 border-2 transition-all p-1 bg-white shadow-xs ${
                        isSelected
                          ? 'border-brand-teal ring-4 ring-brand-yellow/80 shadow-md scale-105'
                          : 'border-gray-200 group-hover:border-brand-yellow group-hover:shadow-md'
                      }`}
                    >
                      <img
                        src={catImg}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCategoryDefaultImage(cat.name);
                        }}
                      />
                    </div>

                    {/* Text */}
                    <span className="text-[11px] sm:text-xs font-extrabold tracking-wider text-brand-teal uppercase mb-0.5 group-hover:text-brand-pink transition-colors whitespace-nowrap">
                      {cat.name}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 group-hover:text-brand-teal group-hover:underline">
                      {isSelected ? 'Viewing Items' : 'Shop Now'}
                    </span>
                  </button>
                );
              })
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
