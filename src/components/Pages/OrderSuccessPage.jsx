import React, { useState } from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  ArrowRight,
  Printer,
  Copy,
  Check,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function OrderSuccessPage({ onNavigate }) {
  const { lastPlacedOrder, userProfile, isAuthenticated } = useCart();
  const [copied, setCopied] = useState(false);

  // Lazy-initialized fallback order for standalone preview or guest landing
  const [fallbackOrder] = useState(() => ({
    id: 'SC-99824',
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    items: [
      {
        id: 1,
        name: 'Premium College Ruled Spiral Notebook',
        price: 149,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80',
        category: 'Notebooks'
      }
    ],
    shippingAddress: {
      fullName: userProfile?.name || 'Student',
      email: userProfile?.email || 'student@campus.ac.in',
      phone: userProfile?.phone || '+91 98765 43210',
      street: 'Hostel 4, Room 218, North Campus',
      city: 'Delhi',
      pincode: '110007',
      type: 'Campus Hostel'
    },
    deliverySpeed: 'express',
    paymentMethod: 'UPI (Google Pay)',
    subtotal: 298,
    shippingFee: 0,
    discountAmount: 29,
    pointsDiscount: 0,
    total: 269,
    pointsEarned: 50,
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }));

  const order = lastPlacedOrder || (userProfile?.orders && userProfile.orders[0]) || fallbackOrder;

  const handleCopyOrderId = () => {
    if (order?.id) {
      navigator.clipboard?.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50/60 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Celebration Header Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-teal-100 shadow-sm text-center relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-teal via-brand-yellow to-brand-pink" />
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-brand-teal/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-brand-yellow/10 rounded-full blur-2xl pointer-events-none" />

          {/* Success Icon */}
          <div className="relative inline-flex mb-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 size={46} className="animate-bounce-subtle" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-brand-teal text-white p-2 rounded-full shadow-md">
              <Sparkles size={16} />
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2">
            Order Placed Successfully! 🎉
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto">
            Thank you for shopping with <span className="font-bold text-brand-teal">BookVardi</span>. We’ve received your order and our campus dispatch team is packing your stationery!
          </p>

          {/* Order ID & Student Email notification */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 bg-gray-50 border border-gray-200/80 rounded-2xl px-5 py-3">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              Order ID:
            </span>
            <span className="font-mono font-extrabold text-sm text-gray-900">
              #{order.id}
            </span>
            <button
              onClick={handleCopyOrderId}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-teal hover:text-brand-teal-light transition-colors ml-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs"
              title="Copy Order ID"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Confirmation email note */}
          <p className="text-xs text-gray-500 mt-3">
            Invoice & tracking updates dispatched to{' '}
            <strong className="text-gray-700">
              {order.shippingAddress?.email || userProfile?.email || 'your email'}
            </strong>
          </p>

          {/* Student Rewards Banner */}
          <div className="mt-6 max-w-md mx-auto bg-amber-50/80 border border-amber-200/70 rounded-2xl p-3.5 flex items-center justify-center gap-2.5 text-amber-900 text-xs font-bold">
            <Sparkles size={16} className="text-amber-600 shrink-0" />
            <span>
              Hurray! You earned <strong className="text-amber-700 font-black">+{order.pointsEarned || 50} Student Reward Points</strong> on this order!
            </span>
          </div>
        </div>

        {/* Live Order Tracker */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Truck className="text-brand-teal" size={20} />
                Live Order Tracking
              </h2>
              <p className="text-xs text-gray-500">
                BlueDart Express Campus Priority Courier • AWB #{order.id?.replace('SC-', 'BD-') || 'BD-88219'}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-bold self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Estimated Delivery: {order.estimatedDelivery}
            </div>
          </div>

          {/* 4-Step Tracker Flow */}
          <div className="relative pt-2 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              {/* Step 1: Confirmed */}
              <div className="flex sm:flex-col items-center sm:text-center gap-3.5 sm:gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-emerald-50">
                  <Check size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Order Confirmed</h4>
                  <p className="text-[11px] text-gray-400">Payment verified</p>
                </div>
              </div>

              {/* Step 2: Processing (Active) */}
              <div className="flex sm:flex-col items-center sm:text-center gap-3.5 sm:gap-2">
                <div className="w-10 h-10 rounded-full bg-brand-teal text-white flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-teal-50 animate-pulse">
                  <Package size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-teal">Processing & Packing</h4>
                  <p className="text-[11px] text-gray-400">At Central Warehouse</p>
                </div>
              </div>

              {/* Step 3: Shipped */}
              <div className="flex sm:flex-col items-center sm:text-center gap-3.5 sm:gap-2 opacity-60">
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm">
                  <Truck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-700">Out for Campus Transit</h4>
                  <p className="text-[11px] text-gray-400">BlueDart Logistics</p>
                </div>
              </div>

              {/* Step 4: Delivered */}
              <div className="flex sm:flex-col items-center sm:text-center gap-3.5 sm:gap-2 opacity-60">
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-700">Delivered</h4>
                  <p className="text-[11px] text-gray-400">To your hostel desk</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Items Ordered (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="font-display text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <ShoppingBag size={18} className="text-brand-teal" />
                Items in this Package ({order.items?.reduce((s, it) => s + (it.quantity || 1), 0) || order.items?.length || 0})
              </h3>
              <span className="text-xs text-gray-500 font-semibold">
                Placed on {order.date}
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items?.map((item, idx) => (
                <div key={item.id || idx} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 p-1 shrink-0 overflow-hidden border border-gray-200/80">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=200&q=80'}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                        {item.category || 'Stationery'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 truncate mt-1">
                      {item.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Quantity: <strong className="text-gray-700">{item.quantity || 1}</strong> × ₹{item.price}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-gray-900">
                      ₹{(item.price || 0) * (item.quantity || 1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculation Summary */}
            <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-gray-900">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges:</span>
                <span className="font-semibold text-emerald-600">
                  {order.shippingFee === 0 ? 'FREE (Campus Priority)' : `₹${order.shippingFee}`}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount:</span>
                  <span className="font-semibold">-₹{order.discountAmount}</span>
                </div>
              )}
              {order.pointsDiscount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Reward Points Redeemed:</span>
                  <span className="font-semibold">-₹{order.pointsDiscount}</span>
                </div>
              )}
              <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-baseline text-sm font-black text-gray-900">
                <span>Total Amount Paid:</span>
                <span className="font-display text-lg text-brand-teal">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Delivery & Payment Details (1 Col) */}
          <div className="space-y-6">
            
            {/* Delivery Address Details */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <MapPin size={16} className="text-brand-teal" />
                <h4 className="font-display text-sm font-extrabold text-gray-900">
                  Delivery Address
                </h4>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-gray-900 text-sm">{order.shippingAddress?.fullName}</strong>
                  <span className="px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal text-[10px] font-bold">
                    {order.shippingAddress?.type || 'Hostel'}
                  </span>
                </div>
                <p className="text-gray-700">{order.shippingAddress?.street}</p>
                <p className="text-gray-700">
                  {order.shippingAddress?.city}, {order.shippingAddress?.pincode}
                </p>
                <p className="pt-1 text-gray-500 font-medium">
                  Phone: <strong className="text-gray-800">{order.shippingAddress?.phone}</strong>
                </p>
              </div>
            </div>

            {/* Payment Method Details */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <CreditCard size={16} className="text-brand-teal" />
                <h4 className="font-display text-sm font-extrabold text-gray-900">
                  Payment Summary
                </h4>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Method:</span>
                  <span className="font-bold text-gray-800">{order.paymentMethod || 'UPI'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                    <ShieldCheck size={13} />
                    Payment Verified
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium text-gray-700">{order.date}</span>
                </div>
              </div>
            </div>

            {/* Support Note */}
            <div className="bg-brand-teal/5 rounded-2xl p-4 border border-brand-teal/10 text-xs text-gray-600 space-y-1">
              <p className="font-bold text-brand-teal flex items-center gap-1">
                <Calendar size={13} />
                Need assistance with your delivery?
              </p>
              <p className="text-[11px]">
                Reach out to campus support at <strong className="text-gray-800">help@bookvardi.in</strong> or WhatsApp us at <strong className="text-gray-800">+91 98765 43210</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer size={15} />
            Print Tax Invoice
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => onNavigate('profile', { tab: 'orders' })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-colors cursor-pointer"
              >
                View in My Orders
                <ExternalLink size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs shadow-md transition-all cursor-pointer group"
            >
              Continue Shopping
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
