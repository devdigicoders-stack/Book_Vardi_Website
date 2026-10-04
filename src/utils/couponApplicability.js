/**
 * Coupon Applicability Utility
 * Validates whether a coupon/promotion is eligible for a specific product or cart.
 */

/**
 * Determines whether a coupon is applicable to a given product.
 *
 * @param {Object} coupon - The coupon object (from backend DB or promotions context)
 * @param {Object} product - The product object
 * @returns {boolean} True if coupon can be applied to product, false otherwise
 */
export const isCouponApplicableToProduct = (coupon, product, options = {}) => {
  if (!coupon || !product) return false;

  // 1. Status Check: Must be active if status field exists
  if (coupon.status && String(coupon.status).toLowerCase() !== 'active') return false;

  // 1b. Usage Limit Check: Must not have reached maximum redemptions limit
  const uLimit = Number(coupon.usageLimit ?? coupon.limit ?? coupon.maxRedemptions ?? 0);
  const uCount = Number(coupon.usageCount || 0);
  if (uLimit > 0 && uCount >= uLimit) return false;

  // 2. Expiry Check: Must not be past expiry date (with end-of-day allowance for date strings)
  const rawExp = coupon.expiryDate || coupon.validUntil || coupon.validTo || coupon.endDate || coupon.expiry;
  if (rawExp) {
    const expiry = new Date(rawExp);
    if (!isNaN(expiry.getTime())) {
      if (typeof rawExp === 'string' && !rawExp.includes('T')) {
        expiry.setHours(23, 59, 59, 999);
      }
      if (expiry < new Date()) {
        return false;
      }
    }
  }

  // 3. Optional strict price threshold (off by default so product detail page displays available promos)
  if (options.requirePriceAboveMin) {
    const minVal = Number(coupon.minOrderValue || coupon.minOrderAmount || coupon.minAmount || coupon.minPurchase || 0);
    const prodPrice = Number(product.price || product.discountPrice || product.sellingPrice || 0);
    if (minVal > 0 && prodPrice > 0 && prodPrice < minVal) {
      return false;
    }
  }

  const extractId = (val) => {
    if (!val) return null;
    if (typeof val === 'object') {
      return String(val._id || val.id || val.$oid || '').toLowerCase().trim();
    }
    return String(val).toLowerCase().trim();
  };

  // 4. Extract target IDs from coupon
  const targetSellerId = extractId(coupon.sellerId) || extractId(coupon.storeId);
  const isSellerScoped = Boolean(coupon.createdRole === 'seller' || targetSellerId);
  const applicableProds = (coupon.applicableProducts || coupon.specificProducts || [])
    .map((p) => extractId(p))
    .filter(Boolean);
  if (coupon.specificProductId) {
    const specId = extractId(coupon.specificProductId);
    if (specId && !applicableProds.includes(specId)) applicableProds.push(specId);
  }

  const applicableKits = (coupon.applicableKits || coupon.specificKits || [])
    .map((k) => extractId(k))
    .filter(Boolean);
  if (coupon.specificKitId) {
    const specKitId = extractId(coupon.specificKitId);
    if (specKitId && !applicableKits.includes(specKitId)) applicableKits.push(specKitId);
  }

  // 5. Extract IDs from product
  const prodSellerId = extractId(product.sellerId) || extractId(product.seller) || extractId(product.storeId) || extractId(product.userId);
  const cleanProdId = extractId(product.id) || extractId(product._id) || extractId(product.productId);
  const cleanKitId = extractId(product.kitId) || extractId(product.bundleId) || extractId(product.id) || extractId(product._id);
  const isKit = Boolean(product.isKit || product.category === 'kits' || product.bundleType === 'kit' || product.kitId);
  const isCustomized = Boolean(product.isCustomized || (product.name && product.name.includes('(Custom Bundle)')));
  const scope = coupon.applicableScope || 'storewide';

  // 6. Seller Scoped Coupon Logic: Seller coupons apply ONLY to items from that seller
  if (isSellerScoped) {
    if (targetSellerId && prodSellerId && targetSellerId !== prodSellerId) {
      return false;
    }
  }

  // 7. Scope-based evaluation
  if (scope === 'all_kits') {
    if (!isKit) return false;
    if (isCustomized) return false;
    return true;
  }

  if (scope === 'specific_kit') {
    if (!isKit) return false;
    if (isCustomized) return false;
    if (applicableKits.length === 0) return true;
    return applicableKits.some((k) => k === cleanKitId || (cleanProdId && k === cleanProdId));
  }

  if (scope === 'specific_product') {
    if (isKit) return false;
    if (applicableProds.length === 0) return true;
    return cleanProdId ? applicableProds.includes(cleanProdId) : false;
  }

  // Fallback for specified products/kits arrays
  if (applicableProds.length > 0) {
    const prodMatch = cleanProdId ? applicableProds.includes(cleanProdId) : false;
    if (prodMatch) return true;
    if (applicableKits.length > 0 && isKit && !isCustomized) {
      return applicableKits.includes(cleanKitId);
    }
    return false;
  }

  if (applicableKits.length > 0) {
    if (!isKit || isCustomized) return false;
    return applicableKits.includes(cleanKitId);
  }

  // Global storewide coupon (applies to all products/kits matching seller scope if seller-created)
  return true;
};

