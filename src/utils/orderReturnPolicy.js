/**
 * Order Return & Exchange Policy Helpers
 * Accurately determines if an item or whole order is eligible for Return, Exchange, or both,
 * and provides category-specific replacement sizing and variant choices.
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

  // Unstitched fabric sold per meter is eligible for length exchange
  if (isItemUnstitched(item)) {
    return true;
  }

  // Explicit flag check
  if (item.isExchangeable === true || item.product?.isExchangeable === true) {
    return true;
  }

  // All footwear, apparel, notebooks, books, and stationery items are eligible for exchange/replacement
  // unless explicitly configured with non-exchangeable policy above
  return true;
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

// -------------------------------------------------------------
// Sizing & Variant Constants
// -------------------------------------------------------------

export const KIDS_SHOE_SIZES = [
  '1 Kids', '2 Kids', '3 Kids', '4 Kids', '5 Kids',
  '6 Kids', '7 Kids', '8 Kids', '9 Kids', '10 Kids',
  '11 Kids', '12 Kids', '13 Kids'
];

export const SENIOR_SHOE_SIZES = [
  'Size 6 (UK/IND)', 'Size 7 (UK/IND)', 'Size 8 (UK/IND)', 'Size 9 (UK/IND)',
  'Size 10 (UK/IND)', 'Size 11 (UK/IND)', 'Size 12 (UK/IND)', 'Size 13 (UK/IND)'
];

export const WAIST_SIZES = [
  '24"', '26"', '28"', '30"', '32"', '34"', '36"', '38"', '40"'
];

export const STANDARD_APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export const KIDS_UNIFORM_SIZES = [
  'Size 22 (Age 4-5)', 'Size 24 (Age 5-6)', 'Size 26 (Age 6-7)', 'Size 28 (Age 7-8)',
  'Size 30 (Age 9-10)', 'Size 32 (Age 11-12)', 'Size 34 (Age 13-14)', 'Size 36 (Age 15-16)'
];

export const NOTEBOOK_RULING_TYPES = [
  'Single Line / Ruled',
  'Four Line (English)',
  'Square Grid / Math (Checkered)',
  'Unruled / Plain',
  'Interleaf (Science Practical)',
  'Two Line'
];

export const CLASS_GRADE_VARIANTS = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
  'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
];

export const PACK_SIZE_VARIANTS = [
  'Single Unit (1 Pc)',
  'Pack of 2',
  'Pack of 5',
  'Pack of 6',
  'Pack of 10',
  'Pack of 12'
];

export const DEFECT_REPLACEMENT_VARIANT = 'Same Item Replacement (Defective / Damaged / Misprinted)';

// -------------------------------------------------------------
// Category Classification Helper
// -------------------------------------------------------------

export const getItemCategoryType = (activeItem = {}, fetchedProduct = null) => {
  if (isItemUnstitched(activeItem) || isItemUnstitched(fetchedProduct)) {
    return 'unstitched';
  }

  const cat = String(activeItem?.category || fetchedProduct?.category || '').toLowerCase();
  const subCat = String(activeItem?.subCategory || fetchedProduct?.subCategory || '').toLowerCase();
  const name = String(activeItem?.name || fetchedProduct?.name || '').toLowerCase();
  const currentSize = String(activeItem?.size || '').toLowerCase().trim();

  // 1. Footwear
  if (cat.includes('shoe') || cat.includes('footwear') || subCat.includes('shoe') || name.includes('shoe') || name.includes('boot') || name.includes('sneaker') || name.includes('sandal')) {
    return 'footwear';
  }

  // 2. Notebooks & Registers
  if (name.includes('notebook') || name.includes('register') || name.includes('copy') || name.includes('ruled') || subCat.includes('notebook') || cat.includes('notebook')) {
    return 'stationery_notebook';
  }

  // 3. Books & Textbooks
  if (cat.includes('book') || cat.includes('ncert') || subCat.includes('book') || name.includes('textbook') || name.includes('syllabus') || name.includes('atlas') || name.includes('guide')) {
    return 'book';
  }

  // 4. General Stationery & Accessories
  if (cat.includes('stationery') || subCat.includes('stationery') || name.includes('pen') || name.includes('pencil') || name.includes('geometry') || name.includes('color') || name.includes('eraser') || name.includes('bag')) {
    return 'stationery_general';
  }

  // 5. Apparel Bottoms (Pants, Trousers, Shorts, Skirts)
  const isBottom = subCat.includes('pant') || subCat.includes('trouser') || subCat.includes('skirt') || subCat.includes('short') || subCat.includes('lower') ||
                   name.includes('pant') || name.includes('trouser') || name.includes('skirt') || name.includes('short') || name.includes('lower') ||
                   (/^\d{2}(")?$/.test(currentSize) && parseInt(currentSize, 10) >= 20 && parseInt(currentSize, 10) <= 46);
  if (isBottom) {
    return 'apparel_bottom';
  }

  // 6. Apparel Tops / Standard Uniforms
  const isTop = cat.includes('uniform') || cat.includes('apparel') || cat.includes('clothing') ||
                subCat.includes('ready to wear') || subCat.includes('winter') || subCat.includes('sports') ||
                name.includes('shirt') || name.includes('blazer') || name.includes('sweater') || name.includes('tshirt') || name.includes('t-shirt') || name.includes('suit') ||
                ['s', 'm', 'l', 'xl', 'xxl', 'xs', 'xxxl'].includes(currentSize);
  if (isTop) {
    return 'apparel_top';
  }

  return 'general';
};

// -------------------------------------------------------------
// Category Replacement Options Helper
// -------------------------------------------------------------

export const getCategoryReplacementOptions = (activeItem = {}, fetchedProduct = null) => {
  const catType = getItemCategoryType(activeItem, fetchedProduct);
  const currentSize = String(activeItem?.size || '').trim();

  // Collect any direct DB product sizeVariants
  const productVariants = fetchedProduct?.sizeVariants || fetchedProduct?.variants || activeItem?.sizeVariants || activeItem?.variants || [];
  const dbSizeOptions = (Array.isArray(productVariants) && productVariants.length > 0)
    ? productVariants.map(v => v.size || v.measureValue).filter(Boolean)
    : [];

  switch (catType) {
    case 'unstitched':
      return {
        categoryType: 'unstitched',
        tabs: [],
        primaryTab: 'fabric_length',
        productVariants
      };

    case 'footwear': {
      const isKids = /kids/i.test(currentSize) || (/^\d+$/.test(currentSize) && parseInt(currentSize, 10) <= 5);
      return {
        categoryType: 'footwear',
        primaryTab: isKids ? 'kids' : 'senior',
        tabs: [
          { id: 'kids', label: '👶 Kids Sizes (1 - 13 Kids)', options: KIDS_SHOE_SIZES },
          { id: 'senior', label: '👟 Adult / Senior Sizes (UK 6 - 13)', options: SENIOR_SHOE_SIZES }
        ],
        productVariants
      };
    }

    case 'apparel_bottom': {
      return {
        categoryType: 'apparel_bottom',
        primaryTab: 'waist',
        tabs: [
          { id: 'waist', label: '👖 Waist Sizes (24" - 40")', options: WAIST_SIZES },
          { id: 'standard', label: '👕 Standard Alpha (XS - 3XL)', options: STANDARD_APPAREL_SIZES }
        ],
        productVariants
      };
    }

    case 'apparel_top': {
      return {
        categoryType: 'apparel_top',
        primaryTab: dbSizeOptions.length > 0 ? 'configured' : 'standard',
        tabs: [
          ...(dbSizeOptions.length > 0 ? [{ id: 'configured', label: '🏷️ Available Sizes', options: dbSizeOptions }] : []),
          { id: 'standard', label: '👕 Standard Alpha (XS - 3XL)', options: STANDARD_APPAREL_SIZES },
          { id: 'kids_uniform', label: '🎓 School Uniform Number Sizes (22 - 36)', options: KIDS_UNIFORM_SIZES },
          { id: 'waist', label: '👖 Waist Sizes (24" - 40")', options: WAIST_SIZES }
        ],
        productVariants
      };
    }

    case 'stationery_notebook': {
      return {
        categoryType: 'stationery_notebook',
        primaryTab: 'ruling',
        tabs: [
          { id: 'ruling', label: '📝 Ruling / Line Type', options: NOTEBOOK_RULING_TYPES },
          { id: 'pack', label: '📦 Pack Size / Quantity', options: PACK_SIZE_VARIANTS },
          { id: 'defect', label: '🔄 Damaged Item Replacement', options: [DEFECT_REPLACEMENT_VARIANT] }
        ],
        productVariants
      };
    }

    case 'book': {
      return {
        categoryType: 'book',
        primaryTab: 'class',
        tabs: [
          { id: 'class', label: '📚 Class / Grade', options: CLASS_GRADE_VARIANTS },
          { id: 'defect', label: '🔄 Damaged / Misprint Replacement', options: [DEFECT_REPLACEMENT_VARIANT] }
        ],
        productVariants
      };
    }

    case 'stationery_general': {
      return {
        categoryType: 'stationery_general',
        primaryTab: 'pack',
        tabs: [
          { id: 'pack', label: '📦 Pack Size / Quantity', options: PACK_SIZE_VARIANTS },
          { id: 'defect', label: '🔄 Defective Item Replacement', options: [DEFECT_REPLACEMENT_VARIANT] }
        ],
        productVariants
      };
    }

    default: {
      return {
        categoryType: 'general',
        primaryTab: 'standard',
        tabs: [
          ...(dbSizeOptions.length > 0 ? [{ id: 'configured', label: 'Available Sizes', options: dbSizeOptions }] : []),
          { id: 'standard', label: 'Standard Sizes', options: STANDARD_APPAREL_SIZES },
          { id: 'defect', label: 'Damaged Replacement', options: [DEFECT_REPLACEMENT_VARIANT] }
        ],
        productVariants
      };
    }
  }
};

/**
 * Backward compatibility helper for simple size array lookups
 */
export const getCategoryReplacementSizes = (activeItem = {}, fetchedProduct = null) => {
  const optionsConfig = getCategoryReplacementOptions(activeItem, fetchedProduct);
  if (optionsConfig.categoryType === 'unstitched') return [];
  const primaryTabObj = optionsConfig.tabs.find(t => t.id === optionsConfig.primaryTab) || optionsConfig.tabs[0];
  return primaryTabObj?.options || STANDARD_APPAREL_SIZES;
};

export const formatSizeLabel = (sz) => {
  const str = String(sz || '').trim();
  if (!str) return '';
  if (/^size\s+/i.test(str)) return str;
  if (/kids/i.test(str)) return str;
  if (str.includes('"')) return `Waist ${str}`;
  if (str.includes('Class')) return str;
  if (str.includes('Pack') || str.includes('Unit')) return str;
  if (str.includes('Line') || str.includes('Ruled') || str.includes('Grid') || str.includes('Interleaf')) return str;
  if (str.includes('Replacement')) return str;
  return `Size ${str}`;
};
