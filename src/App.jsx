import React, { useState } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import TopAnnouncementBar from './components/Header/TopAnnouncementBar';
import Navbar from './components/Header/Navbar';
import LocationPermissionModal from './components/Common/LocationPermissionModal';
import HeroSection from './components/Hero/HeroSection';
import FeaturesBar from './components/Features/FeaturesBar';
import CategorySection from './components/Categories/CategorySection';
import HomeProductSections from './components/Products/HomeProductSections';
import SchoolKitsRow from './components/Products/SchoolKitsRow';
import PromoBanners from './components/Promotions/PromoBanners';
import NewsletterSection from './components/Newsletter/NewsletterSection';
import Footer from './components/Footer/Footer';
import CartDrawer from './components/Cart/CartDrawer';
import WishlistDrawer from './components/Wishlist/WishlistDrawer';
import Toast from './components/Common/Toast';
import AllProductsPage from './components/Pages/AllProductsPage';
import AboutUsPage from './components/Pages/AboutUsPage';
import ProfilePage from './components/Pages/ProfilePage';
import CheckoutPage from './components/Pages/CheckoutPage';
import OrderSuccessPage from './components/Pages/OrderSuccessPage';
import AllCategoriesPage from './components/Pages/AllCategoriesPage';
import AuthModal from './components/Auth/AuthModal';
import ProductDetailPage from './components/Products/ProductDetailPage';
import ContactUsPage from './components/Pages/ContactUsPage';
import OffersPage from './components/Pages/OffersPage';
import NewArrivalsPage from './components/Pages/NewArrivalsPage';
import NotFoundPage from './components/Pages/NotFoundPage';
import SchoolDirectoryPage from './components/Pages/SchoolDirectoryPage';
import SchoolDetailsPage from './components/Pages/SchoolDetailsPage';
import SellerRegistrationPage from './components/Pages/SellerRegistrationPage';

function getInitialPage() {
  try {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
    const candidate = hash || path;
    if (candidate.includes('seller-registration')) {
      return 'seller-registration';
    }
    if (candidate.includes('seller-dashboard') || candidate.includes('seller')) {
      return 'seller-dashboard';
    }
    if (candidate) {
      const validPages = [
        'home', 'products', 'product-detail', 'about', 'contact', 'offers', 'new-arrivals',
        'all-categories', 'profile', 'checkout', 'order-success', 'seller-dashboard',
        'seller-registration', 'school-directory', 'school-details'
      ];
      const match = validPages.find(p => candidate.startsWith(p));
      if (match) return match;
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

  // If user is logged out, active profile page falls back to home
  const activePage = (currentPage === 'profile' && !isAuthenticated) ? 'home' : currentPage;

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
        // Open the independent bookvardiseller project on port 5174
        window.open('http://localhost:5174', '_blank');
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
      // Open the independent bookvardiadmin project on port 5175
      window.open('http://localhost:5175', '_blank');
      return;
    }

    if (page === 'profile' && !isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setCurrentPage(page);
    try {
      const newUrl = page === 'home' 
        ? window.location.pathname 
        : `#${page}`;
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

  return (
    <div className="min-h-screen flex flex-col pt-[108px] text-gray-900 font-sans selection:bg-brand-yellow/30 selection:text-brand-teal">
      {/* Top Banner with announcements pinned to the viewport */}
      <TopAnnouncementBar onNavigate={navigateTo} />

      {/* Main sticky navigation (sticks to top-0 when scrolled) */}
      <Navbar
        currentPage={activePage}
        onNavigate={navigateTo}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Storefront Views */}
      <main className="flex-grow">
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

        {activePage === 'profile' && isAuthenticated && (
          <ProfilePage onNavigate={navigateTo} initialTab={activeProfileTab} />
        )}

        {activePage === 'checkout' && (
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

        {/* 404 Fallback */}
        {![
          'home', 'products', 'product-detail', 'about', 'contact', 'offers', 'new-arrivals',
          'all-categories', 'profile', 'checkout', 'order-success', 'seller-registration',
          'school-directory', 'school-details'
        ].includes(activePage) && (
            <NotFoundPage onNavigate={navigateTo} />
          )}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Interactive Cart Flyout Drawer */}
      <CartDrawer onNavigate={navigateTo} />

      {/* Interactive Wishlist Flyout Drawer */}
      <WishlistDrawer onNavigate={navigateTo} />

      {/* User Action Feedback Toast */}
      <Toast />

      {/* Global Authentication Modal (Login / Register) */}
      <AuthModal />

      {/* Location Permission & Discovery Radius Modal */}
      <LocationPermissionModal />
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
