import React from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  FileText, 
  Lock,
  DollarSign,
  Truck,
  RotateCcw,
  Clock
} from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=150&auto=format&fit=crop&q=80';

export function numberToWords(amount) {
  if (isNaN(amount) || amount <= 0) return 'Zero Rupees Only';
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function numToWordsUnderThousand(n) {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }

  const rounded = Math.round(amount);
  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded % 10000000) / 100000);
  const thousand = Math.floor((rounded % 100000) / 1000);
  const remainder = rounded % 1000;

  let words = '';
  if (crore > 0) words += numToWordsUnderThousand(crore) + ' Crore ';
  if (lakh > 0) words += numToWordsUnderThousand(lakh) + ' Lakh ';
  if (thousand > 0) words += numToWordsUnderThousand(thousand) + ' Thousand ';
  if (remainder > 0) words += numToWordsUnderThousand(remainder);

  return (words.trim() ? words.trim() : 'Zero') + ' Rupees Only';
}

export function getProductGstRate(item) {
  const explicitGst = item?.gstPercent ?? item?.gstPercentage ?? item?.gstRate ?? item?.gst ?? item?.taxRate ?? item?.productId?.gstPercent ?? item?.productId?.gstRate ?? item?.productId?.gst ?? item?.productId?.gstPercentage ?? item?.productId?.taxRate;
  if (explicitGst !== undefined && explicitGst !== null && String(explicitGst).trim() !== '' && !isNaN(Number(explicitGst))) {
    return Number(explicitGst);
  }
  const cat = String(item?.category || item?.productId?.category || '').toLowerCase();
  const name = String(item?.name || item?.productName || item?.productId?.name || '').toLowerCase();
  if (cat.includes('book') || name.includes('book') || cat.includes('textbook') || name.includes('textbook')) {
    return 0;
  }
  return 5;
}

export const GST_STATE_CODES = {
  '01': 'jammu_kashmir', '02': 'himachal_pradesh', '03': 'punjab', '04': 'chandigarh',
  '05': 'uttarakhand', '06': 'haryana', '07': 'delhi', '08': 'rajasthan',
  '09': 'uttar_pradesh', '10': 'bihar', '11': 'sikkim', '12': 'arunachal_pradesh',
  '13': 'manipur', '14': 'nagaland', '15': 'mizoram', '16': 'tripura',
  '17': 'meghalaya', '18': 'assam', '19': 'west_bengal', '20': 'jharkhand',
  '21': 'odisha', '22': 'chhattisgarh', '23': 'madhya_pradesh', '24': 'gujarat',
  '27': 'maharashtra', '29': 'karnataka', '30': 'goa', '32': 'kerala',
  '33': 'tamil_nadu', '36': 'telangana', '37': 'andhra_pradesh'
};

export const PINCODE_PREFIX_MAP = [
  { regex: /^(20|21|22|23|24[0-7]|25|26[12]|27|28)/, key: 'uttar_pradesh', name: 'Uttar Pradesh' },
  { regex: /^(24[89]|26[3-9])/, key: 'uttarakhand', name: 'Uttarakhand' },
  { regex: /^11/, key: 'delhi', name: 'Delhi' },
  { regex: /^(12|13)/, key: 'haryana', name: 'Haryana' },
  { regex: /^(14|15|16)/, key: 'punjab', name: 'Punjab' },
  { regex: /^3[0-4]/, key: 'rajasthan', name: 'Rajasthan' },
  { regex: /^3[6-9]/, key: 'gujarat', name: 'Gujarat' },
  { regex: /^4[0-4]/, key: 'maharashtra', name: 'Maharashtra' },
  { regex: /^4[5-9]/, key: 'madhya_pradesh', name: 'Madhya Pradesh' },
  { regex: /^5[0-3]/, key: 'telangana', name: 'Telangana' },
  { regex: /^5[6-9]/, key: 'karnataka', name: 'Karnataka' },
  { regex: /^6[0-4]/, key: 'tamil_nadu', name: 'Tamil Nadu' },
  { regex: /^6[7-9]/, key: 'kerala', name: 'Kerala' },
  { regex: /^7[0-4]/, key: 'west_bengal', name: 'West Bengal' },
  { regex: /^8[0-5]/, key: 'bihar', name: 'Bihar' }
];

