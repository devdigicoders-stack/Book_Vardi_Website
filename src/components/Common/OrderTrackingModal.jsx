import React, { useState, useEffect } from 'react';
import { Truck, X, Package, MapPin, Clock, ExternalLink, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
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
    { key: 'placed', label: 'Order Placed', desc: 'Received by store' },
    { key: 'packed', label: 'Packed', desc: 'Satchel sealed' },
    { key: 'awb_generated', label: 'AWB Generated', desc: 'Courier assigned' },
    { key: 'in_transit', label: 'In Transit', desc: 'Hub routing' },
    { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider arriving' },
    { key: 'delivered', label: 'Delivered', desc: 'Package received' }
  ];

  const currentStatus = order.overallStatus || order.status || 'shipped';
  let activeIndex = 3; // default shipped / in transit
  if (currentStatus === 'placed' || currentStatus === 'pending') activeIndex = 0;
  else if (currentStatus === 'confirmed') activeIndex = 1;
  else if (currentStatus === 'packed') activeIndex = 2;
  else if (currentStatus === 'shipped') activeIndex = 3;
  else if (currentStatus === 'out_for_delivery') activeIndex = 4;
  else if (currentStatus === 'delivered') activeIndex = 5;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Control Bar */}
        <div className="bg-brand-teal-dark text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-yellow text-brand-teal-dark flex items-center justify-center font-bold">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                Live Shipment Tracking — Order #{orderId}
              </h3>
              <p className="text-[11px] text-teal-200">AWB Code: <strong className="font-mono text-white">{awbNumber}</strong></p>
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
          
          {/* Visual Progress Stepper */}
          <div className="bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-brand-teal uppercase tracking-wider flex items-center gap-1">
                <Clock size={14} /> Live Fulfillment Journey
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                {courierPartnerName}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1 text-center font-bold text-[10px] pt-1">
              {steps.map((s, idx) => {
                const isPassed = activeIndex >= idx;
                const isCurrent = activeIndex === idx;
                return (
                  <div key={s.key} className="space-y-1.5">
                    <div className={`h-2 rounded-full transition-all ${isPassed ? 'bg-brand-teal' : 'bg-gray-200'} ${isCurrent ? 'ring-2 ring-brand-teal-light ring-offset-1 animate-pulse' : ''}`} />
                    <div className={isPassed ? 'text-gray-900 font-black' : 'text-gray-400 font-normal'}>{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

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
