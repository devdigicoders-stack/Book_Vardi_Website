import React from 'react';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFoundPage({ onNavigate }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4 py-20 text-center">
      <div className="mb-6 relative">
        <div className="text-[120px] font-display font-extrabold text-brand-teal leading-none tracking-tighter select-none opacity-20">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-5xl">
          🎒
        </div>
      </div>
      
      <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-teal mb-3">
        Oops! Page Not Found
      </h1>
      
      <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
        It looks like the page you are looking for has been misplaced, moved, or doesn't exist anymore. Let's get you back to studying!
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <button
          onClick={() => onNavigate('home')}
          className="w-full sm:w-auto px-6 py-3 bg-brand-teal text-white font-bold text-xs rounded-xl shadow-md hover:bg-brand-teal-light transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home size={16} />
          <span>Back to Home</span>
        </button>
        
        <button
          onClick={() => onNavigate('products')}
          className="w-full sm:w-auto px-6 py-3 bg-white text-brand-teal border border-gray-200 font-bold text-xs rounded-xl shadow-sm hover:border-brand-teal/30 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Search size={16} />
          <span>Browse Products</span>
        </button>
      </div>
    </div>
  );
}
