import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Heart,
  Package,
  MapPin,
  Save,
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  LogOut,
  LogIn,
  UserPlus,
  Search,
  Filter,
  ArrowUpDown,
  ShoppingCart,
  Minus,
  X,
  RotateCcw,
  Lock,
  Pencil,
  Check,
  Store
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import ProductCard from '../Products/ProductCard';
import SellerRegistrationModal, { INITIAL_FORM_STATE } from '../Profile/SellerRegistrationModal';
import SellerApplicationReviewCard from '../Profile/SellerApplicationReviewCard';

export default function ProfilePage({ onNavigate, initialTab = 'profile' }) {
  const {
    userProfile,
    updateProfile,
    addAddress,
    removeAddress,
    wishlistProducts,
    totalItemsCount,
    wishlist,
    cartItems,
    subtotal,
    freeShippingRemaining,
    freeShippingProgress,
    updateQuantity,
    removeFromCart,
    isAuthenticated,
    logout,
    openAuthModal,
    login,
    isSeller,
    sellerStatus,
    isSellerModalOpen,
    setIsSellerModalOpen,
    isAdmin,
    USERS,
    switchUser
  } = useCart();

  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'wishlist' | 'orders' | 'cart' | 'addresses' | 'seller-data'

  // Load 12-step seller onboarding data saved during registration
  const [sellerAppData, setSellerAppData] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      if (saved) return JSON.parse(saved);
      const profileSaved = localStorage.getItem('book_vardi_seller_profile');
      if (profileSaved) return JSON.parse(profileSaved);
      return INITIAL_FORM_STATE;
    } catch {
      return INITIAL_FORM_STATE;
    }
  });

  // Re-read on tab focus or change
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      if (saved) setSellerAppData(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, [activeTab]);

  // Synchronize tab when navigated externally (e.g. from navbar or footer)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Editable profile form state
  const avatarInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: userProfile?.name || 'Ritesh Yadav',
    email: userProfile?.email || 'ritesh.yadav@example.com',
    phone: userProfile?.phone || '+91 98765 43210',
    studentId: userProfile?.studentId || 'SC-2026-8941',
    institution: userProfile?.institution || 'Delhi Technological University',
    standard: userProfile?.standard || 'Computer Science, 3rd Year',
    avatar: userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
  });

  // Keep form in sync when userProfile updates
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || 'Ritesh Yadav',
        email: userProfile.email || 'ritesh.yadav@example.com',
        phone: userProfile.phone || '+91 98765 43210',
        studentId: userProfile.studentId || 'SC-2026-8941',
        institution: userProfile.institution || 'Delhi Technological University',
        standard: userProfile.standard || 'Computer Science, 3rd Year',
        avatar: userProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
      });
    }
  }, [userProfile]);

  // Order History Filter & Search State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All'); // 'All' | 'Delivered' | 'In Transit'
  const [orderSortBy, setOrderSortBy] = useState('newest'); // 'newest' | 'oldest' | 'price-high' | 'price-low'

  // Address form inline state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'Home',
    name: userProfile?.name || 'Ritesh Yadav',
    phone: userProfile?.phone || '+91 98765 43210',
    addressLine: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Editable vs Readable profile mode toggle
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || 'Ritesh Yadav',
        email: userProfile.email || 'ritesh.yadav@example.com',
        phone: userProfile.phone || '+91 98765 43210',
        studentId: userProfile.studentId || 'SC-2026-8941',
        institution: userProfile.institution || 'Delhi Technological University',
        standard: userProfile.standard || 'Computer Science, 3rd Year',
        avatar: userProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
      });
    }
    setIsEditingProfile(false);
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const avatarUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!avatarUrl) return;

      setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
      updateProfile({ avatar: avatarUrl });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!newAddress.addressLine || !newAddress.city || !newAddress.pincode) return;
    addAddress(newAddress);
    setNewAddress({
      type: 'Home',
      name: formData.name,
      phone: formData.phone,
      addressLine: '',
      city: '',
      state: '',
      pincode: ''
    });
    setShowAddressForm(false);
  };

  // Compute filtered & sorted orders
  const allOrders = userProfile?.orders || [];
  const filteredOrders = allOrders
    .filter((order) => {
      if (orderStatusFilter !== 'All') {
        if (order.status.toLowerCase() !== orderStatusFilter.toLowerCase()) {
          return false;
        }
      }
      if (orderSearch.trim()) {
        const query = orderSearch.trim().toLowerCase();
        const idMatch = order.id?.toLowerCase().includes(query);
        const trackingMatch = order.trackingNumber?.toLowerCase().includes(query);
        const itemMatch = order.items?.some((it) => it.name.toLowerCase().includes(query));
        if (!idMatch && !trackingMatch && !itemMatch) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (orderSortBy === 'price-high') return b.total - a.total;
      if (orderSortBy === 'price-low') return a.total - b.total;
      if (orderSortBy === 'oldest') {
        return new Date(a.date) - new Date(b.date);
      }
      return new Date(b.date) - new Date(a.date);
    });

  /* =========================================================
     GUEST / LOGGED-OUT STATE
     ========================================================= */
  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50/70 min-h-screen pb-20">
        {/* Header Banner */}
        <div className="bg-brand-teal text-white py-12 px-4 border-b border-white/10 relative overflow-hidden">
          <div className="container mx-auto relative z-10">
            <nav className="flex items-center gap-2 text-xs text-white/60 mb-6">
              <button
                onClick={() => onNavigate('home')}
                className="hover:text-brand-yellow transition-colors font-medium cursor-pointer"
              >
                Home
              </button>
              <span>/</span>
              <span className="text-white font-semibold">My Account</span>
            </nav>

            <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">
              Student Account
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-lg">
              Sign in to manage your stationery orders, track deliveries, view saved cart items and unlock student discounts.
            </p>
          </div>
        </div>

        {/* Guest Access Card */}
        <div className="container mx-auto px-4 mt-12 max-w-md">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-brand-yellow/20 text-brand-teal-dark flex items-center justify-center mx-auto mb-4">
              <Lock size={28} />
            </div>

            <h2 className="font-display text-2xl font-extrabold text-brand-teal">
              Sign In to Book Vardi
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 mb-6 leading-relaxed">
              You are currently logged out. Access your personal details, order history, liked stationery, and saved cart items.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => openAuthModal('login')}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal-light text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-xs cursor-pointer"
              >
                <LogIn size={18} />
                <span>Sign In with Email</span>
              </button>

              <button
                onClick={() => openAuthModal('register')}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold py-3 px-6 rounded-xl text-sm transition-all shadow-xs cursor-pointer"
              >
                <UserPlus size={18} />
                <span>Create Student Account (Get 100 Pts)</span>
              </button>

              <button
                onClick={() => login({ name: 'Ritesh Yadav', email: 'ritesh.yadav@example.com' })}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-brand-teal/30 bg-brand-teal/5 hover:bg-brand-teal/10 text-brand-teal text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles size={14} className="text-brand-ochre" />
                <span>One-Click Demo Sign In (Ritesh Yadav)</span>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <button
                onClick={() => onNavigate('home')}
                className="text-xs text-gray-500 hover:text-brand-teal font-medium cursor-pointer"
              >
                ← Return to Book Vardi Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     AUTHENTICATED PROFILE PAGE
     ========================================================= */
  return (
    <div className="bg-gray-50/70 min-h-screen pb-20">
      {/* Header Banner */}
      <div className="bg-brand-teal text-white py-12 px-4 border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-pink/10 rounded-full blur-2xl pointer-events-none" />

        <div className="container mx-auto relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-white/60 mb-6">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-brand-yellow transition-colors font-medium cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-white font-semibold">My Account & Profile</span>
          </nav>

          {/* User Card */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="group relative w-18 h-18 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-brand-yellow p-1 bg-white/10 shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
                  aria-label="Change profile image"
                  title="Change profile image"
                >
                  <img
                    src={formData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                    alt={formData.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold uppercase tracking-wide">
                    Edit
                  </span>
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <span className="absolute -bottom-1 -right-1 bg-brand-yellow text-brand-teal-dark font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                  STUDENT
                </span>
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {formData.name}
                  </h1>
                  <button
                    onClick={() => {
                      logout();
                      onNavigate('home');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-red-200 border border-white/15 text-xs font-bold transition-colors cursor-pointer"
                    title="Log Out of your account"
                  >
                    <LogOut size={13} />
                    <span>Log Out</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                  {formData.institution} • {formData.standard}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-white/60 flex-wrap">
                  <span>ID: <strong className="text-brand-yellow">{formData.studentId}</strong></span>
                  <span>•</span>
                  <span>Member since {userProfile?.memberSince || '2024'}</span>
                </div>
              </div>
            </div>

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full md:w-auto">
              <div
                onClick={() => setActiveTab('orders')}
                className="bg-white/10 backdrop-blur border border-white/15 rounded-xl p-3 text-center cursor-pointer hover:bg-white/20 transition-all"
                title="View Order History"
              >
                <div className="font-display text-lg sm:text-xl font-extrabold text-brand-yellow">
                  {allOrders.length}
                </div>
                <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider mt-0.5">
                  Orders
                </div>
              </div>

              <div
                onClick={() => setActiveTab('wishlist')}
                className="bg-white/10 backdrop-blur border border-white/15 rounded-xl p-3 text-center cursor-pointer hover:bg-white/20 transition-all"
                title="View Liked Items"
              >
                <div className="font-display text-lg sm:text-xl font-extrabold text-brand-pink">
                  {wishlist.length}
                </div>
                <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
                  <span>Liked</span>
                  <Heart size={10} fill="currentColor" className="text-brand-pink" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab('cart')}
                className="bg-white/10 backdrop-blur border border-white/15 rounded-xl p-3 text-center cursor-pointer hover:bg-white/20 transition-all"
                title="View Cart in Profile"
              >
                <div className="font-display text-lg sm:text-xl font-extrabold text-white">
                  {totalItemsCount}
                </div>
                <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
                  <span>In Cart</span>
                  <ShoppingCart size={11} className="text-brand-yellow" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur border border-white/15 rounded-xl p-3 text-center">
                <div className="font-display text-lg sm:text-xl font-extrabold text-brand-yellow flex items-center justify-center gap-1">
                  <Sparkles size={14} />
                  <span>{userProfile?.rewardPoints || 480}</span>
                </div>
                <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider mt-0.5">
                  Points
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3 self-start sticky top-[90px]">
            <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-xs space-y-1.5">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-brand-teal text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-brand-teal'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <User size={18} />
                  <span>Personal Details</span>
                </span>
                <ChevronRight size={14} className={activeTab === 'profile' ? 'opacity-100' : 'opacity-40'} />
              </button>

              <button
                onClick={() => setActiveTab('wishlist')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'wishlist'
                    ? 'bg-brand-pink text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-brand-pink'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Heart size={18} fill={activeTab === 'wishlist' ? 'currentColor' : 'none'} />
                  <span>Liked Items</span>
                </span>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeTab === 'wishlist' ? 'bg-white/20 text-white' : 'bg-pink-100 text-brand-pink'
                }`}>
                  {wishlist.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-brand-teal text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-brand-teal'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Package size={18} />
                  <span>Order History</span>
                </span>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {allOrders.length}
                </span>
              </button>

              {/* NEW: MY CART TAB IN PROFILE */}
              <button
                onClick={() => setActiveTab('cart')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'cart'
                    ? 'bg-brand-teal text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-brand-teal'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ShoppingCart size={18} />
                  <span>My Cart</span>
                </span>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeTab === 'cart' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {totalItemsCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'addresses'
                    ? 'bg-brand-teal text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-brand-teal'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <MapPin size={18} />
                  <span>Saved Addresses</span>
                </span>
                <ChevronRight size={14} className={activeTab === 'addresses' ? 'opacity-100' : 'opacity-40'} />
              </button>

              {/* SELLER APPLICATION REVIEW TAB (Available for sellers or registered applicants) */}
              {(isSeller || sellerStatus === 'pending' || sellerStatus === 'approved' || localStorage.getItem('bv_seller_reg_data')) && (
                <button
                  onClick={() => setActiveTab('seller-data')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'seller-data'
                      ? 'bg-teal-900 text-white shadow-xs'
                      : 'bg-teal-50/80 text-teal-950 border border-teal-200/80 hover:bg-teal-100/80'
                  }`}
                  title="View complete data filled during all 12 registration steps"
                >
                  <span className="flex items-center gap-2.5">
                    <Store size={18} className={activeTab === 'seller-data' ? 'text-brand-yellow' : 'text-teal-700'} />
                    <span>Seller Profile (12 Steps)</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                    VERIFIED
                  </span>
                </button>
              )}

              {/* SELLER HUB / SELLER APPLICATION TAB */}
              {isSeller ? (
                <button
                  onClick={() => window.open('http://localhost:5174', '_blank')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer bg-brand-yellow text-brand-teal-dark hover:bg-brand-yellow-hover shadow-xs"
                  title="Launch Seller Dashboard on Port 5174"
                >
                  <span className="flex items-center gap-2.5">
                    <Store size={18} />
                    <span>Seller Dashboard (Hub)</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-brand-teal text-white">
                    LIVE
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigate && onNavigate('seller-registration')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100"
                  title="Apply to become an authorized seller"
                >
                  <span className="flex items-center gap-2.5">
                    <Store size={18} className="text-amber-600" />
                    <span>Become a Seller</span>
                  </span>
                </button>
              )}

              {/* ADMIN DASHBOARD TAB (Only visible if user has an approved admin role in mockData) */}
              {isAdmin && (
                <button
                  onClick={() => window.open('http://localhost:5175', '_blank')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer bg-teal-800 text-white hover:bg-teal-900 shadow-xs"
                  title="Launch Admin Dashboard on Port 5175"
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck size={18} className="text-brand-yellow" />
                    <span>Admin Dashboard</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
                    CONSOLE
                  </span>
                </button>
              )}

              {/* Log Out Action */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    logout();
                    onNavigate('home');
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <LogOut size={17} />
                    <span>Log Out</span>
                  </span>
                </button>
              </div>

              {/* Switch Role Account from mockData */}
              <div className="pt-3 border-t border-gray-100">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 px-1 flex items-center justify-between">
                  <span>Switch Mock User</span>
                  <span className="text-[9px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-bold">mockData</span>
                </div>
                <div className="space-y-1">
                  {(USERS || []).slice(0, 5).map((u) => {
                    const isCurrent = userProfile?.email?.toLowerCase() === u.email?.toLowerCase();
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => switchUser(u.id)}
                        className={`w-full text-left p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? 'bg-teal-50 border border-teal-200 text-teal-950 font-bold'
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="truncate">{u.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 shrink-0 font-bold">
                          {u.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-9">
            {/* TAB 1: PERSONAL DETAILS */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs">
                {/* Header with Edit Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-brand-teal flex items-center gap-2">
                      <span>Personal Information</span>
                      {!isEditingProfile ? (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                          Readable
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-teal bg-brand-teal/10 px-2.5 py-0.5 rounded-full border border-brand-teal/20 animate-pulse">
                          Editable
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isEditingProfile
                        ? 'Edit your student and contact details below, then save your changes.'
                        : 'Your student and contact details are currently in read-only mode.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 hidden sm:flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      Verified Student
                    </span>

                    {!isEditingProfile ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(true)}
                          className="inline-flex items-center gap-1.5 bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer hover:shadow-md"
                        >
                          <Pencil size={13} />
                          <span>Edit Details</span>
                        </button>

                        {isAuthenticated && (
                          <button
                            type="button"
                            onClick={() => {
                              logout();
                              onNavigate('home');
                            }}
                            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                            title="Log Out of your account"
                          >
                            <LogOut size={13} />
                            <span>Log Out</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          <X size={13} />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleProfileSubmit}
                          className="inline-flex items-center gap-1.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark text-xs font-extrabold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Save</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Full Name
                        </label>
                        {!isEditingProfile && (
                          <span className="text-[10px] text-gray-400 font-semibold">Locked</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        readOnly={!isEditingProfile}
                        className={`w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-all ${
                          isEditingProfile
                            ? 'bg-white border-2 border-brand-teal text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 shadow-2xs'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 font-semibold cursor-default select-text'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Email Address
                        </label>
                        {!isEditingProfile && (
                          <span className="text-[10px] text-gray-400 font-semibold">Locked</span>
                        )}
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        readOnly={!isEditingProfile}
                        className={`w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-all ${
                          isEditingProfile
                            ? 'bg-white border-2 border-brand-teal text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 shadow-2xs'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 font-semibold cursor-default select-text'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Mobile Phone Number
                        </label>
                        {!isEditingProfile && (
                          <span className="text-[10px] text-gray-400 font-semibold">Locked</span>
                        )}
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        readOnly={!isEditingProfile}
                        className={`w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-all ${
                          isEditingProfile
                            ? 'bg-white border-2 border-brand-teal text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 shadow-2xs'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 font-semibold cursor-default select-text'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Student / Roll ID
                        </label>
                        {!isEditingProfile && (
                          <span className="text-[10px] text-gray-400 font-semibold">Locked</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        readOnly={!isEditingProfile}
                        className={`w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-all ${
                          isEditingProfile
                            ? 'bg-white border-2 border-brand-teal text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 shadow-2xs'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 font-semibold cursor-default select-text'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          School / College / University
                        </label>
                        {!isEditingProfile && (
                          <span className="text-[10px] text-gray-400 font-semibold">Locked</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.institution}
                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                        readOnly={!isEditingProfile}
                        className={`w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-all ${
                          isEditingProfile
                            ? 'bg-white border-2 border-brand-teal text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 shadow-2xs'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 font-semibold cursor-default select-text'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Standard / Grade / Major
                        </label>
                        {!isEditingProfile && (
                          <span className="text-[10px] text-gray-400 font-semibold">Locked</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.standard}
                        onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                        readOnly={!isEditingProfile}
                        className={`w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-all ${
                          isEditingProfile
                            ? 'bg-white border-2 border-brand-teal text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 shadow-2xs'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 font-semibold cursor-default select-text'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Form Footer Action */}
                  <div className="pt-4 flex items-center justify-between border-t border-gray-100 flex-wrap gap-4">
                    <div className="text-xs text-gray-500">
                      {isEditingProfile
                        ? 'Make your changes and click "Save Changes" to update your details.'
                        : 'Information is in read-only mode. Click "Edit Details" to update.'}
                    </div>

                    <div className="flex items-center gap-2.5">
                      {isEditingProfile ? (
                        <>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold px-6 py-2.5 rounded-xl shadow-xs transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm cursor-pointer"
                          >
                            <Save size={16} />
                            <span>Save Changes</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(true)}
                          className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-teal-light text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer hover:shadow-md"
                        >
                          <Pencil size={14} />
                          <span>Edit Details</span>
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: LIKED ITEMS / WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-brand-teal flex items-center gap-2">
                      <span>Liked Stationery Items</span>
                      <Heart size={20} className="text-brand-pink fill-current" />
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Your saved favorites across notebooks, writing pens, and study sets.
                    </p>
                  </div>

                  <div className="text-xs font-bold text-gray-500">
                    Showing <strong className="text-brand-pink">{wishlistProducts.length}</strong> liked items
                  </div>
                </div>

                {wishlistProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                    {wishlistProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center bg-gray-50/70 rounded-2xl border border-dashed border-gray-200 p-8">
                    <div className="w-14 h-14 rounded-full bg-pink-100 text-brand-pink flex items-center justify-center mx-auto mb-3">
                      <Heart size={24} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-brand-teal">
                      No Liked Products Yet
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-5">
                      Tap the heart icon on any notebook, pen, or geometry kit to save it here for quick access.
                    </p>
                    <button
                      onClick={() => onNavigate('products')}
                      className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <ShoppingBag size={16} />
                      <span>Explore Full Catalog</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ORDER HISTORY (WITH SEARCH, STATUS & SORT FILTERS) */}
            {activeTab === 'orders' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs">
                {/* Orders Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-gray-100 mb-6">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-brand-teal">
                      Order History
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Track packages, view past stationery orders, and filter your purchase history.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-gray-500">
                    Showing <strong className="text-brand-teal">{filteredOrders.length}</strong> of {allOrders.length} orders
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 space-y-3.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-grow">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search by Order ID, item name, or tracking #..."
                        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-8 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all shadow-2xs"
                      />
                      {orderSearch && (
                        <button
                          type="button"
                          onClick={() => setOrderSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                          aria-label="Clear order search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Sort Selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      <ArrowUpDown size={15} className="text-gray-400" />
                      <select
                        value={orderSortBy}
                        onChange={(e) => setOrderSortBy(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-brand-teal shadow-2xs cursor-pointer"
                      >
                        <option value="newest">Sort: Newest First</option>
                        <option value="oldest">Sort: Oldest First</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="price-low">Price: Low to High</option>
                      </select>
                    </div>
                  </div>

                  {/* Status Filter Chips */}
                  <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-200/60 text-xs">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                      <Filter size={12} />
                      <span>Status:</span>
                    </span>

                    {['All', 'Delivered', 'In Transit'].map((status) => {
                      const count =
                        status === 'All'
                          ? allOrders.length
                          : allOrders.filter((o) => o.status.toLowerCase() === status.toLowerCase()).length;
                      const isActive = orderStatusFilter === status;

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setOrderStatusFilter(status)}
                          className={`px-3 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-brand-teal text-white shadow-2xs'
                              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-brand-teal'
                          }`}
                        >
                          <span>{status === 'All' ? 'All Orders' : status}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}

                    {(orderStatusFilter !== 'All' || orderSearch) && (
                      <button
                        type="button"
                        onClick={() => {
                          setOrderStatusFilter('All');
                          setOrderSearch('');
                        }}
                        className="ml-auto text-xs font-bold text-brand-teal hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-2xl p-5 hover:border-brand-teal/30 hover:shadow-md transition-all"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="font-display font-extrabold text-sm text-brand-teal">
                              Order #{order.id}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{order.date}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                                order.status === 'Delivered'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {order.status === 'Delivered' ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <Truck size={12} />
                              )}
                              <span>{order.status}</span>
                            </span>

                            <span className="font-display text-sm font-extrabold text-brand-teal">
                              ₹{order.total}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="py-4 space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/images/gel-pen-set.jpg';
                                  }}
                                />
                                <div>
                                  <h4 className="text-xs font-bold text-gray-800 line-clamp-1">
                                    {item.name}
                                  </h4>
                                  <span className="text-[11px] text-gray-500">
                                    Qty: {item.quantity} • ₹{item.price} each
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Tracking: <strong className="text-gray-700 font-mono text-[11px]">{order.trackingNumber}</strong>
                          </span>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => onNavigate('products')}
                              className="text-xs font-bold text-brand-teal hover:underline cursor-pointer"
                            >
                              Order Again
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-14 text-center bg-gray-50/70 rounded-2xl border border-dashed border-gray-200 p-6">
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                      <Package size={22} />
                    </div>
                    <h3 className="font-display text-base font-bold text-gray-800">
                      No Matching Orders Found
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto mb-4">
                      {orderSearch || orderStatusFilter !== 'All'
                        ? 'Try clearing your search query or selecting "All Orders".'
                        : "You haven't placed any stationery orders yet."}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderStatusFilter('All');
                        setOrderSearch('');
                      }}
                      className="inline-flex items-center gap-1.5 bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Order Filters</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MY CART IN PROFILE */}
            {activeTab === 'cart' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-brand-teal flex items-center gap-2">
                      <span>My Cart Items</span>
                      <ShoppingCart size={20} className="text-brand-teal" />
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Review and manage your selected notebooks, pens, and study tools before checkout.
                    </p>
                  </div>

                  <div className="text-xs font-bold text-gray-500">
                    Total: <strong className="text-brand-teal">{totalItemsCount}</strong> items (₹{subtotal})
                  </div>
                </div>

                {cartItems.length > 0 ? (
                  <div className="space-y-6">
                    {/* Free shipping progress banner */}
                    <div className="bg-brand-yellow/15 border border-brand-yellow/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between text-xs font-bold text-brand-teal-dark mb-2">
                        <span className="flex items-center gap-1.5">
                          <Truck size={15} />
                          {freeShippingRemaining > 0
                            ? `Add ₹${Math.ceil(freeShippingRemaining)} more for FREE student delivery!`
                            : '🎉 You have qualified for FREE student delivery!'}
                        </span>
                        <span>{Math.round(freeShippingProgress)}%</span>
                      </div>
                      <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-teal h-full transition-all duration-300 rounded-full"
                          style={{ width: `${freeShippingProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3.5">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover border border-gray-100 shrink-0"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/images/gel-pen-set.jpg';
                              }}
                            />
                            <div>
                              <h4 className="font-display font-bold text-sm text-gray-900 line-clamp-1">
                                {item.name}
                              </h4>
                              {item.subtitle && (
                                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="font-extrabold text-brand-teal text-sm">
                                  ₹{item.price}
                                </span>
                                {item.originalPrice && (
                                  <span className="text-xs text-gray-400 line-through">
                                    ₹{item.originalPrice}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-5">
                            {/* Quantity Stepper */}
                            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/80 p-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-2xs hover:bg-gray-100 text-gray-700 cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-9 text-center font-bold text-xs text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-2xs hover:bg-gray-100 text-gray-700 cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            {/* Item Total */}
                            <div className="text-right min-w-[70px]">
                              <span className="block font-display font-extrabold text-sm text-brand-teal">
                                ₹{item.price * item.quantity}
                              </span>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-brand-pink p-2 rounded-lg hover:bg-pink-50 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Checkout & Summary Footer */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider block">
                          Cart Total ({totalItemsCount} items)
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="font-display text-2xl font-extrabold text-brand-teal">
                            ₹{subtotal}
                          </span>
                          <span className="text-xs text-green-700 font-bold">
                            Free shipping included
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => onNavigate('products')}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          Continue Shopping
                        </button>
                        <button
                          onClick={() => onNavigate('checkout')}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer hover:shadow-md"
                        >
                          <span>Proceed to Checkout</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center bg-gray-50/70 rounded-2xl border border-dashed border-gray-200 p-8">
                    <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                      <ShoppingCart size={24} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-brand-teal">
                      Your Cart is Currently Empty
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-5">
                      Explore notebooks, pens, highlighters, and desk organizers to add to your order.
                    </p>
                    <button
                      onClick={() => onNavigate('products')}
                      className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <ShoppingBag size={16} />
                      <span>Browse Book Vardi Catalog</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: SAVED ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-brand-teal">
                      Saved Delivery Addresses
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Add and manage delivery addresses for your hostel, home, or classroom.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="inline-flex items-center gap-1.5 bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus size={14} />
                    <span>Add New Address</span>
                  </button>
                </div>

                {/* Inline Add Address Form */}
                {showAddressForm && (
                  <form
                    onSubmit={handleAddressSubmit}
                    className="mb-8 p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4"
                  >
                    <h3 className="text-xs font-extrabold text-brand-teal uppercase tracking-wider">
                      New Shipping Address
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Address Tag (Home / Hostel / School)
                        </label>
                        <input
                          type="text"
                          value={newAddress.type}
                          onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Contact Phone
                        </label>
                        <input
                          type="tel"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Street Address / Hostel Block / Room
                        </label>
                        <input
                          type="text"
                          value={newAddress.addressLine}
                          onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                          placeholder="e.g. Room 204, Ganga Boys Hostel, Campus"
                          required
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          required
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          PIN Code
                        </label>
                        <input
                          type="text"
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                          required
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Addresses List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(userProfile?.addresses || []).map((addr) => (
                    <div
                      key={addr.id}
                      className="border border-gray-200 rounded-2xl p-5 relative hover:border-brand-teal/30 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-bold text-xs text-brand-teal uppercase tracking-wider bg-brand-teal/10 px-2.5 py-0.5 rounded-md">
                            {addr.type}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-extrabold text-brand-yellow bg-brand-teal-dark px-2 py-0.5 rounded-full">
                              DEFAULT
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-gray-900 mt-2">
                          {addr.name}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {addr.addressLine}, {addr.city} - {addr.pincode}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Phone: {addr.phone}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-green-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Deliverable Area
                        </span>
                        {(userProfile?.addresses?.length > 1) && (
                          <button
                            onClick={() => removeAddress(addr.id)}
                            className="text-gray-400 hover:text-brand-pink transition-colors p-1 cursor-pointer"
                            title="Remove address"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: 12-STEP SELLER APPLICATION DATA */}
            {activeTab === 'seller-data' && (
              <SellerApplicationReviewCard
                applicationData={sellerAppData}
                onEditStep={(stepNum) => {
                  if (onNavigate) {
                    onNavigate('seller-registration');
                  }
                }}
                onOpenSellerDashboard={isSeller ? () => window.open('http://localhost:5174', '_blank') : null}
              />
            )}
          </div>
        </div>
      </div>

      {/* 12-Step Seller Registration Modal */}
      <SellerRegistrationModal
        isOpen={isSellerModalOpen}
        onClose={() => setIsSellerModalOpen(false)}
      />
    </div>
  );
}
