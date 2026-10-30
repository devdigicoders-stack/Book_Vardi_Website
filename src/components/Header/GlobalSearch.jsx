import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp, Sparkles, ArrowRight, Filter, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { fetchFeaturedProductsFromBackend } from '../../utils/api';

export default function GlobalSearch({ onNavigate, onSearch, currentQuery }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const { openProductDetails } = useCart();

  const [recentSearches, setRecentSearches] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const topSearches = ['Girls Pleated Skirt', 'CBSE Practice Books', 'Kids Drawing Book', 'Winter Sweaters'];

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bv_recent_searches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentSearches(parsed);
      }
    } catch (e) {}
  }, []);

  // Fetch recommended products from backend
  useEffect(() => {
    setIsLoading(true);
    fetchFeaturedProductsFromBackend(4)
      .then((res) => {
        const list = res?.products || res || [];
        setRecommendedProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => setRecommendedProducts([]))
      .finally(() => setIsLoading(false));
  }, []);

  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const cleanTerm = term.trim();
    const updated = [cleanTerm, ...recentSearches.filter((t) => t.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('bv_recent_searches', JSON.stringify(updated));
    } catch (e) {}
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('bv_recent_searches');
    } catch (e) {}
  };

  useEffect(() => {
    setQuery(currentQuery || '');
  }, [currentQuery]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      onSearch(query.trim());
      onNavigate('products');
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    saveRecentSearch(suggestion);
    onSearch(suggestion);
    onNavigate('products');
    setIsOpen(false);
  };


  return (
    <div className="relative w-full" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative group flex items-center gap-2">
        {/* Filter icon ahead of search input on small devices */}
        <button
          type="button"
          onClick={() => {
            onNavigate('products');
          }}
          className="lg:hidden p-2.5 rounded-full bg-brand-teal text-white shadow-xs hover:bg-brand-teal-light transition-all shrink-0 cursor-pointer flex items-center justify-center active:scale-95"
          title="Open product filters"
          aria-label="Filter products"
        >
          <Filter size={15} />
        </button>

        <div className={`flex-1 flex items-center bg-gray-100/80 hover:bg-gray-100 transition-colors rounded-full border border-transparent ${isOpen ? 'border-brand-teal/30 bg-white ring-4 ring-brand-teal/5' : ''}`}>
          <div className="pl-4 text-gray-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search for products, categories..."
            className="w-full bg-transparent px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); onSearch(''); }}
              className="pr-4 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 min-w-full sm:min-w-[500px] md:min-w-[620px] left-1/2 -translate-x-1/2">
          <div className="p-5 space-y-5">
            
            {/* Recently Searched */}
            {!query && recentSearches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={12} />
                    Recently Searched
                  </h4>
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Clear search history"
                  >
                    <Trash2 size={11} />
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(term)}
                      className="text-xs bg-gray-50 hover:bg-brand-teal/5 text-gray-700 hover:text-brand-teal border border-gray-200/60 hover:border-brand-teal/30 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-medium"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Top Searches */}
            {!query && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={12} />
                  Top Searches
                </h4>
                <div className="flex flex-wrap gap-2">
                  {topSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(term)}
                      className="text-xs bg-gray-50 hover:bg-brand-teal/5 text-gray-700 hover:text-brand-teal border border-gray-200/60 hover:border-brand-teal/30 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-medium"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Top Products */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-brand-yellow" />
                Recommended For You
              </h4>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50/60 animate-pulse">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded-md w-3/4" />
                        <div className="h-2.5 bg-gray-200 rounded-md w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recommendedProducts.length === 0 ? (
                <div className="text-xs text-gray-400 py-3 text-center col-span-full">
                  No recommended products found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recommendedProducts.map((product) => {
                    const prodImg = product.image || (Array.isArray(product.images) && product.images[0]) || '';
                    return (
                      <button
                        key={product._id || product.id}
                        onClick={() => {
                          setIsOpen(false);
                          openProductDetails(product);
                        }}
                        className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50/80 rounded-xl border border-gray-100/80 hover:border-brand-teal/20 transition-all text-left group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                          {prodImg ? (
                            <img src={prodImg} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 bg-gray-200">
                              BV
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate group-hover:text-brand-teal transition-colors">
                            {product.name}
                          </div>
                          <div className="text-[11px] text-gray-500 font-semibold mt-0.5">
                            ₹{product.price} {product.mrp && product.mrp > product.price ? <span className="line-through text-gray-300 ml-1">₹{product.mrp}</span> : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>


            {query && (
              <div className="pt-2">
                <button
                  onClick={handleSubmit}
                  className="w-full py-2 bg-brand-teal text-white text-xs font-bold rounded-xl hover:bg-brand-teal-dark transition-colors flex items-center justify-center gap-1"
                >
                  See all results for "{query}"
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
