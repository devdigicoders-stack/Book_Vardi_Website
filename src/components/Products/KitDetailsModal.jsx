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
  const getItemAvailableSizes = (item) => {
    if (!item) return [];
    if (Array.isArray(item.availableSizes) && item.availableSizes.length > 0) {
      return item.availableSizes.map(s => String(s).trim()).filter(Boolean);
    }
    if (Array.isArray(item.sizes) && item.sizes.length > 0) {
      return item.sizes.map(s => String(s).trim()).filter(Boolean);
    }
    if (item.productId && typeof item.productId === 'object') {
      if (Array.isArray(item.productId.sizes) && item.productId.sizes.length > 0) {
        return item.productId.sizes.map(s => String(s).trim()).filter(Boolean);
      }
      if (Array.isArray(item.productId.sizeVariants) && item.productId.sizeVariants.length > 0) {
        return item.productId.sizeVariants
          .map(v => typeof v === 'object' ? (v.size || v.measureValue) : v)
          .map(s => String(s).trim())
          .filter(Boolean);
      }
    }
    const match = (item.name || '').match(/\b(1[6-8]|2[0-9]|3[0-9]|4[0-4]|XS|S|M|L|XL|2XL|3XL)\b/i);
    const baseNum = parseInt(match ? match[1] : item.size);
    if (!isNaN(baseNum) && baseNum >= 18 && baseNum <= 42) {
      return ['20', '22', '24', '26', '28', '30', '32', '34', '36'].filter(
        s => Math.abs(parseInt(s) - baseNum) <= 8
      );
    }
    if (item.size && String(item.size).trim()) {
      return [String(item.size).trim()];
    }
    return [];
  };

  const kitItems = (kit.items || kit.kitItems || []).map((item, idx) => {
    const avSizes = getItemAvailableSizes(item);
    return {
      ...item,
      id: String(item.id || item._id || item.productId || `item-${idx}`),
      name: item.name || item.title || 'Constituent Item',
      price: Number(item.price !== undefined ? item.price : (item.unitPrice || 0)),
      originalPrice: Number(item.originalPrice !== undefined ? item.originalPrice : (item.mrp || item.unitPrice || 0)),
      quantity: Math.max(1, Number(item.quantity || 1)),
      size: item.size || avSizes[0] || '',
      availableSizes: avSizes,
      image: resolveImageUrl(item.image)
    };
  });

  const kitAvailableSizes = useMemo(() => {
    const set = new Set();
    if (Array.isArray(kit.sizes)) kit.sizes.forEach(s => set.add(String(s).trim()));
    if (Array.isArray(kit.availableSizes)) kit.availableSizes.forEach(s => set.add(String(s).trim()));
    kitItems.forEach(it => it.availableSizes.forEach(s => set.add(String(s).trim())));
    return Array.from(set).filter(Boolean).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [kit, kitItems]);

  const [kitItemSizes, setKitItemSizes] = useState(() => {
    const initial = {};
    kitItems.forEach(it => {
      initial[it.id] = it.size || it.availableSizes[0] || '';
    });
    return initial;
  });

  const [selectedMasterSize, setSelectedMasterSize] = useState(() => {
    return kitAvailableSizes[0] || null;
  });

  const handleSelectMasterSize = (sz) => {
    setSelectedMasterSize(sz);
    setKitItemSizes(prev => {
      const updated = { ...prev };
      kitItems.forEach(it => {
        if (it.availableSizes.includes(sz)) {
          updated[it.id] = sz;
        }
      });
      return updated;
    });
  };

  const handleItemSizeChange = (itemId, sz) => {
    setKitItemSizes(prev => ({
      ...prev,
      [itemId]: sz
    }));
  };

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
      .map((item) => {
        const sz = kitItemSizes[item.id] || item.size || item.availableSizes?.[0] || '';
        return {
          ...item,
          quantity: itemQuantities[item.id] || 1,
          size: sz,
          selectedSize: sz
        };
      });

    const bundleItems = selectedProducts.length ? selectedProducts : kitItems.map(item => ({
      ...item,
      size: kitItemSizes[item.id] || item.size || '',
      selectedSize: kitItemSizes[item.id] || item.size || ''
    }));
    const bundlePrice = isCustomized ? subtotal : kitPrice;

    const sizeSummary = bundleItems
      .filter(it => it.size)
      .map(it => `${it.name.replace(/\s*\(\d+\)/, '')}: Size ${it.size}`)
      .join(', ');

    addToCart({
      ...kit,
      id: isCustomized ? `kit-${kitId}-${selectedIds.slice().sort().join('-')}-${selectedMasterSize || 'std'}` : `${kitId}-${selectedMasterSize || 'std'}`,
      kitId: kitId,
      name: isCustomized ? `${kitName} (Custom Bundle)` : `${kitName} (Full Bundle)`,
      price: bundlePrice,
      kitItems: bundleItems,
      selectedSize: selectedMasterSize ? `Size ${selectedMasterSize}` : (bundleItems[0]?.size ? `Size ${bundleItems[0].size}` : 'Standard'),
      variantName: sizeSummary || (selectedMasterSize ? `Kit Size ${selectedMasterSize}` : 'Standard Kit'),
      kitSizeSummary: sizeSummary,
      isCustomized: Boolean(isCustomized),
      isFullBundle: !isCustomized,
      category: 'kits',
      bundleType: 'kit'
    }, 1);
    onClose();
  };

  const handleBuyFullKit = () => {
    const bundleItems = kitItems.map(item => ({
      ...item,
      size: kitItemSizes[item.id] || item.size || item.availableSizes?.[0] || '',
      selectedSize: kitItemSizes[item.id] || item.size || item.availableSizes?.[0] || ''
    }));

    const sizeSummary = bundleItems
      .filter(it => it.size)
      .map(it => `${it.name.replace(/\s*\(\d+\)/, '')}: Size ${it.size}`)
      .join(', ');

    addToCart({
      ...kit,
      id: `${kitId}-${selectedMasterSize || 'std'}`,
      kitId: kitId,
      name: `${kitName} (Full Bundle)`,
      price: kitPrice,
      image: kitImage,
      category: 'kits',
      bundleType: 'kit',
      kitItems: bundleItems,
      selectedSize: selectedMasterSize ? `Size ${selectedMasterSize}` : (bundleItems[0]?.size ? `Size ${bundleItems[0].size}` : 'Standard'),
      variantName: sizeSummary || (selectedMasterSize ? `Kit Size ${selectedMasterSize}` : 'Standard Kit'),
      kitSizeSummary: sizeSummary,
      isCustomized: false,
      isFullBundle: true
    }, 1);
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

            {/* Master Kit Size Selector */}
            {kitAvailableSizes.length > 0 && (
              <div className="p-3 bg-teal-50/50 rounded-xl border border-brand-teal/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand-teal flex items-center gap-1.5">
                    <Sparkles size={13} className="text-brand-yellow" />
                    <span>Select Kit Uniform Size:</span>
                    {selectedMasterSize && (
                      <span className="text-xs font-black bg-brand-teal text-white px-2 py-0.5 rounded-md">
                        Size {selectedMasterSize}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500">
                    Applies to all bundle items
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {kitAvailableSizes.map((sz) => {
                    const isSel = String(selectedMasterSize) === String(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleSelectMasterSize(sz)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                          isSel
                            ? 'bg-brand-teal text-white shadow-xs ring-2 ring-brand-teal/30 scale-105'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        Size {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {kitItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const itemQty = itemQuantities[item.id] || 1;
                const itemLineTotal = item.price * itemQty;
                const currentItemSize = kitItemSizes[item.id] || item.size || item.availableSizes?.[0] || '';

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
                      className="flex items-start sm:items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <div className={`w-5 h-5 mt-0.5 sm:mt-0 rounded-md border flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-teal border-brand-teal text-white' : 'border-gray-300 bg-white'}`}>
                        <Check size={12} />
                      </div>
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded border border-gray-100 object-cover shrink-0" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=150&auto=format&fit=crop&q=80'; }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{item.name}</p>
                        
                        {/* Item Size Modifier */}
                        {item.availableSizes && item.availableSizes.length > 0 ? (
                          <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Size:</span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {item.availableSizes.map((sz) => {
                                const isItemSzSel = String(currentItemSize) === String(sz);
                                return (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleItemSizeChange(item.id, sz);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                      isItemSzSel
                                        ? 'bg-brand-teal text-white font-black'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                            Unit Price: ₹{item.price.toFixed(2)} {currentItemSize ? `• Size: ${currentItemSize}` : ''}
                          </p>
                        )}
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
