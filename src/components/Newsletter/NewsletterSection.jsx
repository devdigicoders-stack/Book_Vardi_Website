import React, { useState } from 'react';
import { Mail, Send, Check, Loader2, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useCart();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      showToast('⚠️ Please enter a valid email address (e.g. name@school.edu)');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSubscribed(true);
      showToast('🎉 Thank you for subscribing! Use code SCHOOL10 for 10% off.');
    }, 400);
  };

  const handleReset = () => {
    setSubscribed(false);
    setEmail('');
  };

  return (
    <section className="py-12 bg-white" id="newsletter">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl p-6 sm:p-8 md:p-10 bg-gradient-to-r from-brand-yellow/15 via-amber-50/50 to-gray-50 border border-brand-yellow/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 md:gap-8 shadow-xs">
          {/* Info */}
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 max-w-lg">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0 shadow-2xs">
              <Mail size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-brand-ochre text-[10px] font-extrabold uppercase tracking-widest bg-brand-yellow/20 px-2 py-0.5 rounded-md mb-1">
                <Sparkles size={11} />
                <span>STUDENT VIP DEALS</span>
              </div>
              <h4 className="font-display text-lg sm:text-xl font-extrabold uppercase text-brand-teal tracking-wide leading-tight">
                STAY INSPIRED
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                Subscribe to receive exclusive offers, student discounts & back-to-school kits right in your inbox.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="w-full md:w-auto md:max-w-md flex-grow">
            {subscribed ? (
              <div className="bg-white/90 border border-green-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5 text-green-800 text-xs">
                  <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                    <Check size={16} />
                  </span>
                  <div>
                    <span className="font-bold block">You're Subscribed!</span>
                    <span className="text-gray-600 text-[11px]">
                      Use promo code <strong className="text-brand-teal font-extrabold">SCHOOL10</strong> for 10% off.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-brand-teal hover:text-brand-teal-light font-bold hover:underline shrink-0 cursor-pointer self-end sm:self-auto"
                >
                  Subscribe another email
                </button>
              </div>
            ) : (
              <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5" onSubmit={handleSubmit}>
                <div className="relative flex-grow">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    placeholder="Enter your email address..."
                    className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all shadow-2xs"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal-light active:scale-95 disabled:opacity-75 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shrink-0 shadow-xs cursor-pointer hover:shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>SUBSCRIBING...</span>
                    </>
                  ) : (
                    <>
                      <span>SUBSCRIBE</span>
                      <Send size={13} />
                    </>
                  )}
                </button>
              </form>
            )}
            <p className="text-[10px] text-gray-400 mt-2 text-center sm:text-left">
              🔒 We respect your privacy. No spam, unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
