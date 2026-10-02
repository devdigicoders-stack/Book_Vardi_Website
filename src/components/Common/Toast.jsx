import React from 'react';
import { useCart } from '../../context/CartContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toastState, hideToast } = useCart();

  if (!toastState || !toastState.message) return null;

  const { message, type = 'info' } = toastState;

  let bgStyle = 'bg-slate-900 border-slate-700 text-white';
  let IconComponent = Info;
  let iconColor = 'text-sky-400';

  if (type === 'success') {
    bgStyle = 'bg-emerald-950/95 border-emerald-600/70 text-emerald-100';
    IconComponent = CheckCircle2;
    iconColor = 'text-emerald-400';
  } else if (type === 'error') {
    bgStyle = 'bg-rose-950/95 border-rose-600/70 text-rose-100';
    IconComponent = AlertCircle;
    iconColor = 'text-rose-400';
  } else if (type === 'warning') {
    bgStyle = 'bg-amber-950/95 border-amber-600/70 text-amber-100';
    IconComponent = AlertTriangle;
    iconColor = 'text-amber-400';
  }

  return (
    <div
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-md text-xs sm:text-sm font-semibold max-w-sm sm:max-w-md w-[90vw] animate-in fade-in slide-in-from-bottom-5 transition-all duration-300"
      role="status"
      aria-live="polite"
    >
      <div className={`p-1 rounded-full ${bgStyle}`}>
        <IconComponent className={`w-5 h-5 shrink-0 ${iconColor}`} />
      </div>
      <span className="flex-1 leading-relaxed whitespace-pre-line text-slate-100">{message}</span>
      {hideToast && (
        <button
          onClick={hideToast}
          className="opacity-70 hover:opacity-100 p-1 rounded-md hover:bg-white/10 transition-colors shrink-0 text-slate-300"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
