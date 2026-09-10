import axios from 'axios';

const fallbackBaseUrl = 'http://localhost:5000/';
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl;
const apiBaseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/+$/, '');
export const backendEnabled = import.meta.env.VITE_USE_BACKEND === 'true';

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
    throw new Error(message);
  }

  return payload;
}

export async function requestApi(endpoint, options = {}) {
  if (!backendEnabled) {
    return null;
  }

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
    const message = error?.response?.data?.message || error?.message || 'API request failed';
    if (options.fallback !== undefined) {
      return options.fallback;
    }

    throw new Error(message);
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
