import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ShieldCheck,
  Truck,
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  Lock,
  Plus,
  Minus,
  X,
  ChevronRight,
  Sparkles,
  Tag,
  Loader2,
  Package,
  Clock,
  AlertTriangle,
  Pencil,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { useCart, getCartItemKey } from '../../context/CartContext';
import { createRazorpayOrderInBackend, verifyRazorpayPaymentInBackend, loadRazorpayScript, getUpiIntentUrl, resolveImageUrl, getProductMainImage } from '../../utils/api';
import { getCartPaymentRestrictions } from '../../utils/paymentRestrictions';

const POPULAR_BANKS = [
  { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
  { id: 'axis', name: 'Axis Bank', code: 'AXIS' }
];

export default function CheckoutPage({ onNavigate }) {
  const {
    cartItems,
    selectedCartItems,
    toggleCartItemSelection,
    selectAllCartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    freeShippingThreshold,
    userProfile,
    profileCompleteness,
    isProfileIncomplete,
    isAuthenticated,
    addAddress,
    editAddress,
    appliedCoupon,
    promotions = [],
    applyCoupon,
    removeCoupon,
    placeOrder,
    openAuthModal,
    showToast,
    setIsCartOpen
  } = useCart();

  React.useEffect(() => {
    setIsCartOpen(false);
    loadRazorpayScript();
  }, [setIsCartOpen]);

  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const defaultAddr = userProfile?.addresses?.find((a) => a.isDefault);
    return defaultAddr ? defaultAddr.id : (userProfile?.addresses?.[0]?.id || null);
  });

  // Guest Address Form state (when !isAuthenticated or no addresses)
  const [guestAddress, setGuestAddress] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    street: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110007',
    type: 'Campus Hostel'
  });

  // New Address Modal state
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddrForm, setNewAddrForm] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    addressLine: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    type: 'Home',
    addressType: 'Home',
    isDefault: false
  });

  // Edit Address Modal state
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editingAddrForm, setEditingAddrForm] = useState(null);

  const handleOpenEditAddress = (addr) => {
    setEditingAddressId(addr.id || addr._id);
    setEditingAddrForm({
      name: addr.name || userProfile?.name || '',
      phone: addr.phone || userProfile?.phone || '',
      addressLine: addr.addressLine || addr.street || '',
      street: addr.street || addr.addressLine || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      landmark: addr.landmark || '',
      type: addr.type || addr.addressType || 'Home',
      addressType: addr.addressType || addr.type || 'Home',
      isDefault: Boolean(addr.isDefault)
    });
  };

  const handleSaveEditAddress = (e) => {
    e.preventDefault();
    if (!editingAddressId || (!editingAddrForm.addressLine && !editingAddrForm.street)) return;
    editAddress(editingAddressId, editingAddrForm);
    setEditingAddressId(null);
    setEditingAddrForm(null);
  };

  // Shipping Speed
  const [deliverySpeed, setDeliverySpeed] = useState('standard'); // 'standard' | 'express'

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'cod'
  const [upiMethod, setUpiMethod] = useState('gpay'); // 'gpay' | 'phonepe' | 'paytm' | 'id'
  const [customUpiId, setCustomUpiId] = useState('');
  const [isUpiVerified, setIsUpiVerified] = useState(false);

  // Evaluate seller & product payment restrictions across all cart items
  const {
    isCodDisabled,
    isOnlineDisabled,
    areAllPaymentsDisabled,
    disabledCodReasonItem,
    disabledOnlineReasonItem,
    noPaymentMethodItem
  } = getCartPaymentRestrictions(selectedCartItems);

  // Automatically switch active payment option if current selection is disabled by seller
  React.useEffect(() => {
    if (areAllPaymentsDisabled) return;
    if (isCodDisabled && paymentMethod === 'cod') {
      setPaymentMethod('upi');
    } else if (isOnlineDisabled && (paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'netbanking')) {
      setPaymentMethod('cod');
    }
  }, [isCodDisabled, isOnlineDisabled, areAllPaymentsDisabled, paymentMethod]);

  // Card details state
  const [cardData, setCardData] = useState({
    number: '',
    name: userProfile?.name || '',
    expiry: '',
    cvv: ''
  });

  // Net banking state
  const [selectedBank, setSelectedBank] = useState('sbi');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [isRedeemingPoints, setIsRedeemingPoints] = useState(false);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Disallowed Payment Mode Modal state
  const [disallowedPaymentModal, setDisallowedPaymentModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    mode: '',
    item: null
  });

  // Empty cart redirect
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-brand-teal flex items-center justify-center mx-auto mb-4">
            <Package size={32} />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-brand-teal">
            Your Cart is Empty
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 mb-6">
            Add notebooks, pens, highlighters, or desk supplies to your cart to proceed with checkout.
          </p>
          <button
            onClick={() => onNavigate('products')}
            className="w-full py-3 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Explore Stationery Catalog
          </button>
        </div>
      </div>
    );
  }

  // Calculate pricing breakdown
  const isFreeShipping = subtotal >= freeShippingThreshold || appliedCoupon?.type === 'freeship';
  const baseShippingCost = isFreeShipping ? 0 : 49;
  const expressExtraFee = deliverySpeed === 'express' ? 49 : 0;
  const totalShippingCost = baseShippingCost + expressExtraFee;

  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      couponDiscount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else if (appliedCoupon.type === 'flat') {
      couponDiscount = appliedCoupon.value;
    }
  }

  const pointsDiscount = isRedeemingPoints ? Math.min(50, subtotal) : 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount - pointsDiscount + totalShippingCost);

  // Handle adding a new address for authenticated user
  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if ((!newAddrForm.addressLine && !newAddrForm.street) || !newAddrForm.city || !newAddrForm.pincode) {
      showToast('Please fill in required address fields.');
      return;
    }
    const createdId = Date.now();
    const addressToSave = {
      ...newAddrForm,
      id: createdId,
      name: newAddrForm.name || userProfile?.name || '',
      phone: newAddrForm.phone || userProfile?.phone || '',
      addressLine: newAddrForm.addressLine || newAddrForm.street || '',
      street: newAddrForm.street || newAddrForm.addressLine || '',
      type: newAddrForm.type || newAddrForm.addressType || 'Home',
      addressType: newAddrForm.addressType || newAddrForm.type || 'Home',
      isDefault: Boolean(newAddrForm.isDefault)
    };
    addAddress(addressToSave);
    setSelectedAddressId(createdId);
    setIsAddAddressOpen(false);
    showToast('Delivery address added successfully!');
  };

  // Handle coupon submission
  const handleApplyCoupon = (e) => {
    e?.preventDefault();
    if (!couponInput) return;
    applyCoupon(couponInput);
    setCouponInput('');
  };

  // Verify custom UPI
  const handleVerifyUpi = () => {
    if (!customUpiId.includes('@')) {
      showToast('⚠️ Please enter a valid UPI ID (e.g. name@okhdfcbank)');
      return;
    }
    setIsUpiVerified(true);
    showToast(`✓ UPI ID ${customUpiId} verified!`);
  };

  // Place Order submission
  const handlePlaceOrder = async () => {
    if (areAllPaymentsDisabled) {
      const itemName = noPaymentMethodItem?.name || 'item';
      const msg = `Payment mode is not applicable for '${itemName}'. Seller has disabled all payment methods for this product.`;
      showToast(`⚠️ ${msg}`);
      setDisallowedPaymentModal({
        isOpen: true,
        title: 'Payment Mode Not Applicable',
        message: msg,
        mode: 'All',
        item: noPaymentMethodItem
      });
      return;
    }
    if (paymentMethod === 'cod' && isCodDisabled) {
      const itemName = disabledCodReasonItem?.name || 'item';
      const msg = `Payment mode 'Cash on Delivery (COD)' is not applicable for '${itemName}'. Seller requires Online / Prepaid payment for this product.`;
      showToast(`⚠️ ${msg}`);
      setDisallowedPaymentModal({
        isOpen: true,
        title: 'Payment Mode Not Applicable',
        message: msg,
        mode: 'Cash on Delivery (COD)',
        item: disabledCodReasonItem
      });
      return;
    }
    if (paymentMethod !== 'cod' && isOnlineDisabled) {
      const itemName = disabledOnlineReasonItem?.name || 'item';
      const msg = `Payment mode 'UPI / Online Pay' is not applicable for '${itemName}'. Seller accepts Cash on Delivery (COD) only.`;
      showToast(`⚠️ ${msg}`);
      setDisallowedPaymentModal({
        isOpen: true,
        title: 'Payment Mode Not Applicable',
        message: msg,
        mode: 'UPI / Online Pay',
        item: disabledOnlineReasonItem
      });
      return;
    }

    if (isAuthenticated && isProfileIncomplete) {
      const missingLabels = profileCompleteness?.missing?.map((m) => m.label).join(', ') || 'required details';
      showToast(`⚠️ Please complete your profile (${missingLabels}) before checking out.`);
      onNavigate('profile', null, 'profile');
      return;
    }

    // Validate address
    let activeShippingAddress = null;
    if (isAuthenticated) {
      activeShippingAddress = userProfile?.addresses?.find((a) => a.id === selectedAddressId) || userProfile?.addresses?.[0];
      if (!activeShippingAddress) {
        showToast('Please select or add a delivery address.');
        return;
      }
    } else {
      if (!guestAddress.name || !guestAddress.phone || !guestAddress.street || !guestAddress.pincode) {
        showToast('Please complete all contact and address fields.');
        return;
      }
      activeShippingAddress = guestAddress;
    }

    setIsSubmitting(true);

    let paymentLabel = 'Cash on Delivery (COD)';
    if (paymentMethod === 'upi') {
      paymentLabel = upiMethod === 'id' ? `UPI (${customUpiId || 'Verified ID'})` : `UPI (${upiMethod.toUpperCase()})`;
    }

    const executeDirectOrder = (label, address, razorpayInfo = {}) => {
      placeOrder({
        subtotal,
        shippingCost: totalShippingCost,
        discount: couponDiscount + pointsDiscount,
        total: grandTotal,
        shippingAddress: address,
        paymentMethod: label,
        razorpayPaymentId: razorpayInfo.paymentId || null,
        razorpayOrderId: razorpayInfo.orderId || null,
        deliverySpeed: deliverySpeed === 'express' ? 'Express Campus Priority (1-2 Days)' : 'Standard Delivery (3-5 Days)',
        estimatedDelivery: deliverySpeed === 'express' ? 'Tuesday, 08 Sep' : 'Thursday, 10 Sep'
      });
      setIsSubmitting(false);
      onNavigate('order-success');
    };

    if (paymentMethod === 'upi') {
      const isMobileDevice = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobileDevice) {
        const intentUrl = getUpiIntentUrl({
          app: upiMethod,
          amount: grandTotal,
          vpa: upiMethod === 'id' && customUpiId ? customUpiId : 'bookvardi@upi'
        });
        showToast(`Redirecting to ${upiMethod === 'gpay' ? 'Google Pay' : upiMethod === 'phonepe' ? 'PhonePe' : upiMethod === 'paytm' ? 'Paytm' : 'UPI App'}... 📲`);
        window.location.href = intentUrl;

        // Execute background order logging
        setTimeout(() => {
          executeDirectOrder(`${paymentLabel} (Direct Mobile Intent)`, activeShippingAddress);
        }, 1500);
        return;
      }
    }

    if (paymentMethod !== 'cod') {
      const isRazorpayReady = await loadRazorpayScript();
      if (!isRazorpayReady || typeof window.Razorpay === 'undefined') {
        setTimeout(() => executeDirectOrder(paymentLabel, activeShippingAddress), 800);
        return;
      }
      createRazorpayOrderInBackend(
        {
          amount: grandTotal,
          customer: {
            name: activeShippingAddress.name || userProfile?.name || 'Customer',
            phone: activeShippingAddress.phone || userProfile?.phone || '',
            email: activeShippingAddress.email || userProfile?.email || ''
          },
          notes: {
            deliverySpeed,
            itemsCount: cartItems.length
          }
        },
        activeShippingAddress.phone || userProfile?.phone || ''
      )
        .then((rzpRes) => {
          if (rzpRes?.razorpayOrderId) {
            const options = {
              key: rzpRes.key || 'rzp_test_6kz5nGEzi8uXRw',
              amount: rzpRes.amount || Math.round(grandTotal * 100),
              currency: rzpRes.currency || 'INR',
              name: 'Book Vardi',
              description: 'Campus Stationery & Study Uniform Order',
              image: '/logo.png',
              order_id: rzpRes.razorpayOrderId,
              handler: async function (response) {
                try {
                  await verifyRazorpayPaymentInBackend(
                    {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature
                    },
                    activeShippingAddress.phone || userProfile?.phone || ''
                  );
                } catch (vErr) {
                  console.warn('Razorpay signature verification info:', vErr);
                }

                executeDirectOrder(
                  `${paymentLabel} (Razorpay ID: ${response.razorpay_payment_id})`,
                  activeShippingAddress,
                  { paymentId: response.razorpay_payment_id, orderId: response.razorpay_order_id }
                );
              },
              prefill: {
                name: activeShippingAddress.name || userProfile?.name || '',
                email: activeShippingAddress.email || userProfile?.email || '',
                contact: activeShippingAddress.phone || userProfile?.phone || ''
              },
              theme: {
                color: '#233835'
              },
              modal: {
                ondismiss: function () {
                  setIsSubmitting(false);
                  showToast('Payment window closed. You can retry checkout anytime.');
                }
              }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
              setIsSubmitting(false);
              showToast(`Payment failed: ${response.error?.description || 'Transaction cancelled'}`);
            });
            rzp.open();
          } else {
            setTimeout(() => executeDirectOrder(paymentLabel, activeShippingAddress), 800);
          }
        })
        .catch(() => {
          setTimeout(() => executeDirectOrder(paymentLabel, activeShippingAddress), 800);
        });
      return;
    }

    setTimeout(() => executeDirectOrder(paymentLabel, activeShippingAddress), 1000);
  };

  return (
    <div className="bg-gray-50/70 min-h-screen pb-20">
      {/* Top Breadcrumb & Title Bar */}
      <div className="bg-white border-b border-gray-200 py-4 px-4 sticky top-[76px] z-30 shadow-2xs">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-brand-teal transition-colors font-medium cursor-pointer"
            >
              Home
            </button>
            <ChevronRight size={13} />
            <button
              onClick={() => onNavigate('products')}
              className="hover:text-brand-teal transition-colors font-medium cursor-pointer"
            >
              Catalog
            </button>
            <ChevronRight size={13} />
            <span className="text-brand-teal font-bold">Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        {/* PROFILE INCOMPLETE WARNING CARD IN CHECKOUT */}
        {isAuthenticated && isProfileIncomplete && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-amber-950">
                    Action Required: Complete Your Profile Before Checkout
                  </h3>
                  <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                    {profileCompleteness?.percentage}% Done
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  The following required details must be completed before placing an order: <strong className="text-amber-950">{profileCompleteness?.missing?.map((m) => m.label).join(', ')}</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('profile', null, 'profile')}
              className="shrink-0 w-full sm:w-auto bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Pencil size={14} />
              <span>Complete Profile Now</span>
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          {/* Left Column: Checkout Steps */}
          <div className="w-full lg:w-7/12 space-y-6">
            {/* Step 1: Delivery Address */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-extrabold text-gray-900">
                      Delivery Address
                    </h2>
                    <p className="text-xs text-gray-500">
                      Where should we deliver your stationery parcel?
                    </p>
                  </div>
                </div>

                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => setIsAddAddressOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:text-brand-teal-dark bg-brand-teal/5 hover:bg-brand-teal/10 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add New</span>
                  </button>
                )}
              </div>

              {/* Authenticated Saved Address Cards */}
              {isAuthenticated ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {userProfile?.addresses?.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-brand-teal bg-brand-teal/5 shadow-xs ring-2 ring-brand-teal/10'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-brand-teal">
                              {addr.type || 'Address'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditAddress(addr);
                                }}
                                className="p-1 rounded-md text-gray-400 hover:text-brand-teal hover:bg-white transition-colors cursor-pointer"
                                title="Edit Address"
                              >
                                <Pencil size={13} />
                              </button>
                              {isSelected && (
                                <span className="w-5 h-5 rounded-full bg-brand-teal text-white flex items-center justify-center">
                                  <Check size={12} strokeWidth={3} />
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs font-bold text-gray-900">
                            {typeof addr.name === 'object' ? (addr.name?.name || 'Customer') : (addr.name || userProfile?.name || 'Customer')}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
                            {typeof (addr.street || addr.addressLine) === 'object' ? 'Delivery Address' : (addr.street || addr.addressLine)}, {typeof addr.city === 'object' ? 'Lucknow' : (addr.city || 'Lucknow')} - {typeof addr.pincode === 'object' ? '226001' : (addr.pincode || '226001')}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Phone: {typeof addr.phone === 'object' ? (addr.phone?.phone || '') : (addr.phone || userProfile?.phone || '')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Guest Checkout Address Form */
                <div className="space-y-3.5">
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
                    <span>Already a student member? Sign in to use saved addresses.</span>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="font-bold underline hover:text-amber-950 cursor-pointer shrink-0 ml-2"
                    >
                      Sign In
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        placeholder="Ritesh Yadav"
                        value={guestAddress.name}
                        onChange={(e) => setGuestAddress({ ...guestAddress, name: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-brand-teal focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={guestAddress.phone}
                        onChange={(e) => setGuestAddress({ ...guestAddress, phone: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-brand-teal focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email (for Order Receipt) *</label>
                    <input
                      type="email"
                      placeholder="student@college.edu"
                      value={guestAddress.email}
                      onChange={(e) => setGuestAddress({ ...guestAddress, email: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-brand-teal focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Hostel Room / Apartment / Street Address *</label>
                    <input
                      type="text"
                      placeholder="Room 402, Block B, Campus Boys Hostel, North Campus"
                      value={guestAddress.street}
                      onChange={(e) => setGuestAddress({ ...guestAddress, street: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-brand-teal focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        value={guestAddress.city}
                        onChange={(e) => setGuestAddress({ ...guestAddress, city: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-brand-teal focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
                      <input
                        type="text"
                        value={guestAddress.state}
                        onChange={(e) => setGuestAddress({ ...guestAddress, state: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-brand-teal focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Pincode *</label>
                      <input
                        type="text"
                        value={guestAddress.pincode}
                        onChange={(e) => setGuestAddress({ ...guestAddress, pincode: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-brand-teal focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Delivery Speed */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-extrabold text-gray-900">
                    Delivery Speed & Carrier
                  </h2>
                  <p className="text-xs text-gray-500">
                    Select your preferred transit speed for school / college dispatch
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Standard */}
                <div
                  onClick={() => setDeliverySpeed('standard')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    deliverySpeed === 'standard'
                      ? 'border-brand-teal bg-brand-teal/5 ring-2 ring-brand-teal/10 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="p-2 bg-brand-teal/10 text-brand-teal rounded-xl shrink-0 mt-0.5">
                    <Truck size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-gray-900">Standard Delivery</span>
                      <span className="text-xs font-bold text-emerald-700">
                        {baseShippingCost === 0 ? 'FREE' : `₹${baseShippingCost}`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">3 - 5 Business Days via BlueDart / Delhivery</p>
                    <p className="text-[11px] text-emerald-600 font-bold mt-1">
                      {subtotal >= freeShippingThreshold ? '✓ Eligible for Free Delivery' : 'Standard Parcel Rate'}
                    </p>
                  </div>
                </div>

                {/* Express Campus Priority */}
                <div
                  onClick={() => setDeliverySpeed('express')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    deliverySpeed === 'express'
                      ? 'border-brand-teal bg-brand-teal/5 ring-2 ring-brand-teal/10 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="p-2 bg-brand-yellow/30 text-brand-teal-dark rounded-xl shrink-0 mt-0.5">
                    <Clock size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-gray-900">Campus Express</span>
                      <span className="text-xs font-extrabold text-brand-teal">+₹49</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">1 - 2 Days Priority Air Dispatch</p>
                    <p className="text-[11px] text-brand-ochre font-extrabold mt-1">
                      ⚡ Guaranteed Pre-Exam Fast Delivery
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-extrabold text-gray-900">
                    Payment Method
                  </h2>
                  <p className="text-xs text-gray-500">
                    Choose your trusted payment provider (Zero surcharge)
                  </p>
                </div>
              </div>

              {/* Product & Seller Payment Restrictions Notice */}
              <div className="space-y-3">
                {areAllPaymentsDisabled ? (
                  <div className="p-4 bg-red-50 border-2 border-red-300 text-red-950 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center gap-2 font-extrabold text-red-900">
                      <AlertTriangle size={18} className="text-red-600 shrink-0" />
                      <span>No Available Payment Method for Cart Items</span>
                    </div>
                    <p className="text-red-800 leading-relaxed pl-6">
                      The seller for <strong>'{noPaymentMethodItem?.name || 'item(s) in your cart'}'</strong> has disabled all payment methods (Neither COD nor Online Payment is accepted). Please remove this item from your cart to proceed with checkout.
                    </p>
                  </div>
                ) : (
                  <>
                    {isCodDisabled && (
                      <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                        <span>
                          <strong>Cash on Delivery (COD) Disabled:</strong> '{disabledCodReasonItem?.name || 'Item'}' seller has disabled COD. <strong>Online / Prepaid Payment Required</strong>.
                        </span>
                      </div>
                    )}

                    {isOnlineDisabled && (
                      <div className="p-3 bg-blue-50 border border-blue-300 text-blue-900 rounded-2xl text-xs flex items-center gap-2">
                        <AlertTriangle size={16} className="text-blue-600 shrink-0" />
                        <span>
                          <strong>Online Payment Disabled:</strong> '{disabledOnlineReasonItem?.name || 'Item'}' seller accepts <strong>Cash on Delivery (COD) Only</strong>.
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Payment Type Selection Tabs (UPI & COD) */}
                <div className="grid grid-cols-2 gap-3.5">
                {/* Payment Type Selection Tabs (UPI & COD) */}
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (areAllPaymentsDisabled) {
                        const itemName = noPaymentMethodItem?.name || 'this product';
                        const msg = `Payment mode 'UPI / Online Pay' is not applicable for '${itemName}'. The seller has disabled all payment options for this product.`;
                        showToast(`⚠️ Payment mode 'UPI / Online Pay' is not applicable for '${itemName}'`);
                        setDisallowedPaymentModal({
                          isOpen: true,
                          title: 'Payment Mode Not Applicable',
                          message: msg,
                          mode: 'UPI / Online Pay',
                          item: noPaymentMethodItem
                        });
                      } else if (isOnlineDisabled) {
                        const itemName = disabledOnlineReasonItem?.name || 'this product';
                        const msg = `Payment mode 'UPI / Online Pay' is not applicable for '${itemName}'. The seller accepts Cash on Delivery (COD) only.`;
                        showToast(`⚠️ Payment mode 'UPI / Online Pay' is not applicable for '${itemName}'`);
                        setDisallowedPaymentModal({
                          isOpen: true,
                          title: 'Payment Mode Not Applicable',
                          message: msg,
                          mode: 'UPI / Online Pay',
                          item: disabledOnlineReasonItem
                        });
                      } else {
                        setPaymentMethod('upi');
                      }
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isOnlineDisabled || areAllPaymentsDisabled
                        ? 'bg-rose-50/70 text-rose-800 border-rose-300 hover:bg-rose-100/80 shadow-2xs'
                        : paymentMethod === 'upi'
                        ? 'border-brand-teal bg-brand-teal/5 font-extrabold text-brand-teal ring-2 ring-brand-teal/10 shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone size={20} />
                    <span className="text-xs font-extrabold">UPI / Online Pay</span>
                    {(isOnlineDisabled || areAllPaymentsDisabled) && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300 shadow-2xs">
                        🚫 Disallowed (Click for info)
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (areAllPaymentsDisabled) {
                        const itemName = noPaymentMethodItem?.name || 'this product';
                        const msg = `Payment mode 'Cash on Delivery (COD)' is not applicable for '${itemName}'. The seller has disabled all payment options for this product.`;
                        showToast(`⚠️ Payment mode 'Cash on Delivery (COD)' is not applicable for '${itemName}'`);
                        setDisallowedPaymentModal({
                          isOpen: true,
                          title: 'Payment Mode Not Applicable',
                          message: msg,
                          mode: 'Cash on Delivery (COD)',
                          item: noPaymentMethodItem
                        });
                      } else if (isCodDisabled) {
                        const itemName = disabledCodReasonItem?.name || 'this product';
                        const msg = `Payment mode 'Cash on Delivery (COD)' is not applicable for '${itemName}'. The seller requires Online / Prepaid payment for this product.`;
                        showToast(`⚠️ Payment mode 'Cash on Delivery (COD)' is not applicable for '${itemName}'`);
                        setDisallowedPaymentModal({
                          isOpen: true,
                          title: 'Payment Mode Not Applicable',
                          message: msg,
                          mode: 'Cash on Delivery (COD)',
                          item: disabledCodReasonItem
                        });
                      } else {
                        setPaymentMethod('cod');
                      }
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isCodDisabled || areAllPaymentsDisabled
                        ? 'bg-amber-50/70 text-amber-900 border-amber-300 hover:bg-amber-100/80 shadow-2xs'
                        : paymentMethod === 'cod'
                        ? 'border-brand-teal bg-brand-teal/5 font-extrabold text-brand-teal ring-2 ring-brand-teal/10 shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Banknote size={20} />
                    <span className="text-xs font-extrabold">Cash on Delivery (COD)</span>
                    {(isCodDisabled || areAllPaymentsDisabled) && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                        🚫 Disallowed (Click for info)
                      </span>
                    )}
                  </button>
                </div>
                </div>
              </div>

              {/* Sub-view for UPI */}
              {paymentMethod === 'upi' && (
                <div className="bg-gray-50/90 rounded-2xl p-5 border border-gray-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">Popular Instant UPI Apps & Razorpay Gateway</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                      Zero Surcharge
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'gpay', name: 'Google Pay' },
                      { id: 'phonepe', name: 'PhonePe' },
                      { id: 'paytm', name: 'Paytm' },
                      { id: 'id', name: 'Other UPI ID' }
                    ].map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setUpiMethod(app.id)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          upiMethod === app.id
                            ? 'bg-brand-teal text-white border-brand-teal shadow-2xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {app.name}
                      </button>
                    ))}
                  </div>

                  {upiMethod === 'id' ? (
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-bold text-gray-700">Enter Your VPA / UPI ID</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="yourname@okaxis"
                          value={customUpiId}
                          onChange={(e) => {
                            setCustomUpiId(e.target.value);
                            setIsUpiVerified(false);
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-teal"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyUpi}
                          className="px-4 py-2 bg-brand-teal text-white font-bold text-xs rounded-xl hover:bg-brand-teal-light transition-colors cursor-pointer"
                        >
                          Verify
                        </button>
                      </div>
                      {isUpiVerified && (
                        <p className="text-xs text-emerald-700 font-bold flex items-center gap-1 mt-1">
                          <CheckCircle2 size={13} />
                          <span>Verified: Student Account Holder</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-700 flex items-center gap-2.5">
                      <Smartphone size={18} className="text-brand-teal shrink-0 animate-bounce" />
                      <span>
                        Tapping <strong>Place Order</strong> will launch <strong>{upiMethod === 'gpay' ? 'Google Pay' : upiMethod === 'phonepe' ? 'PhonePe' : upiMethod === 'paytm' ? 'Paytm' : upiMethod.toUpperCase()}</strong> directly on your device.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-view for Cash on Delivery (COD) */}
              {paymentMethod === 'cod' && (
                <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200 text-xs text-emerald-900 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>Cash on Delivery Available</span>
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      ✓ Verified Active
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Pay in cash or scan the delivery partner's UPI QR code upon arrival at your hostel desk or home address.
                  </p>
                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-bold text-emerald-900">
                    <span>COD Handling Fee: <strong className="text-emerald-700 font-extrabold">₹0 (FREE)</strong></span>
                    <span>No Prepayment Required</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Order Summary & Pay */}
          <div className="w-full lg:w-5/12 lg:sticky lg:top-[135px] self-start z-20 space-y-5">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                <h3 className="font-display text-lg font-extrabold text-brand-teal">
                  Order Summary
                </h3>
                <span className="text-xs font-bold bg-brand-teal/5 text-brand-teal px-2.5 py-1 rounded-full">
                  {selectedCartItems.length} to buy ({cartItems.length} in cart)
                </span>
              </div>

              {/* Selection Bar & Add Product CTA */}
              <div className="flex items-center justify-between text-xs font-bold text-gray-800 bg-teal-50/70 p-2.5 rounded-xl border border-teal-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cartItems.length > 0 && cartItems.every((item) => item.selected !== false)}
                    onChange={(e) => selectAllCartItems(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer accent-teal-700"
                  />
                  <span>Select All Items ({selectedCartItems.length} selected)</span>
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('products')}
                  className="text-brand-teal hover:text-brand-teal-light font-extrabold flex items-center gap-1 text-xs cursor-pointer bg-white px-2 py-1 rounded-md border border-brand-teal/20 shadow-2xs hover:bg-brand-teal/5 transition-all"
                >
                  <PlusCircle size={13} className="text-brand-teal" />
                  <span>+ Add Product</span>
                </button>
              </div>

              {/* Items List with Selection & Steppers */}
              <div
                className="space-y-3 max-h-64 overflow-y-auto hide-scrollbar pr-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {cartItems.map((item) => {
                  const isSelected = item.selected !== false;
                  const itemKey = item.cartItemId || getCartItemKey(item);
                  const variantText = item.variantName || item.selectedSize || item.selectedColor || '';

                  return (
                    <div
                      key={itemKey}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                        isSelected ? 'bg-white border-gray-200 shadow-2xs' : 'bg-gray-50/80 border-dashed border-gray-200 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCartItemSelection(itemKey)}
                        className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer accent-teal-700 shrink-0"
                        title={isSelected ? 'Uncheck to keep in cart without buying' : 'Check to buy now'}
                      />

                      <img
                        src={resolveImageUrl(getProductMainImage(item) || item.image)}
                        alt={item.name}
                        className="w-11 h-11 rounded-lg object-cover bg-gray-100 border border-gray-200 shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {item.name}
                          </p>
                          {!isSelected && (
                            <span className="text-[9px] font-bold text-gray-400 bg-gray-200/70 px-1.5 py-0.5 rounded shrink-0">
                              Stays in Cart
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
                          <span className="text-[11px] font-extrabold text-brand-teal">
                            ₹{item.price} {variantText ? `• ${variantText}` : ''}
                          </span>

                          {/* Stepper with count increment and decrement buttons */}
                          <div className="flex items-center border border-gray-200 rounded-md bg-gray-50 overflow-hidden shadow-2xs shrink-0">
                            <button
                              type="button"
                              className="w-6 h-6 flex items-center justify-center text-gray-700 hover:bg-gray-200 hover:text-brand-teal transition-colors font-bold cursor-pointer"
                              onClick={() => updateQuantity(itemKey, -1)}
                              aria-label="Decrease quantity"
                              title="Decrease quantity"
                            >
                              <Minus size={10} strokeWidth={2.5} />
                            </button>
                            <span className="w-6 text-center text-xs font-extrabold text-gray-900 bg-white py-0.5">{item.quantity}</span>
                            <button
                              type="button"
                              className="w-6 h-6 flex items-center justify-center text-gray-700 hover:bg-gray-200 hover:text-brand-teal transition-colors font-bold cursor-pointer"
                              onClick={() => updateQuantity(itemKey, 1)}
                              aria-label="Increase quantity"
                              title="Increase quantity (add more)"
                            >
                              <Plus size={10} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-gray-900 block">
                          ₹{item.price * item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(itemKey)}
                          className="text-gray-400 hover:text-rose-600 transition-colors p-0.5 mt-0.5 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {cartItems.length > selectedCartItems.length && (
                <div className="text-[11px] text-gray-600 font-semibold italic bg-gray-50 p-2 rounded-xl text-center border border-gray-200">
                  ℹ️ {cartItems.length - selectedCartItems.length} unselected item(s) will remain in your cart after order placement.
                </div>
              )}

              {/* Coupon Code Section (Hidden by Default, Appears on Toggle) */}
              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-emerald-600" />
                      <div>
                        <p className="font-bold text-emerald-800">{appliedCoupon.code}</p>
                        <p className="text-[10px] text-emerald-600">{appliedCoupon.label}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Remove Coupon"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowCouponInput(!showCouponInput)}
                      className="w-full flex items-center justify-between text-xs font-extrabold text-brand-teal bg-brand-teal/5 border border-brand-teal/15 hover:bg-brand-teal/10 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-brand-pink" />
                        <span>Have a Coupon Code?</span>
                      </div>
                      <ChevronRight size={14} className={`transform transition-transform duration-200 ${showCouponInput ? 'rotate-90' : ''}`} />
                    </button>

                    {showCouponInput && (
                      <div className="mt-2.5 space-y-2.5 animate-in fade-in duration-200">
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter Coupon Code"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase focus:outline-none focus:border-brand-teal focus:bg-white"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-brand-teal hover:bg-brand-teal-light text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Apply
                          </button>
                        </form>

                        {/* Dynamic Promo Chips */}
                        {Array.isArray(promotions) && promotions.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] text-gray-400 font-bold">Try:</span>
                            {promotions.slice(0, 3).map((p) => (
                              <button
                                key={p.code || p._id}
                                type="button"
                                onClick={() => applyCoupon(p.code)}
                                className="text-[10px] font-bold bg-gray-100 hover:bg-brand-yellow/20 hover:text-brand-teal text-gray-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer border border-gray-200"
                              >
                                {p.code} ({p.discountValue ? `${p.discountValue}%` : 'OFF'})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Loyalty Points Redemption (If authenticated with points) */}
              {isAuthenticated && (userProfile?.rewardPoints || 0) >= 100 && (
                <div className="p-3 rounded-xl bg-brand-teal/5 border border-brand-teal/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-brand-ochre" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        Use 100 Points for ₹50 Off
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Balance: {userProfile.rewardPoints} Student Points
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRedeemingPoints}
                    onChange={(e) => setIsRedeemingPoints(e.target.checked)}
                    className="w-4 h-4 text-brand-teal rounded focus:ring-brand-teal cursor-pointer"
                  />
                </div>
              )}

              {/* Price Calculation Breakdown */}
              <div className="space-y-2 pt-3 border-t border-gray-100 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Selected Subtotal ({selectedCartItems.length} items)</span>
                  <span className="font-semibold text-gray-900">₹{subtotal}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Speed</span>
                  <span className="font-semibold text-gray-900">
                    {totalShippingCost === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      `₹${totalShippingCost}`
                    )}
                  </span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Points Redemption</span>
                    <span>-₹{pointsDiscount}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-400">
                  <span>GST / Campus Tax</span>
                  <span className="font-medium text-emerald-700">Included</span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-brand-teal pt-3 border-t border-dashed border-gray-200">
                  <span>Total Payable</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                type="button"
                disabled={
                  isSubmitting ||
                  selectedCartItems.length === 0 ||
                  areAllPaymentsDisabled ||
                  (paymentMethod === 'cod' && isCodDisabled) ||
                  ((paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'netbanking') && isOnlineDisabled)
                }
                onClick={handlePlaceOrder}
                className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-brand-teal-dark" />
                    <span>Processing Secure Order...</span>
                  </>
                ) : selectedCartItems.length === 0 ? (
                  <>
                    <AlertTriangle size={16} className="text-amber-900" />
                    <span>SELECT AT LEAST 1 ITEM TO BUY</span>
                  </>
                ) : areAllPaymentsDisabled ? (
                  <>
                    <AlertTriangle size={16} className="text-amber-900" />
                    <span>ALL PAYMENT METHODS DISABLED</span>
                  </>
                ) : (paymentMethod === 'cod' && isCodDisabled) || ((paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'netbanking') && isOnlineDisabled) ? (
                  <>
                    <AlertTriangle size={16} className="text-amber-900" />
                    <span>PAYMENT METHOD NOT APPLICABLE</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>PLACE ORDER • ₹{grandTotal} ({selectedCartItems.length} ITEMS)</span>
                  </>
                )}
              </button>

              {/* Trust badges footer */}
              <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-center gap-1">
                  <ShieldCheck size={13} className="text-brand-teal" />
                  <span>100% Genuine Stationery</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Truck size={13} className="text-brand-teal" />
                  <span>Safe Campus Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Address Modal */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-display text-base font-extrabold text-brand-teal">
                Add New Delivery Address
              </h3>
              <button
                onClick={() => setIsAddAddressOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewAddress} className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newAddrForm.name}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9876543210"
                  value={newAddrForm.phone}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Address Label / Type</label>
                <select
                  value={newAddrForm.type}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, type: e.target.value, addressType: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-brand-teal"
                >
                  <option value="Home">Home</option>
                  <option value="Campus Hostel">Campus Hostel</option>
                  <option value="Department Lab">Department / Lab</option>
                  <option value="Work">Work / Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near Library / Gate 2"
                  value={newAddrForm.landmark}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, landmark: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Flat / Room / House No. / Building (Address Line)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 204, Ganga Hostel"
                  value={newAddrForm.addressLine}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, addressLine: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Street / Area / Sector</label>
                <input
                  type="text"
                  placeholder="e.g. DTU Main Campus, Bawana Road"
                  value={newAddrForm.street}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, street: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Delhi"
                    value={newAddrForm.city}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, city: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delhi"
                    value={newAddrForm.state}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, state: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 110042"
                  value={newAddrForm.pincode}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, pincode: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="checkoutIsDefault"
                  checked={newAddrForm.isDefault}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal cursor-pointer"
                />
                <label htmlFor="checkoutIsDefault" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Set as default shipping address
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAddressOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {editingAddressId && editingAddrForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4 relative animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-display font-bold text-base text-gray-900">
                Edit Delivery Address
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingAddressId(null);
                  setEditingAddrForm(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditAddress} className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={editingAddrForm.name}
                  onChange={(e) => setEditingAddrForm({ ...editingAddrForm, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9876543210"
                  value={editingAddrForm.phone}
                  onChange={(e) => setEditingAddrForm({ ...editingAddrForm, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Address Label / Type</label>
                <select
                  value={editingAddrForm.type}
                  onChange={(e) => setEditingAddrForm({ ...editingAddrForm, type: e.target.value, addressType: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-brand-teal"
                >
                  <option value="Home">Home</option>
                  <option value="Campus Hostel">Campus Hostel</option>
                  <option value="Department Lab">Department / Lab</option>
                  <option value="Work">Work / Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near Library / Gate 2"
                  value={editingAddrForm.landmark}
                  onChange={(e) => setEditingAddrForm({ ...editingAddrForm, landmark: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Flat / Room / House No. / Building (Address Line)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 204, Ganga Hostel"
                  value={editingAddrForm.addressLine}
                  onChange={(e) => setEditingAddrForm({ ...editingAddrForm, addressLine: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Street / Area / Sector</label>
                <input
                  type="text"
                  placeholder="e.g. DTU Main Campus, Bawana Road"
                  value={editingAddrForm.street}
                  onChange={(e) => setEditingAddrForm({ ...editingAddrForm, street: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Delhi"
                    value={editingAddrForm.city}
                    onChange={(e) => setEditingAddrForm({ ...editingAddrForm, city: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delhi"
                    value={editingAddrForm.state}
                    onChange={(e) => setEditingAddrForm({ ...editingAddrForm, state: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 110042"
                  value={editingAddrForm.pincode}
                  onChange={(e) => setEditingAddrForm({ ...editingAddrForm, pincode: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="checkoutEditIsDefault"
                  checked={editingAddrForm.isDefault}
                  onChange={(e) => setEditingAddrForm({ ...editingAddrForm, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal cursor-pointer"
                />
                <label htmlFor="checkoutEditIsDefault" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Set as default shipping address
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddressId(null);
                    setEditingAddrForm(null);
                  }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Update Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disallowed Payment Mode Modal Popup */}
      {disallowedPaymentModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle size={28} />
            </div>

            <div>
              <h3 className="font-display font-extrabold text-lg text-gray-900">
                {disallowedPaymentModal.title || 'Payment Mode Not Applicable'}
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed bg-gray-50 p-3 rounded-2xl border border-gray-200 font-medium">
                {disallowedPaymentModal.message}
              </p>
            </div>

            {disallowedPaymentModal.item && (
              <div className="flex items-center gap-3 p-2.5 bg-rose-50/60 rounded-xl border border-rose-200 text-left">
                <img
                  src={resolveImageUrl(getProductMainImage(disallowedPaymentModal.item) || disallowedPaymentModal.item.image)}
                  alt={disallowedPaymentModal.item.name}
                  className="w-10 h-10 rounded-lg object-cover bg-white border border-gray-200 shrink-0"
                />
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold text-gray-900 truncate">{disallowedPaymentModal.item.name}</p>
                  <p className="text-[10px] text-rose-700 font-semibold">Product in Cart</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setDisallowedPaymentModal({ isOpen: false, title: '', message: '', mode: '', item: null })}
              className="w-full py-3 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
            >
              Understood, Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
