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
  ArrowRightLeft,
  Store,
  Phone,
  Key,
  ChevronRight,
  User
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import TaxInvoiceModal from '../Common/TaxInvoiceModal';
import OrderTrackingModal from '../Common/OrderTrackingModal';
import CancelOrderModal from '../Common/CancelOrderModal';
import ReturnExchangeModal from '../Common/ReturnExchangeModal';
import { isItemReturnable, isItemExchangeable, getReturnExchangeAvailability } from '../../utils/orderReturnPolicy';
import { trackAwbApi } from '../../utils/api';

export default function OrderSuccessPage({ onNavigate, isDetailsOnly = false, selectedOrder = null }) {
  const { lastPlacedOrder, userProfile, isAuthenticated } = useCart();
  const [copied, setCopied] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnModalOrder, setReturnModalOrder] = useState(null);

  const getOrderStatusMeta = (status) => {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'delivered' || s === 'completed') {
      return {
        icon: CheckCircle2,
        label: 'Delivered',
        badgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
        iconClass: 'text-emerald-600'
      };
    }
    if (s === 'return_requested' || s === 'returned') {
      return {
        icon: RotateCcw,
        label: s === 'returned' ? 'Order Returned' : 'Return Requested',
        badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300',
        iconClass: 'text-amber-600'
      };
    }
    if (s === 'exchange_requested' || s === 'exchanged') {
      return {
        icon: ArrowRightLeft,
        label: s === 'exchanged' ? 'Item Exchanged' : 'Exchange Requested',
        badgeClass: 'bg-indigo-100 text-indigo-950 border border-indigo-300',
        iconClass: 'text-indigo-600'
      };
    }
    if (s === 'out_for_delivery' || s === 'out for delivery') {
      return {
        icon: Navigation,
        label: 'Out for Delivery',
        badgeClass: 'bg-purple-100 text-purple-950 border border-purple-300',
        iconClass: 'text-purple-600 animate-pulse'
      };
    }
    if (s === 'shipped' || s === 'in_transit' || s === 'in transit') {
      return {
        icon: Truck,
        label: 'In Transit',
        badgeClass: 'bg-teal-100 text-teal-950 border border-teal-300',
        iconClass: 'text-brand-teal animate-pulse'
      };
    }
    if (s === 'packed' || s === 'confirmed') {
      return {
        icon: Boxes,
        label: s === 'packed' ? 'Packed & Sealed' : 'Confirmed',
        badgeClass: 'bg-blue-100 text-blue-950 border border-blue-300',
        iconClass: 'text-blue-600'
      };
    }
    if (s === 'cancelled' || s === 'canceled') {
      return {
        icon: XCircle,
        label: 'Cancelled',
        badgeClass: 'bg-red-100 text-red-950 border border-red-300',
        iconClass: 'text-red-600'
      };
    }
    return {
      icon: Clock,
      label: status || 'Placed',
      badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300',
      iconClass: 'text-amber-600'
    };
  };

  const [fallbackOrder] = useState(() => ({
    id: 'AAA232345',
    orderId: 'AAA232345',
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
  const orderItems = order.items || [];
  const firstItem = orderItems[0] || {};
  const hasReturnable = orderItems.length > 0
    ? orderItems.some(it => isItemReturnable(it))
    : isItemReturnable(firstItem);
  const hasExchangeable = orderItems.length > 0
    ? orderItems.some(it => isItemExchangeable(it))
    : isItemExchangeable(firstItem);
  const isOrderReturnable = hasReturnable || hasExchangeable;
  const returnWindowDays = firstItem.returnWindowDays || firstItem.product?.returnWindowDays || 7;
  const deliveredDate = (() => {
    if (order.deliveredAt) return new Date(order.deliveredAt);
    if (order.deliveryDetails?.deliveredAt) return new Date(order.deliveryDetails.deliveredAt);
    if (isDelivered) return new Date(order.updatedAt || Date.now());
    return new Date(order.date || order.createdAt || Date.now());
  })();
  const returnTillDate = new Date(deliveredDate.getTime() + returnWindowDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const isReturnWindowValid = isDelivered && isOrderReturnable && now <= returnTillDate && !['return_requested', 'returned', 'exchange_requested', 'exchanged', 'return_approved', 'exchange_approved', 'refund_requested', 'refunded'].includes(currentStatus);
  const formattedTillDate = returnTillDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const daysLeft = Math.max(0, Math.ceil((returnTillDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const orderAvail = getReturnExchangeAvailability(hasReturnable, hasExchangeable, formattedTillDate, daysLeft);

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

              {isReturnWindowValid && orderAvail.actionLabel && (
                <button
                  onClick={() => {
                    setReturnModalOrder(order);
                    setIsReturnModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors cursor-pointer px-3 py-1 rounded-lg shadow-2xs"
                  title={`${orderAvail.actionLabel} (Available till ${formattedTillDate})`}
                >
                  <ArrowRightLeft size={13} className="text-emerald-700" />
                  <span>{orderAvail.shortLabel} (Till {formattedTillDate})</span>
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

        {/* ========================================================================= */}
        {/* LIVE ORDER TRACKING SECTION (ENHANCED FOR STORE SELF-DELIVERY & FLEET)   */}
        {/* ========================================================================= */}
        {(() => {
          const isSelfDelivery = order.deliveryMode === 'self_delivery' ||
            order.deliveryType === 'self_delivery' ||
            order.deliveryType === 'self' ||
            Boolean(order.selfDeliveryDetails?.deliveryPartnerToken) ||
            order.items?.some(it => it.deliveryType === 'self' || it.deliveryType === 'self_delivery' || it.selfDeliveryDetails?.deliveryPartnerToken);

          const selfDetails = order.selfDeliveryDetails ||
            order.items?.find(it => it.selfDeliveryDetails)?.selfDeliveryDetails ||
            order.items?.[0]?.selfDeliveryDetails ||
            null;

          const sellerStoreName = order.sellerDetails?.storeName ||
            order.sellerDetails?.sellerName ||
            order.items?.[0]?.storeName ||
            order.items?.[0]?.sellerDetails?.storeName ||
            order.items?.[0]?.sellerName ||
            'national cloth house';

          const deliveryOtp = selfDetails?.deliveryOtp ||
            order.deliveryOtp ||
            order.items?.[0]?.deliveryOtp ||
            order.items?.[0]?.selfDeliveryDetails?.deliveryOtp ||
            '';

          const riderName = selfDetails?.deliveryBoyName || order.deliveryDetails?.deliveryBoyName || '';
          const riderPhone = selfDetails?.deliveryBoyPhone || order.deliveryDetails?.deliveryBoyPhone || '';
          const vehicleNumber = selfDetails?.vehicleNumber || order.deliveryDetails?.vehicleNumber || '';
          const trackingToken = selfDetails?.deliveryPartnerToken || order.deliveryDetails?.deliveryPartnerToken || order.trackingNumber || '';

          const statusLower = String(order.overallStatus || order.status || '').toLowerCase().trim();
          const stepIndex = (statusLower === 'delivered' || statusLower === 'completed')
            ? 4
            : ((statusLower === 'in_transit' || statusLower === 'shipped' || statusLower === 'out_for_delivery' || statusLower === 'out for delivery')
                ? 3
                : ((statusLower === 'packed' || statusLower === 'processing')
                    ? 2
                    : 1));

          const trackingSteps = [
            {
              id: 1,
              title: 'Order Confirmed',
              desc: isPaymentVerified ? 'Payment Verified' : 'Order Placed (COD)',
              icon: FileText
            },
            {
              id: 2,
              title: 'Packed & Ready',
              desc: isSelfDelivery ? 'Satchel Sealed at Store' : 'Packed at Facility',
              icon: Boxes
            },
            {
              id: 3,
              title: 'Out for Delivery',
              desc: isSelfDelivery ? `${sellerStoreName} Fleet Dispatch` : ((order.courierName && order.courierName !== 'N/A') ? `${order.courierName} In Transit` : 'Logistics Carrier Dispatch'),
              icon: isSelfDelivery ? Navigation : Truck
            },
            {
              id: 4,
              title: 'Delivered',
              desc: 'Doorstep Handoff Verified',
              icon: ShieldCheck
            }
          ];

          const progressPercent = stepIndex === 4 ? 100 : stepIndex === 3 ? 68 : stepIndex === 2 ? 35 : 5;

          const handleCopyOtp = (e) => {
            e.stopPropagation();
            if (deliveryOtp) {
              navigator.clipboard?.writeText(String(deliveryOtp));
              setCopiedOtp(true);
              setTimeout(() => setCopiedOtp(false), 2000);
            }
          };

          const handleCopyToken = (e) => {
            e.stopPropagation();
            if (trackingToken) {
              navigator.clipboard?.writeText(String(trackingToken));
              setCopiedToken(true);
              setTimeout(() => setCopiedToken(false), 2000);
            }
          };

          return (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-6 overflow-hidden relative">
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-700 via-brand-teal to-emerald-500" />

              {/* Header: Title, Fleet Subtitle & Launch Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isCancelled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle size={12} className="text-rose-600" />
                        Tracking Closed
                      </span>
                    ) : stepIndex === 4 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        Delivered Successfully
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                        </span>
                        Live Tracking Active
                      </span>
                    )}

                    <span className="text-[11px] font-semibold text-gray-500">
                      Order #{order.id}
                    </span>
                  </div>

                  <h2 className="font-display text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2.5">
                    {isCancelled ? (
                      <>
                        <XCircle className="text-rose-600 shrink-0" size={24} />
                        <span>Tracking Terminated — Order Cancelled</span>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal shrink-0">
                          <Navigation size={18} className="animate-pulse" />
                        </div>
                        <span>Live Order Tracking</span>
                      </>
                    )}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-600">
                    {isCancelled ? (
                      <span className="text-gray-500">Fulfillment and courier tracking closed due to order cancellation.</span>
                    ) : isSelfDelivery ? (
                      <>
                        <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/80">
                          <Store size={13} className="text-teal-700" />
                          Direct Store Self-Delivery
                        </span>
                        <span className="text-gray-400 font-bold">•</span>
                        <span className="font-extrabold text-gray-900 bg-gray-100/80 px-2.5 py-1 rounded-lg border border-gray-200/60">
                          {sellerStoreName} Fleet
                        </span>
                        {trackingToken && (
                          <>
                            <span className="text-gray-400 font-bold">•</span>
                            <span className="font-mono text-[11px] text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              Token: <strong>{trackingToken}</strong>
                              <button
                                type="button"
                                onClick={handleCopyToken}
                                className="text-gray-400 hover:text-brand-teal ml-0.5 cursor-pointer"
                                title="Copy Token"
                              >
                                {copiedToken ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                              </button>
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80">
                          <Truck size={13} className="text-blue-700" />
                          {order.courierName || 'Logistics Partner'}
                        </span>
                        {order.trackingNumber && (
                          <>
                            <span className="text-gray-400 font-bold">•</span>
                            <span className="font-mono text-xs text-gray-700 font-bold">
                              AWB #{order.trackingNumber}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Launch Live Tracking Modal CTA Button */}
                <div className="shrink-0 flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsTrackingModalOpen(true)}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg group ${
                      isCancelled
                        ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                        : 'bg-gradient-to-r from-brand-teal to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white hover:scale-[1.02]'
                    }`}
                  >
                    {isCancelled ? (
                      <>
                        <XCircle size={16} className="text-rose-600" />
                        <span>View Cancellation Status</span>
                      </>
                    ) : (
                      <>
                        <Navigation size={16} className="text-amber-300 group-hover:rotate-45 transition-transform duration-300" />
                        <span>Launch Live Tracking Modal</span>
                        <ChevronRight size={15} className="text-white/80 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Cancelled View */}
              {isCancelled ? (
                <div className="p-5 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                      <XCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-rose-900">Tracking Closed & Terminated</h4>
                      <p className="text-xs text-rose-800 mt-0.5">
                        Order cancelled by {order.cancelledBy || 'User'}. Reason: {order.cancellationReason || 'Cancelled by customer'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs uppercase tracking-wider font-extrabold px-3 py-1 rounded-lg bg-rose-200 text-rose-950 shrink-0 border border-rose-300 text-center">
                    Cancelled
                  </span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stepper Progress Timeline with Connecting Progress Bar */}
                  <div className="bg-gradient-to-b from-gray-50/90 to-slate-50/50 rounded-2xl p-4 sm:p-6 border border-gray-200/80">
                    <div className="relative">
                      {/* Connecting Background Line */}
                      <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 -translate-y-1/2 z-0 hidden sm:block">
                        <div
                          className="h-full bg-gradient-to-r from-brand-teal via-teal-600 to-emerald-500 transition-all duration-700"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {/* Step Nodes */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2 relative z-10">
                        {trackingSteps.map((step) => {
                          const isCompleted = step.id < stepIndex;
                          const isCurrent = step.id === stepIndex;
                          const StepIcon = step.icon;

                          return (
                            <div
                              key={step.id}
                              onClick={() => setIsTrackingModalOpen(true)}
                              className="flex flex-col items-center text-center cursor-pointer group"
                            >
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 mb-2.5 ${
                                  isCurrent
                                    ? 'bg-brand-teal text-white ring-4 ring-brand-teal/25 shadow-lg scale-110 animate-pulse'
                                    : isCompleted
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white text-gray-400 border-2 border-gray-200 group-hover:border-gray-300'
                                }`}
                              >
                                {isCompleted ? (
                                  <Check size={20} className="stroke-[3]" />
                                ) : (
                                  <StepIcon size={20} className={isCurrent ? "text-amber-300" : ""} />
                                )}
                              </div>

                              <span
                                className={`text-xs font-black transition-colors ${
                                  isCurrent
                                    ? 'text-brand-teal'
                                    : isCompleted
                                    ? 'text-gray-900 font-extrabold'
                                    : 'text-gray-400'
                                }`}
                              >
                                {step.title}
                              </span>
                              <span className="text-[11px] text-gray-500 leading-tight mt-0.5 max-w-[140px]">
                                {step.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Store Fleet & Rider Handshake Info Banner */}
                  {isSelfDelivery && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                      {/* Merchant Dispatch Node */}
                      <div className="bg-teal-50/60 rounded-2xl p-3.5 border border-teal-100 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                          <Store size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 block">
                            Direct Merchant Dispatch
                          </span>
                          <strong className="text-xs font-black text-gray-900 truncate block mt-0.5">
                            {sellerStoreName}
                          </strong>
                          <span className="text-[11px] text-gray-600 block">
                            Direct store self-delivery fleet
                          </span>
                        </div>
                      </div>

                      {/* Rider & Executive Info */}
                      <div className="bg-amber-50/60 rounded-2xl p-3.5 border border-amber-100 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                          <Navigation size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                            Delivery Executive
                          </span>
                          <strong className="text-xs font-black text-gray-900 truncate block mt-0.5">
                            {riderName || `${sellerStoreName} Store Rider`}
                          </strong>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                            {vehicleNumber && (
                              <span className="text-gray-600 font-mono bg-white/80 px-1.5 py-0.2 rounded border border-amber-200/60 text-[10px]">
                                {vehicleNumber}
                              </span>
                            )}
                            {riderPhone ? (
                              <a
                                href={`tel:${riderPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 font-bold text-amber-900 hover:underline"
                              >
                                <Phone size={11} />
                                {riderPhone}
                              </a>
                            ) : (
                              <span className="text-gray-500">Contact via store dispatch</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delivery Security OTP */}
                      {deliveryOtp ? (
                        <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-200 flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                              <Key size={18} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                                Handshake Security OTP
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-base font-black text-emerald-950 tracking-widest bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                                  {deliveryOtp}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleCopyOtp}
                                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                  title="Copy Delivery OTP"
                                >
                                  {copiedOtp ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                                  <span>{copiedOtp ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                              <span className="text-[10px] text-emerald-700 mt-1 block">
                                Share with rider upon arrival
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-2xl p-3.5 border border-gray-200 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                            <ShieldCheck size={18} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                              Doorstep Verification
                            </span>
                            <strong className="text-xs font-black text-gray-800 block mt-0.5">
                              Contactless Delivery
                            </strong>
                            <span className="text-[11px] text-gray-500 block">
                              Package handed over securely
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interactive Trigger Banner */}
                  <div
                    onClick={() => setIsTrackingModalOpen(true)}
                    className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-800/80 border border-teal-600/40 flex items-center justify-center text-teal-200 shrink-0">
                        <Navigation size={18} className="text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                          <span>Interactive Live Tracking Console</span>
                          <span className="text-[10px] font-bold text-teal-300 bg-teal-800/60 px-2 py-0.5 rounded-full border border-teal-700/50">
                            Real-time
                          </span>
                        </h4>
                        <p className="text-[11px] text-teal-200/80 mt-0.5">
                          Click to open detailed checkpoint timestamps, rider routing, and delivery verification.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-xs font-bold text-amber-300 group-hover:underline">
                        Open Modal
                      </span>
                      <ChevronRight size={15} className="text-amber-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
              {order.items?.map((item, idx) => {
                const itemRawStatus = String(item.status || order.overallStatus || order.status || 'Pending').toLowerCase().trim();
                const itemStatMeta = getOrderStatusMeta(itemRawStatus);
                const ItemStatusIcon = itemStatMeta.icon;

                const itemIsRet = isItemReturnable(item);
                const itemIsExc = isItemExchangeable(item);
                const itemReturnWindowDays = item.returnWindowDays || item.product?.returnWindowDays || returnWindowDays;
                const itemTillDate = new Date(deliveredDate.getTime() + itemReturnWindowDays * 24 * 60 * 60 * 1000);
                const itemFormattedTillDate = itemTillDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                const itemDaysLeft = Math.max(0, Math.ceil((itemTillDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                const isItemDelivered = ['delivered', 'completed'].includes(itemRawStatus) || isDelivered;
                const isItemWindowValid = isItemDelivered && (itemIsRet || itemIsExc) && now <= itemTillDate && !['return_requested', 'returned', 'exchange_requested', 'exchanged', 'return_approved', 'exchange_approved', 'refund_requested', 'refunded'].includes(currentStatus);
                const itemAvail = getReturnExchangeAvailability(itemIsRet, itemIsExc, itemFormattedTillDate, itemDaysLeft);

                return (
                  <div key={item.id || idx} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-center gap-4">
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
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${itemStatMeta.badgeClass}`}>
                            <ItemStatusIcon size={11} className={itemStatMeta.iconClass} />
                            <span>{itemStatMeta.label}</span>
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 truncate mt-1">
                          {item.name}
                        </h4>
                        {(() => {
                          const isMeter = Boolean(
                            item.isMeterBased ||
                            item.unit === 'meter' ||
                            String(item.category || '').toLowerCase().includes('unstitched') ||
                            String(item.subCategory || '').toLowerCase().includes('unstitched') ||
                            String(item.name || '').toLowerCase().includes('unstitched')
                          );
                          const lineQty = isMeter ? `${Number(item.quantity || 1).toFixed(2)}m` : (item.quantity || 1);
                          const linePrice = Number(item.price || 0).toFixed(2);
                          const lineTotal = (Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2);
                          return (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {isMeter ? 'Length: ' : 'Quantity: '}<strong className="text-gray-700 font-mono">{lineQty}</strong> × ₹{linePrice}{isMeter ? '/m' : ''}
                            </p>
                          );
                        })()}
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-gray-900 font-mono">
                          ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Item-level Return / Exchange Policy Tag & Button if Delivered */}
                    {isItemDelivered && (
                      <div className={`pt-2 border-t border-gray-200/60 flex items-center justify-between gap-2 text-[11px] flex-wrap ${
                        isItemWindowValid
                          ? 'text-emerald-950'
                          : (itemIsRet || itemIsExc)
                          ? 'text-amber-950'
                          : 'text-gray-500'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <RotateCcw size={12} className={isItemWindowValid ? "text-emerald-600 shrink-0" : "text-gray-400 shrink-0"} />
                          <span>
                            {isItemWindowValid ? (
                              itemAvail.mode === 'both' ? (
                                <>Return / Exchange available till <strong className="font-mono text-emerald-950 font-black">{itemFormattedTillDate}</strong> ({itemDaysLeft} days left)</>
                              ) : itemAvail.mode === 'return_only' ? (
                                <>Return available till <strong className="font-mono text-emerald-950 font-black">{itemFormattedTillDate}</strong> ({itemDaysLeft} days left)</>
                              ) : (
                                <>Exchange available till <strong className="font-mono text-emerald-950 font-black">{itemFormattedTillDate}</strong> ({itemDaysLeft} days left)</>
                              )
                            ) : (itemIsRet || itemIsExc) ? (
                              itemAvail.mode === 'both' ? (
                                <>Return / Exchange window closed on <strong className="font-mono">{itemFormattedTillDate}</strong></>
                              ) : itemAvail.mode === 'return_only' ? (
                                <>Return window closed on <strong className="font-mono">{itemFormattedTillDate}</strong></>
                              ) : (
                                <>Exchange window closed on <strong className="font-mono">{itemFormattedTillDate}</strong></>
                              )
                            ) : (
                              <>Non-Returnable & Non-Exchangeable Product Policy</>
                            )}
                          </span>
                        </div>

                        {isItemWindowValid && itemAvail.actionLabel && (
                          <button
                            type="button"
                            onClick={() => {
                              setReturnModalOrder({ ...order, selectedItem: item });
                              setIsReturnModalOpen(true);
                            }}
                            className="text-[10px] font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
                          >
                            <ArrowRightLeft size={11} />
                            <span>{itemAvail.actionLabel}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
        order={returnModalOrder || order}
        onSuccess={() => {
          onNavigate('profile', null, 'orders');
        }}
      />
    </div>
  );
}
