import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const original = execSync('git show e0c404e:src/data/mockData.js').toString();

const sellerExports = `
export const ORDERS = [
  {
    id: 'ORD-2026-101',
    customerName: 'Rohan Sharma',
    customerEmail: 'rohan.s@gmail.com',
    customerPhone: '+91 98112 34567',
    school: 'Delhi Public School, R.K. Puram',
    date: '06 Sep 2026',
    total: 1499,
    itemsCount: 2,
    status: 'Pending',
    paymentMethod: 'UPI / PhonePe',
    paymentStatus: 'Paid',
    shippingAddress: 'Flat 102, B-Block, Vasant Kunj, New Delhi 110070',
    trackingNumber: 'DELHIVERY-7782910',
    items: [
      {
        id: 2,
        name: 'KV Winter Uniform Sweater (Unisex)',
        price: 949,
        quantity: 1,
        size: 'L (38)',
        color: 'Navy Blue',
        image: 'https://plus.unsplash.com/premium_photo-1673356302067-aac3b545a362?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 6,
        name: 'Kids Magic Coloring & Drawing Book',
        price: 299,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'ORD-2026-102',
    customerName: 'Meera Nambiar',
    customerEmail: 'meera.nambiar@yahoo.co.in',
    customerPhone: '+91 97412 88990',
    school: 'The Mother’s International School',
    date: '05 Sep 2026',
    total: 1298,
    itemsCount: 2,
    status: 'Confirmed',
    paymentMethod: 'Credit Card',
    paymentStatus: 'Paid',
    shippingAddress: 'Villa 14, Lotus Boulevard, Sector 100, Noida 201304',
    trackingNumber: 'BLUEDART-8823192',
    items: [
      {
        id: 7,
        name: 'Girls Pleated Skirt Uniform',
        price: 649,
        quantity: 2,
        size: 'M (32)',
        color: 'Grey',
        image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'ORD-2026-103',
    customerName: 'Amanpreet Singh',
    customerEmail: 'aman.singh@gmail.com',
    customerPhone: '+91 98723 44556',
    school: 'St. Xavier Senior Secondary',
    date: '04 Sep 2026',
    total: 310,
    itemsCount: 2,
    status: 'Shipped',
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    shippingAddress: 'House 45, Model Town, Jalandhar, Punjab 144003',
    trackingNumber: 'EKART-9938120',
    items: [
      {
        id: 3,
        name: 'NCERT Mathematics Class 10',
        price: 160,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 4,
        name: 'NCERT Science Class 9',
        price: 150,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'ORD-2026-104',
    customerName: 'Kavita Deshmukh',
    customerEmail: 'kavita.deshmukh@gmail.com',
    customerPhone: '+91 99230 11223',
    school: 'Kendriya Vidyalaya No. 1',
    date: '02 Sep 2026',
    total: 899,
    itemsCount: 1,
    status: 'Delivered',
    paymentMethod: 'UPI / Google Pay',
    paymentStatus: 'Paid',
    shippingAddress: 'Row House 12, Baner, Pune, Maharashtra 411045',
    trackingNumber: 'DELHIVERY-5561029',
    items: [
      {
        id: 2,
        name: 'KV Winter Uniform Sweater (Unisex)',
        price: 899,
        quantity: 1,
        size: 'XL (40)',
        color: 'Navy Blue',
        image: 'https://plus.unsplash.com/premium_photo-1673356302067-aac3b545a362?w=500&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'ORD-2026-105',
    customerName: 'Anil Kumar Gupta',
    customerEmail: 'anil.gupta@rediffmail.com',
    customerPhone: '+91 94150 99887',
    school: 'Modern School, Barakhamba',
    date: '01 Sep 2026',
    total: 749,
    itemsCount: 1,
    status: 'Cancelled',
    paymentMethod: 'UPI / Paytm',
    paymentStatus: 'Refunded',
    shippingAddress: 'Flat 304, Indirapuram, Ghaziabad, UP 201014',
    trackingNumber: 'N/A',
    items: [
      {
        id: 5,
        name: 'Olympiad Reasoning Practice Book',
        price: 249,
        quantity: 3,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80'
      }
    ]
  }
];

export const PROMOTIONS = [
  {
    id: 1,
    code: 'BACK2SCHOOL25',
    title: 'Back to School Mega Discount',
    discountType: 'percentage',
    discountValue: 25,
    minOrderValue: 799,
    maxDiscount: 350,
    validFrom: '2026-09-01',
    validUntil: '2026-10-31',
    usageLimit: 1000,
    usageCount: 238,
    status: 'active'
  },
  {
    id: 2,
    code: 'UNIFORM15',
    title: 'School Uniform Special Savings',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 999,
    maxDiscount: 250,
    validFrom: '2026-08-15',
    validUntil: '2026-09-30',
    usageLimit: 500,
    usageCount: 412,
    status: 'active'
  },
  {
    id: 3,
    code: 'FLAT100OFF',
    title: 'Flat Rs 100 on Orders above 599',
    discountType: 'flat',
    discountValue: 100,
    minOrderValue: 599,
    maxDiscount: 100,
    validFrom: '2026-09-01',
    validUntil: '2026-11-15',
    usageLimit: 300,
    usageCount: 97,
    status: 'active'
  },
  {
    id: 4,
    code: 'FESTIVE30',
    title: 'Diwali Student Fest Offer',
    discountType: 'percentage',
    discountValue: 30,
    minOrderValue: 1299,
    maxDiscount: 500,
    validFrom: '2026-10-15',
    validUntil: '2026-11-05',
    usageLimit: 2000,
    usageCount: 0,
    status: 'scheduled'
  }
];

export const SCHOOL_ORDERS = [
  {
    id: 'SCH-REQ-882',
    schoolName: 'St. Xavier High School, Gurugram',
    contactPerson: 'Fr. Matthew D’Souza (Principal)',
    contactPhone: '+91 98765 11223',
    contactEmail: 'admin@stxaviersgurugram.edu.in',
    requirementSummary: '500 Sets Class 8-10 Boys & Girls Formal Uniforms (Blazers, Shirts, Trousers/Skirts)',
    quantity: 500,
    estimatedBudget: 450000,
    quoteAmount: 425000,
    deadline: '25 Sep 2026',
    status: 'Quotation Sent',
    notes: 'Requires customized embroidered school crest on blazers and tie sets.'
  },
  {
    id: 'SCH-REQ-883',
    schoolName: 'Delhi Public School, Sector 45',
    contactPerson: 'Mrs. Sunita Chawla (Store Admin)',
    contactPhone: '+91 98110 33445',
    contactEmail: 'purchases@dpssec45.ac.in',
    requirementSummary: '1200 Sets NCERT Core Textbooks for Classes 6th to 9th with customized Book Covers',
    quantity: 1200,
    estimatedBudget: 620000,
    quoteAmount: 580000,
    deadline: '18 Sep 2026',
    status: 'Negotiation',
    notes: 'Requested staggered delivery across 3 phases starting next Monday.'
  },
  {
    id: 'SCH-REQ-884',
    schoolName: 'Army Public School, Dhaula Kuan',
    contactPerson: 'Col. R.K. Nair (Administrator)',
    contactPhone: '+91 94190 22334',
    contactEmail: 'admin@apsdk.edu.in',
    requirementSummary: '350 Pairs High-Grip White PT Sports Shoes (Sizes 3 to 8)',
    quantity: 350,
    estimatedBudget: 280000,
    quoteAmount: 262500,
    deadline: '30 Sep 2026',
    status: 'Accepted',
    notes: 'Advance 50% payment PO released. Expected dispatch in 10 days.'
  },
  {
    id: 'SCH-REQ-885',
    schoolName: 'The Heritage School, Rohini',
    contactPerson: 'Dr. Shalini Vashisht',
    contactPhone: '+91 99100 88776',
    contactEmail: 'principal@heritageschool.org',
    requirementSummary: '800 Annual Art & Craft Drawing Kits with watercolor cakes and sketch pens',
    quantity: 800,
    estimatedBudget: 320000,
    quoteAmount: 295000,
    deadline: '10 Oct 2026',
    status: 'Requirement Received',
    notes: 'Looking for non-toxic certified products only.'
  }
];

export const CUSTOMERS = [
  {
    id: 'CUST-001',
    name: 'Priya Sundaram',
    email: 'priya.sundaram@gmail.com',
    phone: '+91 99887 76655',
    schoolAffiliation: 'The Mother’s International School',
    studentName: 'Aarav Sundaram (Class 7)',
    totalOrders: 6,
    totalSpend: 8420,
    lastOrderDate: '05 Sep 2026',
    status: 'Active'
  },
  {
    id: 'CUST-002',
    name: 'Rohan Sharma',
    email: 'rohan.s@gmail.com',
    phone: '+91 98112 34567',
    schoolAffiliation: 'Delhi Public School, R.K. Puram',
    studentName: 'Diya Sharma (Class 9)',
    totalOrders: 4,
    totalSpend: 5120,
    lastOrderDate: '06 Sep 2026',
    status: 'Active'
  },
  {
    id: 'CUST-003',
    name: 'Amanpreet Singh',
    email: 'aman.singh@gmail.com',
    phone: '+91 98723 44556',
    schoolAffiliation: 'St. Xavier Senior Secondary',
    studentName: 'Gurkirat Singh (Class 10)',
    totalOrders: 3,
    totalSpend: 3490,
    lastOrderDate: '04 Sep 2026',
    status: 'Active'
  },
  {
    id: 'CUST-004',
    name: 'Kavita Deshmukh',
    email: 'kavita.deshmukh@gmail.com',
    phone: '+91 99230 11223',
    schoolAffiliation: 'Kendriya Vidyalaya No. 1',
    studentName: 'Omkar Deshmukh (Class 5)',
    totalOrders: 7,
    totalSpend: 9280,
    lastOrderDate: '02 Sep 2026',
    status: 'VIP'
  }
];

export const FINANCE_DATA = {
  totalRevenue: 348500,
  netProfit: 98200,
  pendingPayout: 24500,
  availableBalance: 48900,
  lastPayout: {
    date: '31 Aug 2026',
    amount: 48200,
    status: 'Credited',
    reference: 'NEFT-HDFC-9921034'
  },
  bankAccount: {
    bankName: 'HDFC Bank Ltd',
    accountHolder: 'Book Vardi Seller Hub',
    accountEnding: '9182',
    ifsc: 'HDFC0001245',
    branch: 'Cyber City, Gurugram'
  },
  recentTransactions: [
    { id: 'TXN-9081', date: '06 Sep 2026', description: 'Order Payout #ORD-2026-101', type: 'Credit', amount: 1395, status: 'Settled' },
    { id: 'TXN-9080', date: '05 Sep 2026', description: 'Order Payout #ORD-2026-102', type: 'Credit', amount: 1205, status: 'Settled' },
    { id: 'TXN-9079', date: '03 Sep 2026', description: 'Weekly Marketplace Commission Fee (8%)', type: 'Debit', amount: -2840, status: 'Deducted' },
    { id: 'TXN-9078', date: '31 Aug 2026', description: 'Automated Bank Settlement to HDFC **9182', type: 'Payout', amount: -48200, status: 'Processed' }
  ]
};

export const REVIEWS = [
  {
    id: 1,
    productId: 2,
    productName: 'KV Winter Uniform Sweater (Unisex)',
    customerName: 'Sunita Verma',
    rating: 5,
    date: '03 Sep 2026',
    comment: 'Superb quality wool! Kept my child warm all through winter, stitches are durable and color did not bleed after 3 washes.',
    reply: 'Thank you Sunita! Glad to provide authentic KV winter wear.'
  },
  {
    id: 2,
    productId: 7,
    productName: 'Girls Pleated Skirt Uniform',
    customerName: 'Meera Nambiar',
    rating: 4,
    date: '02 Sep 2026',
    comment: 'Fabric is crisp and iron-free as described. Waistband elastic is comfortable for full school days.',
    reply: 'Thanks Meera! We take pride in student daily comfort.'
  },
  {
    id: 3,
    productId: 3,
    productName: 'NCERT Mathematics Class 10',
    customerName: 'Rajesh Khanna',
    rating: 5,
    date: '28 Aug 2026',
    comment: 'Brand new 2026 revised print edition. Fast delivery within 24 hours in Delhi NCR.',
    reply: ''
  }
];

export const SHIPPING_PARTNERS = [
  { id: 'delhivery', name: 'Delhivery Surface & Express', active: true, avgDays: '2-3 Days', rate: '₹45 / 500g', trackingUrl: 'https://www.delhivery.com/track/package/' },
  { id: 'bluedart', name: 'BlueDart Air Premium', active: true, avgDays: '1-2 Days', rate: '₹75 / 500g', trackingUrl: 'https://www.bluedart.com/tracking' },
  { id: 'ekart', name: 'Ekart Logistics', active: true, avgDays: '2-4 Days', rate: '₹40 / 500g', trackingUrl: 'https://ekartlogistics.com' },
  { id: 'dtdc', name: 'DTDC Courier', active: false, avgDays: '3-5 Days', rate: '₹42 / 500g', trackingUrl: 'https://www.dtdc.in/tracking' }
];

export const NOTIFICATIONS = [
  { id: 1, title: 'New Bulk School Requirement', message: 'St. Xavier High School requested quotation for 500 uniform sets.', date: '10 mins ago', unread: true, type: 'school' },
  { id: 2, title: 'Low Stock Alert', message: 'Girls Pleated Skirt Uniform (Size M) is running below reorder threshold (8 units left).', date: '2 hours ago', unread: true, type: 'inventory' },
  { id: 3, title: 'Payout Credited', message: '₹48,200 has been transferred to your HDFC bank account.', date: '1 day ago', unread: false, type: 'finance' },
  { id: 4, title: 'New 5-Star Product Review', message: 'Sunita Verma left a 5-star review on KV Winter Sweater.', date: '2 days ago', unread: false, type: 'review' }
];

export const SELLER_SETTINGS = {
  storeName: 'Book Vardi Authorized Seller Hub',
  storeTagline: 'Verified School Uniforms, Books & Student Accessories',
  sellerLegalName: 'Vardi Book Retailers Private Limited',
  gstin: '07AAAAA0000A1Z5',
  pan: 'ABCDE1234F',
  email: 'seller.support@bookvardi.in',
  phone: '+91 98765 00000',
  warehouseAddress: 'Plot 42, Sector 18, Udyog Vihar Industrial Area, Gurugram, Haryana 122015',
  pickupContact: 'Dinesh Yadav (Logistics Head) • +91 98765 43210',
  autoAcceptOrders: true,
  emailNotifications: true,
  smsNotifications: true
};
`;

const combined = original.trimEnd() + '\n\n' + sellerExports.trim() + '\n';
fs.writeFileSync(path.resolve('src/data/mockData.js'), combined, 'utf8');
console.log('Successfully wrote combined mockData.js with all original and seller exports intact.');
