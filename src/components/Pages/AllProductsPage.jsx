import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  RotateCcw,
  Sparkles,
  ArrowUp,
  Loader2,
  ChevronDown,
  X,
  Filter
} from 'lucide-react';
import { ALL_PRODUCTS, CATEGORIES } from '../../data/mockData';
import { useCart } from '../../context/CartContext';
import ProductCard from '../Products/ProductCard';

const CHUNK_SIZE = 8;

export default function AllProductsPage({
  onNavigate,
  initialCategory = null,
  searchQuery: externalSearchQuery = '',
  onSearchChange: externalOnSearchChange = null
}) {
  const { wishlist } = useCart();
  const [onlyLiked, setOnlyLiked] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [internalSearchQuery, setInternalSearchQuery] = useState(externalSearchQuery);
  const [priceFilter, setPriceFilter] = useState('all'); // 'all', 'under250', '250to500', 'above500'
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'price-low', 'price-high', 'rating', 'discount'
  
  // New Filter States
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [brandFilter, setBrandFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [offersFilter, setOffersFilter] = useState('all');

  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const sentinelRef = useRef(null);

  // Sync external search query from navbar if changed
  useEffect(() => {
    setInternalSearchQuery(externalSearchQuery);
  }, [externalSearchQuery]);

  // Sync category changes if navigated from navbar while already on this page
  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const activeSearchQuery = externalOnSearchChange ? externalSearchQuery : internalSearchQuery;

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter((product) => {
      // Category match
      const matchesCategory = selectedCategory ? product.category === selectedCategory : true;

      // Search match (name, subtitle, category keywords)
      const query = activeSearchQuery.toLowerCase().trim();
      const matchesSearch = query
        ? product.name.toLowerCase().includes(query) ||
          product.subtitle.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        : true;

      // Price match
      let matchesPrice = true;
      if (priceFilter === 'under250') matchesPrice = product.price < 250;
      else if (priceFilter === '250to500') matchesPrice = product.price >= 250 && product.price <= 500;
      else if (priceFilter === 'above500') matchesPrice = product.price > 500;

      // Brand match (mock data doesn't have brand, we'll just skip or match dummy data)
      // Rating match
      let matchesRating = true;
      if (ratingFilter === '4+') matchesRating = product.rating >= 4.0;
      else if (ratingFilter === '3+') matchesRating = product.rating >= 3.0;

      // Availability match
      let matchesAvailability = true;
      if (availabilityFilter === 'in-stock') matchesAvailability = product.inStock === true;
      else if (availabilityFilter === 'out-of-stock') matchesAvailability = product.inStock === false;

      // Offers match
      let matchesOffers = true;
      if (offersFilter === 'discounted') matchesOffers = product.originalPrice && product.originalPrice > product.price;

      // Wishlist / Liked match
      const matchesWishlist = onlyLiked
        ? wishlist.some((id) => Number(id) === Number(product.id))
        : true;

      return matchesCategory && matchesSearch && matchesPrice && matchesRating && matchesAvailability && matchesOffers && matchesWishlist;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'discount') {
        const discA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const discB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return discB - discA;
      }
      return 0; // 'featured' keeps default
    });
  }, [selectedCategory, activeSearchQuery, priceFilter, sortBy, onlyLiked, wishlist, ratingFilter, availabilityFilter, offersFilter]);

  // Load next chunk callback
  const loadNextChunk = useCallback(() => {
    if (visibleCount >= filteredProducts.length || isLoadingChunk) return;
    setIsLoadingChunk(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filteredProducts.length));
      setIsLoadingChunk(false);
    }, 450);
  }, [visibleCount, filteredProducts.length, isLoadingChunk]);

  // Automatic Infinite Scroll Observer (Always Active)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && visibleCount < filteredProducts.length && !isLoadingChunk) {
          loadNextChunk();
        }
      },
      { rootMargin: '250px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filteredProducts.length, isLoadingChunk, loadNextChunk]);

  // Reset filter helpers
  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setVisibleCount(CHUNK_SIZE);
  };

  const handleSearchInput = (val) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(val);
    } else {
      setInternalSearchQuery(val);
    }
    setVisibleCount(CHUNK_SIZE);
  };

  const handlePriceChange = (val) => {
    setPriceFilter(val);
    setVisibleCount(CHUNK_SIZE);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setVisibleCount(CHUNK_SIZE);
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setOnlyLiked(false);
    if (externalOnSearchChange) {
      externalOnSearchChange('');
    } else {
      setInternalSearchQuery('');
    }
    setPriceFilter('all');
    setSortBy('featured');
    setBrandFilter('all');
    setRatingFilter('all');
    setAvailabilityFilter('all');
    setOffersFilter('all');
    setVisibleCount(CHUNK_SIZE);
  };

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  return (
    <div className="bg-gray-50/60 min-h-screen pb-20">
      {/* Breadcrumb & Header Banner */}
      <div className="bg-brand-teal text-white py-10 px-4 border-b border-white/10 relative overflow-hidden">
        {/* Background glow circle */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />

        <div className="container mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-white/60 mb-3">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-brand-yellow transition-colors font-medium cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-white font-semibold">All Products</span>
            {selectedCategory && (
              <>
                <span>/</span>
                <span className="text-brand-yellow capitalize">{selectedCategory}</span>
              </>
            )}
            {onlyLiked && (
              <>
                <span>/</span>
                <span className="text-brand-pink font-semibold">Liked Items</span>
              </>
            )}
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-brand-yellow text-xs font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full mb-2">
                <Sparkles size={12} />
                FULL STATIONERY CATALOG
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                All Products & Study Supplies
              </h1>
              <p className="text-sm text-white/70 mt-1 max-w-xl">
                Browse our complete collection of premium notebooks, pens, art sets, and school desk tools.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-xs font-semibold text-white/90 border border-white/15 shrink-0 self-start md:self-end">
              Showing <span className="text-brand-yellow font-extrabold">{displayedProducts.length}</span> of{' '}
              <span className="text-brand-yellow font-extrabold">{filteredProducts.length}</span> items
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="sticky top-[76px] z-30 bg-white border-b border-gray-200 shadow-xs py-3.5 px-4">
        <div className="container mx-auto space-y-3">
          {/* Top Row: Search, Price filter, Sort, Infinite switch */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products by title, category, keywords..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-9 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10 transition-all"
                value={activeSearchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
              />
              {activeSearchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full cursor-pointer"
                  aria-label="Clear Search"
                >
                  <X size={14} />
                </button>
              )}
            </div> 

            {/* Controls Row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setFiltersOpen(true)}
                className="appearance-none bg-white border border-gray-200 text-xs font-semibold text-brand-teal rounded-lg px-4 py-2 hover:bg-gray-50 focus:outline-none focus:border-brand-teal cursor-pointer inline-flex items-center gap-2"
              >
                <Filter size={14} />
                <span>Filters</span>
              </button>

              {/* Reset Filters button */}
              {(selectedCategory || onlyLiked || activeSearchQuery || priceFilter !== 'all' || sortBy !== 'featured' || ratingFilter !== 'all' || availabilityFilter !== 'all' || offersFilter !== 'all') && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs text-brand-pink hover:text-brand-pink-hover font-bold px-2 py-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Category Visual Filters (Like Homepage but smaller) */}
          <div className="flex items-start gap-4 overflow-x-auto pb-4 pt-2 px-1 scrollbar-none snap-x touch-pan-x">
            
            {/* "All Items" Option */}
            <button
              onClick={() => {
                handleCategorySelect(null);
                setOnlyLiked(false);
              }}
              className={`flex flex-col items-center gap-1.5 shrink-0 snap-start transition-all cursor-pointer group w-[70px] ${
                selectedCategory === null && !onlyLiked ? 'scale-105' : 'hover:scale-105'
              }`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 p-0.5 transition-all shadow-xs ${
                selectedCategory === null && !onlyLiked 
                  ? 'border-brand-teal ring-2 ring-brand-yellow bg-brand-teal text-white' 
                  : 'border-gray-200 bg-gray-100 text-gray-400 group-hover:border-brand-yellow group-hover:text-brand-teal'
              }`}>
                <Search size={20} />
              </div>
              <span className={`text-[10px] font-bold text-center leading-tight ${selectedCategory === null && !onlyLiked ? 'text-brand-teal' : 'text-gray-500 group-hover:text-brand-teal'}`}>
                All Items
              </span>
            </button>

            {/* "Liked" Option */}
            <button
              onClick={() => {
                setOnlyLiked(!onlyLiked);
                setVisibleCount(CHUNK_SIZE);
              }}
              className={`flex flex-col items-center gap-1.5 shrink-0 snap-start transition-all cursor-pointer group w-[70px] ${
                onlyLiked ? 'scale-105' : 'hover:scale-105'
              }`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 p-0.5 transition-all shadow-xs ${
                onlyLiked 
                  ? 'border-brand-pink ring-2 ring-brand-pink/30 bg-brand-pink text-white' 
                  : 'border-gray-200 bg-pink-50 text-brand-pink/50 group-hover:border-brand-pink/50 group-hover:text-brand-pink'
              }`}>
                <span className="text-xl">❤️</span>
              </div>
              <span className={`text-[10px] font-bold text-center leading-tight ${onlyLiked ? 'text-brand-pink' : 'text-gray-500 group-hover:text-brand-pink'}`}>
                Liked ({wishlist.length})
              </span>
            </button>

            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(isSelected ? null : cat.id)}
                  className={`flex flex-col items-center gap-1.5 shrink-0 snap-start transition-all cursor-pointer group w-[70px] ${
                    isSelected ? 'scale-105' : 'hover:scale-105'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full overflow-hidden border-2 p-0.5 transition-all shadow-xs ${
                    isSelected 
                      ? 'border-brand-teal ring-2 ring-brand-yellow' 
                      : 'border-gray-200 bg-gray-50 group-hover:border-brand-yellow'
                  }`}>
                    <img 
                      src={cat.imageUrl} 
                      alt={cat.name} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <span className={`text-[10px] font-bold text-center leading-tight ${isSelected ? 'text-brand-teal' : 'text-gray-500 group-hover:text-brand-teal'}`}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Grid Content */}
      <div className="container mx-auto px-4 mt-8">
        {displayedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Loading Skeletons when fetching next chunk */}
            {isLoadingChunk && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-4 sm:mt-6">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 animate-pulse">
                    <div className="w-full aspect-square bg-gray-200 rounded-lg sm:rounded-xl mb-3 sm:mb-4" />
                    <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-2.5 sm:h-3 bg-gray-100 rounded w-1/2 mb-3 sm:mb-4" />
                    <div className="h-4 sm:h-5 bg-gray-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Infinite Scroll Sentinel Div */}
            <div ref={sentinelRef} className="h-10 w-full" />

            {/* Bottom Actions: Auto-Loading Status or Finished Banner */}
            <div className="mt-8 flex flex-col items-center justify-center text-center">
              {hasMore ? (
                isLoadingChunk ? (
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 py-3">
                    <Loader2 size={16} className="animate-spin text-brand-teal" />
                    <span>Loading more stationery supplies...</span>
                  </div>
                ) : null
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs max-w-md w-full">
                  <span className="text-2xl block mb-1">🎉</span>
                  <h4 className="font-bold text-brand-teal text-sm mb-3">
                    You've Reached The End of the Catalog!
                  </h4>
                  <button
                    onClick={scrollToTop}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:text-brand-pink transition-colors cursor-pointer"
                  >
                    <ArrowUp size={14} />
                    <span>Back to Top</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300 max-w-lg mx-auto p-8 shadow-xs">
            <span className="text-3xl block mb-2">{onlyLiked ? '❤️' : '🔍'}</span>
            <h3 className="font-display font-extrabold text-lg text-brand-teal">
              {onlyLiked ? 'No Liked Items Found' : 'No Products Found'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              {onlyLiked
                ? "You haven't added any products to your wishlist matching this criteria yet. Tap the heart button on any item to save it!"
                : `We couldn't find any products matching ${activeSearchQuery ? `"${activeSearchQuery}"` : 'your active filters'}. Try searching for pens, notebooks, bottles, or clear filters.`}
            </p>
            <button
              onClick={handleResetFilters}
              className="bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {onlyLiked ? 'Show All Products' : 'Reset All Filters'}
            </button>
          </div>
        )}
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-brand-teal text-brand-yellow shadow-xl hover:bg-brand-teal-light hover:scale-110 flex items-center justify-center transition-all border border-brand-yellow/30 cursor-pointer"
          title="Scroll Back to Top"
          aria-label="Back to Top"
        >
          <ArrowUp size={20} />
        </button>
      )}

      {/* Filters Sidebar Overlay */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-display font-extrabold text-lg text-brand-teal flex items-center gap-2">
                <Filter size={18} />
                Filters & Sorting
              </h3>
              <button 
                onClick={() => setFiltersOpen(false)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-8">
              
              {/* Sort By */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort By</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'featured', label: 'Featured' },
                    { id: 'price-low', label: 'Price: Low to High' },
                    { id: 'price-high', label: 'Price: High to Low' },
                    { id: 'rating', label: 'Top Rated' },
                    { id: 'discount', label: 'Biggest Discount' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSortBy(opt.id)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-colors cursor-pointer ${
                        sortBy === opt.id ? 'bg-brand-teal border-brand-teal text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-teal/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price Range</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under250', label: 'Under ₹250' },
                    { id: '250to500', label: '₹250 - ₹500' },
                    { id: 'above500', label: 'Above ₹500' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setPriceFilter(opt.id)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-colors cursor-pointer ${
                        priceFilter === opt.id ? 'bg-brand-teal border-brand-teal text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-teal/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rating</h4>
                <div className="flex gap-2">
                  {['all', '4+', '3+'].map(opt => (
                    <button
                      key={opt.id || opt}
                      onClick={() => setRatingFilter(opt)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border text-center transition-colors cursor-pointer ${
                        ratingFilter === opt ? 'bg-brand-yellow border-brand-yellow text-brand-teal-dark' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-yellow/50'
                      }`}
                    >
                      {opt === 'all' ? 'All' : `${opt} Stars`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Availability</h4>
                <div className="flex gap-2">
                  {['all', 'in-stock', 'out-of-stock'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setAvailabilityFilter(opt)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border text-center transition-colors capitalize cursor-pointer ${
                        availabilityFilter === opt ? 'bg-brand-teal border-brand-teal text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-teal/30'
                      }`}
                    >
                      {opt.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Offers */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Special Offers</h4>
                <div className="flex gap-2">
                  {['all', 'discounted'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setOffersFilter(opt)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border text-center transition-colors capitalize cursor-pointer ${
                        offersFilter === opt ? 'bg-brand-pink border-brand-pink text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-pink/30'
                      }`}
                    >
                      {opt === 'all' ? 'All Items' : 'Sale Items'}
                    </button>
                  ))}
                </div>
              </div>

            </div>
            
            <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50">
              <button 
                onClick={handleResetFilters}
                className="flex-1 py-3 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Clear All
              </button>
              <button 
                onClick={() => setFiltersOpen(false)}
                className="flex-1 py-3 text-xs font-bold text-white bg-brand-teal rounded-xl hover:bg-brand-teal-light transition-colors cursor-pointer shadow-md shadow-brand-teal/20"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
