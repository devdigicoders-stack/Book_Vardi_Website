import React, { useState, useEffect } from 'react';
import {
  Building2,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Key,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Package,
  FileText,
  DollarSign,
  User,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function BulkOrderTrackingModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const [copiedOtp, setCopiedOtp] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const refId = order.referenceId || order.id || order._id || 'BULK-RFQ';
  const instName = order.institutionName || order.schoolName || 'Institutional Customer';
  const contactName = order.contactName || order.contactPerson || 'School Representative';
  const contactPhone = order.contactPhone || order.userPhone || '';
  const city = order.city || 'Lucknow';
  const state = order.state || 'Uttar Pradesh';

  const statusLower = String(order.status || order.deliveryStatus || '').toLowerCase().trim();

  // Winning Quote & Fulfilling Seller Details
  const winningQuote = (Array.isArray(order.quotations) ? order.quotations : []).find(
    q => q.status === 'approved' || q.status === 'buyer_accepted' || q.status === 'seller_accepted' || String(q._id || q.id) === String(order.acceptedQuoteId)
  ) || (order.quotations && order.quotations[0]) || null;

  const sellerObj = typeof order.sellerId === 'object' && order.sellerId !== null ? order.sellerId : null;
  const sellerStoreName = sellerObj?.storeName || winningQuote?.sellerStoreName || winningQuote?.sellerName || order.sellerStoreName || order.sellerName || 'Book Vardi Verified Merchant';
  const sellerCity = sellerObj?.city || winningQuote?.sellerCity || order.sellerCity || city;

  // Delivery & Dispatch Details
  const delDetails = order.deliveryDetails || order.selfDeliveryDetails || {};
  const isOutForDelivery = statusLower === 'out for delivery' || statusLower === 'out_for_delivery';
  const isDelivered = statusLower === 'received' || statusLower === 'delivered' || statusLower === 'completed' || statusLower === 'fulfilled';
  const isPacked = statusLower === 'packed' || statusLower === 'dispatched' || isOutForDelivery || isDelivered;
  const isAccepted = statusLower === 'accepted' || statusLower === 'quote_accepted' || statusLower === 'confirmed' || isPacked;

  const riderName = delDetails.deliveryBoyName || delDetails.deliveryPersonName || 'Direct Store Fleet Executive';
  const riderPhone = delDetails.deliveryBoyPhone || delDetails.deliveryPersonPhone || '';
  const vehicleNo = delDetails.vehicleNumber || 'Store Delivery Fleet';
  const deliveryOtp = delDetails.deliveryOtp || '1234';
  const partnerToken = delDetails.deliveryPartnerToken || delDetails.trackingId || refId;
  const trackingUrl = delDetails.trackingUrl || `/#delivery-partner?token=${encodeURIComponent(partnerToken)}`;

  // Stepper Stage Evaluation
  let activeStep = 0;
  if (isDelivered) activeStep = 3;
  else if (isOutForDelivery) activeStep = 2;
  else if (isPacked) activeStep = 2;
  else if (isAccepted) activeStep = 1;
  else activeStep = 0;

  const steps = [
    { label: 'Requirement Logged', desc: 'Inquiry Filed & Broadcast', date: order.createdAt },
    { label: 'Vendor Approved', desc: 'Quotation Accepted & Confirmed', date: order.updatedAt },
    { label: 'Dispatched in Transit', desc: 'Store Direct Fleet Delivery', date: delDetails.dispatchedAt },
    { label: 'Consignment Received', desc: 'Campus Handover Verified', date: delDetails.deliveredAt }
  ];

  const copyToClipboard = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'otp') {
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-teal-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800/80 border border-teal-600/50 flex items-center justify-center text-teal-200 font-extrabold shadow-inner shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black uppercase text-teal-300 bg-teal-900/80 px-2 py-0.5 rounded border border-teal-700/60">
                  #{refId}
                </span>
                <span className="text-[10px] font-bold text-teal-200 bg-teal-800/50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-teal-700/40">
                  <ShieldCheck size={11} className="text-emerald-400" /> Live Bulk Consignment Tracker
                </span>
              </div>
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white leading-tight mt-0.5">
                {instName}
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

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-gray-800">

          {/* Handover OTP Highlight Banner (when Out for Delivery or Dispatched) */}
          {isPacked && !isDelivered && deliveryOtp && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                  <Key size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded">
                      Campus Handover Security Code
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-emerald-950 mt-0.5">
                    Share OTP Upon Consignment Delivery
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    Provide this code to the store delivery executive at the institutional gate to safely verify receipt.
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-emerald-500 px-4 py-2.5 rounded-2xl text-center self-stretch sm:self-center shrink-0 shadow-sm flex sm:flex-col items-center justify-between sm:justify-center gap-2">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Delivery OTP</div>
                  <div className="font-mono text-2xl font-black text-emerald-700 tracking-widest leading-none mt-0.5">
                    {deliveryOtp}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(deliveryOtp, 'otp')}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedOtp ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                  <span>{copiedOtp ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Current Status Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white p-4.5 rounded-2xl shadow-md border border-teal-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-brand-yellow shrink-0 shadow-inner">
                {isDelivered ? <CheckCircle2 size={26} className="text-emerald-400" /> : isOutForDelivery ? <Truck size={26} className="animate-pulse text-amber-400" /> : <Clock size={26} />}
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-700/50">
                  {isDelivered ? 'Consignment Complete' : isOutForDelivery ? 'Store Self Delivery Fleet in Transit' : isPacked ? 'Consignment Packed' : isAccepted ? 'Order Confirmed with Vendor' : 'RFQ Inquiry Broadcast'}
                </span>
                <h4 className="font-display font-extrabold text-base text-white mt-1">
                  {isDelivered ? 'Consignment Handed Over & Verified' : isOutForDelivery ? 'Out for Campus Delivery' : isPacked ? 'Packed & Prepared for Dispatch' : isAccepted ? 'Order Accepted & Production Active' : 'Receiving Marketplace Quotations'}
                </h4>
                <p className="text-[11px] text-teal-100/90 font-medium">
                  Fulfilling Merchant: <strong className="text-white">{sellerStoreName}</strong> ({sellerCity})
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-white/10 p-2.5 rounded-xl border border-white/10 w-full sm:w-auto">
              <div className="text-[10px] text-teal-300 font-semibold uppercase">Total Requirement</div>
              <div className="text-sm font-black text-white">{order.totalQuantity || 100} Units</div>
              <div className="text-[10px] text-teal-200">
                Budget: {winningQuote ? `₹${Number(winningQuote.quoteAmount).toLocaleString()}` : (order.targetBudgetPerKit ? `₹${Number(order.targetBudgetPerKit).toLocaleString()}` : 'Open Quotes')}
              </div>
            </div>
          </div>

          {/* 4-Step Progress Timeline */}
          <div className="bg-gray-50 border border-gray-200/80 p-4 sm:p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
              <span>Consignment Fulfillment Milestones</span>
              <span className="text-teal-700 font-mono text-xs">Stage {activeStep + 1} of 4</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {steps.map((st, idx) => {
                const isCompleted = activeStep >= idx;
                const isCurrent = activeStep === idx;
                return (
                  <div key={idx} className="flex flex-col items-center text-center p-2 rounded-xl bg-white border border-gray-100 shadow-2xs">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}>
                      {isCompleted ? <Check size={16} /> : idx + 1}
                    </div>
                    <span className={`text-xs font-bold mt-2 ${isCurrent ? 'text-teal-800 font-extrabold' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {st.label}
                    </span>
                    <span className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                      {st.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Store Fleet Delivery Executive Details Card */}
          {(isPacked || isOutForDelivery || riderPhone) && (
            <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Truck size={15} className="text-blue-700" /> Direct Store Delivery Executive Details
                </span>
                <span className="text-[10px] font-mono font-bold bg-white text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Fleet Token: {partnerToken}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Rider / Executive</span>
                  <span className="font-extrabold text-gray-900 text-xs block mt-0.5">{riderName}</span>
                  <span className="text-[10px] text-gray-500">Store Direct Logistics</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Executive Contact</span>
                  {riderPhone ? (
                    <a href={`tel:${riderPhone}`} className="font-extrabold text-blue-700 hover:underline text-xs block mt-0.5 flex items-center gap-1">
                      <Phone size={12} /> {riderPhone}
                    </a>
                  ) : (
                    <span className="text-gray-500 text-xs block mt-0.5">Assigned at Dispatch</span>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Vehicle Number</span>
                  <span className="font-mono font-extrabold text-gray-900 text-xs block mt-0.5">{vehicleNo}</span>
                  <span className="text-[10px] text-gray-500">Fulfillment Transport</span>
                </div>
              </div>

              {/* External Live Tracking Link Button */}
              {trackingUrl && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-blue-800">
                    Live GPS tracking token is active for rider navigation.
                  </span>
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Open Live GPS Page</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Demanded Requirement Items Summary */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-100 p-3 font-extrabold text-xs text-gray-800 flex items-center justify-between border-b border-gray-200">
              <span className="flex items-center gap-1.5">
                <Package size={15} className="text-teal-700" /> Demanded Requirement Specification
              </span>
              <span className="text-[11px] font-bold text-gray-600">
                {order.requirements?.length || 1} Item Types
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {Array.isArray(order.requirements) && order.requirements.length > 0 ? (
                order.requirements.map((req, rIdx) => (
                  <div key={rIdx} className="p-3 flex items-center justify-between hover:bg-gray-50/50">
                    <div>
                      <div className="font-bold text-gray-900">{req.itemName || 'Bulk Item'}</div>
                      <div className="text-[11px] text-gray-500">{req.category || 'General Procurement'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-gray-900">{req.quantity} Units</div>
                      <div className="text-[10px] text-gray-400">
                        {req.budgetPerUnit > 0 ? `Target: ₹${req.budgetPerUnit}/unit` : ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-gray-600">
                  <div>{order.requirementSummary || order.additionalNotes || 'Bulk uniform & stationery sets'}</div>
                  <div className="font-bold text-gray-900 mt-1">{order.totalQuantity || 100} Total Units</div>
                </div>
              )}
            </div>
          </div>

          {/* Customer & Institution Info Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">
                Institutional Representative
              </span>
              <div className="font-extrabold text-gray-900">{contactName}</div>
              {contactPhone && <div className="text-gray-600 text-[11px]">Phone: {contactPhone}</div>}
              {order.contactEmail && <div className="text-gray-600 text-[11px]">Email: {order.contactEmail}</div>}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">
                Delivery Destination Campus
              </span>
              <div className="font-extrabold text-gray-900">{instName}</div>
              <div className="text-gray-600 text-[11px] leading-relaxed">
                {[order.address, city, state, order.pincode].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between text-xs shrink-0">
          <div className="text-[11px] text-gray-500 font-medium hidden sm:block">
            Official Book Vardi Institutional Fulfillment Protocol
          </div>
          <button
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
