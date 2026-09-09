import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { ALL_PRODUCTS } from '../../data/mockData';
import ProductCard from '../Products/ProductCard';

export default function NewArrivalsPage({ onNavigate }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Filter products that have the 'NEW' badge
    const newItems = ALL_PRODUCTS.filter(p => p.discountBadge === 'NEW');
    setProducts(newItems);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Banner */}
      <div className="bg-brand-teal text-white py-12 px-4 border-b border-white/10 relative overflow-hidden">
        <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full bg-brand-yellow/20 blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <span className="inline-flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-brand-yellow mb-3 bg-brand-yellow/10 px-3 py-1 rounded-full border border-brand-yellow/20">
            <Sparkles size={14} />
            Just Dropped
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            New Arrivals
          </h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base">
            Discover our latest collection of premium, eco-friendly stationery designed for the new school term.
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
            <h3 className="text-gray-500 font-bold">More new arrivals coming soon!</h3>
          </div>
        )}
      </div>
    </div>
  );
}
