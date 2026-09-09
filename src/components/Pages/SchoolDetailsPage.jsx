import React, { useMemo } from 'react';
import { ArrowLeft, Package, Sparkles } from 'lucide-react';
import { KIT_BUNDLES } from '../../data/mockData';
import ProductCard from '../Products/ProductCard';
import KitCard from '../Products/KitCard';

export default function SchoolDetailsPage({ schoolName, onNavigate }) {
  
  // Get all kits for this school
  const schoolKits = useMemo(() => {
    return KIT_BUNDLES.filter(kit => kit.school === schoolName);
  }, [schoolName]);

  // Extract all unique individual assets (kit items) from those kits
  const schoolAssets = useMemo(() => {
    const assetsMap = new Map();
    schoolKits.forEach(kit => {
      if (kit.kitItems) {
        kit.kitItems.forEach(item => {
          if (!assetsMap.has(item.id)) {
             assetsMap.set(item.id, {
               ...item,
               // Default to 'products' category so clicking view detail routes properly
               category: 'products',
               // Mock a rating/review since kitItems are simplified
               rating: 4.8,
               reviews: 120
             });
          }
        });
      }
    });
    return Array.from(assetsMap.values());
  }, [schoolKits]);

  if (!schoolName) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col">
        <h2 className="text-2xl font-bold mb-4">No School Selected</h2>
        <button onClick={() => onNavigate('school-directory')} className="text-brand-teal underline">
          Go back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Banner */}
      <div className="bg-brand-teal text-white py-12 px-4 border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <button 
            onClick={() => onNavigate('school-directory')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors text-sm font-bold w-fit"
          >
            <ArrowLeft size={16} />
            <span>Back to Directory</span>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-brand-yellow text-brand-teal-dark text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Verified School Partner
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            {schoolName}
          </h1>
          <p className="text-white/80 max-w-2xl text-lg">
            Discover all exclusive uniform kits, textbooks, and individual assets officially listed for {schoolName}.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 mt-12 space-y-16">
        
        {/* Kits Section */}
        {schoolKits.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8 border-b border-gray-200 pb-4">
              <Package className="text-brand-yellow" size={28} />
              <h2 className="font-display text-2xl font-extrabold text-gray-900">Complete Class Kits</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {schoolKits.map(kit => (
                <div key={kit.id} className="h-full">
                  <KitCard kit={kit} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Individual Assets Section */}
        {schoolAssets.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8 border-b border-gray-200 pb-4">
              <Sparkles className="text-brand-pink" size={28} />
              <h2 className="font-display text-2xl font-extrabold text-gray-900">Individual Assets & Items</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {schoolAssets.map(asset => (
                <ProductCard key={asset.id} product={asset} />
              ))}
            </div>
          </section>
        )}

        {schoolKits.length === 0 && schoolAssets.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 font-bold">No assets found for this school.</p>
          </div>
        )}

      </div>
    </div>
  );
}
