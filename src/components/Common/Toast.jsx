import React from 'react';
import { useCart } from '../../context/CartContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toastState, hideToast } = useCart();

  if (!toastState || !toastState.message) return null;

  const { message, type = 'info' } = toastState;

  let containerStyle = 'bg-slate-900 border-l-4 border-l-sky-500 border-slate-700 text-white shadow-2xl';
  let iconBg = 'bg-sky-500/20 text-sky-400';
  let IconComponent = Info;

  if (type === 'success') {
    containerStyle = 'bg-slate-900 border-l-4 border-l-emerald-500 border-slate-700 text-white shadow-2xl';
    iconBg = 'bg-emerald-500/20 text-emerald-400';
    IconComponent = CheckCircle2;
  } else if (type === 'error') {
    containerStyle = 'bg-slate-900 border-l-4 border-l-rose-500 border-slate-700 text-white shadow-2xl';
    iconBg = 'bg-rose-500/20 text-rose-400';
    IconComponent = AlertCircle;
  } else if (type === 'warning') {
    containerStyle = 'bg-slate-900 border-l-4 border-l-amber-500 border-slate-700 text-white shadow-2xl';
    iconBg = 'bg-amber-500/20 text-amber-400';
    IconComponent = AlertTriangle;
  }

  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center gap-3.5 px-4.5 py-3 rounded-xl shadow-2xl border text-xs sm:text-sm font-medium max-w-sm sm:max-w-md w-[92vw] animate-in fade-in slide-in-from-bottom-5 transition-all duration-300 ${containerStyle}`}
      role="status"
      aria-live="polite"
    >
      <div className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center ${iconBg}`}>
        <IconComponent className="w-5 h-5 shrink-0" />
      </div>
      <span className="flex-1 leading-relaxed whitespace-pre-line text-white font-medium">{message}</span>
      {hideToast && (
        <button
          onClick={hideToast}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
