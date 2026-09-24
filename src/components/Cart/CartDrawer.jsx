import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Plus, Minus, Loader2, AlertTriangle, CheckSquare, Square, PlusCircle } from 'lucide-react';
import { useCart, getCartItemKey } from '../../context/CartContext';
import { resolveImageUrl, getProductMainImage } from '../../utils/api';

import { getCartPaymentRestrictions } from '../../utils/paymentRestrictions';

export default function CartDrawer({ onNavigate }) {
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    selectedCartItems,
    allCartItemsCount,
    toggleCartItemSelection,
    selectAllCartItems,
    removeFromCart,
    clearCart,
    updateQuantity,
    subtotal,
    totalItemsCount,
    freeShippingThreshold,
    freeShippingProgress,
    freeShippingRemaining,
    isAuthenticated,
    isProfileIncomplete,
    profileCompleteness,
    showToast
  } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Evaluate payment restrictions for chosen items to buy
  const cartPaymentRestrictions = getCartPaymentRestrictions(selectedCartItems);

  const shippingCost = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 49;
  const grandTotal = subtotal + shippingCost;

  const handleCheckout = () => {
    if (isCheckingOut) return;
    if (selectedCartItems.length === 0) {
      if (showToast) showToast('⚠️ Please select at least one product to proceed with checkout!');
      return;
    }
    setIsCheckingOut(true);
    setIsCartOpen(false);
    if (isAuthenticated && isProfileIncomplete) {
      const missingLabels = profileCompleteness?.missing?.map((m) => m.label).join(', ') || 'required details';
      if (showToast) {
        showToast(`⚠️ Please complete your profile (${missingLabels}) before checking out.`);
      }
    }
    if (onNavigate) {
      onNavigate('checkout');
    }
    setTimeout(() => setIsCheckingOut(false), 500);
  };

  const areAllSelected = cartItems.length > 0 && cartItems.every((item) => item.selected !== false);

  return (
    <div
      className={`fixed inset-0 z-999 bg-brand-teal-dark/60 backdrop-blur-xs flex justify-end transition-opacity duration-300 ${
        isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setIsCartOpen(false)}
    >
      <div
        className={`w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold text-brand-teal">
            <ShoppingBag size={20} />
            <span>Your Cart Items</span>
            <span className="bg-brand-yellow text-brand-teal-dark text-xs font-extrabold px-2 py-0.5 rounded-full">
              {totalItemsCount} to buy ({cartItems.length} in cart)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded border border-red-200 transition-colors cursor-pointer"
                onClick={clearCart}
                title="Clear all items from cart"
              >
                <Trash2 size={13} />
                <span>Clear Cart</span>
              </button>
            )}
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-brand-teal transition-colors cursor-pointer"
              onClick={() => setIsCartOpen(false)}
              aria-label="Close Cart"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Free Shipping Meter */}
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
          <div className="text-xs text-gray-600 mb-1.5 flex justify-between">
            {freeShippingRemaining > 0 ? (
              <span>
                Add <strong className="text-brand-teal">₹{Math.round(freeShippingRemaining)}</strong> more for <strong className="text-brand-yellow-hover">FREE Shipping!</strong>
              </span>
            ) : (
              <span className="text-green-600 font-bold">
                🎉 You've unlocked FREE Shipping!
              </span>
            )}
            <span className="text-gray-400 font-medium">{Math.round(freeShippingProgress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden hide-scrollbar">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                freeShippingRemaining === 0 ? 'bg-green-500' : 'bg-brand-yellow'
              }`}
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Product Selection Controls & Add Product Link */}
        {cartItems.length > 0 && (
          <div className="px-5 py-2.5 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between text-xs font-bold text-gray-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={areAllSelected}
                onChange={(e) => selectAllCartItems(e.target.checked)}
                className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer accent-teal-700"
              />
              <span>Select All ({selectedCartItems.length} of {cartItems.length} selected to buy)</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setIsCartOpen(false);
                if (onNavigate) onNavigate('products');
              }}
              className="text-brand-teal hover:text-brand-teal-light font-extrabold flex items-center gap-1 text-xs cursor-pointer bg-white px-2 py-1 rounded-md border border-brand-teal/20 shadow-2xs hover:bg-brand-teal/5 transition-all"
            >
              <PlusCircle size={14} className="text-brand-teal" />
              <span>+ Add Product</span>
            </button>
          </div>
        )}

        {/* Items List */}
        {cartItems.length > 0 ? (
          <div className="flex-grow overflow-y-auto hide-scrollbar p-5 space-y-4">
            {cartItems.map((item) => {
              const isItemSelected = item.selected !== false;
              const itemKey = item.cartItemId || getCartItemKey(item);
              const variantText = item.variantName || item.selectedSize || item.selectedColor || '';

              return (
                <div
                  key={itemKey}
                  className={`flex gap-3 pb-4 border-b border-gray-100 items-center transition-all p-2 rounded-xl ${
                    isItemSelected ? 'bg-white' : 'bg-gray-50/80 opacity-70 border-dashed'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isItemSelected}
                    onChange={() => toggleCartItemSelection(itemKey)}
                    className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer accent-teal-700 shrink-0"
                    title={isItemSelected ? 'Uncheck to keep in cart without buying' : 'Check to buy now'}
                  />

                  <img
                    src={resolveImageUrl(getProductMainImage(item) || item.image)}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-50"
                  />

                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-sm font-bold text-brand-teal leading-snug truncate">{item.name}</h4>
                      {!isItemSelected && (
                        <span className="text-[9px] font-bold text-gray-500 bg-gray-200/80 px-1.5 py-0.5 rounded shrink-0">
                          Saved in Cart
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-extrabold text-brand-teal mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>₹{item.price}</span>
                      {variantText && (
                        <span className="text-[10px] font-extrabold text-teal-900 bg-teal-100 px-2 py-0.5 rounded-md border border-teal-300">
                          Variant: {variantText}
                        </span>
                      )}
                    </div>
                    {item.bundleType === 'kit' && item.kitItems?.length > 0 && (
                      <div className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                        Includes: {item.kitItems.map((kitItem) => kitItem.name).join(', ')}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      {/* Stepper with count increment and decrement buttons */}
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden shadow-2xs">
                        <button
                          className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-200 hover:text-brand-teal transition-colors font-bold cursor-pointer"
                          onClick={() => updateQuantity(itemKey, -1)}
                          aria-label="Decrease quantity"
                          title="Decrease quantity"
                        >
                          <Minus size={12} strokeWidth={2.5} />
                        </button>
                        <span className="w-8 text-center text-xs font-extrabold text-gray-900 bg-white py-1">{item.quantity}</span>
                        <button
                          className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-200 hover:text-brand-teal transition-colors font-bold cursor-pointer"
                          onClick={() => updateQuantity(itemKey, 1)}
                          aria-label="Increase quantity"
                          title="Increase quantity (add more)"
                        >
                          <Plus size={12} strokeWidth={2.5} />
                        </button>
                      </div>

                      <button
                        className="text-gray-400 hover:text-brand-pink transition-colors p-1.5 hover:bg-rose-50 rounded-md cursor-pointer"
                        onClick={() => removeFromCart(itemKey)}
                        title="Remove item from cart"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center">
              <ShoppingBag size={32} />
            </div>
            <h3 className="font-bold text-lg text-brand-teal">Your cart is empty</h3>
            <p className="text-xs text-gray-500 max-w-xs">
              Looks like you haven't added any stationery or study supplies yet.
            </p>
            <button
              className="bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs transition-all cursor-pointer"
              onClick={() => {
                setIsCartOpen(false);
                if (onNavigate) onNavigate('products');
              }}
            >
              Continue Shopping
            </button>
          </div>
        )}

        {/* Footer with Summary & Checkout */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-gray-200 bg-white space-y-3">
            {selectedCartItems.length === 0 ? (
              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>No products selected to buy. Check items above to proceed.</span>
              </div>
            ) : cartPaymentRestrictions.areAllPaymentsDisabled ? (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Payment Disabled:</strong> Seller for '{cartPaymentRestrictions.noPaymentMethodItem?.name || 'an item'}' has disabled all payment methods.
                </span>
              </div>
            ) : cartPaymentRestrictions.isCodDisabled ? (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                <span>
                  <strong>Prepaid Only:</strong> '{cartPaymentRestrictions.disabledCodReasonItem?.name || 'Item'}' requires online payment (COD unavailable).
                </span>
              </div>
            ) : cartPaymentRestrictions.isOnlineDisabled ? (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-blue-600 shrink-0" />
                <span>
                  <strong>COD Only:</strong> '{cartPaymentRestrictions.disabledOnlineReasonItem?.name || 'Item'}' accepts Cash on Delivery only.
                </span>
              </div>
            ) : null}

            <div className="flex justify-between text-xs text-gray-600">
              <span>Selected Subtotal ({selectedCartItems.length} items)</span>
              <span className="font-semibold text-gray-900">₹{Math.round(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Shipping</span>
              <span className="font-semibold">
                {shippingCost === 0 ? (
                  <span className="text-green-600 font-bold">FREE</span>
                ) : (
                  `₹${shippingCost}`
                )}
              </span>
            </div>

            {cartItems.length > selectedCartItems.length && (
              <div className="text-[11px] text-gray-500 font-semibold italic bg-gray-50 p-1.5 rounded text-center border border-gray-200">
                ℹ️ {cartItems.length - selectedCartItems.length} unselected item(s) will stay in your cart
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold text-brand-teal pt-2 border-t border-dashed border-gray-200">
              <span>Payable Amount</span>
              <span>₹{Math.round(grandTotal)}</span>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                className="flex-1 py-3 border border-brand-teal text-brand-teal hover:bg-brand-teal/5 font-bold text-xs rounded-lg transition-all cursor-pointer text-center"
                onClick={() => {
                  setIsCartOpen(false);
                  if (onNavigate) onNavigate('products');
                }}
              >
                + Add Product
              </button>
              <button
                disabled={isCheckingOut || selectedCartItems.length === 0 || cartPaymentRestrictions.areAllPaymentsDisabled}
                className="flex-[1.5] py-3 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCheckout}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-brand-teal-dark" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>CHECKOUT ({selectedCartItems.length})</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
