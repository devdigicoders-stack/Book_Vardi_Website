import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { cancelOrderApi } from '../../utils/api';

export default function CancelOrderModal({ isOpen, onClose, order, onSuccess }) {
  if (!isOpen || !order) return null;

  const orderId = order.id || order.orderId || order._id;
  const userPhone = order.customer?.phone || order.shippingAddress?.phone || '';

  const [selectedReason, setSelectedReason] = useState('Ordered by mistake');
  const [customComment, setCustomComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const cancellationReasons = [
    'Ordered by mistake',
    'Found better price elsewhere',
    'Delivery taking too long',
    'Incorrect shipping address or recipient info',
    'Need to change items, size, or payment method',
    'Other reason'
  ];

  const handleConfirmCancel = async () => {
    setLoading(true);
    setErrorMsg('');

    const finalReason = selectedReason === 'Other reason' && customComment.trim()
      ? customComment.trim()
      : selectedReason;

    try {
      const res = await cancelOrderApi(orderId, finalReason, userPhone);
      setLoading(false);
      if (res && (res.success || res.order)) {
        if (onSuccess) onSuccess(res.order || { ...order, status: 'cancelled', overallStatus: 'cancelled' });
        onClose();
      } else {
        setErrorMsg(res?.message || 'Failed to cancel order. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      // Fallback for offline / direct state update
      if (onSuccess) onSuccess({ ...order, status: 'cancelled', overallStatus: 'cancelled' });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-white">
                Cancel Order #{orderId}
              </h3>
              <p className="text-xs text-red-100 font-medium">
                Total Value: <strong>₹{order.total || order.totalAmount || 0}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-red-100 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-gray-800">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              Are you sure you want to cancel this order? Once cancelled, item inventory stock will be restored and any online payment will be refunded to your original payment mode within 3-5 business days.
            </p>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-2">
              Select Reason for Cancellation
            </label>
            <div className="space-y-2">
              {cancellationReasons.map((reason) => (
                <label
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedReason === reason
                      ? 'border-red-500 bg-red-50/50 text-red-950 font-bold shadow-2xs'
                      : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xs">{reason}</span>
                  <input
                    type="radio"
                    name="cancellationReason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-red-600 w-4 h-4 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          {selectedReason === 'Other reason' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Please specify details:
              </label>
              <textarea
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                placeholder="Explain why you wish to cancel this order..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Cancelling Order...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Confirm Cancellation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
