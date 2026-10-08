import React, { useState, useEffect } from 'react';
import { X, RotateCcw, ArrowRightLeft, CheckCircle2, Loader2, Calendar, ShieldCheck, CreditCard, Building2, AlertCircle, Sparkles } from 'lucide-react';
import { requestReturnExchangeApi, fetchProductByIdFromBackend } from '../../utils/api';
import {
  isItemReturnable,
  isItemExchangeable,
  isItemUnstitched,
  getCategoryReplacementOptions,
  getItemCategoryType,
  formatSizeLabel,
  DEFECT_REPLACEMENT_VARIANT
} from '../../utils/orderReturnPolicy';

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
  const [fetchedProduct, setFetchedProduct] = useState(null);
  const isReturnable = isItemReturnable(activeItem);
  const isExchangeable = isItemExchangeable(activeItem);
  const isUnstitched = isItemUnstitched(activeItem) || isItemUnstitched(fetchedProduct);

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

  const isFabricItem = Boolean(isUnstitched);
  const currentQuantity = Number(activeItem.quantity || 1);
  const ratePerMeter = Number(activeItem.price || (activeItem.total / (currentQuantity || 1)) || 0);

  // Category Configuration and Tabs
  const replacementOptionsConfig = getCategoryReplacementOptions(activeItem, fetchedProduct);
  const catType = replacementOptionsConfig.categoryType;
  const [activeSubTab, setActiveSubTab] = useState(() => replacementOptionsConfig.primaryTab);

  useEffect(() => {
    if (replacementOptionsConfig.primaryTab) {
      setActiveSubTab(replacementOptionsConfig.primaryTab);
    }
  }, [replacementOptionsConfig.primaryTab, selectedItemId]);

  const [reason, setReason] = useState(() => isFabricItem ? 'Need longer fabric length' : 'Size too small / large');
  const [comment, setComment] = useState('');
  const [exchangeSize, setExchangeSize] = useState(() => activeItem.size || '');
  const [exchangeLength, setExchangeLength] = useState(() => currentQuantity);
  const [refundMethod, setRefundMethod] = useState('UPI / Bank Transfer');

  useEffect(() => {
    if (isFabricItem) {
      const q = Number(activeItem.quantity || 1);
      setExchangeLength(q);
      if (activeType === 'exchange') {
        setReason('Need longer fabric length');
      }
    }
  }, [activeItem, isFabricItem, activeType]);

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

  // Reasons per category
  const returnReasons = [
    'Size too small / large',
    'Defective or damaged product received',
    'Wrong item / size delivered',
    'Quality not as expected',
    'Don\'t need item anymore'
  ];

  const fabricExchangeReasons = [
    'Need longer fabric length',
    'Need shorter fabric length',
    'Defective or damaged fabric piece received',
    'Wrong fabric cut delivered',
    'Prefer different color / print variant'
  ];

  const footwearExchangeReasons = [
    'Need larger shoe size',
    'Need smaller shoe size',
    'Shoe fitting too tight / narrow',
    'Shoe fitting too loose',
    'Damaged / defective pair received',
    'Wrong shoe size delivered'
  ];

  const notebookExchangeReasons = [
    'Wrong notebook ruling delivered (need different line pattern)',
    'Need different pack size / quantity',
    'Damaged / torn pages / defective item replacement',
    'Wrong size / type notebook delivered'
  ];

  const bookExchangeReasons = [
    'Wrong class / edition book received',
    'Damaged / torn / misprinted pages replacement',
    'Wrong subject / title delivered',
    'Prefer different syllabus edition'
  ];

  const stationeryGeneralReasons = [
    'Defective or broken item received',
    'Need different pack size / quantity',
    'Wrong color / variant delivered',
    'Damaged product replacement'
  ];

  const apparelExchangeReasons = [
    'Need larger size (fitting too tight)',
    'Need smaller size (fitting too loose)',
    'Sleeve / pant length inappropriate',
    'Defective stitching / torn garment',
    'Wrong size delivered'
  ];

  const standardExchangeReasons = [
    'Need larger size',
    'Need smaller size',
    'Damaged item replacement',
    'Prefer different color / variant'
  ];

  const exchangeReasons = (() => {
    if (catType === 'unstitched') return fabricExchangeReasons;
    if (catType === 'footwear') return footwearExchangeReasons;
    if (catType === 'stationery_notebook') return notebookExchangeReasons;
    if (catType === 'book') return bookExchangeReasons;
    if (catType === 'stationery_general') return stationeryGeneralReasons;
    if (catType === 'apparel_bottom' || catType === 'apparel_top') return apparelExchangeReasons;
    return standardExchangeReasons;
  })();

  useEffect(() => {
    if (activeType === 'exchange') {
      if (catType === 'unstitched') {
        setReason('Need longer fabric length');
      } else if (catType === 'footwear') {
        setReason('Need larger shoe size');
      } else if (catType === 'stationery_notebook') {
        setReason('Wrong notebook ruling delivered (need different line pattern)');
      } else if (catType === 'book') {
        setReason('Wrong class / edition book received');
      } else if (catType === 'stationery_general') {
        setReason('Defective or broken item received');
      } else if (catType === 'apparel_bottom' || catType === 'apparel_top') {
        setReason('Need larger size (fitting too tight)');
      } else {
        setReason('Need larger size');
      }
    }
  }, [catType, activeType, selectedItemId]);

  const productVariants = replacementOptionsConfig.productVariants || [];
  const currentTabObj = replacementOptionsConfig.tabs.find(t => t.id === activeSubTab) || replacementOptionsConfig.tabs[0];
  const activeTabOptions = currentTabObj?.options || [];

  useEffect(() => {
    if (!isFabricItem && activeTabOptions.length > 0) {
      const isCurrentInAvailable = activeTabOptions.some(s => String(s).trim().toUpperCase() === String(exchangeSize).trim().toUpperCase());
      if (!exchangeSize || !isCurrentInAvailable) {
        // Automatically default to the first size that is different from current item size
        const alt = activeTabOptions.find(s => String(s).trim().toUpperCase() !== String(activeItem.size || '').trim().toUpperCase());
        setExchangeSize(alt || activeTabOptions[0]);
      }
    }
  }, [activeTabOptions, activeItem.size, isFabricItem]);

  // Price calculations
  const originalPrice = isFabricItem
    ? Math.round(currentQuantity * ratePerMeter * 100) / 100
    : Number(activeItem.price || activeItem.finalPrice || 0);

  const matchingVariant = productVariants.find(v => String(v.size || v.measureValue).toUpperCase() === String(exchangeSize).toUpperCase());
  
  const replacementPrice = isFabricItem
    ? Math.round(Number(exchangeLength || currentQuantity) * ratePerMeter * 100) / 100
    : (matchingVariant ? Number(matchingVariant.price || matchingVariant.mrp || originalPrice) : originalPrice);

  const priceDifference = Math.round((replacementPrice - originalPrice) * 100) / 100;
  const priceAdjustmentType = priceDifference > 0 ? 'extra_payment' : priceDifference < 0 ? 'partial_refund' : 'none';

  const handleSubmit = async () => {
    if (activeType === 'return' && !isReturnable) {
      setErrorMsg('This item is not eligible for return/refund.');
      return;
    }
    if (activeType === 'exchange') {
      if (!isExchangeable) {
        setErrorMsg('This item is not eligible for exchange.');
        return;
      }
      if (isFabricItem) {
        const numLen = Number(exchangeLength);
        if (isNaN(numLen) || numLen <= 0) {
          setErrorMsg('Please specify a valid fabric replacement length (minimum 0.5 meters).');
          return;
        }
        if (numLen === currentQuantity && (reason === 'Need longer fabric length' || reason === 'Need shorter fabric length')) {
          setErrorMsg('Please select a different fabric length than your current purchase cut.');
          return;
        }
      } else {
        if (!exchangeSize) {
          setErrorMsg('Please select a replacement size or variant option.');
          return;
        }
        const isDefectChoice = exchangeSize === DEFECT_REPLACEMENT_VARIANT || reason.toLowerCase().includes('damage') || reason.toLowerCase().includes('defect') || reason.toLowerCase().includes('misprint');
        if (!isDefectChoice && String(exchangeSize).trim().toUpperCase() === String(activeItem.size || '').trim().toUpperCase()) {
          setErrorMsg('Please select a different replacement option than your current item, or select Damaged Item Replacement.');
          return;
        }
      }
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
      exchangeSize: activeType === 'exchange' ? (isFabricItem ? `${exchangeLength} Meter(s)` : exchangeSize) : '',
      exchangeLength: (activeType === 'exchange' && isFabricItem) ? Number(exchangeLength) : undefined,
      isMeterBased: isFabricItem,
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

  const exchangeTypeTitle = isFabricItem
    ? 'Exchange Length'
    : (catType.includes('stationery') || catType === 'book')
    ? 'Exchange Variant'
    : 'Exchange Size';

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
                {activeType === 'return' ? 'Return Item' : exchangeTypeTitle} — Order #{orderId}
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
                setReason(isFabricItem ? 'Need longer fabric length' : 'Need larger size');
              }}
              className={`py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isExchangeable
                  ? 'opacity-50 cursor-not-allowed text-gray-400 bg-gray-200'
                  : activeType === 'exchange'
                  ? 'bg-white text-brand-teal shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={!isExchangeable ? 'Not eligible for exchange' : ''}
            >
              <ArrowRightLeft size={14} />
              <span>2. {exchangeTypeTitle} {!isExchangeable && '(Not Eligible)'}</span>
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
                    Qty: {Number(activeItem.quantity || 1).toFixed(isFabricItem ? 2 : 0)}{isFabricItem ? 'm' : ''} {activeItem.size ? `• Size: ${formatSizeLabel(activeItem.size)}` : ''} • ₹{Number(activeItem.price || 0).toFixed(2)} each
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

          {/* Unstitched Fabric Policy Banner */}
          {isFabricItem && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-900 text-xs flex items-center gap-2.5">
              <span className="text-lg shrink-0">✂️</span>
              <div>
                <strong className="font-extrabold text-amber-950">Unstitched Fabric Exchange Policy:</strong>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  This fabric product is sold per meter. You can request an exchange for a longer or shorter fabric cut length or replace a damaged piece. Any difference in fabric length is automatically calculated.
                </p>
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

          {/* If Exchange: Select Replacement Size or Fabric Length & Price Adjustment */}
          {activeType === 'exchange' && (
            <div className="space-y-3">
              {isFabricItem ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                      Select Required Replacement Length (in Meters) *
                    </label>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Current Cut: <strong className="text-gray-800 font-mono">{currentQuantity.toFixed(2)}m</strong>
                    </span>
                  </div>

                  <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">Fabric Rate:</span>
                      <span className="text-xs font-mono font-extrabold text-teal-800">₹{ratePerMeter.toFixed(2)} / meter</span>
                    </div>

                    {/* Stepper + Input */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setExchangeLength(prev => Math.max(0.5, Math.round((Number(prev || 1) - 0.5) * 10) / 10))}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-300 hover:border-brand-teal text-gray-800 font-bold text-lg flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        -
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          step="0.25"
                          min="0.5"
                          max="50"
                          value={exchangeLength}
                          onChange={(e) => setExchangeLength(parseFloat(e.target.value) || '')}
                          className="w-full bg-white border border-gray-300 rounded-xl py-2 px-3 text-center text-sm font-extrabold text-gray-900 font-mono focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">Meters</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExchangeLength(prev => Math.round((Number(prev || 1) + 0.5) * 10) / 10)}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-300 hover:border-brand-teal text-gray-800 font-bold text-lg flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Quick Presets:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setExchangeLength(preset)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              Number(exchangeLength) === preset
                                ? 'bg-brand-teal text-white border-brand-teal shadow-xs'
                                : Number(currentQuantity) === preset
                                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:border-brand-teal'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-brand-teal'
                            }`}
                          >
                            {preset.toFixed(1)}m {Number(currentQuantity) === preset && '(Current)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Category-Tailored Replacement Option Selector */
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                      {catType === 'footwear'
                        ? 'Select Required Replacement Shoe Size *'
                        : catType === 'apparel_bottom'
                        ? 'Select Required Replacement Waist / Size *'
                        : catType === 'apparel_top'
                        ? 'Select Required Replacement Garment Size *'
                        : catType === 'stationery_notebook'
                        ? 'Select Required Notebook Replacement Option *'
                        : catType === 'book'
                        ? 'Select Required Book / Syllabus Class Variant *'
                        : catType === 'stationery_general'
                        ? 'Select Required Stationery Pack / Variant *'
                        : 'Select Required Replacement Size / Variant *'}
                    </label>
                    {activeItem.size && (
                      <span className="text-[11px] text-gray-500 font-medium">
                        Current: <strong className="text-gray-800 font-mono">{formatSizeLabel(activeItem.size)}</strong>
                      </span>
                    )}
                  </div>

                  {/* Multi-Tab Selector if Category has segmentation (e.g. Kids vs Adult Footwear, or Ruling vs Pack) */}
                  {replacementOptionsConfig.tabs.length > 1 && (
                    <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl overflow-x-auto mb-3">
                      {replacementOptionsConfig.tabs.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setActiveSubTab(t.id);
                            if (t.options && t.options.length > 0 && !t.options.includes(exchangeSize)) {
                              const alt = t.options.find(opt => String(opt).toLowerCase() !== String(activeItem.size || '').toLowerCase()) || t.options[0];
                              setExchangeSize(alt);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                            activeSubTab === t.id
                              ? 'bg-white text-brand-teal shadow-xs'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Option Chips for Active Tab */}
                  {activeTabOptions.length === 0 ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-center text-xs text-gray-600">
                      No replacement variants available for this item. Please choose <strong>Return for Refund</strong>.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {activeTabOptions.map((sz) => {
                        const v = productVariants.find(item => String(item.size || item.measureValue).toUpperCase() === String(sz).toUpperCase());
                        const vPrice = v ? Number(v.price || v.mrp || originalPrice) : originalPrice;
                        const isSelected = String(exchangeSize).toUpperCase() === String(sz).toUpperCase();
                        const isCurrent = String(activeItem.size || '').toLowerCase().trim() === String(sz).toLowerCase().trim();
                        const isDefect = sz === DEFECT_REPLACEMENT_VARIANT;

                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              setExchangeSize(sz);
                              if (isDefect) {
                                if (catType === 'stationery_notebook' || catType === 'book') {
                                  setReason('Damaged / torn pages / defective item replacement');
                                } else {
                                  setReason('Damaged item replacement');
                                }
                              }
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isDefect
                                ? isSelected
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/40 w-full justify-center'
                                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:border-amber-500 w-full justify-center'
                                : isSelected
                                ? 'bg-brand-teal text-white border-brand-teal shadow-xs ring-2 ring-brand-teal/30'
                                : isCurrent
                                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:border-brand-teal'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-brand-teal'
                            }`}
                          >
                            <span>{formatSizeLabel(sz)}</span>
                            {isCurrent && !isDefect && (
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                              }`}>
                                Current
                              </span>
                            )}
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
                  )}
                </div>
              )}

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
                      Original: <strong>₹{originalPrice}</strong> ({isFabricItem ? `${currentQuantity}m` : (activeItem.size || 'Base')}) → Replacement: <strong>₹{replacementPrice}</strong> ({isFabricItem ? `${exchangeLength}m` : exchangeSize})
                    </p>
                    <p className="text-[11px] text-amber-700">
                      The extra ₹{priceDifference} will be requested upon exchange delivery.
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
                      Original: <strong>₹{originalPrice}</strong> ({isFabricItem ? `${currentQuantity}m` : (activeItem.size || 'Base')}) → Replacement: <strong>₹{replacementPrice}</strong> ({isFabricItem ? `${exchangeLength}m` : exchangeSize})
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
                      Original ({isFabricItem ? `${currentQuantity}m` : (activeItem.size || 'Base')} - ₹{originalPrice}) and Replacement ({isFabricItem ? `${exchangeLength}m` : exchangeSize} - ₹{replacementPrice}) have equal pricing. No extra charge or refund needed.
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
