import axios from 'axios';

const fallbackBaseUrl = 'http://localhost:5000/api';
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl;
const apiBaseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/+$/, '');
export const API_BASE_URL = apiBaseUrl;
export const backendEnabled = import.meta.env.VITE_USE_BACKEND !== 'false';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export function parseSizeVariants(product) {
  if (!product) return [];
  let raw = product.sizeVariants ?? product.variants ?? product.size_variants ?? product.sizes;
  let parsed = [];

  if (raw) {
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        if (raw.includes(',')) {
          raw = raw.split(',').map(s => s.trim()).filter(Boolean);
        } else if (raw.trim()) {
          raw = [raw.trim()];
        } else {
          raw = [];
        }
      }
    }

    if (Array.isArray(raw)) {
      parsed = raw.map((v, idx) => {
        if (typeof v === 'string') {
          return {
            id: `var_${idx}_${v}`,
            size: v,
            measureScale: 'size',
            measureValue: v,
            price: Number(product?.price || 0),
            mrp: Number(product?.mrp || product?.originalPrice || 0),
            stock: Number(product?.stockQuantity ?? product?.stock ?? 0),
            stockQuantity: Number(product?.stockQuantity ?? product?.stock ?? 0),
            sku: product?.sku ? `${product.sku}-${v}` : `SKU-${idx + 1}`,
            image: product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || '',
            images: Array.isArray(product?.images) && product.images.length > 0 ? product.images : (product?.image ? [product.image] : [])
          };
        }

        if (typeof v === 'object' && v !== null) {
          const rawImage = v.image || v.imageUrl || v.photo || v.url || (Array.isArray(v.images) && v.images[0]) || product?.image || (Array.isArray(product?.images) && product.images[0]) || '';
          let rawImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (rawImage ? [rawImage] : []);
          if (typeof rawImages === 'string') {
            try { rawImages = JSON.parse(rawImages); } catch { rawImages = [rawImages]; }
          }

          const sizeVal = String(v.size || v.measureValue || v.name || v.label || v.title || `Variant #${idx + 1}`);
          const priceVal = (v.price !== undefined && v.price !== null && !isNaN(Number(v.price)) && Number(v.price) >= 0)
            ? Number(v.price)
            : Number(product?.price || 0);

          const rawMrp = v.mrp ?? v.originalPrice ?? v.regularPrice ?? v.marketPrice;
          const mrpVal = (rawMrp !== undefined && rawMrp !== null && !isNaN(Number(rawMrp)) && Number(rawMrp) >= 0)
            ? Number(rawMrp)
            : (priceVal > 0 ? Math.round(priceVal * 1.25) : Number(product?.mrp || product?.originalPrice || 0));

          const stockVal = v.stock !== undefined ? Number(v.stock) : (v.stockQuantity !== undefined ? Number(v.stockQuantity) : Number(product?.stockQuantity ?? product?.stock ?? 0));

          return {
            ...v,
            id: v.id || v._id || `var_${idx}_${sizeVal}`,
            size: sizeVal,
            measureValue: sizeVal,
            measureScale: v.measureScale || v.scale || v.scaleUnit || 'size',
            price: priceVal,
            mrp: mrpVal,
            originalPrice: mrpVal,
            stock: stockVal,
            stockQuantity: stockVal,
            sku: v.sku || (product?.sku ? `${product.sku}-${sizeVal}` : `SKU-VAR-${idx + 1}`),
            image: rawImage,
            images: rawImages
          };
        }

        return null;
      }).filter(Boolean);
    }
  }

  // Prepend Base Product if product has variants and base price > 0, and base variant is not already present
  if (parsed.length > 0 && Number(product?.price || 0) > 0) {
    const hasBaseVariant = parsed.some(v => v.isBase || String(v.size || '').toLowerCase().includes('base'));
    if (!hasBaseVariant) {
      const baseMrp = Number(product.mrp || product.originalPrice || product.regularPrice || product.price || 0);
      const baseOption = {
        id: `base_option_${product._id || product.id || '0'}`,
        size: 'Base Product',
        measureScale: product.unit || 'unit',
        measureValue: 'Base Product',
        price: Number(product.price || 0),
        mrp: baseMrp > Number(product.price || 0) ? baseMrp : Number(product.price || 0),
        originalPrice: baseMrp > Number(product.price || 0) ? baseMrp : Number(product.price || 0),
        stock: Number(product.stockQuantity ?? product.stock ?? 0),
        stockQuantity: Number(product.stockQuantity ?? product.stock ?? 0),
        sku: product.sku || `SKU-BASE-${String(product._id || product.id || '').slice(-6).toUpperCase()}`,
        image: product.image || product.imageUrl || (Array.isArray(product.images) ? product.images[0] : '') || '',
        images: Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
        isBase: true
      };
      parsed = [baseOption, ...parsed];
    }
  }

  return parsed;
}

