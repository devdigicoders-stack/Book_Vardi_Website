import React from 'react';
import { Printer, Download, X, ShieldCheck, Building2, MapPin, FileText } from 'lucide-react';
import { downloadInvoiceApi, resolveImageUrl } from '../../utils/api';

export default function TaxInvoiceModal({ isOpen, onClose, order, userProfile, role = 'user' }) {
  if (!isOpen || !order) return null;

  const invoiceNo = `INV-${order.id || order.orderId || '2026-0001'}`;
  const invoiceDate = order.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const paymentMethod = order.paymentMethod || 'UPI / Online Payment';
  const paymentStatus = order.paymentStatus || 'Paid';

  // Format Shipping Address safely
  const shippingAddr = typeof order.shippingAddress === 'object' && order.shippingAddress !== null
    ? order.shippingAddress
    : {
        name: order.customerName || userProfile?.name || 'Customer',
        phone: order.customerPhone || userProfile?.phone || '',
        addressLine: typeof order.shippingAddress === 'string' ? order.shippingAddress : 'Delivery Address',
        city: userProfile?.city || 'Lucknow',
        state: userProfile?.state || 'Uttar Pradesh',
        pincode: userProfile?.pincode || '226001'
      };

  const formattedAddressStr = typeof order.shippingAddress === 'string'
    ? order.shippingAddress
    : [
        shippingAddr.addressLine || shippingAddr.street,
        shippingAddr.colony || shippingAddr.landmark,
        shippingAddr.city,
        shippingAddr.state,
        shippingAddr.pincode ? `- ${shippingAddr.pincode}` : ''
      ].filter(Boolean).join(', ');

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      id: 1,
      name: order.itemName || order.name || 'School Supply & Educational Books Kit',
      image: order.image || (Array.isArray(order.images) && order.images[0]) || FALLBACK_IMAGE,
      quantity: order.quantity || 1,
      price: order.total || order.price || 499,
      category: 'Books & Stationery',
      hsnCode: '4901'
    }
  ];

  const getProductGstRate = (item) => {
    const explicitGst = item.gstPercent ?? item.gstPercentage ?? item.gstRate ?? item.gst ?? item.taxRate ?? item.productId?.gstPercent ?? item.productId?.gstRate ?? item.productId?.gst ?? item.productId?.gstPercentage ?? item.productId?.taxRate;
    if (explicitGst !== undefined && explicitGst !== null && !isNaN(Number(explicitGst))) {
      return Number(explicitGst);
    }
    const category = (item.category || item.productId?.category || '').toLowerCase();
    if (category.includes('book')) return 0;
    if (category.includes('uniform') || category.includes('clothing')) return 5;
    if (category.includes('shoe')) return 12;
    return 18;
  };

  const subtotal = order.subtotal || items.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
  const taxAmount = items.reduce((acc, item) => {
    const rate = getProductGstRate(item);
    const itemNet = Number(item.price || 0) * Number(item.quantity || 1);
    return acc + (rate > 0 ? (itemNet - (itemNet / (1 + rate / 100))) : 0);
  }, 0);
  const shippingCost = order.shippingCost !== undefined ? order.shippingCost : 0;
  const discount = order.discount || 0;
  const grandTotal = order.total || (subtotal + shippingCost - discount);

  // Helper to convert number to words (Indian rupees)
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if ((num = num.toString()).length > 9) return 'Amount Exceeds Limit';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
    return str;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadBackendPdf = async () => {
    if (order.id) {
      await downloadInvoiceApi(order.id, shippingAddr.phone);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Compact, crisp A4-proportional container (max-w-3xl instead of max-w-4xl) */}
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-gray-900 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-teal text-white flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs sm:text-sm text-white leading-tight">
                GST Tax Invoice & Order Bill
              </h3>
              <p className="text-[10px] text-gray-400">Order #{order.id} • Official Document</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadBackendPdf}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-white/20"
              title="Download PDF via Backend API"
            >
              <Download size={14} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-gray-800 text-[11px] font-sans print:overflow-visible print:p-4" id="printable-tax-invoice">
          
          {/* Invoice Top Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-brand-teal/20 pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-brand-teal text-white flex items-center justify-center font-black text-xs">
                  BV
                </div>
                <span className="font-display font-black text-lg text-gray-900 tracking-tight">
                  Book <span className="text-brand-teal">Vardi</span>
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Official Educational Supplies & Uniform Marketplace</p>
              <p className="text-[10px] text-gray-500">Book Vardi Retail Pvt Ltd, Commercial Market, Near Civil Hospital</p>
              <p className="text-[10px] text-gray-500">Lucknow, Uttar Pradesh - 226001 • GSTIN: 09AAACB1234F1Z9</p>
            </div>

            <div className="text-right sm:text-right bg-gray-50 p-3 rounded-xl border border-gray-200 min-w-[190px]">
              <span className="inline-block bg-brand-teal text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md mb-1">
                TAX INVOICE / BILL OF SUPPLY
              </span>
              <p className="text-[11px] font-bold text-gray-900">Invoice No: <span className="font-mono">{invoiceNo}</span></p>
              <p className="text-[11px] text-gray-600">Date: <span className="font-medium">{invoiceDate}</span></p>
              <p className="text-[11px] text-gray-600">Order ID: <span className="font-mono font-bold text-gray-900">#{order.id}</span></p>
            </div>
          </div>

          {/* Customer & Seller Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/80 p-3.5 rounded-xl border border-gray-200">
            <div>
              <h4 className="font-extrabold text-[10px] text-brand-teal uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin size={12} /> Billed To / Shipping Address
              </h4>
              <p className="font-bold text-xs text-gray-900">{shippingAddr.name || 'Customer'}</p>
              <p className="text-gray-700 leading-snug mt-0.5">{formattedAddressStr}</p>
              <p className="text-gray-600 mt-0.5">Phone: <strong className="text-gray-800">{shippingAddr.phone || 'N/A'}</strong></p>
            </div>

            <div>
              <h4 className="font-extrabold text-[10px] text-brand-teal uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building2 size={12} /> Seller / Dispatch Warehouse
              </h4>
              <p className="font-bold text-xs text-gray-900">{order.sellerName || 'Book Vardi Partner Merchant'}</p>
              <p className="text-gray-700 leading-snug mt-0.5">{order.sellerAddress || 'Central Supply Fulfillment Center, Commercial Market, Lucknow'}</p>
              <p className="text-gray-600 mt-0.5">Seller GSTIN: <strong className="font-mono text-gray-800">{order.sellerGstin || '09AAACB9876K1Z2'}</strong></p>
              <p className="text-gray-600">Payment Method: <strong className="text-gray-900">{paymentMethod}</strong> ({paymentStatus})</p>
            </div>
          </div>

          {/* Itemized Order Table with REAL Product Images */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-teal text-white text-[10px] uppercase tracking-wider font-extrabold">
                  <th className="py-2 px-3 w-8">#</th>
                  <th className="py-2 px-3">Item Description & Photo</th>
                  <th className="py-2 px-3 text-center w-16">HSN</th>
                  <th className="py-2 px-3 text-center w-12">Qty</th>
                  <th className="py-2 px-3 text-right w-20">Unit Price</th>
                  <th className="py-2 px-3 text-right w-16">GST Rate</th>
                  <th className="py-2 px-3 text-right w-20">Net Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[11px]">
                {items.map((item, idx) => {
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.price || 0);
                  const itemNet = price * qty;
                  const itemImgRaw = item.image || (Array.isArray(item.images) && item.images[0]) || order.image;
                  const itemImg = itemImgRaw ? resolveImageUrl(itemImgRaw) : '';
                  const itemGstRate = getProductGstRate(item);

                  return (
                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="py-2.5 px-3 font-bold text-gray-500 text-center">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {/* REAL PRODUCT IMAGE THUMBNAIL */}
                          {itemImg ? (
                            <img
                              src={itemImg}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0 bg-gray-50 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-gray-200 shrink-0 bg-gray-100 flex items-center justify-center text-gray-400 text-[9px] font-bold">
                              No Img
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 leading-snug">{item.name}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mt-0.5">
                              {item.size && <span>Size: <strong className="text-gray-700">{item.size}</strong></span>}
                              {item.size && item.category && <span>•</span>}
                              {item.category && <span>Cat: {item.category}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-gray-600">{item.hsnCode || '4901'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-900">{qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{price.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-600">{itemGstRate}% GST</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono">₹{itemNet.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-1">
            <div className="w-full sm:w-1/2 space-y-2">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[10px] font-medium space-y-0.5">
                <p className="font-bold flex items-center gap-1 text-emerald-950">
                  <ShieldCheck size={13} /> Tax Declaration & Certificate
                </p>
                <p className="text-[10px] leading-relaxed">
                  GST Tax Invoice under section 31 of CGST Act. Certified that the amount indicated represents the price actually charged.
                </p>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-[10px] space-y-0.5">
                <p className="font-bold text-gray-700 uppercase tracking-wider">Amount in Words:</p>
                <p className="font-extrabold text-gray-900 italic">{numberToWords(Math.round(grandTotal))}</p>
              </div>
            </div>

            <div className="w-full sm:w-1/2 bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST Tax (Product Priority):</span>
                <span className="font-mono">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping & Delivery:</span>
                <span className="font-mono">{shippingCost > 0 ? `₹${shippingCost.toFixed(2)}` : 'FREE'}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Student Coupon Discount:</span>
                  <span className="font-mono">-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-gray-300 pt-1.5 flex justify-between items-center text-xs font-black text-gray-900">
                <span>Grand Total:</span>
                <span className="font-mono text-sm text-brand-teal">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
