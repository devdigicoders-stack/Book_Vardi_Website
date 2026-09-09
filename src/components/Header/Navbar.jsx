import React, { useState, useRef, useEffect } from 'react';
import { Heart, ShoppingCart, User, Menu, X, ChevronDown, LogOut, LogIn, UserPlus, Package, Store, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { NAV_LINKS, CATEGORIES } from '../../data/mockData';
import GlobalSearch from './GlobalSearch';

const MEGA_MENU_DATA = {
  uniforms: ['Boys Summer', 'Boys Winter', 'Girls Summer', 'Girls Winter', 'Sports & PT', 'House T-Shirts'],
  ncert: ['Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'Science & Math', 'Humanities'],
  practice_books: ['Olympiad Prep', 'Grammar Books', 'Math Workbooks', 'Cursive Writing', 'Sample Papers'],
  drawing_books: ['Magic Coloring', 'Sketch Books', 'Water Reveal', 'Art Activity', 'Origami'],
  school_specific: ['Delhi Public School', 'Kendriya Vidyalaya', 'Ryan International', 'Apeejay School', 'DAV Public'],
  sports: ['PT T-Shirts', 'Trackpants', 'Sports Shorts', 'House Uniforms'],
  shoes: ['Black Leather Shoes', 'White Canvas Shoes', 'Sports Shoes', 'Socks'],
  winter: ['Sweaters & Cardigans', 'School Blazers', 'Thermals', 'Winter Caps'],
  rain: ['Raincoats', 'Umbrellas', 'Waterproof Covers'],
  supplies: ['Pens & Pencils', 'Geomtery Boxes', 'Notebooks', 'Lunch Boxes', 'Water Bottles'],
  bags: ['School Backpacks', 'Trolley Bags', 'Pencil Cases', 'Laptop Bags'],
  kits: ['Full Academic Kits', 'Exam Revision', 'Art Starter Kit', 'Gift Hampers']
};

// Extracted from original Navbar DesktopProfileDropdown
function DesktopProfileDropdown({
  isAuthenticated,
  userProfile,
  currentPage,
  onNavigate,
  onClose,
  logout,
  wishlistCount,
  isSeller,
  isAdmin,
  onMouseEnter,
  onMouseLeave
}) {
  return (
    <div
      className="absolute top-full right-0 pt-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 space-y-2 text-left">
      {isAuthenticated ? (
        <div className="space-y-2">
          {/* User Profile Header */}
          <button 
            onClick={() => {
              onNavigate('profile', null, 'profile');
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 bg-brand-teal/5 border border-brand-teal/10 rounded-xl hover:bg-brand-teal/10 transition-colors cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm">
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate">
                {userProfile?.name || 'Ritesh Yadav'}
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                {userProfile?.email || 'Verified Student'}
              </p>
            </div>
          </button>

          {/* Quick Nav Links */}
          <div className="space-y-0.5 pt-1">
            <button
              onClick={() => {
                onNavigate('profile', null, 'profile');
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentPage === 'profile'
                  ? 'bg-brand-teal text-white'
                  : 'text-gray-700 hover:bg-brand-teal/5 hover:text-brand-teal'
              }`}
            >
              <span className="flex items-center gap-2">
                <User size={15} />
                <span>My Profile</span>
              </span>
              <ChevronDown size={13} className="-rotate-90 text-gray-400" />
            </button>

            <button
              onClick={() => {
                onNavigate('profile', null, 'orders');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-brand-teal/5 hover:text-brand-teal transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Package size={15} />
                <span>Order History</span>
              </span>
              <ChevronDown size={13} className="-rotate-90 text-gray-400" />
            </button>

            <button
              onClick={() => {
                onNavigate('profile', null, 'wishlist');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-brand-teal/5 hover:text-brand-teal transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Heart size={15} />
                <span>Liked Items ({wishlistCount})</span>
              </span>
              <ChevronDown size={13} className="-rotate-90 text-gray-400" />
            </button>

            {isSeller && (
              <button
                onClick={() => {
                  onNavigate('seller-dashboard');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  currentPage === 'seller-dashboard'
                    ? 'bg-brand-yellow text-brand-teal-dark'
                    : 'text-gray-700 hover:bg-brand-yellow/20 hover:text-brand-teal'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Store size={15} />
                  <span>Seller Dashboard</span>
                </span>
                <ChevronDown size={13} className="-rotate-90 text-gray-400" />
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => {
                  onNavigate('admin-dashboard');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 hover:bg-brand-teal hover:text-white transition-all cursor-pointer border border-teal-200/60"
                title="Open Admin Console"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-teal-700 group-hover:text-white" />
                  <span>Admin Dashboard</span>
                </span>
                <ChevronDown size={13} className="-rotate-90 opacity-60" />
              </button>
            )}
          </div>

          {/* Logout Button inside Profile for lg devices */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => {
                logout();
                if (currentPage === 'profile') {
                  onNavigate('home');
                }
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}

export default function Navbar({ currentPage, onNavigate, searchQuery, onSearchChange }) {
  const {
    totalItemsCount,
    wishlist,
    setIsCartOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    isAuthenticated,
    openAuthModal,
    logout,
    userProfile,
    sellerStatus,
    isAdmin,
    isSeller,
  } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Profile dropdown
  const [actionProfileOpen, setActionProfileOpen] = useState(false);
  const actionProfileRef = useRef(null);
  const profileTimerRef = useRef(null);
  
  // Mega Menu for Categories
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const megaMenuRef = useRef(null);
  const megaMenuTimerRef = useRef(null);
  const [categoryClickCount, setCategoryClickCount] = useState(0);

  const [activeHomeSection, setActiveHomeSection] = useState('home');

  const handleActionProfileEnter = () => {
    if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
    setActionProfileOpen(true);
  };
  const handleActionProfileLeave = () => {
    profileTimerRef.current = setTimeout(() => setActionProfileOpen(false), 250);
  };

  const handleMegaMenuEnter = () => {
    if (megaMenuTimerRef.current) clearTimeout(megaMenuTimerRef.current);
    setMegaMenuOpen(true);
  };
  const handleMegaMenuLeave = () => {
    megaMenuTimerRef.current = setTimeout(() => {
      setMegaMenuOpen(false);
      setCategoryClickCount(0); // reset on leave
    }, 400); // Increased from 250ms to prevent accidental closing
  };

  const headerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (actionProfileRef.current && !actionProfileRef.current.contains(e.target)) {
        setActionProfileOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target)) {
        setMegaMenuOpen(false);
        setCategoryClickCount(0);
      }
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track active section on home page
  useEffect(() => {
    if (currentPage !== 'home') return;
    const handleScroll = () => {
      const categoriesEl = document.getElementById('categories');
      const bestsellersEl = document.getElementById('bestsellers');
      if (!categoriesEl || !bestsellersEl) return;
      const catRect = categoriesEl.getBoundingClientRect();
      const bestRect = bestsellersEl.getBoundingClientRect();
      const triggerY = 140; 
      if (catRect.top > triggerY) setActiveHomeSection('home');
      else if (catRect.top <= triggerY && bestRect.top > triggerY) setActiveHomeSection('categories');
      else if (bestRect.top <= triggerY) setActiveHomeSection('bestsellers');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage]);

  const handleLinkClick = (view, e) => {
    e.preventDefault();

    if (view === 'categories') {
      // If it's a large device (desktop), direct click goes to categories page
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
        setMegaMenuOpen(false);
        setCategoryClickCount(0);
        onNavigate('all-categories');
        return;
      }

      // Mobile logic (double tap)
      if (categoryClickCount === 0) {
        // First tap: toggle mega menu
        setMegaMenuOpen(!megaMenuOpen);
        setCategoryClickCount(1);
        
        // Reset the click count after 400ms to simulate a double-tap window
        setTimeout(() => {
          setCategoryClickCount(0);
        }, 400);
        return;
      } else {
        // Second tap within 400ms: navigate to dedicated page
        setMobileMenuOpen(false);
        setMegaMenuOpen(false);
        setCategoryClickCount(0);
        onNavigate('all-categories');
        return;
      }
    }

    // Reset others
    setMobileMenuOpen(false);
    setMegaMenuOpen(false);
    setCategoryClickCount(0);

    if (view === 'bestsellers') {
      setActiveHomeSection('bestsellers');
      if (currentPage !== 'home') {
        onNavigate('home');
        setTimeout(() => {
          const el = document.getElementById('bestsellers');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        const el = document.getElementById('bestsellers');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (view === 'home') {
      setActiveHomeSection('home');
      if (currentPage !== 'home') {
        onNavigate('home');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    onNavigate(view);
  };

  const renderMegaMenu = (isMobile = false) => {
    return (
      <div 
        className={`${
          isMobile 
            ? 'mt-2 pl-4 border-l-2 border-brand-yellow/30 space-y-4' 
            : 'fixed top-[76px] left-0 w-full bg-white shadow-2xl border-t border-gray-100 z-50 p-6 animate-in fade-in slide-in-from-top-1 duration-200'
        }`}
      >
        <div className={isMobile ? 'flex flex-col gap-4' : 'container mx-auto px-4 flex flex-wrap gap-8 justify-center'}>
          {CATEGORIES.map(category => (
            <div key={category.id} className={isMobile ? 'flex flex-col gap-2' : 'flex flex-col gap-3 min-w-[140px] max-w-[180px]'}>
              <button 
                onClick={() => {
                  setMegaMenuOpen(false);
                  setMobileMenuOpen(false);
                  onNavigate('products', category.id);
                }}
                className="font-extrabold text-brand-teal hover:text-brand-pink text-sm uppercase tracking-wider text-left transition-colors flex items-center justify-between group cursor-pointer"
              >
                <span>{category.name}</span>
                {!isMobile && <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" />}
              </button>
              
              <div className="flex flex-col gap-2">
                {MEGA_MENU_DATA[category.id]?.map((sub, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setMegaMenuOpen(false);
                      setMobileMenuOpen(false);
                      onNavigate('products', category.id); // In real app, filter by subcategory
                    }}
                    className="text-xs font-semibold text-gray-500 hover:text-brand-teal hover:bg-brand-teal/5 py-1 px-2 -ml-2 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {/* Quick View All Link */}
          {!isMobile && (
            <div className="w-full flex justify-center mt-4 pt-4 border-t border-gray-100 lg:hidden">
              <button
                onClick={() => {
                  setMegaMenuOpen(false);
                  onNavigate('all-categories');
                }}
                className="text-xs font-bold text-brand-teal hover:text-brand-pink transition-colors inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer bg-brand-teal/5 px-4 py-2 rounded-xl"
              >
                <span>View All Categories</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-white border-b border-gray-200/80 shadow-xs transition-all">
      <div className="container mx-auto px-4 flex items-center justify-between h-[76px] gap-6 relative">
        {/* Brand Logo */}
        <button
          onClick={() => {
            setActiveHomeSection('home');
            onNavigate('home');
          }}
          className="flex items-center text-left cursor-pointer group focus:outline-none shrink-0"
        >
          <img
            src="/logo.png"
            alt="Book Vardi"
            className="h-11 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="font-display text-xl font-extrabold text-black tracking-tight">
                BOOK<span className="text-brand-yellow">VARDI</span>
              </span>
        </button>
        

        {/* Global Search Bar (Desktop) */}
        <div className="hidden lg:flex flex-1 justify-center px-4">
          <div className="w-full max-w-md">
            <GlobalSearch
              onNavigate={onNavigate}
              onSearch={onSearchChange}
              currentQuery={searchQuery}
            />
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-7 h-full shrink-0">
          {NAV_LINKS.map((link, idx) => {
            const isActive =
              currentPage === 'home'
                ? link.view === activeHomeSection
                : link.view === currentPage;
            
            const isCategories = link.view === 'categories';

            return (
              <div 
                key={idx} 
                className="h-full flex items-center"
                ref={isCategories ? megaMenuRef : null}
                onMouseEnter={isCategories ? handleMegaMenuEnter : undefined}
                onMouseLeave={isCategories ? handleMegaMenuLeave : undefined}
              >
                <button
                  onClick={(e) => handleLinkClick(link.view, e)}
                  className={`text-sm font-semibold text-gray-600 hover:text-brand-teal transition-colors inline-flex items-center gap-1 py-1 relative cursor-pointer ${
                    isActive || (isCategories && megaMenuOpen) ? 'text-brand-teal font-bold' : ''
                  }`}
                  title={isCategories ? 'Double tap to open all categories' : ''}
                >
                  {link.label}
                  {isCategories && (
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${(isActive || megaMenuOpen) ? 'text-brand-teal' : 'text-gray-400'} ${megaMenuOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                  {(isActive || (isCategories && megaMenuOpen)) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-yellow rounded-full" />
                  )}
                </button>
                {isCategories && megaMenuOpen && renderMegaMenu(false)}
              </div>
            );
          })}
        </nav>

        {/* Actions (Wishlist, User, Cart) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && (
            <button
              className={`relative p-2 rounded-full transition-all duration-200 active:scale-75 cursor-pointer ${
                isWishlistOpen
                  ? 'text-brand-pink bg-pink-50 ring-2 ring-brand-pink/20 shadow-xs'
                  : 'text-brand-teal hover:bg-brand-teal/5'
              }`}
              onClick={() => setIsWishlistOpen(true)}
            >
              <Heart
                size={20}
                fill={wishlist.length > 0 ? 'currentColor' : 'none'}
                className={wishlist.length > 0 ? 'text-brand-pink' : ''}
              />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 bg-brand-pink text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>
          )}

          {isAuthenticated ? (
            <div
              className="hidden lg:flex items-center gap-1 relative"
              ref={actionProfileRef}
              onMouseEnter={handleActionProfileEnter}
              onMouseLeave={handleActionProfileLeave}
            >
              <button
                type="button"
                className={`flex items-center gap-2.5 rounded-full border transition-all cursor-pointer ${
                  currentPage === 'profile' || actionProfileOpen
                    ? 'border-brand-teal bg-brand-teal text-white shadow-xs'
                    : 'border-gray-200 bg-white text-brand-teal hover:bg-brand-teal/5'
                } px-2.5 py-1.5`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActionProfileOpen(!actionProfileOpen);
                }}
              >
                <div className="relative flex items-center justify-center">
                  {userProfile?.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.name || 'User profile'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white/80"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-current/10 flex items-center justify-center text-[11px] font-extrabold ring-2 ring-white/80">
                      {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
                </div>

                <div className="hidden xl:flex flex-col text-left leading-tight min-w-0">
                  <span className="text-[10px] font-extrabold truncate max-w-[120px]">
                    {userProfile?.name || 'Student Account'}
                  </span>
                  <span className={`text-[9px] truncate max-w-[120px] ${currentPage === 'profile' || actionProfileOpen ? 'text-white/80' : 'text-gray-500'}`}>
                    {userProfile?.email || 'Verified Student'}
                  </span>
                </div>

                <ChevronDown
                  size={14}
                  className={`hidden xl:block transition-transform duration-200 ${actionProfileOpen ? 'rotate-180' : ''} ${currentPage === 'profile' || actionProfileOpen ? 'text-white' : 'text-gray-400'}`}
                />
              </button>
              {actionProfileOpen && (
                <DesktopProfileDropdown
                  isAuthenticated={isAuthenticated}
                  userProfile={userProfile}
                  currentPage={currentPage}
                  onNavigate={onNavigate}
                  onClose={() => setActionProfileOpen(false)}
                  logout={logout}
                  wishlistCount={wishlist.length}
                  isSeller={isSeller}
                  isAdmin={isAdmin}
                  onMouseEnter={handleActionProfileEnter}
                  onMouseLeave={handleActionProfileLeave}
                />
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 ml-1">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 text-xs font-bold text-brand-teal hover:text-brand-teal-dark hover:bg-brand-teal/5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogIn size={15} />
                <span>Log In</span>
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-3.5 py-1.5 text-xs font-extrabold bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <UserPlus size={14} />
                <span>Register</span>
              </button>
            </div>
          )}

          {isAuthenticated && (
            <button
              className="relative p-2 rounded-full text-brand-teal hover:bg-brand-teal/5 transition-colors cursor-pointer"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart size={20} />
              <span className="absolute top-1 right-1 bg-brand-yellow text-brand-teal-dark text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {totalItemsCount}
              </span>
            </button>
          )}

          <button
            className="p-2 rounded-full text-brand-teal hover:bg-brand-teal/5 lg:hidden cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 shadow-lg max-h-[calc(100vh-76px)] overflow-y-auto">
          {/* Global Search Bar (Mobile) */}
          <div className="pb-3 border-b border-gray-100 mb-3">
            <GlobalSearch
              onNavigate={(page) => {
                setMobileMenuOpen(false);
                onNavigate(page);
              }}
              onSearch={onSearchChange}
              currentQuery={searchQuery}
            />
          </div>

          <div className="flex flex-col space-y-2">
            {NAV_LINKS.map((link, idx) => {
              const isMobileActive =
                currentPage === 'home'
                  ? link.view === activeHomeSection
                  : link.view === currentPage;
              const isCategories = link.view === 'categories';

              return (
                <div key={idx} className="flex flex-col">
                  <button
                    onClick={(e) => handleLinkClick(link.view, e)}
                    className={`text-left text-sm font-semibold py-1.5 cursor-pointer flex items-center justify-between ${
                      isMobileActive || (isCategories && megaMenuOpen)
                        ? 'text-brand-teal font-bold'
                        : 'text-gray-700 hover:text-brand-teal'
                    }`}
                  >
                    <span className="relative pb-0.5">
                      {link.label}
                      {isCategories && categoryClickCount === 1 && <span className="ml-2 text-[10px] text-gray-400 font-normal italic">Tap again to view all</span>}
                      {(isMobileActive || (isCategories && megaMenuOpen)) && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-yellow rounded-full" />
                      )}
                    </span>
                    {isCategories && (
                      <ChevronDown size={14} className={`transition-transform duration-200 ${(isMobileActive || megaMenuOpen) ? 'text-brand-teal' : 'text-gray-400'} ${megaMenuOpen ? 'rotate-180' : '-rotate-90'}`} />
                    )}
                  </button>
                  {isCategories && megaMenuOpen && renderMegaMenu(true)}
                </div>
              );
            })}

            {/* Profile & Account Actions for Small Devices */}
            <div className="pt-3 mt-2 border-t border-gray-100 space-y-2">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onNavigate('profile', null, 'profile');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 bg-brand-teal/5 border border-brand-teal/10 rounded-xl hover:bg-brand-teal/10 transition-colors cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm">
                      {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {userProfile?.name || 'Student Account'}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {userProfile?.email || userProfile?.phone || 'Logged In'}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('profile', null, 'profile');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between text-left text-sm font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer ${
                      currentPage === 'profile'
                        ? 'bg-brand-teal text-white shadow-xs'
                        : 'text-brand-teal hover:bg-brand-teal/5 bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <User size={18} />
                      <span>My Profile</span>
                    </span>
                    <ChevronDown size={14} className={`-rotate-90 ${currentPage === 'profile' ? 'text-white' : 'text-gray-400'}`} />
                  </button>
                  {isSeller && (
                    <button
                      onClick={() => {
                        onNavigate('seller-dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between text-left text-sm font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer ${
                        currentPage === 'seller-dashboard'
                          ? 'bg-brand-yellow text-brand-teal-dark shadow-xs'
                          : 'text-brand-teal hover:bg-brand-yellow/20 bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Store size={18} />
                        <span>Seller Dashboard</span>
                      </span>
                      <ChevronDown size={14} className="-rotate-90 text-gray-400" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        onNavigate('admin-dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between text-left text-sm font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer bg-teal-50 text-teal-800 hover:bg-brand-teal hover:text-white border border-teal-200/60"
                    >
                      <span className="flex items-center gap-2.5">
                        <ShieldCheck size={18} className="text-teal-700" />
                        <span>Admin Dashboard</span>
                      </span>
                      <ChevronDown size={14} className="-rotate-90 opacity-60" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      if (currentPage === 'profile') onNavigate('home');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 text-left text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 py-2 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut size={18} />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        openAuthModal('login');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-2 text-center text-xs font-bold text-brand-teal border border-brand-teal/30 rounded-xl hover:bg-brand-teal/5 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogIn size={15} />
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        openAuthModal('register');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-2 text-center text-xs font-extrabold bg-brand-yellow text-brand-teal-dark rounded-xl hover:bg-brand-yellow-hover flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <UserPlus size={15} />
                      <span>Register</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