// Console Logger Interceptors for Website API Requests
apiClient.interceptors.request.use((config) => {
  console.log(`🌐 [WEBSITE API REQ] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`, config.data || '');
  return config;
}, (error) => {
  console.error(`❌ [WEBSITE API REQ ERROR]:`, error);
  return Promise.reject(error);
});

apiClient.interceptors.response.use((response) => {
  console.log(`📥 [WEBSITE API RES] ${response.status} ${response.statusText} from ${response.config.method?.toUpperCase()} ${response.config.url}`);
  return response;
}, (error) => {
  console.error(`❌ [WEBSITE API RES ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response?.status, error.message);
  return Promise.reject(error);
});

const buildUrl = (endpoint) => {
  if (!endpoint) return apiBaseUrl;
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  return `${apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export async function fetchJson(endpoint, options = {}) {
  const response = await fetch(buildUrl(endpoint), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message || 'Request failed';
    const err = new Error(message);
    err.response = { data: payload, status: response.status };
    throw err;
  }

  return payload;
}

export async function requestApi(endpoint, options = {}) {
  try {
    const response = await apiClient.request({
      url: endpoint,
      method: options.method || 'GET',
      data: options.data,
      params: options.params,
      headers: options.headers,
      withCredentials: Boolean(options.withCredentials)
    });
    return response.data;
  } catch (error) {
    const responseData = error?.response?.data;
    const errorDetail = responseData?.error ? `: ${responseData.error}` : '';
    const message = (responseData?.message || error?.message || 'API request failed') + errorDetail;
    if (options.fallback !== undefined) {
      return options.fallback;
    }

    const err = new Error(message);
    err.response = error?.response;
    err.data = responseData;
    throw err;
  }
}

export async function loginWithBackend(payload = {}) {
  const { email, password, phone } = payload;
  if ((!email && !phone) || !password) {
    return null;
  }
  return requestApi('/users/login', {
    method: 'POST',
    data: { email, password, phone }
  });
}

export async function loginWithPhoneOtpBackend(payload = {}) {
  const { phone, otp } = payload;
  if (!phone || !otp) {
    return null;
  }
  return requestApi('/users/login-with-otp', {
    method: 'POST',
    data: { phone, otp }
  });
}

export async function sendOtpToBackend(phone, purpose = 'register') {
  if (!phone) {
    return null;
  }
  return requestApi('/users/send-otp', {
    method: 'POST',
    data: { phone, purpose }
  });
}

export async function verifyOtpWithBackend(phone, otp) {
  if (!phone || !otp) {
    return null;
  }
  return requestApi('/users/verify-otp', {
    method: 'POST',
    data: { phone, otp }
  });
}

export async function registerWithBackend(payload = {}) {
  const { name, email, password, phone } = payload;
  if (!name || !password || !phone) {
    return null;
  }
  return requestApi('/users/register', {
    method: 'POST',
    data: { name, email, password, phone }
  });
}

export async function fetchUserProfileFromBackend(phoneOrId) {
  if (!phoneOrId) return null;
  const digitsOnly = String(phoneOrId).replace(/\D/g, '');
  if (digitsOnly.length >= 10) {
    return requestApi(`/users/by-phone/${digitsOnly.slice(-10)}`, { method: 'GET' });
  }
  return requestApi('/users/profile', { method: 'GET' });
}

const makeAuthHeaders = (phone = '', userId = '') => {
  const headers = {};
  if (phone) headers['x-user-phone'] = phone;
  if (userId) headers['x-user-id'] = userId;
  return headers;
};

export async function fetchWishlistFromBackend(phone = '', userId = '') {
  return requestApi('/wishlist', {
    method: 'GET',
    headers: makeAuthHeaders(phone, userId)
  });
}

export async function toggleWishlistInBackend(productId, phone = '', userId = '', product = null) {
  const targetId = productId !== undefined && productId !== null ? productId : (product?.id || product?._id);
  return requestApi('/wishlist/toggle', {
    method: 'POST',
    data: { productId: targetId, product, phone, userId },
    headers: makeAuthHeaders(phone, userId)
  });
}

export async function removeFromWishlistInBackend(productId, phone = '', userId = '') {
  return requestApi(`/wishlist/remove/${productId}`, {
    method: 'DELETE',
    headers: makeAuthHeaders(phone, userId)
  });
}

export async function fetchPublicSettingsFromBackend() {
  return requestApi('/admin/settings/public', {
    method: 'GET'
  });
}

export async function fetchCartFromBackend(phone = '', userId = '') {
  return requestApi('/cart', {
    method: 'GET',
    headers: makeAuthHeaders(phone, userId)
  });
}

export async function addToCartInBackend(product, quantity = 1, phone = '', userId = '') {
  const prodId = product?.id !== undefined ? product.id : product?._id;
  return requestApi('/cart/add', {
    method: 'POST',
    data: { product, productId: prodId, quantity, phone, userId },
    headers: makeAuthHeaders(phone, userId)
  });
}

export async function updateCartItemInBackend(itemId, delta, phone = '', userId = '') {
  return requestApi(`/cart/item/${itemId}`, {
    method: 'PUT',
    data: { delta, phone, userId },
    headers: makeAuthHeaders(phone, userId)
  });
}

export async function removeFromCartInBackend(itemId, phone = '', userId = '') {
  return requestApi(`/cart/item/${itemId}`, {
    method: 'DELETE',
    headers: makeAuthHeaders(phone, userId)
  });
}

export async function clearCartInBackend(phone = '', userId = '') {
  console.log('🌐 [FRONTEND API] DELETE /api/cart/clear for phone/userId:', phone, userId);
  return requestApi('/cart/clear', {
    method: 'DELETE',
    data: { phone, userId },
    headers: makeAuthHeaders(phone, userId)
  });
}

export async function updateUserProfileInBackend(profileData) {
  const phone = profileData?.phone || '';
  console.log('🌐 [FRONTEND API] PUT /api/users/profile payload:', profileData);
  const res = await requestApi('/users/profile', {
    method: 'PUT',
    data: profileData,
    headers: phone ? { 'x-user-phone': phone } : {}
  });
  console.log('🌐 [FRONTEND API] PUT /api/users/profile response:', res);
  return res;
}

export async function addAddressToBackend(addressData, phone = '') {
  const userPhone = phone || addressData?.phone || '';
  const res = await requestApi('/users/addresses', {
    method: 'POST',
    data: { ...addressData, phone: userPhone },
    headers: userPhone ? { 'x-user-phone': userPhone } : {}
  });
  return res;
}

export async function deleteAddressInBackend(addressId, phone = '') {
  const res = await requestApi(`/users/addresses/${addressId}`, {
    method: 'DELETE',
    headers: phone ? { 'x-user-phone': phone } : {}
  });
  return res;
}

export async function updateAddressInBackend(addressId, addressData, phone = '') {
  const userPhone = phone || addressData?.phone || '';
  const res = await requestApi(`/users/addresses/${addressId}`, {
    method: 'PUT',
    data: { ...addressData, phone: userPhone },
    headers: userPhone ? { 'x-user-phone': userPhone } : {}
  });
  return res;
}

export async function createOrderInBackend(orderPayload, phone = '') {
  const userPhone = phone || orderPayload?.customer?.phone || orderPayload?.shippingAddress?.phone || '';
  console.log('🌐 [FRONTEND API] POST /api/orders payload:', orderPayload);
  const res = await requestApi('/orders', {
    method: 'POST',
    data: { ...orderPayload, phone: userPhone },
    headers: userPhone ? { 'x-user-phone': userPhone } : {}
  });
  console.log('🌐 [FRONTEND API] POST /api/orders response:', res);
  return res;
}

export async function fetchMyOrdersFromBackend(phone = '') {
  const userPhone = String(phone || '').trim();
  const res = await requestApi('/orders/my-orders', {
    method: 'GET',
    headers: userPhone ? { 'x-user-phone': userPhone } : {},
    params: userPhone ? { phone: userPhone } : {}
  });
  return res;
}

export async function createRazorpayOrderInBackend(paymentPayload, phone = '') {
  const userPhone = phone || paymentPayload?.customer?.phone || '';
  const res = await requestApi('/payments/create-order', {
    method: 'POST',
    data: paymentPayload,
    headers: userPhone ? { 'x-user-phone': userPhone } : {}
  });
  return res;
}

export async function verifyRazorpayPaymentInBackend(verificationPayload, phone = '') {
  const res = await requestApi('/payments/verify', {
    method: 'POST',
    data: verificationPayload,
    headers: phone ? { 'x-user-phone': phone } : {}
  });
  return res;
}

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }
    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existingScript) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      existingScript.remove(); // Clean up existing failed/hanging script tag for retry
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    let isResolved = false;
    const timeoutTimer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        if (script.parentNode) script.remove();
        console.warn('⚠️ Razorpay checkout.js CDN script load timed out.');
        resolve(false);
      }
    }, 12000);

    script.onload = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutTimer);
        resolve(true);
      }
    };
    script.onerror = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutTimer);
        if (script.parentNode) script.remove();
        resolve(false);
      }
    };

    document.body.appendChild(script);
  });
}

