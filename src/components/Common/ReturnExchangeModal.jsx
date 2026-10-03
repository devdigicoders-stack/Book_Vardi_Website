import React, { useState } from 'react';
import { X, RotateCcw, ArrowRightLeft, CheckCircle2, Loader2, Calendar, ShieldCheck, CreditCard, Building2 } from 'lucide-react';
import { requestReturnExchangeApi } from '../../utils/api';

export default function ReturnExchangeModal({ isOpen, onClose, order, onSuccess }) {
  if (!isOpen || !order) return null;

  const orderId = order.id || order.orderId || order._id;
  const userPhone = order.customer?.phone || order.shippingAddress?.phone || '';
  const orderItems = order.items || [];
  const firstItem = orderItems[0] || {};

  const getItemReturnable = (it) => {
    if (!it) return false;
    const policy = String(it.returnPolicy || it.product?.returnPolicy || '').toLowerCase().trim();
    if (policy === 'non_returnable' || policy === 'non-returnable' || policy === 'no_return') return false;
    if (it.isReturnable === false || it.product?.isReturnable === false) return false;
    return it.isReturnable ?? it.product?.isReturnable ?? true;
  };

  const getItemExchangeable = (it) => {
    if (!it) return false;
    const policy = String(it.returnPolicy || it.product?.returnPolicy || '').toLowerCase().trim();
    if (policy === 'non_returnable' || policy === 'non-returnable' || policy === 'no_return') return false;
    if (it.isExchangeable === false || it.product?.isExchangeable === false) return false;
    return it.isExchangeable ?? it.product?.isExchangeable ?? true;
  };

  const isReturnable = orderItems.length > 0 ? orderItems.some(getItemReturnable) : getItemReturnable(firstItem);
  const isExchangeable = orderItems.length > 0 ? orderItems.some(getItemExchangeable) : getItemExchangeable(firstItem);

  const [activeType, setActiveType] = useState(() => {
    if (!isReturnable && isExchangeable) return 'exchange';
    return 'return';
  });
  const [reason, setReason] = useState('Size too small / large');
  const [comment, setComment] = useState('');
  const [exchangeSize, setExchangeSize] = useState('M');
  const [refundMethod, setRefundMethod] = useState('UPI / Bank Transfer');

  // Refund payout details state for return
  const [payoutMode, setPayoutMode] = useState('UPI'); // 'UPI' | 'BANK'
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate return window till date
  const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.date || order.createdAt || Date.now());
  const returnWindowDays = firstItem.returnWindowDays || 7;
  const returnTillDate = new Date(deliveredDate.getTime() + returnWindowDays * 24 * 60 * 60 * 1000);
  const formattedTillDate = returnTillDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const returnReasons = [
    'Size too small / large',
    'Defective or damaged product received',
    'Wrong item / size delivered',
    'Quality not as expected',
    'Don\'t need item anymore'
  ];

  const exchangeReasons = [
    'Need larger size',
    'Need smaller size',
    'Damaged item replacement',
    'Prefer different color / variant'
  ];

  const availableSizes = ['24', '26', '28', '30', '32', '34', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleSubmit = async () => {
    if (activeType === 'return' && !isReturnable) {
      setErrorMsg('This item is not eligible for return/refund.');
      return;
    }
    if (activeType === 'exchange' && !isExchangeable) {
      setErrorMsg('This item is not eligible for exchange.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    let refundDetailsPayload = null;
    if (activeType === 'return') {
      if (payoutMode === 'UPI') {
        if (!upiId.trim() || !upiId.includes('@')) {
          setLoading(false);
          setErrorMsg('Please enter a valid UPI ID (e.g. username@bank)');
          return;
        }
        refundDetailsPayload = { method: 'UPI', upiId: upiId.trim() };
      } else {
        if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim() || !accountHolderName.trim()) {
          setLoading(false);
          setErrorMsg('Please enter complete Bank Details (Bank Name, Account Number, IFSC Code, Account Holder Name)');
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
      type: activeType,
      reason,
      comment,
      exchangeSize: activeType === 'exchange' ? exchangeSize : '',
      refundMethod: activeType === 'return' ? refundMethod : '',
      refundDetails: refundDetailsPayload
    };

    try {
      const res = await requestReturnExchangeApi(orderId, payload, userPhone);
      setLoading(false);
      if (res && (res.success || res.order)) {
        const newStatus = activeType === 'exchange' ? 'exchange_requested' : 'return_requested';
        try {
          localStorage.setItem('bv_order_sync_timestamp', Date.now().toString());
          window.dispatchEvent(new Event('bv_orders_updated'));
        } catch (e) {}
        if (onSuccess) onSuccess(res.order || { ...order, status: newStatus, overallStatus: newStatus });
        onClose();
      } else {
        setErrorMsg(res?.message || 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      const newStatus = activeType === 'exchange' ? 'exchange_requested' : 'return_requested';
      try {
        localStorage.setItem('bv_order_sync_timestamp', Date.now().toString());
        window.dispatchEvent(new Event('bv_orders_updated'));
      } catch (e) {}
      if (onSuccess) onSuccess({ ...order, status: newStatus, overallStatus: newStatus });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-brand-teal-dark text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow text-brand-teal-dark flex items-center justify-center font-bold shadow-sm">
              {activeType === 'return' ? <RotateCcw size={22} /> : <ArrowRightLeft size={22} />}
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-white">
                {activeType === 'return' ? 'Return Item' : 'Exchange Item'} — Order #{orderId}
              </h3>
              <p className="text-xs text-teal-200 flex items-center gap-1">
                <Calendar size={12} />
                Return/Exchange Window Valid Till: <strong className="text-white font-mono">{formattedTillDate}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-teal-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector Header */}
        {!isReturnable && !isExchangeable ? (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-center text-xs font-bold text-rose-800">
            ⚠️ This item is marked as non-returnable and non-exchangeable.
          </div>
        ) : (
          <div className="grid grid-cols-2 bg-gray-100 p-1.5 border-b border-gray-200 shrink-0">
            <button
              type="button"
              disabled={!isReturnable}
              onClick={() => {
                if (!isReturnable) return;
                setActiveType('return');
                setReason('Size too small / large');
              }}
              className={`py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isReturnable
                  ? 'opacity-50 cursor-not-allowed text-gray-400 bg-gray-200'
                  : activeType === 'return'
                  ? 'bg-white text-brand-teal shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <RotateCcw size={14} />
              <span>1. Return for Refund {!isReturnable && '(Not Eligible)'}</span>
            </button>
            <button
              type="button"
              disabled={!isExchangeable}
              onClick={() => {
                if (!isExchangeable) return;
                setActiveType('exchange');
                setReason('Need larger size');
              }}
              className={`py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isExchangeable
                  ? 'opacity-50 cursor-not-allowed text-gray-400 bg-gray-200'
                  : activeType === 'exchange'
                  ? 'bg-white text-brand-teal shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowRightLeft size={14} />
              <span>2. Exchange Size {!isExchangeable && '(Not Eligible)'}</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-800">
          {/* Policy Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-emerald-950">
            <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
            <div className="text-xs">
              <strong className="font-extrabold text-emerald-900">Easy {returnWindowDays}-Day Hassle-Free Policy</strong>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Our doorstep pickup executive will collect the item within 24-48 hours.
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-2">
              Reason for {activeType === 'return' ? 'Return' : 'Exchange'} *
            </label>
            <div className="space-y-2">
              {(activeType === 'return' ? returnReasons : exchangeReasons).map((r) => (
                <label
                  key={r}
                  onClick={() => setReason(r)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    reason === r
                      ? 'border-brand-teal bg-brand-teal/5 text-brand-teal font-bold shadow-2xs'
                      : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xs">{r}</span>
                  <input
                    type="radio"
                    name="returnReason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-brand-teal w-4 h-4 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* If Exchange: Select Replacement Size */}
          {activeType === 'exchange' && (
            <div>
              <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-2">
                Select Required Replacement Size
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setExchangeSize(sz)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      exchangeSize === sz
                        ? 'bg-brand-teal text-white border-brand-teal shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-brand-teal'
                    }`}
                  >
                    Size {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If Return: Receiving Payout Details */}
          {activeType === 'return' && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-1">
                  Receiving Refund Payout Account *
                </label>
                <p className="text-[11px] text-gray-500 mb-3">
                  Enter your UPI ID or Bank account details where your refund will be transferred once the product return is received.
                </p>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setPayoutMode('UPI')}
                    className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      payoutMode === 'UPI' ? 'bg-white text-brand-teal shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <CreditCard size={14} />
                    <span>UPI ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMode('BANK')}
                    className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      payoutMode === 'BANK' ? 'bg-white text-brand-teal shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Building2 size={14} />
                    <span>Bank Transfer</span>
                  </button>
                </div>

                {payoutMode === 'UPI' ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Receiving UPI ID *</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. username@upi or mobile@okaxis"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-mono focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Account Holder Name *</label>
                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="e.g. Anjali Sharma"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:border-brand-teal"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Bank Name *</label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. State Bank of India"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:border-brand-teal"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">IFSC Code *</label>
                        <input
                          type="text"
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value)}
                          placeholder="e.g. SBIN0001234"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-mono uppercase focus:outline-none focus:border-brand-teal"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Bank Account Number *</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter 9-18 digit account number"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-mono focus:outline-none focus:border-brand-teal"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Additional Comments / Instructions (Optional):
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add any specific instructions for pickup rider..."
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:border-brand-teal focus:bg-white transition-all"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">
            Free doorstep pickup from address
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Submit {activeType === 'return' ? 'Return' : 'Exchange'} Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

