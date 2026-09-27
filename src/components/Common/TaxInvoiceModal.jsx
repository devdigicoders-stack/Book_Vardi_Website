import React from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  FileText, 
  Lock,
  DollarSign
} from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=150&auto=format&fit=crop&q=80';

export function getProductGstRate(item) {
  const explicitGst = item?.gstPercent ?? item?.gstPercentage ?? item?.gstRate ?? item?.gst ?? item?.taxRate ?? item?.productId?.gstPercent ?? item?.productId?.gstRate ?? item?.productId?.gst ?? item?.productId?.gstPercentage ?? item?.productId?.taxRate;
  if (explicitGst !== undefined && explicitGst !== null && String(explicitGst).trim() !== '' && !isNaN(Number(explicitGst))) {
    return Number(explicitGst);
  }
  return 5;
}

export default function TaxInvoiceModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const orderStatus = String(order.status || order.overallStatus || '').toLowerCase();
  if (orderStatus === 'cancelled') {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Lock size={28} />
          </div>
          <h3 className="font-display font-extrabold text-lg text-gray-900 mb-2">
            Tax Invoice Unavailable
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed mb-6">
            Tax Invoice and Certificate cannot be generated or downloaded for <strong>Order #{order.id || order.orderId}</strong> because this order was cancelled upon customer request.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const confirmed = orderStatus === 'confirmed' || orderStatus === 'shipped' || orderStatus === 'delivered' || orderStatus === 'processing' || order.paymentStatus === 'paid' || order.paymentStatus === 'Paid';

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
    const qty = Number(item.quantity || 1);
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
      qty,
      unitPrice,
      grossPrice,
      rate,
      taxableVal,
      taxAmt
    };
  });

  const subtotal = order.subtotal || items.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
  const taxAmount = Math.round(totalTaxAmount * 100) / 100;
  const shippingCost = Number(order.shippingCost ?? order.shippingFee ?? 0);
  const discount = Number(order.discount ?? order.discountAmount ?? 0);
  const grandTotal = Number(order.total || order.totalAmount || (subtotal + shippingCost - discount));

  const handlePrint = () => {
    if (!confirmed) {
      alert('⚠️ Tax Invoice & Certificate is generated only when an order is confirmed strictly.');
      return;
    }
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar */}
        <div className="bg-gray-950 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-teal text-white flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs sm:text-sm text-white leading-tight">
                Tax Invoice & Certificate of Order
              </h3>
              <p className="text-[10px] text-gray-400">Order ID: #{order.id || order._id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {confirmed && (
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-brand-teal hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={13} /> Print Invoice
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
              <h4 className="font-display font-extrabold text-lg text-gray-900">Certificate Generation Locked</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Official Tax Invoice and Order Certificate are strictly generated only after order confirmation or payment settlement.
              </p>
            </div>
            <div className="inline-block bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-4 py-2 rounded-xl">
              Current Order Status: <span className="uppercase font-black text-amber-950">{order.status || 'Pending Verification'}</span>
            </div>
          </div>
        ) : (

        /* Invoice Sheet Body */
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto print:overflow-visible print:p-0">
          
          {/* Company & Certificate Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-900 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-brand-teal text-white font-black text-xs px-2 py-0.5 rounded tracking-wider uppercase">Book Vardi</span>
                <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck size={14} /> Official Verified Invoice
                </span>
              </div>
              <h1 className="font-display font-extrabold text-xl text-gray-900 tracking-tight">
                BOOK VARDI PRIVATE LIMITED
              </h1>
              <p className="text-[11px] text-gray-500">Lucknow, Uttar Pradesh - 226001 | GSTIN: 09AAACB1234F1Z9</p>
            </div>

            <div className="sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 border-brand-teal pl-3 sm:pl-0">
              <h2 className="font-display font-black text-lg text-gray-900 uppercase tracking-wider">
                TAX INVOICE
              </h2>
              <p className="text-xs font-bold text-gray-700">Invoice No: <strong className="font-mono text-brand-teal">INV-{order.id}</strong></p>
              <p className="text-[11px] text-gray-500">Invoice Date: {order.date || new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          {/* Customer & Shipping Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">Billed To (Customer)</span>
              <p className="font-extrabold text-gray-900">{typeof order.customerName === 'object' ? (order.customerName?.name || 'Customer') : (order.customerName || order.customer?.name || 'Customer')}</p>
              <p className="text-gray-600 mt-0.5">{formattedAddressStr}</p>
              <p className="text-gray-500 mt-1">Phone: {typeof order.customerPhone === 'object' ? (order.customerPhone?.phone || 'N/A') : (order.customerPhone || order.customer?.phone || 'N/A')}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">Order Details</span>
              <p className="text-gray-700">Order ID: <strong className="font-mono text-gray-900">#{order.id}</strong></p>
              <p className="text-gray-700">Payment Method: <strong className="text-gray-900">{order.paymentMethod || 'Online UPI'}</strong></p>
              <p className="text-gray-700">School/Institution: <strong>{order.school || 'General Retail'}</strong></p>
            </div>
          </div>

          {/* Itemized Table with Product-Level Seller & GST Applied Breakdown */}
          <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Item Details</th>
                  <th className="py-2.5 px-3">Sold By (Seller)</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Taxable Val</th>
                  <th className="py-2.5 px-3 text-right">GST Rate</th>
                  <th className="py-2.5 px-3 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemBreakdowns.map((item, idx) => {
                  const sellerName = getItemSellerName(item);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-[10px] text-gray-400">{item.category || 'School Supply'}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px] border border-gray-200 block truncate max-w-[130px]" title={sellerName}>
                          {sellerName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-600">₹{item.taxableVal.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-extrabold text-brand-teal block">{item.rate}% GST</span>
                        <span className="text-[9px] text-gray-500 font-medium">(₹{item.taxAmt.toFixed(2)})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono">₹{item.grossPrice.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Settlement & Tax Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {(() => {
              const parseStateKeyFromText = (text) => {
                if (!text) return '';
                const str = String(text).toLowerCase();
                const states = [
                  { key: 'uttarpradesh', aliases: ['uttar pradesh', 'uttarpradesh', 'up', 'noida', 'lucknow', 'kanpur', 'ghaziabad', 'agra', 'varanasi', 'prayagraj'] },
                  { key: 'delhi', aliases: ['delhi', 'new delhi', 'nct of delhi', 'nct', 'dl'] },
                  { key: 'maharashtra', aliases: ['maharashtra', 'mumbai', 'pune', 'nagpur', 'thane', 'mh'] },
                  { key: 'karnataka', aliases: ['karnataka', 'bangalore', 'bengaluru', 'mysore', 'ka'] },
                  { key: 'tamilnadu', aliases: ['tamil nadu', 'tamilnadu', 'chennai', 'coimbatore', 'tn'] },
                  { key: 'haryana', aliases: ['haryana', 'gurugram', 'gurgaon', 'faridabad', 'hr'] },
                  { key: 'rajasthan', aliases: ['rajasthan', 'jaipur', 'jodhpur', 'udaipur', 'rj'] },
                  { key: 'westbengal', aliases: ['west bengal', 'westbengal', 'kolkata', 'wb'] },
                  { key: 'gujarat', aliases: ['gujarat', 'ahmedabad', 'surat', 'vadodara', 'gj'] },
                  { key: 'punjab', aliases: ['punjab', 'ludhiana', 'amritsar', 'pb'] },
                  { key: 'madhyapradesh', aliases: ['madhya pradesh', 'madhyapradesh', 'bhopal', 'indore', 'mp'] },
                  { key: 'bihar', aliases: ['bihar', 'patna', 'br'] },
                  { key: 'telangana', aliases: ['telangana', 'hyderabad', 'tg', 'ts'] },
                  { key: 'andhrapradesh', aliases: ['andhra pradesh', 'andhrapradesh', 'visakhapatnam', 'ap'] },
                  { key: 'kerala', aliases: ['kerala', 'kochi', 'thiruvananthapuram', 'kl'] },
                  { key: 'uttarakhand', aliases: ['uttarakhand', 'dehradun', 'uk'] }
                ];

                for (const st of states) {
                  for (const alias of st.aliases) {
                    if (new RegExp(`\\b${alias}\\b`, 'i').test(str)) {
                      return st.key;
                    }
                  }
                }
                return str.trim();
              };

              const getDynamicState = (obj, fallbackText) => {
                if (obj && typeof obj === 'object') {
                  if (obj.state && String(obj.state).trim()) return parseStateKeyFromText(obj.state);
                  const combined = `${obj.street || ''} ${obj.addressLine || ''} ${obj.city || ''} ${obj.address || ''}`;
                  if (combined.trim()) return parseStateKeyFromText(combined);
                }
                return parseStateKeyFromText(fallbackText || '');
              };

              const firstItemSeller = items[0]?.sellerId;
              const sellerStateKey = getDynamicState(firstItemSeller, `${order.sellerState || ''} ${order.sellerCity || ''} ${order.sellerAddress || ''}`);
              const customerStateKey = getDynamicState(shippingAddr, formattedAddressStr);

              const isSameState = !sellerStateKey || !customerStateKey || sellerStateKey === customerStateKey;
              const sellerStateStr = (typeof firstItemSeller === 'object' ? firstItemSeller.state || firstItemSeller.city : '') || order.sellerState || sellerStateKey || 'Seller Location';
              const customerStateStr = shippingAddr.state || shippingAddr.city || customerStateKey || 'Customer Location';

              return (
                <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 space-y-1.5 text-[11px]">
                  <h4 className="font-extrabold text-[10px] text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={13} /> GST Tax Breakdown ({isSameState ? 'Intra-State Same State' : 'Inter-State Different State'})
                  </h4>
                  <div className="flex justify-between text-gray-700">
                    <span>Taxable Value (Base Excl. Tax):</span>
                    <span className="font-mono">₹{totalTaxableValue.toFixed(2)}</span>
                  </div>
                  {isSameState ? (
                    <>
                      <div className="flex justify-between text-emerald-800 text-[10px]">
                        <span>CGST (Central Tax 50% Split):</span>
                        <span className="font-mono">₹{(taxAmount / 2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-800 text-[10px]">
                        <span>SGST (State Tax 50% Split):</span>
                        <span className="font-mono">₹{(taxAmount / 2).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-emerald-900 font-bold text-[10px] bg-emerald-100/70 p-1.5 rounded-lg border border-emerald-200">
                      <div>
                        <span className="block text-emerald-950 font-extrabold">IGST (Integrated Tax 100%):</span>
                        <span className="text-[9px] text-emerald-800 font-normal">Inter-State Supply ({sellerStateStr} ➔ {customerStateStr})</span>
                      </div>
                      <span className="font-mono font-black self-center text-emerald-950">₹{taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-900 font-bold border-t border-emerald-200 pt-1">
                    <span>Total GST Collected (Included):</span>
                    <span className="font-mono">₹{taxAmount.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Offer / Coupon Applied:</span>
                  <span className="font-mono">-₹{discount.toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-gray-400">
                  <span>Offer / Coupon:</span>
                  <span className="font-mono text-gray-400">Not Applied (₹0.00)</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges:</span>
                <span className="font-mono font-semibold text-emerald-700">
                  {shippingCost === 0 ? 'Not Applied (FREE)' : `₹${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="border-t-2 border-gray-300 pt-1.5 flex justify-between items-center text-xs font-black text-gray-900">
                <span>Gross Order Total:</span>
                <span className="font-mono text-sm text-brand-teal">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
        )}
      </div>
    </div>
  );
}
