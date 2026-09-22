import React from 'react';
import { X, CheckCircle2, User, FileText, Calendar, DollarSign, Building2 } from 'lucide-react';

export default function BulkOrderPreviewModal({ order, onClose }) {
  if (!order) return null;

  const winningQuote = order.quotations?.find(q => q.status === 'approved' || String(q._id) === String(order.acceptedQuoteId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 font-display">Bulk Order Details</h2>
            <p className="text-sm text-gray-500 font-mono mt-1">Ref: {order.referenceId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* User's Original Version */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User size={16} /> Your Requirements (Original)
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 block mb-1">Institution</span>
                  <span className="font-bold text-gray-900">{order.institutionName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Target Budget (Per Kit)</span>
                  <span className="font-bold text-gray-900">₹{order.targetBudgetPerKit || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Total Quantity</span>
                  <span className="font-bold text-gray-900">{order.totalQuantity} Units</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Target Delivery</span>
                  <span className="font-bold text-gray-900">{order.targetDeliveryDate || 'N/A'}</span>
                </div>
              </div>
              
              {order.additionalNotes && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500 block mb-1">Requirements / Notes</span>
                  <p className="text-gray-800">{order.additionalNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Seller / Admin Quotation Update */}
          {winningQuote ? (
            <div>
              <h3 className="text-sm font-bold text-brand-teal uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} /> Approved Vendor Quotation
              </h3>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-emerald-700 block mb-1">Fulfilled By</span>
                    <span className="font-bold text-emerald-950 flex items-center gap-1">
                      <Building2 size={14}/> {winningQuote.sellerStoreName || winningQuote.sellerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block mb-1">Approved Amount</span>
                    <span className="font-bold text-emerald-950 text-lg">₹{Number(winningQuote.quoteAmount).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block mb-1">Est. Delivery</span>
                    <span className="font-bold text-emerald-950">{winningQuote.estimatedDeliveryDays || 7} Days</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block mb-1">Contact Details</span>
                    <span className="font-bold text-emerald-950">{winningQuote.sellerPhone}</span>
                  </div>
                </div>

                {winningQuote.notes && (
                  <div className="pt-2 border-t border-emerald-200/60">
                    <span className="text-emerald-700 block mb-1">Vendor Notes / Details</span>
                    <p className="text-emerald-900">{winningQuote.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={16} /> Vendor Quotation
              </h3>
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500 text-sm">
                No approved quotation yet. A vendor will update this soon.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