export function getUpiIntentUrl({ app = 'gpay', amount, vpa = 'bookvardi@upi', orderId = '' }) {
  const cleanAmount = Number(amount || 0).toFixed(2);
  const note = orderId ? `Order_${orderId}` : 'Book_Vardi_Stationery_Order';
  const params = new URLSearchParams({
    pa: vpa,
    pn: 'Book Vardi Store',
    tn: note,
    am: cleanAmount,
    cu: 'INR'
  });

  const queryStr = params.toString();

  switch (String(app).toLowerCase()) {
    case 'gpay':
      return `tez://upi/pay?${queryStr}`;
    case 'phonepe':
      return `phonepe://pay?${queryStr}`;
    case 'paytm':
      return `paytmmp://pay?${queryStr}`;
    default:
      return `upi://pay?${queryStr}`;
  }
}

// Category & Dynamic Header API calls
export async function fetchCategoriesFromBackend() {
  return requestApi('/categories', { method: 'GET', fallback: [] });
}

export async function fetchCategoryTreeFromBackend() {
  const CACHE_KEY = 'bv_cached_categories_tree';
  const CACHE_TIME_KEY = 'bv_cached_categories_time';

  let cachedData = null;
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedData = parsed;
      }
    }
  } catch (e) {}

  if (backendEnabled) {
    try {
      const freshData = await requestApi('/categories/tree', { method: 'GET' });
      if (Array.isArray(freshData) && freshData.length > 0) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
          localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
        } catch (e) {}
        return freshData;
      }
    } catch (err) {
      console.warn('Backend category tree fetch warning:', err);
    }
  }

  return cachedData || [];
}

