import React from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  FileText, 
  Lock,
  DollarSign,
  Truck,
  RotateCcw,
  Clock
} from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=150&auto=format&fit=crop&q=80';

export function numberToWords(amount) {
  if (isNaN(amount) || amount <= 0) return 'Zero Rupees Only';
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function numToWordsUnderThousand(n) {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }

  const rounded = Math.round(amount);
  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded % 10000000) / 100000);
  const thousand = Math.floor((rounded % 100000) / 1000);
  const remainder = rounded % 1000;

  let words = '';
  if (crore > 0) words += numToWordsUnderThousand(crore) + ' Crore ';
  if (lakh > 0) words += numToWordsUnderThousand(lakh) + ' Lakh ';
  if (thousand > 0) words += numToWordsUnderThousand(thousand) + ' Thousand ';
  if (remainder > 0) words += numToWordsUnderThousand(remainder);

  return (words.trim() ? words.trim() : 'Zero') + ' Rupees Only';
}

export function getProductGstRate(item) {
  const explicitGst = item?.gstPercent ?? item?.gstPercentage ?? item?.gstRate ?? item?.gst ?? item?.taxRate ?? item?.productId?.gstPercent ?? item?.productId?.gstRate ?? item?.productId?.gst ?? item?.productId?.gstPercentage ?? item?.productId?.taxRate;
  if (explicitGst !== undefined && explicitGst !== null && String(explicitGst).trim() !== '' && !isNaN(Number(explicitGst))) {
    return Number(explicitGst);
  }
  return 5;
}

