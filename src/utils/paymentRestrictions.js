/**
 * Payment Restriction Utilities for Book Vardi Consumer Frontend
 * Evaluates seller and product payment method permissions.
 */

/**
 * Evaluates payment restrictions for a single product or cart item.
 * Supports cross-referencing with catalogProducts to get latest live settings.
 * Returns: { acceptsCod: boolean, acceptsOnline: boolean, allDisabled: boolean }
 */
export const getProductPaymentRestrictions = (product, catalogProducts = []) => {
  if (!product) return { acceptsCod: true, acceptsOnline: true, allDisabled: false };

  // Find corresponding catalog product if available to ensure live permissions
  const prodId = String(product.id || product._id || product.productId || '');
  const catalogProd = Array.isArray(catalogProducts) && catalogProducts.length > 0
    ? catalogProducts.find(
        (p) =>
          (prodId && String(p.id || p._id) === prodId) ||
          (product.name && p.name && p.name.trim().toLowerCase() === product.name.trim().toLowerCase())
      )
    : null;

  const resolved = catalogProd ? { ...product, ...catalogProd } : product;

  const rawPma = (
    resolved.paymentMethodAllowed ||
    resolved.payment_method_allowed ||
    resolved.paymentMethod ||
    resolved.seller?.paymentMethodAllowed ||
    resolved.seller?.payment_method_allowed ||
    ''
  );

  const pma = String(rawPma).toLowerCase().trim().replace(/[\s\-_]/g, '');

  let acceptsCod = true;
  let acceptsOnline = true;

  if (
    pma === 'onlineonly' ||
    pma === 'prepaidonly' ||
    pma === 'prepaid' ||
    pma === 'online' ||
    (pma.includes('online') && !pma.includes('cod') && !pma.includes('both'))
  ) {
    acceptsCod = false;
    acceptsOnline = true;
  } else if (
    pma === 'codonly' ||
    pma === 'cashonly' ||
    pma === 'cod' ||
    pma === 'cash' ||
    (pma.includes('cod') && !pma.includes('online') && !pma.includes('both'))
  ) {
    acceptsOnline = false;
    acceptsCod = true;
  } else if (
    pma === 'none' ||
    pma === 'disabled' ||
    pma === 'neither' ||
    pma === 'block' ||
    pma === 'blocked'
  ) {
    acceptsCod = false;
    acceptsOnline = false;
  }

  if (
    resolved.acceptsCod === false ||
    resolved.sellerAcceptsCod === false ||
    resolved.seller?.acceptsCod === false ||
    resolved.seller?.paymentMethods?.cod === false ||
    resolved.isCodAvailable === false ||
    resolved.codAvailable === false ||
    resolved.isCodAllowed === false ||
    resolved.codAllowed === false ||
    resolved.allowCod === false ||
    resolved.isPrepaidOnly === true ||
    resolved.prepaidOnly === true ||
    resolved.isOnlineOnly === true ||
    resolved.onlineOnly === true
  ) {
    acceptsCod = false;
  }

  if (
    resolved.acceptsOnline === false ||
    resolved.sellerAcceptsOnline === false ||
    resolved.seller?.acceptsOnline === false ||
    resolved.seller?.paymentMethods?.online === false ||
    resolved.isOnlineAvailable === false ||
    resolved.onlineAvailable === false ||
    resolved.isOnlineAllowed === false ||
    resolved.onlineAllowed === false ||
    resolved.allowOnline === false
  ) {
    acceptsOnline = false;
  }

  const allowedMethodsArray = (
    Array.isArray(resolved.paymentMethodsAllowed) ? resolved.paymentMethodsAllowed :
    Array.isArray(resolved.acceptedPaymentMethods) ? resolved.acceptedPaymentMethods :
    Array.isArray(resolved.paymentMethods) ? resolved.paymentMethods :
    Array.isArray(resolved.seller?.paymentMethodsAllowed) ? resolved.seller.paymentMethodsAllowed :
    Array.isArray(resolved.seller?.paymentMethods) ? resolved.seller.paymentMethods :
    null
  );

  if (allowedMethodsArray !== null) {
    const upperList = allowedMethodsArray.map((m) => String(m).toUpperCase().trim());
    if (upperList.length === 0) {
      acceptsCod = false;
      acceptsOnline = false;
    } else {
      const hasCod = upperList.some((m) => m.includes('COD') || m.includes('CASH'));
      const hasOnline = upperList.some((m) => m.includes('ONLINE') || m.includes('UPI') || m.includes('CARD') || m.includes('PREPAID') || m.includes('RAZORPAY'));
      if (!hasCod) acceptsCod = false;
      if (!hasOnline) acceptsOnline = false;
    }
  }

  return {
    acceptsCod,
    acceptsOnline,
    allDisabled: !acceptsCod && !acceptsOnline
  };
};

/**
 * Evaluates payment restrictions across an entire cart array.
 * Supports cross-referencing with catalogProducts to reflect latest live settings.
 */
export const getCartPaymentRestrictions = (cartItems = [], catalogProducts = []) => {
  let isCodDisabled = false;
  let isOnlineDisabled = false;
  let disabledCodReasonItem = null;
  let disabledOnlineReasonItem = null;
  let noPaymentMethodItem = null;

  for (const item of cartItems) {
    // Only check active/selected items
    if (item.selected === false) continue;

    const { acceptsCod, acceptsOnline } = getProductPaymentRestrictions(item, catalogProducts);

    if (!acceptsCod) {
      isCodDisabled = true;
      if (!disabledCodReasonItem) disabledCodReasonItem = item;
    }
    if (!acceptsOnline) {
      isOnlineDisabled = true;
      if (!disabledOnlineReasonItem) disabledOnlineReasonItem = item;
    }
    if (!acceptsCod && !acceptsOnline) {
      if (!noPaymentMethodItem) noPaymentMethodItem = item;
    }
  }

  return {
    isCodDisabled,
    isOnlineDisabled,
    areAllPaymentsDisabled: isCodDisabled && isOnlineDisabled,
    disabledCodReasonItem,
    disabledOnlineReasonItem,
    noPaymentMethodItem
  };
};
