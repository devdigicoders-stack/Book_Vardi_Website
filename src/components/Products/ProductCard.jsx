import React from 'react';
import { Heart, Star, ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { wishlist, toggleWishlist, addToCart, openProductDetails, cartItems } = useCart();
  const isWishlisted = wishlist.some((id) => Number(id) === Number(product.id));
  const cartItem = cartItems?.find((item) => Number(item.id) === Number(product.id));
  const countInCart = cartItem ? cartItem.quantity : 0;

  const getBadgeStyle = (badge) => {
    if (!badge) return '';
    const b = badge.toLowerCase();
    if (b.includes('off') || b.includes('sale')) return 'bg-brand-pink text-white';
    if (b.includes('popular') || b.includes('bestseller')) return 'bg-brand-yellow text-brand-teal-dark';
    return 'bg-brand-ochre text-white';
  };

  return (
    <div
      onClick={() => openProductDetails(product)}
      className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden flex flex-col hover:shadow-xl hover:border-brand-teal/20 transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative w-full pt-[100%] bg-gray-50 overflow-hidden">
        {product.discountBadge && (
          <span
            className={`absolute top-2 left-2 sm:top-3 sm:left-3 z-10 text-[9px] sm:text-[10px] font-extrabold tracking-wider px-1.5 sm:px-2 py-0.5 rounded uppercase shadow-xs ${getBadgeStyle(
              product.discountBadge
            )}`}
          >
            {product.discountBadge}
          </span>
        )}

        <button
          type="button"
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full backdrop-blur border flex items-center justify-center transition-all duration-200 active:scale-75 cursor-pointer shadow-xs ${
            isWishlisted
              ? 'text-brand-pink bg-pink-50 border-brand-pink/40 scale-105 shadow-sm'
              : 'bg-white/90 border-gray-200 text-gray-400 hover:text-brand-pink hover:bg-white hover:scale-110'
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          title={isWishlisted ? 'Liked' : 'Like'}
        >
          <Heart
            size={14}
            className={`sm:w-4 sm:h-4 transition-transform duration-200 ${isWishlisted ? 'scale-110' : ''}`}
            fill={isWishlisted ? 'currentColor' : 'none'}
          />
        </button>

        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/gel-pen-set.jpg';
          }}
        />

        {/* Quick View Hover Indicator */}
        <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur text-brand-teal text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye size={14} />
            <span>Quick View</span>
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-grow">
        <h3
          className="text-xs sm:text-sm font-bold text-brand-teal line-clamp-1 group-hover:text-brand-teal-light leading-snug"
          title={product.name}
        >
          {product.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1 mb-2">
          {product.subtitle}
        </p>

        <div className="mt-auto flex flex-col gap-1.5 sm:gap-2">
          {/* Price */}
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base font-extrabold text-brand-teal">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 text-[11px] text-gray-600">
            <div className="flex items-center gap-0.5 text-brand-ochre">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className="sm:w-3 sm:h-3"
                  fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
                  stroke="currentColor"
                />
              ))}
            </div>
            <span className="text-[10px] sm:text-[11px] text-gray-400 hidden xs:inline">
              ({(product.reviewsCount || product.reviews || 0).toLocaleString()})
            </span>
          </div>

          {/* Add to Cart Button with Live Item Count */}
          <button
            className={`w-full mt-1.5 sm:mt-2 py-1.5 sm:py-2 px-2 sm:px-3 font-bold rounded-lg text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
              countInCart > 0
                ? 'bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark border border-brand-yellow-hover ring-2 ring-brand-yellow/30 font-extrabold'
                : 'bg-brand-yellow/25 hover:bg-brand-yellow text-brand-teal border border-brand-yellow/60'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={13} className="shrink-0" />
            <span className="truncate">
              {countInCart > 0 ? `Add to Cart (${countInCart})` : 'Add to Cart'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
