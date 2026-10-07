import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  X, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2,
  FileText,
  Boxes,
  Navigation,
  XCircle,
  Phone,
  MessageSquare,
  Copy,
  Check,
  Store,
  User,
  Key,
  RotateCcw,
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';
import BulkOrderTrackingModal from './BulkOrderTrackingModal';
import { trackAwbApi, downloadInvoiceApi } from '../../utils/api';

const hasActiveReturnRequest = (order) => {
  if (!order) return false;
  const req = order.returnRequest;
  if (req && typeof req === 'object') {
    const type = req.requestType || req.type;
    const status = String(req.status || '').toLowerCase().trim();
    const invalidStatuses = ['', 'none', 'n/a', 'no_request', 'normal', 'null', 'undefined', 'requesting', 'requested'];
    
    if (type && !['none', 'n/a', ''].includes(String(type).toLowerCase())) return true;
    if (status && !invalidStatuses.includes(status)) return true;
    if (req.requestedAt) return true;
    if (req.reason && req.reason !== 'N/A' && req.reason.trim() !== '') return true;
  }
  
  const s = String(order.status || order.rawStatus || '').toLowerCase();
  const returnStatuses = [
    'return_requested', 'exchange_requested', 'return_approved', 'exchange_approved',
    'return_rejected', 'exchange_rejected', 'pickup_scheduled', 'product_received',
    'refund_initiated', 'refund_processed', 'refund_completed', 'exchanged', 'exchange_dispatched',
    'refund_requested', 'refunded'
  ];
  return returnStatuses.includes(s);
};

const getItemStatusMeta = (status) => {
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
      label: s === 'returned' ? 'Returned' : 'Return Requested',
      badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300',
      iconClass: 'text-amber-600'
    };
  }
  if (s === 'exchange_requested' || s === 'exchanged') {
    return {
      icon: ArrowRightLeft,
      label: s === 'exchanged' ? 'Exchanged' : 'Exchange Requested',
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
      label: 'Shipped',
      badgeClass: 'bg-teal-100 text-teal-950 border border-teal-300',
      iconClass: 'text-brand-teal'
    };
  }
  if (s === 'packed' || s === 'confirmed') {
    return {
      icon: Boxes,
      label: s === 'packed' ? 'Packed' : 'Confirmed',
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
    label: status || 'Pending',
    badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300',
    iconClass: 'text-amber-600'
  };
};

