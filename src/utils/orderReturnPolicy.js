/**
 * Order Return & Exchange Policy Helpers
 * Accurately determines if an item or whole order is eligible for Return, Exchange, or both,
 * and provides category-specific replacement sizing.
 */

export const isItemUnstitched = (item) => {
  if (!item) return false;
  return Boolean(
    item.isMeterBased ||
    item.product?.isMeterBased ||
    item.unit === 'meter' ||
    item.product?.unit === 'meter' ||
    String(item.category || item.product?.category || '').toLowerCase().includes('unstitched') ||
    String(item.subCategory || item.product?.subCategory || '').toLowerCase().includes('unstitched') ||
    String(item.name || item.product?.name || '').toLowerCase().includes('unstitched')
  );
};

export const isItemReturnable = (item) => {
  if (!item) return false;
  const policy = String(item.returnPolicy || item.product?.returnPolicy || '').toLowerCase().trim();
  if (['non_returnable', 'non-returnable', 'no_return', 'exchange_only', 'exchange_only_policy'].includes(policy)) return false;
  if (item.isReturnable === false || item.product?.isReturnable === false) return false;
  return item.isReturnable === true || item.product?.isReturnable === true || (item.isReturnable ?? item.product?.isReturnable ?? true);
};

export const isItemExchangeable = (item) => {
  if (!item) return false;
  const policy = String(item.returnPolicy || item.product?.returnPolicy || '').toLowerCase().trim();
  if (['non_returnable', 'non-returnable', 'no_return', 'return_only', 'return_only_policy'].includes(policy)) return false;
  if (item.isExchangeable === false || item.product?.isExchangeable === false) return false;

  // Unstitched fabric sold per meter has no garment sizes (S, M, L, etc.) to exchange
  if (isItemUnstitched(item)) {
    const hasExplicitVariants = (Array.isArray(item.sizeVariants) && item.sizeVariants.length > 1) ||
                                (Array.isArray(item.product?.sizeVariants) && item.product?.sizeVariants.length > 1);
    if (!hasExplicitVariants) {
      return false;
    }
  }

  const cat = String(item.category || item.product?.category || '').toLowerCase();
  const subCat = String(item.subCategory || item.product?.subCategory || '').toLowerCase();
  const hasSizes = Boolean(
    (item.size && String(item.size).trim() !== '') ||
    (item.sizeVariants && item.sizeVariants.length > 0) ||
    (item.product?.sizeVariants && item.product.sizeVariants.length > 0) ||
    (item.variants && item.variants.length > 0)
  );
  const isApparel = ['uniform', 'clothing', 'apparel', 'dress', 'shirt', 'pant', 'shoes', 'footwear', 'blazer', 'skirt', 'sweater', 'sock'].some(c => cat.includes(c) || subCat.includes(c));

  // If item or product explicitly configured isExchangeable: true
  if (item.isExchangeable === true || item.product?.isExchangeable === true) {
    // If it's explicitly stationery or books with NO size/variants, exchange cannot be fulfilled
    if (!isApparel && !hasSizes && (cat.includes('stationery') || cat.includes('book') || cat.includes('ncert'))) {
      return false;
    }
    return true;
  }

  // If undefined / not explicitly configured:
  // Default to true ONLY if apparel or item has sizes/variants
  return isApparel || hasSizes;
};

export const getReturnExchangeAvailability = (isRet, isExc, tillDateStr, daysLeft = 0) => {
  if (isRet && isExc) {
    return {
      availableText: `Return / Exchange available till ${tillDateStr}${daysLeft > 0 ? ` (${daysLeft} days left)` : ''}`,
      closedText: `Return / Exchange window closed on ${tillDateStr}`,
      actionLabel: 'Return or Exchange',
      shortLabel: 'Return / Exchange',
      mode: 'both'
    };
  }
  if (isRet) {
    return {
      availableText: `Return available till ${tillDateStr}${daysLeft > 0 ? ` (${daysLeft} days left)` : ''}`,
      closedText: `Return window closed on ${tillDateStr}`,
      actionLabel: 'Return',
      shortLabel: 'Return',
      mode: 'return_only'
    };
  }
  if (isExc) {
    return {
      availableText: `Exchange available till ${tillDateStr}${daysLeft > 0 ? ` (${daysLeft} days left)` : ''}`,
      closedText: `Exchange window closed on ${tillDateStr}`,
      actionLabel: 'Exchange',
      shortLabel: 'Exchange',
      mode: 'exchange_only'
    };
  }
  return {
    availableText: 'Non-Returnable & Non-Exchangeable Product Policy',
    closedText: 'Non-Returnable & Non-Exchangeable Product Policy',
    actionLabel: '',
    shortLabel: 'Non-Returnable',
    mode: 'none'
  };
};

