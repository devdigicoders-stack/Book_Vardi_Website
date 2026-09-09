import React from 'react';
import { X, Heart, ShoppingCart, ArrowRight, Trash2, Sparkles, ExternalLink } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function WishlistDrawer({ onNavigate }) {
  const {
    isWishlistOpen,
    setIsWishlistOpen,
    wishlistProducts,
    toggleWishlist,
    addToCart,
    cartItems
  } = useCart();

  const handleMoveToCart = (product) => {
    addToCart(product);
  };

  const handleOpenFullProfileWishlist = () => {
    setIsWishlistOpen(false);
    if (onNavigate) {
      onNavigate('profile', null, 'wishlist');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-brand-teal-dark/60 backdrop-blur-xs flex justify-end transition-opacity duration-300 ${
        isWishlistOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setIsWishlistOpen(false)}
    >
      <div
        className={`w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isWishlistOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 text-lg font-bold text-brand-teal">
            <Heart size={22} className="text-brand-pink fill-current" />
            <span>My Liked Items</span>
            <span className="bg-brand-pink text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
              {wishlistProducts.length}
            </span>
          </div>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-brand-teal transition-colors cursor-pointer"
            onClick={() => setIsWishlistOpen(false)}
            aria-label="Close Wishlist"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sub-banner */}
        <div className="bg-pink-50/70 px-5 py-2.5 border-b border-pink-100/60 flex items-center justify-between text-xs text-brand-pink-hover font-semibold">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>Saved for your next study session</span>
          </span>
          {wishlistProducts.length > 0 && (
            <button
              onClick={handleOpenFullProfileWishlist}
              className="hover:underline font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Profile View</span>
              <ExternalLink size={11} />
            </button>
          )}
        </div>

        {/* Items List */}
        {wishlistProducts.length > 0 ? (
          <div className="flex-grow overflow-y-auto p-5 space-y-3.5">
            {wishlistProducts.map((product) => (
              <div
                key={product.id}
                className="flex gap-3.5 p-3 rounded-xl border border-gray-200/80 hover:border-brand-pink/30 hover:shadow-xs transition-all bg-white group"
              >
                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/gel-pen-set.jpg';
                    }}
                  />
                  {product.discountBadge && (
                    <span className="absolute top-1 left-1 bg-brand-pink text-white text-[8px] font-extrabold px-1 py-0.2 rounded">
                      {product.discountBadge}
                    </span>
                  )}
                </div>

                <div className="flex-grow flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-brand-teal line-clamp-1 group-hover:text-brand-teal-light">
                        {product.name}
                      </h4>
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="text-gray-400 hover:text-brand-pink p-1 transition-colors cursor-pointer shrink-0"
                        title="Remove from Liked Items"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                      {product.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-gray-100">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-extrabold text-brand-teal">
                        ₹{product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[10px] text-gray-400 line-through">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>

                    {(() => {
                      const inCart = cartItems?.find((item) => Number(item.id) === Number(product.id))?.quantity || 0;
                      return (
                        <button
                          onClick={() => handleMoveToCart(product)}
                          className="inline-flex items-center gap-1.5 bg-brand-teal hover:bg-brand-teal-light text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs active:scale-95"
                        >
                          <ShoppingCart size={13} />
                          <span>{inCart > 0 ? `Add to Cart (${inCart})` : 'Add to Cart'}</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-pink-50 text-brand-pink flex items-center justify-center mb-4">
              <Heart size={32} />
            </div>
            <h3 className="text-base font-bold text-brand-teal mb-1">Your Wishlist is Empty</h3>
            <p className="text-xs text-gray-500 max-w-xs mb-6 leading-relaxed">
              Explore our study collection and click the heart icon on any product to save it here for quick access!
            </p>
            <button
              onClick={() => {
                setIsWishlistOpen(false);
                if (onNavigate) onNavigate('products');
              }}
              className="bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span>Explore All Products</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Drawer Footer Actions */}
        {wishlistProducts.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50/70 space-y-2">
            <button
              onClick={handleOpenFullProfileWishlist}
              className="w-full bg-brand-pink hover:bg-brand-pink-hover text-white text-xs font-bold py-3 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Heart size={15} fill="currentColor" />
              <span>View Full Liked Items in Profile</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => setIsWishlistOpen(false)}
              className="w-full text-xs font-bold text-gray-600 hover:text-brand-teal py-2 text-center transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
