import React from 'react';
import { Printer, Download, X, CheckCircle2, ShieldCheck, Building2, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { downloadInvoiceApi } from '../../utils/api';

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
      name: order.itemName || 'School Supply & Educational Books Kit',
      quantity: order.quantity || 1,
      price: order.total || 499,
      category: 'Books & Stationery',
      hsnCode: '4901'
    }
  ];

  const subtotal = order.subtotal || items.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
  const taxAmount = Math.round(subtotal * 0.05); // 5% GST estimate for educational supplies
  const shippingCost = order.shippingCost !== undefined ? order.shippingCost : 0;
  const discount = order.discount || 0;
  const grandTotal = order.total || (subtotal + taxAmount + shippingCost - discount);

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-teal text-white flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                GST Tax Invoice & Bill of Order
              </h3>
              <p className="text-[11px] text-gray-400">Order #{order.id} • Official Tax Document</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleDownloadBackendPdf}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-white/20"
              title="Download PDF via Backend API"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 text-gray-800 text-xs font-sans print:overflow-visible print:p-6" id="printable-tax-invoice">
          
          {/* Invoice Top Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-brand-teal/20 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-brand-teal text-white flex items-center justify-center font-black text-sm">
                  BV
                </div>
                <span className="font-display font-black text-xl text-gray-900 tracking-tight">
                  Book <span className="text-brand-teal">Vardi</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">Official Educational Supplies & Uniform Marketplace</p>
              <p className="text-[11px] text-gray-500">Book Vardi Retail Pvt Ltd, Commercial Market, Near Civil Hospital</p>
              <p className="text-[11px] text-gray-500">Lucknow, Uttar Pradesh - 226001 • GSTIN: 09AAACB1234F1Z9</p>
              <p className="text-[11px] text-gray-500">Support: care@bookvardi.in • +91 98765 43210</p>
            </div>

            <div className="text-right sm:text-right bg-gray-50 p-4 rounded-2xl border border-gray-200 min-w-[220px]">
              <span className="inline-block bg-brand-teal text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md mb-2">
                TAX INVOICE / BILL OF SUPPLY
              </span>
              <p className="text-xs font-bold text-gray-900">Invoice No: <span className="font-mono">{invoiceNo}</span></p>
              <p className="text-xs text-gray-600">Invoice Date: <span className="font-medium">{invoiceDate}</span></p>
              <p className="text-xs text-gray-600">Order ID: <span className="font-mono font-bold text-gray-900">#{order.id}</span></p>
              <p className="text-xs text-gray-600">State Code: <span className="font-bold">09 (Uttar Pradesh)</span></p>
            </div>
          </div>

          {/* Customer & Seller Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
            <div>
              <h4 className="font-extrabold text-xs text-brand-teal uppercase tracking-wider mb-2 flex items-center gap-1">
                <MapPin size={13} /> Billed To / Shipping Address
              </h4>
              <p className="font-bold text-sm text-gray-900">{shippingAddr.name || 'Customer'}</p>
              <p className="text-gray-700 leading-relaxed mt-1">{formattedAddressStr}</p>
              <p className="text-gray-600 mt-1">Phone: <strong className="text-gray-800">{shippingAddr.phone || 'N/A'}</strong></p>
              {userProfile?.email && <p className="text-gray-600">Email: {userProfile.email}</p>}
            </div>

            <div>
              <h4 className="font-extrabold text-xs text-brand-teal uppercase tracking-wider mb-2 flex items-center gap-1">
                <Building2 size={13} /> Seller / Dispatch Warehouse
              </h4>
              <p className="font-bold text-sm text-gray-900">{order.sellerName || 'Book Vardi Partner Merchant'}</p>
              <p className="text-gray-700 leading-relaxed mt-1">{order.sellerAddress || 'Central Supply Fulfillment Center, Commercial Market, Lucknow'}</p>
              <p className="text-gray-600 mt-1">Seller GSTIN: <strong className="font-mono text-gray-800">{order.sellerGstin || '09AAACB9876K1Z2'}</strong></p>
              <p className="text-gray-600">Payment Method: <strong className="text-gray-900">{paymentMethod}</strong> ({paymentStatus})</p>
            </div>
          </div>

          {/* Itemized Order Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-teal text-white text-[11px] uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4 text-center">HSN</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">GST Rate</th>
                  <th className="py-3 px-4 text-right">Net Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {items.map((item, idx) => {
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.price || 0);
                  const itemNet = price * qty;
                  return (
                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        {item.size && <span className="text-[10px] text-gray-500 font-medium">Size: {item.size} • </span>}
                        {item.category && <span className="text-[10px] text-gray-500 font-medium">Category: {item.category}</span>}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-gray-600">{item.hsnCode || '4901'}</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-900">{qty}</td>
                      <td className="py-3 px-4 text-right font-mono">₹{price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600">5% GST</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">₹{itemNet.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation & Breakdown Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            <div className="w-full sm:w-1/2 space-y-3">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs font-medium space-y-1">
                <p className="font-bold flex items-center gap-1 text-emerald-950">
                  <ShieldCheck size={14} /> Tax Declaration & Certificate
                </p>
                <p className="text-[11px] leading-relaxed">
                  GST Tax Invoice under section 31 of CGST Act. Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged.
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 text-[11px] space-y-1">
                <p className="font-bold text-gray-700 uppercase tracking-wider">Amount in Words:</p>
                <p className="font-extrabold text-gray-900 italic">{numberToWords(Math.round(grandTotal))}</p>
              </div>
            </div>

            <div className="w-full sm:w-1/2 bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal (Excl. Tax):</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Estimated GST (CGST 2.5% + SGST 2.5%):</span>
                <span className="font-mono">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping & Campus Delivery:</span>
                <span className="font-mono">{shippingCost > 0 ? `₹${shippingCost.toFixed(2)}` : 'FREE Delivery'}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Student Coupon Discount:</span>
                  <span className="font-mono">-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-gray-300 pt-2 flex justify-between items-center text-sm font-black text-gray-900">
                <span>Grand Total Amount:</span>
                <span className="font-mono text-base text-brand-teal">₹{Number(grandTotal).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Invoice Footer Sign-off */}
          <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-500 gap-4">
            <div>
              <p>1. This is a computer-generated invoice and requires no physical signature.</p>
              <p>2. Subject to Lucknow Jurisdiction. Book Vardi Return & Exchange Policy applies.</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="font-bold text-gray-700 text-xs">For Book Vardi Retail Pvt Ltd</p>
              <div className="mt-2 text-brand-teal font-extrabold italic text-xs">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
