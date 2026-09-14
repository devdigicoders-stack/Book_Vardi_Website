import React, { useState } from 'react';
import { Truck, RotateCcw, ShieldCheck, Headphones, Store } from 'lucide-react';
import {
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  YoutubeIcon
} from '../Common/SocialIcons';
import { CATEGORIES } from '../../data/mockData';
import { useCart } from '../../context/CartContext';

export default function Footer({ onNavigate }) {
  const { isAuthenticated, sellerStatus, isAdmin, isSeller } = useCart();
  const [showAllCategories, setShowAllCategories] = useState(false);
  return (
    <footer className="bg-brand-teal text-white pt-16 border-t border-white/10" id="footer">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 pb-12 border-b border-white/10">
          {/* Column 1: Brand Info (Spans 2 columns on mobile) */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex flex-col space-y-4 pb-4 sm:pb-0 border-b border-white/10 sm:border-b-0">
            <button
              onClick={() => onNavigate && onNavigate('home')}
              className="flex items-center gap-3 text-left cursor-pointer"
            >
              <img
                src="/logo.png"
                alt="Book Vardi"
                className="h-10 w-auto object-contain bg-white p-1 rounded"
              />
              <span className="font-display text-xl font-extrabold text-white tracking-tight">
                BOOK<span className="text-brand-yellow">VARDI</span>
              </span>
            </button>

            <p className="text-xs text-white/70 leading-relaxed max-w-sm lg:max-w-xs">
              Your trusted one-stop destination for premium school stationery,
              curated backpacks, planners, and creative art supplies.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <a href="#" className="w-8 h-8 rounded-full bg-brand-teal-light text-white/80 hover:bg-brand-yellow hover:text-brand-teal-dark flex items-center justify-center transition-all" aria-label="Instagram">
                <InstagramIcon size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-brand-teal-light text-white/80 hover:bg-brand-yellow hover:text-brand-teal-dark flex items-center justify-center transition-all" aria-label="Facebook">
                <FacebookIcon size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-brand-teal-light text-white/80 hover:bg-brand-yellow hover:text-brand-teal-dark flex items-center justify-center transition-all" aria-label="Twitter">
                <TwitterIcon size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-brand-teal-light text-white/80 hover:bg-brand-yellow hover:text-brand-teal-dark flex items-center justify-center transition-all" aria-label="YouTube">
                <YoutubeIcon size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Shop Links */}
          <div className="col-span-1">
            <h4 className="text-xs font-extrabold tracking-widest text-brand-yellow uppercase mb-3 sm:mb-4">
              SHOP
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('products')}
                  className="hover:text-brand-yellow transition-colors cursor-pointer text-left"
                >
                  All Products
                </button>
              </li>
              {(showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 8)).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => onNavigate && onNavigate('products', cat.id)}
                    className="hover:text-brand-yellow transition-colors cursor-pointer text-left truncate max-w-full block"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
              {CATEGORIES.length > 8 && (
                <li>
                  <button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="text-brand-yellow hover:text-white font-bold transition-colors cursor-pointer text-left flex items-center gap-1 mt-1"
                  >
                    {showAllCategories ? 'Show Less' : 'Show More'}
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div className="col-span-1">
            <h4 className="text-xs font-extrabold tracking-widest text-brand-yellow uppercase mb-3 sm:mb-4">
              CUSTOMER SERVICE
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('profile', null, 'orders')}
                  className="hover:text-brand-yellow transition-colors cursor-pointer text-left"
                >
                  Track Order & History
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('profile', null, 'wishlist')}
                  className="hover:text-brand-yellow transition-colors cursor-pointer text-left"
                >
                  Saved Wishlist
                </button>
              </li>
              <li><a href="#" className="hover:text-brand-yellow transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-brand-yellow transition-colors">Shipping & Delivery</a></li>
              <li><a href="#" className="hover:text-brand-yellow transition-colors">Returns & Refunds</a></li>
              <li><a href="#" className="hover:text-brand-yellow transition-colors">Contact Support</a></li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="col-span-1">
            <h4 className="text-xs font-extrabold tracking-widest text-brand-yellow uppercase mb-3 sm:mb-4">
              {isAuthenticated ? 'COMPANY & ACCOUNT' : 'COMPANY INFO'}
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('about')}
                  className="hover:text-brand-yellow transition-colors font-bold text-white text-left cursor-pointer"
                >
                  About Us
                </button>
              </li>
              {isAuthenticated && (
                <li>
                  <button
                    onClick={() => onNavigate && onNavigate('profile', null, 'profile')}
                    className="hover:text-brand-yellow transition-colors text-left cursor-pointer"
                  >
                    My Student Profile
                  </button>
                </li>
              )}
              {isSeller ? (
                <li>
                  <button
                    onClick={() => onNavigate && onNavigate('seller-dashboard')}
                    className="text-brand-yellow hover:text-white font-bold transition-colors text-left cursor-pointer flex items-center gap-1.5"
                  >
                    <Store size={13} />
                    <span>Seller Dashboard (Hub)</span>
                  </button>
                </li>
              ) : (
                <li>
                  <button
                    onClick={() => onNavigate && onNavigate('seller-registration')}
                    className="text-white/80 hover:text-brand-yellow font-bold transition-colors text-left cursor-pointer flex items-center gap-1.5"
                  >
                    <Store size={13} className="text-brand-yellow" />
                    <span>Become a Seller</span>
                  </button>
                </li>
              )}
              {isAdmin && (
                <li>
                  <button
                    onClick={() => onNavigate && onNavigate('admin-dashboard')}
                    className="text-white/90 hover:text-brand-yellow font-bold transition-colors text-left cursor-pointer flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md border border-white/15"
                    title="Open Admin Console"
                  >
                    <ShieldCheck size={13} className="text-brand-yellow" />
                    <span>Admin Dashboard</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('school-bulk-order')}
                  className="hover:text-brand-yellow transition-colors text-left cursor-pointer flex items-center gap-1 font-semibold text-brand-yellow"
                >
                  <span>School Bulk Orders</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('school-directory')}
                  className="hover:text-brand-yellow transition-colors text-left cursor-pointer"
                >
                  School Partners
                </button>
              </li>
              <li><a href="#" className="hover:text-brand-yellow transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-yellow transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Column 5: Trust Pillars (2 columns on mobile, 1 on desktop) */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-1 pt-4 sm:pt-0 border-t border-white/10 sm:border-t-0">
            <h4 className="text-xs font-extrabold tracking-widest text-brand-yellow uppercase mb-3 sm:mb-4">
              WHY CHOOSE US
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3.5 sm:space-y-4 sm:gap-0">
              <div className="flex items-center gap-2.5">
                <Truck size={18} className="text-brand-yellow shrink-0" />
                <div>
                  <div className="text-[11px] sm:text-xs font-bold text-white">FREE SHIPPING</div>
                  <div className="text-[10px] sm:text-[11px] text-white/60">Over ₹499</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <RotateCcw size={18} className="text-brand-yellow shrink-0" />
                <div>
                  <div className="text-[11px] sm:text-xs font-bold text-white">EASY RETURNS</div>
                  <div className="text-[10px] sm:text-[11px] text-white/60">30-Day Hassle Free</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-brand-yellow shrink-0" />
                <div>
                  <div className="text-[11px] sm:text-xs font-bold text-white">SECURE PAYMENT</div>
                  <div className="text-[10px] sm:text-[11px] text-white/60">100% Encrypted</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Headphones size={18} className="text-brand-yellow shrink-0" />
                <div>
                  <div className="text-[11px] sm:text-xs font-bold text-white">24/7 SUPPORT</div>
                  <div className="text-[10px] sm:text-[11px] text-white/60">Human Help</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/60 text-center sm:text-left">
            © {new Date().getFullYear()} Book Vardi Stationery Store. All Rights Reserved. Built with Book Vardi Design System.
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-white text-brand-teal-dark font-extrabold text-[10px] px-2.5 py-1 rounded">UPI</span>
            <span className="bg-white text-brand-teal-dark font-extrabold text-[10px] px-2.5 py-1 rounded">RuPay</span>
            <span className="bg-white text-brand-teal-dark font-extrabold text-[10px] px-2.5 py-1 rounded">VISA</span>
            <span className="bg-white text-brand-teal-dark font-extrabold text-[10px] px-2.5 py-1 rounded">MasterCard</span>
            <span className="bg-white text-brand-teal-dark font-extrabold text-[10px] px-2.5 py-1 rounded">Net Banking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
