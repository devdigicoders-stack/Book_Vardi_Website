import React, { useState, useEffect } from 'react';
import { X, RotateCcw, ArrowRightLeft, CheckCircle2, Loader2, Calendar, ShieldCheck, CreditCard, Building2, AlertCircle } from 'lucide-react';
import { requestReturnExchangeApi, fetchProductByIdFromBackend, trackAwbApi } from '../../utils/api';
import { isItemReturnable, isItemExchangeable } from '../../utils/orderReturnPolicy';

export default function ReturnExchangeModal({ isOpen, onClose, order, onSuccess }) {
  if (!isOpen || !order) return null;

  const orderId = order.id || order.orderId || order._id;
  const userPhone = order.customer?.phone || order.shippingAddress?.phone || '';
  const orderItems = order.items || [];
  const [selectedItemId, setSelectedItemId] = useState(() => {
    return order.selectedItem?._id || order.selectedItem?.id || orderItems[0]?._id || orderItems[0]?.id || null;
  });

  useEffect(() => {
    if (order.selectedItem) {
      setSelectedItemId(order.selectedItem._id || order.selectedItem.id);
    }
  }, [order.selectedItem]);

  const activeItem = orderItems.find(it => String(it._id || it.id) === String(selectedItemId)) || order.selectedItem || orderItems[0] || {};
  const isReturnable = isItemReturnable(activeItem);
  const isExchangeable = isItemExchangeable(activeItem);

  const [fetchedProduct, setFetchedProduct] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const prodId = activeItem.productId || activeItem.id;
    if (prodId) {
      fetchProductByIdFromBackend(prodId)
        .then((res) => {
          if (isMounted && res) {
            setFetchedProduct(res.product || res);
          }
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [activeItem.productId, activeItem.id]);

  const [activeType, setActiveType] = useState(() => {
    if (!isReturnable && isExchangeable) return 'exchange';
    return 'return';
  });

  useEffect(() => {
    if (!isReturnable && isExchangeable) {
      setActiveType('exchange');
    } else if (isReturnable && !isExchangeable) {
      setActiveType('return');
    }
  }, [isReturnable, isExchangeable]);

  const [reason, setReason] = useState('Size too small / large');
  const [comment, setComment] = useState('');
  const [exchangeSize, setExchangeSize] = useState(() => activeItem.size || 'M');
  const [refundMethod, setRefundMethod] = useState('UPI / Bank Transfer');

  // Refund payout details state for return / partial refund
  const [payoutMode, setPayoutMode] = useState('UPI'); // 'UPI' | 'BANK'
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate return window till date
  const deliveredDate = (() => {
    if (order.deliveredAt) return new Date(order.deliveredAt);
    if (order.deliveryDetails?.deliveredAt) return new Date(order.deliveryDetails.deliveredAt);
    const status = String(order.overallStatus || order.status || '').toLowerCase().trim();
    const isDelivered = ['delivered', 'completed', 'fulfilled', 'received'].includes(status);
    if (isDelivered) return new Date(order.updatedAt || Date.now());
    return new Date(order.date || order.createdAt || Date.now());
  })();
  const returnWindowDays = activeItem.returnWindowDays || activeItem.product?.returnWindowDays || 7;
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

  const productVariants = fetchedProduct?.sizeVariants || fetchedProduct?.variants || activeItem.sizeVariants || activeItem.variants || [];
  const availableSizes = productVariants.length > 0
    ? productVariants.map(v => v.size || v.measureValue).filter(Boolean)
    : (activeItem.size ? [activeItem.size, '24', '26', '28', '30', '32', '34', 'S', 'M', 'L', 'XL', 'XXL'] : ['24', '26', '28', '30', '32', '34', 'S', 'M', 'L', 'XL', 'XXL']);

  // Price calculations
  const originalPrice = Number(activeItem.price || activeItem.finalPrice || 0);
  const matchingVariant = productVariants.find(v => String(v.size || v.measureValue).toUpperCase() === String(exchangeSize).toUpperCase());
  const replacementPrice = matchingVariant ? Number(matchingVariant.price || matchingVariant.mrp || originalPrice) : originalPrice;
  const priceDifference = replacementPrice - originalPrice;
  const priceAdjustmentType = priceDifference > 0 ? 'extra_payment' : priceDifference < 0 ? 'partial_refund' : 'none';

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
    const isPayoutRequired = activeType === 'return' || (activeType === 'exchange' && priceAdjustmentType === 'partial_refund');
    if (isPayoutRequired) {
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
      itemId: activeItem._id || activeItem.id,
      itemName: activeItem.name,
      type: activeType,
      reason,
      comment,
      exchangeSize: activeType === 'exchange' ? exchangeSize : '',
      priceDifference: activeType === 'exchange' ? priceDifference : 0,
      priceAdjustmentType: activeType === 'exchange' ? priceAdjustmentType : 'none',
      originalItemPrice: originalPrice,
      replacementItemPrice: activeType === 'exchange' ? replacementPrice : originalPrice,
      refundMethod: isPayoutRequired ? refundMethod : '',
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
          {/* Order Item Selection if Multiple Items */}
          {orderItems.length > 1 && !order.selectedItem && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
                Select Item to Return / Exchange ({orderItems.length} items in order)
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {orderItems.map((it, idx) => {
                  const itId = it._id || it.id || idx;
                  const isSelected = String(itId) === String(selectedItemId);
                  return (
                    <button
                      key={itId}
                      type="button"
                      onClick={() => setSelectedItemId(itId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                        isSelected ? 'bg-brand-teal text-white border-brand-teal shadow-xs' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-brand-teal'
                      }`}
                    >
                      <span className="truncate max-w-[120px]">{it.name}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-teal-100' : 'text-gray-500'}`}>₹{it.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Target Item Card */}
          {activeItem && activeItem.name && (
            <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {activeItem.image ? (
                  <img src={activeItem.image} alt={activeItem.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 font-bold text-xs shrink-0">
                    BV
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 text-xs truncate">{activeItem.name}</h4>
                  <div className="text-[11px] text-gray-500 font-mono">
                    Qty: {Number(activeItem.quantity || 1).toFixed(2)} • ₹{Number(activeItem.price || 0).toFixed(2)} each
                  </div>
                  <div className="text-[10px] text-teal-800 font-semibold mt-0.5">
                    Sold by: {activeItem.storeName || activeItem.sellerName || 'Partner Merchant'}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-extrabold text-xs text-gray-900 font-mono">
                  ₹{(Number(activeItem.price || 0) * Number(activeItem.quantity || 1)).toFixed(2)}
                </span>
                <div className="text-[10px] font-bold text-emerald-800">
                  {isReturnable && isExchangeable ? 'Return & Exchange' : isReturnable ? 'Return Only' : isExchangeable ? 'Exchange Only' : 'Non-Returnable'}
                </div>
              </div>
            </div>
          )}

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

          {/* If Exchange: Select Replacement Size & Price Adjustment */}
          {activeType === 'exchange' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-2">
                  Select Required Replacement Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((sz) => {
                    const v = productVariants.find(item => String(item.size || item.measureValue).toUpperCase() === String(sz).toUpperCase());
                    const vPrice = v ? Number(v.price || v.mrp || originalPrice) : originalPrice;
                    const isSelected = exchangeSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setExchangeSize(sz)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-brand-teal text-white border-brand-teal shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-brand-teal'
                        }`}
                      >
                        <span>Size {sz}</span>
                        {vPrice !== originalPrice && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-white/20 text-white font-mono' : 'bg-gray-100 text-gray-600 font-mono'
                          }`}>
                            ₹{vPrice}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Breakdown Banner */}
              <div className="rounded-2xl border transition-all overflow-hidden">
                {priceAdjustmentType === 'extra_payment' && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-extrabold text-amber-950">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle size={15} className="text-amber-600" />
                        <span>Additional Payment Required</span>
                      </span>
                      <span className="text-amber-700 font-mono font-bold text-sm">+₹{priceDifference}</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Original item: <strong>₹{originalPrice}</strong> → Replacement Size ({exchangeSize}): <strong>₹{replacementPrice}</strong>
                    </p>
                    <p className="text-[11px] text-amber-700">
                      The seller / delivery agent will request the extra ₹{priceDifference} payment upon exchange fulfillment.
                    </p>
                  </div>
                )}

                {priceAdjustmentType === 'partial_refund' && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-extrabold text-emerald-950">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span>Partial Refund Owed to You</span>
                      </span>
                      <span className="text-emerald-700 font-mono font-bold text-sm">₹{Math.abs(priceDifference)} Refund</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Original item: <strong>₹{originalPrice}</strong> → Replacement Size ({exchangeSize}): <strong>₹{replacementPrice}</strong>
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      ₹{Math.abs(priceDifference)} will be refunded to your account. Please provide your receiving account details below.
                    </p>
                  </div>
                )}

                {priceAdjustmentType === 'none' && (
                  <div className="bg-blue-50/70 border border-blue-200 text-blue-900 p-3 space-y-0.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-blue-950">
                      <span>✅ Equal Price Exchange</span>
                      <span className="font-mono text-blue-700 font-bold">₹0 Price Diff</span>
                    </div>
                    <p className="text-[11px] text-blue-700">
                      Original item (₹{originalPrice}) and Replacement Size {exchangeSize} (₹{replacementPrice}) have equal pricing. No extra charge or refund needed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Receiving Payout Details (for Return OR Exchange with Partial Refund) */}
          {(activeType === 'return' || (activeType === 'exchange' && priceAdjustmentType === 'partial_refund')) && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-1">
                  {activeType === 'exchange' ? 'Receiving Partial Refund Account *' : 'Receiving Refund Payout Account *'}
                </label>
                <p className="text-[11px] text-gray-500 mb-3">
                  {activeType === 'exchange'
                    ? `Enter your UPI ID or Bank account details where your partial refund of ₹${Math.abs(priceDifference)} will be transferred.`
                    : 'Enter your UPI ID or Bank account details where your refund will be transferred once the product return is received.'}
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

