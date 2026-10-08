import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  backendEnabled,
  loginWithBackend,
  loginWithPhoneOtpBackend,
  registerWithBackend,
  fetchUserProfileFromBackend,
  fetchWishlistFromBackend,
  toggleWishlistInBackend,
  removeFromWishlistInBackend,
  fetchCartFromBackend,
  addToCartInBackend,
  updateCartItemInBackend,
  removeFromCartInBackend,
  clearCartInBackend,
  updateUserProfileInBackend,
  addAddressToBackend,
  updateAddressInBackend,
  deleteAddressInBackend,
  createOrderInBackend,
  fetchMyOrdersFromBackend,
  fetchProductReviewsFromBackend,
  addReviewToBackend,
  deleteReviewInBackend,
  fetchProductsFromBackend,
  fetchActiveCouponsFromBackend,
  fetchPublicSettingsFromBackend,
  getProductMainImage
} from '../utils/api';

export const EMPTY_USER_PROFILE = {
  id: '',
  name: '',
  email: '',
  phone: '',
  studentId: '',
  institution: '',
  standard: '',
  avatar: '',
  role: 'Student',
  roles: ['Student', 'Customer'],
  isAdmin: false,
  adminStatus: 'none',
  adminRole: null,
  isSeller: false,
  sellerStatus: 'none',
  sellerRole: null,
  memberSince: 'Today',
  rewardPoints: 0,
  addresses: []
};

const INITIAL_MOCK_REVIEWS = {};

export function getProfileCompleteness(profile) {
  const missing = [];
  
  const hasName = Boolean(profile?.name && String(profile.name).trim() !== '' && String(profile.name).trim() !== 'Student Account');
  if (!hasName) missing.push({ key: 'name', label: 'Full Name' });

  const hasEmail = Boolean(profile?.email && String(profile.email).trim() !== '' && !profile.email.includes('@bookvardi.local'));
  if (!hasEmail) missing.push({ key: 'email', label: 'Email Address' });

  const hasInstitution = Boolean(profile?.institution && String(profile.institution).trim() !== '');
  if (!hasInstitution) missing.push({ key: 'institution', label: 'College / Institution' });

  const hasPhone = Boolean(profile?.phone && String(profile.phone).trim() !== '');
  if (!hasPhone) missing.push({ key: 'phone', label: 'Phone Number' });

  const hasAddress = Array.isArray(profile?.addresses) && profile.addresses.length > 0;
  if (!hasAddress) missing.push({ key: 'address', label: 'Delivery Address' });

  const totalFields = 5;
  const completedFields = totalFields - missing.length;
  const percentage = Math.round((completedFields / totalFields) * 100);
  const isIncomplete = missing.length > 0;

  return {
    isIncomplete,
    percentage,
    missing,
    completedFields,
    totalFields
  };
}

export const isUnstitchedItem = (item) => Boolean(
  item?.isMeterBased === true ||
  item?.unit === 'meter' ||
  String(item?.category || '').toLowerCase().includes('unstitched') ||
  String(item?.subCategory || '').toLowerCase().includes('unstitched') ||
  String(item?.name || '').toLowerCase().includes('unstitched')
);

