import React, { useState } from 'react';
import { X, Check, ShoppingCart, Info } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { resolveImageUrl } from '../../utils/api';

export default function KitDetailsModal({ isOpen, onClose, kit }) {
  const { addToCart, openProductDetails } = useCart();

  if (!isOpen || !kit) return null;
  const appStat = String(kit.approvalStatus || kit.approval_status || '').trim().toLowerCase();
  if (appStat !== 'approved' || kit.isDeleted || kit.status === 'deleted' || kit.status === 'inactive') return null;

  const kitId = kit.id || kit._id || 'kit';
  const kitItems = (kit.items || kit.kitItems || []).map((item, idx) => ({
    ...item,
    id: String(item.id || item._id || item.productId || `item-${idx}`),
    name: item.name || item.title || 'Constituent Item',
    price: Number(item.price !== undefined ? item.price : (item.unitPrice || 0)),
    originalPrice: Number(item.originalPrice !== undefined ? item.originalPrice : (item.mrp || item.unitPrice || 0)),
    quantity: Math.max(1, Number(item.quantity || 1)),
    image: resolveImageUrl(item.image)
  }));

  const kitName = kit.name || kit.title || 'School Combo Kit';
  const kitSchool = kit.school || kit.schoolName || '';
  const kitClass = kit.className || kit.classGrade || '';
  const kitPrice = Number(kit.bundlePrice !== undefined ? kit.bundlePrice : (kit.price || 0));
  const kitOriginalPrice = Number(kit.totalMrp !== undefined ? kit.totalMrp : (kit.mrp !== undefined ? kit.mrp : (kit.originalPrice || 0)));
  const kitImage = resolveImageUrl(kit.image || (Array.isArray(kit.images) && kit.images.length > 0 ? kit.images[0] : ''));
  const kitSubtitle = kit.subtitle || kit.description || '';
  const discountBadge = kit.discountBadge || (kitOriginalPrice > kitPrice ? `${Math.round(((kitOriginalPrice - kitPrice) / kitOriginalPrice) * 100)}% OFF` : null);

  const [selectedItems, setSelectedItems] = useState(() => ({
    [kitId]: kitItems.map(i => i.id)
  }));

  const [itemQuantities, setItemQuantities] = useState(() => {
    const initialQty = {};
    kitItems.forEach(item => {
      initialQty[item.id] = item.quantity || 1;
    });
    return initialQty;
  });

  const toggleItem = (itemId) => {
    setSelectedItems((prev) => {
      const current = prev[kitId] || [];
      const next = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];
      return { ...prev, [kitId]: next };
    });
  };

  const updateQuantity = (itemId, delta) => {
    setItemQuantities((prev) => {
      const currentQty = prev[itemId] || 1;
      const nextQty = Math.max(1, currentQty + delta);
      return { ...prev, [itemId]: nextQty };
    });
  };

  const selectedIds = selectedItems[kitId] || [];

  // Determine if the user has customized the bundle (selected subset or modified quantities)
  const isCustomized = selectedIds.length !== kitItems.length || kitItems.some(i => (itemQuantities[i.id] || 1) !== i.quantity);

  const subtotal = kitItems
    .filter((item) => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + (item.price * (itemQuantities[item.id] || 1)), 0);

  const subtotalOriginal = kitItems
    .filter((item) => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + ((item.originalPrice || item.price) * (itemQuantities[item.id] || 1)), 0);

  // Auto-calculated effective price
  const effectivePrice = isCustomized ? subtotal : kitPrice;
  const effectiveOriginalPrice = isCustomized ? subtotalOriginal : kitOriginalPrice;

  const handleAddSelected = () => {
    const selectedProducts = kitItems
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => ({
        ...item,
        quantity: itemQuantities[item.id] || 1
      }));

    const bundleItems = selectedProducts.length ? selectedProducts : kitItems;
    const bundlePrice = isCustomized ? subtotal : kitPrice;

    addToCart({
      ...kit,
      id: isCustomized ? `kit-${kitId}-${selectedIds.slice().sort().join('-')}` : kitId,
      name: isCustomized ? `${kitName} (Custom Bundle)` : `${kitName} (Full Bundle)`,
      price: bundlePrice,
      kitItems: bundleItems,
      bundleType: 'kit'
    }, 1);
    onClose();
  };

  const handleBuyFullKit = () => {
    addToCart({ ...kit, id: kitId, name: kitName, price: kitPrice, image: kitImage, category: 'kits', bundleType: 'kit' }, 1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded uppercase">{kitSchool}</span>
              <span className="text-[10px] font-bold text-brand-pink">{kitClass}</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">{kitName}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors self-start cursor-pointer text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="w-full sm:w-32 shrink-0">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200/80">
                <img src={kitImage} alt={kitName} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=150&auto=format&fit=crop&q=80'; }} />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {kitSubtitle && (
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{kitSubtitle}</p>
              )}
              
              <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  <strong>Interactive Kit Customization:</strong> Select or deselect items below to auto-calculate your customized bundle price in real-time.
                </p>
              </div>

              {/* Dynamic Auto-Calculated Price Display */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
                    {isCustomized ? 'Auto-Calculated Custom Price' : 'Full Bundle Offer Price'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`text-2xl font-black font-mono ${isCustomized ? 'text-emerald-700' : 'text-brand-teal'}`}>
                      ₹{effectivePrice.toFixed(2)}
                    </span>
                    {effectiveOriginalPrice > effectivePrice && (
                      <span className="text-xs text-gray-400 line-through font-mono">
                        ₹{effectiveOriginalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {isCustomized ? (
                    <span className="inline-block text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ⚡ Customized Pack
                    </span>
                  ) : discountBadge ? (
                    <span className="inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-brand-pink text-white">
                      {discountBadge}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-2">
                <span>Constituent Kit Articles</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                  {selectedIds.length} of {kitItems.length} selected
                </span>
              </h3>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (selectedIds.length === kitItems.length) {
                      setSelectedItems({ ...selectedItems, [kitId]: [] });
                    } else {
                      setSelectedItems({ ...selectedItems, [kitId]: kitItems.map(i => i.id) });
                    }
                  }}
                  className="text-xs font-bold text-brand-teal hover:underline cursor-pointer"
                >
                  {selectedIds.length === kitItems.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {kitItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const itemQty = itemQuantities[item.id] || 1;
                const itemLineTotal = item.price * itemQty;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between w-full rounded-xl border p-3 transition-all ${
                      isSelected
                        ? 'border-brand-teal/80 bg-teal-50/30 shadow-2xs'
                        : 'border-gray-200 bg-white opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div 
                      onClick={() => toggleItem(item.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-teal border-brand-teal text-white' : 'border-gray-300 bg-white'}`}>
                        <Check size={12} />
                      </div>
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded border border-gray-100 object-cover shrink-0" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=150&auto=format&fit=crop&q=80'; }} />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          Unit Price: ₹{item.price.toFixed(2)} {item.size ? `• Size: ${item.size}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      {isSelected && (
                        <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, -1);
                            }}
                            className="px-2 py-1 hover:bg-gray-100 text-gray-600 font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="px-2 font-mono text-xs font-extrabold text-gray-900">{itemQty}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, 1);
                            }}
                            className="px-2 py-1 hover:bg-gray-100 text-gray-600 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      )}

                      <span className={`font-mono text-xs font-extrabold ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                        ₹{itemLineTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex flex-col sm:flex-row gap-3 justify-end items-center shrink-0">
          <button
            onClick={() => {
              onClose();
              openProductDetails(kit);
            }}
            className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-2xs w-full sm:w-auto justify-center sm:mr-auto cursor-pointer"
          >
            More Details
          </button>
          
          {selectedIds.length === 0 ? (
            <button
              disabled
              className="inline-flex items-center gap-2 bg-gray-200 text-gray-500 font-bold px-6 py-2.5 rounded-xl cursor-not-allowed text-xs w-full sm:w-auto justify-center"
            >
              <ShoppingCart size={15} />
              <span>Select items to customize bundle</span>
            </button>
          ) : isCustomized ? (
            <button
              onClick={handleAddSelected}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center cursor-pointer"
            >
              <ShoppingCart size={15} />
              <span>Add Customized Pack (₹{effectivePrice.toFixed(2)})</span>
            </button>
          ) : (
            <button
              onClick={handleBuyFullKit}
              className="inline-flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-black px-6 py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 w-full sm:w-auto justify-center cursor-pointer"
            >
              <ShoppingCart size={15} />
              <span>Add Full Bundle (₹{kitPrice.toFixed(2)})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
