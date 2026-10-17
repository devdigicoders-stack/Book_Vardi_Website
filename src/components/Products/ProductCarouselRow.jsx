import React, { useRef, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductCarouselRow({ 
  title, 
  products, 
  onViewAll, 
  autoScroll = false, 
  autoScrollInterval = 3000, 
  renderCard, 
  onResetFilter, 
  loading = false, 
  isLoading = false,
  hideIfEmpty = false 
}) {
  const isRowLoading = loading || isLoading;
  const scrollRef = useRef(null);
  const isHoveredRef = useRef(false);

  // If not loading, no products, and requested to hide empty state
  if (!isRowLoading && (!products || products.length === 0) && hideIfEmpty) {
    return null;
  }

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320; // approximate width of one card + gap
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      
      let newLeft = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      
      // Infinite-like looping behavior if autoScroll is on and we hit the end
      if (direction === 'right' && autoScroll && newLeft + clientWidth >= scrollWidth) {
        newLeft = 0; // reset to beginning
      }
      
      scrollRef.current.scrollTo({
        left: newLeft,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (!autoScroll || isRowLoading) return;

    const timer = setInterval(() => {
      if (!isHoveredRef.current) {
        scroll('right');
      }
    }, autoScrollInterval);

    return () => clearInterval(timer);
  }, [autoScroll, autoScrollInterval, isRowLoading]);

  return (
    <section className="py-8 sm:py-10 bg-white border-b border-gray-100 last:border-b-0">
      <div 
        className="container mx-auto px-4"
        onMouseEnter={() => isHoveredRef.current = true}
        onMouseLeave={() => isHoveredRef.current = false}
      >
        {/* Section Header */}
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-lg sm:text-xl md:text-2xl font-extrabold tracking-wider uppercase text-brand-teal line-clamp-1">
              {title}
            </h2>
            {isRowLoading && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-teal/10 text-brand-teal animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-ping" />
                Loading
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => scroll('left')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200 bg-white hover:bg-brand-teal hover:text-white hover:border-brand-teal text-gray-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              aria-label="Scroll left"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200 bg-white hover:bg-brand-teal hover:text-white hover:border-brand-teal text-gray-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              aria-label="Scroll right"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>

            {onResetFilter && (
              <button
                onClick={onResetFilter}
                className="text-[10px] sm:text-xs font-bold text-gray-500 hover:text-red-500 transition-colors inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer bg-gray-100 hover:bg-red-50 px-2.5 sm:px-3 py-1.5 rounded-lg"
              >
                <span>Reset Filter</span>
              </button>
            )}
            {onViewAll && (
              <button
                onClick={() => onViewAll && onViewAll()}
                className="text-[10px] sm:text-xs font-bold text-brand-teal hover:text-brand-pink transition-colors inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer bg-brand-teal/5 px-2.5 sm:px-3 py-1.5 rounded-lg"
              >
                <span>VIEW ALL</span>
                <ArrowRight size={12} className="sm:w-[14px] sm:h-[14px]" />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Scrollable Container */}
        {isRowLoading ? (
          <div 
            className="flex overflow-x-auto gap-3 sm:gap-6 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[...Array(5)].map((_, idx) => (
              <div 
                key={idx} 
                className="min-w-[220px] xs:min-w-[250px] sm:min-w-[280px] md:min-w-[300px] max-w-[320px] shrink-0 snap-start bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm relative overflow-hidden"
              >
                {/* Image Placeholder */}
                <div className="w-full aspect-square bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 rounded-xl mb-3 sm:mb-4 animate-pulse relative">
                  <div className="absolute top-2 left-2 w-12 h-4 bg-gray-300/70 rounded-md" />
                  <div className="absolute top-2 right-2 w-7 h-7 bg-gray-300/60 rounded-full" />
                </div>
                {/* Category badge skeleton */}
                <div className="h-3 bg-gray-200/80 rounded w-1/3 mb-2 animate-pulse" />
                {/* Title skeleton */}
                <div className="h-4 bg-gray-200 rounded w-4/5 mb-1.5 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-3 animate-pulse" />
                {/* Rating stars skeleton */}
                <div className="flex items-center gap-1 mb-3">
                  <div className="w-3.5 h-3.5 bg-gray-200 rounded-full animate-pulse" />
                  <div className="w-8 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
                {/* Price and Cart button skeleton */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="space-y-1">
                    <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-12 animate-pulse" />
                  </div>
                  <div className="w-24 h-8 bg-gray-200 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-3 sm:gap-6 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, idx) => (
              <div key={product.id || product._id || product.slug || `carousel-item-${idx}`} className="min-w-[220px] xs:min-w-[250px] sm:min-w-[280px] md:min-w-[300px] max-w-[320px] shrink-0 snap-start">
                {renderCard ? renderCard(product) : <ProductCard product={product} />}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-bold mb-1">No products found</p>
            <p className="text-xs text-gray-400">Try adjusting your filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </section>
  );
}