export const getCartItemKey = (item) => {
  if (!item) return '';
  if (item.cartItemId) return String(item.cartItemId);
  const prodId = item.productId !== undefined ? item.productId : (item.id !== undefined ? item.id : item._id);
  const isUnstitched = isUnstitchedItem(item);
  const size = isUnstitched ? '' : (item.selectedSize || item.size || item.selectedVariant?.size || item.selectedVariant?.name || '');
  const color = item.selectedColor || item.color || item.selectedVariant?.color || '';
  const variantId = item.variantId || item.selectedVariant?.id || item.selectedVariant?._id || '';
  const keyPart = [size, color, variantId].filter(Boolean).join('_');
  return keyPart ? `${prodId}_${keyPart}` : String(prodId || '');
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Initialize from localStorage if available
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_items_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.map((it) => ({
              ...it,
              cartItemId: it.cartItemId || getCartItemKey(it)
            }))
          : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_wishlist_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.map((item) => (isNaN(item) ? item : Number(item))) : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_registered_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('book_vardi_registered_users', JSON.stringify(registeredUsers));
    } catch (e) {
      console.error(e);
    }
  }, [registeredUsers]);

  const isUserRegistered = (identifier) => {
    if (!identifier) return false;
    const cleaned = String(identifier).trim();
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length >= 10) {
      const last10 = digitsOnly.slice(-10);
      return registeredUsers.some((u) => {
        const uDigits = String(u.phone || '').replace(/\D/g, '');
        return uDigits.endsWith(last10);
      });
    }
    const lower = cleaned.toLowerCase();
    return registeredUsers.some((u) => String(u.email || '').toLowerCase() === lower);
  };

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_user_profile');
      if (saved) {
        return JSON.parse(saved);
      }
      return EMPTY_USER_PROFILE;
    } catch {
      return EMPTY_USER_PROFILE;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_is_authenticated');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [toastState, setToastState] = useState(null);
  const toastMessage = toastState?.message || null;

  // Dynamic Products and Promotions from global platform sync
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_sync_products') || localStorage.getItem('admin_products') || localStorage.getItem('bv_seller_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(p => {
            const appStat = String(p.approvalStatus || '').toLowerCase();
            return appStat === 'approved';
          });
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [promotions, setPromotions] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_sync_promotions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selected product for detailed modal view
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Product reviews store
  const [productReviews, setProductReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_product_reviews');
      return saved ? JSON.parse(saved) : INITIAL_MOCK_REVIEWS;
    } catch {
      return INITIAL_MOCK_REVIEWS;
    }
  });



  // Most recently placed order (for Order Success Confirmation)
  const [lastPlacedOrder, setLastPlacedOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_last_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active coupon discount state
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Admin status & authorization state (derived from current user profile)
  const [adminStatus, setAdminStatus] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_admin_status');
      if (saved) return JSON.parse(saved);
      return userProfile?.adminStatus || (userProfile?.isAdmin ? 'approved' : 'none');
    } catch {
      return 'none';
    }
  });

  // Approved admin check: user must be an approved admin in mockData
  const isAdmin = Boolean(
    isAuthenticated && (
      (userProfile?.isAdmin === true && (userProfile?.adminStatus === 'approved' || adminStatus === 'approved')) ||
      (adminStatus === 'approved' && ['Super Admin', 'Operations Manager', 'Finance Admin', 'Support Lead', 'Admin'].includes(userProfile?.role))
    )
  );

  // Seller status & authorization state (derived from current user profile & local storage keys)
  const [sellerStatus, setSellerStatus] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_seller_status');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) return String(parsed).toLowerCase();
      }
      const regData = localStorage.getItem('bv_seller_reg_data');
      if (regData) {
        const parsed = JSON.parse(regData);
        if (parsed.submissionStatus || parsed.status) {
          return String(parsed.submissionStatus || parsed.status).toLowerCase();
        }
      }
      return String(userProfile?.sellerStatus || (userProfile?.isSeller ? 'approved' : 'none')).toLowerCase();
    } catch {
      return 'none';
    }
  });

  const [sellerProfile, setSellerProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_seller_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);

  // Helper check for approved seller status
  const checkStatusApproved = (stat) => {
    if (!stat) return false;
    const s = String(stat).toLowerCase().trim();
    return s === 'approved' || s === 'active' || s === 'verified';
  };

  // Approved seller check: user is approved if sellerStatus, userProfile, or sellerProfile has approved status
  const isSeller = Boolean(
    isAuthenticated && (
      userProfile?.isSeller === true ||
      checkStatusApproved(sellerStatus) ||
      checkStatusApproved(userProfile?.sellerStatus) ||
      checkStatusApproved(sellerProfile?.status) ||
      checkStatusApproved(sellerProfile?.submissionStatus) ||
      ['Partner Merchant', 'Store Manager', 'Catalog Specialist', 'Logistics Lead', 'Seller', 'Merchant'].includes(userProfile?.role)
    )
  );

  // Synchronize role status flags whenever userProfile updates
  useEffect(() => {
    if (userProfile) {
      const currentAdminStat = userProfile.adminStatus || (userProfile.isAdmin ? 'approved' : 'none');
      const currentSellerStat = userProfile.sellerStatus || (userProfile.isSeller ? 'approved' : sellerStatus || 'none');
      setAdminStatus(currentAdminStat);
      setSellerStatus(currentSellerStat);
      try {
        localStorage.setItem('book_vardi_admin_status', JSON.stringify(currentAdminStat));
        localStorage.setItem('book_vardi_seller_status', JSON.stringify(currentSellerStat));
        localStorage.setItem('book_vardi_user_profile', JSON.stringify(userProfile));
      } catch (e) {
        console.error(e);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (backendEnabled && isAuthenticated && (userProfile?.phone || userProfile?.id)) {
      const identifier = userProfile?.phone || userProfile?.id;
      fetchUserProfileFromBackend(identifier)
        .then((dbUser) => {
          if (dbUser) {
            const dbSellerStat = dbUser.sellerStatus || (dbUser.isSeller ? 'approved' : undefined);
            setUserProfile((prev) => ({
              ...prev,
              id: dbUser.id || dbUser._id || prev?.id,
              name: dbUser.name !== undefined && dbUser.name !== null ? dbUser.name : prev?.name,
              email: dbUser.email !== undefined && dbUser.email !== null ? dbUser.email : prev?.email,
              phone: dbUser.phone || prev?.phone,
              avatar: dbUser.avatar || prev?.avatar,
              role: dbUser.role || prev?.role,
              isSeller: dbUser.isSeller !== undefined ? dbUser.isSeller : (dbSellerStat === 'approved' || prev?.isSeller),
              sellerStatus: dbSellerStat || prev?.sellerStatus,
              institution: dbUser.institution !== undefined ? dbUser.institution : prev?.institution,
              studentId: dbUser.studentId !== undefined ? dbUser.studentId : prev?.studentId,
              standard: dbUser.standard !== undefined ? dbUser.standard : prev?.standard,
              addresses: Array.isArray(dbUser.addresses) && dbUser.addresses.length > 0 ? dbUser.addresses : (prev?.addresses || [])
            }));
            if (dbSellerStat) {
              setSellerStatus(dbSellerStat);
              try {
                localStorage.setItem('book_vardi_seller_status', JSON.stringify(dbSellerStat));
              } catch (e) {}
            }
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, userProfile?.phone, userProfile?.id]);

  useEffect(() => {
    if (backendEnabled && isAuthenticated && (userProfile?.phone || userProfile?.id)) {
      const phone = userProfile?.phone || '';
      const userId = userProfile?.id || userProfile?._id || '';
      fetchWishlistFromBackend(phone, userId)
        .then((res) => {
          if (res?.products && Array.isArray(res.products) && res.products.length > 0) {
            setWishlist(res.products);
          } else if (res?.productIds && Array.isArray(res.productIds)) {
            setWishlist(res.productIds);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, userProfile?.phone, userProfile?.id]);

  const fetchUserOrders = useCallback(async (overridePhone = '') => {
    const phone = overridePhone || userProfile?.phone || '';
    if (!phone && !userProfile?.id && !isAuthenticated) return [];
    try {
      const res = await fetchMyOrdersFromBackend(phone);
      const ordersList = Array.isArray(res) ? res : (res?.orders || []);
      if (Array.isArray(ordersList)) {
        setUserProfile((prev) => ({
          ...prev,
          orders: ordersList
        }));
      }
      return ordersList;
    } catch (err) {
      console.warn('⚠️ Could not fetch user orders from backend:', err?.message || err);
      return userProfile?.orders || [];
    }
  }, [userProfile?.phone, userProfile?.id, isAuthenticated]);

  useEffect(() => {
    if (backendEnabled && isAuthenticated && (userProfile?.phone || userProfile?.id)) {
      const phone = userProfile?.phone || '';
      const userId = userProfile?.id || userProfile?._id || '';
      fetchCartFromBackend(phone, userId)
        .then((res) => {
          if (res?.cart?.items && Array.isArray(res.cart.items)) {
            setCartItems(res.cart.items.map((it) => ({
              ...it,
              cartItemId: it.cartItemId || getCartItemKey(it)
            })));
          }
        })
        .catch(() => {});

      fetchUserOrders(phone);
    }
  }, [isAuthenticated, userProfile?.phone, userProfile?.id, fetchUserOrders]);

  // Real-time synchronization of customer orders when updated by Admin or Seller
  useEffect(() => {
    const handleOrderSync = () => {
      if (backendEnabled && isAuthenticated && (userProfile?.phone || userProfile?.id)) {
        fetchUserOrders(userProfile?.phone || '');
      }
    };

    window.addEventListener('bv_orders_updated', handleOrderSync);
    window.addEventListener('focus', handleOrderSync);
    window.addEventListener('storage', (e) => {
      if (e.key === 'bv_order_sync_timestamp' || e.key === 'admin_orders' || e.key === 'bv_seller_orders') {
        handleOrderSync();
      }
    });

    return () => {
      window.removeEventListener('bv_orders_updated', handleOrderSync);
      window.removeEventListener('focus', handleOrderSync);
      window.removeEventListener('storage', handleOrderSync);
    };
  }, [backendEnabled, isAuthenticated, userProfile?.phone, userProfile?.id, fetchUserOrders]);

  const fetchActivePromotions = useCallback(async () => {
    if (!backendEnabled) return;
    try {
      const res = await fetchActiveCouponsFromBackend();
      const list = Array.isArray(res) ? res : (res?.coupons || res?.value || []);
      if (Array.isArray(list) && list.length > 0) {
        setPromotions(list);
        try {
          localStorage.setItem('bv_sync_promotions', JSON.stringify(list));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to fetch active coupons:', err);
    }
  }, []);

  useEffect(() => {
    if (backendEnabled) {
      fetchProductsFromBackend({ limit: 100 })
        .then((res) => {
          const liveList = res?.products || (Array.isArray(res) ? res : []);
          if (Array.isArray(liveList)) {
            const approvedList = liveList.filter(p => {
              const appStat = String(p.approvalStatus || '').toLowerCase();
              return appStat === 'approved';
            });
            setProducts(approvedList);
            try {
              localStorage.setItem('bv_sync_products', JSON.stringify(approvedList));
            } catch (e) {}
          }
        })
        .catch(() => {});

      fetchActivePromotions();
    }
  }, [fetchActivePromotions]);

  useEffect(() => {
    const handleCouponSync = (e) => {
      const raw = (e.detail && Array.isArray(e.detail) && e.detail.length > 0)
        ? e.detail
        : (() => {
            try {
              const saved = localStorage.getItem('bv_sync_promotions') || localStorage.getItem('admin_coupons');
              return saved ? JSON.parse(saved) : [];
            } catch (err) {
              return [];
            }
          })();

      if (Array.isArray(raw) && raw.length > 0) {
        setPromotions(raw);
      } else {
        fetchActivePromotions();
      }
    };
    window.addEventListener('bv_coupons_updated', handleCouponSync);
    window.addEventListener('adminCouponsUpdated', handleCouponSync);
    return () => {
      window.removeEventListener('bv_coupons_updated', handleCouponSync);
      window.removeEventListener('adminCouponsUpdated', handleCouponSync);
    };
  }, [fetchActivePromotions]);

  useEffect(() => {
    const handleSync = (e) => {
      const raw = (e.detail && Array.isArray(e.detail) && e.detail.length > 0)
        ? e.detail
        : (() => {
            try {
              const saved = localStorage.getItem('bv_sync_products') || localStorage.getItem('admin_products') || localStorage.getItem('bv_seller_products');
              return saved ? JSON.parse(saved) : [];
            } catch (err) {
              return [];
            }
          })();

      if (Array.isArray(raw)) {
        const approvedOnly = raw.filter(p => {
          const appStat = String(p.approvalStatus || '').toLowerCase();
          return appStat === 'approved';
        });
        setProducts(approvedOnly);
      }
    };
    window.addEventListener('bv_products_updated', handleSync);
    window.addEventListener('adminProductsUpdated', handleSync);
    return () => {
      window.removeEventListener('bv_products_updated', handleSync);
      window.removeEventListener('adminProductsUpdated', handleSync);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('book_vardi_seller_profile', JSON.stringify(sellerProfile));
    } catch (e) {
      console.error(e);
    }
  }, [sellerProfile]);

  const submitSellerApplication = (data) => {
    setSellerProfile(data);
    setSellerStatus('pending');
    setUserProfile((prev) => ({
      ...prev,
      sellerStatus: 'pending',
      isSeller: false
    }));

    // Register seller application to platform sync so admin console sees it in Sellers tab
    const newSellerEntry = {
      id: `SEL-${Math.floor(100 + Math.random() * 900)}`,
      name: data?.basicProfile?.name || data?.businessDetails?.legalName || userProfile?.name,
      businessName: data?.businessDetails?.legalName || data?.businessDetails?.tradeName,
      storeName: data?.storeDetails?.storeName || `${data?.basicProfile?.name || 'New'}'s Vardi Store`,
      email: data?.basicProfile?.email || userProfile?.email,
      phone: data?.basicProfile?.phone || userProfile?.phone,
      status: 'Pending',
      rating: 5.0,
      totalOrders: 0,
      revenue: 0,
      commissionRate: 8,
      payoutBalance: 0,
      category: data?.storeDetails?.primaryCategory,
      address: `${data?.addressDetails?.registeredAddress || ''}, ${data?.addressDetails?.city || ''}`,
      joinedDate: 'Today',
      onboardingStep: data?.currentStep || 12,
      rawApplication: data
    };

    showToast('Seller application submitted successfully! 🚀');
  };

  const approveSellerApplication = () => {
    setSellerStatus('approved');
    setUserProfile((prev) => ({
      ...prev,
      isSeller: true,
      sellerStatus: 'approved',
      role: prev.role === 'Student' || prev.role === 'Parent' ? 'Partner Merchant' : prev.role
    }));
    showToast('🎉 Congratulations! You are now an approved seller.');
  };

  // Non-blocking async helper for localStorage updates
  const setLocalStorageAsync = useCallback((key, data) => {
    if (typeof window === 'undefined') return;
    const task = () => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {}
    };
    if (window.requestIdleCallback) {
      window.requestIdleCallback(task, { timeout: 2000 });
    } else {
      setTimeout(task, 100);
    }
  }, []);

  // Sync to localStorage asynchronously
  useEffect(() => {
    setLocalStorageAsync('book_vardi_items_v2', cartItems);
  }, [cartItems, setLocalStorageAsync]);

  useEffect(() => {
    setLocalStorageAsync('book_vardi_wishlist_v2', wishlist);
  }, [wishlist, setLocalStorageAsync]);

  useEffect(() => {
    setLocalStorageAsync('book_vardi_user_profile', userProfile);
  }, [userProfile, setLocalStorageAsync]);

  useEffect(() => {
    setLocalStorageAsync('book_vardi_is_authenticated', isAuthenticated);
  }, [isAuthenticated, setLocalStorageAsync]);

  useEffect(() => {
    setLocalStorageAsync('book_vardi_product_reviews', productReviews);
  }, [productReviews, setLocalStorageAsync]);

  useEffect(() => {
    if (lastPlacedOrder) {
      setLocalStorageAsync('book_vardi_last_order', lastPlacedOrder);
    }
  }, [lastPlacedOrder, setLocalStorageAsync]);

  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      setLocalStorageAsync('bv_sync_products', products);
    }
  }, [products, setLocalStorageAsync]);

  useEffect(() => {
    if (Array.isArray(promotions) && promotions.length > 0) {
      setLocalStorageAsync('bv_sync_promotions', promotions);
    }
  }, [promotions, setLocalStorageAsync]);

  // Dynamic Free Shipping Threshold state (initialized from localStorage with fallback to 99)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_free_shipping_threshold');
      if (saved) return Number(JSON.parse(saved));
      const savedSettings = localStorage.getItem('admin_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.minOrderFreeShipping || parsed.freeShippingThreshold) {
          return Number(parsed.minOrderFreeShipping || parsed.freeShippingThreshold);
        }
      }
      return 500;
    } catch {
      return 500;
    }
  });

  useEffect(() => {
    if (backendEnabled) {
      fetchPublicSettingsFromBackend()
        .then((res) => {
          if (res && (res.minOrderFreeShipping !== undefined || res.freeShippingThreshold !== undefined)) {
            const val = Number(res.minOrderFreeShipping || res.freeShippingThreshold);
            if (val > 0) {
              setFreeShippingThreshold(val);
              try {
                localStorage.setItem('bv_free_shipping_threshold', JSON.stringify(val));
              } catch (e) {}
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && (e.detail.minOrderFreeShipping !== undefined || e.detail.freeShippingThreshold !== undefined)) {
        const val = Number(e.detail.minOrderFreeShipping || e.detail.freeShippingThreshold);
        if (val > 0) setFreeShippingThreshold(val);
      }
    };
    window.addEventListener('bv_settings_updated', handleSync);
    return () => window.removeEventListener('bv_settings_updated', handleSync);
  }, []);



  // Recently Viewed Product Tracking State
  const [recentlyViewedIds, setRecentlyViewedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_recently_viewed_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addRecentlyViewed = (productOrId) => {
    if (!productOrId) return;
    const id = typeof productOrId === 'object' ? (productOrId.id || productOrId._id) : productOrId;
    if (!id) return;
    const strId = String(id);
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((item) => String(item) !== strId);
      const updated = [strId, ...filtered].slice(0, 20);
      try {
        localStorage.setItem('bv_recently_viewed_ids', JSON.stringify(updated));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('bv_recently_viewed_updated', { detail: updated }));
      return updated;
    });
  };

  // Trigger temporary notification toast
  const hideToast = useCallback(() => {
    setToastState(null);
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    if (!message) return;
    setToastState({ message, type });
    setTimeout(() => {
      setToastState(null);
    }, duration);
  }, []);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      const msgStr = String(msg || '');
      let type = 'info';
      if (msgStr.includes('Error') || msgStr.includes('failed') || msgStr.includes('Invalid') || msgStr.includes('exceeds')) {
        type = 'error';
      } else if (msgStr.includes('Please') || msgStr.includes('Required') || msgStr.includes('Notice') || msgStr.includes('Quotation')) {
        type = 'warning';
      } else if (msgStr.includes('Success') || msgStr.includes('saved') || msgStr.includes('copied') || msgStr.includes('!') || msgStr.includes('Accepted')) {
        type = 'success';
      }
      showToast(msgStr, type);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  const openProductDetails = (product) => {
    if (product) {
      const isKit = product?.category === 'kits' || product?.bundleType === 'kit' || (Array.isArray(product?.kitItems) && product.kitItems.length > 0);
      if (isKit) {
        const appStat = String(product?.approvalStatus || product?.approval_status || '').toLowerCase().trim();
        if (appStat !== 'approved') {
          showToast('⚠️ This kit bundle is currently awaiting approval.');
          return;
        }
      }
    }
    setSelectedProduct(product);
    if (product) {
      addRecentlyViewed(product);
    }
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
  };

  const addToCart = (product, quantity = 1) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      showToast('Please log in to add stationery to your cart! 🛍️');
      return false;
    }

    const isKit = product?.category === 'kits' || product?.bundleType === 'kit' || (Array.isArray(product?.kitItems) && product.kitItems.length > 0);
    if (isKit) {
      const appStat = String(product?.approvalStatus || product?.approval_status || '').toLowerCase().trim();
      if (appStat !== 'approved') {
        showToast('⚠️ This kit bundle is awaiting approval and cannot be purchased yet.');
        return false;
      }
    }

    const isMeter = isUnstitchedItem(product);
    const qtyToAdd = typeof quantity === 'number' && quantity > 0
      ? (isMeter ? Math.round(quantity * 100) / 100 : quantity)
      : (isMeter ? (Number(product.minMeter) > 0 ? Number(product.minMeter) : 0.5) : 1);
    const prodId = product?.id !== undefined ? product.id : product?._id;
    const computedKey = getCartItemKey(product);
    const cartItemId = product?.cartItemId || computedKey;
    const inWishlist = wishlist.some((item) => String(item) === String(prodId));

    const itemStock = Number(
      product?.stock !== undefined
        ? product.stock
        : (product?.stockQuantity !== undefined ? product.stockQuantity : Infinity)
    );

    if (itemStock <= 0) {
      showToast(`⚠️ Sorry, "${product.name}${product.selectedSize ? ` (${product.selectedSize})` : ''}" is currently out of stock!`);
      return false;
    }

    const itemToAdd = {
      ...product,
      id: prodId,
      productId: prodId,
      cartItemId: cartItemId,
      selectedSize: isMeter ? undefined : (product?.selectedSize || undefined),
      selectedColor: product?.selectedColor || undefined,
      selectedVariant: product?.selectedVariant || undefined,
      variantName: isMeter ? undefined : (product?.variantName || product?.selectedVariant?.name || product?.selectedSize || undefined),
      stock: itemStock,
      stockQuantity: itemStock,
      quantity: qtyToAdd,
      isMeterBased: isMeter ? true : Boolean(product?.isMeterBased),
      unit: isMeter ? 'meter' : (product?.unit || 'piece'),
      selected: true
    };

    let reachedMaxStock = false;
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => (item.cartItemId || getCartItemKey(item)) === cartItemId);
      if (existingIndex > -1) {
        const existingQty = Number(prev[existingIndex].quantity) || 0;
        const newTotalQty = isMeter
          ? Math.round((existingQty + qtyToAdd) * 100) / 100
          : existingQty + qtyToAdd;
        if (itemStock !== Infinity && newTotalQty > itemStock) {
          reachedMaxStock = true;
          return prev.map((item, idx) =>
            idx === existingIndex
              ? { ...item, ...itemToAdd, quantity: Math.max(existingQty, itemStock), selected: true }
              : item
          );
        }
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, ...itemToAdd, quantity: newTotalQty, selected: true }
            : item
        );
      }
      return [...prev, itemToAdd];
    });

    const variantLabel = itemToAdd.variantName || itemToAdd.selectedSize || itemToAdd.selectedColor || '';
    const nameWithVariant = `${product.name}${variantLabel ? ` (${variantLabel})` : ''}`;

    if (reachedMaxStock) {
      showToast(`⚠️ Limited stock: Reached maximum available units (${itemStock}) for "${nameWithVariant}".`);
    } else if (inWishlist) {
      setWishlist((prev) => prev.filter((item) => String(item) !== String(prodId)));
      showToast(`Moved "${nameWithVariant}" from wishlist to your cart! 🛍️`);
    } else {
      showToast(`Added ${qtyToAdd > 1 ? `${qtyToAdd}x ` : ''}"${nameWithVariant}" to your cart!`);
    }

    if (backendEnabled) {
      const phone = userProfile?.phone || '';
      const userId = userProfile?.id || userProfile?._id || '';
      addToCartInBackend(itemToAdd, qtyToAdd, phone, userId)
        .then((res) => {
          if (res?.cart?.items && Array.isArray(res.cart.items)) {
            setCartItems(res.cart.items.map((it) => ({
              ...it,
              cartItemId: it.cartItemId || getCartItemKey(it)
            })));
          }
        })
        .catch((err) => {
          console.error('Add to cart backend error:', err);
        });

      if (inWishlist && prodId) {
        removeFromWishlistInBackend(prodId, phone, userId)
          .then((res) => {
            if (res?.productIds && Array.isArray(res.productIds)) {
              setWishlist(res.productIds);
            }
          })
          .catch(() => {});
      }
    }
    return true;
  };

  const removeFromWishlist = (id) => {
    if (!isAuthenticated) return false;
    const strId = String(id);
    const phone = userProfile?.phone || '';
    const userId = userProfile?.id || userProfile?._id || '';

    setWishlist((prev) => prev.filter((item) => {
      const itemId = typeof item === 'object' && item !== null ? (item.id || item._id || item.productId) : item;
      return String(itemId) !== strId;
    }));
    showToast('Removed item from your wishlist');

    if (backendEnabled) {
      removeFromWishlistInBackend(id, phone, userId)
        .then((res) => {
          if (res?.products && Array.isArray(res.products) && res.products.length > 0) {
            setWishlist(res.products);
          } else if (res?.productIds && Array.isArray(res.productIds)) {
            setWishlist(res.productIds);
          }
        })
        .catch(() => {});
    }
    return true;
  };

  const moveToCart = (product, quantity = 1) => {
    return addToCart(product, quantity);
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => {
      const itemKey = item.cartItemId || getCartItemKey(item);
      return String(itemKey) !== String(id) && String(item.id || item.productId || item._id) !== String(id);
    }));
    if (backendEnabled) {
      const phone = userProfile?.phone || '';
      const userId = userProfile?.id || userProfile?._id || '';
      removeFromCartInBackend(id, phone, userId)
        .then((res) => {
          if (res?.cart?.items && Array.isArray(res.cart.items)) {
            setCartItems(res.cart.items.map((it) => ({
              ...it,
              cartItemId: it.cartItemId || getCartItemKey(it)
            })));
          }
        })
        .catch((err) => {
          console.error('Remove from cart backend error:', err);
        });
    }
  };

  const updateQuantity = (id, delta) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      showToast('Please log in to manage your cart! 🛍️');
      return;
    }
    setCartItems((prev) =>
      prev
        .map((item) => {
          const itemKey = item.cartItemId || getCartItemKey(item);
          if (String(itemKey) === String(id) || String(item.id || item.productId || item._id) === String(id)) {
            const itemStock = Number(item.stock !== undefined ? item.stock : (item.stockQuantity !== undefined ? item.stockQuantity : Infinity));
            const isMeter = isUnstitchedItem(item);
            const minMeter = isMeter ? (Number(item.minMeter) > 0 ? Number(item.minMeter) : 0.5) : 1;
            const newQty = Math.round((Number(item.quantity) + delta) * 100) / 100;
            if (delta > 0 && itemStock !== Infinity && newQty > itemStock) {
              showToast(`⚠️ Only ${itemStock} units in stock for ${item.selectedSize ? `size ${item.selectedSize}` : 'this item'}.`);
              return item;
            }
            if (isMeter && newQty < minMeter && delta < 0) {
              return null;
            }
            return newQty > 0 ? { ...item, quantity: newQty, isMeterBased: isMeter ? true : Boolean(item.isMeterBased) } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
    if (backendEnabled) {
      const phone = userProfile?.phone || '';
      const userId = userProfile?.id || userProfile?._id || '';
      updateCartItemInBackend(id, delta, phone, userId)
        .then((res) => {
          if (res?.cart?.items && Array.isArray(res.cart.items)) {
            setCartItems(res.cart.items.map((it) => ({
              ...it,
              cartItemId: it.cartItemId || getCartItemKey(it)
            })));
          }
        })
        .catch((err) => {
          console.error('Update cart item backend error:', err);
        });
    }
  };

  const toggleWishlist = (idOrProduct, productObj = null) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      showToast('Please log in to save items to your wishlist! ❤️');
      return false;
    }

    let id;
    let product = productObj;

    if (typeof idOrProduct === 'object' && idOrProduct !== null) {
      product = idOrProduct;
      id = idOrProduct.id || idOrProduct._id || idOrProduct.productId;
    } else {
      id = idOrProduct;
    }

    if (!id && product) {
      id = product.id || product._id || product.productId;
    }

    const strTargetId = String(id);
    const phone = userProfile?.phone || '';
    const userId = userProfile?.id || userProfile?._id || '';

    setWishlist((prev) => {
      const exists = prev.some((item) => {
        const itemId = typeof item === 'object' && item !== null ? (item.id || item._id || item.productId) : item;
        return String(itemId) === strTargetId;
      });

      if (exists) {
        showToast('Removed item from your wishlist');
        return prev.filter((item) => {
          const itemId = typeof item === 'object' && item !== null ? (item.id || item._id || item.productId) : item;
          return String(itemId) !== strTargetId;
        });
      } else {
        showToast('Saved to your wishlist! ❤️');
        const itemToSave = product ? {
          id: strTargetId,
          _id: strTargetId,
          productId: strTargetId,
          name: product.name || product.title || 'Stationery Item',
          price: product.price !== undefined ? Number(product.price) : 0,
          originalPrice: product.originalPrice || product.mrp,
          image: getProductMainImage(product) || product.image || '',
          subtitle: product.subtitle || product.description || product.category || '',
          category: product.category || '',
          rating: product.rating || product.averageRating || 4.5,
          reviewsCount: product.reviewsCount || product.numReviews || 0,
          discountBadge: product.discountBadge || ''
        } : strTargetId;
        return [...prev, itemToSave];
      }
    });

    if (backendEnabled) {
      toggleWishlistInBackend(id, phone, userId, product)
        .then((res) => {
          if (res?.products && Array.isArray(res.products) && res.products.length > 0) {
            setWishlist(res.products);
          } else if (res?.productIds && Array.isArray(res.productIds)) {
            setWishlist(res.productIds);
          }
        })
        .catch((err) => {
          console.error('Wishlist backend sync error:', err);
        });
    }

    return true;
  };

  const isWishlisted = (id) => {
    if (!isAuthenticated || !id) return false;
    const strId = String(id);
    return wishlist.some((item) => {
      const itemId = typeof item === 'object' && item !== null ? (item.id || item._id || item.productId) : item;
      return String(itemId) === strId;
    });
  };

  const handleSetIsCartOpen = (open) => {
    if (typeof open === 'function') {
      setIsCartOpen((prev) => {
        const next = open(prev);
        if (next && !isAuthenticated) {
          openAuthModal('login');
          showToast('Please log in to access your cart! 🛍️');
          return false;
        }
        return next;
      });
      return;
    }
    if (open && !isAuthenticated) {
      openAuthModal('login');
      showToast('Please log in to access your cart! 🛍️');
      return;
    }
    setIsCartOpen(open);
  };

  const handleSetIsWishlistOpen = (open) => {
    if (typeof open === 'function') {
      setIsWishlistOpen((prev) => {
        const next = open(prev);
        if (next && !isAuthenticated) {
          openAuthModal('login');
          showToast('Please log in to view your liked items! ❤️');
          return false;
        }
        return next;
      });
      return;
    }
    if (open && !isAuthenticated) {
      openAuthModal('login');
      showToast('Please log in to view your liked items! ❤️');
      return;
    }
    setIsWishlistOpen(open);
  };

  const toggleCartItemSelection = (id) => {
    setCartItems((prev) =>
      prev.map((item) => {
        const itemKey = item.cartItemId || getCartItemKey(item);
        if (String(itemKey) === String(id) || String(item.id || item.productId || item._id) === String(id)) {
          return { ...item, selected: item.selected === false ? true : false };
        }
        return item;
      })
    );
  };

  const selectAllCartItems = (selectVal = true) => {
    setCartItems((prev) =>
      prev.map((item) => ({ ...item, selected: Boolean(selectVal) }))
    );
  };

  const displayedCartItems = isAuthenticated ? cartItems : [];
  const displayedWishlist = isAuthenticated ? wishlist : [];

  const selectedCartItems = displayedCartItems.filter((item) => item.selected !== false);
  const unselectedCartItems = displayedCartItems.filter((item) => item.selected === false);

  const totalItemsCount = Math.round(selectedCartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) * 100) / 100;
  const allCartItemsCount = Math.round(displayedCartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) * 100) / 100;
  const subtotal = Math.round(selectedCartItems.reduce((sum, item) => sum + Math.round(((Number(item.price) || 0) * (Number(item.quantity) || 1)) * 100) / 100, 0) * 100) / 100;
  const freeShippingProgress = Math.min(100, (subtotal / (freeShippingThreshold || 500)) * 100);
  const freeShippingRemaining = Math.max(0, Math.round(((freeShippingThreshold || 500) - subtotal) * 100) / 100);

  const wishlistProducts = (() => {
    if (!isAuthenticated || !displayedWishlist || displayedWishlist.length === 0) return [];

    const catalogProductsMap = new Map();

    (products || []).forEach(p => {
      const key = String(p.id || p._id || p.productId || '');
      if (key) catalogProductsMap.set(key, p);
    });

    try {
      const syncSaved = localStorage.getItem('bv_sync_products');
      if (syncSaved) {
        const syncList = JSON.parse(syncSaved);
        if (Array.isArray(syncList)) {
          syncList.forEach(p => {
            const key = String(p.id || p._id || p.productId || '');
            if (key && !catalogProductsMap.has(key)) catalogProductsMap.set(key, p);
          });
        }
      }
    } catch (e) {}

    return displayedWishlist.map((item) => {
      if (item && typeof item === 'object') {
        const itemKey = String(item.id || item._id || item.productId || '');
        const matchedInCatalog = catalogProductsMap.get(itemKey);
        return {
          id: itemKey || item.id || item._id,
          _id: itemKey || item._id || item.id,
          name: item.name || matchedInCatalog?.name || 'Liked Product',
          subtitle: item.subtitle || matchedInCatalog?.subtitle || matchedInCatalog?.category || '',
          price: item.price !== undefined ? Number(item.price) : (matchedInCatalog?.price || 0),
          originalPrice: item.originalPrice || matchedInCatalog?.originalPrice || matchedInCatalog?.mrp,
          image: getProductMainImage(item) || getProductMainImage(matchedInCatalog) || item.image || '',
          category: item.category || matchedInCatalog?.category || '',
          rating: item.rating !== undefined ? Number(item.rating) : (matchedInCatalog?.rating || matchedInCatalog?.averageRating || 4.5),
          reviewsCount: item.reviewsCount || matchedInCatalog?.reviewsCount || matchedInCatalog?.numReviews || 0,
          discountBadge: item.discountBadge || matchedInCatalog?.discountBadge || '',
          sizeVariants: item.sizeVariants || matchedInCatalog?.sizeVariants || []
        };
      }

      const strId = String(item);
      const matched = catalogProductsMap.get(strId);
      if (matched) {
        return {
          ...matched,
          id: matched.id || matched._id || strId,
          _id: matched._id || matched.id || strId,
          image: getProductMainImage(matched) || matched.image || ''
        };
      }

      return {
        id: strId,
        _id: strId,
        name: `Liked Item (${strId.slice(-6)})`,
        subtitle: 'Saved Item',
        price: 0,
        image: '',
        category: 'Stationery'
      };
    }).filter(Boolean);
  })();

  const updateProfile = async (updatedData) => {
    let nextProfile;
    setUserProfile((prev) => {
      nextProfile = { ...prev, ...updatedData };
      return nextProfile;
    });

    if (nextProfile) {
      setRegisteredUsers((prevUsers) =>
        prevUsers.map((u) => {
          const targetPhone = updatedData.phone || nextProfile?.phone || '';
          const targetEmail = updatedData.email || nextProfile?.email || '';
          const targetId = updatedData.id || nextProfile?.id || '';

          const phoneMatch = Boolean(targetPhone && u.phone && (u.phone === targetPhone || u.phone.endsWith(targetPhone.slice(-10))));
          const emailMatch = Boolean(targetEmail && u.email && u.email.toLowerCase() === targetEmail.toLowerCase());
          const idMatch = Boolean(targetId && (u.id === targetId || String(u.id) === String(targetId)));

          if (idMatch || emailMatch || phoneMatch) {
            return { ...u, ...updatedData, ...nextProfile };
          }
          return u;
        })
      );
    }

    if (backendEnabled) {
      try {
        const payload = {
          phone: nextProfile?.phone || userProfile?.phone,
          email: nextProfile?.email || userProfile?.email,
          ...updatedData
        };
        const res = await updateUserProfileInBackend(payload);
        if (res?.user) {
          setUserProfile((prev) => ({
            ...prev,
            ...res.user,
            id: res.user.id || res.user._id || prev?.id,
            addresses: (Array.isArray(res.user.addresses) && res.user.addresses.length > 0)
              ? res.user.addresses
              : (updatedData.addresses || prev?.addresses || [])
          }));
        }
      } catch (err) {
        console.error('Failed to update profile in backend:', err);
      }
    }
    showToast('Profile updated successfully! ✨');
  };

  const addAddress = async (newAddress) => {
    const formattedAddr = {
      id: newAddress.id || Date.now(),
      name: newAddress.name || userProfile?.name || '',
      phone: newAddress.phone || userProfile?.phone || '',
      addressLine: newAddress.addressLine || newAddress.street || '',
      street: newAddress.street || newAddress.addressLine || '',
      city: newAddress.city || '',
      state: newAddress.state || '',
      pincode: newAddress.pincode || '',
      landmark: newAddress.landmark || '',
      type: newAddress.type || newAddress.addressType || 'Home',
      addressType: newAddress.addressType || newAddress.type || 'Home',
      isDefault: Boolean(newAddress.isDefault)
    };

    setUserProfile((prev) => ({
      ...prev,
      addresses: [
        ...(prev?.addresses || []),
        formattedAddr
      ]
    }));

    if (backendEnabled) {
      try {
        const phone = userProfile?.phone || userProfile?.email || '';
        const res = await addAddressToBackend(formattedAddr, phone);
        if (res?.addresses && Array.isArray(res.addresses)) {
          setUserProfile((prev) => ({
            ...prev,
            addresses: res.addresses
          }));
        }
      } catch (err) {
        console.error('Failed to save address in backend:', err);
      }
    }
    showToast('New shipping address saved!');
  };

  const removeAddress = async (addressId) => {
    setUserProfile((prev) => ({
      ...prev,
      addresses: (prev?.addresses || []).filter(
        (addr) => addr.id !== addressId && String(addr.id || addr._id) !== String(addressId)
      )
    }));

    if (backendEnabled) {
      try {
        const phone = userProfile?.phone || userProfile?.email || '';
        const res = await deleteAddressInBackend(addressId, phone);
        if (res?.addresses && Array.isArray(res.addresses)) {
          setUserProfile((prev) => ({
            ...prev,
            addresses: res.addresses
          }));
        }
      } catch (err) {
        console.error('Failed to remove address in backend:', err);
      }
    }
    showToast('Address removed');
  };

  const editAddress = async (addressId, updatedAddressData) => {
    const formattedAddr = {
      ...updatedAddressData,
      id: addressId,
      name: updatedAddressData.name || userProfile?.name || '',
      phone: updatedAddressData.phone || userProfile?.phone || '',
      addressLine: updatedAddressData.addressLine || updatedAddressData.street || '',
      street: updatedAddressData.street || updatedAddressData.addressLine || '',
      city: updatedAddressData.city || '',
      state: updatedAddressData.state || '',
      pincode: updatedAddressData.pincode || '',
      landmark: updatedAddressData.landmark || '',
      type: updatedAddressData.type || updatedAddressData.addressType || 'Home',
      addressType: updatedAddressData.addressType || updatedAddressData.type || 'Home',
      isDefault: Boolean(updatedAddressData.isDefault)
    };

    setUserProfile((prev) => ({
      ...prev,
      addresses: (prev?.addresses || []).map((addr) => {
        if (addr.id === addressId || String(addr.id || addr._id) === String(addressId)) {
          return { ...addr, ...formattedAddr };
        }
        if (formattedAddr.isDefault) {
          return { ...addr, isDefault: false };
        }
        return addr;
      })
    }));

    if (backendEnabled) {
      try {
        const phone = userProfile?.phone || userProfile?.email || '';
        const res = await updateAddressInBackend(addressId, formattedAddr, phone);
        if (res?.addresses && Array.isArray(res.addresses)) {
          setUserProfile((prev) => ({
            ...prev,
            addresses: res.addresses
          }));
        }
      } catch (err) {
        console.error('Failed to update address in backend:', err);
      }
    }
    showToast('Address updated successfully!');
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (userData = {}) => {
    const email = (userData?.email || '').trim().toLowerCase();
    const password = String(userData?.password || '').trim();
    const phone = String(userData?.phone || '').replace(/\D/g, '');
    const otp = String(userData?.otp || '').trim();
    const verifiedUser = userData?.verifiedUser || null;

    if (backendEnabled && phone && (otp || verifiedUser)) {
      try {
        const response = otp ? await loginWithPhoneOtpBackend({ phone, otp }) : { user: verifiedUser };
        const apiUser = response?.user || verifiedUser || { ...userData, phone };
        const token = response?.token || userData?.token;
        if (token) {
          localStorage.setItem('book_vardi_auth_token', token);
          localStorage.setItem('token', token);
        }
        const resolvedProfile = {
          ...EMPTY_USER_PROFILE,
          id: apiUser.id || apiUser._id || `USR-${Date.now().toString().slice(-4)}`,
          name: apiUser.name || (phone ? `User ${phone.slice(-4)}` : ''),
          email: apiUser.email || email || '',
          phone: apiUser.phone || phone,
          institution: apiUser.institution || '',
          studentId: apiUser.studentId || '',
          standard: apiUser.standard || '',
          role: apiUser.role === 'admin' ? 'Admin' : 'Student',
          roles: apiUser.role === 'admin' ? ['Admin', 'Customer'] : ['Student', 'Customer'],
          isAdmin: apiUser.role === 'admin',
          adminStatus: apiUser.role === 'admin' ? 'approved' : 'none',
          adminRole: apiUser.role === 'admin' ? 'Admin' : null,
          isSeller: Boolean(apiUser.isSeller),
          sellerStatus: apiUser.sellerStatus || 'none',
          sellerRole: apiUser.sellerRole || null,
          addresses: Array.isArray(apiUser.addresses) ? apiUser.addresses : []
        };

        setIsAuthenticated(true);
        setUserProfile(resolvedProfile);
        closeAuthModal();
        showToast(`Welcome back${resolvedProfile.name ? `, ${resolvedProfile.name}` : ''}! ✨`);
        return true;
      } catch (error) {
        showToast(error.message || 'Unable to log in right now.');
        return false;
      }
    }

    if (backendEnabled && ((email && password) || (phone && password))) {
      try {
        const response = await loginWithBackend({ email, password, phone });
        const apiUser = response?.user || { ...userData, email: email || '' };
        const token = response?.token;
        if (token) {
          localStorage.setItem('book_vardi_auth_token', token);
          localStorage.setItem('token', token);
        }
        const resolvedProfile = {
          ...EMPTY_USER_PROFILE,
          id: apiUser.id || apiUser._id || `USR-${Date.now().toString().slice(-4)}`,
          name: apiUser.name || (email ? email.split('@')[0].replace('.', ' ') : ''),
          email: apiUser.email || email,
          phone: apiUser.phone || userData.phone || '',
          institution: apiUser.institution || '',
          studentId: apiUser.studentId || '',
          standard: apiUser.standard || '',
          role: apiUser.role === 'admin' ? 'Admin' : 'Student',
          roles: apiUser.role === 'admin' ? ['Admin', 'Customer'] : ['Student', 'Customer'],
          isAdmin: apiUser.role === 'admin',
          adminStatus: apiUser.role === 'admin' ? 'approved' : 'none',
          adminRole: apiUser.role === 'admin' ? 'Admin' : null,
          isSeller: Boolean(apiUser.isSeller),
          sellerStatus: apiUser.sellerStatus || 'none',
          sellerRole: apiUser.sellerRole || null,
          addresses: Array.isArray(apiUser.addresses) ? apiUser.addresses : []
        };

        setIsAuthenticated(true);
        setUserProfile(resolvedProfile);
        closeAuthModal();
        showToast(`Welcome back${resolvedProfile.name ? `, ${resolvedProfile.name}` : ''}! ✨`);
        return true;
      } catch (error) {
        showToast(error.message || 'Unable to log in right now.');
        return false;
      }
    }

    setIsAuthenticated(true);
    const matched = registeredUsers.find((u) => u.email && email && u.email.toLowerCase() === email.toLowerCase());

    let resolvedProfile;
    if (matched) {
      resolvedProfile = { ...EMPTY_USER_PROFILE, ...matched, ...userData };
    } else {
      resolvedProfile = {
        ...EMPTY_USER_PROFILE,
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: userData?.name || (email ? email.split('@')[0].replace('.', ' ') : ''),
        email: email || '',
        phone: userData?.phone || phone || '',
        role: 'Student',
        roles: ['Student', 'Customer'],
        isAdmin: false,
        adminStatus: 'none',
        adminRole: null,
        isSeller: false,
        sellerStatus: 'none',
        sellerRole: null,
        addresses: []
      };
    }

    setUserProfile(resolvedProfile);
    closeAuthModal();
    showToast(`Welcome back${resolvedProfile.name ? `, ${resolvedProfile.name}` : ''}! ✨`);
    return true;
  };

  const switchUser = (userIdOrEmail) => {
    const target = registeredUsers.find(
      (u) => u.id === userIdOrEmail || (u.email && u.email.toLowerCase() === String(userIdOrEmail).toLowerCase())
    );
    if (target) {
      setIsAuthenticated(true);
      setUserProfile({ ...EMPTY_USER_PROFILE, ...target });
      showToast(`Switched account to ${target.name} (${target.role}) 🔄`);
      return true;
    }
    return false;
  };

  const register = async (newUserData = {}, options = {}) => {
    const email = (newUserData?.email || '').trim().toLowerCase();
    const password = String(newUserData?.password || '').trim();
    const phone = String(newUserData?.phone || '').trim();

    if (backendEnabled) {
      try {
        const response = await registerWithBackend({
          name: newUserData.name || '',
          email: email || '',
          password: password || 'BookVardi@123',
          phone: phone || ''
        });

        const apiUser = response?.user || {
          id: `USR-${Date.now().toString().slice(-4)}`,
          name: newUserData.name || '',
          email: email || '',
          phone: phone || '',
          role: 'user'
        };

        const freshProfile = {
          ...EMPTY_USER_PROFILE,
          id: apiUser.id || apiUser._id || `USR-${Date.now().toString().slice(-4)}`,
          name: apiUser.name || newUserData.name || '',
          email: apiUser.email || email || '',
          phone: apiUser.phone || phone || '',
          institution: apiUser.institution || '',
          studentId: apiUser.studentId || '',
          standard: apiUser.standard || '',
          role: apiUser.role === 'admin' ? 'Admin' : 'Student',
          roles: apiUser.role === 'admin' ? ['Admin', 'Customer'] : ['Student', 'Customer'],
          isAdmin: apiUser.role === 'admin',
          adminStatus: apiUser.role === 'admin' ? 'approved' : 'none',
          adminRole: apiUser.role === 'admin' ? 'Admin' : null,
          isSeller: false,
          sellerStatus: 'none',
          sellerRole: null,
          memberSince: 'September 2026',
          rewardPoints: 0,
          orders: [],
          addresses: Array.isArray(apiUser.addresses) ? apiUser.addresses : []
        };

        setRegisteredUsers((prev) => [...prev, freshProfile]);
        setIsAuthenticated(true);
        setUserProfile(freshProfile);
        if (!options?.keepModalOpen) {
          closeAuthModal();
        }
        showToast(`🎉 Registration successful! Welcome, ${freshProfile.name || 'Student'}! ✨`);
        return freshProfile;
      } catch (error) {
        showToast(error.message || 'User already registered. Login please');
        throw error;
      }
    }

    const freshProfile = {
      ...EMPTY_USER_PROFILE,
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: newUserData.name || '',
      email: email || '',
      phone: phone || newUserData.phone || '',
      institution: '',
      studentId: '',
      standard: '',
      role: 'Student',
      roles: ['Student', 'Customer'],
      isAdmin: false,
      adminStatus: 'none',
      adminRole: null,
      isSeller: false,
      sellerStatus: 'none',
      sellerRole: null,
      memberSince: 'September 2026',
      rewardPoints: 0,
      orders: [],
      addresses: []
    };

    setRegisteredUsers((prev) => [...prev, freshProfile]);
    setIsAuthenticated(true);
    setUserProfile(freshProfile);
    if (!options?.keepModalOpen) {
      closeAuthModal();
    }
    setWishlist([]);
    setCartItems([]);
    try {
      localStorage.removeItem('book_vardi_wishlist_v2');
      localStorage.removeItem('book_vardi_items_v2');
    } catch (e) {}
    showToast(`🎉 Registration successful! Welcome, ${freshProfile.name || 'Student'}! ✨`);
    return freshProfile;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserProfile(EMPTY_USER_PROFILE);
    setWishlist([]);
    setCartItems([]);
    try {
      localStorage.removeItem('book_vardi_user_profile');
      localStorage.removeItem('book_vardi_is_authenticated');
      localStorage.removeItem('book_vardi_wishlist_v2');
      localStorage.removeItem('book_vardi_items_v2');
    } catch (e) {}
    showToast('Logged out successfully. See you soon! 👋');
  };

  const applyCoupon = async (codeRaw, customCartTotal, customCartItems) => {
    const code = (codeRaw || '').trim().toUpperCase();
    if (!code) {
      showToast('Please enter a coupon code.');
      return { success: false, message: 'Please enter a coupon code.' };
    }

    const effectiveCartItems = customCartItems !== undefined
      ? customCartItems
      : (selectedCartItems.length > 0 ? selectedCartItems : (cartItems.length > 0 ? cartItems : []));

    const effectiveCartTotal = customCartTotal !== undefined
      ? Number(customCartTotal)
      : (subtotal > 0
          ? subtotal
          : effectiveCartItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0));

    if (effectiveCartTotal <= 0 || effectiveCartItems.length === 0) {
      showToast('⚠️ Please add items to your cart before applying a coupon.');
      return { success: false, message: 'Please add items to your cart before applying a coupon.' };
    }

    // Try Backend API verification if backend is enabled
    if (backendEnabled) {
      try {
        const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${SERVER_URL}/coupons/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            cartTotal: effectiveCartTotal,
            cartItems: effectiveCartItems
          })
        });
        const data = await res.json();
        if (res.ok && data.success !== false && data.coupon) {
          const maxCap = Number(data.coupon.maxDiscount || data.maxDiscount || 0);
          const isCapped = Boolean(data.isCapped || (maxCap > 0 && data.discountAmount >= maxCap));
          const couponObj = {
            code: data.coupon.code,
            type: (data.coupon.type === 'fixed' || data.coupon.type === 'flat') ? 'flat' : 'percent',
            value: data.coupon.discount,
            discountAmount: data.discountAmount,
            eligibleSubtotal: data.eligibleSubtotal,
            minAmount: data.coupon.minAmount || 0,
            maxDiscount: maxCap,
            isCapped,
            applicableProducts: data.coupon.applicableProducts || [],
            applicableKits: data.coupon.applicableKits || [],
            createdRole: data.coupon.createdRole,
            sellerId: data.coupon.sellerId,
            label: `${data.coupon.code} Applied (${data.coupon.discount}${data.coupon.type === 'percentage' ? '%' : '₹'} off eligible items)`
          };
          setAppliedCoupon(couponObj);
          showToast(`🎉 Coupon ${code} applied! ₹${data.discountAmount} discount added${isCapped ? ` (Capped at Max ₹${maxCap} OFF)` : ''}.`);
          return { success: true, message: `Discount of ₹${data.discountAmount} applied!`, discountAmount: data.discountAmount };
        } else if (data.message) {
          showToast(`⚠️ ${data.message}`);
          return { success: false, message: data.message };
        }
      } catch (err) {
        console.warn('Backend coupon apply error, falling back to local evaluation:', err);
      }
    }

    // Local fallback evaluation
    const dynamicPromo = promotions.find(
      (p) => (p.code || '').toUpperCase() === code && p.status !== 'expired'
    );
    if (dynamicPromo) {
      const uLimit = Number(dynamicPromo.usageLimit || 0);
      const uCount = Number(dynamicPromo.usageCount || 0);
      if (uLimit > 0 && uCount >= uLimit) {
        showToast('⚠️ This coupon code has reached its maximum usage limit.');
        return { success: false, message: 'This coupon code has reached its maximum usage limit.' };
      }

      const isSeller = Boolean(dynamicPromo.sellerId || dynamicPromo.storeId || dynamicPromo.createdRole === 'seller');
      const targetSeller = dynamicPromo.sellerId || dynamicPromo.storeId;
      const applicableProds = dynamicPromo.specificProductId
        ? [String(dynamicPromo.specificProductId)]
        : (Array.isArray(dynamicPromo.applicableProducts) ? dynamicPromo.applicableProducts.map(String) : []);

      const eligibleItems = effectiveCartItems.filter((item) => {
        const itemSeller = item.sellerId || item.seller || item.storeId || item.userId;
        const itemProd = item.id || item._id || item.productId;
        if (isSeller) {
          if (targetSeller && String(itemSeller) !== String(targetSeller)) return false;
          if (applicableProds.length > 0 && !applicableProds.includes(String(itemProd))) return false;
          return true;
        } else {
          if (applicableProds.length > 0 && !applicableProds.includes(String(itemProd))) return false;
          return true;
        }
      });

      if (eligibleItems.length === 0) {
        showToast('⚠️ This coupon is not applicable to any items in your cart.');
        return { success: false, message: 'Coupon not applicable to items in cart.' };
      }

      const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
      const minVal = dynamicPromo.minOrderValue || dynamicPromo.minOrderAmount || dynamicPromo.minAmount || 0;

      if (eligibleSubtotal < minVal) {
        showToast(`⚠️ Minimum purchase of ₹${minVal} on eligible items is required to use this coupon.`);
        return { success: false, message: `Minimum purchase of ₹${minVal} on eligible items is required to use this coupon.` };
      }

      const isPercent = dynamicPromo.discountType === 'percentage' || dynamicPromo.type === 'percent';
      const discountVal = Number(dynamicPromo.discountValue) || Number(dynamicPromo.discount) || Number(dynamicPromo.value) || 0;
      let calculatedDiscount = isPercent
        ? Math.round(((eligibleSubtotal * discountVal) / 100) * 100) / 100
        : Math.min(eligibleSubtotal, discountVal);

      const maxCap = Number(dynamicPromo.maxDiscount || dynamicPromo.maxDiscountAmount || dynamicPromo.maxCap || 0);
      let isCapped = false;
      if (maxCap > 0 && calculatedDiscount > maxCap) {
        calculatedDiscount = maxCap;
        isCapped = true;
      }

      const coupon = {
        code: dynamicPromo.code,
        type: isPercent ? 'percent' : 'flat',
        value: discountVal,
        minAmount: minVal,
        maxDiscount: maxCap,
        usageLimit: uLimit,
        usageCount: uCount,
        isCapped,
        discountAmount: calculatedDiscount,
        eligibleSubtotal,
        applicableProducts: dynamicPromo.applicableProducts || [],
        applicableKits: dynamicPromo.applicableKits || [],
        createdRole: dynamicPromo.createdRole,
        sellerId: dynamicPromo.sellerId || dynamicPromo.storeId,
        label: dynamicPromo.title || `${code} Applied!`
      };
      setAppliedCoupon(coupon);
      showToast(`🎉 Coupon ${code} applied! ₹${calculatedDiscount} discount added${isCapped ? ` (Capped at Max ₹${maxCap} OFF)` : ''}.`);
      return { success: true, message: `${coupon.label} applied!`, discountAmount: calculatedDiscount };
    }

    showToast('❌ Invalid or expired coupon code.');
    return { success: false, message: 'Invalid or expired coupon code.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon code removed.');
  };

  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem('book_vardi_items_v2');
    } catch (e) {}
    if (backendEnabled) {
      const phone = userProfile?.phone || '';
      clearCartInBackend(phone).catch(() => {});
    }
    showToast('Cart cleared! 🛒');
  };

  const fetchReviewsForProduct = async (productId) => {
    if (!productId) return [];
    let list = [];
    if (backendEnabled) {
      try {
        const dbReviews = await fetchProductReviewsFromBackend(productId);
        if (Array.isArray(dbReviews)) {
          list = dbReviews;
          setProductReviews((prev) => ({
            ...prev,
            [productId]: dbReviews
          }));
        }
      } catch (err) {
        console.error('Failed to fetch reviews from backend DB:', err);
        list = productReviews[productId] || [];
      }
    } else {
      list = productReviews[productId] || [];
    }

    if (list) {
      const approvedList = list.filter((r) => r.status === 'approved' || !r.status);
      const count = approvedList.length;
      const avg = count > 0 ? Number((approvedList.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)) : 0;
      setProducts((prevProducts) => {
        let changed = false;
        const updated = prevProducts.map((p) => {
          if (String(p.id || p._id) === String(productId)) {
            if (p.averageRating === avg && (p.numReviews === count || p.reviewsCount === count)) return p;
            changed = true;
            return {
              ...p,
              rating: avg,
              averageRating: avg,
              numReviews: count,
              reviewsCount: count,
              reviews: count
            };
          }
          return p;
        });
        return changed ? updated : prevProducts;
      });
    }
    return list;
  };

  const addProductReview = async (productId, reviewData) => {
    const newReview = {
      id: Date.now(),
      name: reviewData.name || userProfile?.name || 'Verified Customer',
      institution: reviewData.institution || userProfile?.institution || 'Verified Customer',
      rating: Number(reviewData.rating) || 5,
      date: 'Just now',
      title: reviewData.title || '',
      comment: reviewData.comment || '',
      images: reviewData.images || [],
      status: 'pending',
      helpfulCount: 0
    };

    let currentReviews = productReviews[productId] || [];
    let updatedList = [newReview, ...currentReviews];

    setProductReviews((prev) => ({
      ...prev,
      [productId]: updatedList
    }));

    try {
      localStorage.setItem('bv_sync_reviews', JSON.stringify({ [productId]: updatedList }));
    } catch (e) {}

    if (backendEnabled) {
      try {
        const payload = {
          productId,
          rating: Number(reviewData.rating),
          comment: reviewData.comment,
          title: reviewData.title || '',
          userName: reviewData.name || userProfile?.name || 'Verified Customer',
          institution: reviewData.institution || userProfile?.institution || 'Verified Customer',
          images: reviewData.images || []
        };
        const userPhone = userProfile?.phone || '';
        const res = await addReviewToBackend(payload, userPhone);
        if (res?.review) {
          setProductReviews((prev) => {
            const list = prev[productId] || [];
            const filtered = list.filter((r) => r.id !== newReview.id);
            return {
              ...prev,
              [productId]: [res.review, ...filtered]
            };
          });
        }
        if (res?.averageRating !== undefined) {
          const newAvg = Number(res.averageRating);
          const newNum = Number(res.numReviews) || 1;
          setProducts((prevProducts) =>
            prevProducts.map((p) =>
              (p._id === productId || p.id === productId || String(p._id) === String(productId) || String(p.id) === String(productId))
                ? { ...p, averageRating: newAvg, rating: newAvg, numReviews: newNum }
                : p
            )
          );
          setSelectedProduct((prev) => {
            if (prev && (prev._id === productId || prev.id === productId || String(prev._id) === String(productId) || String(prev.id) === String(productId))) {
              return { ...prev, averageRating: newAvg, rating: newAvg, numReviews: newNum };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Failed to sync review with backend DB:', err);
      }
    }

    showToast('🌟 Review submitted! It will appear on the website once approved by the seller.');
    return newReview;
  };

  const generateProductOrderId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let prefix = '';
    for (let i = 0; i < 3; i++) {
      prefix += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    const num = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${num}`;
  };

  const placeOrder = (orderData) => {
    const randomId = generateProductOrderId();
    const randomTracking = orderData.trackingNumber || `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });

    const itemsToBuy = cartItems.filter((item) => item.selected !== false);
    const unselectedItems = cartItems.filter((item) => item.selected === false);

    const isCod = /cod|cash\s*on\s*delivery/i.test(String(orderData.paymentMethod || ''));
    const initialPaymentStatus = orderData.paymentStatus || (isCod ? 'Pending' : 'Paid');
    const sharedDeliveryOtp = String(Math.floor(1000 + Math.random() * 9000));

    const newOrder = {
      id: randomId,
      orderId: randomId,
      date: formattedDate,
      status: 'Pending',
      statusColor: 'amber',
      trackingNumber: randomTracking,
      courierName: orderData.courierName || 'N/A',
      deliveryMode: orderData.deliveryMode || 'pending_choice',
      paymentStatus: initialPaymentStatus,
      deliveryOtp: sharedDeliveryOtp,
      customer: {
        name: userProfile?.name || orderData?.shippingAddress?.name || 'Student Customer',
        email: userProfile?.email || orderData?.shippingAddress?.email || '',
        phone: userProfile?.phone || orderData?.shippingAddress?.phone || ''
      },
      sellerDetails: orderData.sellerDetails || null,
      selfDeliveryDetails: orderData.selfDeliveryDetails ? { ...orderData.selfDeliveryDetails, deliveryOtp: sharedDeliveryOtp } : { deliveryOtp: sharedDeliveryOtp },
      itemsCount: itemsToBuy.reduce((acc, item) => acc + item.quantity, 0),
      items: itemsToBuy.map((item) => ({
        ...item,
        status: item.status || 'pending',
        deliveryOtp: sharedDeliveryOtp
      })),
      subtotal: orderData.subtotal,
      shippingCost: orderData.shippingCost,
      discount: orderData.discount || 0,
      total: orderData.total,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      deliverySpeed: orderData.deliverySpeed || 'Standard Delivery',
      estimatedDelivery: orderData.estimatedDelivery || '3-5 Business Days',
      appliedCoupon: appliedCoupon?.code || null
    };

    // Save order into user profile
    setUserProfile((prev) => {
      const updatedOrders = [newOrder, ...(prev?.orders || [])];
      return {
        ...prev,
        rewardPoints: (prev?.rewardPoints || 0) + 50,
        orders: updatedOrders
      };
    });

    // Format new order for Admin and Seller portals
    const platformOrder = {
      id: randomId,
      orderId: randomId,
      customerName: userProfile?.name || 'Student Customer',
      customerEmail: userProfile?.email || 'customer@bookvardi.in',
      customerPhone: userProfile?.phone || '+91 98765 43210',
      school: userProfile?.institution || 'General Public',
      date: formattedDate,
      total: orderData.total,
      itemsCount: itemsToBuy.reduce((acc, item) => acc + item.quantity, 0),
      status: 'Pending',
      deliveryOtp: sharedDeliveryOtp,
      selfDeliveryDetails: orderData.selfDeliveryDetails ? { ...orderData.selfDeliveryDetails, deliveryOtp: sharedDeliveryOtp } : { deliveryOtp: sharedDeliveryOtp },
      paymentMethod: orderData.paymentMethod || 'UPI',
      paymentStatus: initialPaymentStatus,
      shippingAddress: typeof orderData.shippingAddress === 'object'
        ? `${orderData.shippingAddress.address || ''}, ${orderData.shippingAddress.city || ''} ${orderData.shippingAddress.pincode || ''}`
        : (orderData.shippingAddress || 'Customer Address'),
      trackingNumber: randomTracking,
      courierName: orderData.courierName || 'N/A',
      items: itemsToBuy.map((item) => ({
        ...item,
        id: item.id || item._id || item.productId,
        productId: item.productId || item.id || item._id,
        sellerId: item.sellerId || item.seller?._id || item.seller?.id || item.seller,
        sellerName: item.sellerName || item.storeName || item.seller?.storeName || item.seller?.name || (typeof item.seller === 'string' ? item.seller : ''),
        storeName: item.storeName || item.sellerName || item.seller?.storeName || item.seller?.name || (typeof item.seller === 'string' ? item.seller : ''),
        gst: item.gst ?? item.gstPercent ?? item.gstPercentage ?? item.gstRate ?? item.taxRate,
        gstPercent: item.gstPercent ?? item.gst ?? item.gstPercentage ?? item.gstRate ?? item.taxRate,
        gstPercentage: item.gstPercentage ?? item.gstPercent ?? item.gst ?? item.gstRate ?? item.taxRate,
        name: item.name,
        price: item.price,
        finalPrice: item.finalPrice || item.price,
        quantity: item.quantity,
        size: item.selectedSize || item.size || '',
        age: item.age || '',
        image: item.image,
        category: item.category || 'Stationery',
        status: item.status || 'pending',
        deliveryOtp: sharedDeliveryOtp
      }))
    };

    try {
      const existingAdminOrders = JSON.parse(localStorage.getItem('bv_admin_orders') || '[]');
      localStorage.setItem('bv_admin_orders', JSON.stringify([platformOrder, ...existingAdminOrders]));
    } catch (e) {}

    try {
      const existingSellerOrders = JSON.parse(localStorage.getItem('bv_seller_orders') || '[]');
      localStorage.setItem('bv_seller_orders', JSON.stringify([platformOrder, ...existingSellerOrders]));
    } catch (e) {}

    // Update product stock quantities locally and broadcast
    const updatedProducts = products.map((prod) => {
      const prodIdStr = String(prod.id || prod._id || '');
      const cartMatches = itemsToBuy.filter((c) => {
        const cartIdStr = String(c.id || c._id || c.productId || '');
        return (cartIdStr && prodIdStr && cartIdStr === prodIdStr) || (c.name && prod.name && c.name.trim().toLowerCase() === prod.name.trim().toLowerCase());
      });

      if (cartMatches.length > 0) {
        let totalOrdered = 0;
        let updatedVariants = Array.isArray(prod.sizeVariants)
          ? prod.sizeVariants.map((v) => ({ ...v }))
          : (Array.isArray(prod.variants) ? prod.variants.map((v) => ({ ...v })) : null);

        cartMatches.forEach((cartMatch) => {
          const orderedQty = Math.max(1, Number(cartMatch.quantity) || 1);
          totalOrdered += orderedQty;
          const targetSize = String(cartMatch.selectedSize || cartMatch.size || cartMatch.variantName || '').trim().toLowerCase();

          if (targetSize && updatedVariants) {
            updatedVariants = updatedVariants.map((v) => {
              const vSize = String(v.size || v.measureValue || v.name || '').trim().toLowerCase();
              if (vSize === targetSize) {
                const currentVStock = Number(v.stock !== undefined ? v.stock : (v.stockQuantity !== undefined ? v.stockQuantity : (prod.stock || 50)));
                const remainingVStock = Math.max(0, currentVStock - orderedQty);
                return { ...v, stock: remainingVStock, stockQuantity: remainingVStock };
              }
              return v;
            });
          }
        });

        // If product has variants, recalculate overall product stock from variants
        let remaining;
        if (updatedVariants && updatedVariants.length > 0) {
          remaining = updatedVariants.reduce((sum, v) => sum + Math.max(0, Number(v.stock !== undefined ? v.stock : (v.stockQuantity || 0))), 0);
        } else {
          const currentStock = Number(prod.stock !== undefined ? prod.stock : (prod.stockQuantity || 50));
          remaining = Math.max(0, currentStock - totalOrdered);
        }

        return {
          ...prod,
          stock: remaining,
          stockQuantity: remaining,
          inStock: remaining > 0,
          status: remaining > 0 ? (prod.status || 'active') : 'out-of-stock',
          sizeVariants: updatedVariants || prod.sizeVariants,
          variants: updatedVariants || prod.variants
        };
      }
      return prod;
    });

    setProducts(updatedProducts);

    // Keep selectedProduct in sync so the product details page updates immediately
    setSelectedProduct((prev) => {
      if (!prev) return null;
      const prevId = String(prev.id || prev._id || '');
      const match = updatedProducts.find((p) => String(p.id || p._id || '') === prevId);
      return match ? { ...prev, ...match } : prev;
    });

    try {
      localStorage.setItem('bv_sync_products', JSON.stringify(updatedProducts));
    } catch (e) {}

    setLastPlacedOrder(newOrder);
    setCartItems(unselectedItems);
    setAppliedCoupon(null);

    if (backendEnabled) {
      const userPhone = userProfile?.phone || orderData?.shippingAddress?.phone || '';
      createOrderInBackend(newOrder, userPhone)
        .then((res) => {
          if (res?.order) {
            console.log('🌐 [FRONTEND API] Order created in backend DB:', res.order);
          }
          fetchUserOrders(userPhone);
        })
        .catch((err) => {
          console.error('Failed to save order to backend DB:', err);
          fetchUserOrders(userPhone);
        });

      clearCartInBackend(userPhone)
        .then((res) => {
          console.log('🌐 [FRONTEND API] Backend cart cleared successfully:', res);
        })
        .catch((err) => {
          console.error('Failed to clear backend cart:', err);
        });
    }

    showToast(`🎉 Order ${randomId} placed successfully! +50 Points earned.`);
    return newOrder;
  };

  const profileCompletenessInfo = useMemo(() => getProfileCompleteness(userProfile), [userProfile]);

  const contextValue = useMemo(() => ({
    products,
    promotions,
    cartItems,
    selectedCartItems,
    allCartItemsCount,
    toggleCartItemSelection,
    selectAllCartItems,
    wishlist,
    wishlistProducts,
    isWishlisted,
    userProfile,
    setUserProfile,
    fetchUserOrders,
    updateProfile,
    profileCompleteness: profileCompletenessInfo,
    isProfileIncomplete: profileCompletenessInfo.isIncomplete,
    getProfileCompleteness,
    addAddress,
    editAddress,
    removeAddress,
    isCartOpen,
    isWishlistOpen,
    toastMessage,
    toastState,
    hideToast,
    totalItemsCount,
    subtotal,
    freeShippingThreshold,
    freeShippingProgress,
    freeShippingRemaining,
    setIsCartOpen,
    setIsWishlistOpen,
    addToCart,
    moveToCart,
    removeFromCart,
    clearCart,
    updateQuantity,
    toggleWishlist,
    removeFromWishlist,
    showToast,
    isAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout,
    selectedProduct,
    openProductDetails,
    closeProductDetails,
    recentlyViewedIds,
    addRecentlyViewed,
    productReviews,
    addProductReview,
    fetchReviewsForProduct,
    lastPlacedOrder,
    setLastPlacedOrder,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    fetchActivePromotions,
    placeOrder,
    sellerStatus,
    setSellerStatus,
    sellerProfile,
    isSeller,
    isSellerModalOpen,
    setIsSellerModalOpen,
    submitSellerApplication,
    approveSellerApplication,
    isAdmin,
    adminStatus,
    setAdminStatus,
    USERS: registeredUsers,
    registeredUsers,
    isUserRegistered,
    switchUser
  }), [
    products,
    promotions,
    cartItems,
    selectedCartItems,
    allCartItemsCount,
    wishlist,
    wishlistProducts,
    userProfile,
    profileCompletenessInfo,
    isCartOpen,
    isWishlistOpen,
    toastMessage,
    toastState,
    totalItemsCount,
    subtotal,
    freeShippingThreshold,
    freeShippingProgress,
    freeShippingRemaining,
    isAuthenticated,
    isAuthModalOpen,
    authMode,
    selectedProduct,
    recentlyViewedIds,
    productReviews,
    lastPlacedOrder,
    appliedCoupon,
    fetchActivePromotions,
    sellerStatus,
    sellerProfile,
    isSeller,
    isSellerModalOpen,
    isAdmin,
    adminStatus,
    registeredUsers
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    console.warn('useCart was invoked outside a CartProvider or during context initialization. Returning safe fallback context.');
    return {
      products: [],
      promotions: [],
      cartItems: [],
      wishlist: [],
      wishlistProducts: [],
      isWishlisted: () => false,
      userProfile: EMPTY_USER_PROFILE,
      setUserProfile: () => {},
      updateProfile: () => {},
      profileCompleteness: { isIncomplete: false, percentage: 100, missing: [], completedFields: 5, totalFields: 5 },
      isProfileIncomplete: false,
      getProfileCompleteness: () => ({ isIncomplete: false, percentage: 100, missing: [], completedFields: 5, totalFields: 5 }),
      addAddress: () => {},
      editAddress: () => {},
      removeAddress: () => {},
      isCartOpen: false,
      isWishlistOpen: false,
      toastMessage: null,
      totalItemsCount: 0,
      subtotal: 0,
      freeShippingThreshold: 500,
      freeShippingProgress: 0,
      freeShippingRemaining: 500,
      setIsCartOpen: () => {},
      setIsWishlistOpen: () => {},
      addToCart: () => {},
      moveToCart: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      updateQuantity: () => {},
      toggleWishlist: () => {},
      removeFromWishlist: () => {},
      showToast: () => {},
      isAuthenticated: false,
      isAuthModalOpen: false,
      setIsAuthModalOpen: () => {},
      authMode: 'login',
      setAuthMode: () => {},
      openAuthModal: () => {},
      closeAuthModal: () => {},
      login: () => {},
      register: () => {},
      logout: () => {},
      selectedProduct: null,
      openProductDetails: () => {},
      closeProductDetails: () => {},
      recentlyViewedIds: [],
      addRecentlyViewed: () => {},
      productReviews: {},
      addProductReview: () => {},
      fetchReviewsForProduct: () => {},
      lastPlacedOrder: null,
      setLastPlacedOrder: () => {},
      appliedCoupon: null,
      applyCoupon: () => {},
      removeCoupon: () => {},
      placeOrder: () => {},
      sellerStatus: 'none',
      setSellerStatus: () => {},
      sellerProfile: null,
      isSeller: false,
      isSellerModalOpen: false,
      setIsSellerModalOpen: () => {},
      submitSellerApplication: () => {},
      approveSellerApplication: () => {},
      isAdmin: false,
      adminStatus: 'none',
      setAdminStatus: () => {},
      USERS: [],
      registeredUsers: [],
      isUserRegistered: () => false,
      switchUser: () => {}
    };
  }
  return context;
}
