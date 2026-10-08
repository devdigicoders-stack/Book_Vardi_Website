import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Building2,
  UserCheck,
  MapPin,
  Package,
  Calendar,
  DollarSign,
  CheckCircle2,
  FileText,
  Send,
  Users,
  Globe,
  Sparkles,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  Eye,
  Camera,
  Check,
  Store,
  AlertCircle,
  Truck,
  ExternalLink,
  Lock,
  Printer,
  SlidersHorizontal,
  CreditCard,
  Download,
  XCircle
} from 'lucide-react';
import TaxInvoiceModal from '../Common/TaxInvoiceModal';
import OrderTrackingModal from '../Common/OrderTrackingModal';
import NegotiationTimelineDiv from './NegotiationTimelineDiv';
import QuotationVersionComparisonModal from './QuotationVersionComparisonModal';
import {
  fetchSingleBulkOrderApi,
  createSchoolBulkPrepaymentOrderApi,
  verifySchoolBulkPrepaymentApi,
  createSchoolBulkRemainingPaymentOrderApi,
  verifySchoolBulkRemainingPaymentApi,
  loadRazorpayScript,
  API_BASE_URL
} from '../../utils/api';

export default function BulkOrderPreviewModal({
  order: propOrder,
  onClose,
  userRole = 'seller', // 'consumer' | 'admin' | 'seller'
  initialTab = 'specs',
  sellers = [], // List of verified sellers for admin distribution
  onDistribute, // (orderId, { assignmentMode, sellerId, invitedSellerIds }) => void
  onApproveQuote, // (orderId, quoteId) => void
  onSubmitCounterDemand, // (orderId, quoteId, counterData) => Promise<{ success, message }>
  onSubmitQuote, // (orderId, { quoteAmount, unitPrice, itemPrices, volumeDiscountNote, estimatedDeliveryDays, notes }) => void
  onAcceptDirect, // (orderId) => void
  sellerUser = null // Current seller info when userRole === 'seller'
}) {
  const [internalOrder, setInternalOrder] = useState(propOrder);

  useEffect(() => {
    setInternalOrder(propOrder);
  }, [propOrder]);

  // Live fetch authoritative order with all quotations directly from backend
  useEffect(() => {
    const targetId = propOrder?.referenceId || propOrder?._id || propOrder?.id;
    if (targetId && (userRole === 'consumer' || userRole === 'admin')) {
      fetchSingleBulkOrderApi(targetId).then(res => {
        if (res?.success && res.order) {
          setInternalOrder(res.order);
          ['bv_customer_bulk_orders', 'bv_sync_school_orders'].forEach(key => {
            try {
              const list = JSON.parse(localStorage.getItem(key) || '[]');
              const idx = list.findIndex(o => String(o.id || o._id) === String(targetId) || o.referenceId === targetId);
              if (idx !== -1) {
                list[idx] = res.order;
                localStorage.setItem(key, JSON.stringify(list));
              }
            } catch (e) {}
          });
        }
      }).catch(() => {});
    }
  }, [propOrder?._id, propOrder?.referenceId, userRole]);

  const order = internalOrder || propOrder;

  // Active Lightbox / Image Preview
  const [zoomImage, setZoomImage] = useState(null);

  // Active Specific Demand Item Detail Modal
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);
  const [itemSellerPriceInput, setItemSellerPriceInput] = useState('');

  // Active Tab inside modal
  const [modalSubTab, setModalSubTab] = useState(initialTab || 'specs'); // 'specs', 'distribution', 'quotes', 'submit_quote'

  useEffect(() => {
    if (initialTab) {
      setModalSubTab(initialTab);
    }
  }, [initialTab]);

  // Admin Distribution State
  const [distributeMode, setDistributeMode] = useState(order?.assignmentMode || 'direct');
  const [selectedSingleSeller, setSelectedSingleSeller] = useState(
    order?.sellerId ? (typeof order.sellerId === 'object' ? (order.sellerId._id || order.sellerId.id) : order.sellerId) : ''
  );
  const [selectedMultipleSellers, setSelectedMultipleSellers] = useState(
    (order?.invitedSellerIds || []).map(s => (typeof s === 'object' ? (s._id || s.id) : s))
  );
  const [sellerSearchQuery, setSellerSearchQuery] = useState('');

  // Seller Quotation State
  const currentSellerId = sellerUser?.id || sellerUser?._id || '';
  const existingSellerQuote = Array.isArray(order?.quotations)
    ? order.quotations.find(q => String(q.sellerId) === String(currentSellerId))
    : null;

  const targetBudgetNum = Number(order?.targetBudgetPerKit || order?.estimatedBudget || 0);
  const totalQtyNum = Number(
    order?.totalQuantity ||
    order?.quantity ||
    (Array.isArray(order?.requirements) ? order.requirements.reduce((s, r) => s + Number(r.quantity || 0), 0) : 100)
  );

  const [quoteAmount, setQuoteAmount] = useState(
    existingSellerQuote ? String(existingSellerQuote.quoteAmount) : (targetBudgetNum ? String(targetBudgetNum) : '')
  );
  const [unitPrice, setUnitPrice] = useState(
    existingSellerQuote
      ? String(existingSellerQuote.unitPrice || 0)
      : (targetBudgetNum && totalQtyNum ? String(Math.round(targetBudgetNum / totalQtyNum)) : '')
  );
  const [deliveryDays, setDeliveryDays] = useState(
    existingSellerQuote ? String(existingSellerQuote.estimatedDeliveryDays || 7) : '7'
  );
  const [quoteNotes, setQuoteNotes] = useState(existingSellerQuote ? (existingSellerQuote.notes || '') : '');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  // Buyer Quotation Acceptance & Order Size Adjustment Modal State
  const [acceptQuoteModalData, setAcceptQuoteModalData] = useState(null);

  const handleOpenAcceptQuoteModal = (quote) => {
    const rawItems = Array.isArray(order.requirements) && order.requirements.length > 0
      ? order.requirements
      : [{ itemName: order.requirementSummary || 'Bulk Demanded Uniform/Stationery', quantity: totalQtyNum, category: 'Bulk Procurement' }];

    const items = rawItems.map((reqItem, idx) => {
      const quotedItem = quote.itemPrices?.find(
        ip => String(ip.itemId) === String(reqItem._id || reqItem.id || idx) || String(ip.itemName) === String(reqItem.itemName)
      );
      const unitRate = Number(quotedItem?.pricePerUnit || reqItem.sellerPricePerUnit || quote.unitPrice || 0);
      const qty = Number(reqItem.quantity || 1);
      return {
        itemId: String(reqItem._id || reqItem.id || idx),
        itemName: reqItem.itemName,
        category: reqItem.category || 'Bulk Procurement',
        pricePerUnit: unitRate,
        quantity: qty,
        totalPrice: qty * unitRate
      };
    });

    setAcceptQuoteModalData({
      quote,
      items
    });
  };

  // Keep state updated when order changes
  // Buyer Counter-Demand State
  const [counterDrawerQuote, setCounterDrawerQuote] = useState(null);
  const [counterTargetBudget, setCounterTargetBudget] = useState('');
  const [counterDeliveryDays, setCounterDeliveryDays] = useState('7');
  const [counterAdvancePct, setCounterAdvancePct] = useState('10');
  const [counterNotes, setCounterNotes] = useState('');
  const [counterItemDemands, setCounterItemDemands] = useState([]);
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);
  const [expandedHistoryQuotes, setExpandedHistoryQuotes] = useState({});

  const toggleHistory = (quoteId) => {
    setExpandedHistoryQuotes(prev => ({
      ...prev,
      [quoteId]: !prev[quoteId]
    }));
  };

  // Extended Interactive Timeline Div State
  const [expandedTimelineQuoteId, setExpandedTimelineQuoteId] = useState(null);
  const [selectedTimelineVersion, setSelectedTimelineVersion] = useState(null);

  const toggleTimelineForQuote = (qId, ver = null) => {
    if (expandedTimelineQuoteId === qId && (ver === null || ver === selectedTimelineVersion)) {
      setExpandedTimelineQuoteId(null);
      setSelectedTimelineVersion(null);
    } else {
      setExpandedTimelineQuoteId(qId);
      setSelectedTimelineVersion(ver);
    }
  };

  // Version Comparison Modal State
  const [comparingQuote, setComparingQuote] = useState(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const handleOpenVersionComparison = (q) => {
    setComparingQuote(q);
    setIsComparisonOpen(true);
  };

  const handleOpenCounterDrawer = (quote) => {
    setCounterDrawerQuote(quote);
    setCounterTargetBudget(quote.latestBuyerCounter?.targetBudget || quote.quoteAmount || '');
    setCounterDeliveryDays(quote.latestBuyerCounter?.requestedDeliveryDays || quote.estimatedDeliveryDays || 7);
    setCounterAdvancePct(quote.latestBuyerCounter?.proposedAdvancePercentage || 10);
    setCounterNotes(quote.latestBuyerCounter?.notes || '');
    if (Array.isArray(quote.itemPrices) && quote.itemPrices.length > 0) {
      setCounterItemDemands(quote.itemPrices.map(ip => {
        const matchingCounter = quote.latestBuyerCounter?.itemDemands?.find(
          cd => String(cd.itemId) === String(ip.itemId) || cd.itemName === ip.itemName
        );
        const qty = Number(matchingCounter?.quantity || ip.quantity) || 1;
        const targetRate = Number(matchingCounter?.targetUnitPrice ?? ip.customerBudget ?? ip.pricePerUnit) || 0;
        return {
          itemId: ip.itemId,
          itemName: ip.itemName,
          quantity: qty,
          currentSellerPrice: ip.pricePerUnit || 0,
          targetUnitPrice: targetRate,
          targetTotalPrice: qty * targetRate,
          notes: matchingCounter?.notes || ''
        };
      }));
    } else if (Array.isArray(order?.requirements) && order.requirements.length > 0) {
      setCounterItemDemands(order.requirements.map((r, idx) => ({
        itemId: r._id || r.id || idx,
        itemName: r.itemName,
        quantity: Number(r.quantity) || 1,
        currentSellerPrice: Number(r.sellerPricePerUnit || quote.unitPrice) || 0,
        targetUnitPrice: Number(r.budgetPerUnit || quote.unitPrice) || 0,
        targetTotalPrice: (Number(r.quantity) || 1) * (Number(r.budgetPerUnit || quote.unitPrice) || 0),
        notes: ''
      })));
    } else {
      setCounterItemDemands([]);
    }
  };

  const handleCounterItemQuantityChange = (index, val) => {
    setCounterItemDemands(prev => {
      const updated = [...prev];
      const numQty = val === '' ? '' : Math.max(1, parseInt(val, 10) || 1);
      const effectiveQty = Number(numQty) || 0;
      const targetRate = Number(updated[index].targetUnitPrice) || 0;
      updated[index] = {
        ...updated[index],
        quantity: numQty,
        targetTotalPrice: effectiveQty * targetRate
      };
      const sum = updated.reduce((s, it) => s + (Number(it.targetTotalPrice) || 0), 0);
      if (sum > 0) setCounterTargetBudget(sum);
      return updated;
    });
  };

  const handleCounterItemPriceChange = (index, val) => {
    setCounterItemDemands(prev => {
      const updated = [...prev];
      const targetRate = val === '' ? '' : Math.max(0, Number(val) || 0);
      const effectiveRate = Number(targetRate) || 0;
      const qty = Number(updated[index].quantity) || 1;
      updated[index] = {
        ...updated[index],
        targetUnitPrice: targetRate,
        targetTotalPrice: effectiveRate * qty
      };
      const sum = updated.reduce((s, it) => s + (Number(it.targetTotalPrice) || 0), 0);
      if (sum > 0) setCounterTargetBudget(sum);
      return updated;
    });
  };

  const handleSubmitCounterDemand = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!counterDrawerQuote || !onSubmitCounterDemand) return;
    setIsSubmittingCounter(true);
    try {
      const qId = counterDrawerQuote._id || counterDrawerQuote.id;
      const oId = order._id || order.id || order.referenceId;
      const cleanItemDemands = counterItemDemands.map(it => {
        const qty = Math.max(1, Number(it.quantity) || 1);
        const rate = Math.max(0, Number(it.targetUnitPrice) || 0);
        return {
          itemId: it.itemId,
          itemName: it.itemName,
          quantity: qty,
          currentSellerPrice: Number(it.currentSellerPrice) || 0,
          targetUnitPrice: rate,
          targetTotalPrice: qty * rate,
          notes: it.notes || ''
        };
      });
      const totalUnits = cleanItemDemands.reduce((s, it) => s + it.quantity, 0);
      const computedBudget = Number(counterTargetBudget) || cleanItemDemands.reduce((s, it) => s + it.targetTotalPrice, 0);

      const payload = {
        targetBudget: computedBudget,
        unitPrice: totalUnits > 0 ? Math.round(computedBudget / totalUnits) : 0,
        totalQuantity: totalUnits,
        requestedDeliveryDays: Number(counterDeliveryDays) || 7,
        proposedAdvancePercentage: Number(counterAdvancePct) || 0,
        proposedAdvanceAmount: computedBudget ? Math.round((computedBudget * (Number(counterAdvancePct) || 0)) / 100) : 0,
        itemDemands: cleanItemDemands,
        notes: counterNotes
      };
      const res = await onSubmitCounterDemand(oId, qId, payload);
      if (res && res.success !== false) {
        setCounterDrawerQuote(null);
      }
    } catch (err) {
      console.error('Error submitting counter demand:', err);
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  // Buyer Online Razorpay Prepayment Handler
  const [isPayingPrepayment, setIsPayingPrepayment] = useState(false);

  const handleInitiateOnlinePrepayment = async (quote, advAmount) => {
    try {
      setIsPayingPrepayment(true);
      const isRazorpayReady = await loadRazorpayScript();
      if (!isRazorpayReady || typeof window.Razorpay === 'undefined') {
        alert('Razorpay payment gateway failed to load. Please check your internet connection.');
        setIsPayingPrepayment(false);
        return;
      }

      const targetId = order._id || order.id || order.referenceId;
      const quoteTargetId = quote?._id || quote?.id;
      const rzpRes = await createSchoolBulkPrepaymentOrderApi(targetId, { quoteId: quoteTargetId });

      if (!rzpRes?.success && !rzpRes?.razorpayOrderId) {
        alert(rzpRes?.message || 'Failed to initialize online prepayment order.');
        setIsPayingPrepayment(false);
        return;
      }

      const contactNameVal = order.contactName || order.contactPerson || 'School Client';
      const contactPhoneVal = order.contactPhone || order.userPhone || '';
      const contactEmailVal = order.contactEmail || order.userEmail || '';

      const options = {
        key: rzpRes.key || 'rzp_test_6kz5nGEzi8uXRw',
        amount: rzpRes.amount,
        currency: rzpRes.currency || 'INR',
        name: 'Book Vardi B2B Supply',
        description: `Advance Prepayment for Order ${order.referenceId || ''}`,
        order_id: rzpRes.razorpayOrderId,
        prefill: {
          name: contactNameVal,
          email: contactEmailVal,
          contact: contactPhoneVal
        },
        theme: {
          color: '#0f766e'
        },
        handler: async (response) => {
          try {
            const verifyRes = await verifySchoolBulkPrepaymentApi(targetId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paidAmount: rzpRes.advanceAmountRupees || advAmount,
              quoteId: quoteTargetId
            });

            if (verifyRes?.success && verifyRes.order) {
              setInternalOrder(verifyRes.order);
              ['bv_customer_bulk_orders', 'bv_sync_school_orders'].forEach(key => {
                try {
                  const list = JSON.parse(localStorage.getItem(key) || '[]');
                  const idx = list.findIndex(o => String(o.id || o._id) === String(targetId) || o.referenceId === targetId);
                  if (idx !== -1) {
                    list[idx] = verifyRes.order;
                    localStorage.setItem(key, JSON.stringify(list));
                  }
                } catch (e) {}
              });
              window.dispatchEvent(new Event('bv_school_orders_updated'));
              alert(`🎉 Online Prepayment of ₹${(rzpRes.advanceAmountRupees || advAmount).toLocaleString()} Successful! The seller has been notified to begin packing and fulfillment.`);
            } else {
              alert(verifyRes?.message || 'Payment received but verification failed. Please contact support.');
            }
          } catch (vErr) {
            console.error('Prepayment verification error:', vErr);
            alert('Online prepayment verification error. Please refresh and check status.');
          } finally {
            setIsPayingPrepayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPayingPrepayment(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      console.error('Initiate prepayment error:', err);
      const errMsg = err.data?.message || err.message || 'Failed to initialize online payment gateway.';
      if (errMsg.includes('mutually verified') || errMsg.includes('counter-demand') || errMsg.includes('agreed')) {
        alert(`🤝 Quotation Agreement Required:\n\n${errMsg}\n\nPlease verify and confirm the quotation decision with the seller before proceeding with prepayment.`);
      } else {
        alert(`⚠️ Prepayment Notice: ${errMsg}`);
      }
      setIsPayingPrepayment(false);
    }
  };

  // Buyer Online Razorpay / UPI Remaining Balance Handler
  const [isPayingRemaining, setIsPayingRemaining] = useState(false);

  const handleInitiateOnlineRemainingPayment = async (quote, remAmount) => {
    try {
      setIsPayingRemaining(true);
      const isRazorpayReady = await loadRazorpayScript();
      if (!isRazorpayReady || typeof window.Razorpay === 'undefined') {
        alert('Razorpay payment gateway failed to load. Please check your internet connection.');
        setIsPayingRemaining(false);
        return;
      }

      const targetId = order._id || order.id || order.referenceId;
      const rzpRes = await createSchoolBulkRemainingPaymentOrderApi(targetId);

      if (!rzpRes?.success && !rzpRes?.razorpayOrderId) {
        alert(rzpRes?.message || 'Failed to initialize online remaining balance payment.');
        setIsPayingRemaining(false);
        return;
      }

      const contactNameVal = order.contactName || order.contactPerson || 'School Client';
      const contactPhoneVal = order.contactPhone || order.userPhone || '';
      const contactEmailVal = order.contactEmail || order.userEmail || '';

      const options = {
        key: rzpRes.key || 'rzp_test_6kz5nGEzi8uXRw',
        amount: rzpRes.amount,
        currency: rzpRes.currency || 'INR',
        name: 'Book Vardi B2B Supply',
        description: `Remaining Balance Settlement for Order ${order.referenceId || ''}`,
        order_id: rzpRes.razorpayOrderId,
        prefill: {
          name: contactNameVal,
          email: contactEmailVal,
          contact: contactPhoneVal
        },
        theme: {
          color: '#0f766e'
        },
        handler: async (response) => {
          try {
            const verifyRes = await verifySchoolBulkRemainingPaymentApi(targetId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paidAmount: rzpRes.remainingAmountRupees || remAmount
            });

            if (verifyRes?.success && verifyRes.order) {
              setInternalOrder(verifyRes.order);
              ['bv_customer_bulk_orders', 'bv_sync_school_orders'].forEach(key => {
                try {
                  const list = JSON.parse(localStorage.getItem(key) || '[]');
                  const idx = list.findIndex(o => String(o.id || o._id) === String(targetId) || o.referenceId === targetId);
                  if (idx !== -1) {
                    list[idx] = verifyRes.order;
                    localStorage.setItem(key, JSON.stringify(list));
                  }
                } catch (e) {}
              });
              window.dispatchEvent(new Event('bv_school_orders_updated'));
              alert(`🎉 Remaining Balance Payment of ₹${(rzpRes.remainingAmountRupees || remAmount).toLocaleString()} Verified via UPI/Razorpay! Your bulk order is now officially COMPLETED.`);
            } else {
              alert(verifyRes?.message || 'Payment received but verification failed. Please contact support.');
            }
          } catch (vErr) {
            console.error('Remaining payment verification error:', vErr);
            alert('Online remaining payment verification error. Please refresh and check status.');
          } finally {
            setIsPayingRemaining(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPayingRemaining(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      console.error('Initiate remaining payment error:', err);
      alert('Failed to connect to online payment gateway: ' + err.message);
      setIsPayingRemaining(false);
    }
  };

  useEffect(() => {
    if (order) {
      if (initialTab) {
        setModalSubTab(initialTab);
      }
      setDistributeMode(order.assignmentMode || 'direct');
      setSelectedSingleSeller(order.sellerId ? (typeof order.sellerId === 'object' ? (order.sellerId._id || order.sellerId.id) : order.sellerId) : '');
      setSelectedMultipleSellers(
        (order.invitedSellerIds || []).map(s => (typeof s === 'object' ? (s._id || s.id) : s))
      );
    }
  }, [order, initialTab]);

  // Normalization Helpers
  const refId = order?.referenceId || order?.id || (order?._id ? `SCH-${order._id}` : 'SCH-BULK');
  const instName = order?.institutionName || order?.schoolName || 'School / College';
  const instType = order?.institutionType || 'Educational Institution';
  const schId = order?.schoolId || '';

  const contactName = order?.contactName || order?.contactPerson || 'Purchaser Contact';
  const contactPhone = order?.contactPhone || 'N/A';
  const contactEmail = order?.contactEmail || 'N/A';
  const designation = order?.designation || 'Administrator';

  const address = order?.address || order?.addressLine || 'N/A';
  const city = order?.city || 'Delhi';
  const state = order?.state || 'Delhi';
  const pincode = order?.pincode || '';

  const requirementsList = useMemo(() => {
    if (!order) return [];
    return Array.isArray(order.requirements) && order.requirements.length > 0
      ? order.requirements
      : [
          {
            category: 'Bulk Procurement',
            itemName: order?.requirementSummary || order?.additionalNotes || 'Bulk School Uniform & Stationery',
            quantity: totalQtyNum,
            budgetPerUnit: targetBudgetNum && totalQtyNum ? Math.round(targetBudgetNum / totalQtyNum) : 0,
            sellerPricePerUnit: 0,
            sampleImage: '',
            notes: order?.additionalNotes || ''
          }
        ];
  }, [order, totalQtyNum, targetBudgetNum]);

  // Descriptive Pitch State: Line-by-line product demand pricing and scale notes
  const [pitchItems, setPitchItems] = useState([]);
  const [volumeDiscountNote, setVolumeDiscountNote] = useState(
    existingSellerQuote?.volumeDiscountNote || 'Prices can be decreased if order quantity increases.'
  );

  useEffect(() => {
    if (requirementsList && requirementsList.length > 0) {
      const mapped = requirementsList.map((item, idx) => {
        const existingItemPrice = existingSellerQuote?.itemPrices?.find(
          ip => String(ip.itemId) === String(item._id || item.id || idx) || String(ip.itemName) === String(item.itemName)
        );
        const custBudget = Number(item.budgetPerUnit || item.budgetUnit || 0);
        const currentSellerPrice = existingItemPrice
          ? Number(existingItemPrice.pricePerUnit || 0)
          : (Number(item.sellerPricePerUnit || item.sellerPrice || 0) || custBudget || 0);
        const qty = Number(item.quantity || 1);

        return {
          itemId: String(item._id || item.id || idx),
          itemName: item.itemName,
          category: item.category || 'Bulk Procurement',
          quantity: qty,
          customerBudget: custBudget,
          pricePerUnit: currentSellerPrice,
          totalPrice: qty * currentSellerPrice,
          discountTierNote: existingItemPrice?.discountTierNote || ''
        };
      });
      setPitchItems(mapped);
    }
    if (existingSellerQuote?.volumeDiscountNote) {
      setVolumeDiscountNote(existingSellerQuote.volumeDiscountNote);
    }
  }, [requirementsList, existingSellerQuote]);

  // Live calculations for the Seller Pitch
  const calculatedGrandTotal = useMemo(() => {
    return pitchItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.pricePerUnit || 0)), 0);
  }, [pitchItems]);

  const totalCustomerTargetBudget = useMemo(() => {
    return requirementsList.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.budgetPerUnit || item.budgetUnit || 0)), 0);
  }, [requirementsList]);

  const calculatedAvgUnitPrice = useMemo(() => {
    return totalQtyNum > 0 ? Math.round(calculatedGrandTotal / totalQtyNum) : 0;
  }, [calculatedGrandTotal, totalQtyNum]);

  const handleItemPriceChange = (index, newPrice) => {
    setPitchItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const priceNum = Math.max(0, Number(newPrice) || 0);
      item.pricePerUnit = priceNum;
      item.totalPrice = (Number(item.quantity) || 1) * priceNum;
      updated[index] = item;
      return updated;
    });
  };

  const handleItemDiscountNoteChange = (index, noteText) => {
    setPitchItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], discountTierNote: noteText };
      return updated;
    });
  };

  const winningQuote = Array.isArray(order?.quotations)
    ? order.quotations.find(q => q.status === 'approved' || q.status === 'buyer_accepted' || q.status === 'seller_accepted' || String(q._id) === String(order?.acceptedQuoteId))
    : null;

  // Logistics tracking gating: strictly visible when Out for Delivery & partner decided
  const normStatus = String(order?.deliveryStatus || order?.status || '').toLowerCase().replace(/_/g, ' ');
  const isOut = normStatus === 'out for delivery' || normStatus === 'delivered' || normStatus === 'completed' || normStatus === 'received';
  const riderName = order?.deliveryDetails?.deliveryBoyName || order?.selfDeliveryDetails?.deliveryPersonName || order?.deliveryBoyName || '';
  const isSelf = true; // Bulk institutional orders are strictly Self-Delivery
  const tokenVal = order?.deliveryDetails?.deliveryPartnerToken || order?.deliveryDetails?.trackingId || order?.selfDeliveryDetails?.deliveryPartnerToken || (order?.referenceId ? `BV-SLF-${order.referenceId}` : '');
  const canViewTracking = isOut && Boolean(tokenVal || riderName);

  const deliveryPartnerDisplay = riderName ? `Direct Self-Delivery (Rider: ${riderName})` : 'Direct Self-Delivery (Store Fleet)';
  const trackingNumberDisplay = tokenVal;
  const isSelfOrder = String(order?.deliveryType || order?.fulfillmentType || '').toLowerCase().includes('self') || !order?.courierName;
  const trackingLinkDisplay = !isSelfOrder ? (order?.deliveryDetails?.trackingUrl || order?.trackingUrl || '') : '';

  // Transform bulk order into TaxInvoice-compatible object
  const taxInvoiceOrder = useMemo(() => {
    if (!order) return null;
    const totalQty = Number(order.totalQuantity || order.quantity || (Array.isArray(order.requirements) ? order.requirements.reduce((s, r) => s + Number(r.quantity || 0), 0) : 100));
    const quoteVal = Number(winningQuote?.quoteAmount || order.targetBudgetPerKit || order.estimatedBudget || order.overallBudget || 0);
    const avgPrice = totalQty > 0 ? Math.round(quoteVal / totalQty) : 0;

    const reqItems = Array.isArray(order.requirements) && order.requirements.length > 0
      ? order.requirements.map((r, idx) => ({
          id: r._id || idx + 1,
          name: r.itemName || 'School Supply Item',
          category: r.category || 'School Uniform',
          quantity: Number(r.quantity || 1),
          price: Number(r.sellerPricePerUnit || (winningQuote?.itemPrices?.find(ip => String(ip.itemId || ip.itemName) === String(r._id || r.itemName))?.pricePerUnit) || avgPrice || 100),
          sellerName: winningQuote?.sellerStoreName || winningQuote?.sellerName || 'Verified Institutional Seller',
          sellerStoreName: winningQuote?.sellerStoreName || winningQuote?.sellerName || 'Verified Institutional Seller'
        }))
      : [{
          id: 1,
          name: order.requirementSummary || 'Institutional Bulk Supply Order',
          category: 'School Uniform',
          quantity: totalQty,
          price: avgPrice,
          sellerName: winningQuote?.sellerStoreName || winningQuote?.sellerName || 'Verified Institutional Seller',
          sellerStoreName: winningQuote?.sellerStoreName || winningQuote?.sellerName || 'Verified Institutional Seller'
        }];

    return {
      id: order.referenceId || order.id || order._id || 'BULK-PO',
      orderId: order.referenceId || order.id || order._id || 'BULK-PO',
      date: new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB'),
      customerName: order.institutionName || order.contactName || 'School Administrator',
      customerPhone: order.contactPhone || 'N/A',
      address: `${order.address || ''}, ${order.city || ''}, ${order.state || ''} ${order.pincode ? '- ' + order.pincode : ''}`.trim() || 'Campus Delivery Address',
      shippingAddress: {
        street: order.address || 'Campus Delivery Address',
        city: order.city || 'Lucknow',
        state: order.state || 'Uttar Pradesh',
        pincode: order.pincode || '226001'
      },
      school: order.institutionName || 'Institutional Order',
      paymentMethod: 'School PO / Bank Transfer',
      paymentStatus: 'paid',
      status: order.deliveryStatus || order.status || 'confirmed',
      overallStatus: order.deliveryStatus || order.status || 'confirmed',
      deliveryMode: order.deliveryMode || '',
      courierName: order.courierName || '',
      trackingNumber: order.trackingNumber || '',
      trackingUrl: order.trackingUrl || '',
      selfDeliveryDetails: order.selfDeliveryDetails || null,
      sellerName: winningQuote?.sellerStoreName || winningQuote?.sellerName || 'BookVardi Verified Seller',
      sellerStoreName: winningQuote?.sellerStoreName || winningQuote?.sellerName || 'BookVardi Verified Seller',
      sellerPhone: winningQuote?.sellerPhone || 'Helpline',
      items: reqItems,
      total: quoteVal
    };
  }, [order, winningQuote]);

  // Filtered sellers for Admin Distribution
  const verifiedSellers = useMemo(() => {
    return (sellers || []).filter(s =>
      s.status === 'Verified' || s.status === 'approved' || s.status === 'Active' || !s.status
    );
  }, [sellers]);

  const filteredSellersForModal = useMemo(() => {
    if (!sellerSearchQuery.trim()) return verifiedSellers;
    const q = sellerSearchQuery.toLowerCase();
    return verifiedSellers.filter(s =>
      (s.storeName || s.businessName || '').toLowerCase().includes(q) ||
      (s.ownerName || s.name || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q)
    );
  }, [verifiedSellers, sellerSearchQuery]);

  const toggleSellerSelect = (sId) => {
    setSelectedMultipleSellers(prev =>
      prev.includes(sId) ? prev.filter(id => id !== sId) : [...prev, sId]
    );
  };

  const handleAdminDistributionSubmit = (e) => {
    e.preventDefault();
    if (!onDistribute) return;

    if (distributeMode === 'direct' && !selectedSingleSeller) {
      alert('Please select a seller for direct assignment.');
      return;
    }
    if (distributeMode === 'selected' && selectedMultipleSellers.length === 0) {
      alert('Please select at least one seller to invite.');
      return;
    }

    onDistribute(order.id || order._id, {
      assignmentMode: distributeMode,
      sellerId: distributeMode === 'direct' ? selectedSingleSeller : null,
      invitedSellerIds: distributeMode === 'selected' ? selectedMultipleSellers : []
    });

    setModalSubTab('specs');
  };

  const handleSellerQuoteSubmit = (e) => {
    e.preventDefault();
    if (!onSubmitQuote) return;

    const finalAmount = calculatedGrandTotal > 0 ? calculatedGrandTotal : Number(quoteAmount);
    if (!finalAmount || finalAmount <= 0) {
      alert("Please enter a valid price for the demanded items.");
      return;
    }

    onSubmitQuote(order.id || order._id, {
      quoteAmount: finalAmount,
      unitPrice: calculatedAvgUnitPrice,
      itemPrices: pitchItems,
      volumeDiscountNote: volumeDiscountNote || 'Prices can be decreased if order quantity increases.',
      estimatedDeliveryDays: Number(deliveryDays) || 7,
      notes: quoteNotes
    });

    setModalSubTab('specs');
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col border border-gray-200">
        
        {/* Top Header */}
        <div className="bg-linear-to-r from-teal-900 via-teal-800 to-teal-950 text-white p-5 flex items-center justify-between shrink-0 border-b border-teal-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-teal-950 flex items-center justify-center font-bold shadow-md">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded border border-white/20">
                  {refId}
                </span>
                <h2 className="text-lg font-extrabold text-white font-display line-clamp-1">{instName}</h2>
              </div>
              <p className="text-xs text-teal-200 mt-0.5 flex items-center gap-2">
                <span>{instType}</span>
                <span>•</span>
                <span>{city}, {state}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
              order.status === 'quote_accepted'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : order.status === 'published' || order.status === 'assigned'
                ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
            }`}>
              {order.status === 'quote_accepted' ? 'Quote Accepted & Finalized' :
               order.status === 'published' ? 'Marketplace RFQ Published' :
               order.status === 'assigned' ? 'Assigned to Vendor' : 'Pending Distribution'}
            </span>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-teal-200 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Action Sub-Navigation Tabs */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto text-xs font-bold shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalSubTab('specs')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                modalSubTab === 'specs'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText size={14} />
              <span>Full Specifications</span>
            </button>

            {/* Admin Distribution Tab */}
            {userRole === 'admin' && (
              <button
                onClick={() => setModalSubTab('distribution')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalSubTab === 'distribution'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-teal-800 hover:bg-teal-50'
                }`}
              >
                <Send size={14} />
                <span>Distribute / Channel Mode</span>
              </button>
            )}

            {/* Vendor Quotes Tab */}
            <button
              onClick={() => setModalSubTab('quotes')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                modalSubTab === 'quotes'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-purple-800 hover:bg-purple-50'
              }`}
            >
              <Sparkles size={14} />
              <span>Vendor Quotations ({order.quotations?.length || 0})</span>
            </button>

            {/* Live Consignment Tracking Button */}
            <button
              type="button"
              onClick={() => setIsTrackingOpen(true)}
              className="px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-teal-800 to-emerald-800 hover:from-teal-900 hover:to-emerald-900 text-white font-extrabold shadow-xs"
            >
              <Truck size={14} className="text-amber-300 animate-pulse" />
              <span>Track Live Consignment</span>
            </button>

            {/* Seller Proposal Form Tab */}
            {userRole === 'seller' && (
              <button
                onClick={() => setModalSubTab('submit_quote')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalSubTab === 'submit_quote'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <Send size={14} />
                <span>{existingSellerQuote ? 'Pitch Updated Quotation' : 'Pitch Proposal Quotation'}</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-gray-400 font-mono hidden sm:inline-block">
            Created: {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-800 flex-1">
          
          {/* TAB 1: FULL EXPANDED SPECIFICATIONS */}
          {modalSubTab === 'specs' && (
            <div className="space-y-6">
              
              {/* Institution & Contact Header Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/80 p-5 rounded-2xl border border-gray-200">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-xs text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={15} /> School & Institution Information
                  </h3>
                  <div className="text-sm font-bold text-gray-900">{instName}</div>
                  <div className="text-gray-600">Type: <strong className="text-gray-800">{instType}</strong></div>
                  {schId && <div className="text-gray-600">School ID / Affiliation: <strong className="font-mono text-gray-800">{schId}</strong></div>}
                </div>

                <div className="space-y-2 border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-4">
                  <h3 className="font-extrabold text-xs text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={15} /> Authorized Administrator Contact
                  </h3>
                  <div className="text-sm font-bold text-gray-900">{contactName} ({designation})</div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <span className="flex items-center gap-1 font-semibold"><Phone size={13} className="text-gray-400" /> {contactPhone}</span>
                    <span className="flex items-center gap-1"><Mail size={13} className="text-gray-400" /> {contactEmail}</span>
                  </div>
                </div>
              </div>

              {/* Delivery School Address Card */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-1">
                <h3 className="font-extrabold text-xs text-purple-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <MapPin size={15} /> Campus Delivery Address & Location
                </h3>
                <div className="font-bold text-gray-900 text-xs">{address}</div>
                <div className="text-gray-700">
                  {city}, {state} - <strong className="font-mono text-gray-900">{pincode || '226001'}</strong>
                </div>
              </div>

              {/* Approved Winning Quotation / Status Banners */}
              {(() => {
                const assignedId = order.sellerId ? (typeof order.sellerId === 'object' ? (order.sellerId._id || order.sellerId.id) : order.sellerId) : '';
                const isAcceptedToMe = winningQuote && String(winningQuote.sellerId) === String(currentSellerId);
                const isAcceptedOtherSeller = (order.status === 'quote_accepted' || winningQuote) && assignedId && String(assignedId) !== String(currentSellerId);

                if (isAcceptedToMe && userRole === 'seller') {
                  const modalAdvAmt = winningQuote?.prepaymentAmount || winningQuote?.sellerAdvanceAmount || order.sellerAdvanceAmount || order.prepaymentAmount || 0;
                  const modalAdvPct = winningQuote?.prepaymentPercentage || winningQuote?.sellerAdvancePercentage || order.sellerAdvancePercentage || order.prepaymentPercentage || 0;
                  const isPrepaymentPaid = order.advancePaymentStatus === 'paid' || (order.advancePaidAmount && order.advancePaidAmount >= modalAdvAmt);
                  const isModalPrepaymentPending = (Number(modalAdvAmt) > 0 || Number(modalAdvPct) > 0) && !isPrepaymentPaid;

                  return (
                    isModalPrepaymentPending ? (
                      <div className="bg-amber-500 text-amber-950 p-4.5 rounded-2xl shadow-md space-y-1.5 border border-amber-400">
                        <div className="font-black text-sm flex items-center gap-2">
                          <Sparkles size={18} className="text-amber-100" /> ⏳ Pitch Selected • Prepayment Pending
                        </div>
                        <p className="text-xs text-amber-950 font-medium">
                          The customer selected your quotation pitch of <strong>₹{Number(winningQuote.quoteAmount).toLocaleString()}</strong>. Fulfillment and packing will unlock once the buyer's online prepayment of <strong>₹{Number(modalAdvAmt).toLocaleString()}{modalAdvPct > 0 ? ` (${modalAdvPct}%)` : ''}</strong> is transferred.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-emerald-600 text-white p-4.5 rounded-2xl shadow-md space-y-1.5 border border-emerald-500">
                        <div className="font-black text-sm flex items-center gap-2">
                          <Sparkles size={18} className="text-amber-300" /> 🎉 Order Received! Customer Accepted & Prepayment Confirmed
                        </div>
                        <p className="text-xs text-emerald-100 font-medium">
                          Congratulations! The customer accepted your quotation pitch of <strong>₹{Number(winningQuote.quoteAmount).toLocaleString()}</strong> and verified online prepayment. Admin and Customer have received your fulfillment commitment.
                        </p>
                      </div>
                    )
                  );
                }

                if (isAcceptedOtherSeller && userRole === 'seller' && existingSellerQuote) {
                  return (
                    <div className="bg-amber-50 border border-amber-300 text-amber-950 p-4.5 rounded-2xl shadow-xs space-y-1.5">
                      <div className="font-extrabold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-700" /> ℹ️ User Accepted Quotation from Another Seller
                      </div>
                      <p className="text-xs text-amber-900 font-medium">
                        The customer has selected and accepted another vendor's quotation pitch ({winningQuote ? (winningQuote.sellerStoreName || winningQuote.sellerName) : 'Other Vendor'}). Thank you for submitting your proposal!
                      </p>
                    </div>
                  );
                }

                if (winningQuote) {
                  return (
                    <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-sm">
                          <CheckCircle2 size={18} className="text-emerald-600" /> Approved & Winning Vendor Quotation
                        </span>
                        <span className="font-extrabold text-lg text-emerald-950 font-mono">
                          ₹{Number(winningQuote.quoteAmount).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-emerald-200">
                        <div>
                          <span className="text-gray-400">Fulfilled By:</span>
                          <div className="font-bold text-gray-900">{winningQuote.sellerStoreName || winningQuote.sellerName}</div>
                        </div>
                        {userRole === 'admin' && winningQuote.sellerPhone && (
                          <div>
                            <span className="text-gray-400">Vendor Phone:</span>
                            <div className="font-bold text-gray-900">{winningQuote.sellerPhone}</div>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">Delivery Lead Time:</span>
                          <div className="font-bold text-gray-900">{winningQuote.estimatedDeliveryDays || 7} Days</div>
                        </div>
                        {winningQuote.notes && (
                          <div className="col-span-2 sm:col-span-3 text-gray-700 italic border-t border-gray-100 pt-1 mt-1">
                            "{winningQuote.notes}"
                          </div>
                        )}
                      </div>

                      {/* Financial Settlement Card: Advance Paid & Remaining Balance Due */}
                      {(() => {
                        const totalVal = Number(winningQuote.quoteAmount || winningQuote.totalPrice || order.overallBudget || 0);
                        const advPaid = Number(order.advancePaidAmount || (order.advancePaymentStatus === 'paid' ? (winningQuote.prepaymentAmount || Math.round(totalVal * 0.3)) : 0));
                        const totalPaid = advPaid + Number(order.remainingPaidAmount || 0);
                        
                        // Remaining unpaid balance due on delivery
                        const isRemPaid = order.remainingPaymentStatus === 'paid' || (totalPaid >= totalVal && totalVal > 0);
                        const remDue = isRemPaid ? 0 : Math.max(0, totalVal - advPaid);

                        return (
                          <div className="bg-white p-3 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                                <DollarSign size={13} className="text-emerald-600" /> Financial Settlement Breakdown
                              </span>
                              <div className="flex flex-wrap items-center gap-3">
                                <div>
                                  <span className="text-gray-500">Agreed Contract:</span>{' '}
                                  <strong className="text-gray-900 font-mono">₹{totalVal.toLocaleString()}</strong>
                                </div>
                                <div className="border-l border-gray-200 pl-3">
                                  <span className="text-gray-500">Advance Paid:</span>{' '}
                                  <strong className="text-emerald-700 font-mono">₹{advPaid.toLocaleString()}</strong>
                                </div>
                                <div className="border-l border-gray-200 pl-3">
                                  <span className="text-gray-500">Remaining on Delivery:</span>{' '}
                                  <strong className={isRemPaid ? "text-emerald-700 font-mono" : "text-amber-800 font-mono font-bold"}>₹{remDue.toLocaleString()}</strong>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {order.advancePaymentStatus === 'paid' && (
                                <button
                                  type="button"
                                  onClick={() => window.open(`${API_BASE_URL}/schools/bulk-orders/${order._id || order.id || order.referenceId}/advance-receipt`, '_blank')}
                                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Download size={13} className="text-emerald-700" />
                                  <span>Prepayment Invoice (PDF)</span>
                                </button>
                              )}

                              {isRemPaid ? (
                                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 font-extrabold text-xs rounded-xl border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 size={13} className="text-emerald-700" /> Balance Paid & Order Completed
                                </span>
                              ) : (userRole === 'consumer' && remDue > 0) ? (
                                <button
                                  type="button"
                                  onClick={() => handleInitiateOnlineRemainingPayment(winningQuote, remDue)}
                                  disabled={isPayingRemaining}
                                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 animate-pulse"
                                >
                                  <CreditCard size={13} />
                                  <span>{isPayingRemaining ? 'Processing...' : `Pay Remaining ₹${remDue.toLocaleString()} Online`}</span>
                                </button>
                              ) : (
                                <span className="px-3 py-1.5 bg-amber-50 text-amber-900 font-extrabold text-xs rounded-xl border border-amber-300 flex items-center gap-1">
                                  <Clock size={13} className="text-amber-700" /> Pending Balance (₹{remDue.toLocaleString()})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Action Row: View Tax Invoice Button & Tracking Status */}
                      <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setIsInvoiceOpen(true)}
                          className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText size={14} />
                          <span>View Official Tax Invoice & PO Certificate</span>
                        </button>

                        {canViewTracking ? (
                          <div className="flex items-center gap-2 bg-emerald-100/90 text-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs">
                            <Truck size={14} className="text-emerald-700" />
                            <span>{isSelf ? '🛵 Self-Delivery' : `🚚 ${order.courierName || 'Courier'}`}:</span>
                            <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">{trackingNumberDisplay}</span>
                            {trackingLinkDisplay && (
                              <a
                                href={trackingLinkDisplay}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-0.5 ml-1"
                              >
                                Track <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1.5">
                            <Lock size={12} className="text-gray-400" />
                            <span>
                              {isOut ? 'Out for Delivery (Delivery partner pending)' : 'Tracking available once Out for Delivery & partner decided'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Demanded Line Items Table with Sample Photos & Distinct Seller Price Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={15} className="text-teal-700" /> Demanded Line Items ({requirementsList.length})
                  </h3>

                  <div className="flex items-center gap-2">
                    {order.overallBudget > 0 && (
                      <span className="font-extrabold text-xs text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 font-mono">
                        Overall Budget: ₹{Number(order.overallBudget).toLocaleString()}
                      </span>
                    )}
                    <span className="font-extrabold text-xs text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                      Total Quantity: {totalQtyNum} Units
                    </span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-teal-800 text-white text-[11px] uppercase tracking-wider font-extrabold">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Category & Title</th>
                        <th className="py-2.5 px-3 text-center">Quantity</th>
                        <th className="py-2.5 px-3 text-center">Sample Photo(s)</th>
                        <th className="py-2.5 px-3 text-right">Customer Budget / Unit</th>
                        <th className="py-2.5 px-3 text-right bg-emerald-700 text-white">Seller Price / Unit</th>
                        <th className="py-2.5 px-3 text-center">Detail View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs">
                      {requirementsList.map((item, idx) => {
                        const rawImages = Array.isArray(item.sampleImages) && item.sampleImages.length > 0
                          ? item.sampleImages
                          : (item.sampleImage ? [item.sampleImage] : []);
                        const imagesList = rawImages.filter(img => typeof img === 'string' && img.trim() !== '');

                        const custBudget = Number(item.budgetPerUnit || item.budgetUnit || 0);
                        const sellerPrice = Number(item.sellerPricePerUnit || item.sellerPrice || 0);

                        return (
                          <tr
                            key={idx}
                            onClick={() => setSelectedItemForDetail(item)}
                            className={`cursor-pointer transition-colors hover:bg-teal-50/40 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                            title="Click row to view full item specifications & custom details"
                          >
                            <td className="py-3 px-3 font-bold text-gray-500">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                {item.itemName}
                                <Eye size={13} className="text-teal-600 opacity-60 hover:opacity-100" />
                              </div>
                              <div className="text-[10px] text-teal-700 font-semibold">{item.category}</div>
                              {item.customizations && (
                                <div className="text-[10px] text-purple-700 font-medium line-clamp-1 mt-0.5">
                                  ✨ {item.customizations}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-extrabold text-gray-900">{item.quantity} Units</td>
                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              {imagesList.length > 0 ? (
                                <div className="flex items-center justify-center -space-x-2">
                                  {imagesList.slice(0, 3).map((img, iIdx) => (
                                    <div
                                      key={iIdx}
                                      onClick={() => setZoomImage(img)}
                                      className="relative w-9 h-9 rounded-lg overflow-hidden border-2 border-white shadow-2xs cursor-pointer group hover:z-10 hover:scale-110 transition-transform"
                                    >
                                      <img src={img || null} alt="Sample" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                  {imagesList.length > 3 && (
                                    <div
                                      onClick={() => setSelectedItemForDetail(item)}
                                      className="w-7 h-7 rounded-lg bg-teal-800 text-white font-bold text-[10px] flex items-center justify-center border border-white cursor-pointer"
                                    >
                                      +{imagesList.length - 3}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-[10px]">None</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right font-extrabold text-gray-800">
                              {custBudget > 0 ? `₹${custBudget.toLocaleString()}` : 'N/A'}
                            </td>

                            {/* Seller Price Column - Distinct Emerald Highlighted */}
                            <td className="py-3 px-3 text-right font-black bg-emerald-50/70 border-l border-r border-emerald-100 text-emerald-900">
                              {sellerPrice > 0 ? (
                                <span className="px-2 py-1 rounded-md bg-emerald-600 text-white shadow-2xs font-mono">
                                  ₹{sellerPrice.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-emerald-600/70 text-[11px] font-semibold italic">Set Quote</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedItemForDetail(item)}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-extrabold text-[11px] rounded-lg border border-teal-200 transition-all cursor-pointer"
                              >
                                View Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customization & Budget Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-gray-400 font-semibold text-[11px] uppercase block">Logo Embroidery / Monogram</span>
                  <div className="font-bold text-gray-900 mt-0.5">
                    {order.logoEmbroideryRequired ? 'Yes (Custom Crest Included)' : 'No (Plain Standard)'}
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-semibold text-[11px] uppercase block">Target Required Delivery</span>
                  <div className="font-bold text-gray-900 mt-0.5">
                    {order.targetDeliveryDate || 'Flexible / Urgent'}
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-semibold text-[11px] uppercase block">Quotations Expected By</span>
                  <div className="font-bold text-gray-900 mt-0.5 flex flex-col gap-0.5">
                    <span>{order.expectedQuotationDate ? new Date(order.expectedQuotationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible'}</span>
                    {order.expectedQuotationDate && (() => {
                      const target = new Date(order.expectedQuotationDate);
                      if (isNaN(target.getTime())) return null;
                      const now = new Date();
                      const targetMid = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
                      const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                      const diffDays = Math.round((targetMid - nowMid) / (1000 * 60 * 60 * 24));
                      const isExpired = diffDays < 0;
                      const isUrgent = diffDays >= 0 && diffDays <= 2;
                      const text = diffDays > 1 ? `${diffDays} days left` : diffDays === 1 ? '1 day left' : diffDays === 0 ? 'Ends today' : `Ended (${Math.abs(diffDays)}d ago)`;

                      return (
                        <span className={`w-fit text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isExpired ? 'bg-red-100 text-red-700 border-red-200' : isUrgent ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {text}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-semibold text-[11px] uppercase block">Overall Calculated Budget</span>
                  <div className="font-extrabold text-emerald-800 text-sm mt-0.5 font-mono">
                    {order.overallBudget > 0 ? `₹${Number(order.overallBudget).toLocaleString()}` : (targetBudgetNum > 0 ? `₹${targetBudgetNum.toLocaleString()}` : 'Not Specified')}
                  </div>
                </div>

                {order.additionalNotes && (
                  <div className="sm:col-span-2 lg:col-span-4 pt-2 border-t border-gray-200">
                    <span className="text-gray-400 font-semibold text-[11px] uppercase block mb-1">Additional Tender Notes</span>
                    <p className="text-gray-800 bg-white p-3 rounded-xl border border-gray-200 leading-relaxed">{order.additionalNotes}</p>
                  </div>
                )}
              </div>

              {/* Current Distribution Mode Info Banner */}
              <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Distribution Status</span>
                  <div className="font-extrabold text-blue-950 text-sm mt-0.5 flex items-center gap-2">
                    {order.assignmentMode === 'direct' && <><UserCheck size={16} className="text-blue-600" /> Direct Seller Assignment</>}
                    {order.assignmentMode === 'selected' && <><Users size={16} className="text-purple-600" /> Selected Sellers Invitation ({order.invitedSellerIds?.length || 0})</>}
                    {order.assignmentMode === 'broadcast' && <><Globe size={16} className="text-emerald-600" /> Marketplace Global Broadcast</>}
                    {order.assignmentMode === 'admin_direct' && <><ShieldCheck size={16} className="text-teal-700" /> BookVardi Direct Fulfillment</>}
                    {(!order.assignmentMode || order.assignmentMode === 'unassigned') && (
                      <span className="text-amber-800 flex items-center gap-1">
                        <AlertCircle size={15} /> Unassigned (Only Admin can view until distributed)
                      </span>
                    )}
                  </div>
                </div>

                {userRole === 'admin' && (
                  <button
                    onClick={() => setModalSubTab('distribution')}
                    className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    Change Distribution Mode
                  </button>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: ADMIN DISTRIBUTION CONTROLS */}
          {modalSubTab === 'distribution' && userRole === 'admin' && (
            <div className="space-y-5 bg-white p-5 rounded-2xl border border-gray-200">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Select Order Distribution Mode</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Decide how this school bulk order inquiry is routed to sellers across BookVardi marketplace.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-1.5 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setDistributeMode('direct')}
                  className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    distributeMode === 'direct' ? 'bg-white text-blue-900 shadow-xs border border-blue-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UserCheck size={18} />
                  <span>1. Direct Seller</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDistributeMode('selected')}
                  className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    distributeMode === 'selected' ? 'bg-white text-purple-900 shadow-xs border border-purple-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users size={18} />
                  <span>2. Selected Sellers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDistributeMode('broadcast')}
                  className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    distributeMode === 'broadcast' ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Globe size={18} />
                  <span>3. Global Broadcast</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDistributeMode('admin_direct')}
                  className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    distributeMode === 'admin_direct' ? 'bg-white text-teal-900 shadow-xs border border-teal-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ShieldCheck size={18} />
                  <span>4. Admin Direct</span>
                </button>
              </div>

              <form onSubmit={handleAdminDistributionSubmit} className="space-y-4 pt-2">
                {distributeMode === 'direct' && (
                  <div className="space-y-2 bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                    <label className="font-bold text-blue-900 block">Choose Approved Specific Seller *</label>
                    <select
                      value={selectedSingleSeller}
                      onChange={(e) => setSelectedSingleSeller(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white font-medium text-xs focus:outline-none focus:border-teal-600"
                      required
                    >
                      <option value="">-- Select Approved Seller --</option>
                      {verifiedSellers.map(s => (
                        <option key={s.id || s._id} value={s.id || s._id}>
                          {s.storeName || s.businessName || s.name} ({s.ownerName || s.name}) - {s.city || 'Delhi'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {distributeMode === 'selected' && (
                  <div className="space-y-3 bg-purple-50/60 p-4 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-between text-purple-900 font-bold">
                      <span>Select Sellers to Invite for RFQ Quotations:</span>
                      <span className="font-mono bg-purple-100 px-2 py-0.5 rounded text-purple-950">
                        {selectedMultipleSellers.length} Selected
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Search seller by name or city..."
                      value={sellerSearchQuery}
                      onChange={(e) => setSellerSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none"
                    />

                    <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 bg-white rounded-xl p-2">
                      {filteredSellersForModal.length === 0 ? (
                        <div className="text-center py-4 text-gray-400">No matching sellers found.</div>
                      ) : (
                        filteredSellersForModal.map(seller => {
                          const sId = seller.id || seller._id;
                          const isChecked = selectedMultipleSellers.includes(sId);
                          return (
                            <div
                              key={sId}
                              onClick={() => toggleSellerSelect(sId)}
                              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                isChecked ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-2xs' : 'bg-white border-gray-100 hover:bg-purple-50/40 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 select-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleSellerSelect(sId);
                                  }}
                                  className="accent-purple-700 w-4 h-4 cursor-pointer shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-gray-900">{seller.storeName || seller.businessName || seller.name}</div>
                                  <div className="text-[10px] text-gray-500 font-normal">{seller.ownerName ? `${seller.ownerName} • ` : ''}{seller.city || 'Pan-India'}</div>
                                </div>
                              </div>
                              {isChecked && (
                                <span className="text-[10px] font-extrabold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                                  Selected
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {distributeMode === 'broadcast' && (
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                    <strong className="block mb-1">Global Marketplace Broadcast Mode</strong>
                    This RFQ will be visible to all verified sellers in the BookVardi portal. Any partner vendor can submit counter-quotations.
                  </div>
                )}

                {distributeMode === 'admin_direct' && (
                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 text-teal-950 text-xs">
                    <strong className="block mb-1">BookVardi Direct HQ Fulfillment</strong>
                    Admin handles order sourcing and supply directly. Order status updated to assigned.
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save & Broadcast Distribution Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: SUBMITTED VENDOR QUOTATIONS */}
          {modalSubTab === 'quotes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-purple-950 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-purple-600" /> Submitted Seller Quotations & Counter Proposals
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Inspect descriptive item-by-item prices, customer budget comparison, and volume discount terms.
                  </p>
                </div>
                <span className="text-xs text-gray-500 font-bold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                  Target Budget: ₹{targetBudgetNum ? targetBudgetNum.toLocaleString() : 'N/A'}
                </span>
              </div>

              {(!order.quotations || order.quotations.length === 0) ? (
                <div className="p-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-400">
                  <FileText size={36} className="mx-auto mb-2 text-gray-300" />
                  <div className="font-bold text-gray-700 text-sm">No Seller Quotations Submitted Yet</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Once vendors submit proposals, counter prices, itemized rates, and delivery terms will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const getCleanId = (val) => {
                      if (!val) return '';
                      if (typeof val === 'object') {
                        if (val._id) return String(val._id);
                        if (val.id) return String(val.id);
                        if (typeof val.toString === 'function') {
                          const str = val.toString();
                          if (str !== '[object Object]') return str;
                        }
                      }
                      return String(val);
                    };

                    const orderSellerId = getCleanId(order.sellerId);
                    const acceptedQuoteId = getCleanId(order.acceptedQuoteId || order.winningQuoteId);

                    const winningQuote = (order.quotations || []).find(q => {
                      if (q.status === 'rejected' || q.negotiationStage === 'rejected') return false;
                      const qId = getCleanId(q._id || q.id);
                      const qSellerId = getCleanId(q.sellerId);
                      return (
                        (orderSellerId && qSellerId && orderSellerId === qSellerId) ||
                        (acceptedQuoteId && acceptedQuoteId === qId) ||
                        q.status === 'approved' ||
                        q.negotiationStage === 'approved'
                      );
                    });
                    const winningSellerName = winningQuote?.sellerStoreName || winningQuote?.sellerName || order.acceptedSellerName || "another vendor";

                    return order.quotations.map(quote => {
                      const qId = getCleanId(quote._id || quote.id);
                      const isWinner = Boolean(
                        winningQuote && (getCleanId(winningQuote._id || winningQuote.id) === qId)
                      );
                      const isRejected = (
                        quote.status === 'rejected' ||
                        quote.negotiationStage === 'rejected' ||
                        Boolean(winningQuote && !isWinner)
                      );
                      const isApproved = isWinner && !isRejected;
                      const hasItemPrices = Array.isArray(quote.itemPrices) && quote.itemPrices.length > 0;
                      const qAdvPct = Number(quote.prepaymentPercentage ?? quote.sellerAdvancePercentage ?? 0);
                      const qAdvAmt = Number(quote.prepaymentAmount ?? quote.sellerAdvanceAmount ?? 0) || (qAdvPct > 0 ? Math.round((Number(quote.quoteAmount) * qAdvPct) / 100) : 0);
                      const isPrepaymentPaid = isApproved && (order.advancePaymentStatus === 'paid' || (order.advancePaidAmount && order.advancePaidAmount >= qAdvAmt));
                      const isSellerAcceptedCounter = !isRejected && !isApproved && (quote.negotiationStage === 'seller_accepted_counter' || quote.status === 'seller_accepted');

                      return (
                        <div
                          key={qId}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
                            isApproved ? 'bg-emerald-50/80 border-emerald-300 shadow-xs' :
                            isRejected ? 'bg-slate-50/70 border-slate-200 text-slate-500 opacity-80' :
                            'bg-white border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          {/* Header Row: Vendor Info & Total Quote */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2 border-b border-gray-100">
                            <div>
                              <div className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                                <span>{quote.sellerStoreName || quote.sellerName}</span>
                                {isApproved && (
                                  <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                    Winning Proposal
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <XCircle size={10} className="text-rose-600" /> Quotation Rejected / Outbid
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3 mt-0.5">
                                {userRole === 'admin' && quote.sellerPhone && <span>Phone: <strong className="text-gray-700">{quote.sellerPhone}</strong></span>}
                                {userRole === 'admin' && quote.sellerCity && <span>City: <strong className="text-gray-700">{quote.sellerCity}</strong></span>}
                                <span>Lead Time: <strong className="text-gray-700">{quote.estimatedDeliveryDays || 7} Days</strong></span>
                              </div>

                              {/* Negotiation Version & Stage Pill */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleTimelineForQuote(qId, quote.currentVersion || 1)}
                                  className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                    expandedTimelineQuoteId === qId
                                      ? 'bg-teal-700 text-white ring-2 ring-teal-500'
                                      : 'bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-300'
                                  }`}
                                  title="Click to view full negotiation timeline and version history"
                                >
                                  <Clock size={11} className={expandedTimelineQuoteId === qId ? 'text-white' : 'text-teal-700'} />
                                  <span>Version {quote.currentVersion || 1}</span>
                                  <span className="text-[9px] opacity-80">{expandedTimelineQuoteId === qId ? '▲ Hide' : '▼ Timeline'}</span>
                                </button>
                                {quote.negotiationStage === 'buyer_countered' && (
                                  <button
                                    type="button"
                                    onClick={() => toggleTimelineForQuote(qId, quote.currentVersion || 2)}
                                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-all"
                                    title="Click to view buyer counter-demand timeline"
                                  >
                                    <Clock size={10} /> 2nd Version Counter-Demand Sent
                                  </button>
                                )}
                                {quote.negotiationStage === 'seller_accepted_counter' && (
                                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Vendor Accepted Your Counter-Demand
                                  </span>
                                )}
                                {quote.negotiationStage === 'revised_by_seller' && (
                                  <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Sparkles size={10} /> Vendor Revised Terms
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="sm:text-right bg-teal-50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                              <div className="text-[10px] text-gray-400 font-semibold uppercase">Total Pitched Amount</div>
                              <div className="font-extrabold text-lg text-teal-800 font-mono">
                                ₹{Number(quote.quoteAmount).toLocaleString()}
                              </div>
                              <div className="text-[10px] text-teal-700 font-medium">
                                ~₹{quote.unitPrice || (totalQtyNum > 0 ? Math.round(quote.quoteAmount / totalQtyNum) : 0)} / unit avg
                              </div>
                            </div>
                          </div>

                          {/* Notice Banner: Quotation Rejected / Outbid */}
                          {isRejected && (
                            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-rose-900 shadow-2xs">
                              <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-extrabold text-[11px] uppercase tracking-wider text-rose-800">
                                  Quotation Proposal Not Selected
                                </div>
                                <p className="mt-0.5 text-rose-900">
                                  This quotation proposal was not selected for procurement. The requisition has been awarded to <strong>{winningSellerName}</strong>.
                                </p>
                              </div>
                            </div>
                          )}

                        {/* Notice Banner: Vendor Accepted Buyer Counter Terms */}
                        {isSellerAcceptedCounter && (
                          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
                                <CheckCircle2 size={16} className="text-emerald-700" />
                                <span>🎉 Vendor Accepted Your Version {quote.currentVersion || 2} Counter Terms!</span>
                              </span>
                              <span className="bg-emerald-200 text-emerald-900 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                                Counter Accepted
                              </span>
                            </div>
                            <p className="text-xs text-emerald-800">
                              {quote.sellerStoreName || quote.sellerName || "Vendor"} officially approved your counter-demand budget of <strong>₹{Number(quote.quoteAmount).toLocaleString()}</strong> and lead time of <strong>{quote.estimatedDeliveryDays} Days</strong>.
                              {!isPrepaymentPaid && qAdvAmt > 0 && (
                                <span className="block mt-1.5 text-emerald-950 font-bold bg-white/70 p-2 rounded-xl border border-emerald-200">
                                  ⚠️ Prepayment of ₹{qAdvAmt.toLocaleString()} ({qAdvPct}%) is required via online payment only to mobilize production and lock delivery schedule.
                                </span>
                              )}
                              {isPrepaymentPaid && (
                                <span className="block mt-1.5 text-emerald-900 font-bold bg-white/70 p-2 rounded-xl border border-emerald-200">
                                  ✅ Online prepayment of ₹{Number(order.advancePaidAmount || qAdvAmt).toLocaleString()} confirmed. Vendor has been authorized to proceed with packing and fulfillment.
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Active Buyer Counter-Demand Info Card */}
                        {quote.latestBuyerCounter && (Number(quote.latestBuyerCounter.targetBudget) > 0 || quote.latestBuyerCounter.notes) && (
                          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-extrabold text-purple-900">
                              <span className="flex items-center gap-1.5">
                                <Sparkles size={13} className="text-purple-600" /> Your Active Counter-Demand (2nd Version)
                              </span>
                              {quote.latestBuyerCounter.counteredAt && (
                                <span className="text-[10px] text-purple-600 font-medium">
                                  Sent on {new Date(quote.latestBuyerCounter.counteredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                              {Number(quote.latestBuyerCounter.targetBudget) > 0 && (
                                <div>
                                  <span className="text-gray-400 block text-[10px] font-sans font-medium">Target Budget:</span>
                                  <strong className="text-purple-900 font-extrabold">₹{Number(quote.latestBuyerCounter.targetBudget).toLocaleString()}</strong>
                                </div>
                              )}
                              {(Number(quote.latestBuyerCounter.totalQuantity) > 0 || totalQtyNum > 0) && (
                                <div>
                                  <span className="text-gray-400 block text-[10px] font-sans font-medium">Demanded Quantity:</span>
                                  <strong className="text-purple-900 font-extrabold">{Number(quote.latestBuyerCounter.totalQuantity || totalQtyNum)} Units</strong>
                                </div>
                              )}
                              {(Number(quote.latestBuyerCounter.unitPrice) > 0 || (Number(quote.latestBuyerCounter.targetBudget) > 0 && totalQtyNum > 0)) && (
                                <div>
                                  <span className="text-gray-400 block text-[10px] font-sans font-medium">Demanded Unit Rate:</span>
                                  <strong className="text-purple-900 font-extrabold">
                                    ₹{Number(quote.latestBuyerCounter.unitPrice || Math.round(Number(quote.latestBuyerCounter.targetBudget) / (Number(quote.latestBuyerCounter.totalQuantity) || totalQtyNum || 1))).toLocaleString()} / unit
                                  </strong>
                                </div>
                              )}
                              {Number(quote.latestBuyerCounter.requestedDeliveryDays) > 0 && (
                                <div>
                                  <span className="text-gray-400 block text-[10px] font-sans font-medium">Requested Lead Time:</span>
                                  <strong className="text-purple-900 font-extrabold">{quote.latestBuyerCounter.requestedDeliveryDays} Days</strong>
                                </div>
                              )}
                              {Number(quote.latestBuyerCounter.proposedAdvancePercentage) > 0 && (
                                <div>
                                  <span className="text-gray-400 block text-[10px] font-sans font-medium">Proposed Prepayment:</span>
                                  <strong className="text-purple-900 font-extrabold">{quote.latestBuyerCounter.proposedAdvancePercentage}% Advance</strong>
                                </div>
                              )}
                            </div>
                            {Array.isArray(quote.latestBuyerCounter.itemDemands) && quote.latestBuyerCounter.itemDemands.length > 0 && (
                              <div className="pt-1.5 border-t border-purple-100">
                                <span className="text-[10px] text-gray-500 font-semibold block mb-1">Demanded Line Items & Quantities:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {quote.latestBuyerCounter.itemDemands.map((dm, dmIdx) => (
                                    <span key={dm.itemId || dmIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-purple-200 text-[10px] text-purple-900 font-bold">
                                      <span>{dm.itemName}:</span>
                                      <span className="text-purple-700">{dm.quantity} units</span>
                                      {dm.targetUnitPrice > 0 && <span className="text-gray-400">@ ₹{dm.targetUnitPrice}</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {quote.latestBuyerCounter.notes && (
                              <p className="text-[11px] text-purple-950 italic pt-1 border-t border-purple-100">
                                "{quote.latestBuyerCounter.notes}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* Raised Prepayment & Extended Lead Time Warning Chips */}
                        {(() => {
                          const latestRound = Array.isArray(quote.negotiationHistory) && quote.negotiationHistory.length > 0 ? quote.negotiationHistory[quote.negotiationHistory.length - 1] : null;
                          if (!latestRound || (!latestRound.prepaymentRaised && !latestRound.deliveryDaysRaised)) return null;

                          return (
                            <div className="flex flex-wrap items-center gap-2">
                              {latestRound.prepaymentRaised && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold">
                                  ⚠️ Prepayment Raised by Vendor in Version {quote.currentVersion || 1}
                                </span>
                              )}
                              {latestRound.deliveryDaysRaised && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-300 text-[11px] font-bold">
                                  ⏳ Delivery Lead Time Extended by Vendor ({quote.estimatedDeliveryDays} Days)
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {/* Descriptive Item Breakdown Table */}
                        {hasItemPrices ? (
                          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                            <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between text-[11px] font-extrabold text-gray-700">
                              <span className="flex items-center gap-1.5">
                                <Package size={13} className="text-teal-700" /> Itemized Pricing & Scale Breakdown
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">{quote.itemPrices.length} Items</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200">
                                    <th className="py-2 px-3">Product Demand</th>
                                    <th className="py-2 px-2 text-center">Qty</th>
                                    <th className="py-2 px-2 text-right">User Budget/Unit</th>
                                    <th className={`py-2 px-2 text-right ${isRejected ? 'bg-gray-100 text-gray-700' : 'bg-emerald-50 text-emerald-950'}`}>Seller Price/Unit</th>
                                    <th className="py-2 px-3 text-right">Line Total</th>
                                    <th className="py-2 px-3">Scale / Volume Note</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {quote.itemPrices.map((item, ipIdx) => {
                                    const custBudget = Number(item.customerBudget || 0);
                                    const sellerPrice = Number(item.pricePerUnit || 0);
                                    const lineTotal = Number(item.totalPrice) || ((Number(item.quantity) || 1) * sellerPrice);

                                    return (
                                      <tr key={ipIdx} className="hover:bg-teal-50/20">
                                        <td className="py-2 px-3">
                                          <div className="font-bold text-gray-900 line-clamp-1">{item.itemName}</div>
                                          <div className="text-[10px] text-gray-400">{item.category}</div>
                                        </td>
                                        <td className="py-2 px-2 text-center font-bold text-gray-700">{item.quantity}</td>
                                        <td className="py-2 px-2 text-right font-medium text-gray-600">
                                          {custBudget > 0 ? `₹${custBudget.toLocaleString()}` : 'N/A'}
                                        </td>
                                        <td className={`py-2 px-2 text-right font-black font-mono ${isRejected ? 'text-gray-600' : 'bg-emerald-50/70 text-emerald-900'}`}>
                                          ₹{sellerPrice.toLocaleString()}
                                        </td>
                                        <td className="py-2 px-3 text-right font-black text-gray-900 font-mono">
                                          ₹{lineTotal.toLocaleString()}
                                        </td>
                                        <td className="py-2 px-3">
                                          {item.discountTierNote ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                                              💡 {item.discountTierNote}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-[10px] italic">Standard batch rate</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : null}

                        {/* Overall Volume Discount Note Banner */}
                        {quote.volumeDiscountNote && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-950">
                            <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-extrabold text-[11px] uppercase tracking-wider text-amber-900">
                                Volume Incentive & Scale Discount Note
                              </div>
                              <div className="font-medium mt-0.5 text-amber-950">
                                {quote.volumeDiscountNote}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Notes & Delivery Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <div>
                            <span className="text-gray-400 font-medium">Est. Delivery Lead Time:</span>
                            <span className="font-bold text-gray-800 ml-1">{quote.estimatedDeliveryDays || 7} Days</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-medium">Submitted On:</span>
                            <span className="font-bold text-gray-800 ml-1">
                              {new Date(quote.submittedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {quote.notes && (
                            <div className="sm:col-span-2 text-gray-700 italic border-t border-gray-200/60 pt-1 mt-0.5">
                              "{quote.notes}"
                            </div>
                          )}
                        </div>

                        {/* Prepayment / Upfront Advance Demanded by Seller */}
                        {(() => {
                          const advPct = Number(quote.prepaymentPercentage ?? quote.sellerAdvancePercentage ?? 0);
                          const advAmt = Number(quote.prepaymentAmount ?? quote.sellerAdvanceAmount ?? 0) || (advPct > 0 ? Math.round((Number(quote.quoteAmount) * advPct) / 100) : 0);
                          const advTerms = quote.prepaymentTerms || quote.sellerAdvanceTerms || '';
                          const isPrepaymentPaid = isApproved && (order.advancePaymentStatus === 'paid' || (order.advancePaidAmount && order.advancePaidAmount >= advAmt));
                          const actualAdvPaid = isPrepaymentPaid ? (Number(order.advancePaidAmount) || advAmt) : 0;
                          const totalPaid = actualAdvPaid + Number(order.remainingPaidAmount || 0);
                          const isRemPaid = isApproved && (order.remainingPaymentStatus === 'paid' || (totalPaid >= Number(quote.quoteAmount) && Number(quote.quoteAmount) > 0));
                          const remainingBal = isRemPaid ? 0 : Math.max(0, Number(quote.quoteAmount) - actualAdvPaid);
                          const isEligibleForPayment = isApproved && advAmt > 0 && !isPrepaymentPaid && !isRejected;

                          if (!isApproved || isRejected) return null;
                          if (advPct <= 0 && advAmt <= 0 && !advTerms) return null;

                          return (
                            <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                                    <DollarSign size={13} className="text-emerald-700" /> Agreed Advance Prepayment
                                  </span>
                                  {isPrepaymentPaid ? (
                                    <span className="bg-emerald-200 text-emerald-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <CheckCircle2 size={10} className="text-emerald-700" /> Verified Online
                                    </span>
                                  ) : isEligibleForPayment ? (
                                    <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black text-[9px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <AlertCircle size={10} className="text-amber-700" /> Payment Required Online
                                    </span>
                                  ) : null}
                                </div>

                                <div className="text-emerald-950 font-bold text-sm">
                                  Upfront Prepayment: <strong className="font-extrabold text-emerald-900 font-mono text-base">₹{advAmt.toLocaleString()}</strong>
                                  {advPct > 0 ? ` (${advPct}% deposit)` : ''}
                                </div>
                                {advTerms && (
                                  <p className="text-[11px] text-emerald-800 italic">
                                    Terms: "{advTerms}"
                                  </p>
                                )}
                                {isPrepaymentPaid && order.advanceTransactionId && (
                                  <div className="text-[10px] font-mono text-emerald-800">
                                    Razorpay TXN: <strong>{order.advanceTransactionId}</strong>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap sm:flex-col sm:items-end justify-between gap-2">
                                <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-100 shadow-2xs text-right">
                                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Balance on Delivery</span>
                                  <span className="font-mono font-bold text-gray-800">₹{remainingBal.toLocaleString()}</span>
                                </div>

                                {isPrepaymentPaid ? (
                                  <div className="flex flex-col sm:flex-row items-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => window.open(`${API_BASE_URL}/schools/bulk-orders/${order._id || order.id || order.referenceId}/advance-receipt`, '_blank')}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-400 font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                                    >
                                      <Download size={12} className="text-emerald-700" />
                                      <span>Advance Receipt (PDF)</span>
                                    </button>

                                    {isRemPaid ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[11px] rounded-lg border border-emerald-300">
                                        <CheckCircle2 size={12} /> Balance Paid
                                      </span>
                                    ) : (userRole === 'consumer' && remainingBal > 0) ? (
                                      <button
                                        type="button"
                                        onClick={() => handleInitiateOnlineRemainingPayment(quote, remainingBal)}
                                        disabled={isPayingRemaining}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer animate-pulse"
                                      >
                                        <CreditCard size={13} />
                                        <span>{isPayingRemaining ? 'Processing...' : `Pay Bal ₹${remainingBal.toLocaleString()}`}</span>
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 font-extrabold text-[11px] rounded-lg border border-amber-300">
                                        <Clock size={12} className="text-amber-700" /> Pending Bal ₹{remainingBal.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                ) : (userRole === 'consumer' && isEligibleForPayment) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleInitiateOnlinePrepayment(quote, advAmt)}
                                    disabled={isPayingPrepayment}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer font-display animate-pulse"
                                  >
                                    <CreditCard size={14} />
                                    <span>{isPayingPrepayment ? 'Connecting...' : `Pay ₹${advAmt.toLocaleString()} Online`}</span>
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Interactive Extended Negotiation Timeline Div */}
                        {expandedTimelineQuoteId === qId ? (
                          <div className="pt-2 animate-in fade-in duration-200">
                            <NegotiationTimelineDiv
                              quotation={quote}
                              order={order}
                              userRole={userRole}
                              initialSelectedVersion={selectedTimelineVersion || quote.currentVersion || 1}
                              onClose={() => toggleTimelineForQuote(qId)}
                              onOpenCounterDemand={onSubmitCounterDemand ? () => handleOpenCounterDrawer(quote) : null}
                              onApproveQuote={onApproveQuote ? () => handleOpenAcceptQuoteModal(quote) : null}
                              onOpenComparisonModal={() => handleOpenVersionComparison(quote)}
                            />
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                            <button
                              type="button"
                              onClick={() => toggleTimelineForQuote(qId, quote.currentVersion || 1)}
                              className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <Clock size={13} className="text-teal-700" />
                                <span>Negotiation Timeline & Version History</span>
                                {(quote.currentVersion > 1 || (quote.negotiationHistory && quote.negotiationHistory.length > 0)) && (
                                  <span className="text-[10px] bg-teal-100 text-teal-800 font-extrabold px-2 py-0.5 rounded-full">
                                    v{quote.currentVersion || 1} ({quote.negotiationHistory?.length || 1} rounds)
                                  </span>
                                )}
                              </span>
                              <span className="text-[11px] text-teal-700 font-extrabold">
                                View Interactive Timeline ▼
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Footer Status & Acceptance Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                          <div>
                            {isApproved ? (
                              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                                <CheckCircle2 size={14} /> Approved & Winning Seller Quote
                              </span>
                            ) : isRejected ? (
                              <span className="text-xs font-extrabold text-rose-800 bg-rose-50 px-3 py-1 rounded-full flex items-center gap-1 border border-rose-200">
                                <XCircle size={14} className="text-rose-600" /> Quotation Rejected / Outbid
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-500 font-semibold">
                                Stage: <strong className="text-gray-800 capitalize">{(quote.negotiationStage || quote.status || 'Active').replace(/_/g, ' ')}</strong>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {(quote.currentVersion > 1 || (quote.negotiationHistory && quote.negotiationHistory.length > 0)) && (
                              <button
                                type="button"
                                onClick={() => handleOpenVersionComparison(quote)}
                                className="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <SlidersHorizontal size={12} />
                                <span>Compare Versions</span>
                              </button>
                            )}

                            {userRole === 'admin' && !isApproved && (
                              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                                Awaiting Buyer Decision / Review Only
                              </span>
                            )}

                            {userRole === 'consumer' && (
                              <>
                                {isApproved ? (
                                  <>
                                    {isPrepaymentPaid ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1">
                                          <CheckCircle2 size={14} className="text-emerald-700" /> Mobilization Deposit Confirmed
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => window.open(`${API_BASE_URL}/schools/bulk-orders/${order._id || order.id || order.referenceId}/advance-receipt`, '_blank')}
                                          className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                        >
                                          <Download size={13} className="text-emerald-700" />
                                          <span>Receipt PDF</span>
                                        </button>
                                      </div>
                                    ) : qAdvAmt > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => handleInitiateOnlinePrepayment(quote, qAdvAmt)}
                                        disabled={isPayingPrepayment}
                                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 font-display animate-pulse"
                                      >
                                        <CreditCard size={15} />
                                        <span>{isPayingPrepayment ? 'Connecting Gateway...' : `Pay Prepayment Online (₹${qAdvAmt.toLocaleString()})`}</span>
                                      </button>
                                    ) : (
                                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1">
                                        <CheckCircle2 size={14} /> Approved & Winning Seller Quote
                                      </span>
                                    )}
                                  </>
                                ) : isRejected ? (
                                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 flex items-center gap-1">
                                    <XCircle size={12} className="text-gray-400" /> Proposal Not Selected • Order Awarded to {winningSellerName}
                                  </span>
                                ) : (
                                  <>
                                    {onSubmitCounterDemand && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenCounterDrawer(quote)}
                                        className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 font-extrabold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                                      >
                                        <Sparkles size={14} className="text-purple-600" />
                                        <span>Send 2nd Version / Counter-Demand</span>
                                      </button>
                                    )}
                                    {onApproveQuote && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAcceptQuoteModal(quote)}
                                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 font-display"
                                      >
                                        <CheckCircle2 size={15} />
                                        <span>Accept Winning Quotation</span>
                                      </button>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                })()}
              </div>
              )}
            </div>
          )}

          {/* TAB 4: SELLER DESCRIPTIVE QUOTATION PITCH BUILDER */}
          {modalSubTab === 'submit_quote' && userRole === 'seller' && (
            <div className="bg-white p-5 rounded-2xl border border-emerald-300 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                    <Sparkles size={18} className="text-emerald-600" />
                    {existingSellerQuote ? 'Update Descriptive Quotation Pitch' : 'Pitch Proposal Quotation'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Set your offer price/piece on each demanded product, specify volume discount notes (e.g. decrease price if order increases), and review the live calculated total.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-gray-400 font-semibold block">Total Requirement</span>
                  <span className="text-sm font-extrabold text-teal-800 font-mono">{totalQtyNum} Units Demanded</span>
                </div>
              </div>

              <form onSubmit={handleSellerQuoteSubmit} className="space-y-5">
                
                {/* 1. Demand-by-Demand Interactive Pricing & Scale Note Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={15} className="text-teal-700" />
                      1. Product Demands & Unit Pricing
                    </h4>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Calculates line totals and grand total in real-time
                    </span>
                  </div>

                  <div className="space-y-3">
                    {pitchItems.map((item, idx) => {
                      const custBudget = Number(item.customerBudget || 0);
                      const unitPriceVal = Number(item.pricePerUnit || 0);
                      const lineTotal = Number(item.totalPrice) || ((Number(item.quantity) || 1) * unitPriceVal);

                      return (
                        <div
                          key={item.itemId || idx}
                          className="p-4 bg-gray-50/70 border border-gray-200 rounded-2xl space-y-3 hover:border-emerald-300 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-teal-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span>{item.itemName}</span>
                              </div>
                              <div className="text-[11px] text-teal-700 font-semibold mt-0.5 ml-7">
                                Category: {item.category} • Demanded Qty: <strong className="text-gray-900 font-bold">{item.quantity} Units</strong>
                              </div>
                            </div>

                            {/* Customer Target Budget Badge */}
                            <div className="flex items-center gap-2 self-start sm:self-auto ml-7 sm:ml-0">
                              <span className="text-[11px] text-gray-500">Customer Budget:</span>
                              <span className="font-bold text-xs text-gray-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-mono">
                                {custBudget > 0 ? `₹${custBudget.toLocaleString()} / unit` : 'Not specified'}
                              </span>
                            </div>
                          </div>

                          {/* Price Input & Line Total Calculation Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-200/60">
                            <div className="space-y-1">
                              <label className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1">
                                <DollarSign size={13} className="text-emerald-600" />
                                Your Offered Price / Piece (₹) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-xs">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  placeholder="e.g. 511"
                                  value={item.pricePerUnit || ''}
                                  onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-emerald-600"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-gray-500 block">
                                Calculated Line Total ({item.quantity} pcs × ₹{unitPriceVal})
                              </label>
                              <div className="px-3 py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs font-mono font-extrabold text-emerald-950 flex items-center justify-between">
                                <span>Line Total:</span>
                                <span className="text-sm">₹{lineTotal.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Per-Product Volume Discount / Scale Note Input */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                              <span>Scale / Volume Discount Note:</span>
                              <span className="text-gray-400 font-normal">(e.g. Decrease price if order increases)</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Decrease price to ₹480/pc if order increases to 150+ units"
                              value={item.discountTierNote || ''}
                              onChange={(e) => handleItemDiscountNoteChange(idx, e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none focus:border-teal-600"
                            />

                            {/* Quick Helper Suggestion Chips */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] text-gray-400 font-semibold">Quick Chips:</span>
                              <button
                                type="button"
                                onClick={() => handleItemDiscountNoteChange(idx, 'Decrease price if order increases')}
                                className="px-2 py-0.5 rounded-md bg-white border border-gray-200 hover:border-emerald-400 text-[10px] font-medium text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                              >
                                + Decrease price if order increases
                              </button>
                              <button
                                type="button"
                                onClick={() => handleItemDiscountNoteChange(idx, `5% discount if order increases by 50+ units`)}
                                className="px-2 py-0.5 rounded-md bg-white border border-gray-200 hover:border-emerald-400 text-[10px] font-medium text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                              >
                                + 5% off for +50 units
                              </button>
                              <button
                                type="button"
                                onClick={() => handleItemDiscountNoteChange(idx, `10% discount for orders above 200 units`)}
                                className="px-2 py-0.5 rounded-md bg-white border border-gray-200 hover:border-emerald-400 text-[10px] font-medium text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                              >
                                + 10% off for 200+ units
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Live Calculation Summary Card */}
                <div className="bg-linear-to-r from-emerald-900 to-teal-950 text-white p-5 rounded-2xl shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-teal-700/60 pb-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <Sparkles size={15} /> 2. Seller Total Calculated Summary
                    </span>
                    <span className="text-[11px] text-teal-200 font-mono">
                      {pitchItems.length} Products Included
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
                      <span className="text-[10px] text-teal-200 uppercase font-semibold block">Customer Target Budget</span>
                      <div className="text-base font-extrabold text-white font-mono mt-0.5">
                        {totalCustomerTargetBudget > 0 ? `₹${totalCustomerTargetBudget.toLocaleString()}` : 'Not Specified'}
                      </div>
                    </div>

                    <div className="bg-white/15 p-3 rounded-xl backdrop-blur-xs border border-emerald-400/40">
                      <span className="text-[10px] text-emerald-300 uppercase font-bold block">Seller Total Calculated</span>
                      <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                        ₹{calculatedGrandTotal.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
                      <span className="text-[10px] text-teal-200 uppercase font-semibold block">Average Calculated Rate</span>
                      <div className="text-base font-extrabold text-white font-mono mt-0.5">
                        ₹{calculatedAvgUnitPrice.toLocaleString()} / unit
                      </div>
                    </div>
                  </div>

                  {totalCustomerTargetBudget > 0 && (
                    <div className="text-xs pt-1 flex items-center gap-2">
                      {calculatedGrandTotal <= totalCustomerTargetBudget ? (
                        <span className="text-emerald-300 font-bold flex items-center gap-1">
                          <CheckCircle2 size={14} /> Competitive Pitch: Saves customer ₹{(totalCustomerTargetBudget - calculatedGrandTotal).toLocaleString()} vs Target Budget
                        </span>
                      ) : (
                        <span className="text-amber-200 font-medium">
                          Note: Pitch is ₹{(calculatedGrandTotal - totalCustomerTargetBudget).toLocaleString()} higher than customer target budget.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Overall Scale Discount Terms & Lead Time */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-xs text-gray-800 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      3. Overall Volume Discount Note & Scale Slabs
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Decrease price if order increases: 5% off for 200+ units, 10% off for 500+ units"
                      value={volumeDiscountNote}
                      onChange={(e) => setVolumeDiscountNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 text-xs text-gray-800"
                    />

                    {/* Overall Helper Preset Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-gray-400 font-semibold">Preset Suggestions:</span>
                      <button
                        type="button"
                        onClick={() => setVolumeDiscountNote('Prices can be decreased if order quantity increases. Open to volume negotiation.')}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-emerald-50 border border-gray-200 text-[10px] font-medium text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                      >
                        Decrease price if order increases
                      </button>
                      <button
                        type="button"
                        onClick={() => setVolumeDiscountNote('Tiered wholesale slabs: 10% additional discount on bulk scaling & repeat orders.')}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-emerald-50 border border-gray-200 text-[10px] font-medium text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                      >
                        10% tier on bulk scaling
                      </button>
                      <button
                        type="button"
                        onClick={() => setVolumeDiscountNote('Free institutional embroidery crest and sample kit dispatch included for 500+ units.')}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-emerald-50 border border-gray-200 text-[10px] font-medium text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                      >
                        Free crest & sample included
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-xs text-gray-700">Estimated Delivery Lead Time (Days)</label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-xs text-gray-700">General Terms & Quality Specifications</label>
                      <textarea
                        rows="2"
                        placeholder="Fabric composition, GST invoice terms, sample inspection date..."
                        value={quoteNotes}
                        onChange={(e) => setQuoteNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 text-xs"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setModalSubTab('specs')}
                    className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
                  >
                    Back to Specifications
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-3 font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-xs font-display transition-all"
                  >
                    <Send size={16} />
                    <span>Pitch Calculated Quotation (₹{calculatedGrandTotal.toLocaleString()})</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500 font-medium">
            Order Reference: <span className="font-mono font-bold text-gray-800">{refId}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {userRole === 'seller' && onSubmitQuote && order.status !== 'quote_accepted' && (
              <button
                onClick={() => setModalSubTab('submit_quote')}
                className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send size={15} />
                <span>Pitch Updated Quotation</span>
              </button>
            )}

            {userRole === 'seller' && onAcceptDirect && order.status !== 'quote_accepted' && (
              <button
                onClick={() => {
                  onAcceptDirect(order.id || order._id);
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <CheckCircle2 size={14} />
                <span>Accept at Target Budget</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>

      </div>

      {/* SAMPLE IMAGE LIGHTBOX POPUP MODAL */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-3xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2 rounded-full z-10 cursor-pointer"
            >
              <X size={20} />
            </button>
            <img src={zoomImage || null} alt="Sample Zoomed" className="w-full h-full object-contain max-h-[80vh] rounded-2xl" />
          </div>
        </div>
      )}

      {/* SPECIFIC DEMAND ITEM DETAIL VIEW MODAL */}
      {selectedItemForDetail && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-teal-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-teal-950 flex items-center justify-center font-extrabold shadow-sm">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-white">
                    {selectedItemForDetail.itemName || 'Requirement Demand Item'}
                  </h3>
                  <p className="text-xs text-teal-200">
                    Category: <strong className="text-white">{selectedItemForDetail.category}</strong> • Quantity: <strong className="text-white">{selectedItemForDetail.quantity} Units</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemForDetail(null)}
                className="p-1.5 text-teal-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-800">
              
              {/* Image Gallery */}
              {(() => {
                const rawItemImages = Array.isArray(selectedItemForDetail.sampleImages) && selectedItemForDetail.sampleImages.length > 0
                  ? selectedItemForDetail.sampleImages
                  : (selectedItemForDetail.sampleImage ? [selectedItemForDetail.sampleImage] : []);
                const itemImages = rawItemImages.filter(img => typeof img === 'string' && img.trim() !== '');

                return (
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera size={14} className="text-teal-700" /> Requirement Photos ({itemImages.length})
                    </h4>

                    {itemImages.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                        {itemImages.map((imgSrc, iIdx) => (
                          <div
                            key={iIdx}
                            onClick={() => setZoomImage(imgSrc)}
                            className="relative aspect-square rounded-xl overflow-hidden border border-gray-300 shadow-2xs group cursor-pointer"
                          >
                            <img src={imgSrc || null} alt={`Sample ${iIdx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Eye size={16} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 text-center">
                        No sample photos attached for this requirement item.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Price Comparison Card */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Customer Target Budget / Unit</span>
                  <div className="text-base font-extrabold text-gray-900">
                    ₹{Number(selectedItemForDetail.budgetPerUnit || selectedItemForDetail.budgetUnit || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Total Line Budget: <strong>₹{((Number(selectedItemForDetail.quantity) || 0) * (Number(selectedItemForDetail.budgetPerUnit || selectedItemForDetail.budgetUnit) || 0)).toLocaleString()}</strong>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Seller Offered Price / Unit</span>
                  <div className="text-base font-black text-emerald-950 font-mono">
                    {Number(selectedItemForDetail.sellerPricePerUnit || selectedItemForDetail.sellerPrice || 0) > 0
                      ? `₹${Number(selectedItemForDetail.sellerPricePerUnit || selectedItemForDetail.sellerPrice).toLocaleString()}`
                      : 'Not Quoted Yet'}
                  </div>
                  <div className="text-[11px] text-emerald-900">
                    Total Line Price: <strong>₹{((Number(selectedItemForDetail.quantity) || 0) * (Number(selectedItemForDetail.sellerPricePerUnit || selectedItemForDetail.sellerPrice) || 0)).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Customizations & Specifications */}
              <div className="space-y-3">
                {selectedItemForDetail.customizations && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950">
                    <strong className="block text-xs font-extrabold uppercase tracking-wider text-purple-900 mb-1">
                      ✨ Customization Specifications
                    </strong>
                    <p className="text-xs leading-relaxed">{selectedItemForDetail.customizations}</p>
                  </div>
                )}

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 space-y-1">
                  <strong className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1">
                    Extra Notes & Size Distribution
                  </strong>
                  <p className="text-xs leading-relaxed">{selectedItemForDetail.notes || 'No specific notes provided.'}</p>
                </div>
              </div>

              {/* Seller / Admin Item Price Input */}
              {(userRole === 'admin' || userRole === 'seller') && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-3">
                  <h4 className="font-extrabold text-xs text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={15} className="text-teal-700" />
                    Set / Update Seller Offered Price Per Unit (₹)
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 480"
                      value={itemSellerPriceInput}
                      onChange={(e) => setItemSellerPriceInput(e.target.value)}
                      className="flex-1 bg-white border border-teal-300 rounded-xl p-2.5 text-xs font-mono font-bold text-teal-950 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (itemSellerPriceInput) {
                          selectedItemForDetail.sellerPricePerUnit = Number(itemSellerPriceInput);
                          setSelectedItemForDetail({ ...selectedItemForDetail, sellerPricePerUnit: Number(itemSellerPriceInput) });
                        }
                      }}
                      className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Update Price
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedItemForDetail(null)}
                className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Item Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* BUYER QUOTATION ACCEPTANCE & ORDER SIZE ADJUSTMENT MODAL */}
      {/* ========================================== */}
      {acceptQuoteModalData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 text-xs max-h-[92vh] sm:max-h-[88vh] flex flex-col my-auto overflow-hidden border border-gray-100">
            {/* Pinned Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm sm:text-base font-display">
                    Accept Quotation & Finalize Order Size
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Vendor: <strong className="text-emerald-950 font-bold">{acceptQuoteModalData.quote.sellerStoreName || acceptQuoteModalData.quote.sellerName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAcceptQuoteModalData(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Middle Content Container */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-3 pr-1 scrollbar-thin">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-950 flex items-start gap-2">
                <Sparkles size={15} className="text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-teal-900 font-extrabold mb-0.5">
                    Update Item Counts / Order Size to Existing Count
                  </strong>
                  <span>
                    You can increase or decrease the quantities below to match your school/institutional headcount before accepting. Line totals and the final order budget will recalculate automatically based on vendor unit rates.
                  </span>
                </div>
              </div>

              {/* Editable Item Quantities Table (Scrollable Container) */}
              <div className="border border-gray-200 rounded-2xl overflow-y-auto max-h-[40vh] sm:max-h-[300px] min-h-[120px] bg-white shadow-2xs scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] uppercase font-bold text-gray-600 border-b border-gray-200 sticky top-0 z-10 shadow-2xs">
                      <th className="py-2.5 px-3 bg-gray-50">Item / Requirement</th>
                      <th className="py-2.5 px-2 text-right bg-gray-50">Quoted Rate</th>
                      <th className="py-2.5 px-3 text-center bg-gray-50">Order Count (Units)</th>
                      <th className="py-2.5 px-3 text-right bg-gray-50">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {acceptQuoteModalData.items.map((item, itIdx) => {
                      return (
                        <tr key={itIdx} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-gray-900">{item.itemName}</div>
                            <div className="text-[10px] text-gray-400">{item.category}</div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-900">
                            ₹{item.pricePerUnit > 0 ? item.pricePerUnit.toLocaleString() : '0'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const newQty = Math.max(1, item.quantity - 5);
                                  setAcceptQuoteModalData(prev => {
                                    const updatedItems = [...prev.items];
                                    updatedItems[itIdx] = {
                                      ...updatedItems[itIdx],
                                      quantity: newQty,
                                      totalPrice: newQty * updatedItems[itIdx].pricePerUnit
                                    };
                                    return { ...prev, items: updatedItems };
                                  });
                                }}
                                className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold cursor-pointer text-xs"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value) || 1);
                                  setAcceptQuoteModalData(prev => {
                                    const updatedItems = [...prev.items];
                                    updatedItems[itIdx] = {
                                      ...updatedItems[itIdx],
                                      quantity: val,
                                      totalPrice: val * updatedItems[itIdx].pricePerUnit
                                    };
                                    return { ...prev, items: updatedItems };
                                  });
                                }}
                                className="w-16 text-center font-bold text-gray-900 py-1 focus:outline-none text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newQty = item.quantity + 5;
                                  setAcceptQuoteModalData(prev => {
                                    const updatedItems = [...prev.items];
                                    updatedItems[itIdx] = {
                                      ...updatedItems[itIdx],
                                      quantity: newQty,
                                      totalPrice: newQty * updatedItems[itIdx].pricePerUnit
                                    };
                                    return { ...prev, items: updatedItems };
                                  });
                                }}
                                className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold cursor-pointer text-xs"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-gray-900">
                            ₹{item.totalPrice.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Calculations & Live Summary Bar */}
              {(() => {
                const totalAdjustedQty = acceptQuoteModalData.items.reduce((s, it) => s + Number(it.quantity || 0), 0);
                const totalAdjustedAmount = acceptQuoteModalData.items.reduce((s, it) => s + Number(it.totalPrice || 0), 0) || Number(acceptQuoteModalData.quote.quoteAmount);

                const advPct = Number(acceptQuoteModalData.quote.prepaymentPercentage ?? acceptQuoteModalData.quote.sellerAdvancePercentage ?? 0);
                const advAmt = advPct > 0 
                  ? Math.round((totalAdjustedAmount * advPct) / 100) 
                  : Number(acceptQuoteModalData.quote.prepaymentAmount ?? acceptQuoteModalData.quote.sellerAdvanceAmount ?? 0);
                const remainingBal = Math.max(0, totalAdjustedAmount - advAmt);

                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider block">
                          Updated Headcount & Items
                        </span>
                        <div className="font-extrabold text-gray-900 text-sm mt-0.5">
                          {totalAdjustedQty} Total Demanded Units ({acceptQuoteModalData.items.length} Products)
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">
                          Final Accepted Order Total
                        </span>
                        <div className="font-mono font-black text-xl text-emerald-950">
                          ₹{totalAdjustedAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {(advPct > 0 || advAmt > 0) && (
                      <div className="pt-2 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-emerald-900">
                        <div>
                          Seller Demanded Prepayment ({advPct > 0 ? `${advPct}%` : 'Fixed'}): <strong className="font-mono text-emerald-950 text-xs">₹{advAmt.toLocaleString()}</strong>
                          {acceptQuoteModalData.quote.prepaymentTerms || acceptQuoteModalData.quote.sellerAdvanceTerms ? (
                            <span className="italic block text-[10px] text-emerald-700">"{acceptQuoteModalData.quote.prepaymentTerms || acceptQuoteModalData.quote.sellerAdvanceTerms}"</span>
                          ) : null}
                        </div>
                        <div className="sm:text-right">
                          Balance upon Delivery: <strong className="font-mono text-gray-900 text-xs">₹{remainingBal.toLocaleString()}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Pinned Modal Footer Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setAcceptQuoteModalData(null)}
                className="flex-1 py-2.5 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const totalAdjustedQty = acceptQuoteModalData.items.reduce((s, it) => s + Number(it.quantity || 0), 0);
                  const totalAdjustedAmount = acceptQuoteModalData.items.reduce((s, it) => s + Number(it.totalPrice || 0), 0) || Number(acceptQuoteModalData.quote.quoteAmount);

                  const advPct = Number(acceptQuoteModalData.quote.prepaymentPercentage ?? acceptQuoteModalData.quote.sellerAdvancePercentage ?? 0);
                  const advAmt = advPct > 0 
                    ? Math.round((totalAdjustedAmount * advPct) / 100) 
                    : Number(acceptQuoteModalData.quote.prepaymentAmount ?? acceptQuoteModalData.quote.sellerAdvanceAmount ?? 0);

                  onApproveQuote(order.id || order._id, acceptQuoteModalData.quote._id, {
                    updatedRequirements: acceptQuoteModalData.items.map(it => ({
                      itemId: it.itemId,
                      itemName: it.itemName,
                      quantity: it.quantity,
                      sellerPricePerUnit: it.pricePerUnit
                    })),
                    totalQuantity: totalAdjustedQty,
                    quoteAmount: totalAdjustedAmount,
                    prepaymentPercentage: advPct,
                    prepaymentAmount: advAmt,
                    sellerAdvancePercentage: advPct,
                    sellerAdvanceAmount: advAmt
                  });

                  setAcceptQuoteModalData(null);
                }}
                className="flex-1 py-2.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 font-display transition-colors"
              >
                <CheckCircle2 size={16} />
                <span>Confirm & Accept Winning Proposal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2nd Version / Counter-Demand Modal for Buyer */}
      {counterDrawerQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-purple-200 flex flex-col max-h-[92vh] space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Send 2nd Version Counter-Demand
                  </h3>
                  <p className="text-xs text-gray-500">
                    Negotiate terms with <strong className="text-gray-700">{counterDrawerQuote.sellerStoreName || counterDrawerQuote.sellerName}</strong> (Version {(counterDrawerQuote.currentVersion || 1) + 1})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCounterDrawerQuote(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-[11px] text-purple-950 flex items-start gap-2 shrink-0">
              <Sparkles size={15} className="text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-purple-900 font-extrabold">
                  Iterative Negotiation Rounds
                </strong>
                <span>
                  Propose your updated target budget, preferred delivery lead time, and advance prepayment. The vendor can accept your demand directly or counter with revised terms (and may raise advance % or delivery days). You can negotiate across all vendors before choosing the winner!
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitCounterDemand} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Target Total Budget & Lead Days */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Target Budget (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={counterTargetBudget}
                    onChange={(e) => setCounterTargetBudget(e.target.value)}
                    placeholder="e.g. 130000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-purple-600 rounded-xl text-sm font-mono font-bold text-gray-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Vendor pitch: ₹{Number(counterDrawerQuote.quoteAmount).toLocaleString()}</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Requested Lead Time (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    value={counterDeliveryDays}
                    onChange={(e) => setCounterDeliveryDays(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-purple-600 rounded-xl text-sm font-mono font-bold text-gray-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Vendor lead time: {counterDrawerQuote.estimatedDeliveryDays || 7} days</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Proposed Advance Prepayment (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={counterAdvancePct}
                    onChange={(e) => setCounterAdvancePct(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-purple-600 rounded-xl text-sm font-mono font-bold text-gray-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    ~₹{counterTargetBudget ? Math.round((Number(counterTargetBudget) * (Number(counterAdvancePct) || 0)) / 100).toLocaleString() : '0'} advance
                  </span>
                </div>
              </div>

              {/* Item-by-item target prices & quantity adjustment */}
              {counterItemDemands.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Package size={14} className="text-purple-600" />
                      <span>Adjust Item Quantities & Target Rates (2nd Version)</span>
                    </label>
                    <span className="text-[11px] font-extrabold text-purple-800 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
                      Total Order: {counterItemDemands.reduce((s, it) => s + (Number(it.quantity) || 0), 0)} Units
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    You can edit the <strong>Quantity</strong> to increase or scale your order size, and customize your target unit rate. The total budget recalculates automatically.
                  </p>
                  <div className="border border-purple-200/80 rounded-xl overflow-hidden max-h-56 overflow-y-auto shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-purple-50/80 text-[10px] uppercase font-bold text-purple-900 border-b border-purple-200">
                          <th className="py-2.5 px-3">Item Demand</th>
                          <th className="py-2.5 px-2 text-center">Quantity (Units)</th>
                          <th className="py-2.5 px-2 text-right">Vendor Quoted</th>
                          <th className="py-2.5 px-2 text-right">Target Rate / Unit</th>
                          <th className="py-2.5 px-3 text-right">Line Target Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100 bg-white">
                        {counterItemDemands.map((it, idx) => (
                          <tr key={it.itemId || idx} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-gray-900 block">{it.itemName}</span>
                              <span className="text-[10px] text-gray-400">Item #{idx + 1}</span>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => handleCounterItemQuantityChange(idx, e.target.value)}
                                className="w-20 px-2 py-1 text-center bg-purple-50/50 border border-purple-300 rounded-lg text-xs font-mono font-bold text-purple-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-600 transition-all"
                                title="Edit item quantity to increase or adjust order size"
                                placeholder="Qty"
                              />
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-gray-500 font-medium">
                              ₹{it.currentSellerPrice}
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              <div className="inline-flex items-center justify-end">
                                <span className="text-gray-400 text-xs mr-0.5">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={it.targetUnitPrice}
                                  onChange={(e) => handleCounterItemPriceChange(idx, e.target.value)}
                                  className="w-20 px-2 py-1 text-right bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-600"
                                  placeholder="Rate"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-extrabold text-purple-950">
                              ₹{(Number(it.targetTotalPrice) || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-purple-100/60 font-bold border-t border-purple-200 text-xs">
                          <td className="py-2 px-3 text-purple-900">Total Demanded:</td>
                          <td className="py-2 px-2 text-center font-mono font-black text-purple-950">
                            {counterItemDemands.reduce((s, it) => s + (Number(it.quantity) || 0), 0)} Units
                          </td>
                          <td colSpan="2" className="py-2 px-2 text-right text-[11px] text-purple-800 font-bold">
                            Calculated Target Budget:
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-purple-950">
                            ₹{counterItemDemands.reduce((s, it) => s + (Number(it.targetTotalPrice) || 0), 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Buyer Negotiation Note / Message */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Negotiation Note / Message for Vendor
                </label>
                <textarea
                  rows="3"
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder="e.g. Our school management has capped the budget at ₹1,30,000 for this batch. If agreed, we will confirm immediately."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-purple-600 rounded-xl text-xs text-gray-900 focus:outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCounterDrawerQuote(null)}
                  className="flex-1 py-2.5 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCounter}
                  className="flex-1 py-2.5 font-bold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 text-xs font-display"
                >
                  <Sparkles size={15} />
                  <span>{isSubmittingCounter ? 'Sending Counter...' : 'Submit 2nd Version Counter-Demand'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Invoice & Certificate Modal */}
      {isInvoiceOpen && taxInvoiceOrder && (
        <TaxInvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          order={taxInvoiceOrder}
        />
      )}

      {/* Quotation Version Comparison Modal */}
      {isComparisonOpen && comparingQuote && (
        <QuotationVersionComparisonModal
          isOpen={isComparisonOpen}
          onClose={() => setIsComparisonOpen(false)}
          quotation={comparingQuote}
          order={order}
        />
      )}

      {/* Live Consignment Tracking Modal */}
      {isTrackingOpen && (
        <OrderTrackingModal
          isOpen={isTrackingOpen}
          onClose={() => setIsTrackingOpen(false)}
          order={order}
        />
      )}

    </div>
  );
}