// Product Catalog & Search API calls
export async function fetchProductsFromBackend(params = {}) {
  return requestApi('/products', { method: 'GET', params, fallback: { products: [], total: 0 } });
}

export async function fetchProductByIdFromBackend(id) {
  return requestApi(`/products/${id}`, { method: 'GET', fallback: null });
}

export async function fetchRecentlyViewedFromBackend({ ids = [], category = null, limit = 8 } = {}) {
  const idsParam = Array.isArray(ids) ? ids.join(',') : (ids || '');
  return requestApi('/products/recently-viewed', {
    method: 'GET',
    params: { ids: idsParam, category: category || undefined, limit },
    fallback: { products: [] }
  });
}

export async function fetchFeaturedProductsFromBackend(options = 8) {
  const params = typeof options === 'number' ? { limit: options } : { category: options?.category || undefined, limit: options?.limit || 8 };
  return requestApi('/products/featured', {
    method: 'GET',
    params,
    fallback: { products: [] }
  });
}

export async function fetchSpecialOffersFromBackend(options = 10) {
  const params = typeof options === 'number' ? { limit: options } : { category: options?.category || undefined, limit: options?.limit || 8 };
  return requestApi('/products/special-offers', {
    method: 'GET',
    params,
    fallback: { products: [] }
  });
}

export async function fetchActiveCouponsFromBackend() {
  return requestApi('/coupons/active', {
    method: 'GET',
    fallback: []
  });
}

