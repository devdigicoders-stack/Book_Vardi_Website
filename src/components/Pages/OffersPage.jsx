import React, { useState, useEffect } from 'react';
import { Tag, Sparkles } from 'lucide-react';
import { ALL_PRODUCTS } from '../../data/mockData';
import ProductCard from '../Products/ProductCard';

export default function OffersPage({ onNavigate }) {
  // Filter products that have an originalPrice (meaning they are discounted)
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Just an example of filtering products that have discounts
    const offers = ALL_PRODUCTS.filter(p => p.originalPrice && p.price < p.originalPrice)
      .sort((a, b) => {
        const discA = (a.originalPrice - a.price) / a.originalPrice;
        const discB = (b.originalPrice - b.price) / b.originalPrice;
        return discB - discA; // Sort by highest discount %
      });
    setProducts(offers);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Banner */}
      <div className="bg-brand-teal text-white py-12 px-4 border-b border-white/10 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-pink/20 blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <span className="inline-flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-brand-pink mb-3 bg-brand-pink/10 px-3 py-1 rounded-full border border-brand-pink/20">
            <Tag size={14} />
            Limited Time Only
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            Special Offers & Deals
          </h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base">
            Grab the best deals on premium school supplies before they run out. Lowest prices of the season!
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 mt-8 md:mt-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {products.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-gray-500 font-bold">No offers available right now.</h3>
          </div>
        )}
      </div>
    </div>
  );
}
