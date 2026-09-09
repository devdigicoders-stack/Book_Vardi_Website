import React, { useState } from 'react';
import { X, Check, ShoppingCart, Info } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function KitDetailsModal({ isOpen, onClose, kit }) {
  const { addToCart, openProductDetails } = useCart();
  const [selectedItems, setSelectedItems] = useState({
    [kit.id]: kit.kitItems ? kit.kitItems.map(i => i.id) : []
  });

  if (!isOpen) return null;

  const toggleItem = (itemId) => {
    setSelectedItems((prev) => {
      const current = prev[kit.id] || [];
      const next = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];
      return { ...prev, [kit.id]: next };
    });
  };

  const selectedIds = selectedItems[kit.id] || [];
  const subtotal = kit.kitItems
    .filter((item) => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const handleAddSelected = () => {
    const selectedProducts = kit.kitItems.filter((item) => selectedIds.includes(item.id));
    const bundleItems = selectedProducts.length ? selectedProducts : kit.kitItems;
    const bundlePrice = selectedProducts.length ? subtotal : kit.price;

    addToCart({
      ...kit,
      id: selectedProducts.length ? `kit-${kit.id}-${selectedIds.slice().sort((a, b) => a - b).join('-')}` : kit.id,
      name: selectedProducts.length ? `${kit.name} (Custom Bundle)` : `${kit.name} (Full Bundle)`,
      price: bundlePrice,
      kitItems: bundleItems,
      bundleType: 'kit'
    }, 1);
    onClose();
  };

  const handleBuyFullKit = () => {
    addToCart({ ...kit, image: kit.image, category: 'kits', bundleType: 'kit' }, 1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded uppercase">{kit.school}</span>
              <span className="text-[10px] font-bold text-brand-pink">{kit.className}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{kit.name}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors self-start"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="w-full md:w-1/3 shrink-0">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                 <img src={kit.image} alt={kit.name} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">{kit.subtitle}</p>
              
              <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-4 rounded-xl flex items-start gap-3">
                 <Info size={18} className="text-brand-yellow shrink-0 mt-0.5" />
                 <p className="text-xs text-gray-700">
                   You can buy the complete bundle at a discounted price, or customize it by selecting only the items you need below.
                 </p>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-brand-teal">₹{kit.price}</span>
                {kit.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">₹{kit.originalPrice}</span>
                )}
                {kit.discountBadge && (
                  <span className="ml-2 text-xs font-bold text-brand-pink">{kit.discountBadge}</span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-800">Customize Bundle</h3>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (selectedIds.length === kit.kitItems.length) {
                      setSelectedItems({ ...selectedItems, [kit.id]: [] });
                    } else {
                      setSelectedItems({ ...selectedItems, [kit.id]: kit.kitItems.map(i => i.id) });
                    }
                  }}
                  className="text-xs font-bold text-brand-teal hover:underline"
                >
                  {selectedIds.length === kit.kitItems.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedIds.length > 0 && (
                  <div className="text-xs font-bold text-brand-teal bg-brand-teal/10 px-3 py-1 rounded-full">
                    {selectedIds.length} items • ₹{subtotal}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {kit.kitItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-center justify-between w-full rounded-xl border p-3 md:p-4 text-left transition-all ${
                      isSelected
                        ? 'border-brand-teal bg-brand-teal/5 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-brand-teal/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-teal border-brand-teal text-white' : 'border-gray-300 bg-white'}`}>
                        <Check size={12} />
                      </div>
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded border border-gray-100 object-cover" />
                        <div>
                          <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-gray-500">₹{item.price}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex flex-col sm:flex-row gap-3 justify-end items-center">
          <button
            onClick={() => {
              onClose();
              openProductDetails(kit);
            }}
            className="inline-flex items-center gap-2 border border-brand-teal/30 text-brand-teal hover:bg-brand-teal/5 font-bold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 w-full sm:w-auto justify-center sm:mr-auto"
          >
            More Details
          </button>
          
          {selectedIds.length === kit.kitItems?.length ? (
            <button
              onClick={handleBuyFullKit}
              className="inline-flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center"
            >
              <ShoppingCart size={16} />
              <span>Add Full Bundle (₹{kit.price})</span>
            </button>
          ) : selectedIds.length > 0 ? (
            <button
              onClick={handleAddSelected}
              className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-teal-light text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center"
            >
              <ShoppingCart size={16} />
              <span>Add Selected (₹{subtotal})</span>
            </button>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-2 bg-gray-200 text-gray-500 font-bold px-6 py-3 rounded-xl cursor-not-allowed w-full sm:w-auto justify-center"
            >
              <ShoppingCart size={16} />
              <span>Select items to add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
