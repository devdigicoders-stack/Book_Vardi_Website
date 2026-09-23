import React from 'react';
import { Heart, Star, ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { resolveImageUrl } from '../../utils/api';

export default function ProductCard({ product }) {
  const { wishlist, toggleWishlist, addToCart, openProductDetails, cartItems } = useCart();
  
  const productId = product?._id || product?.id;
  const isWishlisted = wishlist.some((id) => String(id) === String(productId));
  const cartItem = cartItems?.find((item) => String(item._id || item.id) === String(productId));
  const countInCart = cartItem ? cartItem.quantity : 0;

  const title = product?.name || 'Product';
  const subtitle = product?.subtitle || product?.description || product?.category || '';
  const basePrice = product?.price || 0;
  const sizeVariants = Array.isArray(product?.sizeVariants) && product.sizeVariants.length > 0 ? product.sizeVariants : [];
  const variantPrices = sizeVariants.map(v => Number(v.price)).filter(p => !isNaN(p) && p > 0);
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : basePrice;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : basePrice;
  const hasPriceRange = minPrice < maxPrice;

  const availableSizes = sizeVariants.length > 0
    ? sizeVariants.map(v => v.size)
    : (Array.isArray(product?.sizes) ? product.sizes : []);

  const price = minPrice;
  const originalPrice = product?.originalPrice || product?.mrp || (price > 0 && product?.discountPercentage ? Math.round(price / (1 - product.discountPercentage / 100)) : null);
  const rawImg = product?.image || (Array.isArray(product?.images) && product.images[0]) || product?.coverImage || (Array.isArray(product?.kitItems) && product.kitItems[0]?.image) || '/images/gel-pen-set.jpg';
  const image = resolveImageUrl(rawImg);
  const rawRating = product?.rating ?? product?.averageRating;
  const rating = rawRating !== undefined && rawRating !== null ? Number(rawRating) : 0;
  const rawReviewsCount = product?.reviewsCount ?? product?.reviews ?? product?.numReviews;
  const reviewsCount = rawReviewsCount !== undefined && rawReviewsCount !== null ? Number(rawReviewsCount) : 0;
  const badge = product?.discountBadge || (Array.isArray(product?.tags) && product.tags[0]) || (product?.discountPercentage ? `${product.discountPercentage}% OFF` : '');

  const getBadgeStyle = (badgeText) => {
    if (!badgeText) return '';
    const b = String(badgeText).toLowerCase();
    if (b.includes('off') || b.includes('sale') || b.includes('deal')) return 'bg-brand-pink text-white';
    if (b.includes('popular') || b.includes('bestseller') || b.includes('top')) return 'bg-brand-yellow text-brand-teal-dark';
    return 'bg-brand-ochre text-white';
  };

  return (
    <div
      onClick={() => openProductDetails({ ...product, id: productId, image, originalPrice, subtitle, rating, reviewsCount })}
      className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden flex flex-col hover:shadow-xl hover:border-brand-teal/20 transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative w-full pt-[100%] bg-gray-50 overflow-hidden">
        {badge && (
          <span
            className={`absolute top-2 left-2 sm:top-3 sm:left-3 z-10 text-[9px] sm:text-[10px] font-extrabold tracking-wider px-1.5 sm:px-2 py-0.5 rounded uppercase shadow-xs ${getBadgeStyle(
              badge
            )}`}
          >
            {badge}
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
            toggleWishlist(productId, product);
          }}
          aria-label={isWishlisted ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
          title={isWishlisted ? 'Liked' : 'Like'}
        >
          <Heart
            size={14}
            className={`sm:w-4 sm:h-4 transition-transform duration-200 ${isWishlisted ? 'scale-110' : ''}`}
            fill={isWishlisted ? 'currentColor' : 'none'}
          />
        </button>

        <img
          src={image}
          alt={title}
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
          title={title}
        >
          {title}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1 mb-1.5">
          {subtitle}
        </p>

        {/* Available Size Badges */}
        {availableSizes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {availableSizes.slice(0, 4).map((s, idx) => (
              <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200">
                {s}
              </span>
            ))}
            {availableSizes.length > 4 && (
              <span className="text-[9px] font-bold text-gray-400">
                +{availableSizes.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-1.5 sm:gap-2">
          {/* Price */}
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            {hasPriceRange ? (
              <span className="text-sm sm:text-base font-extrabold text-brand-teal">
                ₹{minPrice} - ₹{maxPrice}
              </span>
            ) : (
              <span className="text-sm sm:text-base font-extrabold text-brand-teal">
                ₹{price}
              </span>
            )}
            {originalPrice && originalPrice > price && (
              <span className="text-[10px] sm:text-xs text-red-500 line-through font-semibold decoration-red-500">
                ₹{originalPrice}
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
                  fill={i < Math.floor(rating) && rating > 0 ? 'currentColor' : 'none'}
                  stroke="currentColor"
                />
              ))}
            </div>
            <span className="font-bold text-gray-700">{rating.toFixed(1)}</span>
            <span className="text-[10px] sm:text-[11px] text-gray-400 hidden xs:inline">
              ({reviewsCount.toLocaleString()})
            </span>
          </div>

          {/* Add to Cart / Select Size Button with Live Item Count */}
          <button
            className={`w-full mt-1.5 sm:mt-2 py-1.5 sm:py-2 px-2 sm:px-3 font-bold rounded-lg text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
              countInCart > 0
                ? 'bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark border border-brand-yellow-hover ring-2 ring-brand-yellow/30 font-extrabold'
                : 'bg-brand-yellow/25 hover:bg-brand-yellow text-brand-teal border border-brand-yellow/60'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (sizeVariants.length > 0) {
                openProductDetails({ ...product, id: productId, image, originalPrice, subtitle, rating, reviewsCount });
              } else {
                addToCart(product);
              }
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={13} className="shrink-0" />
            <span className="truncate">
              {sizeVariants.length > 0 
                ? (countInCart > 0 ? `Select Size (${countInCart})` : 'Select Size')
                : (countInCart > 0 ? `Add to Cart (${countInCart})` : 'Add to Cart')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
