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
  Ticket
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { ALL_PRODUCTS, KIT_BUNDLES } from '../../data/mockData';
import GrabKitSection from './GrabKitSection';

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
  const productGallery = Array.isArray(product?.images) ? product.images : [];
  const categoryGallery = CATEGORY_GALLERY_MAP[product?.category] || [];
  const gallery = [product?.image, ...productGallery, ...categoryGallery].filter(Boolean);
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
    userProfile,
    showToast,
    cartItems
  } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'details' | 'delivery'
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedBundleItems, setSelectedBundleItems] = useState([]);

  // Review Form State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState(userProfile?.name || 'Ritesh Yadav');
  const [reviewerInstitution, setReviewerInstitution] = useState(userProfile?.institution || 'DTU Delhi');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const scrollRef = useRef(null);

  // Sync user name when userProfile changes
  useEffect(() => {
    if (userProfile?.name) {
      setReviewerName(userProfile.name);
    }
    if (userProfile?.institution) {
      setReviewerInstitution(userProfile.institution);
    }
  }, [userProfile]);

  // Reset quantity and scroll position when product changes
  const productGallery = getProductGallery(selectedProduct);

  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
      setShowReviewForm(false);
      setActiveImageIndex(0);
      window.scrollTo(0, 0);
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
  const reviewsList = productReviews[selectedProduct.id] || [
    {
      id: 991,
      name: 'Ananya Deshmukh',
      institution: 'Delhi University',
      rating: 5,
      date: '3 days ago',
      title: 'Top-tier academic stationery!',
      comment: 'Really satisfied with the quality. Exceeded expectations for daily college work.',
      helpfulCount: 18
    },
    {
      id: 992,
      name: 'Kabir Singhania',
      institution: 'DPS R.K. Puram',
      rating: 5,
      date: '1 week ago',
      title: 'Durable and great value',
      comment: 'Very reliable for regular school sessions and revision. Value for money.',
      helpfulCount: 9
    }
  ];

  const averageRating = (
    reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length
  ).toFixed(1);

  // Recommendation products (exclude current)
  const moreInKit = ALL_PRODUCTS.filter(
    (p) => p.id !== selectedProduct.id && p.category !== selectedProduct.category
  ).slice(0, 6);

  const similarProducts = ALL_PRODUCTS.filter(
    (p) => p.id !== selectedProduct.id && p.category === selectedProduct.category
  ).slice(0, 6);

  const helpfulProducts = ALL_PRODUCTS.filter(
    (p) => p.id !== selectedProduct.id && p.rating >= 4.8
  ).slice(0, 6);

  const recommendedKits = KIT_BUNDLES
    .filter((kit) => kit.id !== selectedProduct.id)
    .sort((firstKit, secondKit) => {
      const firstMatch = firstKit.school === selectedProduct.school || firstKit.className === selectedProduct.className;
      const secondMatch = secondKit.school === selectedProduct.school || secondKit.className === selectedProduct.className;
      return Number(secondMatch) - Number(firstMatch);
    })
    .slice(0, 6);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) {
      showToast('⚠️ Please provide both a title and review comment');
      return;
    }

    addProductReview(selectedProduct.id, {
      name: reviewerName.trim() || 'Verified Student',
      institution: reviewerInstitution.trim() || 'Student',
      rating: newRating,
      title: reviewTitle.trim(),
      comment: reviewComment.trim()
    });

    setReviewTitle('');
    setReviewComment('');
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
      addToCart(selectedProduct, quantity);
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
          {items.map((rec) => (
            <div
              key={rec.id}
              onClick={() => openProductDetails(rec)}
              className="min-w-[160px] sm:min-w-[180px] shrink-0 snap-start p-3 rounded-2xl border border-gray-200 bg-white hover:border-brand-teal/30 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative w-full pt-[75%] rounded-xl overflow-hidden bg-gray-50 mb-3">
                  <img
                    src={rec.image}
                    alt={rec.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/gel-pen-set.jpg';
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

              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                <span className="font-display font-extrabold text-xs text-brand-teal">
                  ₹{rec.price}
                </span>
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
          ))}
        </div>
      </div>
    );
  };

  // Specifications metadata generator
  const getProductSpecs = () => {
    const cat = selectedProduct.category || '';
    if (cat === 'notebooks') {
      return [
        { label: 'Paper Quality', value: '100 GSM Acid-Free Archival Paper' },
        { label: 'Ruling / Layout', value: '7mm Ruled Lines with Date Margin' },
        { label: 'Page Count', value: '160 Pages (80 Micro-Perforated Sheets)' },
        { label: 'Binding Type', value: 'Twin-Wire 360° Lay-Flat Spiral' },
        { label: 'Cover Material', value: 'Water-Resistant Frosted Polypropylene' },
        { label: 'Dimensions', value: 'A5 Standard (148 × 210 mm)' },
        { label: 'Country of Origin', value: 'India' }
      ];
    }
    if (cat === 'pens') {
      return [
        { label: 'Tip Size', value: '0.5mm Precision Needle / Chisel Tip' },
        { label: 'Ink Formula', value: 'Japanese Quick-Dry Pigment (Smudge-Proof)' },
        { label: 'Barrel Grip', value: 'Ergonomic Matte Soft-Touch Rubber' },
        { label: 'Refillable', value: 'Yes (Standard Universal Refills)' },
        { label: 'Water Resistant', value: 'Yes (Highlighter Safe After 3 Sec)' },
        { label: 'Country of Origin', value: 'India' }
      ];
    }
    return [
      { label: 'Material', value: 'Eco-Friendly High-Grade Recycled Material' },
      { label: 'Warranty', value: '6 Months Student Durability Warranty' },
      { label: 'Finish', value: 'Matte Scratch-Resistant Surface' },
      { label: 'Safety', value: 'Non-Toxic, BPA Free, Safe for Children' },
      { label: 'Country of Origin', value: 'India' }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6">
      <div className="container mx-auto max-w-5xl px-4">
        
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={goBack}
            className="text-xs font-bold text-gray-500 hover:text-brand-teal transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <X size={14} className="rotate-45" /> {/* Just using X or ArrowLeft if imported */}
            <span>Back to Products</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal">
                {selectedProduct.category}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>In Stock</span>
              </span>
            </div>
          </div>

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
                    onClick={() => toggleWishlist(selectedProduct.id)}
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
                    src={productGallery[activeImageIndex] || selectedProduct.image || FALLBACK_IMAGE}
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
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative overflow-hidden rounded-xl border transition-all cursor-pointer ${
                        activeImageIndex === index
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

                {/* Student Confidence Badges */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
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
                  <span className="text-xs font-extrabold uppercase tracking-widest text-brand-ochre">
                    BOOK VARDI ACADEMIC ESSENTIALS
                  </span>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-teal mt-1 leading-tight">
                    {selectedProduct.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
                    {selectedProduct.subtitle}
                  </p>
                  {selectedProduct.category === 'kits' && (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-full">
                        {selectedProduct.school || 'Any School'}
                      </span>
                      <span className="text-[11px] font-bold text-brand-pink bg-brand-pink/10 px-2.5 py-1 rounded-full">
                        {selectedProduct.className || 'All Classes'}
                      </span>
                      <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        {selectedProduct.kitItems?.length || 0} products in bundle
                      </span>
                    </div>
                  )}

                  {/* Rating summary */}
                  <div className="flex items-center gap-2.5 mt-3 text-xs">
                    <div className="flex items-center gap-1 text-brand-ochre font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      <Star size={13} fill="currentColor" />
                      <span>{averageRating}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 font-medium">
                      {reviewsList.length} Verified Student Reviews
                    </span>
                  </div>
                </div>

                {/* Price & Savings */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-amber-50/30 border border-gray-200/80">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-3xl font-extrabold text-brand-teal">
                      ₹{selectedProduct.price}
                    </span>
                    {selectedProduct.originalPrice && (
                      <span className="text-base text-gray-400 line-through">
                        ₹{selectedProduct.originalPrice}
                      </span>
                    )}
                    {selectedProduct.originalPrice && (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-md">
                        Save ₹{selectedProduct.originalPrice - selectedProduct.price}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Inclusive of all taxes. Free student delivery qualifies at ₹499.
                  </p>
                </div>

                {selectedProduct.category === 'kits' && selectedProduct.kitItems && (
                  <div className="rounded-2xl border border-brand-teal/20 bg-brand-teal/5 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-brand-teal">Build Your Bundle</span>
                      <span className="text-[11px] font-bold text-gray-600">₹{bundleTotal || selectedProduct.price}</span>
                    </div>
                    <div className="space-y-2">
                      {selectedProduct.kitItems.map((item) => {
                        const isChecked = selectedBundleItems.includes(item.id);
                        return (
                          <button
                            key={item.id}
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

                {/* Quantity Stepper & Subtotal */}
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
                      ₹{selectedProduct.price * quantity}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => addToCart(selectedProduct, quantity)}
                    className="inline-flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <ShoppingCart size={16} />
                    <span>
                      Add {quantity > 1 ? `${quantity} Items` : 'to Cart'}
                      {countInCart > 0 && ` (${countInCart})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 hover:shadow-md"
                  >
                    <Zap size={16} />
                    <span>Buy Now</span>
                  </button>
                </div>

                {/* Student Perks Note */}
                <div className="text-xs text-gray-500 bg-brand-teal/5 border border-brand-teal/15 p-3 rounded-xl flex items-start gap-2">
                  <Sparkles size={15} className="text-brand-ochre shrink-0 mt-0.5" />
                  <span>
                    Earn <strong>{Math.round(selectedProduct.price / 10)} Reward Points</strong> on this order for student stationary perks.
                  </span>
                </div>
              </div>
            </div>

            {/* OFFERS & COUPONS SECTION */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <Tag size={14} className="text-brand-pink" />
                Available Offers & Coupons
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Offer 1 */}
                <div className="bg-brand-pink/5 border border-brand-pink/20 rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-brand-pink/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-extrabold">%</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-teal">Get 10% Off</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 mb-1.5">On orders above ₹500</p>
                    <div className="inline-flex items-center gap-1.5 bg-white border border-dashed border-brand-pink/40 px-2 py-0.5 rounded text-[10px] font-bold text-brand-pink uppercase tracking-wider">
                      <span>STUDENT10</span>
                      <button className="ml-1 text-gray-400 hover:text-brand-teal cursor-pointer">Copy</button>
                    </div>
                  </div>
                </div>

                {/* Offer 2 */}
                <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-brand-teal/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-brand-teal text-brand-yellow flex items-center justify-center shrink-0">
                    <Ticket size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-teal">Free Shipping</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 mb-1.5">No minimum order value</p>
                    <div className="inline-flex items-center gap-1.5 bg-white border border-dashed border-brand-teal/40 px-2 py-0.5 rounded text-[10px] font-bold text-brand-teal uppercase tracking-wider">
                      <span>FREESHIP</span>
                      <button className="ml-1 text-gray-400 hover:text-brand-teal cursor-pointer">Copy</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SPECIFICATIONS & EXTRA DETAILS SECTION */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider relative cursor-pointer ${
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
                  className={`pb-2 text-xs font-bold uppercase tracking-wider relative cursor-pointer ${
                    activeTab === 'details' ? 'text-brand-teal font-extrabold' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <span>Student Highlights</span>
                  {activeTab === 'details' && (
                    <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-brand-teal rounded-full" />
                  )}
                </button>
              </div>

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
                    <span>Student Reviews & Ratings</span>
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
                        fill={i < Math.round(Number(averageRating)) ? 'currentColor' : 'none'}
                        stroke="currentColor"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    Based on {reviewsList.length} student reviews
                  </span>
                  <span className="text-[11px] font-bold text-green-700 mt-1">
                    98% of students recommend this
                  </span>
                </div>

                {/* Star distribution bars */}
                <div className="sm:col-span-8 space-y-1.5 flex flex-col justify-center text-xs">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const matchCount = reviewsList.filter((r) => r.rating === stars).length;
                    const pct = Math.round((matchCount / reviewsList.length) * 100) || (stars === 5 ? 85 : stars === 4 ? 12 : 3);
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
                      Share Your Student Experience
                    </h4>
                    <span className="text-[11px] text-gray-500">All fields required</span>
                  </div>

                  {/* Rating selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Your Overall Rating
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="e.g. Ritesh Yadav"
                        required
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-teal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        School / College / Course
                      </label>
                      <input
                        type="text"
                        value={reviewerInstitution}
                        onChange={(e) => setReviewerInstitution(e.target.value)}
                        placeholder="e.g. Delhi Technological University"
                        required
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-teal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Review Headline
                    </label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="e.g. Perfect for exam revision notes!"
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Detailed Student Review
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Tell other students how this stationery performs (paper quality, ink smoothness, durability)..."
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-teal"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      className="bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Submit Student Review
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
              <div className="space-y-4">
                {reviewsList.map((review) => (
                  <div
                    key={review.id}
                    className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-brand-teal/30 hover:shadow-xs transition-all space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal font-extrabold text-xs flex items-center justify-center">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-gray-900">{review.name}</span>
                            <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.2 rounded-full border border-green-200">
                              Verified Student
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 block">{review.institution}</span>
                        </div>
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

                    <h4 className="text-xs font-bold text-gray-900 mt-1">
                      {review.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {review.comment}
                    </p>

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
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
