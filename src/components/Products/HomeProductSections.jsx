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

      const rawRecent = recentRes?.products || (Array.isArray(recentRes) ? recentRes : []);
      const rawFeatured = featuredRes?.products || (Array.isArray(featuredRes) ? featuredRes : []);
      const rawSpecial = specialRes?.products || (Array.isArray(specialRes) ? specialRes : []);
      const rawRecommended = recommendedRes?.products || (Array.isArray(recommendedRes) ? recommendedRes : []);

      const filterApproved = (list) => {
        if (!Array.isArray(list)) return [];
        return list.filter(p => {
          const appStat = String(p.approvalStatus || '').toLowerCase();
          return appStat !== 'pending' && appStat !== 'rejected';
        });
      };

      const recentList = filterApproved(rawRecent.length > 0 ? rawRecent : (rawFeatured.length > 0 ? rawFeatured : getFallbackProducts(0, 8, activeCategory)));
      const featuredList = filterApproved(rawFeatured.length > 0 ? rawFeatured : (rawRecommended.length > 0 ? rawRecommended : getFallbackProducts(2, 8, activeCategory)));
      const specialList = filterApproved(rawSpecial.length > 0 ? rawSpecial : (rawFeatured.length > 0 ? rawFeatured : getFallbackProducts(4, 8, activeCategory)));
      const recommendedList = filterApproved(rawRecommended.length > 0 ? rawRecommended : (rawFeatured.length > 0 ? rawFeatured : getFallbackProducts(6, 8, activeCategory)));

      setRecentlyViewed(recentList);
      setFeatured(featuredList);
      setSpecialOffers(specialList);
      setRecommended(recommendedList);
    } catch (error) {
      console.error('Failed to load backend carousel rows:', error);
      if (isMountedRef.current) {
        setRecentlyViewed([]);
        setFeatured([]);
        setSpecialOffers([]);
        setRecommended([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [activeCategory, recentlyViewedKey]);

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