export async function fetchRecommendedProductsFromBackend(options = {}) {
  const params = typeof options === 'number'
    ? { limit: options }
    : {
        category: options?.category || undefined,
        schoolName: options?.schoolName || undefined,
        classGrade: options?.classGrade || undefined,
        limit: options?.limit || 8
      };
  return requestApi('/products/recommended', {
    method: 'GET',
    params,
    fallback: { products: [] }
  });
}

export function normalizeKit(rawKit) {
  if (!rawKit || typeof rawKit !== 'object') return null;

  // Do not show kit to website until approved and approvalStatus is Approved
  const rawApproval = String(rawKit.approvalStatus || rawKit.approval_status || '').trim().toLowerCase();
  if (rawApproval !== 'approved') {
    return null;
  }

  // Ensure kit is not deleted or inactive
  const kitStatus = String(rawKit.status || '').trim().toLowerCase();
  if (kitStatus === 'deleted' || kitStatus === 'inactive' || rawKit.isDeleted === true) {
    return null;
  }

  const id = rawKit.id || rawKit._id || `kit-${Math.random().toString(36).substring(2, 9)}`;
  const name = rawKit.name || rawKit.title || 'Official School Kit';
  const school = rawKit.school || rawKit.schoolName || 'Any School';
  const className = rawKit.className || rawKit.classGrade || 'Any Class';
  const subtitle = rawKit.subtitle || rawKit.description || 'Complete uniform, textbook & stationery bundle';
  const price = Number(rawKit.price ?? rawKit.bundlePrice ?? 0);
  const originalPrice = Number(rawKit.originalPrice ?? rawKit.totalMrp ?? price);
  const discountBadge = rawKit.discountBadge || rawKit.badgeTag || (originalPrice > price ? 'BUNDLE DEAL' : '');
  const rating = Number(rawKit.rating ?? 4.8);
  const reviewsCount = Number(rawKit.reviewsCount ?? rawKit.ratingCount ?? 120);
  const inStock = rawKit.inStock ?? (rawKit.status === 'available');

  let images = Array.isArray(rawKit.images) && rawKit.images.length > 0 ? rawKit.images : [];
  if (rawKit.image && !images.includes(rawKit.image)) {
    images = [rawKit.image, ...images];
  }
  if (images.length === 0) {
    images = ['https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=900&auto=format&fit=crop&q=80'];
  }
  const image = images[0];

  const rawItems = Array.isArray(rawKit.kitItems) ? rawKit.kitItems : (Array.isArray(rawKit.items) ? rawKit.items : []);
  const kitItems = rawItems.map((item, idx) => ({
    id: item.id || item._id || idx + 1,
    name: item.name || 'Kit Essential Item',
    price: Number(item.price ?? item.totalPrice ?? item.unitPrice ?? 0),
    image: item.image || image
  }));

  return {
    ...rawKit,
    approvalStatus: 'Approved',
    isApproved: true,
    id,
    name,
    school,
    className,
    subtitle,
    price,
    originalPrice,
    discountBadge,
    rating,
    reviewsCount,
    inStock,
    image,
    images,
    kitItems
  };
}

// Kit Bundles API calls
export async function fetchKitsFromBackend(params = {}) {
  const res = await requestApi('/kits', { method: 'GET', params, fallback: { kits: [], count: 0 } });
  const rawList = res?.kits || (Array.isArray(res) ? res : []);
  const normalizedList = Array.isArray(rawList)
    ? rawList
        .map(normalizeKit)
        .filter(Boolean)
        .filter(k => String(k.approvalStatus || k.approval_status || '').trim().toLowerCase() === 'approved')
    : [];
  return { kits: normalizedList, count: normalizedList.length };
}

export async function fetchKitByIdFromBackend(id) {
  const kit = await requestApi(`/kits/${id}`, { method: 'GET', fallback: null });
  const normalized = kit ? normalizeKit(kit) : null;
  if (!normalized || String(normalized.approvalStatus || normalized.approval_status || '').trim().toLowerCase() !== 'approved') {
    return null;
  }
  return normalized;
}

// Location & School/Class Recommendations API
export async function fetchRecommendationsFromBackend({ schoolName = '', classGrade = '', limit = 6 } = {}) {
  return requestApi('/products', {
    method: 'GET',
    params: { schoolName, classGrade, limit },
    fallback: { products: [] }
  });
}

export async function uploadAvatarToBackend(file, phone = '') {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await apiClient.post('/users/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(phone ? { 'x-user-phone': phone } : {})
    }
  });

  return res.data;
}

