import React, { createContext, useContext, useState, useEffect } from 'react';
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
  deleteReviewInBackend
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

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Initialize from localStorage if available
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_items_v2');
      return saved ? JSON.parse(saved) : [];
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
  const [toastMessage, setToastMessage] = useState(null);

  // Dynamic Products and Promotions from global platform sync
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_sync_products');
      return saved ? JSON.parse(saved) : [];
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
          if (res?.productIds && Array.isArray(res.productIds)) {
            setWishlist(res.productIds);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, userProfile?.phone, userProfile?.id]);

  useEffect(() => {
    if (backendEnabled && isAuthenticated && (userProfile?.phone || userProfile?.id)) {
      const phone = userProfile?.phone || '';
      const userId = userProfile?.id || userProfile?._id || '';
      fetchCartFromBackend(phone, userId)
        .then((res) => {
          if (res?.cart?.items && Array.isArray(res.cart.items)) {
            setCartItems(res.cart.items);
          }
        })
        .catch(() => {});

      fetchMyOrdersFromBackend(phone)
        .then((orders) => {
          if (Array.isArray(orders) && orders.length > 0) {
            setUserProfile((prev) => ({
              ...prev,
              orders
            }));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, userProfile?.phone, userProfile?.id]);

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
      name: data?.basicProfile?.name || data?.businessDetails?.legalName || userProfile?.name || 'New Merchant',
      businessName: data?.businessDetails?.legalName || data?.businessDetails?.tradeName || 'New Store',
      storeName: data?.storeDetails?.storeName || `${data?.basicProfile?.name || 'New'}'s Vardi Store`,
      email: data?.basicProfile?.email || userProfile?.email || 'seller@bookvardi.in',
      phone: data?.basicProfile?.phone || userProfile?.phone || '+91 98000 00000',
      status: 'Pending',
      rating: 5.0,
      totalOrders: 0,
      revenue: 0,
      commissionRate: 8,
      payoutBalance: 0,
      category: data?.storeDetails?.primaryCategory || 'Uniforms & Stationery',
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

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('book_vardi_items_v2', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('book_vardi_wishlist_v2', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('book_vardi_user_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.error(e);
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('book_vardi_is_authenticated', JSON.stringify(isAuthenticated));
    } catch (e) {
      console.error(e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem('book_vardi_product_reviews', JSON.stringify(productReviews));
    } catch (e) {
      console.error(e);
    }
  }, [productReviews]);

  useEffect(() => {
    try {
      if (lastPlacedOrder) {
        localStorage.setItem('book_vardi_last_order', JSON.stringify(lastPlacedOrder));
      }
    } catch (e) {
      console.error(e);
    }
  }, [lastPlacedOrder]);

  useEffect(() => {
    try {
      localStorage.setItem('bv_sync_products', JSON.stringify(products));
    } catch (e) {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('bv_sync_promotions', JSON.stringify(promotions));
    } catch (e) {}
  }, [promotions]);



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

  // Trigger temporary notification
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const openProductDetails = (product) => {
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
    const qtyToAdd = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
    const prodId = product?.id !== undefined ? product.id : product?._id;
    const inWishlist = wishlist.some((item) => String(item) === String(prodId));

    setCartItems((prev) => {
      const existing = prev.find((item) => String(item.id) === String(product.id));
      if (existing) {
        return prev.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }
      return [...prev, { ...product, quantity: qtyToAdd }];
    });

    if (inWishlist) {
      setWishlist((prev) => prev.filter((item) => String(item) !== String(prodId)));
      showToast(`Moved "${product.name}" from wishlist to your cart! 🛍️`);
    } else {
      showToast(`Added ${qtyToAdd > 1 ? `${qtyToAdd}x ` : ''}"${product.name}" to your cart!`);
    }

    if (backendEnabled) {
      const phone = userProfile?.phone || '';
      const userId = userProfile?.id || userProfile?._id || '';
      addToCartInBackend(product, qtyToAdd, phone, userId)
        .then((res) => {
          if (res?.cart?.items && Array.isArray(res.cart.items)) {
            setCartItems(res.cart.items);
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

    setWishlist((prev) => prev.filter((item) => String(item) !== strId));
    showToast('Removed item from your wishlist');

    if (backendEnabled) {
      removeFromWishlistInBackend(id, phone, userId)
        .then((res) => {
          if (res?.productIds && Array.isArray(res.productIds)) {
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
    setCartItems((prev) => prev.filter((item) => String(item.id || item.productId || item._id) !== String(id)));
    if (backendEnabled) {
      const phone = userProfile?.phone || '';
      const userId = userProfile?.id || userProfile?._id || '';
      removeFromCartInBackend(id, phone, userId)
        .then((res) => {
          if (res?.cart?.items && Array.isArray(res.cart.items)) {
            setCartItems(res.cart.items);
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
          if (String(item.id || item.productId || item._id) === String(id)) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
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
            setCartItems(res.cart.items);
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

    const numId = isNaN(id) ? id : Number(id);
    const phone = userProfile?.phone || '';
    const userId = userProfile?.id || userProfile?._id || '';

    setWishlist((prev) => {
      const exists = prev.some((item) => String(item) === String(id));
      if (exists) {
        showToast('Removed item from your wishlist');
        return prev.filter((item) => String(item) !== String(id));
      } else {
        showToast('Saved to your wishlist! ❤️');
        return [...prev, numId];
      }
    });

    if (backendEnabled) {
      toggleWishlistInBackend(id, phone, userId, product)
        .then((res) => {
          if (res?.productIds && Array.isArray(res.productIds)) {
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
    if (!isAuthenticated) return false;
    return wishlist.some((item) => String(item) === String(id));
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

  const displayedCartItems = isAuthenticated ? cartItems : [];
  const displayedWishlist = isAuthenticated ? wishlist : [];

  const wishlistProducts = (products || []).filter((product) =>
    displayedWishlist.some((id) => Number(id) === Number(product.id))
  );

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

  const totalItemsCount = displayedCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = displayedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShippingThreshold = 499.00;
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);

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

  const register = async (newUserData = {}) => {
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
        closeAuthModal();
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
    closeAuthModal();
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

  const applyCoupon = (codeRaw) => {
    const code = (codeRaw || '').trim().toUpperCase();
    if (!code) {
      showToast('Please enter a coupon code.');
      return { success: false, message: 'Please enter a coupon code.' };
    }

    // Check dynamic promotions synced from Admin & Seller portals
    const dynamicPromo = promotions.find(
      (p) => (p.code || '').toUpperCase() === code && p.status !== 'expired'
    );
    if (dynamicPromo) {
      if (dynamicPromo.minOrderValue && subtotal < dynamicPromo.minOrderValue) {
        showToast(`⚠️ ${code} requires a minimum order of ₹${dynamicPromo.minOrderValue}.`);
        return { success: false, message: `Minimum cart value of ₹${dynamicPromo.minOrderValue} required.` };
      }
      const isPercent = dynamicPromo.discountType === 'percentage' || dynamicPromo.type === 'percent';
      const coupon = {
        code: dynamicPromo.code,
        type: isPercent ? 'percent' : 'flat',
        value: Number(dynamicPromo.discountValue) || Number(dynamicPromo.value) || 10,
        label: dynamicPromo.title || `${code} Applied!`
      };
      setAppliedCoupon(coupon);
      showToast(`🎉 Coupon ${code} applied! Discount added.`);
      return { success: true, message: `${coupon.label} applied!` };
    }

    if (code === 'SCHOOL10') {
      const coupon = {
        code: 'SCHOOL10',
        type: 'percent',
        value: 10,
        label: '10% Student Discount'
      };
      setAppliedCoupon(coupon);
      showToast('🎉 Coupon SCHOOL10 applied! 10% discount added.');
      return { success: true, message: '10% student discount applied!' };
    }

    if (code === 'STUDENT50') {
      if (subtotal < 399) {
        showToast('⚠️ STUDENT50 requires a minimum order of ₹399.');
        return { success: false, message: 'Minimum cart value of ₹399 required for STUDENT50.' };
      }
      const coupon = {
        code: 'STUDENT50',
        type: 'flat',
        value: 50,
        label: '₹50 Flat Student Discount'
      };
      setAppliedCoupon(coupon);
      showToast('🎉 Coupon STUDENT50 applied! ₹50 off.');
      return { success: true, message: '₹50 flat student discount applied!' };
    }

    if (code === 'FREESHIP') {
      const coupon = {
        code: 'FREESHIP',
        type: 'freeship',
        value: 0,
        label: '100% Free Shipping'
      };
      setAppliedCoupon(coupon);
      showToast('🚚 Coupon FREESHIP applied! Free delivery unlocked.');
      return { success: true, message: 'Free shipping applied!' };
    }

    showToast('❌ Invalid coupon code. Try SCHOOL10 or STUDENT50.');
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

  const placeOrder = (orderData) => {
    const randomId = `SC-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomTracking = `BLUEDART-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const newOrder = {
      id: randomId,
      date: formattedDate,
      status: 'Processing',
      statusColor: 'blue',
      trackingNumber: randomTracking,
      itemsCount: cartItems.reduce((acc, item) => acc + item.quantity, 0),
      items: [...cartItems],
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
      customerName: userProfile?.name || 'Student Customer',
      customerEmail: userProfile?.email || 'customer@bookvardi.in',
      customerPhone: userProfile?.phone || '+91 98765 43210',
      school: userProfile?.institution || 'General Public',
      date: formattedDate,
      total: orderData.total,
      itemsCount: cartItems.reduce((acc, item) => acc + item.quantity, 0),
      status: 'Processing',
      paymentMethod: orderData.paymentMethod || 'UPI',
      paymentStatus: 'Paid',
      shippingAddress: typeof orderData.shippingAddress === 'object'
        ? `${orderData.shippingAddress.address || ''}, ${orderData.shippingAddress.city || ''} ${orderData.shippingAddress.pincode || ''}`
        : (orderData.shippingAddress || 'Customer Address'),
      trackingNumber: randomTracking,
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        category: item.category || 'Stationery'
      }))
    };

    // Update product stock quantities locally and broadcast
    const updatedProducts = products.map((prod) => {
      const cartMatch = cartItems.find((c) => Number(c.id) === Number(prod.id));
      if (cartMatch) {
        const remaining = Math.max(0, (Number(prod.stockQuantity) || 50) - cartMatch.quantity);
        return {
          ...prod,
          stockQuantity: remaining,
          inStock: remaining > 0
        };
      }
      return prod;
    });

    setProducts(updatedProducts);

    setLastPlacedOrder(newOrder);
    setCartItems([]);
    setAppliedCoupon(null);

    if (backendEnabled) {
      const userPhone = userProfile?.phone || orderData?.shippingAddress?.phone || '';
      createOrderInBackend(newOrder, userPhone)
        .then((res) => {
          if (res?.order) {
            console.log('🌐 [FRONTEND API] Order created in backend DB:', res.order);
          }
        })
        .catch((err) => {
          console.error('Failed to save order to backend DB:', err);
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

  return (
    <CartContext.Provider
      value={{
        products,
        promotions,
        cartItems,
        wishlist,
        wishlistProducts,
        isWishlisted,
        userProfile,
        setUserProfile,
        updateProfile,
        profileCompleteness: getProfileCompleteness(userProfile),
        isProfileIncomplete: getProfileCompleteness(userProfile).isIncomplete,
        getProfileCompleteness,
        addAddress,
        editAddress,
        removeAddress,
        isCartOpen,
        isWishlistOpen,
        toastMessage,
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
