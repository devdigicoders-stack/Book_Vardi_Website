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
  CreditCard
} from 'lucide-react';
import { trackAwbApi } from '../../utils/api';

export default function OrderTrackingModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const orderId = order.id || order.orderId || order._id;
  const awbNumber = order.trackingNumber || order.shipmentDetails?.awbNumber || `SHIP-${orderId}`;
  const courierPartnerName = order.courierName || order.shipmentDetails?.courierPartnerName || 'Shiprocket Delivery Network';

  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setLoading(true);
      trackAwbApi(awbNumber)
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
  }, [isOpen, awbNumber]);

  const steps = [
    { key: 'placed', label: 'Order Placed', desc: 'Received by store', icon: FileText },
    { key: 'packed', label: 'Packed & Sealed', desc: 'Satchel ready', icon: Boxes },
    { key: 'awb_generated', label: 'AWB Assigned', desc: 'Courier linked', icon: QrCode },
    { key: 'in_transit', label: 'In Transit', desc: 'Hub routing', icon: Truck },
    { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider arriving', icon: Navigation },
    { key: 'delivered', label: 'Delivered', desc: 'Handed over', icon: ShieldCheck }
  ];

  const currentStatus = String(order.overallStatus || order.status || 'shipped').toLowerCase().trim();
  let activeIndex = 3; // default shipped / in transit
  if (currentStatus === 'placed' || currentStatus === 'pending') activeIndex = 0;
  else if (currentStatus === 'confirmed') activeIndex = 1;
  else if (currentStatus === 'packed') activeIndex = 2;
  else if (currentStatus === 'shipped' || currentStatus === 'in_transit' || currentStatus === 'in transit') activeIndex = 3;
  else if (currentStatus === 'out_for_delivery' || currentStatus === 'out for delivery') activeIndex = 4;
  else if (currentStatus === 'delivered' || currentStatus === 'completed') activeIndex = 5;

  const isCancelled = currentStatus === 'cancelled';
  const CurrentStatusIcon = isCancelled ? XCircle : (steps[activeIndex]?.icon || Truck);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Control Bar */}
        <div className={`${isCancelled ? 'bg-slate-900' : 'bg-brand-teal-dark'} text-white px-6 py-4 flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm ${isCancelled ? 'bg-rose-500 text-white' : 'bg-brand-yellow text-brand-teal-dark'}`}>
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
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                {isCancelled ? `Tracking Terminated — Order #${orderId}` : `Live Shipment Tracking — Order #${orderId}`}
              </h3>
              <p className="text-[11px] text-teal-200">
                {isCancelled ? 'Status: Order Cancelled' : <>AWB Code: <strong className="font-mono text-white">{awbNumber}</strong></>}
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
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-800">
          
          {currentStatus === 'cancelled' && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-950 space-y-2">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-700">
                <XCircle size={16} />
                <span>Order Cancelled (Performed by Customer)</span>
              </div>
              <p className="text-xs text-rose-900">
                <strong>Cancelled By:</strong> {order.cancelledBy || 'Customer'} • <strong>Reason:</strong> {order.cancellationReason || 'Cancelled by customer'}
              </p>
              {(order.paymentStatus === 'paid' || order.paymentStatus === 'Paid' || (order.paymentMethod && String(order.paymentMethod).toUpperCase() !== 'COD')) ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs flex items-start gap-2 mt-2">
                  <CreditCard size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-extrabold text-emerald-900">Online Refund Initiated</strong>
                    <span>Since this order was paid online, your refund of <strong>₹{order.total || order.totalAmount}</strong> will be credited to your original payment account within <strong>48 working hours</strong>.</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-600 font-medium">Cash on Delivery order cancelled. No payment was collected.</p>
              )}
            </div>
          )}

          {/* Dynamic Live Status Highlight Banner */}
          <div className={`${isCancelled ? 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border-rose-800/50' : 'bg-gradient-to-r from-teal-900 via-brand-teal-dark to-slate-900 border-teal-700/50'} text-white p-4 rounded-2xl shadow-md relative overflow-hidden flex items-center justify-between gap-4 border`}>
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border ${isCancelled ? 'bg-rose-500/20 text-rose-300 border-rose-400/30' : 'bg-white/10 text-brand-yellow border-white/20'}`}>
                  <CurrentStatusIcon size={24} className={!isCancelled && (activeIndex === 3 || activeIndex === 4) ? "animate-pulse" : ""} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md border ${isCancelled ? 'bg-rose-500/20 text-rose-200 border-rose-400/40' : 'bg-brand-yellow/15 text-brand-yellow border-brand-yellow/30'}`}>
                    {isCancelled ? 'Tracking Closed' : 'Live Status Icon'}
                  </span>
                  {!isCancelled && (
                    <span className="text-[11px] font-mono text-teal-200">
                      Active Step #{activeIndex + 1} of {steps.length}
                    </span>
                  )}
                </div>
                <h4 className="font-display font-extrabold text-sm sm:text-base text-white mt-0.5">
                  {isCancelled ? 'Tracking Terminated — Order Cancelled' : steps[activeIndex]?.label}
                </h4>
                <p className="text-[11px] text-teal-100/90 font-medium">
                  {isCancelled
                    ? 'Shipping & courier fulfillment stopped due to order cancellation.'
                    : `${steps[activeIndex]?.desc} — Courier dispatch active`}
                </p>
              </div>
            </div>
            
            <div className="hidden sm:flex flex-col items-end shrink-0 relative z-10 text-right">
              <span className="text-[10px] text-teal-300 font-medium">{isCancelled ? 'Fulfillment Status' : 'Courier Partner'}</span>
              <span className="text-xs font-black text-white">{isCancelled ? 'Cancelled' : courierPartnerName}</span>
            </div>
          </div>

          {/* Visual Progress Stepper with Icon Status Nodes */}
          {isCancelled ? (
            <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <XCircle size={22} />
              </div>
              <h4 className="font-extrabold text-xs text-rose-900">Shipment Journey Halted</h4>
              <p className="text-[11px] text-rose-800 max-w-sm mx-auto leading-relaxed">
                Courier transit and delivery tracking system closed permanently for this order. No further package movement will occur.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-brand-teal uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={15} className="animate-spin-slow" /> Live Fulfillment Journey
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-950 font-extrabold px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {courierPartnerName}
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
                      <div key={s.key} className="flex flex-col items-center group cursor-pointer">
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

          {/* Courier Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-brand-teal/5 p-4 rounded-2xl border border-brand-teal/20">
            <div>
              <span className="text-[10px] text-gray-500 font-medium">Assigned Delivery Partner</span>
              <p className="font-extrabold text-sm text-gray-900">{courierPartnerName}</p>
              <p className="text-[11px] text-gray-600 mt-0.5">AWB Tracking: <strong className="font-mono text-brand-teal">{awbNumber}</strong></p>
            </div>

            <div className="sm:text-right flex flex-col justify-center">
              <span className="text-[10px] text-gray-500 font-medium">Estimated Arrival</span>
              <p className="font-black text-sm text-emerald-800">
                {trackingData?.estimatedDeliveryDate ? new Date(trackingData.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '2-3 Business Days'}
              </p>
              <a
                href={`https://track.shiprocket.in/tracking/${awbNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand-teal hover:underline text-[11px] font-bold mt-1 sm:justify-end"
              >
                <span>Direct Courier Site Tracking</span>
                <ExternalLink size={12} />
              </a>
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
                <span>Fetching live courier status...</span>
              </div>
            ) : (
              <div className="space-y-3 border-l-2 border-brand-teal/30 ml-3 pl-4">
                {(trackingData?.checkpoints || [
                  { title: 'Out for Delivery', description: 'Courier rider on the way', location: 'Destination City Hub', timestamp: new Date().toISOString() },
                  { title: 'In Transit', description: 'Package sorted at main hub', location: 'Central Sorting Facility', timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() },
                  { title: 'Picked Up by Courier', description: 'Package collected from warehouse', location: 'Merchant Warehouse', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
                ]).map((cp, i) => (
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
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-brand-teal hover:bg-brand-teal-light text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
}