export const INDIAN_STATES = [
  {
    key: 'uttar_pradesh',
    name: 'Uttar Pradesh',
    aliases: [
      'uttar pradesh', 'uttarpradesh', 'utter pradesh', 'utterpradesh', 'uttarpardesh', 'uttar pardesh', 'uttar prdesh', 'uttarprdesh', 'u.p.', 'u.p', 'up', 'u p',
      'lucknow', 'kanpur', 'varanasi', 'mirzapur', 'behat', 'saharanpur', 'noida', 'greater noida', 'ghaziabad', 'agra', 'prayagraj', 'allahabad', 'gorakhpur', 'meerut', 'bareilly', 'aligarh', 'moradabad', 'jhansi', 'ayodhya', 'faizabad', 'azamgarh', 'muzaffarnagar', 'mathura', 'firozabad', 'bulandshahr', 'sambhal', 'amroha', 'hardoi', 'fatehpur', 'raebareli', 'sitapur', 'bahraich', 'gonda', 'basti', 'deoria', 'ballia', 'jaunpur', 'ghazipur', 'chandauli', 'bhadohi', 'sonbhadra', 'unnao', 'lakhimpur', 'pilibhit', 'shahjahanpur', 'budaun', 'rampur', 'bijnor', 'shamli', 'baghpat', 'hapur', 'kasganj', 'hathras', 'etah', 'mainpuri', 'etawah', 'auraiya', 'kannauj', 'farrukhabad', 'kanpur dehat', 'jalaun', 'hamirpur', 'mahoba', 'banda', 'chitrakoot', 'kaushambi', 'pratapgarh', 'amethi', 'sultanpur', 'barabanki', 'shravasti', 'balrampur', 'siddharthnagar', 'sant kabir nagar', 'maharajganj', 'kushinagar', 'mau', 'lalitpur'
    ]
  },
  {
    key: 'maharashtra',
    name: 'Maharashtra',
    aliases: [
      'maharashtra', 'maharastra', 'maharashtr', 'maharastr', 'maha rashtra', 'maha rastra', 'maharasthra', 'maharashtra state', 'm.h.', 'mh', 'm h',
      'mumbai', 'bombay', 'pune', 'nagpur', 'thane', 'navi mumbai', 'nashik', 'aurangabad', 'chhatrapati sambhaji nagar', 'solapur', 'kolhapur', 'amravati', 'nanded', 'jalgaon', 'akola', 'latur', 'dhule', 'ahmednagar', 'chandrapur', 'parbhani', 'panvel', 'kalyan', 'dombivli', 'vasai', 'virar', 'mira bhayandar', 'ulhasnagar', 'satara'
    ]
  },
  { key: 'delhi', name: 'Delhi', aliases: ['delhi', 'new delhi', 'nct of delhi', 'nct', 'dl', 'newdelhi', 'd.l.'] },
  { key: 'uttarakhand', name: 'Uttarakhand', aliases: ['uttarakhand', 'uttaranchal', 'dehradun', 'haridwar', 'roorkee', 'rishikesh', 'nainital', 'haldwani', 'uk', 'u.k.'] },
  { key: 'karnataka', name: 'Karnataka', aliases: ['karnataka', 'karnatka', 'karnatak', 'bangalore', 'bengaluru', 'mysore', 'mysuru', 'ka', 'k.a.', 'hubli', 'mangalore', 'mangaluru'] },
  { key: 'tamil_nadu', name: 'Tamil Nadu', aliases: ['tamil nadu', 'tamilnadu', 'tamil nad', 'chennai', 'madras', 'coimbatore', 'madurai', 'tn', 't.n.'] },
  { key: 'haryana', name: 'Haryana', aliases: ['haryana', 'hariyana', 'gurugram', 'gurgaon', 'faridabad', 'panipat', 'ambala', 'hr', 'h.r.'] },
  { key: 'rajasthan', name: 'Rajasthan', aliases: ['rajasthan', 'rajisthan', 'rajashtan', 'jaipur', 'jodhpur', 'udaipur', 'kota', 'bikaner', 'rj', 'r.j.'] },
  { key: 'west_bengal', name: 'West Bengal', aliases: ['west bengal', 'westbengal', 'paschim banga', 'kolkata', 'calcutta', 'howrah', 'siliguri', 'wb', 'w.b.'] },
  { key: 'gujarat', name: 'Gujarat', aliases: ['gujarat', 'gujrat', 'gujarath', 'ahmedabad', 'amdavad', 'surat', 'vadodara', 'baroda', 'rajkot', 'gj', 'g.j.'] },
  { key: 'punjab', name: 'Punjab', aliases: ['punjab', 'panjab', 'ludhiana', 'amritsar', 'jalandhar', 'pb', 'p.b.'] },
  { key: 'madhya_pradesh', name: 'Madhya Pradesh', aliases: ['madhya pradesh', 'madhyapradesh', 'madhya pardesh', 'bhopal', 'indore', 'gwalior', 'jabalpur', 'mp', 'm.p.'] },
  { key: 'bihar', name: 'Bihar', aliases: ['bihar', 'patna', 'gaya', 'bhagalpur', 'muzaffarpur', 'br', 'b.r.'] },
  { key: 'telangana', name: 'Telangana', aliases: ['telangana', 'telengana', 'hyderabad', 'secunderabad', 'warangal', 'tg', 'ts'] },
  { key: 'andhra_pradesh', name: 'Andhra Pradesh', aliases: ['andhra pradesh', 'andhrapradesh', 'visakhapatnam', 'vizag', 'vijayawada', 'guntur', 'ap', 'a.p.'] },
  { key: 'kerala', name: 'Kerala', aliases: ['kerala', 'keralam', 'kochi', 'cochin', 'thiruvananthapuram', 'trivandrum', 'kozhikode', 'kl', 'k.l.'] },
  { key: 'assam', name: 'Assam', aliases: ['assam', 'asom', 'guwahati', 'as'] },
  { key: 'jharkhand', name: 'Jharkhand', aliases: ['jharkhand', 'jharkand', 'ranchi', 'jamshedpur', 'dhanbad', 'jh'] },
  { key: 'odisha', name: 'Odisha', aliases: ['odisha', 'orissa', 'bhubaneswar', 'cuttack', 'od', 'or'] },
  { key: 'chhattisgarh', name: 'Chhattisgarh', aliases: ['chhattisgarh', 'chhatisgarh', 'chattisgarh', 'raipur', 'bilaspur', 'cg'] },
  { key: 'himachal_pradesh', name: 'Himachal Pradesh', aliases: ['himachal pradesh', 'himachal', 'shimla', 'dharamshala', 'hp'] },
  { key: 'jammu_kashmir', name: 'Jammu & Kashmir', aliases: ['jammu & kashmir', 'jammu and kashmir', 'jammu', 'kashmir', 'srinagar', 'jk'] },
  { key: 'goa', name: 'Goa', aliases: ['goa', 'panaji', 'panjim', 'margao', 'ga'] }
];

export function matchStateByText(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return null;
  const clean = inputStr.trim().toLowerCase();
  if (!clean) return null;

  for (const st of INDIAN_STATES) {
    for (const alias of st.aliases) {
      const regex = new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
      if (regex.test(clean)) {
        return { key: st.key, name: st.name };
      }
    }
  }
  return null;
}

