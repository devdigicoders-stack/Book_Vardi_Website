import React, { createContext, useContext, useState, useEffect } from 'react';
import { USERS, MOCK_USER_PROFILE, ALL_PRODUCTS, PROMOTIONS, ORDERS as MOCK_ORDERS } from '../data/mockData';
import { pushPlatformSync, usePlatformSyncListener } from '../utils/syncBridge';
import {
  backendEnabled,
  loginWithBackend,
  loginWithPhoneOtpBackend,
  registerWithBackend
} from '../utils/api';

const INITIAL_MOCK_REVIEWS = {
  1: [
    {
      id: 101,
      name: 'Aanya Sharma',
      institution: 'IIT Delhi',
      rating: 5,
      date: '2 days ago',
      title: 'Best notebook for engineering math & note-taking!',
      comment: 'The 100 GSM paper has zero bleedthrough even with gel pens and mild highlighters. The spiral binding lays flat perfectly on lecture desks.',
      helpfulCount: 28
    },
    {
      id: 102,
      name: 'Rohan Verma',
      institution: "St. Stephen's College",
      rating: 5,
      date: '1 week ago',
      title: 'Smooth, durable cover & premium feel',
      comment: 'Been using this for my semester notes. The micro-perforated edges make tearing out summary sheets super clean without ripping.',
      helpfulCount: 15
    },
    {
      id: 103,
      name: 'Priya Nair',
      institution: 'DPS R.K. Puram',
      rating: 4,
      date: '2 weeks ago',
      title: 'Great quality, highly recommend for students',
      comment: 'Very aesthetic pastel look and great line spacing. Fits easily into my backpack.',
      helpfulCount: 9
    }
  ],
  2: [
    {
      id: 201,
      name: 'Arjun Mehta',
      institution: 'BITS Pilani',
      rating: 5,
      date: '3 days ago',
      title: 'Incredible ink flow! No smudging during rapid exams',
      comment: 'These 0.5mm gel pens write like butter. Fast drying ink means no blue smudges across my hand during long 3-hour exam sessions.',
      helpfulCount: 42
    },
    {
      id: 202,
      name: 'Kavya Iyer',
      institution: 'Miranda House',
      rating: 5,
      date: '2 weeks ago',
      title: 'Favorite pen set of the year',
      comment: 'The matte barrels are so comfortable to hold. 10 pens for ₹249 is an absolute steal for this quality.',
      helpfulCount: 19
    }
  ],
  3: [
    {
      id: 301,
      name: 'Sneha Patel',
      institution: 'National Law University',
      rating: 5,
      date: 'Yesterday',
      title: 'Soft pastel shades that do not bleed or distract',
      comment: 'Unlike neon highlighters that hurt your eyes, these pastel tones are calm, legible and do not soak through standard textbook pages.',
      helpfulCount: 34
    },
    {
      id: 302,
      name: 'Varun Rao',
      institution: 'Symbiosis Pune',
      rating: 4,
      date: '5 days ago',
      title: 'Great chisel tip for thin & thick highlighting',
      comment: 'Very versatile tip. Perfect for law case briefs and textbook margins.',
      helpfulCount: 11
    }
  ],
  4: [
    {
      id: 401,
      name: 'Meera Sen',
      institution: 'SRCC Delhi',
      rating: 5,
      date: '4 days ago',
      title: 'Keeps my study desk spotless and organized',
      comment: 'Has separate slots for pens, sticky notes, phone stand, and calculator. Extremely sturdy and looks beautiful on my desk.',
      helpfulCount: 22
    }
  ]
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Initialize from localStorage if available
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_items_v2');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          name: 'Minimal Spiral Notebook',
          subtitle: 'Ruled Pages • 160 Pages',
          price: 199,
          originalPrice: 299,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500&auto=format&fit=crop&q=80'
        },
        {
          id: 3,
          name: 'Pastel Highlighters Set',
          subtitle: 'Chisel Tip • 6 Colors',
          price: 189,
          originalPrice: 299,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=500&auto=format&fit=crop&q=80'
        }
      ];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_wishlist_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.map(Number) : [1, 3, 6];
      }
      return [1, 3, 6];
    } catch {
      return [1, 3, 6];
    }
  });

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        const matched = USERS.find((u) => u.email?.toLowerCase() === parsed?.email?.toLowerCase());
        return matched ? { ...matched, ...parsed } : parsed;
      }
      return MOCK_USER_PROFILE;
    } catch {
      return MOCK_USER_PROFILE;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_is_authenticated');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
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
      return saved ? JSON.parse(saved) : ALL_PRODUCTS;
    } catch {
      return ALL_PRODUCTS;
    }
  });

  const [promotions, setPromotions] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_sync_promotions');
      return saved ? JSON.parse(saved) : (PROMOTIONS || []);
    } catch {
      return PROMOTIONS || [];
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

  // Seller status & authorization state (derived from current user profile)
  const [sellerStatus, setSellerStatus] = useState(() => {
    try {
      const saved = localStorage.getItem('book_vardi_seller_status');
      if (saved) return JSON.parse(saved);
      return userProfile?.sellerStatus || (userProfile?.isSeller ? 'approved' : 'none');
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

  // Approved seller check: user must be an approved seller in mockData
  const isSeller = Boolean(
    isAuthenticated && (
      (userProfile?.isSeller === true && (userProfile?.sellerStatus === 'approved' || sellerStatus === 'approved')) ||
      (sellerStatus === 'approved' && ['Partner Merchant', 'Store Manager', 'Catalog Specialist', 'Logistics Lead', 'Seller'].includes(userProfile?.role))
    )
  );

  // Synchronize role status flags whenever userProfile updates
  useEffect(() => {
    if (userProfile) {
      const currentAdminStat = userProfile.adminStatus || (userProfile.isAdmin ? 'approved' : 'none');
      const currentSellerStat = userProfile.sellerStatus || (userProfile.isSeller ? 'approved' : 'none');
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

    pushPlatformSync({
      sellers: [newSellerEntry]
    });

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

  // Real-time synchronization subscription across ports & tabs
  usePlatformSyncListener((incoming) => {
    if (!incoming) return;
    if (incoming.products && Array.isArray(incoming.products)) {
      setProducts(incoming.products);
    }
    if (incoming.promotions && Array.isArray(incoming.promotions)) {
      setPromotions(incoming.promotions);
    }
    if (incoming.reviews) {
      setProductReviews((prev) => ({ ...prev, ...incoming.reviews }));
    }
    // If an admin approved or verified this user's seller store
    if (incoming.sellers && Array.isArray(incoming.sellers)) {
      const currentEmail = userProfile?.email?.toLowerCase();
      const matchingSeller = incoming.sellers.find(
        (s) => s.email?.toLowerCase() === currentEmail || (sellerProfile && s.storeName === sellerProfile.storeName)
      );
      if (matchingSeller) {
        if (matchingSeller.status === 'Verified' || matchingSeller.status === 'Approved') {
          setSellerStatus('approved');
          setUserProfile((prev) => ({
            ...prev,
            isSeller: true,
            sellerStatus: 'approved'
          }));
        } else if (matchingSeller.status === 'Rejected') {
          setSellerStatus('rejected');
          setUserProfile((prev) => ({
            ...prev,
            isSeller: false,
            sellerStatus: 'rejected'
          }));
        }
      }
    }
    // Update tracking status of user's orders if updated by seller or admin
    if (incoming.orders && Array.isArray(incoming.orders)) {
      setUserProfile((prev) => {
        if (!prev || !prev.orders || prev.orders.length === 0) return prev;
        let modified = false;
        const newOrders = prev.orders.map((userOrd) => {
          const matched = incoming.orders.find((o) => o.id === userOrd.id);
          if (matched && (matched.status !== userOrd.status || matched.trackingNumber !== userOrd.trackingNumber)) {
            modified = true;
            return {
              ...userOrd,
              status: matched.status || userOrd.status,
              trackingNumber: matched.trackingNumber || userOrd.trackingNumber
            };
          }
          return userOrd;
        });
        return modified ? { ...prev, orders: newOrders } : prev;
      });
    }
  });

  // Trigger temporary notification
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
  };

  const addProductReview = (productId, newReview) => {
    const pId = Number(productId);
    const reviewItem = {
      id: Date.now(),
      date: 'Just now',
      helpfulCount: 0,
      ...newReview
    };

    setProductReviews((prev) => {
      const updated = {
        ...prev,
        [pId]: [reviewItem, ...(prev[pId] || [])]
      };
      pushPlatformSync({ reviews: updated });
      return updated;
    });

    showToast('⭐ Thank you for your review! Your feedback helps fellow students.');
  };

  const addToCart = (product, quantity = 1) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      showToast('Please log in to add stationery to your cart! 🛍️');
      return false;
    }
    const qtyToAdd = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }
      return [...prev, { ...product, quantity: qtyToAdd }];
    });
    showToast(`Added ${qtyToAdd > 1 ? `${qtyToAdd}x ` : ''}"${product.name}" to your cart!`);
    return true;
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
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
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const toggleWishlist = (id) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      showToast('Please log in to save items to your wishlist! ❤️');
      return false;
    }
    const numId = Number(id);
    setWishlist((prev) => {
      const exists = prev.some((item) => Number(item) === numId);
      if (exists) {
        showToast('Removed item from your wishlist');
        return prev.filter((item) => Number(item) !== numId);
      } else {
        showToast('Saved to your wishlist! ❤️');
        return [...prev, numId];
      }
    });
    return true;
  };

  const isWishlisted = (id) => {
    if (!isAuthenticated) return false;
    return wishlist.some((item) => Number(item) === Number(id));
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

  const wishlistProducts = ALL_PRODUCTS.filter((product) =>
    displayedWishlist.some((id) => Number(id) === Number(product.id))
  );

  const updateProfile = (updatedData) => {
    setUserProfile((prev) => ({
      ...prev,
      ...updatedData
    }));
    showToast('Profile updated successfully! ✨');
  };

  const addAddress = (newAddress) => {
    setUserProfile((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          id: Date.now(),
          ...newAddress
        }
      ]
    }));
    showToast('New shipping address saved!');
  };

  const removeAddress = (addressId) => {
    setUserProfile((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((addr) => addr.id !== addressId)
    }));
    showToast('Address removed');
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
          ...MOCK_USER_PROFILE,
          id: apiUser.id || apiUser._id || `USR-${Date.now().toString().slice(-4)}`,
          name: apiUser.name || 'Student User',
          email: apiUser.email || email || `student${phone.slice(-4)}@bookvardi.local`,
          phone: apiUser.phone || phone,
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
        showToast(`Welcome back, ${resolvedProfile.name}! ✨`);
        return true;
      } catch (error) {
        showToast(error.message || 'Unable to log in right now.');
        return false;
      }
    }

    if (backendEnabled && ((email && password) || (phone && password))) {
      try {
        const response = await loginWithBackend({ email, password, phone });
        const apiUser = response?.user || { ...userData, email: email || `student${phone.slice(-4)}@bookvardi.local` };
        const resolvedProfile = {
          ...MOCK_USER_PROFILE,
          id: apiUser.id || apiUser._id || `USR-${Date.now().toString().slice(-4)}`,
          name: apiUser.name || email.split('@')[0].replace('.', ' '),
          email: apiUser.email || email,
          phone: apiUser.phone || userData.phone || '',
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
        showToast(`Welcome back, ${resolvedProfile.name}! ✨`);
        return true;
      } catch (error) {
        showToast(error.message || 'Unable to log in right now.');
        return false;
      }
    }

    setIsAuthenticated(true);
    const matched = USERS.find((u) => u.email.toLowerCase() === email);

    let resolvedProfile;
    if (matched) {
      resolvedProfile = { ...matched, ...userData };
    } else {
      resolvedProfile = {
        ...MOCK_USER_PROFILE,
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: userData?.name || (email ? email.split('@')[0].replace('.', ' ') : 'Student Customer'),
        email: email || 'student@bookvardi.in',
        role: 'Student',
        roles: ['Student', 'Customer'],
        isAdmin: false,
        adminStatus: 'none',
        adminRole: null,
        isSeller: false,
        sellerStatus: 'none',
        sellerRole: null
      };
    }

    setUserProfile(resolvedProfile);
    closeAuthModal();
    showToast(`Welcome back, ${resolvedProfile.name}! ✨`);
    return true;
  };

  const switchUser = (userIdOrEmail) => {
    const target = USERS.find(
      (u) => u.id === userIdOrEmail || u.email.toLowerCase() === String(userIdOrEmail).toLowerCase()
    );
    if (target) {
      setIsAuthenticated(true);
      setUserProfile({ ...target });
      showToast(`Switched account to ${target.name} (${target.role}) 🔄`);
      return true;
    }
    return false;
  };

  const register = async (newUserData = {}) => {
    const email = (newUserData?.email || '').trim().toLowerCase();
    const password = String(newUserData?.password || '').trim();

    if (backendEnabled && email && password) {
      try {
        const response = await registerWithBackend({
          name: newUserData.name || 'Student User',
          email,
          password,
          phone: newUserData.phone || ''
        });

        const apiUser = response?.user || {
          id: `USR-${Date.now().toString().slice(-4)}`,
          name: newUserData.name || 'Student User',
          email,
          phone: newUserData.phone || '',
          role: 'user'
        };

        const freshProfile = {
          ...MOCK_USER_PROFILE,
          id: apiUser.id || apiUser._id || `USR-${Date.now().toString().slice(-4)}`,
          name: apiUser.name || newUserData.name || 'Student User',
          email: apiUser.email || email,
          phone: apiUser.phone || newUserData.phone || '',
          role: apiUser.role === 'admin' ? 'Admin' : 'Student',
          roles: apiUser.role === 'admin' ? ['Admin', 'Customer'] : ['Student', 'Customer'],
          isAdmin: apiUser.role === 'admin',
          adminStatus: apiUser.role === 'admin' ? 'approved' : 'none',
          adminRole: apiUser.role === 'admin' ? 'Admin' : null,
          isSeller: false,
          sellerStatus: 'none',
          sellerRole: null,
          memberSince: 'September 2026',
          rewardPoints: 100,
          orders: []
        };

        setUserProfile(freshProfile);
        setIsAuthenticated(true);
        closeAuthModal();
        showToast(`🎉 Welcome to Book Vardi, ${freshProfile.name}! Account created.`);
        return true;
      } catch (error) {
        showToast(error.message || 'Unable to create account right now.');
        return false;
      }
    }

    const freshProfile = {
      ...MOCK_USER_PROFILE,
      id: `USR-${Date.now().toString().slice(-4)}`,
      ...newUserData,
      role: 'Student',
      roles: ['Student', 'Customer'],
      isAdmin: false,
      adminStatus: 'none',
      adminRole: null,
      isSeller: false,
      sellerStatus: 'none',
      sellerRole: null,
      memberSince: 'September 2026',
      rewardPoints: 100,
      orders: []
    };
    setUserProfile(freshProfile);
    setIsAuthenticated(true);
    closeAuthModal();
    showToast(`🎉 Welcome to Book Vardi, ${newUserData.name}! Account created.`);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
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

    // Push new order and updated inventory to all 3 portals (Admin, Seller, User)
    pushPlatformSync({
      orders: [platformOrder],
      products: updatedProducts
    });

    setLastPlacedOrder(newOrder);
    setCartItems([]);
    setAppliedCoupon(null);
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
        updateProfile,
        addAddress,
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
        removeFromCart,
        updateQuantity,
        toggleWishlist,
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
        productReviews,
        addProductReview,
        lastPlacedOrder,
        setLastPlacedOrder,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        clearCart,
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
        USERS,
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
