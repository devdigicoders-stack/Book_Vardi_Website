import React, { useState, lazy, Suspense } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import TopAnnouncementBar from './components/Header/TopAnnouncementBar';
import Navbar from './components/Header/Navbar';
import HeroSection from './components/Hero/HeroSection';
import FeaturesBar from './components/Features/FeaturesBar';
import CategorySection from './components/Categories/CategorySection';
import HomeProductSections from './components/Products/HomeProductSections';
import SchoolKitsRow from './components/Products/SchoolKitsRow';
import PromoBanners from './components/Promotions/PromoBanners';
import NewsletterSection from './components/Newsletter/NewsletterSection';
import Footer from './components/Footer/Footer';
import Toast from './components/Common/Toast';
import SplashScreen from './components/Common/SplashScreen';
import OrderSuccessPage from './components/Pages/OrderSuccessPage';
import { safeStorage } from './utils/safeStorage';

const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn('Initial chunk load failed, retrying smoothly...', error);
      const isChunkError = error?.name === 'ChunkLoadError' ||
        /Loading chunk|Failed to fetch dynamically imported module/i.test(error?.message || '');
      const hasRetried = safeStorage.getItem('bv_chunk_retry') === window.location.href;
      if (isChunkError && !hasRetried) {
        safeStorage.setItem('bv_chunk_retry', window.location.href);
        window.location.reload();
        return;
      }
      try {
        return await componentImport();
      } catch (retryErr) {
        console.error('Failed to load component dynamically:', retryErr);
        throw retryErr;
      }
    }
  });

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Page rendering error caught by ErrorBoundary:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.activePage !== this.props.activePage && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center bg-gray-50 my-8 rounded-2xl border border-gray-200 mx-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Something went wrong while loading this section</h2>
          <p className="text-sm text-gray-500 max-w-md mb-3">
            A network update or browser session refresh is required to view this component.
          </p>
          {this.state.error?.message && (
            <div className="mb-5 max-w-md w-full text-left bg-red-50/80 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-mono break-words">
              <strong>Error Details:</strong> {this.state.error.message}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                try {
                  if ('caches' in window) {
                    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
                  }
                } catch (_) {}
                const targetUrl = window.location.origin + window.location.pathname + '?_bv=' + Date.now() + window.location.hash;
                window.location.replace(targetUrl);
              }}
              className="px-5 py-2.5 bg-brand-teal text-white rounded-xl font-bold text-sm hover:bg-brand-teal-dark transition-all cursor-pointer shadow-md"
            >
              Refresh Page (Clear Cache)
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                try {
                  if ('caches' in window) {
                    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
                  }
                } catch (_) {}
                if (typeof this.props.onNavigate === 'function') {
                  this.props.onNavigate('home');
                } else {
                  window.location.replace('/?_bv=' + Date.now() + '#home');
                }
              }}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
            >
              Go to Home Storefront
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const CartDrawer = lazyWithRetry(() => import('./components/Cart/CartDrawer'));
const WishlistDrawer = lazyWithRetry(() => import('./components/Wishlist/WishlistDrawer'));
const AllProductsPage = lazyWithRetry(() => import('./components/Pages/AllProductsPage'));
const AboutUsPage = lazyWithRetry(() => import('./components/Pages/AboutUsPage'));
const ProfilePage = lazyWithRetry(() => import('./components/Pages/ProfilePage'));
const CheckoutPage = lazyWithRetry(() => import('./components/Pages/CheckoutPage'));
const AllCategoriesPage = lazyWithRetry(() => import('./components/Pages/AllCategoriesPage'));
const AuthModal = lazyWithRetry(() => import('./components/Auth/AuthModal'));
const ProductDetailPage = lazyWithRetry(() => import('./components/Products/ProductDetailPage'));
const ContactUsPage = lazyWithRetry(() => import('./components/Pages/ContactUsPage'));
const OffersPage = lazyWithRetry(() => import('./components/Pages/OffersPage'));
const NewArrivalsPage = lazyWithRetry(() => import('./components/Pages/NewArrivalsPage'));
const NotFoundPage = lazyWithRetry(() => import('./components/Pages/NotFoundPage'));
const SchoolDirectoryPage = lazyWithRetry(() => import('./components/Pages/SchoolDirectoryPage'));
const SchoolDetailsPage = lazyWithRetry(() => import('./components/Pages/SchoolDetailsPage'));
const SellerRegistrationPage = lazyWithRetry(() => import('./components/Pages/SellerRegistrationPage'));
const SchoolBulkOrderPage = lazyWithRetry(() => import('./components/Pages/SchoolBulkOrderPage'));
const DeliveryPartnerPage = lazyWithRetry(() => import('./components/Pages/DeliveryPartnerPage'));
const LocationPermissionModal = lazyWithRetry(() => import('./components/Common/LocationPermissionModal'));

