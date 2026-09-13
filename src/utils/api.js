import axios from 'axios';

const fallbackBaseUrl = 'http://localhost:5000/api';
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl;
const apiBaseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/+$/, '');
export const backendEnabled = import.meta.env.VITE_USE_BACKEND !== 'false';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
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

export async function fetchWishlistFromBackend(phone) {
  return requestApi('/wishlist', {
    method: 'GET',
    headers: phone ? { 'x-user-phone': phone } : {}
  });
}

export async function toggleWishlistInBackend(productId, phone) {
  return requestApi('/wishlist/toggle', {
    method: 'POST',
    data: { productId, phone },
    headers: phone ? { 'x-user-phone': phone } : {}
  });
}

export async function removeFromWishlistInBackend(productId, phone) {
  return requestApi(`/wishlist/remove/${productId}`, {
    method: 'DELETE',
    headers: phone ? { 'x-user-phone': phone } : {}
  });
}

export async function fetchCartFromBackend(phone) {
  return requestApi('/cart', {
    method: 'GET',
    headers: phone ? { 'x-user-phone': phone } : {}
  });
}

export async function addToCartInBackend(product, quantity = 1, phone = '') {
  return requestApi('/cart/add', {
    method: 'POST',
    data: { product, productId: product?.id, quantity, phone },
    headers: phone ? { 'x-user-phone': phone } : {}
  });
}

export async function updateCartItemInBackend(itemId, delta, phone = '') {
  return requestApi(`/cart/item/${itemId}`, {
    method: 'PUT',
    data: { delta, phone },
    headers: phone ? { 'x-user-phone': phone } : {}
  });
}

export async function removeFromCartInBackend(itemId, phone = '') {
  return requestApi(`/cart/item/${itemId}`, {
    method: 'DELETE',
    headers: phone ? { 'x-user-phone': phone } : {}
  });
}

export async function clearCartInBackend(phone = '') {
  console.log('🌐 [FRONTEND API] DELETE /api/cart/clear for phone:', phone);
  return requestApi('/cart/clear', {
    method: 'DELETE',
    data: { phone },
    headers: phone ? { 'x-user-phone': phone } : {}
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
  return requestApi('/categories/tree', { method: 'GET', fallback: [] });
}

// Product Catalog & Search API calls
export async function fetchProductsFromBackend(params = {}) {
  return requestApi('/products', { method: 'GET', params, fallback: { products: [], total: 0 } });
}

export async function fetchProductByIdFromBackend(id) {
  return requestApi(`/products/${id}`, { method: 'GET', fallback: null });
}

export async function fetchFeaturedProductsFromBackend(limit = 8) {
  return requestApi('/products', {
    method: 'GET',
    params: { sortBy: 'rating', limit },
    fallback: { products: [] }
  });
}

export async function fetchSpecialOffersFromBackend(limit = 10) {
  return requestApi('/products', {
    method: 'GET',
    params: { hasOffer: 'true', limit },
    fallback: { products: [] }
  });
}

// Kit Bundles API calls
export async function fetchKitsFromBackend(params = {}) {
  return requestApi('/kits', { method: 'GET', params, fallback: { kits: [], count: 0 } });
}

export async function fetchKitByIdFromBackend(id) {
  return requestApi(`/kits/${id}`, { method: 'GET', fallback: null });
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




