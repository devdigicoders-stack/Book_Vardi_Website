import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  UserCheck,
  MapPin,
  Package,
  Plus,
  Trash2,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowLeft,
  FileText,
  Clock,
  Send,
  Camera,
  X,
  Lock,
  Eye,
  Edit3,
  Navigation,
  ShieldAlert,
  DollarSign,
  Percent,
  Printer,
  Download
} from 'lucide-react';
import { compressImageToWebP } from '../../utils/imageCompressor';
import { backendEnabled, submitSchoolBulkOrderInBackend, API_BASE_URL } from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { useLocation, parseLocationDetails, fetchDetailsFromPincode } from '../../context/LocationContext';

export default function SchoolBulkOrderPage({ onNavigate }) {
  const { isAuthenticated, openAuthModal, userProfile, showToast } = useCart();
  const { userLocation, locationLabel, requestBrowserLocation, isLocating } = useLocation();
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);

  // Institution & Contact Info State
  const [institutionName, setInstitutionName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [institutionType, setInstitutionType] = useState('K-12 School');

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [designation, setDesignation] = useState('Principal / Director');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Helper to generate unique requirement item ID
  const generateReqId = () => `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Requirement Demands List (dynamic array)
  const [requirements, setRequirements] = useState([
    {
      id: generateReqId(),
      category: 'Custom School Uniforms',
      itemName: '',
      quantity: 100,
      budgetPerUnit: 500,
      sampleImage: '',
      sampleImages: [],
      customizations: '',
      notes: ''
    }
  ]);

  const [logoEmbroideryRequired, setLogoEmbroideryRequired] = useState(true);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReferenceId, setSubmittedReferenceId] = useState(null);
  const [submittedOrderData, setSubmittedOrderData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Expected Quotation Receiving Date State
  const [expectedQuotationDate, setExpectedQuotationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Auto-fill administrator contact info if user is authenticated
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      if (!contactName && userProfile.name && userProfile.name !== 'Student Account') {
        setContactName(userProfile.name);
      }
      if (!contactEmail && userProfile.email && !userProfile.email.includes('@bookvardi.local')) {
        setContactEmail(userProfile.email);
      }
      if (!contactPhone && userProfile.phone) {
        setContactPhone(userProfile.phone);
      }
      if (!institutionName && userProfile.institution) {
        setInstitutionName(userProfile.institution);
      }
    }
  }, [isAuthenticated, userProfile]);

  // Helper for fallback location filling when reverse geocoding is unavailable
  const fallbackLocationFill = () => {
    setIsDetectingLoc(false);
    const savedState = localStorage.getItem('bv_user_state') || 'Uttar Pradesh';
    const savedPincode = localStorage.getItem('bv_user_pincode') || '226028';

    if (locationLabel && locationLabel !== 'Kamta, Lucknow') {
      const parts = locationLabel.split(',').map((s) => s.trim());
      if (parts.length >= 2) {
        setAddress((prev) => prev || parts[0]);
        setCity((prev) => prev || parts[parts.length - 1]);
      } else {
        setAddress((prev) => prev || locationLabel);
        setCity((prev) => prev || 'Lucknow');
      }
    } else {
      setAddress((prev) => prev || 'Kamta Campus Road');
      setCity((prev) => prev || 'Lucknow');
    }

    setState((prev) => prev || savedState);
    setPincode((prev) => prev || savedPincode);
    showToast('📍 Auto-filled campus location details');
  };

  // Handle Location Auto-Detect with Reverse Geocoding for Address, City, State, & Pincode
  const handleAutoDetectLocation = () => {
    setIsDetectingLoc(true);
    showToast('📍 Detecting live location & campus address...');

    if (requestBrowserLocation) {
      requestBrowserLocation();
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            if (res.ok) {
              const data = await res.json();
              const parsed = parseLocationDetails(data);

              const parts = [parsed.street, parsed.colony, parsed.landmark].filter(Boolean);
              const formattedAddress = parts.length > 0
                ? Array.from(new Set(parts)).join(', ')
                : (parsed.displayName ? parsed.displayName.split(',').slice(0, 3).join(', ') : '');

              if (formattedAddress) setAddress(formattedAddress);
              if (parsed.city) setCity(parsed.city);
              if (parsed.state) setState(parsed.state);
              if (parsed.pincode) setPincode(parsed.pincode);

              showToast('✅ Campus location, State & Pincode detected successfully!');
              setIsDetectingLoc(false);
              return;
            }
          } catch (err) {
            console.warn('Live reverse geocoding error:', err);
          }
          fallbackLocationFill();
        },
        (err) => {
          console.warn('Geolocation positioning error:', err);
          fallbackLocationFill();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      fallbackLocationFill();
    }
  };

  // Sync userLocation updates into empty campus location fields
  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng && (!address || !city || !state || !pincode)) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            const parsed = parseLocationDetails(data);
            const parts = [parsed.street, parsed.colony, parsed.landmark].filter(Boolean);
            const formattedAddress = parts.length > 0
              ? Array.from(new Set(parts)).join(', ')
              : (parsed.displayName ? parsed.displayName.split(',').slice(0, 3).join(', ') : '');

            if (formattedAddress) setAddress((prev) => prev || formattedAddress);
            if (parsed.city) setCity((prev) => prev || parsed.city);
            if (parsed.state) setState((prev) => prev || parsed.state);
            if (parsed.pincode) setPincode((prev) => prev || parsed.pincode);
          }
        })
        .catch(() => {});
    }
  }, [userLocation]);

  // Auto-fill state and city when 6-digit PIN code is entered
  useEffect(() => {
    const cleanPin = pincode ? String(pincode).trim() : '';
    if (cleanPin.length === 6 && /^\d{6}$/.test(cleanPin)) {
      fetchDetailsFromPincode(cleanPin).then((details) => {
        if (details) {
          if (details.state) setState(details.state);
          if (details.city) setCity(details.city);
          if (details.locality && !address) {
            setAddress(`${details.locality} Campus Area`);
          }
          showToast(`📍 Auto-filled location for PIN ${cleanPin}: ${details.city}, ${details.state}`);
        }
      });
    }
  }, [pincode]);

  // Dynamic Requirements handlers
  const handleAddRequirement = () => {
    setRequirements((prev) => [
      ...prev,
      {
        id: generateReqId(),
        category: 'Custom School Uniforms',
        itemName: '',
        quantity: 100,
        budgetPerUnit: 500,
        sampleImage: '',
        sampleImages: [],
        customizations: '',
        notes: ''
      }
    ]);
  };

  const handleRemoveRequirement = (idToRemove) => {
    if (requirements.length <= 1) {
      showToast('⚠️ Please keep at least one requirement item.');
      return;
    }
    setRequirements((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handleRequirementChange = (id, field, value) => {
    setRequirements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleMultipleImageUpload = async (id, files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    
    for (const file of fileList) {
      try {
        const compressed = await compressImageToWebP(file, 1024, 1024, 0.85);
        setRequirements((prev) =>
          prev.map((item) => {
            if (item.id === id) {
              const currentArr = Array.isArray(item.sampleImages) ? item.sampleImages : (item.sampleImage ? [item.sampleImage] : []);
              const updated = [...currentArr, compressed.dataUrl];
              return { ...item, sampleImages: updated, sampleImage: updated[0] };
            }
            return item;
          })
        );
      } catch (err) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setRequirements((prev) =>
            prev.map((item) => {
              if (item.id === id) {
                const currentArr = Array.isArray(item.sampleImages) ? item.sampleImages : (item.sampleImage ? [item.sampleImage] : []);
                const updated = [...currentArr, e.target.result];
                return { ...item, sampleImages: updated, sampleImage: updated[0] };
              }
              return item;
            })
          );
        };
        reader.readAsDataURL(file);
      }
    }
    showToast(`📸 ${fileList.length} photo(s) attached successfully!`);
  };

  const handleRemoveSampleImage = (id, imgIndex) => {
    setRequirements((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const currentArr = Array.isArray(item.sampleImages) ? item.sampleImages : (item.sampleImage ? [item.sampleImage] : []);
          const updated = currentArr.filter((_, idx) => idx !== imgIndex);
          return { ...item, sampleImages: updated, sampleImage: updated[0] || '' };
        }
        return item;
      })
    );
  };

  // Calculate total overall budget
  const calculatedOverallBudget = requirements.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.budgetPerUnit) || 0;
    return sum + (qty * rate);
  }, 0);

  // Helper to calculate quotation countdown in days
  const getQuotationCountdown = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    const targetMid = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((targetMid - nowMid) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) return { days: diffDays, text: `${diffDays} days left`, isExpired: false, isUrgent: diffDays <= 2 };
    if (diffDays === 1) return { days: 1, text: '1 day left (Ends tomorrow)', isExpired: false, isUrgent: true };
    if (diffDays === 0) return { days: 0, text: 'Deadline today', isExpired: false, isUrgent: true };
    return { days: diffDays, text: `Deadline passed (${Math.abs(diffDays)}d ago)`, isExpired: true, isUrgent: false };
  };

  // Validate form fields before opening preview or submitting
  const validateForm = () => {
    if (!isAuthenticated) {
      showToast('🔐 Please log in first to submit a Bulk Order Inquiry.');
      if (openAuthModal) openAuthModal();
      return false;
    }

    if (!institutionName.trim() || !contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      showToast('⚠️ Please fill out all required institution and administrator contact fields.');
      return false;
    }

    if (!address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      showToast('⚠️ Please fill out complete school address details (Address, City, State, Pincode).');
      return false;
    }

    const invalidItem = requirements.find((r) => !r.itemName.trim());
    if (invalidItem) {
      showToast('⚠️ Please provide a title/name for each requirement demand item.');
      return false;
    }

    return true;
  };

  // Open Preview Modal
  const handleOpenPreview = (e) => {
    if (e) e.preventDefault();
    if (validateForm()) {
      setShowPreviewModal(true);
    }
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const refId = `BULK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalQty = requirements.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
    const userProfileStr = localStorage.getItem('book_vardi_user_profile');
    let currentUserId = userProfile?.id || userProfile?._id || '';
    let currentUserPhone = userProfile?.phone || contactPhone.trim();
    let currentUserEmail = userProfile?.email || contactEmail.trim();
    if (!currentUserId && userProfileStr) {
      try {
        const u = JSON.parse(userProfileStr);
        currentUserId = u.id || u._id || '';
        if (!currentUserPhone) currentUserPhone = u.phone || '';
        if (!currentUserEmail) currentUserEmail = u.email || '';
      } catch (e) {}
    }

    const payload = {
      referenceId: refId,
      userId: currentUserId,
      userPhone: currentUserPhone,
      userEmail: currentUserEmail,
      institutionName: institutionName.trim(),
      schoolId: schoolId.trim(),
      institutionType,
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      designation,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      requirements,
      totalQuantity: totalQty,
      overallBudget: calculatedOverallBudget,
      targetDeliveryDate,
      expectedQuotationDate: expectedQuotationDate || '',
      logoEmbroideryRequired,
      targetBudgetPerKit: String(calculatedOverallBudget || ''),
      additionalNotes: additionalNotes.trim(),
      buyerAdvanceType: 'percentage',
      buyerAdvancePercentage: 0,
      buyerAdvanceAmount: 0,
      buyerAdvanceNote: '',
      assignmentMode: 'unassigned',
      status: 'pending'
    };

    let finalRefId = refId;
    let savedSuccessfully = false;

    if (backendEnabled) {
      try {
        const res = await submitSchoolBulkOrderInBackend(payload);
        if (res?.referenceId || res?.data?.referenceId || res?.order?.referenceId || res?.bulkOrder?.referenceId) {
          finalRefId = res?.referenceId || res?.data?.referenceId || res?.order?.referenceId || res?.bulkOrder?.referenceId;
        }
        savedSuccessfully = true;
      } catch (err) {
        console.error('Backend bulk order submission error:', err?.message);
      }
    }

    // Store to user-scoped local storage backup so inquiry is immediately visible in customer profile
    try {
      const userKey = currentUserPhone ? currentUserPhone.replace(/\D/g, '').slice(-10) : (currentUserId || 'guest');
      const storageKey = `bv_customer_bulk_orders_${userKey}`;
      const localOrders = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('bv_customer_bulk_orders') || '[]');
      const savedPayload = {
        ...payload,
        id: finalRefId,
        _id: finalRefId,
        referenceId: finalRefId,
        createdAt: new Date().toISOString()
      };
      
      const filtered = localOrders.filter(o => o.referenceId !== finalRefId && o.id !== finalRefId && o._id !== finalRefId);
      filtered.unshift(savedPayload);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      localStorage.setItem('bv_customer_bulk_orders', JSON.stringify(filtered));

      // Record in current session if guest
      try {
        const sessionRefs = JSON.parse(sessionStorage.getItem('bv_guest_bulk_refs') || '[]');
        if (!sessionRefs.includes(finalRefId)) {
          sessionRefs.push(finalRefId);
          sessionStorage.setItem('bv_guest_bulk_refs', JSON.stringify(sessionRefs));
        }
      } catch (e) {}

      savedSuccessfully = true;
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }

    setIsSubmitting(false);
    setShowPreviewModal(false);

    if (savedSuccessfully) {
      setSubmittedReferenceId(finalRefId);
      setSubmittedOrderData({ ...payload, referenceId: finalRefId });
      showToast(`🎉 Bulk Order Inquiry ${finalRefId} submitted successfully!`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast('❌ Unable to submit bulk inquiry. Please try again.');
    }
  };

  /* SUCCESS CONFIRMATION VIEW */
  if (submittedReferenceId) {
    return (
      <div className="min-h-screen bg-slate-50/70 pb-20 pt-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white border border-emerald-200 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-200 shadow-xs animate-bounce">
              <CheckCircle2 size={44} />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Broadcasted to Verified Sellers
              </span>
              <h2 className="font-display text-3xl font-extrabold text-gray-900 mt-3">
                Thank You, {contactName}!
              </h2>
              <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto leading-relaxed">
                Your bulk order inquiry for <strong>{institutionName}</strong> has been registered and <strong>broadcasted to BookVardi partner sellers</strong>. Sellers will review your specifications and submit formal quotations.
              </p>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-5 text-left max-w-md mx-auto space-y-2.5">
              <div className="flex items-center justify-between text-xs border-b border-emerald-200/60 pb-2">
                <span className="text-gray-500 font-medium">Inquiry Reference ID:</span>
                <span className="font-mono font-extrabold text-emerald-800 text-sm">{submittedReferenceId}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-emerald-200/60 pb-2">
                <span className="text-gray-500 font-medium">Total Demand Quantity:</span>
                <span className="font-extrabold text-gray-900">{requirements.reduce((s, r) => s + Number(r.quantity), 0)} Units</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">School Location:</span>
                <span className="font-bold text-gray-800">{city}, {state}</span>
              </div>
            </div>

            {/* Expected Quotation Timeline & Days Countdown */}
            {expectedQuotationDate && (() => {
              const cd = getQuotationCountdown(expectedQuotationDate);
              return (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                    <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={15} className="text-blue-600" /> Quotation Receiving Timeline
                    </span>
                    {cd && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        cd.isExpired
                          ? 'bg-red-100 text-red-700 border-red-300'
                          : cd.isUrgent
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {cd.text}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">Quotations Expected By:</span>
                    <span className="font-extrabold text-gray-900">
                      {new Date(expectedQuotationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Sellers will submit competitive price bids before this deadline. You can compare proposals and select the best quotation.
                  </p>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-start gap-2.5 text-xs">
                <Clock size={18} className="text-brand-teal shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900">Direct Seller Quotes</strong>
                  <span className="text-gray-500 text-[11px]">Sellers can submit competitive price quotes.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-start gap-2.5 text-xs">
                <Package size={18} className="text-brand-ochre shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900">Sample Kit Dispatch</strong>
                  <span className="text-gray-500 text-[11px]">Physical fabric & notebook samples delivered for board review.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-start gap-2.5 text-xs">
                <Sparkles size={18} className="text-brand-pink shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900">Bulk Discounts</strong>
                  <span className="text-gray-500 text-[11px]">Customized institutional pricing matrix.</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmittedReferenceId(null);
                  setSubmittedOrderData(null);
                  setRequirements([
                    {
                      id: generateReqId(),
                      category: 'Custom School Uniforms',
                      itemName: '',
                      quantity: 100,
                      budgetPerUnit: 500,
                      sampleImage: '',
                      sampleImages: [],
                      customizations: '',
                      notes: ''
                    }
                  ]);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Submit Another Request
              </button>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('home')}
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Return to BookVardi Storefront
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-brand-teal-dark via-brand-teal to-teal-800 text-white py-10 px-4 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate && onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-100 hover:text-brand-yellow transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Store</span>
            </button>

            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-brand-yellow text-brand-teal-dark">
              Institutional Program
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            School & Institutional Bulk Supply Request
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
            Direct bulk procurement portal for schools, colleges, and educational institutes. Request custom uniforms, NCERT book sets, crest-embroidered notebooks, and sample kits.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-teal-100">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck size={14} className="text-brand-yellow shrink-0" />
              Custom Logo Crest
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Truck size={14} className="text-brand-yellow shrink-0" />
              Pan-India Campus Delivery
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Package size={14} className="text-brand-yellow shrink-0" />
              Direct Seller Quotes
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles size={14} className="text-brand-yellow shrink-0" />
              Sample Kit Verification
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        
        {/* REQUIREMENT 1: AUTHENTICATION LOCK IF NOT LOGGED IN */}
        {!isAuthenticated ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-brand-teal/20 shadow-xl text-center space-y-5 my-6">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
              <Lock size={32} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Authentication Required
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-gray-900">
                Please Log In to Submit a Bulk Order
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                You must be logged in to your BookVardi account to submit bulk supply inquiries, preview order specifications, and receive quotes from partner sellers.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => openAuthModal && openAuthModal()}
                className="inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-sm px-8 py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <UserCheck size={18} />
                <span>Log In / Sign Up to Continue</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleOpenPreview} className="space-y-8">
            
            {/* SECTION 1: INSTITUTION DETAILS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center font-bold">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="font-display text-base font-extrabold text-gray-900">
                    1. Institution Details
                  </h2>
                  <p className="text-xs text-gray-500">Provide official school or organization credentials.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    School / Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. St. Xavier Senior Secondary School"
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    School ID / Affiliation Code
                  </label>
                  <input
                    type="text"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    placeholder="e.g. CBSE-2130091 / SCH-004"
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Institution Type
                  </label>
                  <select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value)}
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
                  >
                    <option value="K-12 School">School (CBSE / ICSE / State Board)</option>
                    <option value="College / University">College / University</option>
                    <option value="Preschool / Play School">Preschool / Play School</option>
                    <option value="Coaching Institute">Coaching Institute / Academy</option>
                    <option value="NGO / Trust">Educational Trust / NGO</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: ADMINISTRATOR CONTACT INFO */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-200">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h2 className="font-display text-base font-extrabold text-gray-900">
                    2. Administrator Contact Information
                  </h2>
                  <p className="text-xs text-gray-500">Authorized contact person for procurement decisions.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Administrator Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Designation / Role
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
                  >
                    <option value="Partner Merchant / Seller">Partner Merchant / Seller / Distributor</option>
                    <option value="Principal / Director">Principal / Director</option>
                    <option value="Procurement Lead">Procurement Lead / Store Manager</option>
                    <option value="Administrator">Administrator / Vice Principal</option>
                    <option value="Teacher / Committee Lead">Teacher / Uniform Committee Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Official Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. principal@stxaviers.edu.in"
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Contact Phone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* REQUIREMENT 2: LOCATION AUTO-DETECT & SCHOOL ADDRESS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-200">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-extrabold text-gray-900">
                      3. School Delivery Address & Campus Location
                    </h2>
                    <p className="text-xs text-gray-500">Specify school campus address for seller dispatch & sample kits.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={isLocating || isDetectingLoc}
                  className="inline-flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-purple-200 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
                >
                  <Navigation size={14} className={(isLocating || isDetectingLoc) ? 'animate-spin' : ''} />
                  <span>{(isLocating || isDetectingLoc) ? 'Detecting Location...' : '📍 Auto-Detect Live Location'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    School Campus Street Address / Landmark <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Sector 49, Rosewood City Road, Near Main Gate"
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lucknow / Gurugram"
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    State & Pincode <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      className="bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white"
                    />
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="PIN"
                      className="bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: REQUIREMENT DEMANDS & SAMPLE IMAGE UPLOADS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 text-brand-pink flex items-center justify-center font-bold border border-pink-200">
                    <Package size={20} />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-extrabold text-gray-900">
                      4. Requirement Demands & Sample Photos
                    </h2>
                    <p className="text-xs text-gray-500">Specify each item demand and optionally upload sample images (e.g. logo, uniform style, notebook layout).</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddRequirement}
                  className="inline-flex items-center gap-1.5 bg-brand-teal hover:bg-brand-teal-light text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={15} />
                  <span>Add Demand Item</span>
                </button>
              </div>

              {/* List of Requirements */}
              <div className="space-y-4">
                {requirements.map((reqItem, index) => (
                  <div
                    key={reqItem.id || `req-item-${index}`}
                    className="p-5 rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/50 space-y-4 relative group"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-xs font-extrabold text-brand-teal uppercase tracking-wider">
                        Requirement Demand #{index + 1}
                      </span>

                      {requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(reqItem.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 p-1 cursor-pointer"
                          title="Remove requirement"
                        >
                          <Trash2 size={13} />
                          <span>Remove Item</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      {/* Category */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Category Demand
                        </label>
                        <select
                          value={reqItem.category}
                          onChange={(e) => handleRequirementChange(reqItem.id, 'category', e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-teal"
                        >
                          <option value="Custom School Uniforms">Custom School Uniforms (Shirts, Pants, Skirts)</option>
                          <option value="Complete Academic Kits">Complete School Kits (Books + Stationery + Bag)</option>
                          <option value="NCERT & Board Textbooks">NCERT & Board Textbooks</option>
                          <option value="Custom Crest Notebooks">Custom Crest Printed Notebooks</option>
                          <option value="Stationery Packs">Student Stationery Packs</option>
                          <option value="Sports & PT Tracksuits">Sports & PT Tracksuits</option>
                          <option value="Preschool Activity Sets">Preschool / Kindergarten Activity Sets</option>
                        </select>
                      </div>

                      {/* Item Name / Specification */}
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Item Requirement Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={reqItem.itemName}
                          onChange={(e) => handleRequirementChange(reqItem.id, 'itemName', e.target.value)}
                          placeholder="e.g. Girls Summer Navy Blue Frock (Cotton Blend)"
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-teal"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Quantity (Units)
                        </label>
                        <input
                          type="number"
                          min="10"
                          value={reqItem.quantity}
                          onChange={(e) => handleRequirementChange(reqItem.id, 'quantity', e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-brand-teal focus:ring-2 focus:ring-brand-teal"
                        />
                      </div>

                      {/* Budget Per Unit */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Target Budget / Unit (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={reqItem.budgetPerUnit || ''}
                          onChange={(e) => handleRequirementChange(reqItem.id, 'budgetPerUnit', e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-brand-teal"
                        />
                      </div>
                    </div>

                    {/* Customizations & Sample Images */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1 items-start">
                      {/* Sample Image Upload (Multiple Allowed) */}
                      <div className="sm:col-span-5 space-y-2">
                        <label className="block text-[11px] font-bold text-gray-700">
                          Sample Images / Design Previews (Multiple Allowed)
                        </label>

                        <div className="flex flex-wrap gap-2 items-center">
                          {Array.isArray(reqItem.sampleImages) && reqItem.sampleImages.map((imgSrc, imgIdx) => (
                            <div key={`${reqItem.id || index}-sample-${imgIdx}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-teal/40 shadow-2xs group/img">
                              <img src={imgSrc} alt={`Sample ${imgIdx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveSampleImage(reqItem.id, imgIdx)}
                                className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                                title="Remove photo"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}

                          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-gray-300 bg-white text-gray-600 hover:border-brand-teal hover:text-brand-teal text-xs transition-all cursor-pointer">
                            <Camera size={14} />
                            <span>Add Photo(s)</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleMultipleImageUpload(reqItem.id, e.target.files)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Customizations & Specific Notes */}
                      <div className="sm:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Customizations (Logo, Color, Fabric, etc.)
                          </label>
                          <input
                            type="text"
                            value={reqItem.customizations || ''}
                            onChange={(e) => handleRequirementChange(reqItem.id, 'customizations', e.target.value)}
                            placeholder="e.g. Logo embroidery on pocket, cotton blend"
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-teal"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Extra Notes / Size Distribution
                          </label>
                          <input
                            type="text"
                            value={reqItem.notes || ''}
                            onChange={(e) => handleRequirementChange(reqItem.id, 'notes', e.target.value)}
                            placeholder="e.g. Sizes: 28(30), 30(40), 32(30)"
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-teal"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 font-medium">
                      <span>Item Line Budget Summary:</span>
                      <strong className="text-teal-900 font-bold">
                        {reqItem.quantity || 0} Units × ₹{reqItem.budgetPerUnit || 0} = <span className="text-brand-teal font-extrabold text-sm">₹{((Number(reqItem.quantity) || 0) * (Number(reqItem.budgetPerUnit) || 0)).toLocaleString()}</span>
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculated Overall Budget Summary Banner */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-teal-950 shadow-2xs">
                <div className="flex items-center gap-2.5 font-extrabold text-xs sm:text-sm text-teal-900 uppercase tracking-wider">
                  <Sparkles size={18} className="text-teal-600 shrink-0" />
                  <span>Calculated Overall Requirement Budget Summary</span>
                </div>
                <div className="font-mono font-black text-base sm:text-lg text-teal-950 bg-white px-4 py-1.5 rounded-xl border border-teal-200 shadow-2xs">
                  Overall Budget: <span className="text-emerald-700">₹{calculatedOverallBudget.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* SECTION 5: CUSTOMIZATION, TARGET DELIVERY & ORDER PREVIEW */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="font-display text-base font-extrabold text-gray-900">
                    5. Customization, Target Delivery & Order Preview
                  </h2>
                  <p className="text-xs text-gray-500">Provide target pricing or delivery deadlines before order preview.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Logo Embroidery / Monogram Printing
                  </label>
                  <select
                    value={logoEmbroideryRequired ? 'yes' : 'no'}
                    onChange={(e) => setLogoEmbroideryRequired(e.target.value === 'yes')}
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white"
                  >
                    <option value="yes">Yes, Logo Embroidery / Crest Printing Needed</option>
                    <option value="no">No, Plain Standard Items Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Target Required Delivery Date
                  </label>
                  <input
                    type="date"
                    value={targetDeliveryDate}
                    onChange={(e) => setTargetDeliveryDate(e.target.value)}
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      Expected Quotation Receiving Date
                    </label>
                    {expectedQuotationDate && (() => {
                      const cd = getQuotationCountdown(expectedQuotationDate);
                      return cd ? (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          cd.isExpired
                            ? 'bg-red-100 text-red-700'
                            : cd.isUrgent
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {cd.text}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={expectedQuotationDate}
                    onChange={(e) => setExpectedQuotationDate(e.target.value)}
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Deadline for sellers to pitch competitive quotations</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Additional Notes / Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Mention any special tender terms, sample dispatch instructions, or quotation requirements..."
                  className="w-full bg-gray-50/70 border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white"
                />
              </div>

              {/* REQUIREMENT 3: ORDER PREVIEW ACTION BUTTON */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-brand-teal shrink-0" />
                  <span>Orders will be broadcasted to BookVardi partner sellers for competitive quotes.</span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-sm px-8 py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Eye size={18} />
                  <span>Preview Order Details</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* REQUIREMENT 3: ORDER PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-brand-teal-dark text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-yellow text-brand-teal-dark flex items-center justify-center font-bold">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-white">
                    School Bulk Order Specification Preview
                  </h3>
                  <p className="text-[11px] text-teal-200">Review institutional demand before sending to sellers</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 text-teal-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-800">
              
              {/* Institution & Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <h4 className="font-extrabold text-xs text-brand-teal uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Building2 size={14} /> Institution Info
                  </h4>
                  <p className="font-bold text-sm text-gray-900">{institutionName}</p>
                  <p className="text-gray-600 mt-0.5">Type: <strong className="text-gray-800">{institutionType}</strong></p>
                  {schoolId && <p className="text-gray-600">School ID: <strong className="font-mono text-gray-800">{schoolId}</strong></p>}
                </div>

                <div>
                  <h4 className="font-extrabold text-xs text-brand-teal uppercase tracking-wider mb-2 flex items-center gap-1">
                    <UserCheck size={14} /> Contact Person
                  </h4>
                  <p className="font-bold text-sm text-gray-900">{contactName} ({designation})</p>
                  <p className="text-gray-600 mt-0.5">Phone: <strong className="text-gray-900">{contactPhone}</strong></p>
                  <p className="text-gray-600">Email: <strong className="text-gray-900">{contactEmail}</strong></p>
                </div>
              </div>

              {/* Delivery School Address */}
              <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 space-y-1">
                <h4 className="font-extrabold text-xs text-purple-900 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <MapPin size={14} /> Delivery School Address
                </h4>
                <p className="font-bold text-xs text-gray-900">{address}</p>
                <p className="text-gray-700">{city}, {state} - <strong className="font-mono text-gray-900">{pincode}</strong></p>
              </div>

              {/* Requirement Demands Table */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1">
                  <Package size={14} className="text-brand-teal" /> Demanded Line Items ({requirements.length})
                </h4>

                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-teal text-white text-[11px] uppercase tracking-wider font-extrabold">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Category & Title</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-center">Sample Photo</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs">
                      {requirements.map((r, idx) => (
                        <tr key={r.id || `preview-item-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="py-2.5 px-3 font-bold text-gray-500">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-gray-900">{r.itemName}</p>
                            <p className="text-[10px] text-brand-teal font-medium">{r.category}</p>
                          </td>
                          <td className="py-2.5 px-3 text-center font-extrabold text-gray-900">{r.quantity} Units</td>
                          <td className="py-2.5 px-3 text-center">
                            {r.sampleImage ? (
                              <img src={r.sampleImage} alt="Sample" className="w-10 h-10 object-cover rounded-lg border border-gray-300 mx-auto shadow-2xs" />
                            ) : (
                              <span className="text-gray-400 text-[10px]">None</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 text-[11px]">{r.notes || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terms & Target Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-1 text-xs">
                  <p className="text-gray-600">Logo Embroidery: <strong className="text-gray-900">{logoEmbroideryRequired ? 'Yes (Custom Crest)' : 'No (Plain)'}</strong></p>
                  <p className="text-gray-600">Target Delivery Date: <strong className="text-gray-900">{targetDeliveryDate || 'Flexible / Urgent'}</strong></p>
                </div>

                <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-1 text-xs flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider flex items-center gap-1">
                    <Clock size={12} className="text-blue-600" /> Quotations Expected By
                  </span>
                  <div className="font-extrabold text-blue-950 text-sm">
                    {expectedQuotationDate ? new Date(expectedQuotationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible'}
                  </div>
                  {expectedQuotationDate && (() => {
                    const cd = getQuotationCountdown(expectedQuotationDate);
                    return cd ? (
                      <span className={`inline-block w-fit text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cd.isExpired ? 'bg-red-100 text-red-700' : cd.isUrgent ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {cd.text}
                      </span>
                    ) : null;
                  })()}
                </div>

                <div className="bg-brand-teal/5 p-4 rounded-2xl border border-brand-teal/20 space-y-1 text-xs text-right flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-brand-teal tracking-wider">Total Quantity Demanded</span>
                  <span className="text-2xl font-black text-brand-teal-dark">{requirements.reduce((s, r) => s + Number(r.quantity || 0), 0)} Units</span>
                </div>
              </div>

              {additionalNotes && (
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs">
                  <strong className="block text-amber-950 font-bold mb-0.5">Additional Instructions / Tender Terms:</strong>
                  <p className="text-amber-900">{additionalNotes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Edit3 size={15} />
                <span>Edit Order Details</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs px-8 py-3 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Send size={15} />
                <span>{isSubmitting ? 'Sending Request...' : 'Confirm & Submit to Sellers'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
