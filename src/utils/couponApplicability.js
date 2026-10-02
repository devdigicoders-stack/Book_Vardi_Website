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

  // 2. Expiry Check: Must not be past expiry date (with end-of-day allowance for date strings)
  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate);
    if (!isNaN(expiry.getTime())) {
      if (typeof coupon.expiryDate === 'string' && !coupon.expiryDate.includes('T')) {
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
    if (specId) applicableProds.push(specId);
  }

  // 5. Extract IDs from product
  const prodSellerId = extractId(product.sellerId) || extractId(product.seller) || extractId(product.storeId) || extractId(product.userId);
  const cleanProdId = extractId(product.id) || extractId(product._id) || extractId(product.productId);

  // 6. Seller Scoped Coupon Logic
  if (isSellerScoped) {
    // If seller ID target exists on coupon and product has seller ID, they must match
    if (targetSellerId && prodSellerId && targetSellerId !== prodSellerId) {
      return false;
    }
    // If specific products array is specified on seller coupon, product ID must match
    if (applicableProds.length > 0) {
      return cleanProdId ? applicableProds.includes(cleanProdId) : false;
    }
    return true;
  }

  // 7. Admin Scoped Coupon Logic
  if (applicableProds.length > 0) {
    return cleanProdId ? applicableProds.includes(cleanProdId) : false;
  }

  // Admin store-wide coupon (applies to all products)
  return true;
};

/**
 * Determines whether a coupon is applicable to at least one product in a cart/list of items.
 *
 * @param {Object} coupon - The coupon object
 * @param {Array} cartItems - Array of cart item objects
 * @param {number} cartTotal - Total amount of items in cart
 * @returns {boolean} True if applicable to at least one item and meets threshold, false otherwise
 */
export const isCouponApplicableToCart = (coupon, cartItems = [], cartTotal = 0) => {
  if (!coupon || !Array.isArray(cartItems) || cartItems.length === 0) return false;

  const minVal = Number(coupon.minOrderValue || coupon.minOrderAmount || coupon.minAmount || coupon.minPurchase || 0);
  if (minVal > 0 && cartTotal > 0 && cartTotal < minVal) {
    return false;
  }

  return cartItems.some((item) => isCouponApplicableToProduct(coupon, item));
};

/**
 * Calculates the exact discount amount for a coupon applied to a product price or subtotal.
 * Enforces minAmount threshold and caps discount at maxDiscount if maxDiscount is specified.
 *
 * @param {Object} coupon - The coupon object
 * @param {number} subtotal - Price of product or subtotal of eligible items
 * @returns {number} Calculated discount amount restricted to maxDiscount boundary
 */
export const calculateCouponDiscount = (coupon, subtotal) => {
  const amt = Number(subtotal || 0);
  if (!coupon || isNaN(amt) || amt <= 0) return 0;

  const minVal = Number(coupon.minOrderValue || coupon.minOrderAmount || coupon.minAmount || coupon.minPurchase || 0);
  if (minVal > 0 && amt < minVal) return 0;

  const isPercent = coupon.discountType === 'percentage' || coupon.type === 'percentage' || coupon.type === 'percent';
  const discVal = Number(coupon.discountValue ?? coupon.discount ?? coupon.value ?? 0);
  let discountAmt = 0;

  if (isPercent) {
    discountAmt = Math.round(((amt * discVal) / 100) * 100) / 100;
  } else {
    discountAmt = Math.min(amt, discVal);
  }

  const maxCap = Number(coupon.maxDiscount || coupon.maxDiscountAmount || coupon.maxCap || 0);
  if (maxCap > 0 && discountAmt > maxCap) {
    discountAmt = maxCap;
  }

  return Math.max(0, discountAmt);
};