// Pre-fetch critical secondary route chunks in background during browser idle time
export const prefetchSecondaryRoutes = () => {
  if (typeof window === 'undefined') return;
  const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 400));

  scheduleIdle(() => {
    import('./components/Pages/AllProductsPage');
    import('./components/Products/ProductDetailPage');
    import('./components/Cart/CartDrawer');
    import('./components/Wishlist/WishlistDrawer');
    import('./components/Auth/AuthModal');
    import('./components/Pages/CheckoutPage');
    import('./components/Pages/ProfilePage');
    import('./components/Pages/AllCategoriesPage');
    import('./components/Pages/SchoolBulkOrderPage');
    import('./components/Pages/OrderSuccessPage');
    import('./components/Pages/AboutUsPage');
    import('./components/Pages/ContactUsPage');
    import('./components/Common/LocationPermissionModal');
  });
};

const extractDeliveryTokenFromUrl = () => {
  try {
    if (typeof window === 'undefined') return '';
    const full = window.location.href;
    const sp = new URLSearchParams(window.location.search);
    let t = sp.get('token') || sp.get('orderId') || sp.get('t');
    if (!t && window.location.hash) {
      const parts = window.location.hash.split('?');
      if (parts[1]) {
        const hp = new URLSearchParams(parts[1]);
        t = hp.get('token') || hp.get('orderId') || hp.get('t');
      }
    }
    if (!t) {
      const m = full.match(/(?:token|orderId)=([^&#/?]+)/i) || full.match(/\b(DLV-[A-Za-z0-9_-]+)/i);
      if (m && m[1]) t = decodeURIComponent(m[1]).trim();
    }
    if (t) {
      try { sessionStorage.setItem('bv_active_delivery_token', t); } catch {}
      return t;
    }
    try { return sessionStorage.getItem('bv_active_delivery_token') || ''; } catch { return ''; }
  } catch {
    return '';
  }
};

function getInitialPage() {
  try {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
    const candidate = hash || path;
    if (candidate.includes('delivery-partner')) {
      return 'delivery-partner';
    }
    if (candidate.includes('seller-registration')) {
      return 'seller-registration';
    }
    if (candidate.includes('seller-dashboard') || candidate.includes('seller')) {
      return 'seller-dashboard';
    }
    if (candidate.includes('bulk')) {
      return 'school-bulk-order';
    }
    if (candidate) {
      const validPages = [
        'home', 'products', 'product-detail', 'about', 'contact', 'offers', 'new-arrivals',
        'all-categories', 'profile', 'checkout', 'cart', 'order-success', 'seller-dashboard',
        'seller-registration', 'school-directory', 'school-details', 'school-bulk-order', 'bulk-order', 'bulk', 'delivery-partner'
      ];
      const match = validPages.find(p => candidate.startsWith(p));
      if (match) return match === 'bulk-order' || match === 'bulk' ? 'school-bulk-order' : match;
    }
  } catch {}
  return 'home';
}

function MainStore() {
  const {
    isAuthenticated,
    openAuthModal,
    selectedProduct,
    closeProductDetails,
    isSeller,
    setIsSellerModalOpen,
    isCartOpen,
    setIsCartOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    isAuthModalOpen,
    closeAuthModal,
    showToast
  } = useCart();
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProfileTab, setActiveProfileTab] = useState('profile');

  // Keep refs for event listeners to avoid stale closure state
  const isCartOpenRef = React.useRef(isCartOpen);
  const isWishlistOpenRef = React.useRef(isWishlistOpen);
  const isAuthModalOpenRef = React.useRef(isAuthModalOpen);
  const selectedProductRef = React.useRef(selectedProduct);
  const currentPageRef = React.useRef(currentPage);
  const lastBackPressRef = React.useRef(0);

  React.useEffect(() => { isCartOpenRef.current = isCartOpen; }, [isCartOpen]);
  React.useEffect(() => { isWishlistOpenRef.current = isWishlistOpen; }, [isWishlistOpen]);
  React.useEffect(() => { isAuthModalOpenRef.current = isAuthModalOpen; }, [isAuthModalOpen]);
  React.useEffect(() => { selectedProductRef.current = selectedProduct; }, [selectedProduct]);
  React.useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  // Priority: Home UI is loaded first. Pre-fetch secondary pages in background during idle time.
  React.useEffect(() => {
    prefetchSecondaryRoutes();
  }, []);

  // Push history state whenever a drawer or modal opens so Back button closes the modal
  React.useEffect(() => {
    if (isCartOpen || isWishlistOpen || isAuthModalOpen) {
      try {
        window.history.pushState({ modalOpen: true, cart: isCartOpen, wishlist: isWishlistOpen, auth: isAuthModalOpen }, '', window.location.hash || '#');
      } catch {}
    }
  }, [isCartOpen, isWishlistOpen, isAuthModalOpen]);

  // Synchronize browser history, back navigation & double-back exit protection
  React.useEffect(() => {
    // Initialize base history state if not present
    if (!window.history.state || !window.history.state.page) {
      const initPage = getInitialPage();
      const currentFullUrl = (window.location.pathname || '') + (window.location.search || '') + (window.location.hash || '');
      const initUrl = initPage === 'home' ? (window.location.pathname || '/') : (currentFullUrl || `#${initPage}`);
      try {
        window.history.replaceState({ page: initPage, root: initPage === 'home' }, '', initUrl);
        // Also push a guard entry on home so first back doesn't dump outside
        if (initPage === 'home') {
          window.history.pushState({ page: 'home', root: true }, '', initUrl);
        }
      } catch {}
    }

    const handlePopState = (event) => {
      // 0. If any modal was just closed or popped by useModalBackTrap, don't navigate page
      if (
        (window.__bv_modal_open_count && window.__bv_modal_open_count > 0) ||
        (window.__bv_modal_popping && Date.now() < window.__bv_modal_popping) ||
        (event.state && (event.state.modalBackTrap || event.state.customerModalOpen))
      ) {
        return;
      }

      // 1. If Cart Drawer is open, back button simply closes it
      if (isCartOpenRef.current) {
        setIsCartOpen(false);
        return;
      }

      // 2. If Wishlist Drawer is open, back button simply closes it
      if (isWishlistOpenRef.current) {
        setIsWishlistOpen(false);
        return;
      }

      // 3. If Auth Modal is open, back button simply closes it
      if (isAuthModalOpenRef.current) {
        closeAuthModal();
        return;
      }

      // 4. If Product Details is open, back button returns to previous page / home
      if (selectedProductRef.current || currentPageRef.current === 'product-detail') {
        closeProductDetails();
        setCurrentPage('home');
        try {
          window.history.replaceState({ page: 'home', root: true }, '', window.location.pathname);
        } catch {}
        return;
      }

      // If currently on order-success, back button returns cleanly to home catalog
      if (currentPageRef.current === 'order-success') {
        setCurrentPage('home');
        try {
          window.history.replaceState({ page: 'home', root: true }, '', window.location.pathname);
        } catch {}
        return;
      }

      // 5. Normal page back navigation
      if (event.state && event.state.page) {
        const targetPage = event.state.page;
        setCurrentPage(targetPage);
        if (event.state.category) setActiveCategory(event.state.category);
        if (event.state.tab) setActiveProfileTab(event.state.tab);
        return;
      }

      // 6. If at root / home without state:
      const current = currentPageRef.current;
      if (current !== 'home') {
        setCurrentPage('home');
        try {
          window.history.pushState({ page: 'home', root: true }, '', window.location.pathname);
        } catch {}
      } else {
        // Already on home: Double-back to exit protection
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          window.history.back();
        } else {
          lastBackPressRef.current = now;
          if (showToast) {
            showToast('Press BACK again to exit Book Vardi 👋');
          }
          try {
            window.history.pushState({ page: 'home', root: true }, '', window.location.pathname);
          } catch {}
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Navigate to product-detail page and push history state so Back button returns to catalog
  React.useEffect(() => {
    if (selectedProduct && currentPage !== 'product-detail') {
      setCurrentPage('product-detail');
      try {
        window.history.pushState({ page: 'product-detail', productId: selectedProduct.id || selectedProduct._id }, '', '#product-detail');
      } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (!selectedProduct && currentPage === 'product-detail') {
      setCurrentPage('home');
    }
  }, [selectedProduct]);

  const activePage = currentPage;

  const [orderSuccessOptions, setOrderSuccessOptions] = useState(null);

  const navigateTo = (page, category = null, tab = 'profile') => {
    if (page === 'order-details' || page === 'order-success') {
      if (category && typeof category === 'object') {
        setOrderSuccessOptions(category);
      } else if (page === 'order-success' && typeof category !== 'object') {
        setOrderSuccessOptions(null);
      }
      setCurrentPage('order-success');
      try {
        window.history.pushState({ page: 'order-success' }, '', '#order-success');
      } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (page === 'seller-registration') {
      setCurrentPage('seller-registration');
      try {
        window.history.pushState({ page: 'seller-registration' }, '', '#seller-registration');
      } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (page === 'seller-dashboard' || page === 'seller') {
      if (isSeller) {
        const sellerUrl = import.meta.env.VITE_SELLER_PANEL_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5174' : 'https://book-vardi-seller-panel-new.vercel.app');
        window.open(sellerUrl, '_blank');
      } else {
        // Navigate directly to the 12-step onboarding registration page
        setCurrentPage('seller-registration');
        try {
          window.history.replaceState(null, '', '#seller-registration');
        } catch {}
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (page === 'admin-dashboard' || page === 'admin') {
      const adminUrl = import.meta.env.VITE_ADMIN_PANEL_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5175' : 'https://book-vardi-admin-panel.vercel.app');
      window.open(adminUrl, '_blank');
      return;
    }

    const targetPage = (page === 'bulk-order' || page === 'bulk' || page === 'bulk-supply') ? 'school-bulk-order' : page;

    setCurrentPage(targetPage);

    try {
      const newUrl = targetPage === 'home' 
        ? window.location.pathname 
        : `#${targetPage}`;
      if (currentPage !== targetPage) {
        window.history.pushState({ page: targetPage, category, tab }, '', newUrl);
      }
    } catch {}

    if (typeof category === 'string') {
      setActiveCategory(category);
    } else if (category && typeof category === 'object' && category.tab) {
      setActiveProfileTab(category.tab);
    }
    if (tab && typeof tab === 'string') {
      setActiveProfileTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [hasAnnouncement, setHasAnnouncement] = useState(true);
  const [shouldRenderSplash] = useState(() => {
    try {
      return typeof window !== 'undefined' && !sessionStorage.getItem('bv_splash_shown');
    } catch {
      return false;
    }
  });

  return (
    <div className={`min-h-screen flex flex-col ${hasAnnouncement ? 'pt-[104px]' : 'pt-[76px]'} text-gray-900 font-sans selection:bg-brand-yellow/30 selection:text-brand-teal transition-all duration-200`}>
      {/* Brand Splash Screen on Initial Load Only */}
      {shouldRenderSplash && <SplashScreen />}

      {/* Top Banner with announcements pinned to the viewport */}
      <TopAnnouncementBar onNavigate={navigateTo} onVisibilityChange={setHasAnnouncement} />

      {/* Main sticky navigation */}
      <Navbar
        currentPage={activePage}
        onNavigate={navigateTo}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hasAnnouncement={hasAnnouncement}
      />

      {/* Main Storefront Views */}
      <main className="flex-grow">
        <Suspense fallback={
          <div className="w-full min-h-[45vh] flex flex-col items-center justify-center py-16 px-4 animate-in fade-in duration-300">
            <div className="relative flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal shadow-xs animate-pulse">
                <span className="font-display font-black text-xl tracking-tighter text-brand-teal">BV</span>
              </div>
              <div className="absolute -inset-1.5 rounded-2xl border-2 border-brand-teal border-t-transparent animate-spin" />
            </div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-brand-teal tracking-wide mb-1">
              <span>BookVardi Storefront</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-ping" />
            </div>
            <span className="text-[11px] font-semibold text-gray-400">Loading page & catalog data...</span>
            <div className="w-36 h-1 bg-gray-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-linear-to-r from-brand-teal to-brand-yellow rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        }>
          <PageErrorBoundary activePage={activePage} onNavigate={navigateTo}>
          {activePage === 'home' && (
            <>
              <HeroSection onNavigate={navigateTo} />
              <PromoBanners onNavigate={navigateTo} />
              <SchoolKitsRow onNavigate={navigateTo} />
              <CategorySection
                activeCategory={activeCategory}
                onSelectCategory={(catId) => {
                  if (catId === 'school_specific') {
                    navigateTo('school-directory');
                  } else {
                    navigateTo('products', catId);
                  }
                }}
                onNavigate={navigateTo}
              />

              <HomeProductSections
                activeCategory={activeCategory}
                searchQuery={searchQuery}
                onNavigate={navigateTo}
              />

              <FeaturesBar />

              <NewsletterSection />
            </>
          )}

          {activePage === 'products' && (
            <AllProductsPage
              onNavigate={navigateTo}
              initialCategory={activeCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {activePage === 'product-detail' && (
            <ProductDetailPage onNavigate={navigateTo} />
          )}

          {activePage === 'about' && (
            <AboutUsPage onNavigate={navigateTo} />
          )}

          {activePage === 'contact' && (
            <ContactUsPage />
          )}

          {activePage === 'offers' && (
            <OffersPage onNavigate={navigateTo} />
          )}

          {activePage === 'new-arrivals' && (
            <NewArrivalsPage onNavigate={navigateTo} />
          )}

          {activePage === 'all-categories' && (
            <AllCategoriesPage onNavigate={navigateTo} />
          )}

          {activePage === 'profile' && (
            <ProfilePage onNavigate={navigateTo} initialTab={activeProfileTab} />
          )}


          {(activePage === 'checkout' || activePage === 'cart') && (
            <CheckoutPage onNavigate={navigateTo} />
          )}

          {activePage === 'order-success' && (
            <OrderSuccessPage
              onNavigate={navigateTo}
              isDetailsOnly={Boolean(orderSuccessOptions?.isDetailsOnly)}
              selectedOrder={orderSuccessOptions?.order || orderSuccessOptions?.selectedOrder || null}
            />
          )}

          {activePage === 'school-directory' && (
            <SchoolDirectoryPage onNavigate={navigateTo} />
          )}

          {activePage === 'school-details' && (
            <SchoolDetailsPage schoolName={activeCategory} onNavigate={navigateTo} />
          )}

          {activePage === 'seller-registration' && (
            <SellerRegistrationPage onNavigate={navigateTo} />
          )}

          {activePage === 'school-bulk-order' && (
            <SchoolBulkOrderPage onNavigate={navigateTo} />
          )}

          {activePage === 'delivery-partner' && (
            <DeliveryPartnerPage onNavigate={navigateTo} initialToken={extractDeliveryTokenFromUrl()} />
          )}

          {/* 404 Fallback */}
          {![
            'home', 'products', 'product-detail', 'about', 'contact', 'offers', 'new-arrivals',
            'all-categories', 'profile', 'checkout', 'order-success', 'seller-registration',
            'school-directory', 'school-details', 'school-bulk-order', 'bulk-order', 'bulk', 'bulk-supply', 'delivery-partner'
          ].includes(activePage) && (
              <NotFoundPage onNavigate={navigateTo} />
            )}
          </PageErrorBoundary>
        </Suspense>
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      <Suspense fallback={null}>
        {/* Interactive Cart Flyout Drawer */}
        <CartDrawer onNavigate={navigateTo} />

        {/* Interactive Wishlist Flyout Drawer */}
        <WishlistDrawer onNavigate={navigateTo} />

        {/* Global Authentication Modal (Login / Register) */}
        <AuthModal />
      </Suspense>

      {/* User Action Feedback Toast */}
      <Toast />

      {/* Location Permission & Discovery Radius Modal */}
      <Suspense fallback={null}>
        <LocationPermissionModal />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <LocationProvider>
      <CartProvider>
        <MainStore />
      </CartProvider>
    </LocationProvider>
  );
}