/**
 * Calculates the total subtotal of ONLY items eligible for the given coupon.
 *
 * @param {Object} coupon - The coupon object
 * @param {Array} cartItems - Array of cart item objects
 * @returns {number} Subtotal of eligible items
 */
export const calculateEligibleSubtotal = (coupon, cartItems = []) => {
  if (!coupon || !Array.isArray(cartItems) || cartItems.length === 0) return 0;

  const extractId = (val) => {
    if (!val) return null;
    if (typeof val === 'object') {
      return String(val._id || val.id || val.$oid || '').toLowerCase().trim();
    }
    return String(val).toLowerCase().trim();
  };

  const targetSellerId = extractId(coupon.sellerId) || extractId(coupon.storeId);
  const isSellerScoped = Boolean(coupon.createdRole === 'seller' || targetSellerId);
  const scope = coupon.applicableScope || 'storewide';

  const applicableProds = (coupon.applicableProducts || coupon.specificProducts || [])
    .concat(coupon.specificProductId ? [coupon.specificProductId] : [])
    .map((p) => extractId(p))
    .filter(Boolean);

  const applicableKits = (coupon.applicableKits || [])
    .concat(coupon.specificKitId ? [coupon.specificKitId] : [])
    .map((k) => extractId(k))
    .filter(Boolean);

  const eligibleItems = cartItems.filter((item) => {
    const itemSellerId = extractId(item.sellerId) || extractId(item.seller) || extractId(item.storeId) || extractId(item.userId);
    const itemProductId = extractId(item.id) || extractId(item._id) || extractId(item.productId);
    const itemKitId = extractId(item.kitId) || extractId(item.bundleId) || extractId(item.id) || extractId(item._id);
    const isKit = Boolean(item.isKit || item.category === 'kits' || item.bundleType === 'kit' || item.kitId);
    const isCustomized = Boolean(item.isCustomized || (item.name && item.name.includes('(Custom Bundle)')));

    if (isSellerScoped && targetSellerId && itemSellerId && targetSellerId !== itemSellerId) {
      return false;
    }

    if (scope === 'all_kits') {
      if (!isKit) return false;
      if (isCustomized) return false;
      return true;
    }

    if (scope === 'specific_kit') {
      if (!isKit) return false;
      if (isCustomized) return false;
      if (applicableKits.length === 0) return true;
      return applicableKits.some((k) => k === itemKitId || (itemProductId && k === itemProductId));
    }

    if (scope === 'specific_product') {
      if (isKit) return false;
      if (applicableProds.length === 0) return true;
      return itemProductId ? applicableProds.includes(itemProductId) : false;
    }

    if (applicableProds.length > 0) {
      const prodMatch = itemProductId ? applicableProds.includes(itemProductId) : false;
      if (prodMatch) return true;
      if (applicableKits.length > 0 && isKit && !isCustomized) {
        return applicableKits.includes(itemKitId);
      }
      return false;
    }

    if (applicableKits.length > 0) {
      if (!isKit || isCustomized) return false;
      return applicableKits.includes(itemKitId);
    }

    return true;
  });

  return eligibleItems.reduce((sum, item) => {
    const price = Number(item.price ?? item.sellingPrice ?? item.discountPrice ?? item.unitPrice ?? 0);
    const qty = Number(item.quantity ?? item.qty ?? 1);
    return sum + (price * qty);
  }, 0);
};

/**
 * Determines whether a coupon is applicable to at least one product in a cart/list of items.
 *
 * @param {Object} coupon - The coupon object
 * @param {Array} cartItems - Array of cart item objects
 * @returns {boolean} True if applicable to at least one item and meets min threshold on eligible subtotal
 */
