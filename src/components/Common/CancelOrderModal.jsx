import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, Loader2, ShieldAlert, CreditCard, Building2, ArrowRight } from 'lucide-react';
import { cancelOrderApi } from '../../utils/api';

export default function CancelOrderModal({ isOpen, onClose, order, onSuccess }) {
  if (!isOpen || !order) return null;

  const orderId = order.id || order.orderId || order._id;
  const userPhone = order.customer?.phone || order.shippingAddress?.phone || '';
  const isCod = /cod|cash\s*on\s*delivery/i.test(String(order.paymentMethod || ''));
  const isPaid = (String(order.paymentStatus || '').toLowerCase() === 'paid') || (!isCod && order.paymentStatus !== 'pending' && order.paymentStatus !== 'unpaid');

  const [step, setStep] = useState(1); // Step 1: Reason, Step 2: Refund Details (if paid)
  const [selectedReason, setSelectedReason] = useState('Ordered by mistake');
  const [customComment, setCustomComment] = useState('');
  
  // Refund receiving details state
  const [refundMethod, setRefundMethod] = useState('UPI'); // 'UPI' | 'BANK'
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

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

  const validateReason = () => {
    if (!selectedReason) {
      setErrorMsg('Please select a cancellation reason.');
      return false;
    }
    if (selectedReason === 'Other reason' && !customComment.trim()) {
      setErrorMsg('Please specify details for your cancellation reason.');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (!validateReason()) return;

    if (isPaid && step === 1) {
      setStep(2);
      return;
    }
    handleConfirmCancel();
  };

  const handleConfirmCancel = async () => {
    setLoading(true);
    setErrorMsg('');

    if (!validateReason()) {
      setLoading(false);
      return;
    }

    const finalReason = selectedReason === 'Other reason' && customComment.trim()
      ? customComment.trim()
      : selectedReason;

    let refundDetailsPayload = null;
    if (isPaid) {
      if (refundMethod === 'UPI') {
        if (!upiId.trim() || !upiId.includes('@')) {
          setLoading(false);
          setErrorMsg('Please enter a valid UPI ID (e.g., username@bank)');
          return;
        }
        refundDetailsPayload = {
          method: 'UPI',
          upiId: upiId.trim()
        };
      } else {
        if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim() || !accountHolderName.trim()) {
          setLoading(false);
          setErrorMsg('Please fill in all Bank Account details (Bank Name, Account Number, IFSC, and Holder Name)');
          return;
        }
        refundDetailsPayload = {
          method: 'BANK',
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          accountHolderName: accountHolderName.trim()
        };
      }
    }

    const payload = {
      reason: finalReason,
      refundDetails: refundDetailsPayload
    };

    try {
      const res = await cancelOrderApi(orderId, payload, userPhone);
      setLoading(false);
      if (res && (res.success || res.order)) {
        if (onSuccess) onSuccess(res.order || { ...order, status: 'cancelled', overallStatus: 'cancelled' });
        onClose();
      } else {
        setErrorMsg(res?.message || 'Failed to cancel order. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      if (onSuccess) onSuccess({ ...order, status: 'cancelled', overallStatus: 'cancelled' });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-white">
                Cancel Order #{orderId} {isPaid && `(Step ${step} of 2)`}
              </h3>
              <p className="text-xs text-red-100 font-medium">
                Total Amount: <strong>₹{order.total || order.totalAmount || 0}</strong> • {isPaid ? 'Prepaid / Online Paid' : 'Cash on Delivery'}
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
        <div className="p-6 space-y-5 text-xs text-gray-800 overflow-y-auto">
          
          {step === 1 && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  {isPaid ? (
                    <span>Are you sure you want to cancel? Since this order is <strong>already paid</strong>, you will be prompted in the next step to enter your receiving UPI or Bank details for refund processing.</span>
                  ) : (
                    <span>Are you sure you want to cancel this order? Item inventory stock will be restored immediately.</span>
                  )}
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
            </>
          )}

          {step === 2 && isPaid && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950">
                <h4 className="font-extrabold text-xs text-emerald-900 flex items-center gap-2 mb-1">
                  <CreditCard size={16} />
                  Refund Receiving Account Details
                </h4>
                <p className="text-xs text-emerald-800">
                  Please provide your preferred payout mode (UPI ID or Bank Account) where your refund of <strong>₹{order.total || order.totalAmount || 0}</strong> will be credited upon approval.
                </p>
              </div>

              {/* Mode Selection Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRefundMethod('UPI')}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    refundMethod === 'UPI' ? 'bg-white text-red-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CreditCard size={14} />
                  <span>1. UPI ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMethod('BANK')}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    refundMethod === 'BANK' ? 'bg-white text-red-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Building2 size={14} />
                  <span>2. Bank Transfer</span>
                </button>
              </div>

              {refundMethod === 'UPI' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Receiving UPI ID *
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. 9876543210@upi or username@okicici"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-mono focus:outline-none focus:border-red-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Double check your UPI ID to avoid payment delays.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Bank Name *</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">IFSC Code *</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        placeholder="e.g. HDFC0001234"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-mono uppercase focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Bank Account Number *</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className="px-3.5 py-2 text-gray-600 hover:text-gray-900 font-bold text-xs cursor-pointer"
            >
              ← Back to Reason
            </button>
          ) : <span />}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Keep Order
            </button>

            {isPaid && step === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>Next: Refund Account</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Confirm Cancellation</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

