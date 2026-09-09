import React from 'react';
import { useCart } from '../../context/CartContext';

export default function Toast() {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-brand-teal-dark text-white px-5 py-2.5 rounded-full shadow-2xl border border-white/10 text-xs sm:text-sm font-semibold animate-bounce"
      role="status"
      aria-live="polite"
    >
      <span className="w-2 h-2 rounded-full bg-brand-yellow shrink-0" />
      <span>{toastMessage}</span>
    </div>
  );
}
