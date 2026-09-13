import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import ProductCard from './ProductCard';
import { fetchProductsFromBackend } from '../../utils/api';

export default function BestSellers({ activeCategory, searchQuery, onViewAll }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchProductsFromBackend({
      category: activeCategory || undefined,
      search: searchQuery || undefined,
      limit: 50
    })
      .then((res) => {
        if (!isMounted) return;
        const list = res?.products || res || [];
        setProducts(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setProducts([]);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategory, searchQuery]);

  const loadNextChunk = useCallback(() => {
    if (visibleCount >= products.length || isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 4, products.length));
      setIsLoadingMore(false);
    }, 450);
  }, [visibleCount, products.length, isLoadingMore]);

  // Automatic Infinite Scroll Observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && visibleCount < products.length && !isLoadingMore) {
          loadNextChunk();
        }
      },
      { rootMargin: '250px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, products.length, isLoadingMore, loadNextChunk]);

  const displayedProducts = searchQuery ? products : products.slice(0, visibleCount);
  const hasMore = !searchQuery && visibleCount < products.length;


  return (
    <section className="py-14 bg-gray-50/70 border-b border-gray-100" id="bestsellers">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-wider uppercase text-brand-teal">
              RECOMMENDED PRODUCTS
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {searchQuery
                ? `Showing search results for "${searchQuery}" in recommendations`
                : activeCategory
                ? `Showing curated ${activeCategory} essentials`
                : 'Products recommended just for you based on your needs'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onViewAll && onViewAll()}
              className="text-xs font-bold text-brand-teal hover:text-brand-pink transition-colors inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer"
            >
              <span>VIEW ALL</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Product Cards Grid - Strictly 2 Columns */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-4xl mx-auto">
          {displayedProducts.length > 0 ? (
            displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-6">
              <p className="text-gray-600 text-sm mb-3">
                No recommended products found matching "{searchQuery || activeCategory}".
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  className="bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-xs cursor-pointer"
                  onClick={() => onViewAll && onViewAll()}
                >
                  Search Full 32+ Product Catalog →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Infinite Scroll Sentinel */}
        <div ref={sentinelRef} className="h-10 w-full mt-4" />

        {/* Loading Indicator */}
        {!searchQuery && hasMore && isLoadingMore && (
          <div className="flex justify-center mt-4 pb-8">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-gray-500">
              <Loader2 size={16} className="animate-spin text-brand-teal" />
              <span>Loading more recommendations...</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