export function parseStateInfo(sourceObj, fallbackString = '') {
  // 1. FIRST PRIORITY: Explicit declared State Field (Place of Supply authoritative field)
  const explicitState = String(
    sourceObj?.state ||
    sourceObj?.province ||
    sourceObj?.stateName ||
    sourceObj?.shippingAddress?.state ||
    ''
  ).trim();

  if (explicitState) {
    const matched = matchStateByText(explicitState);
    if (matched) return matched;
  }

  // 2. SECOND PRIORITY: Explicit declared City Field
  const explicitCity = String(
    sourceObj?.city ||
    sourceObj?.district ||
    sourceObj?.cityName ||
    sourceObj?.shippingAddress?.city ||
    ''
  ).trim();

  if (explicitCity) {
    const matched = matchStateByText(explicitCity);
    if (matched) return matched;
  }

  // 3. THIRD PRIORITY: Address text scan (Combined address lines, street, landmark)
  let addressText = '';
  if (sourceObj && typeof sourceObj === 'object') {
    addressText = [
      sourceObj.state,
      sourceObj.city,
      sourceObj.addressLine,
      sourceObj.addressLine1,
      sourceObj.street,
      sourceObj.address,
      sourceObj.colony,
      sourceObj.landmark,
      fallbackString
    ].filter(Boolean).join(' ');
  } else if (typeof sourceObj === 'string') {
    addressText = `${sourceObj} ${fallbackString}`;
  } else if (fallbackString) {
    addressText = String(fallbackString);
  }

  if (addressText.trim()) {
    const matched = matchStateByText(addressText);
    if (matched) return matched;
  }

  // 4. FOURTH PRIORITY: GSTIN Prefix (2-digit state code)
  const rawGst = String(
    sourceObj?.gstNumber || sourceObj?.gstin || sourceObj?.gst || ''
  ).trim();
  if (rawGst.length >= 2 && /^\d{2}/.test(rawGst)) {
    const code = rawGst.slice(0, 2);
    if (GST_STATE_CODES[code]) {
      const found = INDIAN_STATES.find(s => s.key === GST_STATE_CODES[code]);
      if (found) return { key: found.key, name: found.name };
    }
  }

  // 5. FIFTH PRIORITY: 6-Digit Pincode (Fallback if State & City text was not provided)
  const explicitPin = String(sourceObj?.pincode || sourceObj?.pin || sourceObj?.postalCode || '').trim();
  const isolatedPinMatch = explicitPin.match(/\b([1-9]\d{5})\b/) || String(addressText || '').match(/\b([1-9]\d{5})\b/);
  const sixPin = isolatedPinMatch ? isolatedPinMatch[1] : (explicitPin.replace(/\D/g, '').length >= 6 ? explicitPin.replace(/\D/g, '').slice(0, 6) : '');
  if (sixPin) {
    for (const p of PINCODE_PREFIX_MAP) {
      if (p.regex.test(sixPin)) {
        return { key: p.key, name: p.name };
      }
    }
  }

  // 6. DEFAULT FALLBACK: Uttar Pradesh
  return { key: 'uttar_pradesh', name: 'Uttar Pradesh' };
}

