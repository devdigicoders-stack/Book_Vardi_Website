import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import ProductCarouselRow from './ProductCarouselRow';
import { useCart } from '../../context/CartContext';
import {
  fetchRecentlyViewedFromBackend,
  fetchFeaturedProductsFromBackend,
  fetchSpecialOffersFromBackend,
  fetchRecommendedProductsFromBackend,
  fetchProductsFromBackend
} from '../../utils/api';

const EMPTY_ARRAY = [];

export default function HomeProductSections({ activeCategory, searchQuery, onNavigate }) {
  const { products: contextProducts = EMPTY_ARRAY, recentlyViewedIds = EMPTY_ARRAY } = useCart();

  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const safeRecentlyViewedIds = Array.isArray(recentlyViewedIds) ? recentlyViewedIds : EMPTY_ARRAY;
  const recentlyViewedKey = safeRecentlyViewedIds.join(',');

  // Helper fallback for rotated context products if backend is empty/offline
  const getFallbackProducts = useCallback((offset, count, category = null) => {
    let source = contextProducts;
    if (category) {
      source = contextProducts.filter(p => p.category === category);
    }
    if (source.length === 0) return [];
    const rotated = [...source.slice(offset % source.length), ...source.slice(0, offset % source.length)];
    return rotated.slice(0, count);
  }, [contextProducts]);

  // Fetch all 4 carousel rows from Backend
  const loadBackendCarouselData = useCallback(async (isMountedRef) => {
    try {
      const [recentRes, featuredRes, specialRes, recommendedRes] = await Promise.all([
        fetchRecentlyViewedFromBackend({ ids: safeRecentlyViewedIds, category: activeCategory || undefined, limit: 8 }),
        fetchFeaturedProductsFromBackend({ category: activeCategory || undefined, limit: 8 }),
        fetchSpecialOffersFromBackend({ category: activeCategory || undefined, limit: 8 }),
        fetchRecommendedProductsFromBackend({ category: activeCategory || undefined, limit: 8 })
      ]);

      if (!isMountedRef.current) return;

      const recentList = recentRes?.products || (Array.isArray(recentRes) ? recentRes : []);
      const featuredList = featuredRes?.products || (Array.isArray(featuredRes) ? featuredRes : []);
      const specialList = specialRes?.products || (Array.isArray(specialRes) ? specialRes : []);
      const recommendedList = recommendedRes?.products || (Array.isArray(recommendedRes) ? recommendedRes : []);

      setRecentlyViewed(recentList.length > 0 ? recentList : getFallbackProducts(0, 8, activeCategory));
      setFeatured(featuredList.length > 0 ? featuredList : getFallbackProducts(3, 8, activeCategory));
      setSpecialOffers(specialList.length > 0 ? specialList : getFallbackProducts(12, 8, activeCategory));
      setRecommended(recommendedList.length > 0 ? recommendedList : getFallbackProducts(7, 8, activeCategory));
    } catch (error) {
      console.error('Failed to load backend carousel rows:', error);
      if (isMountedRef.current) {
        setRecentlyViewed(getFallbackProducts(0, 8, activeCategory));
        setFeatured(getFallbackProducts(3, 8, activeCategory));
        setSpecialOffers(getFallbackProducts(12, 8, activeCategory));
        setRecommended(getFallbackProducts(7, 8, activeCategory));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [activeCategory, recentlyViewedKey, getFallbackProducts]);

  // Fetch search results when searchQuery is active
  useEffect(() => {
    const isMountedRef = { current: true };

    if (searchQuery) {
      setLoading(true);
      fetchProductsFromBackend({ search: searchQuery, category: activeCategory || undefined, limit: 20 })
        .then((res) => {
          if (!isMountedRef.current) return;
          const list = res?.products || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setSearchResults(list);
          } else {
            const query = searchQuery.toLowerCase().trim();
            const filtered = contextProducts.filter(p =>
              (p.name || p.title || '').toLowerCase().includes(query) ||
              (p.subtitle || '').toLowerCase().includes(query) ||
              (p.category || '').toLowerCase().includes(query)
            );
            setSearchResults(filtered);
          }
          setLoading(false);
        })
        .catch(() => {
          if (!isMountedRef.current) return;
          const query = searchQuery.toLowerCase().trim();
          const filtered = contextProducts.filter(p =>
            (p.name || p.title || '').toLowerCase().includes(query) ||
            (p.subtitle || '').toLowerCase().includes(query) ||
            (p.category || '').toLowerCase().includes(query)
          );
          setSearchResults(filtered);
          setLoading(false);
        });
    } else {
      loadBackendCarouselData(isMountedRef);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [searchQuery, activeCategory, recentlyViewedKey]);

  // Listen to recently viewed updates
  useEffect(() => {
    const handleRecentUpdate = () => {
      const isMountedRef = { current: true };
      loadBackendCarouselData(isMountedRef);
    };

    window.addEventListener('bv_recently_viewed_updated', handleRecentUpdate);
    return () => {
      window.removeEventListener('bv_recently_viewed_updated', handleRecentUpdate);
    };
  }, [loadBackendCarouselData]);

  // If search query is present
  if (searchQuery) {
    return (
      <div id="bestsellers" className="bg-gray-50/70 pt-8 pb-4">
        <ProductCarouselRow 
          title={`Search Results for "${searchQuery}"`}
          products={searchResults}
          loading={loading}
          onViewAll={() => onNavigate && onNavigate('products')}
        />
      </div>
    );
  }

  return (
    <div id="bestsellers" className="bg-gray-50/70 pt-8 pb-4 flex flex-col gap-2">
      {/* Recently Viewed Carousel Row */}
      <ProductCarouselRow 
        title="Recently Viewed"
        products={recentlyViewed}
        loading={loading}
        onViewAll={() => onNavigate && onNavigate('products')}
        autoScroll={true}
        autoScrollInterval={4000}
      />

      {/* Featured & Trending Carousel Row */}
      <ProductCarouselRow 
        title="Featured & Trending"
        products={featured}
        loading={loading}
        onViewAll={() => onNavigate && onNavigate('products')}
        autoScroll={true}
        autoScrollInterval={4500}
      />

      {/* Special Offers Carousel Row */}
      <ProductCarouselRow 
        title="Special Offers"
        products={specialOffers}
        loading={loading}
        onViewAll={() => onNavigate && onNavigate('products')}
        autoScroll={true}
        autoScrollInterval={3500}
      />

      {/* Recommended for You Carousel Row */}
      <ProductCarouselRow 
        title="Recommended for You"
        products={recommended}
        loading={loading}
        onViewAll={() => onNavigate && onNavigate('products')}
        autoScroll={true}
        autoScrollInterval={5000}
      />
    </div>
  );
}
