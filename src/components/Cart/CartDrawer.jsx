import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartDrawer({ onNavigate }) {
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    removeFromCart,
    updateQuantity,
    subtotal,
    totalItemsCount,
    freeShippingThreshold,
    freeShippingProgress,
    freeShippingRemaining
  } = useCart();

  const shippingCost = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 49;
  const grandTotal = subtotal + shippingCost;

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (onNavigate) {
      onNavigate('checkout');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-brand-teal-dark/60 backdrop-blur-xs flex justify-end transition-opacity duration-300 ${
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
            <span>Your Book Vardi</span>
            <span className="bg-brand-yellow text-brand-teal-dark text-xs font-extrabold px-2 py-0.5 rounded-full">
              {totalItemsCount}
            </span>
          </div>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-brand-teal transition-colors"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close Cart"
          >
            <X size={20} />
          </button>
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
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                freeShippingRemaining === 0 ? 'bg-green-500' : 'bg-brand-yellow'
              }`}
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        {cartItems.length > 0 ? (
          <div className="flex-grow overflow-y-auto p-5 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 items-center">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-50"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/gel-pen-set.jpg';
                  }}
                />

                <div className="flex-grow">
                  <h4 className="text-sm font-bold text-brand-teal leading-snug line-clamp-1">{item.name}</h4>
                  <div className="text-xs font-extrabold text-brand-teal mt-0.5">₹{item.price}</div>
                  {item.bundleType === 'kit' && item.kitItems?.length > 0 && (
                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                      Includes: {item.kitItems.map((kitItem) => kitItem.name).join(', ')}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    {/* Stepper */}
                    <div className="flex items-center border border-gray-200 rounded">
                      <button
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-brand-teal transition-colors"
                        onClick={() => updateQuantity(item.id, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
                      <button
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-brand-teal transition-colors"
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      className="text-gray-400 hover:text-brand-pink transition-colors p-1"
                      onClick={() => removeFromCart(item.id)}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
              Start Shopping
            </button>
          </div>
        )}

        {/* Footer with Summary & Checkout */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-gray-200 bg-white">
            <div className="flex justify-between text-xs text-gray-600 mb-1.5">
              <span>Subtotal</span>
              <span className="font-semibold">₹{Math.round(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Shipping</span>
              <span className="font-semibold">
                {shippingCost === 0 ? (
                  <span className="text-green-600 font-bold">FREE</span>
                ) : (
                  `₹${shippingCost}`
                )}
              </span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-brand-teal pt-2 border-t border-dashed border-gray-200">
              <span>Estimated Total</span>
              <span>₹{Math.round(grandTotal)}</span>
            </div>

            <button
              className="w-full mt-4 py-3 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-bold text-sm rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all transform hover:-translate-y-0.5"
              onClick={handleCheckout}
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight size={16} />
            </button>

            <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400 mt-3">
              <ShieldCheck size={14} className="text-brand-teal" />
              <span>100% Verified Secure SSL Checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
