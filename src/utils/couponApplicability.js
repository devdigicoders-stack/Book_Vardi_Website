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
export const isCouponApplicableToProduct = (coupon, product) => {
  if (!coupon || !product) return false;

  // 1. Status Check: Must be active if status field exists
  if (coupon.status && coupon.status !== 'active' && coupon.status !== 'Active') return false;

  // 2. Expiry Check: Must not be past expiry date
  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate);
    const now = new Date();
    if (!isNaN(expiry.getTime()) && expiry < now) {
      return false;
    }
  }

  // 3. Price threshold check for single product context
  const minVal = Number(coupon.minOrderValue || coupon.minOrderAmount || coupon.minAmount || coupon.minPurchase || 0);
  const prodPrice = Number(product.price || product.discountPrice || product.sellingPrice || 0);
  if (minVal > 0 && prodPrice > 0 && prodPrice < minVal) {
    return false;
  }

  // 4. Extract target IDs from coupon
  const isSellerScoped = Boolean(coupon.createdRole === 'seller' || coupon.sellerId || coupon.storeId);
  const targetSellerId = coupon.sellerId ? String(coupon.sellerId) : (coupon.storeId ? String(coupon.storeId) : null);
  const applicableProds = (coupon.applicableProducts || coupon.specificProducts || []).map((p) => String(p));
  if (coupon.specificProductId) {
    applicableProds.push(String(coupon.specificProductId));
  }

  // 5. Extract IDs from product
  const prodSellerId = product.sellerId
    ? String(product.sellerId)
    : product.seller
    ? String(product.seller)
    : product.storeId
    ? String(product.storeId)
    : null;
    
  const prodId = product.id
    ? String(product.id)
    : product._id
    ? String(product._id)
    : product.productId
    ? String(product.productId)
    : null;

  // 6. Seller Scoped Coupon Logic
  if (isSellerScoped) {
    // If seller ID target exists on coupon and product has seller ID, they must match
    if (targetSellerId && prodSellerId && targetSellerId !== prodSellerId) {
      return false;
    }
    // If specific products array is specified on seller coupon, product ID must match
    if (applicableProds.length > 0) {
      return prodId ? applicableProds.includes(prodId) : false;
    }
    return true;
  }

  // 7. Admin Scoped Coupon Logic
  if (applicableProds.length > 0) {
    return prodId ? applicableProds.includes(prodId) : false;
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