export default function OrderTrackingModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const isBulkOrder = Boolean(
    order.referenceId ||
    order.institutionName ||
    order.requirements ||
    order.requirementSummary ||
    order.orderType === 'bulk' ||
    order.isBulkOrder ||
    order.isGlobalRfq ||
    order.isGlobal ||
    order.bulkOrderId ||
    order.quotations
  );
  if (isBulkOrder) {
    return <BulkOrderTrackingModal isOpen={isOpen} onClose={onClose} order={order} />;
  }

  const orderId = order.id || order.orderId || order._id;
  const rawTracking = order.trackingNumber || order.shipmentDetails?.awbNumber || '';

  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Check if self-delivery vs 3rd-party
  const isSelfDelivery = order.deliveryMode === 'self_delivery' ||
    order.deliveryType === 'self_delivery' ||
    order.deliveryType === 'self' ||
    Boolean(order.selfDeliveryDetails?.deliveryPartnerToken) ||
    order.items?.some(it => it.deliveryType === 'self' || it.deliveryType === 'self_delivery' || it.selfDeliveryDetails?.deliveryPartnerToken);

  const selfDetails = order.selfDeliveryDetails ||
    trackingData?.selfDeliveryDetails ||
    order.items?.find(it => it.selfDeliveryDetails)?.selfDeliveryDetails ||
    order.items?.[0]?.selfDeliveryDetails ||
    null;

  const sellerInfo = order.sellerDetails ||
    trackingData?.sellerDetails ||
    order.items?.find(it => it.sellerDetails)?.sellerDetails ||
    order.items?.[0]?.sellerDetails ||
    null;

  const sellerStoreName = sellerInfo?.storeName ||
    sellerInfo?.sellerName ||
    order.items?.[0]?.storeName ||
    order.items?.[0]?.sellerName ||
    'Partner Merchant';

  const sellerAddress = sellerInfo?.address ||
    sellerInfo?.city ||
    order.items?.[0]?.sellerAddress ||
    'Local Merchant Facility';

  const deliveryOtp = order.deliveryOtp ||
    selfDetails?.deliveryOtp ||
    order.shipmentDetails?.deliveryOtp ||
    trackingData?.deliveryOtp ||
    order.items?.find(it => it.deliveryOtp)?.deliveryOtp ||
    order.items?.find(it => it.selfDeliveryDetails?.deliveryOtp)?.selfDeliveryDetails?.deliveryOtp ||
    order.items?.[0]?.deliveryOtp ||
    order.items?.[0]?.selfDeliveryDetails?.deliveryOtp ||
    order.deliveryCode ||
    (order.orderId ? String(order.orderId).replace(/\D/g, '').slice(-4) : '') ||
    (order.id ? String(order.id).replace(/\D/g, '').slice(-4) : '') ||
    '4829';

  const selfToken = selfDetails?.deliveryPartnerToken || (isSelfDelivery ? (rawTracking || '') : '');

  const courierPartnerName = isSelfDelivery
    ? (sellerStoreName ? `${sellerStoreName} Direct Fleet` : 'Direct Store Delivery')
    : (order.courierName || trackingData?.courierPartnerName || order.shipmentDetails?.courierPartnerName || (rawTracking ? 'Courier Partner' : 'Standard Logistics'));

  const awbNumber = isSelfDelivery ? selfToken : (rawTracking || trackingData?.awbNumber || '');

  // Carrier tracking URL builder
  const resolveCarrierUrl = (courier, tracking) => {
    if (!tracking) return '';
    const c = String(courier || '').toLowerCase();
    if (c.includes('delhivery')) return `https://www.delhivery.com/track/package/${tracking}`;
    if (c.includes('bluedart') || c.includes('blue dart')) return `https://www.bluedart.com/tracking?awb=${tracking}`;
    if (c.includes('dtdc')) return `https://www.dtdc.in/tracking/shipment-tracking.asp?awb=${tracking}`;
    if (c.includes('ekart')) return `https://ekartlogistics.com/shipmenttrack/${tracking}`;
    if (c.includes('indiapost') || c.includes('speedpost')) return `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`;
    return `https://track.shiprocket.in/tracking/${tracking}`;
  };

  const carrierTrackingUrl = order.trackingUrl || trackingData?.trackingUrl || (isSelfDelivery ? (selfDetails?.trackingUrl || (selfToken ? `${window.location.origin}/#delivery-partner?token=${encodeURIComponent(selfToken)}` : '')) : resolveCarrierUrl(courierPartnerName, awbNumber));

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setLoading(true);
      const queryAwb = awbNumber || orderId;
      const trackFn = typeof trackAwbApi === 'function' ? trackAwbApi : null;
      if (trackFn) {
        trackFn(queryAwb)
          .then((data) => {
            if (isMounted) {
              setTrackingData(data);
              setLoading(false);
            }
          })
          .catch(() => {
            if (isMounted) setLoading(false);
          });
      } else {
        if (isMounted) setLoading(false);
      }
    }
    return () => { isMounted = false; };
  }, [isOpen, awbNumber, orderId]);

  const copyToClipboard = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'otp') {
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const currentStatus = String(order.overallStatus || order.status || 'shipped').toLowerCase().trim();
  const isCancelled = currentStatus === 'cancelled';

  // Stepper steps
  const steps = isSelfDelivery ? [
    { key: 'placed', label: 'Order Placed', desc: 'Received at store', icon: FileText },
    { key: 'confirmed', label: 'Confirmed', desc: 'Store accepted', icon: CheckCircle2 },
    { key: 'packed', label: 'Packed & Ready', desc: 'Satchel sealed', icon: Boxes },
    { key: 'shipped', label: 'Rider Assigned', desc: 'Rider picked up', icon: Navigation },
    { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider on the way', icon: Navigation },
    { key: 'delivered', label: 'Delivered', desc: 'Handoff verified', icon: ShieldCheck }
  ] : [
    { key: 'placed', label: 'Order Placed', desc: 'Received by store', icon: FileText },
    { key: 'confirmed', label: 'Confirmed', desc: 'Manifest created', icon: CheckCircle2 },
    { key: 'packed', label: 'Packed & Sealed', desc: 'Ready for courier', icon: Boxes },
    { key: 'shipped', label: 'In Transit', desc: 'Routing through hub', icon: Truck },
    { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Delivery arriving', icon: Navigation },
    { key: 'delivered', label: 'Delivered', desc: 'Handed over', icon: ShieldCheck }
  ];

  let activeIndex = 3;
  if (currentStatus === 'placed' || currentStatus === 'pending') activeIndex = 0;
  else if (currentStatus === 'confirmed') activeIndex = 1;
  else if (currentStatus === 'packed') activeIndex = 2;
  else if (currentStatus === 'shipped' || currentStatus === 'in_transit' || currentStatus === 'in transit') activeIndex = 3;
  else if (currentStatus === 'out_for_delivery' || currentStatus === 'out for delivery') activeIndex = 4;
  else if (currentStatus === 'delivered' || currentStatus === 'completed') activeIndex = 5;

  const CurrentStatusIcon = isCancelled ? XCircle : (steps[activeIndex]?.icon || (isSelfDelivery ? Navigation : Truck));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none">
        
        {/* Header Bar - Dark Gradient matching Bulk Tracking Modal */}
        <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-teal-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800/80 border border-teal-600/50 flex items-center justify-center text-teal-200 font-extrabold shadow-inner shrink-0">
              <CurrentStatusIcon size={22} className={!isCancelled && (activeIndex === 3 || activeIndex === 4) ? "animate-pulse text-amber-400" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black uppercase text-teal-300 bg-teal-900/80 px-2 py-0.5 rounded border border-teal-700/60">
                  #{orderId}
                </span>
                <span className="text-[10px] font-bold text-teal-200 bg-teal-800/50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-teal-700/40">
                  <ShieldCheck size={11} className="text-emerald-400" />
                  {isSelfDelivery ? '🛵 Direct Store Delivery' : '🚚 Courier Network Delivery'}
                </span>
              </div>
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white leading-tight mt-0.5">
                {isCancelled ? `Order #${orderId} (Cancelled)` : (order.items?.[0]?.name || `Order #${orderId}`)}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-teal-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-gray-800">
          
          {/* Cancellation Banner */}
          {isCancelled && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-950 space-y-2">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-700">
                <XCircle size={16} />
                <span>Shipment Terminated — Order Cancelled</span>
              </div>
              <p className="text-xs text-rose-900">
                <strong>Cancelled By:</strong> {order.cancelledBy || 'Customer'} • <strong>Reason:</strong> {order.cancellationReason || 'Cancelled by customer'}
              </p>
            </div>
          )}

          {/* Return / Exchange Request Live Status */}
          {hasActiveReturnRequest(order) && (
            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl text-amber-950 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-amber-900">
                  <RotateCcw size={16} className="text-amber-700" />
                  <span>{order.returnRequest.requestType === 'exchange' ? '🔄 Product Exchange Tracking' : '📦 Return & Refund Tracking'}</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                  order.returnRequest.status?.includes('approved') ? 'bg-blue-100 text-blue-900 border-blue-300' :
                  order.returnRequest.status?.includes('completed') || order.returnRequest.status === 'exchanged' || order.returnRequest.status === 'refund_completed' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                  order.returnRequest.status === 'rejected' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                  'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {order.returnRequest.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-800">
                <div><strong>Reason:</strong> {order.returnRequest.reason || 'N/A'}</div>
                {order.returnRequest.targetSize && <div><strong>Requested Size:</strong> <span className="font-bold text-teal-800">{order.returnRequest.targetSize}</span></div>}
                {order.returnRequest.rejectionReason && <div className="text-rose-800 font-bold"><strong>Rejection:</strong> {order.returnRequest.rejectionReason}</div>}
                {order.returnRequest.pickupDate && <div><strong>Scheduled Pickup:</strong> {new Date(order.returnRequest.pickupDate).toLocaleDateString('en-IN')}</div>}
                {order.returnRequest.refundTxnId && <div><strong>Refund Ref:</strong> <span className="font-mono font-bold text-emerald-800">{order.returnRequest.refundTxnId}</span></div>}
                {order.returnRequest.exchangeAwb && <div><strong>Replacement AWB:</strong> <span className="font-mono font-bold text-blue-800">{order.returnRequest.exchangeAwb}</span></div>}
              </div>

              {/* Event Timeline Log */}
              {Array.isArray(order.returnRequest.timeline) && order.returnRequest.timeline.length > 0 && (
                <div className="pt-2 border-t border-amber-200/60 space-y-1">
                  <div className="font-bold text-[10px] text-amber-900 uppercase tracking-wider">
                    Status Timeline Log
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    {order.returnRequest.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-700">
                        <span className="text-amber-600 font-bold">•</span>
                        <span className="font-bold text-gray-900">{item.label}</span>
                        <span className="text-[10px] text-gray-400">({new Date(item.timestamp).toLocaleString('en-IN')})</span>
                        {item.note && <span className="text-gray-500 italic">- {item.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Handover OTP Highlight Banner (Live Courier Track / Self-Delivery) */}
          {!isCancelled && deliveryOtp && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                  <Key size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded">
                      {isSelfDelivery ? 'Direct Delivery Security Code' : 'Live Courier Handover OTP'}
                    </span>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                      Doorstep Verification
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-emerald-950 mt-0.5">
                    Share OTP Upon Delivery Arrival
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    {isSelfDelivery
                      ? 'Provide this 4-digit code to the store delivery executive at your doorstep to safely verify receipt.'
                      : 'Provide this 4-digit code to the courier delivery partner at your doorstep to safely confirm parcel handover.'}
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-emerald-500 px-4 py-2.5 rounded-2xl text-center self-stretch sm:self-center shrink-0 shadow-sm flex sm:flex-col items-center justify-between sm:justify-center gap-2">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Delivery OTP</div>
                  <div className="font-mono text-2xl font-black text-emerald-700 tracking-widest leading-none mt-0.5">
                    {deliveryOtp}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(deliveryOtp, 'otp')}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy Delivery OTP"
                >
                  {copiedOtp ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                  <span>{copiedOtp ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Current Status Banner - Dark Teal Gradient matching Bulk Order Tracker */}
          <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white p-4.5 rounded-2xl shadow-md border border-teal-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-brand-yellow shrink-0 shadow-inner">
                {isCancelled ? (
                  <XCircle size={26} className="text-rose-400" />
                ) : activeIndex === 5 ? (
                  <CheckCircle2 size={26} className="text-emerald-400" />
                ) : activeIndex >= 3 ? (
                  <Truck size={26} className="animate-pulse text-amber-400" />
                ) : (
                  <Clock size={26} />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-700/50">
                  {isCancelled ? 'Order Terminated' : (isSelfDelivery ? 'Direct Delivery Mode' : 'Courier Network Mode')}
                </span>
                <h4 className="font-display font-extrabold text-base text-white mt-1">
                  {isCancelled ? 'Order Cancelled' : steps[activeIndex]?.label}
                </h4>
                <p className="text-[11px] text-teal-100/90 font-medium">
                  {isCancelled
                    ? 'Shipping stopped due to order cancellation.'
                    : (isSelfDelivery
                        ? `Merchant Store: ${sellerStoreName}`
                        : `${steps[activeIndex]?.desc} • Carrier: ${courierPartnerName}`)}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-white/10 p-2.5 rounded-xl border border-white/10 w-full sm:w-auto">
              <div className="text-[10px] text-teal-300 font-semibold uppercase">Order Total</div>
              <div className="text-sm font-black text-white">₹{Number(order.total || order.totalAmount || 0).toLocaleString()}</div>
              <div className="text-[10px] text-teal-200">
                {order.items?.length || 1} Item{(order.items?.length || 1) > 1 ? 's' : ''} • {order.paymentMethod || 'Online'}
              </div>
            </div>
          </div>

          {/* Stepper Milestones Progress Timeline */}
          {!isCancelled && (
            <div className="bg-gray-50 border border-gray-200/80 p-4 sm:p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                <span>Live Fulfillment Journey</span>
                <span className="text-teal-700 font-mono text-xs">Stage {activeIndex + 1} of {steps.length}</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                {steps.map((st, idx) => {
                  const isCompleted = activeIndex >= idx;
                  const isCurrent = activeIndex === idx;
                  const StepIcon = st.icon;
                  return (
                    <div key={idx} className="flex flex-col items-center text-center p-2 rounded-xl bg-white border border-gray-100 shadow-2xs">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                        isCurrent
                          ? 'bg-teal-800 text-white ring-2 ring-teal-600 animate-pulse shadow-xs'
                          : isCompleted
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}>
                        {isCompleted && !isCurrent ? <Check size={16} /> : <StepIcon size={16} />}
                      </div>
                      <span className={`text-[11px] font-bold mt-2 leading-tight ${isCurrent ? 'text-teal-800 font-extrabold' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {st.label}
                      </span>
                      <span className="text-[9px] text-gray-400 line-clamp-1 mt-0.5">
                        {st.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Direct Delivery Executive / Courier Carrier Details Card */}
          {(!isCancelled && (isSelfDelivery || awbNumber)) && (
            <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Truck size={15} className="text-blue-700" />
                  {isSelfDelivery ? 'Direct Store Delivery Executive Details' : 'Courier Shipment & Dispatch Details'}
                </span>
                <span className="text-[10px] font-mono font-bold bg-white text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {isSelfDelivery ? `Fleet Token: ${selfToken || 'ASSIGNED'}` : `AWB: ${awbNumber || 'PENDING'}`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">
                    {isSelfDelivery ? 'Rider / Executive' : 'Logistics Carrier'}
                  </span>
                  <span className="font-extrabold text-gray-900 text-xs block mt-0.5">
                    {isSelfDelivery ? (selfDetails?.deliveryPersonName || 'Store Fleet Executive') : courierPartnerName}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {isSelfDelivery ? 'Store Direct Fleet' : '3rd-Party Courier Network'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Executive Contact</span>
                  {isSelfDelivery && selfDetails?.deliveryPersonPhone ? (
                    <a href={`tel:${selfDetails.deliveryPersonPhone.replace(/\D/g, '')}`} className="font-extrabold text-blue-700 hover:underline text-xs block mt-0.5 flex items-center gap-1">
                      <Phone size={12} /> {selfDetails.deliveryPersonPhone}
                    </a>
                  ) : (
                    <span className="text-gray-500 text-xs block mt-0.5">
                      {isSelfDelivery ? 'Shared on dispatch' : 'Courier Helpline'}
                    </span>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">
                    {isSelfDelivery ? 'Vehicle Number' : 'Est. Delivery'}
                  </span>
                  <span className="font-mono font-extrabold text-gray-900 text-xs block mt-0.5">
                    {isSelfDelivery ? (selfDetails?.vehicleNumber || 'Store Delivery Fleet') : (trackingData?.estimatedDeliveryDate ? new Date(trackingData.estimatedDeliveryDate).toLocaleDateString('en-IN') : '2-3 Business Days')}
                  </span>
                  <span className="text-[10px] text-gray-500">Fulfillment Transport</span>
                </div>
              </div>
            </div>
          )}

          {/* Ordered Products Breakdown */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-100 p-3 font-extrabold text-xs text-gray-800 flex items-center justify-between border-b border-gray-200">
              <span className="flex items-center gap-1.5">
                <Package size={15} className="text-teal-700" /> Ordered Items Breakdown
              </span>
              <span className="text-[11px] font-bold text-gray-600">
                {order.items?.length || 1} Item Types
              </span>
            </div>

            <div className="divide-y divide-gray-100 bg-white">
              {order.items?.map((item, idx) => {
                const itemStore = item.storeName || item.sellerName || item.sellerDetails?.storeName || sellerStoreName;
                const isMeter = Boolean(
                  item.isMeterBased ||
                  item.unit === 'meter' ||
                  String(item.category || '').toLowerCase().includes('unstitched') ||
                  String(item.subCategory || '').toLowerCase().includes('unstitched') ||
                  String(item.name || '').toLowerCase().includes('unstitched')
                );

                const rawQty = Number(item.quantity || 1);
                const formattedQty = isMeter ? `${rawQty.toFixed(2)}m` : (rawQty % 1 === 0 ? rawQty : rawQty.toFixed(2));

                let formattedSize = '';
                if (item.size) {
                  const sizeStr = String(item.size).trim();
                  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(m|meter|meters)?$/i);
                  if (match) {
                    const num = parseFloat(match[1]);
                    const hasMeter = isMeter || Boolean(match[2]);
                    formattedSize = hasMeter ? `${num.toFixed(2)}m` : sizeStr;
                  } else {
                    formattedSize = sizeStr;
                  }
                }

                const linePrice = Number(item.price || 0).toFixed(2);
                const lineTotal = (Number(item.price || 0) * rawQty).toFixed(2);
                const itemRawStatus = String(item.status || order.overallStatus || order.status || 'Pending').toLowerCase().trim();
                const itemStatMeta = getItemStatusMeta(itemRawStatus);
                const ItemStatusIcon = itemStatMeta.icon;
                const itemTracking = item.trackingNumber || item.thirdPartyDetails?.trackingNumber || item.awbNumber || '';
                const itemCourier = item.courierName || item.thirdPartyDetails?.courierName || '';

                return (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 font-bold text-xs shrink-0">
                          BV
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 text-xs">{item.name}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${itemStatMeta.badgeClass}`}>
                            <ItemStatusIcon size={10} className={itemStatMeta.iconClass} />
                            <span>{itemStatMeta.label}</span>
                          </span>
                        </div>
                        {itemTracking && (
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {itemCourier ? `${itemCourier} • ` : ''}AWB: <strong>{itemTracking}</strong>
                          </div>
                        )}
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>
                            {isMeter ? 'Length: ' : 'Qty: '}
                            <strong className="text-gray-900 font-mono">{formattedQty}</strong>
                          </span>
                          {formattedSize && (
                            <span>
                              • Size: <strong className="text-gray-800 font-mono">{formattedSize}</strong>
                            </span>
                          )}
                          {item.color && (
                            <span>• Color: {item.color}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-teal-900 font-semibold flex items-center gap-1 mt-0.5">
                          <Store size={11} /> Sold by: {itemStore}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-gray-900">₹{lineTotal}</div>
                      <div className="text-[10px] text-gray-400 font-mono">₹{linePrice} {isMeter ? '/ m' : '/ unit'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer & Merchant Info Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">
                Fulfilling Merchant Store
              </span>
              <div className="font-extrabold text-gray-900">{sellerStoreName}</div>
              <div className="text-gray-600 text-[11px]">{sellerAddress}</div>
              <div className="text-gray-500 font-mono text-[10px] font-bold pt-0.5">
                GSTIN: {sellerInfo?.gstNumber || sellerInfo?.gst || '09AAACB1234F1Z9'}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">
                Delivery Destination Address
              </span>
              <div className="font-extrabold text-gray-900">
                {typeof order.shippingAddress === 'object' ? (order.shippingAddress.name || order.customerName || 'Customer') : (order.customerName || 'Customer')}
              </div>
              <div className="text-gray-600 text-[11px] leading-relaxed">
                {typeof order.shippingAddress === 'object'
                  ? [order.shippingAddress.street || order.shippingAddress.address, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode].filter(Boolean).join(', ')
                  : (order.shippingAddress || order.address || 'Delivery Address')}
              </div>
            </div>
          </div>

          {/* Checkpoints History Timeline Log */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1">
              <MapPin size={14} className="text-teal-700" /> Checkpoint Log & Location Updates
            </h4>

            {loading ? (
              <div className="py-8 text-center text-gray-500 flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin text-brand-teal" />
                <span>Fetching live delivery tracking status...</span>
              </div>
            ) : (
              <div className="space-y-3 border-l-2 border-teal-700/30 ml-3 pl-4">
                {(trackingData?.checkpoints || (isSelfDelivery ? [
                  { title: 'Out for Doorstep Delivery', description: `Delivery agent ${selfDetails?.deliveryPersonName || ''} dispatched from store`, location: sellerStoreName, timestamp: new Date().toISOString() },
                  { title: 'Order Packed at Merchant Facility', description: 'Verified and packed for direct delivery', location: sellerStoreName, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
                  { title: 'Order Confirmed', description: 'Store confirmed customer order', location: 'BookVardi Marketplace', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() }
                ] : [
                  { title: 'Out for Delivery', description: 'Courier rider on the way to address', location: 'Destination Regional Hub', timestamp: new Date().toISOString() },
                  { title: 'In Transit', description: 'Package sorted at main hub facility', location: 'Central Sorting Facility', timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() },
                  { title: 'Picked Up by Courier Partner', description: `Collected from ${sellerStoreName}`, location: sellerStoreName, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
                ])).map((cp, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-teal-800 border-2 border-white shadow-2xs" />
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-gray-900 text-xs">{cp.title}</strong>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(cp.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">{cp.description}</p>
                      {cp.location && <p className="text-[10px] text-teal-800 font-medium mt-0.5">📍 Location: {cp.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer matching Bulk Order Tracker */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {isCancelled ? (
              <button
                type="button"
                onClick={() => downloadInvoiceApi(orderId, order.customer?.phone || '', 'credit-note')}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileText size={14} />
                <span>Download Credit Note</span>
              </button>
            ) : (
              <>
                {['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'completed'].includes(currentStatus) && (
                  <button
                    type="button"
                    onClick={() => downloadInvoiceApi(orderId, order.customer?.phone || '', 'invoice')}
                    className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText size={14} />
                    <span>Download Tax Invoice</span>
                  </button>
                )}
                {(order.returnRequest?.requestType === 'exchange' || order.returnRequest?.type === 'exchange') && ['exchange_dispatched', 'exchanged'].includes(order.returnRequest?.status) && (
                  <button
                    type="button"
                    onClick={() => downloadInvoiceApi(orderId, order.customer?.phone || '', 'exchange-invoice')}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText size={14} />
                    <span>Download Exchange Invoice</span>
                  </button>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer ml-auto"
          >
            Close Tracker
          </button>
        </div>

      </div>
    </div>
  );
}