export function resolveImageUrl(url) {
  if (!url) return '';
  const str = typeof url === 'string' ? url.trim() : (url?.url || url?.src || url?.path || '');
  if (!str) return '';
  if (/^https?:\/\//i.test(str) || str.startsWith('data:') || str.startsWith('blob:')) return str;
  const backendHost = apiBaseUrl.replace(/\/api\/?$/, '');
  const cleanPath = str.startsWith('/') ? str : `/${str}`;
  return `${backendHost}${cleanPath}`;
}

export function getProductMainImage(product) {
  if (!product) return '';
  
  const extractUrl = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'object') {
      return (val.url || val.src || val.path || val.data || val.link || '').trim();
    }
    return '';
  };

  // 1. Direct image properties (primary image uploaded by seller)
  const directImg = extractUrl(product.image || product.coverImage || product.imageUrl || product.photo || product.primaryImage);
  if (directImg) return directImg;

  // 2. Check images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    for (const img of product.images) {
      const url = extractUrl(img);
      if (url) return url;
    }
  }

  // 3. Check sizeVariants images or image
  if (Array.isArray(product.sizeVariants) && product.sizeVariants.length > 0) {
    for (const v of product.sizeVariants) {
      const vImg = extractUrl(v.image);
      if (vImg) return vImg;
      if (Array.isArray(v.images) && v.images.length > 0) {
        for (const img of v.images) {
          const url = extractUrl(img);
          if (url) return url;
        }
      }
    }
  }

  // 4. Kit Items if bundle
  if (Array.isArray(product.kitItems) && product.kitItems.length > 0) {
    for (const item of product.kitItems) {
      const url = extractUrl(item.image);
      if (url) return url;
    }
  }

  return '';
}

// Product Reviews API calls
export async function fetchProductReviewsFromBackend(productId) {
  if (!productId) return [];
  return requestApi(`/reviews/product/${productId}`, {
    method: 'GET',
    params: { includePending: 'true' },
    fallback: []
  });
}

export async function addReviewToBackend(reviewPayload, phone = '') {
  const token = localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  const userProfileStr = localStorage.getItem('book_vardi_user_profile');
  let userId = '';
  let userPhone = phone || reviewPayload?.phone || '';
  if (userProfileStr) {
    try {
      const u = JSON.parse(userProfileStr);
      userId = u.id || u._id || '';
      if (!userPhone) userPhone = u.phone || u.mobile || '';
    } catch (e) {}
  }
  return requestApi('/reviews', {
    method: 'POST',
    data: reviewPayload,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userPhone ? { 'x-user-phone': userPhone } : {}),
      ...(userId ? { 'x-user-id': userId } : {})
    }
  });
}

