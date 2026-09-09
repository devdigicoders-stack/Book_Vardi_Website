import React, { useMemo } from 'react';
import ProductCarouselRow from './ProductCarouselRow';
import { ALL_PRODUCTS } from '../../data/mockData';

// Helper to deterministically shuffle/slice based on a seed or just statically to avoid re-renders
const getMockProducts = (offset, count, category = null) => {
  let source = ALL_PRODUCTS;
  if (category) {
    source = ALL_PRODUCTS.filter(p => p.category === category);
  }
  // Simple deterministic variation
  const rotated = [...source.slice(offset), ...source.slice(0, offset)];
  return rotated.slice(0, count);
};

export default function HomeProductSections({ activeCategory, searchQuery, onNavigate }) {
  
  // If there's a search query, just show one row for search results
  if (searchQuery) {
    const searchResults = ALL_PRODUCTS.filter(product => {
      const query = searchQuery.toLowerCase().trim();
      return product.name.toLowerCase().includes(query) ||
             product.subtitle.toLowerCase().includes(query) ||
             product.category.toLowerCase().includes(query);
    });

    return (
      <div id="bestsellers" className="bg-gray-50/70 pt-8">
        <ProductCarouselRow 
          title={`Search Results for "${searchQuery}"`}
          products={searchResults}
          onViewAll={() => onNavigate('products')}
        />
      </div>
    );
  }

  // Default Home Page - Multiple Rows
  const recentlyViewed = getMockProducts(0, 8);
  const featured = getMockProducts(3, 8);
  const recommended = getMockProducts(7, 8);
  const specialOffers = getMockProducts(12, 8).map(p => ({
    ...p,
    price: Math.floor(p.price * 0.8), // Mock a discount
    originalPrice: p.price
  }));

  return (
    <div id="bestsellers" className="bg-gray-50/70 pt-8 pb-4 flex flex-col gap-2">

      <ProductCarouselRow 
        title="Recently Viewed"
        products={recentlyViewed}
        onViewAll={() => onNavigate('products')}
        autoScroll={true}
        autoScrollInterval={4000}
      />
      <ProductCarouselRow 
        title="Featured & Trending"
        products={featured}
        onViewAll={() => onNavigate('products')}
        autoScroll={true}
        autoScrollInterval={4500}
      />
      
      <ProductCarouselRow 
        title="Special Offers"
        products={specialOffers}
        onViewAll={() => onNavigate('products')}
        autoScroll={true}
        autoScrollInterval={3500}
      />

      <ProductCarouselRow 
        title="Recommended for You"
        products={recommended}
        onViewAll={() => onNavigate('products')}
        autoScroll={true}
        autoScrollInterval={5000}
      />
    </div>
  );
}