export default function TaxInvoiceModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const rawStatus = String(order.overallStatus || order.status || '').toLowerCase().trim();
  const normStatus = rawStatus.replace(/[\s-]+/g, '_');
  const isCancelled = normStatus === 'cancelled' || normStatus === 'canceled' || order.isCancelled || Boolean(order.cancelledAt);
  const isPaymentVerified = String(order.paymentStatus || '').toLowerCase() === 'paid' ||
    String(order.advancePaymentStatus || '').toLowerCase() === 'paid' ||
    Number(order.advancePaidAmount || 0) > 0;
  const isCod = /cod|cash\s*on\s*delivery/i.test(String(order.paymentMethod || ''));
  const isPending = !normStatus || ['pending', 'placed', 'unconfirmed', 'created', 'draft'].includes(normStatus);

  const isOrderConfirmedStatus = [
    'confirmed',
    'quote_accepted',
    'buyer_accepted',
    'seller_accepted',
    'processing',
    'production',
    'packed',
    'packed_and_sealed',
    'shipped',
    'dispatched',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'completed',
    'delivered_to_customer',
    'order_delivered',
    'return_requested',
    'returned',
    'exchange_requested',
    'exchanged',
    'return_approved',
    'exchange_approved',
    'refund_requested',
    'refunded',
    'cancelled',
    'canceled'
  ].includes(normStatus) || (!isPending && normStatus.length > 0);

  const hasConfirmedItem = Array.isArray(order.items) && order.items.some(it => {
    const itStatus = String(it.status || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    return itStatus && !['pending', 'placed', 'unconfirmed'].includes(itStatus);
  });

  const confirmed = isCancelled || isOrderConfirmedStatus || hasConfirmedItem || isPaymentVerified;

  const shippingAddr = typeof order.shippingAddress === 'object'
    ? order.shippingAddress
    : { street: order.address || order.shippingAddress || 'Customer Delivery Address' };

  const formattedAddressStr = typeof order.shippingAddress === 'string'
    ? order.shippingAddress
    : [
        shippingAddr.street || shippingAddr.addressLine || shippingAddr.address,
        shippingAddr.city,
        shippingAddr.state,
        shippingAddr.pincode ? `- ${shippingAddr.pincode}` : ''
      ].filter(Boolean).join(', ');

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      id: 1,
      name: order.itemName || order.product || 'School Supply & Educational Item',
      image: order.image || (Array.isArray(order.images) && order.images[0]) || FALLBACK_IMAGE,
      quantity: order.quantity || 1,
      price: order.total || order.amount || 499,
      category: 'School Uniform'
    }
  ];

  let totalTaxableValue = 0;
  let totalTaxAmount = 0;

  const itemBreakdowns = items.map((item) => {
    const isUnstitched = Boolean(
      item.isMeterBased ||
      item.unit === 'meter' ||
      item.unit === 'm' ||
      item.productId?.isMeterBased ||
      item.productId?.unit === 'meter' ||
      item.productId?.unit === 'm' ||
      String(item.category || '').toLowerCase().includes('unstitched') ||
      String(item.category || '').toLowerCase().includes('unstiched') ||
      String(item.subCategory || '').toLowerCase().includes('unstitched') ||
      String(item.subCategory || '').toLowerCase().includes('unstiched') ||
      String(item.name || '').toLowerCase().includes('unstitched') ||
      String(item.name || '').toLowerCase().includes('unstiched') ||
      String(item.productName || '').toLowerCase().includes('unstitched') ||
      String(item.productName || '').toLowerCase().includes('unstiched') ||
      (Number(item.quantity || 1) % 1 !== 0)
    );
    const rawQty = Number(item.quantity || 1);
    const displayQty = isUnstitched ? rawQty.toFixed(2) : (rawQty % 1 === 0 ? rawQty : rawQty.toFixed(2));
    const qty = rawQty;
    const unitPrice = Number(item.price || 0);
    const grossPrice = unitPrice * qty;
    const rate = getProductGstRate(item);
    const isInclusive = item.isGstInclusive !== false && order.isGstInclusive !== false;

    let taxableVal = grossPrice;
    let taxAmt = 0;

    if (rate > 0) {
      if (isInclusive) {
        taxableVal = Math.round((grossPrice / (1 + rate / 100)) * 100) / 100;
        taxAmt = Math.round((grossPrice - taxableVal) * 100) / 100;
      } else {
        taxableVal = grossPrice;
        taxAmt = Math.round(((grossPrice * rate) / 100) * 100) / 100;
      }
    }

    totalTaxableValue += taxableVal;
    totalTaxAmount += taxAmt;

    return {
      ...item,
      qty: displayQty,
      rawQty,
      unitPrice,
      grossPrice,
      rate,
      taxableVal,
      taxAmt
    };
  });

  const subtotal = Number(order.subtotal || items.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0));
  const taxAmount = order.taxAmount !== undefined && order.taxAmount !== null ? Number(order.taxAmount) : Math.round(totalTaxAmount * 100) / 100;
  const shippingCost = Number(order.shippingCost ?? order.shippingFee ?? 0);
  const discount = Number(order.discount ?? order.discountAmount ?? 0);
  const pointsDiscount = Number(order.pointsDiscount || 0);
  const grandTotal = Number(order.total || order.totalAmount || (subtotal + shippingCost - discount - pointsDiscount));

  const handlePrint = () => {
    window.print();
  };

  const isPlaceholderName = (name) => {
    if (!name || typeof name !== 'string') return true;
    const lower = name.trim().toLowerCase();
    return (
      lower === '' ||
      lower === 'bookvardimerchant' ||
      lower === 'bookvardi merchant' ||
      lower === 'book vardi partner merchant' ||
      lower === 'partner merchant' ||
      lower === 'unknown seller' ||
      lower === 'new merchant' ||
      lower === 'merchant store' ||
      lower === 'direct marketplace' ||
      lower === 'n/a'
    );
  };

  const getItemSellerName = (item) => {
    if (item?.sellerId && typeof item.sellerId === 'object') {
      const name = item.sellerId.storeName || item.sellerId.name || item.sellerId.sellerName || item.sellerId.legalName;
      if (name && !isPlaceholderName(name)) return name;
    }

    const candidateItemNames = [
      item?.sellerStoreName,
      item?.storeName,
      item?.sellerName,
      item?.legalBusinessName,
      typeof item?.seller === 'string' ? item.seller : (item?.seller?.storeName || item?.seller?.name)
    ];

    for (const c of candidateItemNames) {
      if (c && !isPlaceholderName(c)) return c;
    }

    const prodIdStr = String(item?.productId || item?.id || item?._id || '');
    if (prodIdStr) {
      try {
        const catalogSaved = localStorage.getItem('bv_sync_products') || localStorage.getItem('admin_products') || localStorage.getItem('bv_seller_products');
        if (catalogSaved) {
          const catalog = JSON.parse(catalogSaved);
          if (Array.isArray(catalog)) {
            const matchedProd = catalog.find(p => String(p.id || p._id || p.productId) === prodIdStr);
            if (matchedProd) {
              const pSeller = matchedProd.sellerStoreName || matchedProd.storeName || matchedProd.sellerName || matchedProd.legalBusinessName || (typeof matchedProd.seller === 'string' ? matchedProd.seller : matchedProd.seller?.storeName);
              if (pSeller && !isPlaceholderName(pSeller)) return pSeller;
            }
          }
        }
      } catch (e) {}
    }

    const sellerIdStr = String(item?.sellerId || '');
    if (sellerIdStr && sellerIdStr !== '[object Object]') {
      try {
        const sellersSaved = localStorage.getItem('bv_sync_sellers') || localStorage.getItem('admin_sellers') || localStorage.getItem('bv_registered_users');
        if (sellersSaved) {
          const sellersList = JSON.parse(sellersSaved);
          if (Array.isArray(sellersList)) {
            const matchedSeller = sellersList.find(s => String(s.id || s._id || s.sellerId || s.phone || '') === sellerIdStr);
            if (matchedSeller) {
              const sName = matchedSeller.storeName || matchedSeller.sellerName || matchedSeller.storeDetails?.storeName || matchedSeller.name || matchedSeller.legalName || matchedSeller.ownerFullName;
              if (sName && !isPlaceholderName(sName)) return sName;
            }
          }
        }
      } catch (e) {}
    }

    const candidateOrderNames = [
      order?.sellerStoreName,
      order?.sellerName,
      order?.storeName,
      order?.sellerId && typeof order.sellerId === 'object' ? (order.sellerId.storeName || order.sellerId.name || order.sellerId.sellerName) : null
    ];

    for (const c of candidateOrderNames) {
      if (c && !isPlaceholderName(c)) return c;
    }

    return 'BookVardi Verified Seller';
  };

  const resolveSeller = () => {
    const primaryName = getItemSellerName(items[0]);
    const primaryGst = order.sellerDetails?.gstNumber || order.sellerDetails?.gst || order.sellerGst || order.items?.[0]?.sellerDetails?.gstNumber || items[0]?.sellerDetails?.gstNumber || items[0]?.gstNumber || items[0]?.sellerGst || '';
    const primaryCity = order.sellerDetails?.city || order.sellerDetails?.address || order.sellerCity || order.items?.[0]?.sellerDetails?.city || items[0]?.sellerDetails?.city || 'Lucknow, Uttar Pradesh';
    
    return {
      storeName: primaryName || 'BookVardi Verified Seller',
      gstNumber: (primaryGst && primaryGst !== '09AAACB1234F1Z9') ? primaryGst : 'Exempt / N/A',
      city: primaryCity
    };
  };

  const resolvedSeller = resolveSeller();

  // Logistics tracking resolution
  const logisticsStatus = String(order.overallStatus || order.status || '').toLowerCase().replace(/_/g, ' ');
  const isOut = logisticsStatus === 'out for delivery' || logisticsStatus === 'delivered';
  const isSelf = String(order.deliveryMode || order.deliveryType || '').toLowerCase().includes('self') || Boolean(order.selfDeliveryDetails?.deliveryPartnerToken || order.selfDeliveryDetails?.deliveryPersonName);
  const isThirdParty = String(order.deliveryMode || order.deliveryType || '').toLowerCase().includes('third') || Boolean(order.courierName || order.thirdPartyDetails?.courierName);
  const hasPartner = isSelf || isThirdParty || Boolean(order.courierName || order.selfDeliveryDetails?.deliveryPersonName);
  const hasTracking = !isCancelled && isOut && hasPartner && Boolean(order.trackingNumber || order.selfDeliveryDetails?.deliveryPartnerToken || order.thirdPartyDetails?.trackingNumber);

  const deliveryPartnerDisplay = isSelf 
    ? (order.selfDeliveryDetails?.deliveryPersonName ? `Direct Self-Delivery (Rider: ${order.selfDeliveryDetails.deliveryPersonName})` : 'Direct Self-Delivery (Store Fleet)')
    : (order.courierName || order.thirdPartyDetails?.courierName || '3rd-Party Logistics Carrier');

  const trackingNumberDisplay = order.trackingNumber || (isSelf ? order.selfDeliveryDetails?.deliveryPartnerToken : order.thirdPartyDetails?.trackingNumber) || '';

  const trackingLinkDisplay = order.trackingUrl || order.selfDeliveryDetails?.trackingUrl || order.thirdPartyDetails?.trackingUrl || '';

  return (
    <div className="tax-invoice-print-root fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto print:block">
      <style>{`
        @media print {
          @page {
            margin: 10mm;
            size: auto;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          body > * {
            visibility: hidden !important;
          }
          .tax-invoice-print-root,
          .tax-invoice-print-root * {
            visibility: visible !important;
          }
          .tax-invoice-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            display: block !important;
          }
          .tax-invoice-print-card {
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <div className="tax-invoice-print-card bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar */}
        <div className="bg-gray-950 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${isCancelled ? 'bg-rose-600' : 'bg-brand-teal'} text-white flex items-center justify-center font-bold`}>
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs sm:text-sm text-white leading-tight">
                {isCancelled ? 'Official Credit Note & Cancellation Certificate' : 'Tax Invoice & Certificate of Order'}
              </h3>
              <p className="text-[10px] text-gray-400">Order ID: #{order.id || order.orderId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {confirmed && (
              <button
                onClick={handlePrint}
                className={`px-3 py-1.5 ${isCancelled ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-teal hover:bg-teal-700'} text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs`}
              >
                <Printer size={13} /> {isCancelled ? 'Print Credit Note' : 'Print Invoice'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Strict Verification Banner */}
        {!confirmed ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
              <Lock size={28} />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-lg text-gray-900">Tax Invoice Generation Locked</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Official Tax Invoice can only be created strictly after payment status is verified and confirmed.
              </p>
            </div>
            <div className="inline-block bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-4 py-2 rounded-xl">
              Current Payment Status: <span className="uppercase font-black text-amber-950">{order.paymentStatus || 'Pending Verification'}</span>
            </div>
          </div>
        ) : (

        /* Invoice Sheet / Credit Note Body */
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto print:overflow-visible print:p-0">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-900 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`${isCancelled ? 'bg-rose-600' : 'bg-brand-teal'} text-white font-black text-xs px-2 py-0.5 rounded tracking-wider uppercase`}>Book Vardi</span>
                {isCancelled ? (
                  <span className="text-xs font-extrabold text-rose-700 flex items-center gap-1">
                    <ShieldCheck size={14} /> Official GST Credit Note
                  </span>
                ) : (
                  <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck size={14} /> Official Verified Invoice
                  </span>
                )}
              </div>
              <h1 className="font-display font-extrabold text-xl text-gray-900 tracking-tight">
                BOOK VARDI PRIVATE LIMITED
              </h1>
              <p className="text-[11px] text-gray-500">Lucknow, Uttar Pradesh - 226001 | GSTIN: 09AAACB1234F1Z9</p>
            </div>

            <div className={`sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 ${isCancelled ? 'border-rose-600' : 'border-brand-teal'} pl-3 sm:pl-0`}>
              <h2 className={`font-display font-black text-lg uppercase tracking-wider ${isCancelled ? 'text-rose-600' : 'text-gray-900'}`}>
                {isCancelled ? 'CREDIT NOTE' : 'TAX INVOICE'}
              </h2>
              <p className="text-xs font-bold text-gray-700">
                {isCancelled ? 'Credit Note No: ' : 'Invoice No: '}
                <strong className={`font-mono ${isCancelled ? 'text-rose-600' : 'text-brand-teal'}`}>
                  {isCancelled ? `CN-${order.id}` : `INV-${order.id}`}
                </strong>
              </p>
              {isCancelled && (
                <p className="text-[11px] text-gray-500 font-mono">
                  Original Ref: <strong>INV-{order.id}</strong>
                </p>
              )}
              <p className="text-[11px] text-gray-500">
                {isCancelled ? 'Reversal Date: ' : 'Invoice Date: '}
                {order.cancelledAt ? new Date(order.cancelledAt).toLocaleDateString('en-GB') : (order.date || new Date().toLocaleDateString('en-GB'))}
              </p>
            </div>
          </div>

          {/* Cancellation Alert Banner */}
          {isCancelled && (
            <div className="p-3.5 bg-rose-50/90 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1 shadow-xs">
              <div className="flex items-center gap-2 font-black text-rose-950 uppercase tracking-wider text-[11px]">
                <RotateCcw size={15} className="text-rose-600 shrink-0" />
                <span>Cancellation & Statutory Tax Reversal Details</span>
              </div>
              <p className="text-xs text-rose-950 leading-snug">
                <strong>Cancellation Reason:</strong> <span className="font-semibold text-rose-900">{order.cancellationReason || order.cancelReason || order.reason || 'Customer Requested Order Cancellation'}</span>
                {order.cancelledBy ? ` (Initiated by ${order.cancelledBy})` : ''}
              </p>
              <p className="text-[11px] text-rose-800 font-medium">
                Refund Status: <strong>{order.paymentStatus === 'paid' || order.paymentStatus === 'Paid' ? 'Refund Processed & Credited to Original Payment Source' : 'Order Cancelled (No Charge Payable)'}</strong>
              </p>
            </div>
          )}

          {/* Seller & Customer Information */}
          {(() => {
            const primarySellerName = resolvedSeller.storeName;
            const primarySellerGst = resolvedSeller.gstNumber;
            const primarySellerCity = resolvedSeller.city;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">
                    {isCancelled ? 'Issued By (Merchant / Seller)' : 'Sold By (Merchant / Seller)'}
                  </span>
                  <p className="font-extrabold text-gray-900 text-sm">{primarySellerName}</p>
                  <p className="text-gray-600 mt-0.5">Location / City: {primarySellerCity}</p>
                  <p className="text-gray-700 font-mono font-bold mt-1">GSTIN: {primarySellerGst}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">
                    {isCancelled ? 'Issued To (Customer)' : 'Billed To (Customer)'}
                  </span>
                  <p className="font-extrabold text-gray-900 text-sm">{typeof order.customerName === 'object' ? (order.customerName?.name || 'Customer') : (order.customerName || order.customer?.name || 'Customer')}</p>
                  <p className="text-gray-600 mt-0.5">{formattedAddressStr}</p>
                  <p className="text-gray-500 mt-1">Order ID: <strong className="font-mono text-gray-900">#{order.id || order.orderId}</strong> | Payment: <strong>{order.paymentMethod || 'Online UPI'}</strong></p>
                </div>
              </div>
            );
          })()}

          {/* Itemized Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">{isCancelled ? 'Cancelled Item Details' : 'Item Details'}</th>
                  <th className="py-2.5 px-3">Sold By (Seller)</th>
                  <th className="py-2.5 px-3 text-center w-14">Qty</th>
                  <th className="py-2.5 px-3 text-right w-24">Unit Price</th>
                  <th className="py-2.5 px-3 text-right w-28">{isCancelled ? 'Refunded Gross' : 'Total Price'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemBreakdowns.map((item, idx) => {
                  const sellerName = getItemSellerName(item);
                  const sizeInfo = item.selectedSize || item.size || item.variantName;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 text-center font-bold text-gray-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-gray-900 leading-snug">{item.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mt-0.5">
                          {sizeInfo && (
                            <span>Size: <strong className="text-gray-700">{sizeInfo}</strong></span>
                          )}
                          {sizeInfo && item.category && <span>•</span>}
                          <span>{item.category || 'School Supply'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px] border border-gray-200 block truncate max-w-[150px]" title={sellerName}>
                          {sellerName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {isCancelled ? (
                          <span className="text-rose-700">-₹{item.grossPrice.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-900">₹{item.grossPrice.toFixed(2)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Settlement & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Left Column: Payment & Authenticity Notes */}
            <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 flex flex-col justify-between space-y-3 text-xs">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-black text-gray-400 block tracking-wider">
                  {isCancelled ? 'Refund Authorization & Status' : 'Payment & Authenticity'}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {isCancelled ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                      <ShieldCheck size={13} /> Refund Processed
                    </span>
                  ) : isCod && !isPaymentVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock size={13} /> Unpaid (Pay on Delivery)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <ShieldCheck size={13} /> Payment Verified
                    </span>
                  )}
                  <span className="text-gray-600 text-[11px] font-medium">
                    via <strong>{order.paymentMethod || 'Online UPI'}</strong>
                  </span>
                </div>
                {order.paymentId && (
                  <p className="text-[10px] text-gray-500 font-mono">
                    Ref / Txn ID: {order.paymentId}
                  </p>
                )}

                <div className="bg-white rounded-lg p-2.5 border border-gray-200/90 mt-2">
                  <span className="text-[10px] uppercase font-black text-gray-400 block tracking-wider">
                    {isCancelled ? 'Amount in Words (Refunded Credit)' : 'Amount in Words'}
                  </span>
                  <p className="font-bold text-gray-800 text-[11px] italic mt-0.5 leading-snug">{numberToWords(grandTotal)}</p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-gray-200 text-[11px] text-gray-500 space-y-1">
                {isCancelled ? (
                  <>
                    <p className="leading-relaxed">
                      • Credit Note issued under Section 34 of CGST Act, 2017. Tax liability reversed in full.
                    </p>
                    <p className="leading-relaxed">
                      • The total refunded amount has been processed back to your original payment method or wallet.
                    </p>
                    <p className="text-[10px] text-gray-400 pt-0.5 italic">
                      This is a computer-generated credit note and does not require a physical signature.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="leading-relaxed">
                      • All item prices are inclusive of all applicable taxes.
                    </p>
                    <p className="leading-relaxed">
                      • 7-Day Hassle-Free Returns & Exchanges eligible from delivery date.
                    </p>
                    <p className="text-[10px] text-gray-400 pt-0.5 italic">
                      This is a computer-generated tax invoice and does not require a physical signature.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Financial Calculation */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-black text-gray-400 block tracking-wider">
                  {isCancelled ? 'Refund & Credit Breakdown' : 'Price Summary'}
                </span>
                <div className="flex justify-between items-start text-gray-600">
                  <div>
                    <span>{isCancelled ? 'Items Subtotal Reversal:' : 'Items Subtotal:'}</span>
                    <span className="text-[10px] text-gray-400 block font-normal">(GST Included in Item Prices)</span>
                  </div>
                  <span className="font-mono font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-start text-gray-600">
                  <div>
                    <span>GST Tax (Included):</span>
                    <span className="text-[10px] text-gray-400 block font-normal">(Included in Price)</span>
                  </div>
                  <span className="font-mono font-semibold text-brand-teal">₹{taxAmount.toFixed(2)}</span>
                </div>
                {discount > 0 ? (
                  <div className={`flex justify-between font-bold ${isCancelled ? 'text-rose-700' : 'text-emerald-700'}`}>
                    <span>{isCancelled ? 'Coupon Reversal:' : 'Offer / Coupon Applied:'}</span>
                    <span className="font-mono">-₹{discount.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-gray-400">
                    <span>Offer / Coupon:</span>
                    <span className="font-mono">None Applied (₹0.00)</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>{isCancelled ? 'Reward Points Restored:' : 'Reward Points Redeemed:'}</span>
                    <span className="font-mono">{isCancelled ? `+₹${pointsDiscount.toFixed(2)}` : `-₹${pointsDiscount.toFixed(2)}`}</span>
                  </div>
                )}
                <div className="flex justify-between items-start text-gray-600">
                  <div>
                    <span>{isCancelled ? 'Delivery Adjustment:' : 'Delivery Charges:'}</span>
                    <span className="text-[10px] text-gray-400 block font-normal">(Incl. 18% GST)</span>
                  </div>
                  <span className="font-mono font-semibold text-emerald-700">
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {isCancelled ? (
                <div className="bg-rose-600 text-white rounded-xl p-3 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-black block">Net Refunded Credit Amount:</span>
                    <span className="text-[10px] text-rose-100 font-normal">(Full Reversal Authorized)</span>
                  </div>
                  <span className="font-mono text-lg font-black">₹{grandTotal.toFixed(2)}</span>
                </div>
              ) : (
                <div className="border-t-2 border-gray-300 pt-2.5 mt-2">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-xs font-black text-gray-900 block">Gross Order Total:</span>
                      <span className="text-[10px] text-gray-400 font-normal">(Inclusive of all taxes & GST)</span>
                    </div>
                    <span className="font-mono text-base font-black text-brand-teal">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
            <div>
              <p className="font-semibold text-gray-700">Book Vardi Customer Support & Help Desk</p>
              <p className="text-[10px] text-gray-400">Official Student & School Marketplace • support@bookvardi.com</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Authorized Signatory</span>
              <span className="font-bold text-gray-900 text-xs block">{resolvedSeller.storeName}</span>
              <span className="text-[10px] font-mono text-gray-500 block">GSTIN: {resolvedSeller.gstNumber || 'Exempt / N/A'}</span>
            </div>
          </div>

        </div>
        )}
      </div>
    </div>
  );
}

export function CreditNoteModal(props) {
  return <TaxInvoiceModal {...props} />;
}
