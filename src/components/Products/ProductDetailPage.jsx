import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Star,
  Heart,
  ShoppingCart,
  Zap,
  Check,
  CheckCircle2,
  Truck,
  RotateCcw,
  ShieldCheck,
  Plus,
  Minus,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Tag,
  Ticket,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Store,
  AlertTriangle,
  CreditCard,
  Banknote,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { compressImageToWebP } from '../../utils/imageCompressor';
import { resolveImageUrl } from '../../utils/api';
import GrabKitSection from './GrabKitSection';

export const getProductPaymentRestrictions = (product) => {
  if (!product) return { acceptsCod: true, acceptsOnline: true, allDisabled: false };

  const pma = String(product.paymentMethodAllowed || product.payment_method_allowed || '').toLowerCase();

  const allowedMethodsArray = (
    Array.isArray(product.paymentMethodsAllowed) ? product.paymentMethodsAllowed :
    Array.isArray(product.acceptedPaymentMethods) ? product.acceptedPaymentMethods :
    Array.isArray(product.paymentMethods) ? product.paymentMethods :
    Array.isArray(product.seller?.paymentMethods) ? product.seller.paymentMethods :
    null
  );

  let acceptsCod = true;
  let acceptsOnline = true;

  if (pma === 'online_only' || pma === 'prepaid_only') {
    acceptsCod = false;
  } else if (pma === 'cod_only' || pma === 'cash_only') {
    acceptsOnline = false;
  } else if (pma === 'none' || pma === 'disabled' || pma === 'neither') {
    acceptsCod = false;
    acceptsOnline = false;
  }

  if (product.acceptsCod === false || product.sellerAcceptsCod === false || product.seller?.acceptsCod === false || product.seller?.paymentMethods?.cod === false) {
    acceptsCod = false;
  }

  if (product.acceptsOnline === false || product.sellerAcceptsOnline === false || product.seller?.acceptsOnline === false || product.seller?.paymentMethods?.online === false) {
    acceptsOnline = false;
  }

  if (allowedMethodsArray !== null) {
    const upperList = allowedMethodsArray.map((m) => String(m).toUpperCase().trim());
    if (upperList.length === 0) {
      acceptsCod = false;
      acceptsOnline = false;
    } else {
      const hasCod = upperList.some((m) => m.includes('COD') || m.includes('CASH'));
      const hasOnline = upperList.some((m) => m.includes('ONLINE') || m.includes('UPI') || m.includes('CARD') || m.includes('PREPAID') || m.includes('RAZORPAY'));
      if (!hasCod) acceptsCod = false;
      if (!hasOnline) acceptsOnline = false;
    }
  }

  return {
    acceptsCod,
    acceptsOnline,
    allDisabled: !acceptsCod && !acceptsOnline
  };
};

const FALLBACK_IMAGE = '/images/gel-pen-set.jpg';

const CATEGORY_GALLERY_MAP = {
  notebooks: [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=1000&auto=format&fit=crop&q=80'
  ],
  pens: [
    '/images/gel-pen-set.jpg',
    '/images/pastel-highlighters.jpg',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1000&auto=format&fit=crop&q=80'
  ],
  supplies: [
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=1000&auto=format&fit=crop&q=80'
  ],
  bags: [
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1000&auto=format&fit=crop&q=80'
  ],
  art: [
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80'
  ],
  planners: [
    'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=1000&auto=format&fit=crop&q=80'
  ],
  gifts: [
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=1000&auto=format&fit=crop&q=80'
  ]
};

const getProductGallery = (product) => {
  const rawImage = product?.image || (Array.isArray(product?.images) && product.images[0]);
  const productGallery = Array.isArray(product?.images) ? product.images : [];
  const categoryGallery = CATEGORY_GALLERY_MAP[product?.category] || [];
  const gallery = [rawImage, ...productGallery, ...categoryGallery].filter(Boolean).map((img) => resolveImageUrl(img));
  return [...new Set(gallery)].slice(0, 5);
};

