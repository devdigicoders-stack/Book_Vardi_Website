import React from 'react';
import {
  X,
  Lock,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  Download,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

export default function PartialAdvanceReceiptModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const refId = order.referenceId || order.id || 'BULK-2026';
  const receiptNo = order.advanceReceiptNumber || `REC-ADV-${refId}`;
  const totalBudget = Number(order.overallBudget || 0);

  const advType = order.buyerAdvanceType || 'percentage';
  const advPct = Number(order.buyerAdvancePercentage || 25);
  const advAmount = Number(
    order.advancePaidAmount ||
    order.buyerAdvanceAmount ||
    (totalBudget > 0 ? Math.round((totalBudget * advPct) / 100) : 0)
  );
  const balanceDue = Math.max(0, totalBudget - advAmount);
  const isPaid = order.advancePaymentStatus === 'paid' || order.advancePaymentStatus === 'paid_partially' || Boolean(order.advancePaidAmount && Number(order.advancePaidAmount) > 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const targetId = order._id || order.id || order.referenceId;
    window.open(`${API_BASE_URL}/schools/bulk-orders/${targetId}/advance-receipt`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-teal text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText size={20} className="text-brand-yellow" />
            <div>
              <h3 className="font-display font-extrabold text-sm sm:text-base leading-tight">
                Partial Advance Payment Receipt Voucher
              </h3>
              <p className="text-[11px] text-teal-100">
                Official Institutional Mobilization Receipt • #{receiptNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPaid && (
            <><button
              type="button"
              onClick={handlePrint}
              className="p-2 text-teal-100 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="Print Receipt"
            >
              <Printer size={18} />
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="p-2 text-teal-100 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="Download PDF"
            >
              <Download size={18} />
            </button></>
          )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-teal-100 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Strict Verification Check */}
        {!isPaid ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
              <Lock size={28} />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-lg text-gray-900">Advance Receipt Locked</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Official Advance Payment Receipt can only be generated strictly after mobilization prepayment is completed and verified.
              </p>
            </div>
            <div className="inline-block bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-4 py-2 rounded-xl">
              Current Prepayment Status: <span className="uppercase font-black text-amber-950">{order.advancePaymentStatus || 'Unpaid / Pending Prepayment'}</span>
            </div>
          </div>
        ) : (

        {/* Printable Receipt Body */}
        <div id="printableReceiptArea" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-gray-800 bg-white">
          {/* Brand & Receipt Meta */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-200 gap-3">
            <div>
              <h1 className="font-display font-black text-2xl text-brand-teal">Bookvardi</h1>
              <p className="text-[11px] text-gray-500 font-medium">B2B Institutional Procurement Desk</p>
              <p className="text-[10px] text-gray-400">GSTIN: 09AAACS1429B1Z2 • corporate@bookvardi.in</p>
            </div>

            <div className="text-left sm:text-right space-y-0.5">
              <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {order.advancePaymentStatus === 'paid_partially' ? 'Advance Paid' : 'Advance Offered Voucher'}
              </span>
              <p className="font-bold text-gray-800 mt-1">Receipt: <span className="font-mono">{receiptNo}</span></p>
              <p className="text-[11px] text-gray-500">Order Ref: <span className="font-mono font-bold text-gray-700">{refId}</span></p>
              <p className="text-[11px] text-gray-500">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Parties Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-teal block mb-1">
                Procuring Institution / Buyer
              </span>
              <h4 className="font-bold text-gray-900 text-sm">{order.institutionName || 'School Name'}</h4>
              <p className="text-gray-600 mt-0.5">Attn: {order.contactName} ({order.designation || 'Administrator'})</p>
              <p className="text-gray-600">Phone: {order.contactPhone}</p>
              <p className="text-gray-600">Email: {order.contactEmail}</p>
              <p className="text-gray-500 mt-1">{[order.address, order.city, order.state, order.pincode].filter(Boolean).join(', ')}</p>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-teal block mb-1">
                Fulfillment Partner / Vendor Desk
              </span>
              <h4 className="font-bold text-gray-900 text-sm">{order.sellerName || 'Bookvardi Verified Merchant Network'}</h4>
              <p className="text-gray-600 mt-0.5">Category: Educational & Uniforms Supplier</p>
              <p className="text-gray-600">Tender Mode: Broadcast & Competitive Quoting</p>
              <p className="text-gray-500 mt-1">Managed under Bookvardi Escrow & Audit Policy</p>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-600" /> Partial Advance Breakdown
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-gray-500 font-semibold block">Total Estimated Order</span>
                <span className="text-base font-black text-gray-900 mt-0.5 block">₹{totalBudget.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400">Total tender requirement</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[10px] text-emerald-700 font-bold block">
                  Advance Offered ({advPct}%)
                </span>
                <span className="text-base font-black text-emerald-700 mt-0.5 block">₹{advAmount.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-600 font-medium">Upfront mobilization fund</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-rose-100 shadow-2xs">
                <span className="text-[10px] text-rose-700 font-semibold block">Remaining Balance Due</span>
                <span className="text-base font-black text-rose-700 mt-0.5 block">₹{balanceDue.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400">Payable on final delivery</span>
              </div>
            </div>

            {order.buyerAdvanceNote && (
              <div className="text-[11px] text-teal-900 font-medium pt-1 border-t border-teal-200/50">
                <strong>Payment Terms:</strong> {order.buyerAdvanceNote}
              </div>
            )}
          </div>

          {/* Constituent Demand Items Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              Requirement Items Summary
            </span>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Item Requirement</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Budget / Unit</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(order.requirements || []).map((req, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3 text-gray-400 font-mono">{i + 1}</td>
                      <td className="py-2 px-3 font-semibold text-gray-800">{req.itemName || 'Bulk Item'}</td>
                      <td className="py-2 px-3 text-center font-bold">{req.quantity}</td>
                      <td className="py-2 px-3 text-right text-gray-600">₹{req.budgetPerUnit || 0}</td>
                      <td className="py-2 px-3 text-right font-bold text-gray-900">
                        ₹{((Number(req.quantity) || 1) * (Number(req.budgetPerUnit) || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Policy Clauses & Verification Stamp */}
          <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-[10px] text-gray-500 max-w-sm">
              <p>• Partial advance is applied strictly to raw material procurement and sample cutting.</p>
              <p>• Balance amount payable upon physical delivery and verification of consignment.</p>
              <p>• Audited through Bookvardi Institutional Procurement Escrow System.</p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-center">
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
              <div>
                <p className="font-extrabold text-[11px] text-emerald-950 uppercase tracking-wider">Bookvardi Verified Voucher</p>
                <p className="text-[10px] text-emerald-700">Audit Hash: BV-ADV-{refId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>)}
      </div>
    </div>
  );
}