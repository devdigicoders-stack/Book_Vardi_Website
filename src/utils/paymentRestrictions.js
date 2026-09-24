/**
 * Payment Restriction Utilities for Book Vardi Consumer Frontend
 * Evaluates seller and product payment method permissions.
 */

/**
 * Evaluates payment restrictions for a single product.
 * Returns: { acceptsCod: boolean, acceptsOnline: boolean, allDisabled: boolean }
 */
export const getProductPaymentRestrictions = (product) => {
  if (!product) return { acceptsCod: true, acceptsOnline: true, allDisabled: false };

  const rawPma = (
    product.paymentMethodAllowed ||
    product.payment_method_allowed ||
    product.paymentMethod ||
    product.seller?.paymentMethodAllowed ||
    product.seller?.payment_method_allowed ||
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
  } else if (
    pma === 'codonly' ||
    pma === 'cashonly' ||
    pma === 'cod' ||
    pma === 'cash' ||
    (pma.includes('cod') && !pma.includes('online') && !pma.includes('both'))
  ) {
    acceptsOnline = false;
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
    product.acceptsCod === false ||
    product.sellerAcceptsCod === false ||
    product.seller?.acceptsCod === false ||
    product.seller?.paymentMethods?.cod === false ||
    product.isCodAvailable === false ||
    product.codAvailable === false ||
    product.isCodAllowed === false ||
    product.codAllowed === false ||
    product.allowCod === false ||
    product.isPrepaidOnly === true ||
    product.prepaidOnly === true ||
    product.isOnlineOnly === true ||
    product.onlineOnly === true
  ) {
    acceptsCod = false;
  }

  if (
    product.acceptsOnline === false ||
    product.sellerAcceptsOnline === false ||
    product.seller?.acceptsOnline === false ||
    product.seller?.paymentMethods?.online === false ||
    product.isOnlineAvailable === false ||
    product.onlineAvailable === false ||
    product.isOnlineAllowed === false ||
    product.onlineAllowed === false ||
    product.allowOnline === false
  ) {
    acceptsOnline = false;
  }

  const allowedMethodsArray = (
    Array.isArray(product.paymentMethodsAllowed) ? product.paymentMethodsAllowed :
    Array.isArray(product.acceptedPaymentMethods) ? product.acceptedPaymentMethods :
    Array.isArray(product.paymentMethods) ? product.paymentMethods :
    Array.isArray(product.seller?.paymentMethodsAllowed) ? product.seller.paymentMethodsAllowed :
    Array.isArray(product.seller?.paymentMethods) ? product.seller.paymentMethods :
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
 */
export const getCartPaymentRestrictions = (cartItems = []) => {
  let isCodDisabled = false;
  let isOnlineDisabled = false;
  let disabledCodReasonItem = null;
  let disabledOnlineReasonItem = null;
  let noPaymentMethodItem = null;

  for (const item of cartItems) {
    // Only check active/selected items
    if (item.selected === false) continue;

    const { acceptsCod, acceptsOnline } = getProductPaymentRestrictions(item);

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
