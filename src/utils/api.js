import axios from 'axios';

const fallbackBaseUrl = 'http://localhost:5000/api';
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl;
const apiBaseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/+$/, '');
export const backendEnabled = import.meta.env.VITE_USE_BACKEND !== 'false';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
    const message = responseData?.message || error?.message || 'API request failed';
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
  const res = await requestApi('/orders/my-orders', {
    method: 'GET',
    headers: phone ? { 'x-user-phone': phone } : {}
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
  const normalizedList = Array.isArray(rawList) ? rawList.map(normalizeKit).filter(Boolean) : [];
  return { kits: normalizedList, count: normalizedList.length };
}

export async function fetchKitByIdFromBackend(id) {
  const kit = await requestApi(`/kits/${id}`, { method: 'GET', fallback: null });
  return kit ? normalizeKit(kit) : null;
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
  if (!url || typeof url !== 'string') return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  const backendHost = apiBaseUrl.replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendHost}${cleanPath}`;
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
  return requestApi('/schools/bulk-order', {
    method: 'POST',
    data: payload
  });
}

export async function submitContactMessageApi(formData) {
  return requestApi('/contact', {
    method: 'POST',
    data: formData
  });
}