export default function ProductDetailPage({ onNavigate }) {
  const {
    selectedProduct,
    closeProductDetails,
    openProductDetails,
    addToCart,
    wishlist,
    toggleWishlist,
    setIsCartOpen,
    productReviews,
    addProductReview,
    fetchReviewsForProduct,
    userProfile,
    showToast,
    cartItems,
    products = [],
    promotions = [],
    applyCoupon,
    appliedCoupon
  } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('desc'); // 'desc' | 'specs' | 'details'
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedBundleItems, setSelectedBundleItems] = useState([]);
  const [selectedCouponForDetails, setSelectedCouponForDetails] = useState(null);
  const [showAllCouponsModal, setShowAllCouponsModal] = useState(false);
  const [appliedProductCouponMap, setAppliedProductCouponMap] = useState({});
  const [showSizeChartModal, setShowSizeChartModal] = useState(false);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const handleAddToCartWithLoader = () => {
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    addToCart(productPayload, quantity);
    setTimeout(() => setIsAddingToCart(false), 400);
  };

  const handleBuyNowWithLoader = () => {
    if (isBuyingNow) return;
    setIsBuyingNow(true);
    handleBuyNow();
    setTimeout(() => setIsBuyingNow(false), 500);
  };

  // Base Price, Discount % and Real MRP calculation (Aligned 100% with ProductCard homepage logic)
  const basePrice = Number(selectedProduct?.price || 0);
  const baseDiscountPct = Number(selectedProduct?.discountPercentage || selectedProduct?.discount || selectedProduct?.offer?.discountPercentage || 0);

  let realBaseMrp = Number(
    selectedProduct?.originalPrice ??
    selectedProduct?.mrp ??
    selectedProduct?.regularPrice ??
    selectedProduct?.marketPrice ??
    selectedProduct?.listPrice ??
    selectedProduct?.compareAtPrice ??
    selectedProduct?.comparePrice ??
    0
  );

  if ((!realBaseMrp || realBaseMrp <= basePrice) && baseDiscountPct > 0 && baseDiscountPct < 100 && basePrice > 0) {
    realBaseMrp = Math.round(basePrice / (1 - baseDiscountPct / 100));
  }

  // Size Variants handling with individual price, MRP and image
  const sizeVariants = Array.isArray(selectedProduct?.sizeVariants) && selectedProduct.sizeVariants.length > 0
    ? selectedProduct.sizeVariants
    : (Array.isArray(selectedProduct?.sizes) && selectedProduct.sizes.length > 0
        ? selectedProduct.sizes.map(s => {
            if (typeof s === 'object' && s !== null) {
              const vPrice = Number(s.price || basePrice);
              const vMrp = Number(s.mrp || s.originalPrice || s.regularPrice || (vPrice && baseDiscountPct > 0 ? Math.round(vPrice / (1 - baseDiscountPct / 100)) : realBaseMrp));
              return { size: s.size || s.label || 'Standard', price: vPrice, mrp: vMrp, image: s.image };
            }
            return {
              size: String(s),
              price: basePrice,
              mrp: realBaseMrp
            };
          })
        : []);

  const [selectedSize, setSelectedSize] = useState(() => sizeVariants[0]?.size || null);
  const [variantImageOverride, setVariantImageOverride] = useState(null);

  useEffect(() => {
    setShowAllSizes(false);
    if (sizeVariants.length > 0) {
      setSelectedSize(sizeVariants[0].size);
      if (sizeVariants[0].image) {
        setVariantImageOverride(sizeVariants[0].image);
      } else {
        setVariantImageOverride(null);
      }
    } else {
      setSelectedSize(null);
      setVariantImageOverride(null);
    }
  }, [selectedProduct?.id, selectedProduct?._id]);

  const activeVariant = sizeVariants.find(v => String(v.size) === String(selectedSize)) || (sizeVariants.length > 0 ? sizeVariants[0] : null);

  const currentPrice = (activeVariant?.price !== undefined && activeVariant?.price !== null && Number(activeVariant.price) > 0)
    ? Number(activeVariant.price)
    : basePrice;

  const rawVariantMrp = activeVariant?.mrp ?? activeVariant?.originalPrice ?? activeVariant?.regularPrice ?? activeVariant?.marketPrice;

  let currentMrp = 0;
  if (rawVariantMrp !== undefined && rawVariantMrp !== null && Number(rawVariantMrp) > currentPrice) {
    currentMrp = Number(rawVariantMrp);
  } else if (realBaseMrp > currentPrice) {
    currentMrp = realBaseMrp;
  } else if (realBaseMrp > 0 && basePrice > 0 && realBaseMrp > basePrice) {
    const mrpRatio = realBaseMrp / basePrice;
    currentMrp = Math.round(currentPrice * mrpRatio);
  } else if (baseDiscountPct > 0 && baseDiscountPct < 100 && currentPrice > 0) {
    currentMrp = Math.round(currentPrice / (1 - baseDiscountPct / 100));
  } else {
    currentMrp = currentPrice;
  }

  if (currentMrp < currentPrice) {
    currentMrp = currentPrice;
  }

  const handleSelectSize = (variant) => {
    setSelectedSize(variant.size);
    if (variant.image) {
      setVariantImageOverride(variant.image);
    } else {
      setVariantImageOverride(null);
    }
  };

  const productPayload = {
    ...selectedProduct,
    price: currentPrice,
    originalPrice: currentMrp,
    mrp: currentMrp,
    selectedSize: selectedSize || undefined,
    image: variantImageOverride || activeVariant?.image || selectedProduct?.image
  };

  const currentProductIdKey = selectedProduct?.id || selectedProduct?._id || 'default_product';
  const currentAppliedCouponCode = appliedProductCouponMap[currentProductIdKey] || null;

  // Available Offers & Coupons list
  const availableCoupons = [
    {
      code: 'SCHOOL10',
      title: 'Get 10% Flat Student Discount',
      subtitle: '10% Off on all academic books & uniforms',
      discountType: 'percentage',
      discountValue: '10%',
      minOrder: 0,
      minOrderLabel: 'No Minimum Order Value',
      expiry: 'Dec 31, 2026',
      colorScheme: 'pink',
      details: 'Applies a 10% instant price reduction on your entire cart subtotal. Valid for all registered students, parents, and schools. Only 1 coupon can be applied per order.'
    },
    {
      code: 'STUDENT50',
      title: '₹50 Flat Student Savings',
      subtitle: 'Save ₹50 on orders above ₹399',
      discountType: 'flat',
      discountValue: '₹50',
      minOrder: 399,
      minOrderLabel: 'Min Order Value ₹399',
      expiry: 'Dec 31, 2026',
      colorScheme: 'teal',
      details: 'Get flat ₹50 instant cashback discount when your cart value exceeds ₹399. Applies across notebooks, stationery kits, and school uniforms. Only 1 coupon can be applied per order.'
    },
    {
      code: 'FREESHIP',
      title: '100% Free Doorstep Delivery',
      subtitle: 'Zero shipping charges on any cart value',
      discountType: 'freeship',
      discountValue: 'Free Delivery',
      minOrder: 0,
      minOrderLabel: 'No Minimum Order Value',
      expiry: 'Dec 31, 2026',
      colorScheme: 'yellow',
      details: 'Waives 100% of shipping and delivery fees for doorstep student dispatch. Valid for all pin codes across India. Only 1 coupon can be applied per order.'
    },
    ...(promotions || []).map((p) => ({
      code: p.code,
      title: p.title || `${p.code} Promo Offer`,
      subtitle: p.description || `Special offer on ${p.code}`,
      discountType: p.discountType || 'percentage',
      discountValue: p.discountValue ? `${p.discountValue}%` : 'Special Discount',
      minOrder: p.minOrderValue || 0,
      minOrderLabel: p.minOrderValue ? `Min Order Value ₹${p.minOrderValue}` : 'No Minimum Limit',
      expiry: p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Limited Time',
      colorScheme: 'teal',
      details: p.details || `Exclusive offer for ${p.code}. Valid on eligible catalog products. Only 1 coupon can be applied per order.`
    }))
  ];

  const handleApplyCouponAndCheckout = (couponCode) => {
    if (selectedProduct) {
      addToCart(productPayload, quantity);
    }
    const res = applyCoupon(couponCode);
    if (res && res.success !== false) {
      setAppliedProductCouponMap((prev) => ({
        ...prev,
        [currentProductIdKey]: couponCode
      }));
      setSelectedCouponForDetails(null);
      closeProductDetails();
      setIsCartOpen(false);
      if (onNavigate) {
        onNavigate('checkout');
      }
    }
  };

  // Review Form State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [isCompressingImages, setIsCompressingImages] = useState(false);

  const scrollRef = useRef(null);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsCompressingImages(true);

    for (const file of files) {
      try {
        const compressed = await compressImageToWebP(file, 1024, 1024, 0.82);
        setReviewImages((prev) => [...prev, compressed.dataUrl]);
      } catch (err) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setReviewImages((prev) => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);
      }
    }
    setIsCompressingImages(false);
  };

  const removeReviewImage = (indexToRemove) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // Reset quantity and scroll position when product changes, and fetch reviews from backend
  const productGallery = getProductGallery(selectedProduct);

  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
      setShowReviewForm(false);
      setActiveImageIndex(0);
      window.scrollTo(0, 0);
      if (fetchReviewsForProduct) {
        fetchReviewsForProduct(selectedProduct.id);
      }
    }
  }, [selectedProduct]);

  if (!selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-500 mb-4">Product not found.</h2>
        <button onClick={() => onNavigate && onNavigate('home')} className="px-4 py-2 bg-brand-teal text-white rounded-lg">Go Home</button>
      </div>
    );
  }

  const isWishlisted = wishlist.some((id) => Number(id) === Number(selectedProduct.id));
  const cartItem = cartItems?.find((item) => Number(item.id) === Number(selectedProduct.id));
  const countInCart = cartItem ? cartItem.quantity : 0;
  const bundleTotal = (selectedProduct.kitItems || []).reduce((sum, item) => {
    return sum + (selectedBundleItems.includes(item.id) ? item.price : 0);
  }, 0);

  // Reviews for this product
  const reviewsList = productReviews[selectedProduct.id] || [];

  const averageRating = reviewsList.length > 0
    ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
    : '0.0';

  // Recommendation products & kits (Strict check: ONLY approved and active products)
  const currentProdIdStr = String(selectedProduct.id || selectedProduct._id || '');

  const isApprovedProduct = (p) => {
    if (!p) return false;
    if (p.approvalStatus) {
      const stat = String(p.approvalStatus).toLowerCase().trim();
      if (stat === 'pending' || stat === 'rejected') return false;
      if (stat !== 'approved' && stat !== 'verified') return false;
    }
    if (p.status) {
      const st = String(p.status).toLowerCase().trim();
      if (st === 'inactive' || st === 'deleted' || st === 'draft') return false;
    }
    return true;
  };

  const approvedCandidates = (products || []).filter((p) => {
    if (String(p.id || p._id) === currentProdIdStr) return false;
    return isApprovedProduct(p);
  });

  // 1. Recommended Kits row (Approved kits / bundles only)
  let recommendedKits = approvedCandidates.filter((p) => {
    return p.category === 'kits' || p.bundleType === 'kit' || (Array.isArray(p.kitItems) && p.kitItems.length > 0) || p.school;
  }).slice(0, 8);

  if (recommendedKits.length === 0) {
    recommendedKits = approvedCandidates.slice(0, 6);
  }

  // 2. Complete Your Kit / Featured Products (Approved products from other categories)
  let moreInKit = approvedCandidates.filter((p) => {
    return p.category !== selectedProduct.category;
  }).slice(0, 8);

  if (moreInKit.length === 0) {
    moreInKit = approvedCandidates.slice(2, 8);
  }

  // 3. Similar Products (Approved products from the same category)
  let similarProducts = approvedCandidates.filter((p) => {
    return p.category === selectedProduct.category;
  }).slice(0, 8);

  if (similarProducts.length === 0) {
    similarProducts = approvedCandidates.slice(0, 6);
  }

  // 4. You Might Find Helpful / Other Products (Approved top-rated student favorites)
  let helpfulProducts = approvedCandidates.filter((p) => {
    const r = Number(p.rating || p.averageRating || 0);
    return r >= 4.0;
  }).slice(0, 8);

  if (helpfulProducts.length === 0) {
    helpfulProducts = approvedCandidates.slice(4, 10);
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      showToast('⚠️ Please write your review comment');
      return;
    }

    addProductReview(selectedProduct.id, {
      rating: newRating,
      comment: reviewComment.trim(),
      images: reviewImages
    });

    setReviewComment('');
    setReviewImages([]);
    setShowReviewForm(false);
  };

  const handleHelpfulClick = (reviewId) => {
    if (helpfulVotes[reviewId]) return;
    setHelpfulVotes((prev) => ({ ...prev, [reviewId]: true }));
    showToast('👍 Marked review as helpful!');
  };

  const handleBuyNow = () => {
    if (selectedProduct.category === 'kits' && selectedProduct.kitItems) {
      if (selectedBundleItems.length > 0) {
        const selectedProducts = selectedProduct.kitItems.filter((item) => selectedBundleItems.includes(item.id));
        const bundlePrice = selectedProducts.reduce((sum, item) => sum + item.price, 0);
        addToCart({
          ...selectedProduct,
          id: `kit-${selectedProduct.id}-${selectedBundleItems.slice().sort((a, b) => a - b).join('-')}`,
          name: `${selectedProduct.name} (Custom Bundle)`,
          price: bundlePrice,
          kitItems: selectedProducts,
          bundleType: 'kit'
        }, quantity);
      } else {
        addToCart({ ...selectedProduct, bundleType: 'kit' }, quantity);
      }
    } else {
      addToCart(productPayload, quantity);
    }
    setIsCartOpen(true);
  };

  const goBack = () => {
    closeProductDetails();
    if (onNavigate) onNavigate('products');
  };

  const renderRecommendationRow = (title, subtitle, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-extrabold text-brand-teal flex items-center gap-2">
              <span>{title}</span>
              <Sparkles size={14} className="text-brand-ochre" />
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Scrollable Container */}
        <div
          className="flex flex-nowrap overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x snap-mandatory touch-pan-x scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((rec, recIdx) => {
            const rawRecImg = rec.image || (Array.isArray(rec.images) && rec.images[0]) || rec.coverImage || (Array.isArray(rec.kitItems) && rec.kitItems[0]?.image) || FALLBACK_IMAGE;
            const recImage = resolveImageUrl(rawRecImg);
            const recPrice = Number(rec.price || 0);
            let recMrp = rec.mrp || rec.originalPrice || rec.regularPrice || rec.marketPrice;
            if ((!recMrp || Number(recMrp) <= recPrice) && rec.discountPercentage && rec.discountPercentage > 0 && rec.discountPercentage < 100 && recPrice > 0) {
              recMrp = Math.round(recPrice / (1 - rec.discountPercentage / 100));
            }
            const showMrp = recMrp && Number(recMrp) > recPrice;

            return (
              <div
                key={rec.id || rec._id || rec.slug || `rec-item-${recIdx}`}
                onClick={() => openProductDetails(rec)}
                className="min-w-[160px] sm:min-w-[180px] shrink-0 snap-start p-3 rounded-2xl border border-gray-200 bg-white hover:border-brand-teal/30 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="relative w-full pt-[75%] rounded-xl overflow-hidden bg-gray-50 mb-3">
                    <img
                      src={recImage || FALLBACK_IMAGE}
                      alt={rec.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                <h4 className="font-display font-bold text-xs text-gray-900 group-hover:text-brand-teal line-clamp-1">
                  {rec.name}
                </h4>
                {rec.category === 'kits' && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-extrabold uppercase text-brand-teal truncate">{rec.school}</span>
                    <span className="text-[9px] font-bold text-brand-pink whitespace-nowrap">{rec.className}</span>
                  </div>
                )}
                <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                  {rec.subtitle}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1">
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="font-display font-extrabold text-xs text-brand-teal">
                    ₹{recPrice}
                  </span>
                  {showMrp && (
                    <span className="text-[10px] text-red-500 line-through font-semibold decoration-red-500">
                      ₹{recMrp}
                    </span>
                  )}
                </div>
                {(() => {
                  const recItem = cartItems?.find((item) => Number(item.id) === Number(rec.id));
                  const recCount = recItem ? recItem.quantity : 0;
                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(rec.category === 'kits' ? { ...rec, bundleType: 'kit' } : rec, 1);
                      }}
                      className={`px-2 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                        recCount > 0
                          ? 'bg-brand-yellow text-brand-teal-dark border border-brand-yellow-hover font-extrabold ring-1 ring-brand-yellow/30'
                          : 'bg-brand-yellow/30 hover:bg-brand-yellow text-brand-teal'
                      }`}
                    >
                      <ShoppingCart size={10} />
                      <span>{recCount > 0 ? `Add (${recCount})` : 'Add'}</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    );
  };

  // Specifications metadata generator
  const getProductSpecs = () => {
    const specs = [];
    const p = selectedProduct || {};

    if (p.brand || p.author || p.publisher || p.manufacturer) {
      specs.push({ label: 'Brand / Author', value: p.brand || p.author || p.publisher || p.manufacturer });
    }
    if (p.material || p.fabric) {
      specs.push({ label: 'Material', value: p.material || p.fabric });
    }
    if (p.category) {
      specs.push({ label: 'Category', value: p.subCategory ? `${p.category} > ${p.subCategory}` : p.category });
    }
    if (p.schoolName || p.school) {
      specs.push({ label: 'Target School', value: p.schoolName || p.school });
    }
    if (p.classGrade || p.className || p.standard) {
      specs.push({ label: 'Applicable Grade', value: p.classGrade || p.className || p.standard });
    }
    if (p.gender) {
      specs.push({ label: 'Gender / Fit', value: p.gender });
    }
    if (p.ageGroup || (Array.isArray(p.ages) && p.ages.length > 0)) {
      specs.push({ label: 'Age Group', value: p.ageGroup || (Array.isArray(p.ages) ? p.ages.join(', ') : String(p.ages)) });
    }
    if (p.colors && (Array.isArray(p.colors) ? p.colors.length > 0 : String(p.colors).trim())) {
      specs.push({ label: 'Colors', value: Array.isArray(p.colors) ? p.colors.join(', ') : String(p.colors) });
    }
    if (sizeVariants.length > 0) {
      specs.push({ label: 'Available Sizes', value: sizeVariants.map(v => v.size).join(', ') });
    } else if (Array.isArray(p.sizes) && p.sizes.length > 0) {
      specs.push({ label: 'Available Sizes', value: p.sizes.join(', ') });
    }
    if (p.unit) {
      specs.push({ label: 'Packaging Unit', value: p.unit });
    }
    if (p.stock !== undefined && p.stock !== null) {
      specs.push({ label: 'Stock Available', value: p.stock > 0 ? `${p.stock} units` : 'Out of Stock' });
    }
    specs.push({
      label: 'Return Policy',
      value: p.isReturnable === false ? 'Non-Returnable' : `${p.returnWindowDays || 7}-Day Easy Return Policy`
    });
    if (p.sellerStoreName || p.storeName || p.legalBusinessName || p.sellerName || p.seller) {
      const sName = p.sellerStoreName || p.storeName || p.legalBusinessName || p.sellerName || (typeof p.seller === 'string' ? p.seller : p.seller?.storeName || 'Book Vardi Verified Seller');
      specs.push({ label: 'Verified Seller', value: sName });
    }
    if (p.sku || activeVariant?.sku || p.isbn || p._id || p.id) {
      specs.push({ label: 'Item SKU / Code', value: p.sku || activeVariant?.sku || p.isbn || String(p._id || p.id).slice(-8).toUpperCase() });
    }

    if (specs.length < 5) {
      const cat = (p.category || '').toLowerCase();
      if (cat.includes('notebook')) {
        specs.push({ label: 'Paper Quality', value: '100 GSM Acid-Free Archival Paper' });
        specs.push({ label: 'Ruling / Layout', value: '7mm Ruled Lines with Date Margin' });
        specs.push({ label: 'Page Count', value: '160 Pages (80 Micro-Perforated Sheets)' });
        specs.push({ label: 'Binding Type', value: 'Twin-Wire 360° Lay-Flat Spiral' });
      } else if (cat.includes('pen') || cat.includes('writing')) {
        specs.push({ label: 'Tip Size', value: '0.5mm Precision Needle / Chisel Tip' });
        specs.push({ label: 'Ink Formula', value: 'Japanese Quick-Dry Pigment' });
        specs.push({ label: 'Refillable', value: 'Yes (Standard Universal Refills)' });
      } else {
        specs.push({ label: 'Quality Certification', value: '100% Authentic Student Durability Verified' });
        specs.push({ label: 'Country of Origin', value: 'India' });
      }
    }

    return specs;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6">
      <div className="container mx-auto max-w-5xl px-4"> 
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          {/* Header Bar */}
          {/* <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal">
                {selectedProduct.category}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>In Stock</span>
              </span>
            </div> */}
          {/* </div> */}

          {/* Product Hero Grid */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left: Product Image Showcase */}
              <div className="md:col-span-6 space-y-3">
                <div className="relative w-full pt-[95%] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group shadow-2xs">
                  {selectedProduct.discountBadge && (
                    <span className="absolute top-3 left-3 z-10 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-brand-pink text-white shadow-xs">
                      {selectedProduct.discountBadge}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleWishlist(selectedProduct.id, selectedProduct)}
                    className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full backdrop-blur border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                      isWishlisted
                        ? 'text-brand-pink bg-pink-50 border-brand-pink/40 scale-105'
                        : 'bg-white/90 border-gray-200 text-gray-400 hover:text-brand-pink hover:scale-110'
                    }`}
                    title={isWishlisted ? 'Liked' : 'Like'}
                  >
                    <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>

                  <img
                    src={variantImageOverride || productGallery[activeImageIndex] || selectedProduct.image || FALLBACK_IMAGE}
                    alt={selectedProduct.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                  {productGallery.map((image, index) => (
                    <button
                      key={`${selectedProduct.id}-${index}`}
                      type="button"
                      onClick={() => {
                        setActiveImageIndex(index);
                        setVariantImageOverride(null);
                      }}
                      className={`relative overflow-hidden rounded-xl border transition-all cursor-pointer ${
                        !variantImageOverride && activeImageIndex === index
                          ? 'border-brand-teal ring-2 ring-brand-teal/20 shadow-xs'
                          : 'border-gray-200 hover:border-brand-teal/30'
                      }`}
                      aria-label={`View product image ${index + 1}`}
                    >
                      <img
                        src={image}
                        alt={`${selectedProduct.name} view ${index + 1}`}
                        className="h-16 w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                    </button>
                  ))}
                </div>

                {/* Student Confidence Badges (Desktop) */}
                <div className="hidden md:grid grid-cols-2 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-[11px] text-gray-700">
                    <Truck size={16} className="text-brand-teal shrink-0" />
                    <span>Free delivery on ₹499+</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-[11px] text-gray-700">
                    <Zap size={16} className="text-brand-ochre shrink-0" />
                    <span>Dispatched in 24 Hrs</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-[11px] text-gray-700">
                    <RotateCcw size={16} className="text-brand-pink shrink-0" />
                    <span>7-Day Easy Returns</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-[11px] text-gray-700">
                    <ShieldCheck size={16} className="text-green-700 shrink-0" />
                    <span>100% Genuine Certified</span>
                  </div>
                </div>
              </div>

              {/* Right: Product Details & Purchase Actions */}
              <div className="md:col-span-6 flex flex-col space-y-5">
                <div>
                  {/* Category & SubCategory Breadcrumb */}
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-brand-ochre">
                      {selectedProduct.subCategory ? `${selectedProduct.category} • ${selectedProduct.subCategory}` : (selectedProduct.category || 'BOOK VARDI ACADEMIC ESSENTIALS')}
                    </span>
                    {(selectedProduct.brand || selectedProduct.author || selectedProduct.publisher) && (
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                        {selectedProduct.brand || selectedProduct.author || selectedProduct.publisher}
                      </span>
                    )}
                  </div>

                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-teal mt-1 leading-tight">
                    {selectedProduct.name}
                  </h1>

                  {selectedProduct.subtitle && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
                      {selectedProduct.subtitle}
                    </p>
                  )}

                  {/* Comprehensive Metadata Badges (School, Class, Gender, Age, Material, Colors, Tags) */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {(selectedProduct.school || selectedProduct.schoolName) && (
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-full border border-brand-teal/20">
                        {selectedProduct.school || selectedProduct.schoolName}
                      </span>
                    )}
                    {(selectedProduct.className || selectedProduct.classGrade || selectedProduct.standard) && (
                      <span className="text-[11px] font-bold text-brand-pink bg-brand-pink/10 px-2.5 py-1 rounded-full border border-brand-pink/20">
                        {selectedProduct.className || selectedProduct.classGrade || selectedProduct.standard}
                      </span>
                    )}
                    {selectedProduct.gender && selectedProduct.gender !== 'All' && (
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                        {selectedProduct.gender}
                      </span>
                    )}
                    {(selectedProduct.ageGroup || (Array.isArray(selectedProduct.ages) && selectedProduct.ages.length > 0)) && (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        Age: {selectedProduct.ageGroup || (Array.isArray(selectedProduct.ages) ? selectedProduct.ages.join(', ') : selectedProduct.ages)}
                      </span>
                    )}
                    {selectedProduct.material && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        {selectedProduct.material}
                      </span>
                    )}
                    {selectedProduct.category === 'kits' && (
                      <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                        {selectedProduct.kitItems?.length || 0} products in bundle
                      </span>
                    )}
                    {Array.isArray(selectedProduct.tags) && selectedProduct.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {tag}
                      </span>
                    ))}
                    {selectedProduct.stock !== undefined && (
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          selectedProduct.stock > 10
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : selectedProduct.stock > 0
                            ? 'text-amber-800 bg-amber-50 border-amber-200'
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}>
                          {selectedProduct.stock > 10
                            ? 'In Stock'
                            : selectedProduct.stock > 0
                            ? `Only ${selectedProduct.stock} Left`
                            : 'Out of Stock'}
                        </span>
                      )}
                  </div>

                  {/* Seller & Stock Status Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3 border-t border-gray-100 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Store size={14} className="text-brand-teal shrink-0" />
                      <span>Sold by: <strong className="text-gray-900">{selectedProduct.sellerStoreName || selectedProduct.storeName || selectedProduct.legalBusinessName || selectedProduct.sellerName || (typeof selectedProduct.seller === 'string' ? selectedProduct.seller : selectedProduct.seller?.storeName || 'Book Vardi Verified Seller')}</strong></span>
                    </div>

                    {/* <div className="flex items-center gap-2">
                      {selectedProduct.isReturnable === false ? (
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          Non-Returnable
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200 flex items-center gap-1">
                          <RotateCcw size={11} />
                          <span>{selectedProduct.returnWindowDays || 7}-Day Returns</span>
                        </span>
                      )}

                      {selectedProduct.stock !== undefined && (
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          selectedProduct.stock > 10
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : selectedProduct.stock > 0
                            ? 'text-amber-800 bg-amber-50 border-amber-200'
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}>
                          {selectedProduct.stock > 10
                            ? 'In Stock'
                            : selectedProduct.stock > 0
                            ? `Only ${selectedProduct.stock} Left`
                            : 'Out of Stock'}
                        </span>
                      )}
                    </div> */}
                  </div>
                </div>

                {/* Price & Savings */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50/40 via-amber-50/30 to-gray-50 border border-gray-200/80 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Price:</span>
                        <span className="font-display text-2xl sm:text-3xl font-extrabold text-brand-teal">
                          ₹{currentPrice}
                        </span>
                      </div>

                      <span className="text-xs sm:text-sm text-red-500 flex items-center gap-1 ml-1 font-semibold">
                        <span className="text-xs text-red-500 font-semibold uppercase">M.R.P.:</span>
                        <span className="line-through text-red-500 font-semibold decoration-red-500">₹{currentMrp || currentPrice}</span>
                      </span>
                    </div>

                    {/* Rating parallel to Price */}
                    <div className="flex items-center gap-1 text-brand-ochre font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs shrink-0 shadow-2xs">
                      <Star size={13} fill="currentColor" />
                      <span>{averageRating}</span>
                      <span className="text-gray-400 font-normal">({reviewsList.length})</span>
                    </div>
                  </div>

                  {currentMrp > currentPrice && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 pt-1">
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {Math.round(((currentMrp - currentPrice) / currentMrp) * 100)}% OFF
                      </span>
                      <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                        Save ₹{currentMrp - currentPrice}
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] font-medium text-gray-500 mt-2 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600 inline shrink-0" />
                    <span>Inclusive of all taxes. Free student doorstep delivery available.</span>
                  </p>
                </div>

                {/* Size / Scale Variants Selector & Size Chart */}
                {(!selectedProduct.isMeterBased && selectedProduct.unit !== 'meter') && sizeVariants.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                        {(() => {
                          const scale = (activeVariant?.measureScale || sizeVariants[0]?.measureScale || '').toLowerCase();
                          if (scale === 'count') return 'Select Pack / Count:';
                          if (scale === 'meter') return 'Select Fabric Length:';
                          if (scale === 'kg' || scale === 'gram') return 'Select Weight:';
                          if (scale === 'box') return 'Select Packaging:';
                          if (scale === 'unit') return 'Select Option:';
                          return 'Select Size:';
                        })()} <strong className="text-brand-teal ml-1">{selectedSize}</strong>
                      </span>
                      {activeVariant?.stock !== undefined && (
                        <span className={`text-[11px] font-bold ${activeVariant.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {activeVariant.stock > 0 ? `${activeVariant.stock} in stock` : 'Out of Stock'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(showAllSizes ? sizeVariants : sizeVariants.slice(0, 5)).map((variant, vIdx) => {
                        const variantVal = variant.size || variant.measureValue || `size-${vIdx}`;
                        const isSelected = selectedSize === variantVal;
                        return (
                          <button
                            key={variant.id || variant._id || variantVal || `size-var-${vIdx}`}
                            type="button"
                            onClick={() => handleSelectSize(variant)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-brand-teal text-white border-brand-teal shadow-xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-brand-teal/40'
                            }`}
                          >
                            <span>{variantVal}</span>
                            {variant.price && (
                              <span className={`text-[10px] ${isSelected ? 'text-teal-100 font-normal' : 'text-gray-400 font-normal'}`}>
                                ₹{variant.price}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {sizeVariants.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setShowAllSizes(!showAllSizes)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-brand-teal bg-teal-50 hover:bg-teal-100 border border-teal-200 hover:border-brand-teal/50 cursor-pointer transition-all flex items-center gap-1"
                        >
                          {showAllSizes ? (
                            <span>Show Less</span>
                          ) : (
                            <span>Show More (+{sizeVariants.length - 5})</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Size Chart Popup Button for Clothing & Uniforms */}
                {(selectedProduct.category === 'Uniforms' || selectedProduct.category === 'uniforms' || selectedProduct.sizeChart || ['shirt', 'pant', 'blazer', 'trousers', 'skirt', 'uniform'].some(k => (selectedProduct.name || '').toLowerCase().includes(k))) && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowSizeChartModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Sparkles size={14} className="text-teal-600" />
                      <span>View Apparel Size Chart & Measurement Guide</span>
                    </button>
                  </div>
                )}

                {selectedProduct.category === 'kits' && selectedProduct.kitItems && (
                  <div className="rounded-2xl border border-brand-teal/20 bg-brand-teal/5 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-brand-teal">Build Your Bundle</span>
                      <span className="text-[11px] font-bold text-gray-600">₹{bundleTotal || currentPrice}</span>
                    </div>
                    <div className="space-y-2">
                      {selectedProduct.kitItems.map((item, itemIdx) => {
                        const isChecked = selectedBundleItems.includes(item.id || item._id);
                        return (
                          <button
                            key={item.id || item._id || item.name || `kit-item-${itemIdx}`}
                            type="button"
                            onClick={() => setSelectedBundleItems((prev) =>
                              prev.includes(item.id)
                                ? prev.filter((id) => id !== item.id)
                                : [...prev, item.id]
                            )}
                            className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                              isChecked ? 'border-brand-teal bg-white' : 'border-gray-200 bg-white/80 hover:border-brand-teal/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-brand-teal border-brand-teal text-white' : 'border-gray-300 bg-white'}`}>
                                <Check size={10} />
                              </div>
                              <span className="text-xs font-bold text-gray-700">{item.name}</span>
                            </div>
                            <span className="text-[11px] font-bold text-brand-teal">₹{item.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Stepper & Meter Selector */}
                {(selectedProduct.isMeterBased || selectedProduct.unit === 'meter') ? (
                  <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
                        <Tag size={14} className="text-teal-700" />
                        <span>Fabric Length (Meters):</span>
                      </span>
                      <span className="text-xs font-bold text-teal-800">
                        ₹{currentPrice} / meter
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-teal-300 rounded-xl bg-white p-1">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(0.5, Math.round((q - 0.5) * 10) / 10))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold cursor-pointer"
                        >
                          -0.5m
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                          className="w-16 text-center font-extrabold text-sm text-teal-950 focus:outline-hidden bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.round((q + 0.5) * 10) / 10)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold cursor-pointer"
                        >
                          +0.5m
                        </button>
                      </div>

                      {/* Quick preset length chips */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[1, 2.5, 3.5, 5, 10].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setQuantity(preset)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              quantity === preset
                                ? 'bg-brand-teal text-white border-brand-teal shadow-xs'
                                : 'bg-white text-teal-900 border-teal-200 hover:border-brand-teal'
                            }`}
                          >
                            {preset}m
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-right pt-1 border-t border-teal-200/60 flex items-center justify-between">
                      <span className="text-xs text-teal-800 font-medium">Selected: <strong>{quantity} Meters</strong></span>
                      <div>
                        <span className="text-[10px] text-gray-500 block">Total Fabric Cost:</span>
                        <span className="font-display font-extrabold text-xl text-brand-teal">
                          ₹{Math.round(currentPrice * quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Quantity:
                      </span>
                      <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-2xs hover:bg-gray-100 text-gray-700 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-bold text-sm text-gray-900">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => q + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-2xs hover:bg-gray-100 text-gray-700 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-gray-500 block">Total Price:</span>
                      <span className="font-display font-extrabold text-xl text-brand-teal">
                        ₹{currentPrice * quantity}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {(() => {
                  const { allDisabled } = getProductPaymentRestrictions(selectedProduct);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        disabled={allDisabled || isAddingToCart}
                        onClick={() => {
                          if (allDisabled) {
                            showToast('⚠️ Payment disabled by seller for this product');
                            return;
                          }
                          handleAddToCartWithLoader();
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAddingToCart ? (
                          <>
                            <Loader2 size={16} className="animate-spin text-brand-teal-dark" />
                            <span>Adding to Cart...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            <span>
                              {allDisabled ? 'Payment Unset' : `Add ${quantity > 1 ? `${quantity} Items` : 'to Cart'}`}
                              {!allDisabled && countInCart > 0 && ` (${countInCart})`}
                            </span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={allDisabled || isBuyingNow}
                        onClick={() => {
                          if (allDisabled) {
                            showToast('⚠️ Payment disabled by seller for this product');
                            return;
                          }
                          handleBuyNowWithLoader();
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isBuyingNow ? (
                          <>
                            <Loader2 size={16} className="animate-spin text-white" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={16} />
                            <span>{allDisabled ? 'Unavailable' : 'Buy Now'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}

                {/* Student Perks Note */}
                <div className="text-xs text-gray-500 bg-brand-teal/5 border border-brand-teal/15 p-3 rounded-xl flex items-start gap-2">
                  <Sparkles size={15} className="text-brand-ochre shrink-0 mt-0.5" />
                  <span>
                    Earn <strong>{Math.round(currentPrice / 10)} Reward Points</strong> on this order for student stationary perks.
                  </span>
                </div>

                {/* Student Confidence Badges (Mobile Only - Just above offers) */}
                <div className="grid md:hidden grid-cols-2 gap-2.5 mt-2 pt-4 border-t border-gray-100">
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-[11px] text-gray-700">
                    <Truck size={16} className="text-brand-teal shrink-0" />
                    <span>Free delivery on ₹499+</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-[11px] text-gray-700">
                    <Zap size={16} className="text-brand-ochre shrink-0" />
                    <span>Dispatched in 24 Hrs</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-[11px] text-gray-700">
                    <RotateCcw size={16} className="text-brand-pink shrink-0" />
                    <span>7-Day Easy Returns</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-[11px] text-gray-700">
                    <ShieldCheck size={16} className="text-green-700 shrink-0" />
                    <span>100% Genuine Certified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* OFFERS & COUPONS SECTION (Scrollable Horizontal Row) */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Tag size={14} className="text-brand-pink" />
                  Available Offers & Coupons
                </h3>
                {availableCoupons.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCouponsModal(true)}
                    className="text-xs font-extrabold text-brand-teal hover:text-brand-teal-light flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>View All ({availableCoupons.length})</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
              
              <div
                className="flex flex-nowrap overflow-x-auto gap-3 pb-3 hide-scrollbar snap-x snap-mandatory scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {availableCoupons.map((coupon, cIdx) => {
                  const isApplied = currentAppliedCouponCode === coupon.code;
                  return (
                    <div 
                      key={coupon.code || coupon.id || coupon._id || `coupon-${cIdx}`}
                      className={`min-w-[260px] sm:min-w-[280px] shrink-0 snap-start border rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all ${
                        isApplied 
                          ? 'bg-green-50/80 border-green-300 ring-2 ring-green-400/20 shadow-xs' 
                          : 'bg-gradient-to-br from-gray-50/80 to-teal-50/20 border-gray-200/80 hover:border-brand-teal/30 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 bg-white border border-dashed border-brand-teal/40 px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold text-brand-teal uppercase tracking-wider shadow-2xs">
                            <Ticket size={12} className="text-brand-pink" />
                            <span>{coupon.code}</span>
                          </span>
                          {isApplied && (
                            <span className="text-[10px] font-black text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-brand-pink bg-brand-pink/10 px-2 py-0.5 rounded-md shrink-0">
                          {coupon.discountValue}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-900 leading-snug">
                          {coupon.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                          {coupon.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100/80">
                        <button
                          type="button"
                          onClick={() => setSelectedCouponForDetails(coupon)}
                          className="text-[11px] font-bold text-gray-500 hover:text-brand-teal underline decoration-dotted underline-offset-4 cursor-pointer transition-colors"
                        >
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApplyCouponAndCheckout(coupon.code)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95 ${
                            isApplied
                              ? 'bg-green-700 text-white hover:bg-green-800'
                              : 'bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark'
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Applied</span>
                            </>
                          ) : (
                            <>
                              <Zap size={13} />
                              <span>Apply & Checkout</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VIEW ALL COUPONS POPUP DIV MODAL (70vh height, overflow hidden, scrollbar hidden) */}
            {showAllCouponsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-lg w-full h-[70vh] max-h-[70vh] shadow-2xl border border-gray-100 flex flex-col relative overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                    <div className="flex items-center gap-2">
                      <Ticket size={18} className="text-brand-pink" />
                      <h3 className="font-display font-extrabold text-base text-brand-teal">
                        Available Coupons & Offers ({availableCoupons.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllCouponsModal(false)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Scrollable Content inside 70vh overflow hidden container with scrollbar hidden */}
                  <div 
                    className="flex-1 overflow-y-auto p-5 space-y-3.5 hide-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {availableCoupons.map((coupon, cIdx) => {
                      const isApplied = currentAppliedCouponCode === coupon.code;
                      return (
                        <div
                          key={coupon.code || `pop-coupon-${cIdx}`}
                          className={`border rounded-2xl p-4 flex flex-col gap-3 transition-all ${
                            isApplied
                              ? 'bg-green-50/80 border-green-300 ring-2 ring-green-400/20 shadow-xs'
                              : 'bg-gradient-to-br from-gray-50/80 to-teal-50/20 border-gray-200/80 hover:border-brand-teal/30 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 bg-white border border-dashed border-brand-teal/40 px-3 py-1.5 rounded-xl text-xs font-mono font-extrabold text-brand-teal uppercase tracking-wider shadow-2xs">
                                <Ticket size={13} className="text-brand-pink" />
                                <span>{coupon.code}</span>
                              </span>
                              {isApplied && (
                                <span className="text-[10px] font-black text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full border border-green-200">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-extrabold text-brand-pink bg-brand-pink/10 px-2.5 py-1 rounded-md shrink-0">
                              {coupon.discountValue}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-gray-900 leading-snug">
                              {coupon.title}
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {coupon.subtitle}
                            </p>
                            {coupon.details && (
                              <p className="text-[11px] text-gray-600 mt-1.5 pt-1.5 border-t border-gray-100 leading-relaxed">
                                {coupon.details}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100/80">
                            <span className="text-[10px] font-semibold text-gray-400">
                              {coupon.minOrderLabel}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                setShowAllCouponsModal(false);
                                handleApplyCouponAndCheckout(coupon.code);
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                                isApplied
                                  ? 'bg-green-700 text-white hover:bg-green-800'
                                  : 'bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark'
                              }`}
                            >
                              {isApplied ? (
                                <>
                                  <CheckCircle2 size={13} />
                                  <span>Applied</span>
                                </>
                              ) : (
                                <>
                                  <Zap size={13} />
                                  <span>Apply & Checkout</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 shrink-0 text-center text-xs text-gray-500">
                    <span>Select any coupon to apply instantly to your cart & checkout.</span>
                  </div>
                </div>
              </div>
            )}

            {/* COUPON DETAILS POPUP MODAL */}
            {selectedCouponForDetails && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative space-y-4">
                  <button
                    type="button"
                    onClick={() => setSelectedCouponForDetails(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand-pink/10 text-brand-pink border border-brand-pink/20">
                      OFFER DETAILS
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-black text-lg text-brand-teal">
                      {selectedCouponForDetails.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedCouponForDetails.subtitle}
                    </p>
                  </div>

                  <div className="p-3.5 bg-gray-50 border border-dashed border-gray-300 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">PROMO CODE</span>
                      <span className="font-mono text-base font-extrabold text-brand-teal tracking-wider">
                        {selectedCouponForDetails.code}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                      {selectedCouponForDetails.discountValue}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 bg-amber-50/50 border border-amber-200/60 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-500">Minimum Purchase:</span>
                      <span className="font-bold text-gray-800">{selectedCouponForDetails.minOrderLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-500">Validity:</span>
                      <span className="font-bold text-gray-800">{selectedCouponForDetails.expiry}</span>
                    </div>
                    <div className="pt-2 border-t border-amber-200/40 text-[11px] text-gray-600 leading-relaxed">
                      {selectedCouponForDetails.details}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/60 flex items-center gap-2 text-[11px] text-blue-900 font-semibold">
                    <Sparkles size={14} className="text-blue-600 shrink-0" />
                    <span>Only 1 offer or coupon code can be active per order.</span>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCouponForDetails(null)}
                      className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCouponAndCheckout(selectedCouponForDetails.code)}
                      className="flex-1 py-3 px-4 rounded-xl bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Apply & Checkout</span>
                      <Zap size={14} className="text-brand-yellow" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SPECIFICATIONS & EXTRA DETAILS SECTION */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-3 mb-6 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('desc')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider relative cursor-pointer whitespace-nowrap ${
                    activeTab === 'desc' ? 'text-brand-teal font-extrabold' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <span>Description & Overview</span>
                  {activeTab === 'desc' && (
                    <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-brand-teal rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider relative cursor-pointer whitespace-nowrap ${
                    activeTab === 'specs' ? 'text-brand-teal font-extrabold' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <span>Product Specifications</span>
                  {activeTab === 'specs' && (
                    <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-brand-teal rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider relative cursor-pointer whitespace-nowrap ${
                    activeTab === 'details' ? 'text-brand-teal font-extrabold' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <span>Student Highlights</span>
                  {activeTab === 'details' && (
                    <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-brand-teal rounded-full" />
                  )}
                </button>
              </div>

              {activeTab === 'desc' && (
                <div className="p-5 sm:p-6 rounded-2xl bg-gray-50/70 border border-gray-100 text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4">
                  {selectedProduct.description ? (
                    <div className="whitespace-pre-line leading-relaxed text-gray-800 font-medium">
                      {selectedProduct.description}
                    </div>
                  ) : selectedProduct.subtitle ? (
                    <div className="leading-relaxed text-gray-800 font-medium">
                      {selectedProduct.subtitle}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      No additional description available for this item. Please refer to product specifications for detailed technical information.
                    </p>
                  )}

                  {Array.isArray(selectedProduct.highlights) && selectedProduct.highlights.length > 0 && (
                    <div className="pt-3 border-t border-gray-200/80">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-brand-teal mb-2">Key Highlights:</h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700">
                        {selectedProduct.highlights.map((highlight, hIdx) => (
                          <li key={hIdx}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {getProductSpecs().map((spec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100"
                    >
                      <span className="font-bold text-gray-500">{spec.label}</span>
                      <span className="font-semibold text-gray-800 text-right">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100 text-xs text-gray-700 leading-relaxed space-y-3">
                  <p>
                    Engineered specifically for demanding academic schedules, long study hours, and exam revision. Every material is vetted for ink endurance, bleed resistance, and ergonomic handling.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    <li>Formulated to prevent ghosting or ink bleeding on reverse pages.</li>
                    <li>Lightweight yet durable construction that fits into standard student backpacks.</li>
                    <li>Meets international non-toxic safety and environmental durability standards.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* RECOMMENDATIONS SECTIONS */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              {renderRecommendationRow(
                'Recommended Kits',
                selectedProduct.category === 'kits'
                  ? 'More school and class bundles you may want to explore.'
                  : 'Complete your stationery order with a school-ready bundle.',
                recommendedKits
              )}

              {renderRecommendationRow(
                'Complete Your Kit',
                'Complementary student study kits & companion stationery.',
                moreInKit
              )}

              {renderRecommendationRow(
                'Similar Products',
                'Other options in this category you might prefer.',
                similarProducts
              )}

              {renderRecommendationRow(
                'You Might Find Helpful',
                'Top-rated student favorites across all categories.',
                helpfulProducts
              )}
            </div>

            {/* GRAB KIT SECTION */}
            <div className="mt-8 rounded-2xl overflow-hidden border border-gray-100">
              <GrabKitSection onNavigate={onNavigate} />
            </div>

            {/* STUDENT USER REVIEWS & ADD REVIEW FORM */}
            <div id="reviews-section" className="mt-12 pt-8 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="font-display text-xl font-extrabold text-brand-teal flex items-center gap-2">
                    <span>Product Reviews</span>
                    <MessageSquare size={18} className="text-brand-teal" />
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Real feedback from students studying across universities and schools.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(!showReviewForm);
                    if (!showReviewForm) {
                      setTimeout(() => {
                        document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
                >
                  <span>{showReviewForm ? 'Cancel Review' : 'Write a Review'}</span>
                </button>
              </div>

              {/* Rating Breakdown Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 bg-gray-50/80 border border-gray-200/80 rounded-2xl p-5 sm:p-6 mb-8">
                <div className="sm:col-span-4 text-center sm:text-left flex flex-col justify-center">
                  <div className="font-display text-4xl font-extrabold text-brand-teal">
                    {averageRating}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-brand-ochre my-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < Math.round(Number(averageRating)) && Number(averageRating) > 0 ? 'currentColor' : 'none'}
                        stroke="currentColor"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    Based on {reviewsList.length} student reviews
                  </span>
                  {reviewsList.length > 0 && (
                    <span className="text-[11px] font-bold text-green-700 mt-1">
                      98% of students recommend this
                    </span>
                  )}
                </div>

                {/* Star distribution bars */}
                <div className="sm:col-span-8 space-y-1.5 flex flex-col justify-center text-xs">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const matchCount = reviewsList.filter((r) => r.rating === stars).length;
                    const pct = reviewsList.length > 0 ? Math.round((matchCount / reviewsList.length) * 100) : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="w-12 text-gray-600 font-bold">{stars} Stars</span>
                        <div className="flex-grow bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-yellow h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-500 text-[11px]">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inline Review Form */}
              {showReviewForm && (
                <form
                  onSubmit={handleReviewSubmit}
                  className="mb-8 p-5 sm:p-6 bg-gradient-to-r from-brand-yellow/10 via-white to-gray-50 border border-brand-yellow/30 rounded-2xl space-y-4 animate-fadeIn"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h4 className="text-sm font-extrabold text-brand-teal uppercase tracking-wider">
                      Write a Review
                    </h4>
                    <span className="text-[11px] text-gray-500">Single paragraph review & photos</span>
                  </div>

                  {/* Rating selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Your Rating
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 text-brand-ochre hover:scale-110 transition-transform cursor-pointer"
                          aria-label={`Rate ${star} star`}
                        >
                          <Star
                            size={22}
                            fill={(hoverRating || newRating) >= star ? 'currentColor' : 'none'}
                            stroke="currentColor"
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-gray-600 ml-2">
                        {newRating} / 5 Stars
                      </span>
                    </div>
                  </div>

                  {/* Single Paragraph Review Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Your Review
                    </label>
                    <textarea
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write your experience in a single paragraph (quality, durability, performance)..."
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-teal leading-relaxed"
                    />
                  </div>

                  {/* Multiple Images Upload Section */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Upload Photos (Multiple)
                    </label>
                    
                    {reviewImages.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 mb-3">
                        {reviewImages.map((imgUrl, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shadow-2xs group">
                            <img src={imgUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeReviewImage(idx)}
                              className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              title="Remove photo"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-brand-teal/40 bg-brand-teal/5 text-brand-teal hover:bg-brand-teal/10 font-semibold text-xs transition-all cursor-pointer">
                      <Camera size={16} />
                      <span>{isCompressingImages ? 'Processing photos...' : 'Add Photos'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isCompressingImages}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isCompressingImages}
                      className="bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      Submit Review
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              {reviewsList.length === 0 ? (
                <div className="text-center py-8 bg-gray-50/80 rounded-2xl border border-dashed border-gray-200 p-6">
                  <MessageSquare className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-xs text-gray-600 font-bold">No reviews yet for this product.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Be the first verified customer to share your thoughts!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsList.map((review, index) => (
                    <div
                      key={review._id || review.id || `rev-${index}`}
                      className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-brand-teal/30 hover:shadow-xs transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                            Verified Customer
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-brand-ochre">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                fill={i < review.rating ? 'currentColor' : 'none'}
                                stroke="currentColor"
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-gray-400">• {review.date}</span>
                        </div>
                      </div>

                      {/* Single paragraph review comment */}
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        {review.comment}
                      </p>

                      {/* Uploaded Review Images Gallery */}
                      {Array.isArray(review.images) && review.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {review.images.map((imgUrl, imgIdx) => (
                            <a
                              key={imgIdx}
                              href={imgUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shadow-2xs hover:opacity-95 transition-opacity"
                            >
                              <img src={imgUrl} alt={`Review photo ${imgIdx + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Seller Reply */}
                      {(review.reply || review.sellerReply) && (
                        <div className="mt-3 p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 space-y-1">
                          <div className="flex items-center gap-1.5 text-brand-teal font-extrabold text-xs">
                            <Store size={14} />
                            <span>
                              {review.legalBusinessName || review.sellerName || review.storeName || selectedProduct?.legalBusinessName || selectedProduct?.sellerName || selectedProduct?.sellerStoreName || selectedProduct?.storeName || selectedProduct?.seller || "Seller Reply"}
                            </span>
                            {review.repliedAt && (
                              <span className="text-[10px] text-gray-400 font-normal ml-auto">
                                {new Date(review.repliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed font-medium pl-5">
                            {review.reply || review.sellerReply}
                          </p>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleHelpfulClick(review.id)}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer px-2.5 py-1 rounded-lg ${
                            helpfulVotes[review.id]
                              ? 'text-brand-teal bg-brand-teal/10 font-bold'
                              : 'text-gray-500 hover:text-brand-teal hover:bg-gray-100'
                          }`}
                        >
                          <ThumbsUp size={12} />
                          <span>
                            Helpful ({review.helpfulCount + (helpfulVotes[review.id] ? 1 : 0)})
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Apparel Size Chart Modal */}
      {showSizeChartModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-teal bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  School Uniform & Size Guide
                </span>
                <h3 className="text-lg font-extrabold text-gray-900 mt-1">
                  Size Measurement Chart ({selectedProduct.name})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeChartModal(false)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              All measurements are provided in <strong>Inches (in)</strong>. Please measure your child's comfortable clothing or body dimensions before selecting your size.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs mb-4">
              <table className="w-full text-xs text-left divide-y divide-gray-200">
                <thead className="bg-teal-900 text-white font-extrabold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Size / Tag</th>
                    <th className="py-3 px-3">Chest (in)</th>
                    <th className="py-3 px-3">Length (in)</th>
                    <th className="py-3 px-3">Sleeve (in)</th>
                    <th className="py-3 px-3">Waist (in)</th>
                    <th className="py-3 px-3">Shoulder (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                  {(
                    selectedProduct.sizeChart?.rows && selectedProduct.sizeChart.rows.length > 0
                      ? selectedProduct.sizeChart.rows
                      : [
                          { size: '24 (Age 3-4)', chest: '26"', length: '16"', sleeve: '12"', waist: '22"', shoulder: '11"' },
                          { size: '26 (Age 5-6)', chest: '28"', length: '18"', sleeve: '13"', waist: '24"', shoulder: '12"' },
                          { size: '28 (Age 7-8)', chest: '30"', length: '20"', sleeve: '14.5"', waist: '26"', shoulder: '13"' },
                          { size: '30 (Age 9-10)', chest: '32"', length: '22"', sleeve: '16"', waist: '28"', shoulder: '14"' },
                          { size: '32 (Age 11-12)', chest: '34"', length: '24"', sleeve: '17.5"', waist: '30"', shoulder: '15"' },
                          { size: '34 (Age 13-14)', chest: '36"', length: '26"', sleeve: '19"', waist: '32"', shoulder: '16"' },
                          { size: '36 / S', chest: '38"', length: '27.5"', sleeve: '20.5"', waist: '34"', shoulder: '17"' },
                          { size: '38 / M', chest: '40"', length: '29"', sleeve: '22"', waist: '36"', shoulder: '18"' },
                          { size: '40 / L', chest: '42"', length: '30"', sleeve: '23"', waist: '38"', shoulder: '19"' }
                        ]
                  ).map((row, idx) => (
                    <tr key={idx} className="hover:bg-teal-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-extrabold text-teal-950 bg-gray-50">{row.size}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">{row.chest || 'N/A'}</td>
                      <td className="py-2.5 px-3 font-mono">{row.length || 'N/A'}</td>
                      <td className="py-2.5 px-3 font-mono">{row.sleeve || 'N/A'}</td>
                      <td className="py-2.5 px-3 font-mono">{row.waist || 'N/A'}</td>
                      <td className="py-2.5 px-3 font-mono">{row.shoulder || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-extrabold block">💡 Measuring Tips:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                <li><strong>Chest:</strong> Measure around the fullest part of the chest, under the arms.</li>
                <li><strong>Length:</strong> Measure from the top shoulder seam down to the bottom shirt hem.</li>
                <li><strong>Waist:</strong> Measure around the natural waistline where school trousers/skirts sit.</li>
              </ul>
            </div>

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setShowSizeChartModal(false)}
                className="px-5 py-2.5 bg-brand-teal text-white font-extrabold rounded-xl text-xs hover:bg-brand-teal-light transition-all cursor-pointer shadow-xs"
              >
                Close Size Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
