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

const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasBeenReloaded = sessionStorage.getItem('bv_page_reloaded');
    try {
      const component = await componentImport();
      sessionStorage.removeItem('bv_page_reloaded');
      return component;
    } catch (error) {
      if (!pageHasBeenReloaded) {
        sessionStorage.setItem('bv_page_reloaded', 'true');
        window.location.reload();
      }
      throw error;
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

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center bg-gray-50 my-8 rounded-2xl border border-gray-200 mx-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Something went wrong while loading this section</h2>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            A network update or browser session refresh is required to view this component.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-brand-teal text-white rounded-xl font-bold text-sm hover:bg-brand-teal-dark transition-all cursor-pointer shadow-md"
          >
            Refresh Page
          </button>
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
const OrderSuccessPage = lazyWithRetry(() => import('./components/Pages/OrderSuccessPage'));
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
  const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));

  scheduleIdle(() => {
    import('./components/Pages/AllProductsPage');
    import('./components/Products/ProductDetailPage');
    import('./components/Cart/CartDrawer');
    import('./components/Wishlist/WishlistDrawer');
    import('./components/Auth/AuthModal');
    import('./components/Pages/CheckoutPage');
    import('./components/Common/LocationPermissionModal');
  });
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
  const { isAuthenticated, openAuthModal, selectedProduct, isSeller, setIsSellerModalOpen } = useCart();
  const [currentPage, setCurrentPage] = useState(getInitialPage); // 'home' | 'products' | 'about' | 'profile' | 'checkout' | 'order-success' | 'seller-dashboard' | 'product-detail'
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProfileTab, setActiveProfileTab] = useState('profile');

  // Priority: Home UI is loaded first. Pre-fetch secondary pages in background during idle time.
  React.useEffect(() => {
    prefetchSecondaryRoutes();
  }, []);

  // Synchronize browser history / URL hash
  React.useEffect(() => {
    const handlePopState = () => {
      const page = getInitialPage();
      setCurrentPage(page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Navigate to product-detail page automatically if a product is selected
  React.useEffect(() => {
    if (selectedProduct && currentPage !== 'product-detail') {
      setCurrentPage('product-detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (page === 'seller-registration') {
      setCurrentPage('seller-registration');
      try {
        window.history.replaceState(null, '', '#seller-registration');
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
      window.history.replaceState(null, '', newUrl);
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

  return (
    <div className={`min-h-screen flex flex-col ${hasAnnouncement ? 'pt-[104px]' : 'pt-[76px]'} text-gray-900 font-sans selection:bg-brand-yellow/30 selection:text-brand-teal transition-all duration-200`}>
      {/* Brand Splash Screen on Initial Load */}
      <SplashScreen />

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
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-800 border-t-transparent"></div>
            <p className="mt-3 text-sm font-semibold text-teal-800">Loading page...</p>
          </div>
        }>
          <PageErrorBoundary>
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
              selectedOrder={orderSuccessOptions?.order || null}
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
            <DeliveryPartnerPage onNavigate={navigateTo} />
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
