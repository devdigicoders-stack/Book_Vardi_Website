import React, { useState } from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  ArrowRight,
  Printer,
  Copy,
  Check,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  FileText,
  Download,
  Boxes,
  Navigation,
  QrCode,
  RotateCcw,
  XCircle,
  ArrowRightLeft
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import TaxInvoiceModal from '../Common/TaxInvoiceModal';
import OrderTrackingModal from '../Common/OrderTrackingModal';
import CancelOrderModal from '../Common/CancelOrderModal';
import ReturnExchangeModal from '../Common/ReturnExchangeModal';

export default function OrderSuccessPage({ onNavigate, isDetailsOnly = false, selectedOrder = null }) {
  const { lastPlacedOrder, userProfile, isAuthenticated } = useCart();
  const [copied, setCopied] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

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

  const order = selectedOrder || lastPlacedOrder || (userProfile?.orders && userProfile.orders[0]) || fallbackOrder;
  const shippingFee = order.shippingFee !== undefined
    ? order.shippingFee
    : (order.shippingCost !== undefined ? order.shippingCost : 0);

  const currentStatus = String(order.overallStatus || order.status || '').toLowerCase().trim();
  const isCancelEligible = ['placed', 'pending', 'confirmed', 'processing', 'packed'].includes(currentStatus);
  const isDelivered = ['delivered', 'completed'].includes(currentStatus);
  const firstItem = order.items?.[0] || {};
  const isReturnable = firstItem.isReturnable !== false;
  const returnWindowDays = firstItem.returnWindowDays || 7;
  const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.date || order.createdAt || Date.now());
  const returnTillDate = new Date(deliveredDate.getTime() + returnWindowDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const isReturnWindowValid = isDelivered && isReturnable && now <= returnTillDate && !['return_requested', 'returned', 'exchange_requested', 'exchanged'].includes(currentStatus);
  const formattedTillDate = returnTillDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  const isCancelled = currentStatus === 'cancelled';
  const isCod = /cod|cash\s*on\s*delivery/i.test(String(order.paymentMethod || ''));
  const isPaidOnline = (String(order.paymentStatus || '').toLowerCase() === 'paid') || (!isCod && order.paymentStatus !== 'pending' && order.paymentStatus !== 'unpaid');
  const isPaymentVerified = isPaidOnline;

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
    <div className="min-h-screen bg-gray-50/60 pt-2 pb-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-4">
        {isDetailsOnly && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex items-center justify-between">
            <button
              onClick={() => onNavigate('profile', null, 'orders')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-brand-teal transition-colors cursor-pointer"
            >
              <ArrowRight size={14} className="rotate-180" />
              <span>Back to My Orders</span>
            </button>
            <span className="text-xs font-mono font-extrabold text-brand-teal bg-brand-teal/10 px-3 py-1 rounded-full">
              Order #{order.id}
            </span>
          </div>
        )}

        {!isDetailsOnly && (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-teal-100 shadow-sm text-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-2 ${isCancelled ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-teal via-brand-yellow to-brand-pink'}`} />
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-brand-teal/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-brand-yellow/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative inline-flex mb-5">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-inner ${isCancelled ? 'bg-rose-50 border-4 border-rose-100 text-rose-600' : 'bg-emerald-50 border-4 border-emerald-100 text-emerald-600'}`}>
                {isCancelled ? <XCircle size={46} /> : <CheckCircle2 size={46} className="animate-bounce-subtle" />}
              </div>
              <div className={`absolute -bottom-1 -right-1 text-white p-2 rounded-full shadow-md ${isCancelled ? 'bg-rose-600' : 'bg-brand-teal'}`}>
                <Sparkles size={16} />
              </div>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2">
              {isCancelled ? 'Order Cancelled' : 'Order Placed Successfully! 🎉'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto">
              {isCancelled
                ? 'This order has been cancelled upon customer request.'
                : <>Thank you for shopping with <span className="font-bold text-brand-teal">BookVardi</span>. We’ve received your order and our campus dispatch team is packing your stationery!</>}
            </p>

            {/* Cancellation & Refund Alert Card */}
            {isCancelled && (
              <div className="mt-6 max-w-xl mx-auto bg-rose-50/90 border border-rose-200 rounded-2xl p-4 text-left space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-rose-950 font-extrabold text-xs uppercase tracking-wider">
                  <XCircle size={16} className="text-rose-600 shrink-0" />
                  <span>Cancellation Recorded (Performed by Customer)</span>
                </div>
                <div className="text-xs text-rose-900 bg-white/70 p-3 rounded-xl border border-rose-100 space-y-1">
                  <p><strong>Cancelled By:</strong> <span className="font-semibold text-gray-800">{order.cancelledBy || 'Customer'}</span></p>
                  <p><strong>Reason:</strong> <span className="font-semibold text-gray-800">{order.cancellationReason || 'Cancelled by customer'}</span></p>
                </div>
                {isPaidOnline ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs flex items-start gap-2.5">
                    <CreditCard size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black text-emerald-900 text-xs uppercase tracking-wider mb-0.5">
                        💳 Online Refund Initiated (48 Working Hours)
                      </strong>
                      <span className="text-[11px] text-emerald-900 font-medium leading-relaxed">
                        Since your order was paid online, a full refund of <strong className="text-emerald-950 font-black font-mono">₹{order.total || order.totalAmount}</strong> has been initiated and will be credited to your original payment mode (Bank / UPI / Card) within <strong>48 working hours</strong>.
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-600 font-medium">
                    Cash on Delivery order cancelled. No payment was collected.
                  </p>
                )}
              </div>
            )}

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

              {!isCancelled && (
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:text-brand-teal-dark transition-colors cursor-pointer bg-brand-teal/10 hover:bg-brand-teal/20 px-3 py-1 rounded-lg border border-brand-teal/20 shadow-2xs"
                  title="View & Download Tax Invoice / Bill of Order"
                >
                  <FileText size={13} />
                  <span>Tax Invoice & Bill</span>
                </button>
              )}

              <button
                onClick={() => setIsTrackingModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal-light transition-colors cursor-pointer px-3 py-1 rounded-lg shadow-2xs"
                title="Track Live Courier Shipment AWB"
              >
                <Truck size={13} />
                <span>Track Live Courier Shipment</span>
              </button>

              {isCancelEligible && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer px-3 py-1 rounded-lg shadow-2xs"
                  title="Cancel Order before shipment"
                >
                  <XCircle size={13} />
                  <span>Cancel Order</span>
                </button>
              )}

              {isReturnWindowValid && (
                <button
                  onClick={() => setIsReturnModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors cursor-pointer px-3 py-1 rounded-lg shadow-2xs"
                  title={`Return or Exchange (Available till ${formattedTillDate})`}
                >
                  <ArrowRightLeft size={13} className="text-emerald-700" />
                  <span>Return / Exchange (Till {formattedTillDate})</span>
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Invoice & tracking updates dispatched to{' '}
              <strong className="text-gray-700">
                {order.shippingAddress?.email || userProfile?.email || 'your email'}
              </strong>
            </p>

            <div className="mt-6 max-w-md mx-auto bg-amber-50/80 border border-amber-200/70 rounded-2xl p-3.5 flex items-center justify-center gap-2.5 text-amber-900 text-xs font-bold">
              <Sparkles size={16} className="text-amber-600 shrink-0" />
              <span>
                Hurray! You earned <strong className="text-amber-700 font-black">+{order.pointsEarned || 50} Student Reward Points</strong> on this order!
              </span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                {isCancelled ? (
                  <>
                    <XCircle className="text-rose-600 shrink-0" size={20} />
                    <span>Tracking Terminated — Order Cancelled</span>
                  </>
                ) : (
                  <>
                    <Truck className="text-brand-teal animate-pulse" size={20} />
                    <span>Live Order Tracking</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-gray-500">
                {isCancelled
                  ? 'Fulfillment and courier tracking closed due to order cancellation.'
                  : (order.deliveryMode === 'self_delivery' || order.selfDeliveryDetails?.deliveryPartnerToken
                      ? `Direct Store Self-Delivery • ${order.sellerDetails?.storeName || 'Partner Merchant'} Fleet`
                      : ((order.courierName && order.courierName !== 'N/A') ? `${order.courierName} Logistics • ${order.trackingNumber ? `AWB #${order.trackingNumber}` : 'Awaiting Dispatch'}` : (order.trackingNumber ? `Standard Logistics • AWB #${order.trackingNumber}` : 'Standard Marketplace Logistics Delivery')))}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsTrackingModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all self-start sm:self-auto ${
                isCancelled
                  ? 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  : 'bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal border border-brand-teal/20'
              }`}
            >
              {isCancelled ? <XCircle size={14} className="text-rose-600" /> : <Truck size={14} className="text-brand-teal" />}
              <span>{isCancelled ? 'View Cancellation Status' : 'Launch Live Tracking Modal'}</span>
            </button>
          </div>

          {isCancelled ? (
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-950 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                  <XCircle size={22} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-rose-900">Tracking Closed & Terminated</h4>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    Order cancelled by customer ({order.cancelledBy || 'User'}). Reason: {order.cancellationReason || 'Cancelled by customer'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md bg-rose-200 text-rose-950 shrink-0 border border-rose-300">
                Cancelled
              </span>
            </div>
          ) : (
            <div className="relative py-0">
              <div className="flex items-center justify-between px-2 overflow-x-auto no-scrollbar scrollbar-none flex-nowrap gap-4">
                {[
                  { id: 1, full: 'Order Confirmed', sub: isPaymentVerified ? 'Payment verified' : 'Order placed (Pay on Delivery)', icon: FileText },
                  { id: 2, full: 'Processing & Packing', sub: 'At Merchant Facility', icon: Boxes },
                  { id: 3, full: 'Out for Delivery / Transit', sub: order.deliveryMode === 'self_delivery' ? 'Store Rider Dispatch' : ((order.courierName && order.courierName !== 'N/A') ? order.courierName : 'Logistics Carrier'), icon: Truck },
                  { id: 4, full: 'Delivered', sub: 'To your doorstep/campus', icon: ShieldCheck }
                ].map((step) => {
                  const currentStatus = String(order.overallStatus || order.status || '').toLowerCase();
                  const stepIndex = currentStatus === 'delivered' || currentStatus === 'completed' ? 4 : (currentStatus === 'in_transit' || currentStatus === 'shipped' || currentStatus === 'out_for_delivery' ? 3 : 2);
                  const isUpdated = step.id <= stepIndex;
                  const isCurrent = step.id === stepIndex;
                  const IconComp = step.icon;

                  return (
                    <div
                      key={step.id}
                      onClick={() => setIsTrackingModalOpen(true)}
                      className="flex flex-col items-center justify-center h-16 group cursor-pointer shrink-0"
                      title={`${step.full} • ${step.sub}`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          isCurrent
                            ? 'bg-brand-teal text-white ring-4 ring-brand-teal/30 scale-110 shadow-lg animate-pulse opacity-100'
                            : isUpdated
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-105 shadow-sm opacity-100'
                            : 'bg-gray-100 text-gray-400 border border-gray-200 opacity-90 hover:opacity-100'
                        }`}
                      >
                        <IconComp size={22} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            {(() => {
              const subtotalVal = Number(order.subtotal || order.items?.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0) || order.total || 0);
              const shipVal = Number(order.shippingFee ?? order.shippingCost ?? shippingFee ?? 0);
              const couponVal = Number(order.discountAmount ?? order.discount ?? 0);
              const pointsVal = Number(order.pointsDiscount ?? 0);
              const grandVal = Number(order.total || order.totalAmount || (subtotalVal + shipVal - couponVal - pointsVal));

              return (
                <div className="pt-4 border-t border-gray-100 space-y-2.5 text-xs bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80">
                  <div className="flex justify-between text-gray-700 font-medium">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-gray-900 font-mono">₹{subtotalVal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-start text-gray-700 font-medium">
                    <div>
                      <span>Delivery Charges:</span>
                      <span className="text-[10px] text-gray-400 block font-normal">(Incl. 18% GST)</span>
                    </div>
                    <span className="font-semibold text-emerald-700 font-mono">
                      {shipVal === 0 ? 'FREE' : `₹${shipVal.toFixed(2)}`}
                    </span>
                  </div>

                  {couponVal > 0 ? (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Offer / Coupon Applied:</span>
                      <span className="font-mono">-₹{couponVal.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-gray-400">
                      <span>Offer / Coupon:</span>
                      <span className="font-mono text-gray-400">None Applied (₹0.00)</span>
                    </div>
                  )}

                  {pointsVal > 0 && (
                    <div className="flex justify-between text-amber-700 font-bold">
                      <span>Reward Points Redeemed:</span>
                      <span className="font-mono">-₹{pointsVal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-gray-300 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-black text-gray-900 block">
                        {isPaymentVerified ? 'Total Amount Paid:' : 'Total Amount Payable (COD):'}
                      </span>
                      <span className="text-[10px] text-gray-500 font-normal">(Inclusive of all taxes)</span>
                    </div>
                    <span className="font-display text-lg text-brand-teal font-mono">₹{grandVal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <MapPin size={16} className="text-brand-teal" />
                <h4 className="font-display text-sm font-extrabold text-gray-900">
                  Delivery Address
                </h4>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-gray-900 text-sm">
                    {order.shippingAddress?.fullName || order.shippingAddress?.name || userProfile?.name || 'Customer'}
                  </strong>
                  <span className="px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal text-[10px] font-bold">
                    {order.shippingAddress?.type || order.shippingAddress?.addressType || 'Home'}
                  </span>
                </div>
                <p className="text-gray-700">
                  {order.shippingAddress?.addressLine || order.shippingAddress?.street || order.shippingAddress?.address || ''}
                </p>
                <p className="text-gray-700">
                  {[
                    order.shippingAddress?.city,
                    order.shippingAddress?.state,
                    order.shippingAddress?.pincode
                  ].filter(Boolean).join(', ')}
                </p>
                <p className="pt-1 text-gray-500 font-medium">
                  Phone: <strong className="text-gray-800">{order.shippingAddress?.phone || userProfile?.phone || ''}</strong>
                </p>
              </div>
            </div>

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
                  {isPaymentVerified ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                      <ShieldCheck size={13} />
                      Payment Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] border border-amber-200">
                      <Clock size={13} />
                      Unpaid (Pay on Delivery)
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium text-gray-700">{order.date}</span>
                </div>
              </div>
            </div>

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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setIsInvoiceModalOpen(true)}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 font-extrabold text-xs transition-colors cursor-pointer ${
              isCancelled
                ? 'border-rose-600 text-rose-600 hover:bg-rose-50'
                : 'border-brand-teal text-brand-teal hover:bg-brand-teal/5'
            }`}
          >
            <Printer size={15} />
            {isCancelled ? 'Print Credit Note & Refund Voucher' : 'Print Tax Invoice & Bill'}
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

      <TaxInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={order}
        userProfile={userProfile}
        role="user"
      />

      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        order={order}
      />

      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        order={order}
        onSuccess={() => {
          onNavigate('profile', null, 'orders');
        }}
      />

      <ReturnExchangeModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        order={order}
        onSuccess={() => {
          onNavigate('profile', null, 'orders');
        }}
      />
    </div>
  );
}
