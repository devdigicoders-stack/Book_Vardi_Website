import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { ALL_PRODUCTS } from '../../data/mockData';
import { useCart } from '../../context/CartContext';

export default function GlobalSearch({ onNavigate, onSearch, currentQuery }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const { openProductDetails } = useCart();

  // Mock data for search suggestions
  const recentSearches = ['NCERT Class 10', 'Boys Summer Uniform', 'Olympiad Workbook'];
  const topSearches = ['Girls Pleated Skirt', 'CBSE Practice Books', 'Kids Drawing Book', 'Winter Sweaters'];
  
  // Get 3 random popular products for recommendations
  const topProducts = ALL_PRODUCTS.filter(p => p.discountBadge === 'BESTSELLER' || p.rating >= 4.9).slice(0, 3);

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
      onSearch(query.trim());
      onNavigate('products');
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    onSearch(suggestion);
    onNavigate('products');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`flex items-center bg-gray-100/80 hover:bg-gray-100 transition-colors rounded-full border border-transparent ${isOpen ? 'border-brand-teal/30 bg-white ring-4 ring-brand-teal/5' : ''}`}>
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 space-y-5">
            
            {/* Recently Searched */}
            {!query && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} />
                  Recently Searched
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(term)}
                      className="text-xs bg-gray-50 hover:bg-brand-teal/5 text-gray-700 hover:text-brand-teal border border-gray-100 hover:border-brand-teal/20 px-3 py-1.5 rounded-lg transition-colors"
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
                      className="text-xs bg-gray-50 hover:bg-brand-teal/5 text-gray-700 hover:text-brand-teal border border-gray-100 hover:border-brand-teal/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Top Products */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-brand-yellow" />
                Recommended For You
              </h4>
              <div className="space-y-2">
                {topProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setIsOpen(false);
                      openProductDetails(product);
                    }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate group-hover:text-brand-teal transition-colors">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        ₹{product.price} <span className="line-through text-gray-300 ml-1">₹{product.originalPrice}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
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