export async function deleteReviewInBackend(reviewId, phone = '') {
  return requestApi(`/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: phone ? { 'x-user-phone': phone } : {}
  });
}

export async function updateReviewStatusInBackend(reviewId, status, phone = '') {
  return requestApi(`/reviews/${reviewId}/status`, {
    method: 'PATCH',
    data: { status },
    headers: phone ? { 'x-user-phone': phone } : {}
  });
}

// Partner Schools & Bulk Orders API calls
export async function fetchSchoolsFromBackend(params = {}) {
  return requestApi('/schools', { method: 'GET', params, fallback: { schools: [] } });
}

export async function registerSellerInBackend(formData) {
  const res = await apiClient.post('/seller/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}

export async function submitSchoolBulkOrderInBackend(payload) {
  const token = localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  const userProfileStr = localStorage.getItem('book_vardi_user_profile');
  let userId = payload?.userId || '';
  let phone = payload?.userPhone || payload?.contactPhone || payload?.phone || '';
  let email = payload?.userEmail || payload?.contactEmail || payload?.email || '';

  if (userProfileStr) {
    try {
      const u = JSON.parse(userProfileStr);
      if (!userId) userId = u.id || u._id || '';
      if (!phone) phone = u.phone || u.mobile || '';
      if (!email) email = u.email || '';
    } catch (e) {}
  }

  const finalPayload = {
    ...payload,
    ...(userId ? { userId } : {}),
    ...(phone ? { userPhone: phone } : {}),
    ...(email ? { userEmail: email } : {})
  };

  return requestApi('/schools/bulk-order', {
    method: 'POST',
    data: finalPayload,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(phone ? { 'x-user-phone': phone } : {}),
      ...(userId ? { 'x-user-id': userId } : {}),
      ...(email ? { 'x-user-email': email } : {})
    }
  });
}

export async function fetchCustomerSchoolBulkOrdersApi(phone = '', userId = '', email = '') {
  const token = localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  const userProfileStr = localStorage.getItem('book_vardi_user_profile');
  let finalUserId = userId;
  let finalPhone = phone;
  let finalEmail = email;

  if (userProfileStr) {
    try {
      const u = JSON.parse(userProfileStr);
      if (!finalUserId) finalUserId = u.id || u._id || '';
      if (!finalPhone) finalPhone = u.phone || u.mobile || '';
      if (!finalEmail) finalEmail = u.email || '';
    } catch (e) {}
  }

  // Also gather any local referenceIds stored in the browser
  const localRefIds = [];
  try {
    const list1 = JSON.parse(localStorage.getItem('bv_customer_bulk_orders') || '[]');
    const list2 = JSON.parse(localStorage.getItem('bv_sync_school_orders') || '[]');
    [...list1, ...list2].forEach(o => {
      const r = o.referenceId || o.refId || (typeof o.id === 'string' && o.id.startsWith('BULK-') ? o.id : '');
      if (r && !localRefIds.includes(r)) {
        localRefIds.push(r);
      }
    });
  } catch (e) {}

  const queryParams = new URLSearchParams();
  if (finalPhone) queryParams.append('phone', finalPhone);
  if (finalUserId) queryParams.append('userId', finalUserId);
  if (finalEmail) queryParams.append('email', finalEmail);
  if (localRefIds.length > 0) queryParams.append('referenceIds', localRefIds.join(','));
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return requestApi(`/schools/bulk-orders/my-orders${qs}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(finalPhone ? { 'x-user-phone': finalPhone } : {}),
      ...(finalUserId ? { 'x-user-id': finalUserId } : {}),
      ...(finalEmail ? { 'x-user-email': finalEmail } : {}),
      ...(localRefIds.length > 0 ? { 'x-reference-ids': localRefIds.join(',') } : {})
    },
    fallback: { orders: [] }
  });
}