export const KIDS_SHOE_SIZES = [
  '1 Kids', '2 Kids', '3 Kids', '4 Kids', '5 Kids',
  '6 Kids', '7 Kids', '8 Kids', '9 Kids', '10 Kids',
  '11 Kids', '12 Kids', '13 Kids'
];

export const SENIOR_SHOE_SIZES = [
  'Size 6', 'Size 7', 'Size 8', 'Size 9', 'Size 10', 'Size 11', 'Size 12', 'Size 13'
];

export const WAIST_SIZES = ['24', '26', '28', '30', '32', '34', '36', '38'];

export const STANDARD_APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const getCategoryReplacementSizes = (activeItem = {}, fetchedProduct = null) => {
  // 1. Prefer database sizeVariants if configured
  const productVariants = fetchedProduct?.sizeVariants || fetchedProduct?.variants || activeItem?.sizeVariants || activeItem?.variants || [];
  if (Array.isArray(productVariants) && productVariants.length > 0) {
    const extracted = productVariants.map(v => v.size || v.measureValue).filter(Boolean);
    if (extracted.length > 0) return extracted;
  }

  // 2. Unstitched fabric has no garment sizes
  if (isItemUnstitched(activeItem) || isItemUnstitched(fetchedProduct)) {
    return [];
  }

  const cat = String(activeItem?.category || fetchedProduct?.category || '').toLowerCase();
  const subCat = String(activeItem?.subCategory || fetchedProduct?.subCategory || '').toLowerCase();
  const name = String(activeItem?.name || fetchedProduct?.name || '').toLowerCase();
  const currentSize = String(activeItem?.size || '').trim();

  // 3. Footwear / Shoes
  const isFootwear = cat.includes('shoe') || cat.includes('footwear') || subCat.includes('shoe') || name.includes('shoe') || name.includes('boot') || name.includes('sneaker');
  if (isFootwear) {
    const isKidsSize = /kids/i.test(currentSize) || (/^\d+$/.test(currentSize) && Number(currentSize) <= 5);
    const isSeniorSize = /^size\s*[6-9]|1[0-3]/i.test(currentSize) || (/^[6-9]|1[0-3]$/.test(currentSize));

    if (isKidsSize) return KIDS_SHOE_SIZES;
    if (isSeniorSize) return SENIOR_SHOE_SIZES;
    return [...KIDS_SHOE_SIZES, ...SENIOR_SHOE_SIZES];
  }

  // 4. Waist / Bottoms (Pants, Trousers, Shorts, Skirts)
  const isBottom = subCat.includes('pant') || subCat.includes('trouser') || subCat.includes('skirt') || subCat.includes('short') ||
                   name.includes('pant') || name.includes('trouser') || name.includes('skirt') || name.includes('short') ||
                   (/^\d{2}$/.test(currentSize) && Number(currentSize) >= 20 && Number(currentSize) <= 46);
  if (isBottom) {
    return WAIST_SIZES;
  }

  // 5. Standard Stitched Apparel (Shirts, Blazers, Sweaters, Tops)
  const isStandardApparel = cat.includes('uniform') || cat.includes('apparel') || cat.includes('clothing') ||
                            subCat.includes('ready to wear') || subCat.includes('winter') || subCat.includes('sports') ||
                            name.includes('shirt') || name.includes('blazer') || name.includes('sweater') || name.includes('tshirt') || name.includes('t-shirt') ||
                            ['s', 'm', 'l', 'xl', 'xxl', 'xs', 'xxxl'].includes(currentSize.toLowerCase());
  if (isStandardApparel) {
    return STANDARD_APPAREL_SIZES;
  }

  // 6. Non-size goods (Books, Stationery, Bags)
  if (cat.includes('book') || cat.includes('stationery') || cat.includes('bag') || cat.includes('kit')) {
    return [];
  }

  // Fallback for general items with size
  if (currentSize) {
    return [currentSize, ...STANDARD_APPAREL_SIZES];
  }

  return STANDARD_APPAREL_SIZES;
};

export const formatSizeLabel = (sz) => {
  const str = String(sz || '').trim();
  if (!str) return '';
  if (/^size\s+/i.test(str)) return str;
  if (/kids/i.test(str)) return str;
  return `Size ${str}`;
};