export const isCouponApplicableToCart = (coupon, cartItems = []) => {
  if (!coupon || !Array.isArray(cartItems) || cartItems.length === 0) return false;

  const uLimit = Number(coupon.usageLimit || 0);
  const uCount = Number(coupon.usageCount || 0);
  if (uLimit > 0 && uCount >= uLimit) return false;

  const eligibleSubtotal = calculateEligibleSubtotal(coupon, cartItems);
  const minVal = Number(coupon.minOrderValue || coupon.minOrderAmount || coupon.minAmount || coupon.minPurchase || 0);
  if (minVal > 0 && eligibleSubtotal < minVal) {
    return false;
  }

  return cartItems.some((item) => isCouponApplicableToProduct(coupon, item));
};

/**
 * Calculates the exact discount amount for a coupon applied to eligible items or subtotal.
 *
 * @param {Object} coupon - The coupon object
 * @param {number|Array} subtotalOrItems - Price/subtotal or array of cart items
 * @returns {number} Calculated discount amount restricted to maxDiscount boundary
 */
export const calculateCouponDiscount = (coupon, subtotalOrItems) => {
  if (!coupon) return 0;

  let amt = 0;
  if (Array.isArray(subtotalOrItems)) {
    amt = calculateEligibleSubtotal(coupon, subtotalOrItems);
  } else {
    amt = Number(subtotalOrItems || 0);
  }

  if (isNaN(amt) || amt <= 0) return 0;

  const minVal = Number(coupon.minOrderValue || coupon.minOrderAmount || coupon.minAmount || coupon.minPurchase || 0);
  if (minVal > 0 && amt < minVal) return 0;

  const isPercent = (
    coupon.type === 'percentage' ||
    coupon.type === 'percent' ||
    coupon.discountType === 'percentage' ||
    coupon.discountType === 'percent'
  );
  const discVal = Number(coupon.discountValue ?? coupon.discount ?? coupon.value ?? 0);
  let discountAmt = 0;

  if (isPercent) {
    discountAmt = Math.round(((amt * discVal) / 100) * 100) / 100;
  } else {
    discountAmt = Math.min(amt, discVal);
  }

  const maxCap = Number(coupon.maxDiscount || coupon.maxDiscountAmount || coupon.maxCap || coupon.max_discount || 0);
  if (maxCap > 0 && discountAmt > maxCap) {
    discountAmt = maxCap;
  }

  return Math.max(0, discountAmt);
};

/**
 * Calculates comprehensive discount details including capping and eligible subtotal.
 *
 * @param {Object} coupon - The coupon object
 * @param {number|Array} subtotalOrItems - Price/subtotal or array of cart items
 * @returns {Object} { eligibleSubtotal, discountAmount, isCapped, maxDiscount, originalDiscount, meetsMinPurchase }
 */
export const getCouponDiscountDetails = (coupon, subtotalOrItems) => {
  if (!coupon) {
    return { eligibleSubtotal: 0, discountAmount: 0, isCapped: false, maxDiscount: 0, originalDiscount: 0, meetsMinPurchase: false };
  }

  let amt = 0;
  if (Array.isArray(subtotalOrItems)) {
    amt = calculateEligibleSubtotal(coupon, subtotalOrItems);
  } else {
    amt = Number(subtotalOrItems || 0);
  }

  const minVal = Number(coupon.minOrderValue || coupon.minOrderAmount || coupon.minAmount || coupon.minPurchase || 0);
  const meetsMinPurchase = minVal <= 0 || amt >= minVal;

  if (isNaN(amt) || amt <= 0 || !meetsMinPurchase) {
    return { eligibleSubtotal: amt, discountAmount: 0, isCapped: false, maxDiscount: 0, originalDiscount: 0, meetsMinPurchase };
  }

  const isPercent = (
    coupon.type === 'percentage' ||
    coupon.type === 'percent' ||
    coupon.discountType === 'percentage' ||
    coupon.discountType === 'percent'
  );
  const discVal = Number(coupon.discountValue ?? coupon.discount ?? coupon.value ?? 0);
  let originalDiscount = 0;

  if (isPercent) {
    originalDiscount = Math.round(((amt * discVal) / 100) * 100) / 100;
  } else {
    originalDiscount = Math.min(amt, discVal);
  }

  let discountAmount = originalDiscount;
  let isCapped = false;
  const maxCap = Number(coupon.maxDiscount || coupon.maxDiscountAmount || coupon.maxCap || coupon.max_discount || 0);

  if (maxCap > 0 && discountAmount > maxCap) {
    discountAmount = maxCap;
    isCapped = true;
  }

  return {
    eligibleSubtotal: amt,
    discountAmount: Math.max(0, discountAmount),
    isCapped,
    maxDiscount: maxCap,
    originalDiscount,
    meetsMinPurchase: true
  };
};
