import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  X, 
  Package, 
  MapPin, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2,
  FileText,
  Boxes,
  QrCode,
  Navigation,
  Compass,
  XCircle,
  CreditCard,
  Phone,
  MessageSquare,
  Copy,
  Check,
  Store,
  User,
  Key,
  RotateCcw
} from 'lucide-react';
import { trackAwbApi, downloadInvoiceApi } from '../../utils/api';

export default function OrderTrackingModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const orderId = order.id || order.orderId || order._id;
  const rawTracking = order.trackingNumber || order.shipmentDetails?.awbNumber || '';

  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const sellerPhone = sellerInfo?.phone ||
    order.items?.[0]?.sellerPhone ||
    order.sellerPhone ||
    '';

  const sellerAddress = sellerInfo?.address ||
    sellerInfo?.city ||
    order.items?.[0]?.sellerAddress ||
    'Local Merchant Facility';

  const deliveryOtp = selfDetails?.deliveryOtp ||
    order.items?.[0]?.deliveryOtp ||
    order.items?.[0]?.selfDeliveryDetails?.deliveryOtp ||
    '';

  const selfToken = selfDetails?.deliveryPartnerToken || (isSelfDelivery ? (rawTracking || '') : '');
  const selfDeliveryUrl = selfDetails?.trackingUrl || (selfToken ? `${window.location.origin}/#delivery-partner?token=${encodeURIComponent(selfToken)}` : '');

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

  const carrierTrackingUrl = order.trackingUrl || trackingData?.trackingUrl || resolveCarrierUrl(courierPartnerName, awbNumber);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setLoading(true);
      const queryAwb = awbNumber || orderId;
      trackAwbApi(queryAwb)
        .then((data) => {
          if (isMounted) {
            setTrackingData(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => { isMounted = false; };
  }, [isOpen, awbNumber, orderId]);

  const handleCopyLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const currentStatus = String(order.overallStatus || order.status || 'shipped').toLowerCase().trim();
  const isCancelled = currentStatus === 'cancelled';

  // 6 Stepper steps
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Control Bar */}
        <div className={`${isCancelled ? 'bg-slate-900' : (isSelfDelivery ? 'bg-teal-900' : 'bg-brand-teal-dark')} text-white px-6 py-4 flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm ${isCancelled ? 'bg-rose-500 text-white' : (isSelfDelivery ? 'bg-emerald-400 text-teal-950' : 'bg-brand-yellow text-brand-teal-dark')}`}>
                <CurrentStatusIcon size={22} className={!isCancelled && (activeIndex === 3 || activeIndex === 4) ? "animate-pulse" : ""} />
              </div>
              {!isCancelled && activeIndex < 5 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                  {isCancelled ? `Order #${orderId} (Cancelled)` : `Order #${orderId}`}
                </h3>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${isSelfDelivery ? 'bg-emerald-500 text-white' : 'bg-brand-yellow text-brand-teal-dark'}`}>
                  {isSelfDelivery ? '🛵 Direct Self-Delivery' : '🚚 3rd-Party Courier'}
                </span>
              </div>
              <p className="text-[11px] text-teal-200 mt-0.5">
                {isCancelled ? 'Tracking closed due to cancellation' : (
                  isSelfDelivery ? (
                    <>Store Fleet: <strong className="text-white">{sellerStoreName}</strong></>
                  ) : (
                    awbNumber ? <>AWB Tracking: <strong className="font-mono text-white">{awbNumber}</strong></> : 'Awaiting Dispatch AWB'
                  )
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-teal-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-800">
          
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

          {/* Return / Exchange Request Live Status & Timeline */}
          {order.returnRequest && (
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
                {order.returnRequest.targetSize && <div><strong>Requested Replacement Size:</strong> <span className="font-bold text-teal-800">{order.returnRequest.targetSize}</span></div>}
                {order.returnRequest.rejectionReason && <div className="text-rose-800 font-bold"><strong>Rejection Reason:</strong> {order.returnRequest.rejectionReason}</div>}
                {order.returnRequest.pickupDate && <div><strong>Scheduled Pickup Date:</strong> {new Date(order.returnRequest.pickupDate).toLocaleDateString('en-IN')}</div>}
                {order.returnRequest.refundTxnId && <div><strong>Refund Reference ID:</strong> <span className="font-mono font-bold text-emerald-800">{order.returnRequest.refundTxnId}</span></div>}
                {order.returnRequest.exchangeAwb && <div><strong>Replacement Tracking AWB:</strong> <span className="font-mono font-bold text-blue-800">{order.returnRequest.exchangeAwb}</span> ({order.returnRequest.exchangeCourier || 'Courier'})</div>}
              </div>

              {/* Event Timeline Log */}
              {Array.isArray(order.returnRequest.timeline) && order.returnRequest.timeline.length > 0 && (
                <div className="pt-2 border-t border-amber-200/60 space-y-1">
                  <div className="font-bold text-[10px] text-amber-900 uppercase tracking-wider">
                    Return / Exchange Status Timeline Log
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

          {/* Self-Delivery Specific: Delivery Confirmation OTP Highlight */}
          {!isCancelled && isSelfDelivery && deliveryOtp && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Key size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Customer Handover Code
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-emerald-950 mt-0.5">
                    Share OTP upon Delivery Arrival
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    Provide this 4-digit code to the delivery partner when they arrive to safely confirm item receipt.
                  </p>
                </div>
              </div>
              <div className="bg-white border-2 border-emerald-400 px-4 py-2 rounded-xl text-center self-center shrink-0 shadow-xs">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Your Secure OTP</div>
                <div className="font-mono text-xl font-black text-emerald-700 tracking-widest">{deliveryOtp}</div>
              </div>
            </div>
          )}

          {/* Dynamic Live Status Highlight Banner */}
          <div className={`${isCancelled ? 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border-rose-800/50' : (isSelfDelivery ? 'bg-gradient-to-r from-teal-900 via-emerald-900 to-teal-950 border-teal-700/50' : 'bg-gradient-to-r from-teal-900 via-brand-teal-dark to-slate-900 border-teal-700/50')} text-white p-4 rounded-2xl shadow-md relative overflow-hidden flex items-center justify-between gap-4 border`}>
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border ${isCancelled ? 'bg-rose-500/20 text-rose-300 border-rose-400/30' : 'bg-white/10 text-brand-yellow border-white/20'}`}>
                  <CurrentStatusIcon size={24} className={!isCancelled && (activeIndex === 3 || activeIndex === 4) ? "animate-pulse" : ""} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md border ${isCancelled ? 'bg-rose-500/20 text-rose-200 border-rose-400/40' : 'bg-brand-yellow/15 text-brand-yellow border-brand-yellow/30'}`}>
                    {isSelfDelivery ? 'Direct Delivery Mode' : 'Courier Network Mode'}
                  </span>
                  {!isCancelled && (
                    <span className="text-[11px] font-mono text-teal-200">
                      Step #{activeIndex + 1} of {steps.length}
                    </span>
                  )}
                </div>
                <h4 className="font-display font-extrabold text-sm sm:text-base text-white mt-0.5">
                  {isCancelled ? 'Tracking Terminated' : steps[activeIndex]?.label}
                </h4>
                <p className="text-[11px] text-teal-100/90 font-medium">
                  {isCancelled
                    ? 'Shipping stopped due to order cancellation.'
                    : (isSelfDelivery
                        ? `Direct delivery handled by store partner: ${sellerStoreName}`
                        : `${steps[activeIndex]?.desc} • Logistics carrier: ${courierPartnerName}`)}
                </p>
              </div>
            </div>
            
            <div className="hidden sm:flex flex-col items-end shrink-0 relative z-10 text-right">
              <span className="text-[10px] text-teal-300 font-medium">{isSelfDelivery ? 'Fulfillment Partner' : 'Carrier Network'}</span>
              <span className="text-xs font-black text-white">{courierPartnerName}</span>
            </div>
          </div>

          {/* Visual Progress Stepper with Icon Status Nodes */}
          {!isCancelled && (
            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-brand-teal uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={15} /> Live Fulfillment Journey
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-950 font-extrabold px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {isSelfDelivery ? 'Store Rider Active' : courierPartnerName}
                </span>
              </div>

              <div className="relative py-2 px-1">
                {/* Connector Line */}
                <div className="absolute top-[22px] left-[30px] right-[30px] h-1 bg-gray-200 -z-0">
                  <div
                    className="h-full bg-brand-teal transition-all duration-500 rounded-full"
                    style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-6 gap-1 text-center relative z-10">
                  {steps.map((s, idx) => {
                    const isPassed = activeIndex >= idx;
                    const isCurrent = activeIndex === idx;
                    const StepIcon = s.icon;

                    return (
                      <div key={s.key} className="flex flex-col items-center group">
                        <div
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xs ${
                            isCurrent
                              ? 'bg-brand-teal text-white ring-4 ring-brand-teal/30 scale-110 shadow-md animate-pulse'
                              : isPassed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-gray-400 border border-gray-200'
                          }`}
                          title={`${s.label} (${s.desc})`}
                        >
                          {isPassed && !isCurrent ? (
                            <CheckCircle2 size={18} className="text-white" />
                          ) : (
                            <StepIcon size={18} />
                          )}
                        </div>
                        <div className={`text-[10px] font-extrabold mt-2 leading-tight transition-colors ${isCurrent ? 'text-brand-teal font-black' : isPassed ? 'text-gray-900' : 'text-gray-400'}`}>
                          {s.label}
                        </div>
                        <div className="text-[9px] text-gray-500 font-medium hidden sm:block mt-0.5">{s.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MODE-SPECIFIC DETAILS SECTION */}
          {isSelfDelivery ? (
            /* SECTION A: SELF-DELIVERY DETAILS (Seller Details + Driver Details + Live Driver Link) */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* 1. Seller Store & Contact Information */}
                <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-200 space-y-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-teal-950 text-xs uppercase tracking-wide">
                    <Store size={15} className="text-teal-700" /> Store & Seller Information
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-gray-900">{sellerStoreName}</h5>
                    <p className="text-[11px] text-gray-600 mt-0.5">{sellerAddress}</p>
                  </div>
                  {sellerPhone && (
                    <div className="pt-2 border-t border-teal-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">Store Support:</span>
                      <a
                        href={`tel:${sellerPhone.replace(/\D/g, '')}`}
                        className="inline-flex items-center gap-1 text-teal-800 font-bold text-xs bg-white px-2 py-1 rounded-lg border border-teal-200 hover:bg-teal-50"
                      >
                        <Phone size={12} /> {sellerPhone}
                      </a>
                    </div>
                  )}
                </div>

                {/* 2. Driver / Rider Details */}
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-950 text-xs uppercase tracking-wide">
                    <User size={15} className="text-emerald-700" /> Delivery Agent / Rider
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-gray-900">
                      {selfDetails?.deliveryPersonName || 'Store Assigned Rider'}
                    </h5>
                    {selfDetails?.vehicleNumber && (
                      <p className="text-[11px] font-mono text-emerald-800 mt-0.5">
                        Vehicle: <strong>{selfDetails.vehicleNumber}</strong>
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-emerald-100 flex flex-wrap items-center gap-2">
                    {selfDetails?.deliveryPersonPhone ? (
                      <>
                        <a
                          href={`tel:${selfDetails.deliveryPersonPhone.replace(/\D/g, '')}`}
                          className="inline-flex items-center gap-1 text-emerald-900 font-bold text-xs bg-white px-2 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-50"
                        >
                          <Phone size={12} /> {selfDetails.deliveryPersonPhone}
                        </a>
                        <a
                          href={`https://wa.me/91${selfDetails.deliveryPersonPhone.replace(/\D/g, '').slice(-10)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-800 font-bold text-[11px] bg-emerald-100 px-2 py-1 rounded-lg hover:bg-emerald-200"
                        >
                          <MessageSquare size={12} /> Chat WhatsApp
                        </a>
                      </>
                    ) : (
                      <span className="text-[11px] text-gray-500">Contact shared on dispatch</span>
                    )}
                  </div>
                </div>

              </div>

              {/* 3. Self-Delivery Tracking & Verification Link */}
              {selfDeliveryUrl && (
                <div className="bg-white p-3.5 rounded-2xl border border-teal-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-800 flex items-center gap-1.5">
                      <ExternalLink size={13} className="text-teal-700" />
                      Self-Delivery Driver Portal & Verification Link:
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-teal-800">
                      Token: {selfToken}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={selfDeliveryUrl}
                      className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px] text-gray-700 truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyLink(selfDeliveryUrl)}
                      className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-[11px] rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={selfDeliveryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink size={13} />
                      <span>Open Portal</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SECTION B: THIRD-PARTY COURIER DETAILS */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-brand-teal/5 p-4 rounded-2xl border border-brand-teal/20">
              <div>
                <span className="text-[10px] text-gray-500 font-medium">Assigned Courier Partner</span>
                <p className="font-extrabold text-sm text-gray-900">{courierPartnerName}</p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  AWB Code: {awbNumber ? <strong className="font-mono text-brand-teal">{awbNumber}</strong> : <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Not Assigned</span>}
                </p>
                {sellerStoreName && (
                  <p className="text-[10px] text-gray-500 mt-1">Dispatched from: <strong>{sellerStoreName}</strong></p>
                )}
              </div>

              <div className="sm:text-right flex flex-col justify-center">
                <span className="text-[10px] text-gray-500 font-medium">Estimated Arrival</span>
                <p className="font-black text-sm text-emerald-800">
                  {trackingData?.estimatedDeliveryDate ? new Date(trackingData.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '2-3 Business Days'}
                </p>
                {carrierTrackingUrl && awbNumber && (
                  <a
                    href={carrierTrackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand-teal hover:underline text-[11px] font-bold mt-1 sm:justify-end"
                  >
                    <span>Track on {courierPartnerName} Site</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Ordered Products Breakdown with Seller & Delivery Link info */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1">
              <Package size={14} className="text-brand-teal" /> Ordered Items ({order.items?.length || 1})
            </h4>
            <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 bg-white">
              {order.items?.map((item, idx) => {
                const itemSelf = item.selfDeliveryDetails || selfDetails;
                const itemSeller = item.sellerDetails || sellerInfo;
                const itemStore = item.storeName || item.sellerName || itemSeller?.storeName || sellerStoreName;
                const itemPhone = item.sellerPhone || itemSeller?.phone || sellerPhone;
                const itemIsSelf = item.deliveryType === 'self' || item.deliveryType === 'self_delivery' || isSelfDelivery;

                return (
                  <div key={idx} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 font-bold text-xs shrink-0">
                          BV
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-xs text-gray-900">{item.name}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Qty: {item.quantity || 1} {item.size ? `• Size: ${item.size}` : ''} {item.color ? `• Color: ${item.color}` : ''}
                        </div>
                        <div className="text-[10px] text-teal-900 font-medium flex items-center gap-1 mt-0.5">
                          <Store size={10} /> Sold by: <span className="font-bold">{itemStore}</span>
                          {itemPhone && <span className="text-gray-500">({itemPhone})</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${itemIsSelf ? 'bg-teal-100 text-teal-900' : 'bg-blue-100 text-blue-900'}`}>
                        {itemIsSelf ? '🛵 Self-Delivery' : `🚚 ${item.thirdPartyDetails?.courierName || courierPartnerName}`}
                      </span>
                      {itemIsSelf && itemSelf?.deliveryPartnerToken && (
                        <span className="text-[9px] text-gray-500 font-mono mt-1">
                          Token: {itemSelf.deliveryPartnerToken}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Checkpoints Timeline */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1">
              <MapPin size={14} className="text-brand-teal" /> Tracking Checkpoint History
            </h4>

            {loading ? (
              <div className="py-8 text-center text-gray-500 flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin text-brand-teal" />
                <span>Fetching live delivery tracking status...</span>
              </div>
            ) : (
              <div className="space-y-3 border-l-2 border-brand-teal/30 ml-3 pl-4">
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
                    <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-brand-teal border-2 border-white shadow-2xs" />
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-gray-900 text-xs">{cp.title}</strong>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(cp.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">{cp.description}</p>
                      {cp.location && <p className="text-[10px] text-brand-teal font-medium mt-0.5">📍 Location: {cp.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between gap-3 shrink-0">
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
            className="px-6 py-2 bg-brand-teal hover:bg-brand-teal-light text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer ml-auto"
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
}

