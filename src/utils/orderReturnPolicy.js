/**
 * Order Return & Exchange Policy Helpers
 * Accurately determines if an item or whole order is eligible for Return, Exchange, or both.
 */

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

  const cat = String(item.category || item.product?.category || '').toLowerCase();
  const hasSizes = Boolean(
    (item.size && String(item.size).trim() !== '') ||
    (item.sizeVariants && item.sizeVariants.length > 0) ||
    (item.product?.sizeVariants && item.product.sizeVariants.length > 0) ||
    (item.variants && item.variants.length > 0)
  );
  const isApparel = ['uniform', 'clothing', 'apparel', 'dress', 'shirt', 'pant', 'shoes', 'footwear', 'blazer', 'skirt', 'sweater'].some(c => cat.includes(c));

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