export default function TaxInvoiceModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const rawStatus = String(order.overallStatus || order.status || order.deliveryStatus || '').toLowerCase().trim();
  const normStatus = rawStatus.replace(/[\s-]+/g, '_');
  const isCancelled = normStatus === 'cancelled' || normStatus === 'canceled' || order.isCancelled || Boolean(order.cancelledAt);

  const isBulkOrder = Boolean(
    order.isBulkOrder ||
    order.isSchoolOrder ||
    Array.isArray(order.requirements) ||
    order.bulkOrderId ||
    order.schoolName ||
    order.institutionName ||
    String(order.id || order.orderId || order._id || order.referenceId || '').toUpperCase().startsWith('BULK-')
  );

  const isPaymentVerified = String(order.paymentStatus || '').toLowerCase() === 'paid' ||
    String(order.advancePaymentStatus || '').toLowerCase() === 'paid' ||
    String(order.remainingPaymentStatus || '').toLowerCase() === 'paid' ||
    Number(order.advancePaidAmount || 0) > 0 ||
    isBulkOrder;

  const isCod = /cod|cash\s*on\s*delivery/i.test(String(order.paymentMethod || ''));
  const isPendingOrder = !isBulkOrder && (!normStatus || ['pending', 'placed', 'unconfirmed', 'created', 'draft'].includes(normStatus));

  const isOrderConfirmedStatus = [
    'assigned',
    'accepted',
    'confirmed',
    'quote_accepted',
    'buyer_accepted',
    'seller_accepted',
    'seller_accepted_counter',
    'processing',
    'production',
    'in_production',
    'packed',
    'packed_and_sealed',
    'shipped',
    'dispatched',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'completed',
    'fulfilled',
    'delivered_to_customer',
    'order_delivered',
    'return_requested',
    'returned',
    'exchange_requested',
    'exchanged',
    'return_approved',
    'exchange_approved',
    'refund_requested',
    'refunded',
    'cancelled',
    'canceled'
  ].includes(normStatus) || (isBulkOrder && normStatus.length > 0) || (!isPendingOrder && normStatus.length > 0);

  const hasConfirmedItem = Array.isArray(order.items) && order.items.some(it => {
    const itStatus = String(it.status || order.status || order.overallStatus || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    return itStatus && !['pending', 'placed', 'unconfirmed', 'draft', ''].includes(itStatus);
  });

  // Strict Tax Invoice Lock:
  // Tax Invoice is ONLY generated when the order is confirmed by seller (or processing, packed, shipped, delivered, completed).
  // Unconfirmed / Pending orders remain strictly LOCKED, regardless of whether payment was made online (UPI/Razorpay).
  const isPendingUnconfirmed = isPendingOrder && !hasConfirmedItem;
  const confirmed = isBulkOrder
    ? (isOrderConfirmedStatus || (normStatus && !isPendingOrder))
    : (isCancelled || (!isPendingUnconfirmed && (isOrderConfirmedStatus || hasConfirmedItem)));

  const shippingAddr = typeof order.shippingAddress === 'object'
    ? order.shippingAddress
    : { street: order.address || order.shippingAddress || 'Customer Delivery Address' };

  const formattedAddressStr = typeof order.shippingAddress === 'string'
    ? order.shippingAddress
    : [
        shippingAddr.street || shippingAddr.addressLine || shippingAddr.address,
        shippingAddr.city,
        shippingAddr.state,
        shippingAddr.pincode ? `- ${shippingAddr.pincode}` : ''
      ].filter(Boolean).join(', ');

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      id: 1,
      name: order.itemName || order.product || 'School Supply & Educational Item',
      image: order.image || (Array.isArray(order.images) && order.images[0]) || FALLBACK_IMAGE,
      quantity: order.quantity || 1,
      price: order.total || order.amount || 499,
      category: 'School Uniform'
    }
  ];

  const rawSubtotal = Number(order.subtotal || 0);
  const shippingCost = Number(order.shippingCost ?? order.shippingFee ?? 0);
  const discount = Number(order.discount ?? order.discountAmount ?? order.couponDiscount ?? 0);
  const pointsDiscount = Number(order.pointsDiscount || 0);
  const totalDiscounts = discount + pointsDiscount;

  const itemsSum = items.reduce((acc, it) => acc + (Number(it.originalPrice ?? it.price ?? it.finalPrice ?? 0) * Number(it.quantity || 1)), 0);
  const isItemPriceAlreadyDiscounted = rawSubtotal > 0 && totalDiscounts > 0 && Math.abs((itemsSum + totalDiscounts) - rawSubtotal) < 1;

  const subtotal = rawSubtotal > 0 ? rawSubtotal : itemsSum;
  const grandTotal = Number(order.total || order.totalAmount || Math.max(0, subtotal + shippingCost - totalDiscounts));
  const discountRatio = subtotal > 0 ? Math.min(1, totalDiscounts / subtotal) : 0;

  let totalTaxableValue = 0;
  let totalTaxAmount = 0;

  const itemBreakdowns = items.map((item) => {
    const isUnstitched = Boolean(
      item.isMeterBased ||
      item.unit === 'meter' ||
      item.unit === 'm' ||
      item.productId?.isMeterBased ||
      item.productId?.unit === 'meter' ||
      item.productId?.unit === 'm' ||
      String(item.category || '').toLowerCase().includes('unstitched') ||
      String(item.category || '').toLowerCase().includes('unstiched') ||
      String(item.subCategory || '').toLowerCase().includes('unstitched') ||
      String(item.subCategory || '').toLowerCase().includes('unstiched') ||
      String(item.name || '').toLowerCase().includes('unstitched') ||
      String(item.name || '').toLowerCase().includes('unstiched') ||
      String(item.productName || '').toLowerCase().includes('unstitched') ||
      String(item.productName || '').toLowerCase().includes('unstiched') ||
      (Number(item.quantity || 1) % 1 !== 0)
    );
    const rawQty = Number(item.quantity || 1);
    const displayQty = isUnstitched ? rawQty.toFixed(2) : (rawQty % 1 === 0 ? rawQty : rawQty.toFixed(2));
    const qty = rawQty;

    let unitPrice = Number(item.originalPrice ?? item.price ?? item.finalPrice ?? 0);
    if (isItemPriceAlreadyDiscounted && totalDiscounts > 0 && subtotal > 0) {
      const proportion = (unitPrice * qty) / itemsSum;
      const allocDiscount = totalDiscounts * proportion;
      unitPrice = qty > 0 ? Math.round(((unitPrice * qty + allocDiscount) / qty) * 100) / 100 : unitPrice;
    }

    const grossPrice = Math.round((unitPrice * qty) * 100) / 100;
    const rate = getProductGstRate(item);
    const isInclusive = item.isGstInclusive !== false && order.isGstInclusive !== false;

    const itemDiscount = item.offerDiscount !== undefined && item.offerDiscount !== null && !isNaN(Number(item.offerDiscount)) && Number(item.offerDiscount) > 0
      ? Number(item.offerDiscount)
      : (discountRatio > 0 ? Math.round(grossPrice * discountRatio * 100) / 100 : 0);
    const netItemPayable = Math.max(0, Math.round((grossPrice - itemDiscount) * 100) / 100);

    let taxableVal = netItemPayable;
    let taxAmt = 0;

    if (rate > 0) {
      if (isInclusive) {
        taxableVal = Math.round((netItemPayable / (1 + rate / 100)) * 100) / 100;
        taxAmt = Math.round((netItemPayable - taxableVal) * 100) / 100;
      } else {
        taxableVal = netItemPayable;
        taxAmt = Math.round(((netItemPayable * rate) / 100) * 100) / 100;
      }
    }

    totalTaxableValue += taxableVal;
    totalTaxAmount += taxAmt;

    return {
      ...item,
      qty: displayQty,
      rawQty,
      unitPrice,
      grossPrice,
      itemDiscount,
      netItemPayable,
      rate,
      taxableVal,
      taxAmt
    };
  });

  // Dynamic Product GST Rate for Delivery (Composite Supply under Section 8 of CGST Act: Principal supply rate governs freight/delivery)
  // Delivery charge GST strictly matches the product's GST rate (e.g., 5% product -> 5% delivery, 0% product -> 0% delivery)
  const defaultProductGstRate = (() => {
    const itemRates = itemBreakdowns.map(it => Number(it.rate)).filter(r => !isNaN(r));
    if (itemRates.length > 0) {
      return Math.max(...itemRates);
    }
    if (order.shippingGstRate !== undefined && order.shippingGstRate !== null && !isNaN(Number(order.shippingGstRate))) {
      return Number(order.shippingGstRate);
    }
    return 5;
  })();

  const shippingGstRate = defaultProductGstRate;

  // Delivery service GST (Composite supply: rate follows product rate)
  let shippingTaxable = 0;
  let shippingTax = 0;
  if (shippingCost > 0) {
    if (shippingGstRate > 0) {
      shippingTaxable = Math.round((shippingCost / (1 + shippingGstRate / 100)) * 100) / 100;
      shippingTax = Math.round((shippingCost - shippingTaxable) * 100) / 100;
    } else {
      shippingTaxable = shippingCost;
      shippingTax = 0;
    }
    totalTaxableValue += shippingTaxable;
    totalTaxAmount += shippingTax;
  }

  totalTaxableValue = Math.round(totalTaxableValue * 100) / 100;
  totalTaxAmount = Math.round(totalTaxAmount * 100) / 100;
  if (Math.abs((totalTaxableValue + totalTaxAmount) - grandTotal) > 0 && Math.abs((totalTaxableValue + totalTaxAmount) - grandTotal) <= 0.05) {
    totalTaxableValue = Math.round((grandTotal - totalTaxAmount) * 100) / 100;
  }

  const handlePrint = () => {
    window.print();
  };

  const isPlaceholderName = (name) => {
    if (!name || typeof name !== 'string') return true;
    const lower = name.trim().toLowerCase();
    return (
      lower === '' ||
      lower === 'bookvardi verified seller' ||
      lower === 'bookvardi verified seller hub' ||
      lower === 'bookvardimerchant' ||
      lower === 'bookvardi merchant' ||
      lower === 'book vardi partner merchant' ||
      lower === 'book vardi partner store' ||
      lower === 'verified seller' ||
      lower === 'other verified seller' ||
      lower === 'partner merchant' ||
      lower === 'unknown seller' ||
      lower === 'new merchant' ||
      lower === 'merchant store' ||
      lower === 'direct marketplace' ||
      lower === 'seller' ||
      lower === 'merchant' ||
      lower === 'partner' ||
      lower === 'n/a' ||
      lower === 'null' ||
      lower === 'undefined'
    );
  };

  const getItemSellerName = (item) => {
    // 1. Direct populated seller on item
    if (item?.sellerId && typeof item.sellerId === 'object') {
      const name = item.sellerId.storeName || item.sellerId.tradeName || item.sellerId.businessName || item.sellerId.legalBusinessName || item.sellerId.storeDetails?.storeName || item.sellerId.name || item.sellerId.sellerName || item.sellerId.legalName;
      if (name && !isPlaceholderName(name)) return name;
    }

    // 2. Direct seller attributes on item
    const candidateItemNames = [
      item?.sellerStoreName,
      item?.storeName,
      item?.sellerDetails?.storeName,
      item?.sellerDetails?.tradeName,
      item?.sellerDetails?.businessName,
      item?.sellerDetails?.legalBusinessName,
      item?.sellerDetails?.sellerName,
      item?.tradeName,
      item?.businessName,
      item?.legalBusinessName,
      item?.sellerName,
      typeof item?.seller === 'string' ? item.seller : (item?.seller?.storeName || item?.seller?.tradeName || item?.seller?.businessName || item?.seller?.name)
    ];

    for (const c of candidateItemNames) {
      if (c && !isPlaceholderName(c)) return c;
    }

    // 3. Populated productId object on item
    if (item?.productId && typeof item.productId === 'object') {
      const pName = item.productId.sellerStoreName || item.productId.storeName || item.productId.tradeName || item.productId.legalBusinessName || item.productId.sellerName || item.productId.vendor || (item.productId.sellerId && typeof item.productId.sellerId === 'object' ? (item.productId.sellerId.storeName || item.productId.sellerId.name) : null);
      if (pName && !isPlaceholderName(pName)) return pName;
    }

    // 4. Product catalog lookup by ID or title
    const prodIdStr = String(item?.productId || item?.id || item?._id || '');
    const cleanItemName = String(item?.name || item?.productName || item?.itemName || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();

    const catalogKeys = ['bv_sync_products', 'admin_products', 'bv_seller_products'];
    for (const catKey of catalogKeys) {
      try {
        const catalogSaved = localStorage.getItem(catKey);
        if (catalogSaved) {
          const catalog = JSON.parse(catalogSaved);
          if (Array.isArray(catalog)) {
            const matchedProd = catalog.find(p => {
              const pId = String(p.id || p._id || p.productId || '');
              const pName = String(p.name || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
              return (prodIdStr && pId === prodIdStr) || (cleanItemName && pName && (pName === cleanItemName || cleanItemName.includes(pName) || pName.includes(cleanItemName)));
            });
            if (matchedProd) {
              const pSeller = matchedProd.sellerStoreName || matchedProd.storeName || matchedProd.tradeName || matchedProd.businessName || matchedProd.legalBusinessName || matchedProd.sellerName || matchedProd.vendor || (typeof matchedProd.seller === 'string' ? matchedProd.seller : (matchedProd.seller?.storeName || matchedProd.seller?.name)) || matchedProd.sellerDetails?.storeName;
              if (pSeller && !isPlaceholderName(pSeller)) return pSeller;
            }
          }
        }
      } catch (e) {}
    }

    // 5. Seller directory lookup by seller ID or phone
    const sellerIdStr = String(item?.sellerId || order?.sellerId || '');
    if (sellerIdStr && sellerIdStr !== '[object Object]') {
      const sellerKeys = ['admin_sellers', 'bv_sync_sellers', 'bv_registered_users'];
      for (const selKey of sellerKeys) {
        try {
          const sellersSaved = localStorage.getItem(selKey);
          if (sellersSaved) {
            const sellersList = JSON.parse(sellersSaved);
            if (Array.isArray(sellersList)) {
              const matchedSeller = sellersList.find(s => {
                const sId = String(s.id || s._id || s.sellerId || s.phone || '');
                return sId === sellerIdStr || (sellerIdStr.length >= 8 && sId.endsWith(sellerIdStr.slice(-10)));
              });
              if (matchedSeller) {
                const sName = matchedSeller.storeName || matchedSeller.tradeName || matchedSeller.businessName || matchedSeller.legalBusinessName || matchedSeller.storeDetails?.storeName || matchedSeller.sellerName || matchedSeller.name || matchedSeller.legalName || matchedSeller.ownerFullName;
                if (sName && !isPlaceholderName(sName)) return sName;
              }
            }
          }
        } catch (e) {}
      }
    }

    // 6. Order level candidates
    const candidateOrderNames = [
      order?.sellerStoreName,
      order?.storeName,
      order?.sellerDetails?.storeName,
      order?.sellerDetails?.tradeName,
      order?.sellerDetails?.businessName,
      order?.sellerDetails?.legalBusinessName,
      order?.sellerDetails?.sellerName,
      order?.sellerId && typeof order.sellerId === 'object' ? (order.sellerId.storeName || order.sellerId.tradeName || order.sellerId.businessName || order.sellerId.name || order.sellerId.sellerName) : null,
      order?.sellerName,
      typeof order?.seller === 'string' ? order.seller : (order?.seller?.storeName || order?.seller?.name)
    ];

    for (const c of candidateOrderNames) {
      if (c && !isPlaceholderName(c)) return c;
    }

    return 'Partner Store';
  };

  const resolveSeller = () => {
    const allSellerNames = [
      ...new Set(
        items.map(it => getItemSellerName(it)).filter(Boolean)
      )
    ];
    const primaryName = allSellerNames.length > 1
      ? allSellerNames.join(', ')
      : (allSellerNames[0] || getItemSellerName(items[0]));
    const primaryGst = [
      order.sellerDetails?.gstNumber,
      order.sellerDetails?.gst,
      order.sellerGst,
      order.gstNumber,
      order.items?.[0]?.sellerDetails?.gstNumber,
      items[0]?.sellerDetails?.gstNumber,
      items[0]?.gstNumber,
      items[0]?.sellerGst
    ].find(g => g && g !== '09AAACB1234F1Z9' && g !== 'Exempt / N/A' && String(g).trim() !== '') || '09AAACB1234F1Z9';

    const firstSellerObj = typeof order.items?.[0]?.sellerId === 'object' ? order.items[0].sellerId : (typeof order.sellerDetails?.sellerId === 'object' ? order.sellerDetails.sellerId : null);

    const primaryCity = [
      order.sellerDetails?.city,
      order.sellerDetails?.address,
      order.sellerCity,
      order.items?.[0]?.sellerDetails?.city,
      items[0]?.sellerDetails?.city,
      items[0]?.sellerCity,
      firstSellerObj?.city,
      firstSellerObj?.address
    ].find(Boolean) || 'Lucknow, Uttar Pradesh';

    const primaryState = [
      order.sellerDetails?.state,
      order.sellerState,
      order.items?.[0]?.sellerDetails?.state,
      items[0]?.sellerDetails?.state,
      items[0]?.sellerState,
      firstSellerObj?.state
    ].find(Boolean) || 'Uttar Pradesh';
    
    return {
      storeName: primaryName || 'Partner Store',
      gstNumber: primaryGst,
      city: primaryCity,
      state: primaryState
    };
  };

  const resolvedSeller = resolveSeller();

  // Dynamic Intra-State vs Inter-State detection
  const sellerStateInfo = parseStateInfo(resolvedSeller, `${resolvedSeller.city} ${resolvedSeller.state}`);
  const customerStateInfo = parseStateInfo(shippingAddr, `${formattedAddressStr} ${shippingAddr?.state || ''}`);
  const isIntraState = !sellerStateInfo.key || !customerStateInfo.key || (sellerStateInfo.key === customerStateInfo.key);

  // Dynamic CGST + SGST vs IGST Split on total order tax
  const cgstAmount = isIntraState ? Math.round((totalTaxAmount / 2) * 100) / 100 : 0;
  const sgstAmount = isIntraState ? Math.round((totalTaxAmount - cgstAmount) * 100) / 100 : 0;
  const igstAmount = !isIntraState ? totalTaxAmount : 0;

  // Logistics tracking resolution
  const logisticsStatus = String(order.overallStatus || order.status || '').toLowerCase().replace(/_/g, ' ');
  const isOut = logisticsStatus === 'out for delivery' || logisticsStatus === 'delivered';
  const isSelf = String(order.deliveryMode || order.deliveryType || '').toLowerCase().includes('self') || Boolean(order.selfDeliveryDetails?.deliveryPartnerToken || order.selfDeliveryDetails?.deliveryPersonName);
  const isThirdParty = String(order.deliveryMode || order.deliveryType || '').toLowerCase().includes('third') || Boolean(order.courierName || order.thirdPartyDetails?.courierName);
  const hasPartner = isSelf || isThirdParty || Boolean(order.courierName || order.selfDeliveryDetails?.deliveryPersonName);
  const hasTracking = !isCancelled && isOut && hasPartner && Boolean(order.trackingNumber || order.selfDeliveryDetails?.deliveryPartnerToken || order.thirdPartyDetails?.trackingNumber);

  const deliveryPartnerDisplay = isSelf 
    ? (order.selfDeliveryDetails?.deliveryPersonName ? `Direct Self-Delivery (Rider: ${order.selfDeliveryDetails.deliveryPersonName})` : 'Direct Self-Delivery (Store Fleet)')
    : (order.courierName || order.thirdPartyDetails?.courierName || '3rd-Party Logistics Carrier');

  const trackingNumberDisplay = order.trackingNumber || (isSelf ? order.selfDeliveryDetails?.deliveryPartnerToken : order.thirdPartyDetails?.trackingNumber) || '';

  const trackingLinkDisplay = order.trackingUrl || order.selfDeliveryDetails?.trackingUrl || order.thirdPartyDetails?.trackingUrl || '';

  return (
    <div className="tax-invoice-print-root fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto print:block">
      <style>{`
        @media print {
          @page {
            margin: 10mm;
            size: auto;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          body > * {
            visibility: hidden !important;
          }
          .tax-invoice-print-root,
          .tax-invoice-print-root * {
            visibility: visible !important;
          }
          .tax-invoice-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            display: block !important;
          }
          .tax-invoice-print-card {
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <div className="tax-invoice-print-card bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar */}
        <div className="bg-gray-950 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${isCancelled ? 'bg-rose-600' : 'bg-brand-teal'} text-white flex items-center justify-center font-bold`}>
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs sm:text-sm text-white leading-tight">
                {isCancelled ? 'Official Credit Note & Cancellation Certificate' : 'Tax Invoice & Certificate of Order'}
              </h3>
              <p className="text-[10px] text-gray-400">Order ID: #{order.id || order.orderId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {confirmed && (
              <button
                onClick={handlePrint}
                className={`px-3 py-1.5 ${isCancelled ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-teal hover:bg-teal-700'} text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs`}
              >
                <Printer size={13} /> {isCancelled ? 'Print Credit Note' : 'Print Invoice'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Strict Verification Banner */}
        {!confirmed ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Lock size={28} />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-lg text-gray-900">Tax Invoice Generation Locked</h4>
              <p className="text-xs text-gray-600 max-w-md mx-auto mt-1 leading-relaxed">
                Official Tax Invoice will be generated automatically once the order status is confirmed by the seller.
              </p>
            </div>
            <div className="inline-flex flex-col items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-5 py-2.5 rounded-xl shadow-2xs">
              <div>
                Current Order Status: <span className="uppercase font-black text-amber-950">{order.overallStatus || order.status || 'Pending Confirmation'}</span>
              </div>
              <p className="text-[10px] text-amber-700/90 font-medium">
                (Payment status does not block invoice generation. Once the order is confirmed, the invoice is generated automatically.)
              </p>
            </div>
          </div>
        ) : (

        /* Invoice Sheet / Credit Note Body */
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto print:overflow-visible print:p-0">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-900 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`${isCancelled ? 'bg-rose-600' : 'bg-brand-teal'} text-white font-black text-xs px-2 py-0.5 rounded tracking-wider uppercase`}>Book Vardi</span>
                {isCancelled ? (
                  <span className="text-xs font-extrabold text-rose-700 flex items-center gap-1">
                    <ShieldCheck size={14} /> Official GST Credit Note
                  </span>
                ) : (
                  <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck size={14} /> Official Verified Invoice
                  </span>
                )}
              </div>
              <h1 className="font-display font-extrabold text-xl text-gray-900 tracking-tight">
                BOOK VARDI PRIVATE LIMITED
              </h1>
              <p className="text-[11px] text-gray-500">Lucknow, Uttar Pradesh - 226001 | GSTIN: 09AAACB1234F1Z9</p>
            </div>

            <div className={`sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 ${isCancelled ? 'border-rose-600' : 'border-brand-teal'} pl-3 sm:pl-0`}>
              <h2 className={`font-display font-black text-lg uppercase tracking-wider ${isCancelled ? 'text-rose-600' : 'text-gray-900'}`}>
                {isCancelled ? 'CREDIT NOTE' : 'TAX INVOICE'}
              </h2>
              <p className="text-xs font-bold text-gray-700">
                {isCancelled ? 'Credit Note No: ' : 'Invoice No: '}
                <strong className={`font-mono ${isCancelled ? 'text-rose-600' : 'text-brand-teal'}`}>
                  {isCancelled ? `CN-${order.id}` : `INV-${order.id}`}
                </strong>
              </p>
              {isCancelled && (
                <p className="text-[11px] text-gray-500 font-mono">
                  Original Ref: <strong>INV-{order.id}</strong>
                </p>
              )}
              <p className="text-[11px] text-gray-500">
                {isCancelled ? 'Reversal Date: ' : 'Invoice Date: '}
                {order.cancelledAt ? new Date(order.cancelledAt).toLocaleDateString('en-GB') : (order.date || new Date().toLocaleDateString('en-GB'))}
              </p>
            </div>
          </div>

          {/* Cancellation Alert Banner */}
          {isCancelled && (
            <div className="p-3.5 bg-rose-50/90 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1 shadow-xs">
              <div className="flex items-center gap-2 font-black text-rose-950 uppercase tracking-wider text-[11px]">
                <RotateCcw size={15} className="text-rose-600 shrink-0" />
                <span>Cancellation & Statutory Tax Reversal Details</span>
              </div>
              <p className="text-xs text-rose-950 leading-snug">
                <strong>Cancellation Reason:</strong> <span className="font-semibold text-rose-900">{order.cancellationReason || order.cancelReason || order.reason || 'Customer Requested Order Cancellation'}</span>
                {order.cancelledBy ? ` (Initiated by ${order.cancelledBy})` : ''}
              </p>
              <p className="text-[11px] text-rose-800 font-medium">
                Refund Status: <strong>{order.paymentStatus === 'paid' || order.paymentStatus === 'Paid' ? 'Refund Processed & Credited to Original Payment Source' : 'Order Cancelled (No Charge Payable)'}</strong>
              </p>
            </div>
          )}

          {/* Seller & Customer Information */}
          {(() => {
            const primarySellerName = resolvedSeller.storeName;
            const primarySellerGst = resolvedSeller.gstNumber;
            const primarySellerCity = resolvedSeller.city;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">
                    {isCancelled ? 'Issued By (Merchant / Seller Store)' : 'Sold By (Merchant / Seller Store)'}
                  </span>
                  <p className="font-extrabold text-gray-900 text-sm">{primarySellerName}</p>
                  <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-sm border border-emerald-200">
                    <ShieldCheck size={12} className="shrink-0" /> Verified Seller Partner
                  </span>
                  <p className="text-gray-600 mt-1">Location / City: {primarySellerCity}</p>
                  <p className="text-gray-700 font-mono font-bold mt-0.5">GSTIN: {primarySellerGst}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">
                    {isCancelled ? 'Issued To (Customer)' : 'Billed To (Customer)'}
                  </span>
                  <p className="font-extrabold text-gray-900 text-sm">{typeof order.customerName === 'object' ? (order.customerName?.name || 'Customer') : (order.customerName || order.customer?.name || 'Customer')}</p>
                  <p className="text-gray-600 mt-0.5">{formattedAddressStr}</p>
                  <p className="text-gray-500 mt-1">Order ID: <strong className="font-mono text-gray-900">#{order.id || order.orderId}</strong> | Payment: <strong>{order.paymentMethod || 'Online UPI'}</strong></p>
                </div>
              </div>
            );
          })()}

          {/* Itemized Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">{isCancelled ? 'Cancelled Item Details' : 'Item Details'}</th>
                  <th className="py-2.5 px-3">Sold By (Seller Store)</th>
                  <th className="py-2.5 px-3 text-center w-14">Qty</th>
                  <th className="py-2.5 px-3 text-right w-24">Unit Price</th>
                  <th className="py-2.5 px-3 text-right w-28">{isCancelled ? 'Refunded Gross' : 'Total Price'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemBreakdowns.map((item, idx) => {
                  const sellerName = getItemSellerName(item);
                  const sizeInfo = item.selectedSize || item.size || item.variantName;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 text-center font-bold text-gray-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-gray-900 leading-snug">{item.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mt-0.5">
                          {sizeInfo && (
                            <span>Size: <strong className="text-gray-700">{sizeInfo}</strong></span>
                          )}
                          {sizeInfo && item.category && <span>•</span>}
                          <span>{item.category || 'School Supply'}</span>
                          <span>•</span>
                          <span className="text-gray-600 font-semibold">{item.rate}% GST</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-[11px] border border-gray-200 block truncate max-w-[150px]" title={sellerName}>
                          {sellerName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {isCancelled ? (
                          <span className="text-rose-700">-₹{item.grossPrice.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-900">₹{item.grossPrice.toFixed(2)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Settlement & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Left Column: Payment & Authenticity Notes */}
            <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 flex flex-col justify-between space-y-3 text-xs">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-black text-gray-400 block tracking-wider">
                  {isCancelled ? 'Refund Authorization & Status' : 'Payment & Authenticity'}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {isCancelled ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                      <ShieldCheck size={13} /> Refund Processed
                    </span>
                  ) : isCod && !isPaymentVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock size={13} /> Unpaid (Pay on Delivery)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <ShieldCheck size={13} /> Payment Verified
                    </span>
                  )}
                  <span className="text-gray-600 text-[11px] font-medium">
                    via <strong>{order.paymentMethod || 'Online UPI'}</strong>
                  </span>
                </div>
                {order.paymentId && (
                  <p className="text-[10px] text-gray-500 font-mono">
                    Ref / Txn ID: {order.paymentId}
                  </p>
                )}

                <div className="bg-white rounded-lg p-2.5 border border-gray-200/90 mt-2">
                  <span className="text-[10px] uppercase font-black text-gray-400 block tracking-wider">
                    {isCancelled ? 'Amount in Words (Refunded Credit)' : 'Amount in Words'}
                  </span>
                  <p className="font-bold text-gray-800 text-[11px] italic mt-0.5 leading-snug">{numberToWords(grandTotal)}</p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-gray-200 text-[11px] text-gray-500 space-y-1">
                {isCancelled ? (
                  <>
                    <p className="leading-relaxed">
                      • Credit Note issued under Section 34 of CGST Act, 2017. Tax liability reversed in full.
                    </p>
                    <p className="leading-relaxed">
                      • The total refunded amount has been processed back to your original payment method or wallet.
                    </p>
                    <p className="text-[10px] text-gray-400 pt-0.5 italic">
                      This is a computer-generated credit note and does not require a physical signature.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="leading-relaxed">
                      • All item prices are inclusive of all applicable taxes.
                    </p>
                    <p className="leading-relaxed">
                      • 7-Day Hassle-Free Returns & Exchanges eligible from delivery date.
                    </p>
                    <p className="text-[10px] text-gray-400 pt-0.5 italic">
                      This is a computer-generated tax invoice and does not require a physical signature.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Financial Calculation */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2.5 text-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                    {isCancelled ? 'Refund & Credit Breakdown' : 'Price Summary'}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    isIntraState 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {isIntraState ? `Intra-State (${customerStateInfo.name})` : `Inter-State (${sellerStateInfo.name} ➔ ${customerStateInfo.name})`}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-600">
                  <span>{isCancelled ? 'Items Subtotal Reversal:' : 'Items Subtotal:'}</span>
                  <span className="font-mono font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-gray-600">
                  <span>{isCancelled ? 'Delivery Adjustment:' : 'Delivery Charges:'}</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}
                  </span>
                </div>

                {discount > 0 ? (
                  <div className={`flex justify-between font-bold ${isCancelled ? 'text-rose-700' : 'text-emerald-700'}`}>
                    <span>{isCancelled ? 'Coupon Reversal:' : 'Offer / Coupon Applied:'}</span>
                    <span className="font-mono">-₹{discount.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-gray-400">
                    <span>Offer / Coupon:</span>
                    <span className="font-mono">None Applied (₹0.00)</span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>{isCancelled ? 'Reward Points Restored:' : 'Reward Points Redeemed:'}</span>
                    <span className="font-mono">{isCancelled ? `+₹${pointsDiscount.toFixed(2)}` : `-₹${pointsDiscount.toFixed(2)}`}</span>
                  </div>
                )}

                {/* Unified GST Breakdown on the Total Bill Amount */}
                <div className="bg-white rounded-xl p-3 border border-gray-200 space-y-1.5 shadow-2xs mt-2">
                  <div className="flex justify-between items-center text-gray-600 text-[11px]">
                    <span className="font-medium">{isCancelled ? 'Taxable Amount Reversal:' : 'Taxable Value (Base Price):'}</span>
                    <span className="font-mono font-bold text-gray-900">₹{totalTaxableValue.toFixed(2)}</span>
                  </div>

                  {isIntraState ? (
                    <>
                      <div className="flex justify-between items-center text-gray-600 text-[11px]">
                        <span>{isCancelled ? 'CGST Reversal (Central Tax):' : 'CGST (Central Tax):'}</span>
                        <span className="font-mono font-semibold text-brand-teal">₹{cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600 text-[11px]">
                        <span>{isCancelled ? 'SGST / UTGST Reversal (State Tax):' : 'SGST / UTGST (State Tax):'}</span>
                        <span className="font-mono font-semibold text-brand-teal">₹{sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-gray-600 text-[11px]">
                      <span>{isCancelled ? 'IGST Reversal (Integrated Tax):' : 'IGST (Integrated Tax):'}</span>
                      <span className="font-mono font-semibold text-brand-teal">₹{igstAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-gray-900 text-[11px] pt-1.5 border-t border-gray-100 font-bold">
                    <span>{isCancelled ? 'Total Tax Reversed (GST):' : 'Total GST Tax (Included):'}</span>
                    <span className="font-mono text-brand-teal font-extrabold">₹{totalTaxAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {isCancelled ? (
                <div className="bg-rose-600 text-white rounded-xl p-3 flex items-center justify-between shadow-xs mt-2">
                  <div>
                    <span className="text-xs font-black block">Net Refunded Credit Amount:</span>
                    <span className="text-[10px] text-rose-100 font-normal">(Full Reversal Authorized)</span>
                  </div>
                  <span className="font-mono text-lg font-black">₹{grandTotal.toFixed(2)}</span>
                </div>
              ) : (
                <div className="border-t-2 border-gray-300 pt-2.5 mt-2">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-xs font-black text-gray-900 block">Gross Order Total:</span>
                      <span className="text-[10px] text-gray-400 font-normal">(Inclusive of all taxes & GST)</span>
                    </div>
                    <span className="font-mono text-base font-black text-brand-teal">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
            <div>
              <p className="font-semibold text-gray-700">Book Vardi Customer Support & Help Desk</p>
              <p className="text-[10px] text-gray-400">Official Student & School Marketplace • support@bookvardi.com</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Authorized Signatory</span>
              <span className="font-bold text-gray-900 text-xs block">{resolvedSeller.storeName}</span>
              <span className="text-[10px] font-mono text-gray-500 block">GSTIN: {resolvedSeller.gstNumber || 'Exempt / N/A'}</span>
            </div>
          </div>

        </div>
        )}
      </div>
    </div>
  );
}

export function CreditNoteModal(props) {
  return <TaxInvoiceModal {...props} />;
}
