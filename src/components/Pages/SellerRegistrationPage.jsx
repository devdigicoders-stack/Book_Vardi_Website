import React from 'react';
import { ArrowLeft, Home, Store, ShieldCheck, Sparkles } from 'lucide-react';
import SellerRegistrationModal from '../Profile/SellerRegistrationModal';

export default function SellerRegistrationPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <button
              onClick={() => onNavigate && onNavigate('home')}
              className="flex items-center gap-1.5 hover:text-brand-teal transition-colors cursor-pointer"
            >
              <Home size={14} />
              <span>Home</span>
            </button>
            <span>/</span>
            <span className="text-brand-teal font-bold flex items-center gap-1">
              <Store size={14} />
              <span>Seller Registration</span>
            </span>
          </nav>

          <button
            onClick={() => onNavigate && onNavigate('home')}
            className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-brand-teal transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Store</span>
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-linear-to-r from-brand-teal-dark via-brand-teal to-brand-teal-light text-white py-8 sm:py-10 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow/20 border border-brand-yellow/30 text-brand-yellow text-xs font-extrabold uppercase tracking-wider">
            <Sparkles size={13} />
            <span>BookVardi Seller Partner Program</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white tracking-tight">
            Become a Verified BookVardi Seller
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl mx-auto leading-relaxed">
            Complete the KYC & store verification process to list your school uniforms, textbooks, stationery, and kits to thousands of students and parents across India.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-brand-yellow font-semibold">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} /> Automated KYC Verification
            </span>
            <span>•</span>
            <span>Zero Listing Fee</span>
            <span>•</span>
            <span>Pan-India Logistics Support</span>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="shadow-xl rounded-2xl overflow-hidden">
          <SellerRegistrationModal
            isOpen={true}
            isPage={true}
            onClose={() => onNavigate && onNavigate('home')}
          />
        </div>
      </div>
    </div>
  );
}