export async function fetchSingleBulkOrderApi(orderIdOrRef) {
  if (!orderIdOrRef) return { success: false, message: 'No ID provided' };
  const token = localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  const userProfileStr = localStorage.getItem('book_vardi_user_profile');
  let finalUserId = '';
  let finalPhone = '';
  let finalEmail = '';

  if (userProfileStr) {
    try {
      const u = JSON.parse(userProfileStr);
      finalUserId = u.id || u._id || '';
      finalPhone = u.phone || u.mobile || '';
      finalEmail = u.email || '';
    } catch (e) {}
  }

  return requestApi(`/schools/bulk-orders/${encodeURIComponent(orderIdOrRef)}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(finalPhone ? { 'x-user-phone': finalPhone } : {}),
      ...(finalUserId ? { 'x-user-id': finalUserId } : {}),
      ...(finalEmail ? { 'x-user-email': finalEmail } : {})
    },
    fallback: { success: false, order: null }
  });
}

export async function submitBuyerCounterDemandApi(orderId, quoteId, counterData) {
  const token = localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  return requestApi(`/schools/bulk-orders/${orderId}/quotations/${quoteId}/counter`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    data: {
      ...counterData,
      callerRole: 'consumer'
    }
  });
}

export async function approveSellerQuotationApi(orderId, quoteId, payload = {}) {
  const token = localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  return requestApi(`/schools/bulk-orders/${orderId}/approve-quote`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    data: {
      quoteId,
      ...payload,
      callerRole: 'consumer'
    }
  });
}

export async function confirmBuyerAcceptanceApi(orderId) {
  const token = localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  return requestApi(`/schools/bulk-orders/${orderId}/confirm-buyer-acceptance`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
}

export async function confirmSellerAcceptanceApi(orderId) {
  const token = localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  return requestApi(`/schools/bulk-orders/${orderId}/confirm-seller-acceptance`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
}

export async function createSchoolBulkPrepaymentOrderApi(orderId) {
  const token = localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  return requestApi(`/schools/bulk-orders/${orderId}/advance-payment/create-order`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
}

export async function verifySchoolBulkPrepaymentApi(orderId, verificationPayload = {}) {
  const token = localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  return requestApi(`/schools/bulk-orders/${orderId}/advance-payment/verify`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    data: verificationPayload
  });
}

export async function createSchoolBulkRemainingPaymentOrderApi(orderId) {
  const token = localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  return requestApi(`/schools/bulk-orders/${orderId}/remaining-payment/create-order`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
}

export async function verifySchoolBulkRemainingPaymentApi(orderId, verificationPayload = {}) {
  const token = localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  return requestApi(`/schools/bulk-orders/${orderId}/remaining-payment/verify`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    data: verificationPayload
  });
}

export async function submitContactMessageApi(formData) {
  return requestApi('/contact', {
    method: 'POST',
    data: formData
  });
}

export async function fetchAnnouncementsFromBackend() {
  return requestApi('/announcements', {
    method: 'GET',
    fallback: { success: true, data: [] }
  });
}

export function getInvoiceDownloadUrl(orderId, type = 'invoice') {
  const cleanId = encodeURIComponent(orderId);
  if (type === 'credit-note') return `${apiBaseUrl}/orders/${cleanId}/credit-note`;
  if (type === 'exchange-invoice') return `${apiBaseUrl}/orders/${cleanId}/exchange-invoice`;
  return `${apiBaseUrl}/orders/${cleanId}/invoice`;
}

export async function downloadInvoiceApi(orderId, phone = '', type = 'invoice') {
  const url = getInvoiceDownloadUrl(orderId, type);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: phone ? { 'x-user-phone': phone } : {}
    });
    if (!res.ok) throw new Error('Failed to download PDF document');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${type.toUpperCase()}_${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    return { success: true };
  } catch (err) {
    window.open(url, '_blank');
    return { success: true };
  }
}


// ==========================================
// Delivery Partner Portal APIs
// ==========================================
export async function fetchDeliveryPartnerOrderApi(token) {
  return requestApi(`/delivery/partner/${token}`, {
    method: 'GET'
  });
}

export async function resendDeliveryOtpApi(token, payload = {}) {
  return requestApi(`/delivery/partner/${token}/resend-otp`, {
    method: 'POST',
    data: payload
  });
}

export async function verifyDeliveryOtpApi(token, otp, payload = {}) {
  return requestApi(`/delivery/partner/${token}/verify-otp`, {
    method: 'POST',
    data: { otp, ...payload }
  });
}

export async function updateDeliveryLocationApi(token, lat, lng) {
  return requestApi(`/delivery/partner/${token}/location`, {
    method: 'POST',
    data: { lat, lng }
  });
}

// Live Courier AWB Tracking
export async function trackAwbApi(awbNumber) {
  if (!awbNumber) return { success: false, message: 'AWB number required' };
  return requestApi(`/delivery/track/${awbNumber}`, {
    method: 'GET',
    fallback: {
      success: true,
      awbNumber,
      courierPartnerName: 'Shiprocket Delivery Network',
      estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      checkpoints: [
        { title: 'Out for Delivery', description: 'Rider dispatched to school campus address', location: 'Destination Hub', timestamp: new Date().toISOString() },
        { title: 'In Transit', description: 'Package sorted at gateway facility', location: 'Regional Sorting Hub', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
        { title: 'Picked Up', description: 'Courier agent collected package', location: 'Seller Warehouse', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() }
      ]
    }
  });
}

export async function checkServiceabilityWebsiteApi(deliveryPincode, weightKg = 1) {
  return requestApi('/delivery/serviceability', {
    method: 'POST',
    data: { deliveryPincode, weightKg },
    fallback: { success: true, serviceable: true, estimatedRate: 45, estimatedDays: '2-3 Days' }
  });
}

export async function cancelOrderApi(orderId, payload = '', phone = '') {
  const data = typeof payload === 'object' && payload !== null ? payload : { reason: String(payload) };
  return requestApi(`/orders/${orderId}/cancel`, {
    method: 'POST',
    data,
    headers: phone ? { 'x-user-phone': phone } : {},
    fallback: { success: true, message: 'Order cancelled successfully' }
  });
}

export async function requestReturnExchangeApi(orderId, payload = {}, phone = '') {
  return requestApi(`/orders/${orderId}/return-exchange`, {
    method: 'POST',
    data: payload,
    headers: phone ? { 'x-user-phone': phone } : {},
    fallback: { success: true, message: `${payload.type === 'exchange' ? 'Exchange' : 'Return'} requested successfully` }
  });
}




