import React, { useState, useEffect } from 'react';
import {
  Store,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileText,
  Building2,
  UserCheck,
  CreditCard,
  ShieldCheck,
  MapPin,
  FileCheck,
  Package,
  Layers,
  Sparkles,
  Phone,
  Mail,
  Lock,
  X,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const ONBOARDING_STEPS = [
  { id: 1, title: 'Basic Profile', section: 'Basic Profile', desc: 'Name, mobile, email, photo', icon: UserCheck, verify: 'Email + Mobile OTP' },
  { id: 2, title: 'Business Details', section: 'Business Details', desc: 'Legal name, trade name, year', icon: Building2, verify: 'Admin / System Review' },
  { id: 3, title: 'Owner / Signatory', section: 'Owner / Authorized Person', desc: 'PAN, identity, designation', icon: UserCheck, verify: 'KYC Verification' },
  { id: 4, title: 'Business Documents', section: 'Business Documents', desc: 'PAN, GSTIN, registrations', icon: FileText, verify: 'Document Verification' },
  { id: 5, title: 'Business Address', section: 'Business Address', desc: 'Registered address, city, PIN', icon: MapPin, verify: 'Address Verification' },
  { id: 6, title: 'Address Proof', section: 'Address Proof', desc: 'Electricity bill / rent agreement', icon: FileCheck, verify: 'Manual / System Review' },
  { id: 7, title: 'Bank Details', section: 'Bank Details', desc: 'Account number, IFSC, bank name', icon: CreditCard, verify: 'Bank Verification' },
  { id: 8, title: 'Store Details', section: 'Store Details', desc: 'Store name, logo, description', icon: Store, verify: 'Marketplace Review' },
  { id: 9, title: 'Product Information', section: 'Product Information', desc: 'Categories, brands, samples', icon: Package, verify: 'Catalog Review' },
  { id: 10, title: 'Agreements', section: 'Agreements', desc: 'Seller policy & commission acceptance', icon: FileCheck, verify: 'Seller Acceptance' },
  { id: 11, title: 'Final Verification', section: 'Final Verification', desc: 'Review all submitted information', icon: ShieldCheck, verify: 'Admin Approval' },
  { id: 12, title: 'Verified Seller', section: 'Verified Seller', desc: 'Verification badge activated', icon: CheckCircle2, verify: 'Approved & Active' }
];

export const INITIAL_FORM_STATE = {
  // Step 1: Basic Profile
  sellerName: 'Ritesh Yadav',
  sellerEmail: 'ritesh.seller@bookvardi.in',
  sellerPhone: '+91 98765 43210',
  profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  emailOtpVerified: true,
  phoneOtpVerified: true,

  // Step 2: Business Details
  legalBusinessName: 'Vardi Education Retail Pvt Ltd',
  tradeName: 'Book Vardi Student Emporium',
  businessType: 'Private Limited',
  yearStarted: '2021',
  annualTurnoverEstimate: '₹25L - ₹50L',

  // Step 3: Owner / Authorized Person
  ownerFullName: 'Ritesh Yadav',
  ownerDesignation: 'Director / Managing Partner',
  ownerPan: 'ABCDE1234F',
  ownerAadhaarLast4: '8942',
  kycVerified: true,

  // Step 4: Business Documents
  businessPan: 'ABCDE1234F',
  gstin: '07AAAAA0000A1Z5',
  hasGstExemption: false,
  msmeRegistrationNumber: 'UDYAM-DL-03-0029142',
  cinNumber: 'U74999DL2021PTC384192',

  // Step 5: Business Address
  addressLine1: 'Plot 42, Okhla Industrial Area, Phase-III',
  addressLine2: 'Near Crown Plaza Metro',
  city: 'New Delhi',
  state: 'Delhi',
  pincode: '110020',
  country: 'India',

  // Step 6: Address Proof
  addressProofType: 'Electricity Bill',
  addressProofDocNumber: 'EB-2026-98124',
  addressProofFileName: 'electricity_bill_okhla_feb2026.pdf',

  // Step 7: Bank Details
  bankAccountHolder: 'Vardi Education Retail Pvt Ltd',
  bankAccountNumber: '50200084920194',
  bankIfscCode: 'HDFC0000240',
  bankName: 'HDFC Bank Ltd',
  bankBranch: 'Okhla Phase-III, New Delhi',
  accountType: 'Current Account',

  // Step 8: Store Details
  storeName: 'Book Vardi Official Hub',
  storeSlug: 'book-vardi-official',
  storeTagline: 'Certified School Uniforms, Textbooks & STEM Academic Kits',
  storeDescription: 'Premier provider of school textbooks, uniform sets, drawing guides and geometry supplies with fast 24-48 hour campus delivery.',
  storeLogo: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80',

  // Step 9: Product Information
  selectedCategories: ['Uniforms & Schoolwear', 'NCERT & CBSE Textbooks', 'Notebooks & Paper Crafts', 'Writing Instruments'],
  primaryBrands: ['Classmate', 'Doms', 'Camlin', 'Oxford', 'Reynolds'],
  estimatedSkuCount: '250+ SKUs',
  sampleProductTitle: 'Class 10 CBSE Complete Science & Math Bundle',

  // Step 10: Agreements
  acceptedTerms: true,
  acceptedCommissionRate: true,
  acceptedReturnPolicy: true,
  authorizedSignatoryConfirmation: true,

  // Metadata
  applicationDate: new Date().toISOString(),
  currentStep: 1,
  highestStepReached: 1,
  submissionStatus: 'draft'
};

export default function SellerRegistrationModal({ isOpen, onClose, isPage = false }) {
  const { 
    sellerStatus, 
    setSellerStatus, 
    submitSellerApplication, 
    approveSellerApplication,
    showToast 
  } = useCart();

  const [step, setStep] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_reg_step');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      return saved ? JSON.parse(saved) : INITIAL_FORM_STATE;
    } catch {
      return INITIAL_FORM_STATE;
    }
  });

  const [otpSent, setOtpSent] = useState(false);
  const [mobileOtp, setMobileOtp] = useState('4829');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 3 PAN & Aadhaar Verification States
  const [isPanVerified, setIsPanVerified] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isPanVerified);
      }
    } catch {}
    return true; // Default true for initial seed state (ABCDE1234F), resets if edited
  });
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isAadhaarVerified);
      }
    } catch {}
    return true; // Default true for initial seed state (8942), resets if edited
  });
  const [isVerifyingPan, setIsVerifyingPan] = useState(false);
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);
  const [panError, setPanError] = useState('');
  const [aadhaarError, setAadhaarError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('bv_seller_reg_data', JSON.stringify({
        ...formData,
        isPanVerified,
        isAadhaarVerified
      }));
      localStorage.setItem('bv_seller_reg_step', step.toString());
    } catch (e) {
      console.error(e);
    }
  }, [formData, step, isPanVerified, isAadhaarVerified]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      highestStepReached: Math.max(prev.highestStepReached, step)
    }));

    // Invalidate verification when user alters PAN or Aadhaar
    if (field === 'ownerPan') {
      setIsPanVerified(false);
      setPanError('');
    }
    if (field === 'ownerAadhaarLast4') {
      setIsAadhaarVerified(false);
      setAadhaarError('');
    }
  };

  const handleVerifyPan = () => {
    const pan = (formData.ownerPan || '').trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!pan) {
      setPanError('Please enter a PAN card number');
      showToast('⚠️ Please enter a 10-digit PAN card number.');
      return;
    }

    if (!panRegex.test(pan)) {
      setPanError('Invalid PAN format. Example: ABCDE1234F');
      showToast('⚠️ Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).');
      return;
    }

    setPanError('');
    setIsVerifyingPan(true);

    setTimeout(() => {
      setIsVerifyingPan(false);
      setIsPanVerified(true);
      setFormData(prev => ({ ...prev, kycVerified: true }));
      showToast('✅ PAN Card verified successfully with NSDL / Income Tax records!');
    }, 700);
  };

  const handleVerifyAadhaar = () => {
    const aadhaar = (formData.ownerAadhaarLast4 || '').trim();
    // Allow either last 4 digits (4 digits) or full 12 digits
    const aadhaarRegex = /^(\d{4}|\d{12})$/;

    if (!aadhaar) {
      setAadhaarError('Please enter Aadhaar number (4 or 12 digits)');
      showToast('⚠️ Please enter Aadhaar number (last 4 digits or full 12 digits).');
      return;
    }

    if (!aadhaarRegex.test(aadhaar)) {
      setAadhaarError('Aadhaar must be either 4 digits or 12 digits');
      showToast('⚠️ Invalid Aadhaar number. Must contain 4 or 12 numeric digits.');
      return;
    }

    setAadhaarError('');
    setIsVerifyingAadhaar(true);

    setTimeout(() => {
      setIsVerifyingAadhaar(false);
      setIsAadhaarVerified(true);
      showToast('✅ Aadhaar Card verified successfully via DigiLocker / UIDAI OTP!');
    }, 700);
  };

  const nextStep = () => {
    // Strict enforcement for Step 3: PAN and Aadhaar must be verified
    if (step === 3) {
      if (!formData.ownerPan || !isPanVerified) {
        setPanError(!formData.ownerPan ? 'PAN card number is required' : 'Verification required before moving forward');
        showToast('⚠️ Please click "Verify PAN" and verify your PAN Card to move to the next step.');
        return;
      }
      if (!formData.ownerAadhaarLast4 || !isAadhaarVerified) {
        setAadhaarError(!formData.ownerAadhaarLast4 ? 'Aadhaar number is required' : 'Verification required before moving forward');
        showToast('⚠️ Please click "Verify Aadhaar" and verify your Aadhaar Card to move to the next step.');
        return;
      }
    }

    if (step < 12) {
      const newStep = step + 1;
      setStep(newStep);
      setFormData(prev => ({ ...prev, highestStepReached: Math.max(prev.highestStepReached, newStep) }));
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      submitSellerApplication({
        ...formData,
        status: 'Pending Approval',
        submittedAt: new Date().toLocaleDateString()
      });
      setIsSubmitting(false);
      setStep(11);
      showToast('🎉 Seller Registration Application Submitted! Pending Verification.');
    }, 900);
  };

  const handleSimulateApproval = () => {
    approveSellerApplication();
    setStep(12);
    setFormData(prev => ({
      ...prev,
      submissionStatus: 'approved'
    }));
    showToast('✅ Verified Seller Badge Activated! Access granted to Seller Hub.');
  };

  const progressPercentage = Math.round(((step - 1) / 11) * 100);

  const containerClasses = isPage
    ? "bg-white rounded-3xl w-full flex flex-col shadow-xl border border-gray-100 overflow-hidden"
    : "fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200";

  const cardClasses = isPage
    ? "w-full flex flex-col"
    : "bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto";

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        
        {/* Modal Top Banner */}
        <div className="bg-brand-teal text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow text-brand-teal-dark flex items-center justify-center font-black shadow-sm">
              <Store size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-base sm:text-lg text-white">
                  Seller Onboarding & KYC Registration
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-yellow text-brand-teal uppercase tracking-wider">
                  Step {step} of 12
                </span>
              </div>
              <p className="text-xs text-white/70">
                Complete your business verification to sell uniforms, textbooks & school supplies
              </p>
            </div>
          </div>

          {!isPage && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Registration Form"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Horizontal Progress Bar & Step Tracker */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 shrink-0">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-gray-700 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-teal-700" />
              <span>{ONBOARDING_STEPS[step - 1].section}</span>
            </span>
            <span className="text-gray-500 font-semibold text-[11px]">
              Verification: <strong className="text-teal-900">{ONBOARDING_STEPS[step - 1].verify}</strong> ({progressPercentage}% completed)
            </span>
          </div>
          
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-brand-yellow h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(8, progressPercentage)}%` }}
            />
          </div>

          {/* Step Bubbles Scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 pb-1">
            {ONBOARDING_STEPS.map((s) => {
              const isPast = step > s.id;
              const isCurrent = step === s.id;
              const isReached = formData.highestStepReached >= s.id || isPast;

              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (isReached || isPast || s.id <= step + 1) {
                      setStep(s.id);
                    }
                  }}
                  disabled={!isReached && s.id > step + 1}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-brand-teal text-white shadow-xs'
                      : isPast
                      ? 'bg-emerald-100 text-emerald-800'
                      : isReached
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed'
                  }`}
                  title={`${s.id}. ${s.title}`}
                >
                  <span>{s.id}.</span>
                  <span className="whitespace-nowrap">{s.title}</span>
                  {isPast && <CheckCircle2 size={11} className="text-emerald-700" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Step Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs text-gray-700">
          
          {/* STEP 1: Basic Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <UserCheck className="text-teal-700" size={18} /> Step 1: Basic Profile & Contact Information
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Verify your primary contact details via secure one-time passcode.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Seller Full Name *</label>
                  <input
                    type="text"
                    value={formData.sellerName}
                    onChange={(e) => handleChange('sellerName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. Ritesh Yadav"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Mobile Number (With WhatsApp) *</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={formData.sellerPhone}
                      onChange={(e) => handleChange('sellerPhone', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                      placeholder="+91 98765 43210"
                    />
                    <button
                      type="button"
                      onClick={() => setOtpSent(true)}
                      className="px-3 py-2 bg-teal-50 text-teal-800 rounded-xl font-bold hover:bg-teal-100 whitespace-nowrap cursor-pointer border border-teal-200"
                    >
                      {otpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Official Seller Email ID *</label>
                  <input
                    type="email"
                    value={formData.sellerEmail}
                    onChange={(e) => handleChange('sellerEmail', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="name@business.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">OTP Code Verification (Auto-Filled)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={mobileOtp}
                      onChange={(e) => setMobileOtp(e.target.value)}
                      className="w-32 px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono tracking-widest text-center"
                    />
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-2 rounded-xl border border-emerald-200">
                      <CheckCircle2 size={13} /> Mobile & Email OTP Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl flex items-center gap-3">
                <img
                  src={formData.profilePhoto}
                  alt="Profile Preview"
                  className="w-12 h-12 rounded-full object-cover border-2 border-brand-yellow"
                />
                <div>
                  <span className="font-bold text-teal-950 block">Profile Avatar Uploaded</span>
                  <span className="text-[11px] text-teal-700">Will be shown on your vendor store bio and seller receipts.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Business Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Building2 className="text-teal-700" size={18} /> Step 2: Legal Business Details
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Enter registered enterprise particulars for administrative and tax validation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Legal Registered Business Name *</label>
                  <input
                    type="text"
                    value={formData.legalBusinessName}
                    onChange={(e) => handleChange('legalBusinessName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. Vardi Education Retail Pvt Ltd"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Trade Name / Doing Business As (DBA) *</label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => handleChange('tradeName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. Book Vardi Student Hub"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Business Constitution Type *</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => handleChange('businessType', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
                  >
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership Firm">Partnership Firm</option>
                    <option value="Private Limited">Private Limited (Pvt Ltd)</option>
                    <option value="Limited Liability Partnership">LLP (Limited Liability Partnership)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Year Started / Incorporated *</label>
                  <input
                    type="number"
                    value={formData.yearStarted}
                    onChange={(e) => handleChange('yearStarted', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="2021"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Owner / Authorized Person */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <UserCheck className="text-teal-700" size={18} /> Step 3: Owner & Key Management Personnel (KYC)
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Provide primary signatory identification. <span className="text-brand-teal font-semibold">Government verification of PAN and Aadhaar is required to continue.</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 text-xs">Owner / Authorized Representative Name *</label>
                  <input
                    type="text"
                    value={formData.ownerFullName}
                    onChange={(e) => handleChange('ownerFullName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 text-xs">Designation / Role *</label>
                  <input
                    type="text"
                    value={formData.ownerDesignation}
                    onChange={(e) => handleChange('ownerDesignation', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                  />
                </div>

                {/* Individual PAN Card with Verify Button */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 text-xs">Individual PAN Card Number *</label>
                    {isPanVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Verification Required
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.ownerPan}
                      onChange={(e) => handleChange('ownerPan', e.target.value.toUpperCase())}
                      className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono uppercase outline-hidden ${
                        isPanVerified 
                          ? 'border-emerald-300 bg-emerald-50/30 text-emerald-950 focus:ring-2 focus:ring-emerald-400' 
                          : panError 
                            ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-400'
                            : 'border-gray-200 focus:ring-2 focus:ring-brand-yellow'
                      }`}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPan}
                      disabled={isVerifyingPan || isPanVerified}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        isPanVerified
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 cursor-default'
                          : isVerifyingPan
                            ? 'bg-gray-200 text-gray-500 cursor-wait'
                            : 'bg-brand-teal text-white hover:bg-brand-teal-light shadow-xs active:scale-95'
                      }`}
                    >
                      {isVerifyingPan ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : isPanVerified ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-700" />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={13} />
                          <span>Verify PAN</span>
                        </>
                      )}
                    </button>
                  </div>
                  {panError && (
                    <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 pt-0.5">
                      <AlertCircle size={12} /> {panError}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-500">10-character alphanumeric PAN issued by Income Tax Dept.</p>
                </div>

                {/* Aadhaar Card with Verify Button */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 text-xs">Aadhaar Card (12 or Last 4 Digits) *</label>
                    {isAadhaarVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Verification Required
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.ownerAadhaarLast4}
                      onChange={(e) => handleChange('ownerAadhaarLast4', e.target.value.replace(/\D/g, ''))}
                      className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-hidden ${
                        isAadhaarVerified 
                          ? 'border-emerald-300 bg-emerald-50/30 text-emerald-950 focus:ring-2 focus:ring-emerald-400' 
                          : aadhaarError 
                            ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-400'
                            : 'border-gray-200 focus:ring-2 focus:ring-brand-yellow'
                      }`}
                      placeholder="e.g. 8942 or 12-digit number"
                      maxLength={12}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAadhaar}
                      disabled={isVerifyingAadhaar || isAadhaarVerified}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        isAadhaarVerified
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 cursor-default'
                          : isVerifyingAadhaar
                            ? 'bg-gray-200 text-gray-500 cursor-wait'
                            : 'bg-brand-teal text-white hover:bg-brand-teal-light shadow-xs active:scale-95'
                      }`}
                    >
                      {isVerifyingAadhaar ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : isAadhaarVerified ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-700" />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={13} />
                          <span>Verify Aadhaar</span>
                        </>
                      )}
                    </button>
                  </div>
                  {aadhaarError && (
                    <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 pt-0.5">
                      <AlertCircle size={12} /> {aadhaarError}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-500">Enter your 12-digit Aadhaar number or last 4 digits for instant verification.</p>
                </div>
              </div>

              {/* Status summary banner */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                isPanVerified && isAadhaarVerified
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {isPanVerified && isAadhaarVerified ? (
                      <>
                        <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                        <span>Instant DigiLocker & NSDL Verification Complete</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={17} className="text-amber-600 shrink-0" />
                        <span>KYC Verification Pending: Please verify both PAN and Aadhaar above to continue</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-semibold ${isPanVerified ? 'bg-emerald-200/80 text-emerald-800' : 'bg-amber-200/80 text-amber-800'}`}>
                      PAN: {isPanVerified ? 'Verified ✓' : 'Unverified'}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-semibold ${isAadhaarVerified ? 'bg-emerald-200/80 text-emerald-800' : 'bg-amber-200/80 text-amber-800'}`}>
                      Aadhaar: {isAadhaarVerified ? 'Verified ✓' : 'Unverified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Business Documents */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <FileText className="text-teal-700" size={18} /> Step 4: Enterprise Tax & Business Documents
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  GSTIN and Business Registration Certificate for tax compliance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Entity PAN Number *</label>
                  <input
                    type="text"
                    value={formData.businessPan}
                    onChange={(e) => handleChange('businessPan', e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Goods & Service Tax Number (GSTIN) *</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">MSME Udyam Registration (Optional)</label>
                  <input
                    type="text"
                    value={formData.msmeRegistrationNumber}
                    onChange={(e) => handleChange('msmeRegistrationNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">CIN (For Corporate Entities)</label>
                  <input
                    type="text"
                    value={formData.cinNumber}
                    onChange={(e) => handleChange('cinNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Business Address */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <MapPin className="text-teal-700" size={18} /> Step 5: Registered Office & Dispatch Hub Address
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Pickup address where courier partners will collect orders.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Address Line 1 (Building / Floor / Street) *</label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => handleChange('addressLine1', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">City / District *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">State *</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">PIN Code *</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleChange('pincode', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Address Proof */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <FileCheck className="text-teal-700" size={18} /> Step 6: Premises & Address Proof Document
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Valid utility bill, rent agreement or municipal tax receipt for registered location.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Proof Document Type *</label>
                  <select
                    value={formData.addressProofType}
                    onChange={(e) => handleChange('addressProofType', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-white"
                  >
                    <option value="Electricity Bill">Electricity Bill (Past 3 months)</option>
                    <option value="Rent / Lease Agreement">Registered Rent / Lease Agreement</option>
                    <option value="Property Tax Receipt">Property Tax Receipt / Ownership Deed</option>
                    <option value="Telephone / Broadband Bill">Telephone / Broadband Bill</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Document Identifier / CA Number *</label>
                  <input
                    type="text"
                    value={formData.addressProofDocNumber}
                    onChange={(e) => handleChange('addressProofDocNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="border-2 border-dashed border-teal-300 rounded-2xl p-6 text-center bg-teal-50/40">
                <UploadCloud size={32} className="mx-auto text-teal-700 mb-2" />
                <p className="font-bold text-gray-800">Uploaded File: {formData.addressProofFileName}</p>
                <p className="text-[11px] text-gray-500 mt-1">PDF format (2.4 MB) • Encrypted for reviewer validation</p>
              </div>
            </div>
          )}

          {/* STEP 7: Bank Details */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <CreditCard className="text-teal-700" size={18} /> Step 7: Settlement Bank Account & IFSC
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Marketplace payout settlements are deposited directly into this account weekly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Account Beneficiary Name *</label>
                  <input
                    type="text"
                    value={formData.bankAccountHolder}
                    onChange={(e) => handleChange('bankAccountHolder', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Account Number *</label>
                  <input
                    type="password"
                    value={formData.bankAccountNumber}
                    onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">IFSC Code *</label>
                  <input
                    type="text"
                    value={formData.bankIfscCode}
                    onChange={(e) => handleChange('bankIfscCode', e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Bank Name & Branch *</label>
                  <input
                    type="text"
                    value={`${formData.bankName} (${formData.bankBranch})`}
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 size={16} /> Penny Drop Verification Successful: Beneficiary name matches legal entity.
              </div>
            </div>
          )}

          {/* STEP 8: Store Details */}
          {step === 8 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Store className="text-teal-700" size={18} /> Step 8: Marketplace Storefront & Branding
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  How your storefront appears to parents, students and partner schools.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Public Store Name *</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => handleChange('storeName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Store Handle / URL slug</label>
                  <div className="flex items-center px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 font-mono text-[11px] text-gray-500">
                    <span>bookvardi.in/seller/</span>
                    <strong className="text-teal-900">{formData.storeSlug}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Storefront Bio / Description *</label>
                <textarea
                  rows={3}
                  value={formData.storeDescription}
                  onChange={(e) => handleChange('storeDescription', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 9: Product Information */}
          {step === 9 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Package className="text-teal-700" size={18} /> Step 9: Product Catalog & Brand Categories
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Specify what items you plan to list on Book Vardi for category catalog review.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-gray-700">Selected Product Verticals</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Uniforms & Schoolwear', 'NCERT & CBSE Textbooks', 'Notebooks & Paper Crafts', 'Writing Instruments', 'School Bags & Backpacks', 'Drawing & Craft Kits', 'Shoes & Socks', 'Water Bottles & Lunchboxes'].map(cat => (
                    <label key={cat} className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={formData.selectedCategories.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleChange('selectedCategories', [...formData.selectedCategories, cat]);
                          } else {
                            handleChange('selectedCategories', formData.selectedCategories.filter(c => c !== cat));
                          }
                        }}
                        className="rounded text-brand-teal focus:ring-brand-yellow"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Authorized Brands (Comma Separated)</label>
                  <input
                    type="text"
                    value={formData.primaryBrands.join(', ')}
                    onChange={(e) => handleChange('primaryBrands', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Catalog Scale Estimate</label>
                  <input
                    type="text"
                    value={formData.estimatedSkuCount}
                    onChange={(e) => handleChange('estimatedSkuCount', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: Agreements */}
          {step === 10 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <FileCheck className="text-teal-700" size={18} /> Step 10: Merchant Agreement & Commission Policy
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Review terms of service, returns policy, and marketplace fulfillment standards.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptedTerms}
                    onChange={(e) => handleChange('acceptedTerms', e.target.checked)}
                    className="mt-0.5 rounded text-brand-teal focus:ring-brand-yellow"
                  />
                  <span>
                    <strong>Master Merchant Service Agreement:</strong> I accept Book Vardi terms of merchant engagement, intellectual property safeguards, and student delivery SLAs.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptedCommissionRate}
                    onChange={(e) => handleChange('acceptedCommissionRate', e.target.checked)}
                    className="mt-0.5 rounded text-brand-teal focus:ring-brand-yellow"
                  />
                  <span>
                    <strong>Commission Schedule:</strong> Standard platform take rate of 10% - 14% on delivered school supplies with zero listing fee.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptedReturnPolicy}
                    onChange={(e) => handleChange('acceptedReturnPolicy', e.target.checked)}
                    className="mt-0.5 rounded text-brand-teal focus:ring-brand-yellow"
                  />
                  <span>
                    <strong>30-Day Student Exchange Assurance:</strong> Agree to accept exchanges for uniform size mismatches or verified textbook defects.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 11: Final Verification */}
          {step === 11 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="text-teal-700" size={18} /> Step 11: Final Application Review & Admin Verification
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Your submitted documentation is being processed by the platform verification desk.
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 text-sm">Status: Application In Review</span>
                  <span className="px-3 py-1 bg-amber-200 text-amber-900 rounded-full font-extrabold text-[10px] uppercase">
                    Pending Admin Approval
                  </span>
                </div>
                <p className="text-amber-800 leading-relaxed text-xs">
                  All 10 sections have been submitted. Our compliance desk usually reviews GSTIN, Address Proof, and Bank IFSC within 24 hours.
                </p>

                <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-amber-900 font-medium">
                    Want to test the verified seller experience right away?
                  </span>
                  <button
                    type="button"
                    onClick={handleSimulateApproval}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={14} /> One-Click Approve Application (Demo)
                  </button>
                </div>
              </div>

              {/* Review Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Store & Legal Name</span>
                  <span className="font-bold text-gray-900">{formData.storeName}</span> ({formData.legalBusinessName})
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">GSTIN & PAN</span>
                  <span className="font-mono font-bold text-gray-900">{formData.gstin}</span> • {formData.businessPan}
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Dispatch Location</span>
                  <span className="font-semibold text-gray-900">{formData.city}, {formData.state} - {formData.pincode}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Settlement Account</span>
                  <span className="font-semibold text-gray-900">{formData.bankName} (IFSC: {formData.bankIfscCode})</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: Verified Seller */}
          {step === 12 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-18 h-18 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={42} />
              </div>

              <div>
                <h3 className="font-display font-black text-2xl text-gray-900">
                  Congratulations! Verified Seller Status Activated ✅
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mt-1 max-w-md mx-auto">
                  Your merchant entity <strong className="text-teal-900">{formData.storeName}</strong> is verified and authorized.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-xs">
                <ShieldCheck size={16} /> Partner Seller Badge Live on Storefront
              </div>

              <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    window.open('http://localhost:5174', '_blank');
                    onClose();
                  }}
                  className="px-6 py-3 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold rounded-xl shadow-md text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Store size={18} className="text-brand-yellow" />
                  <span>Launch Seller Dashboard (Hub)</span>
                  <ExternalLink size={14} />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs sm:text-sm cursor-pointer"
                >
                  Return to Storefront
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              step === 1 ? 'text-gray-400 opacity-50 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowLeft size={14} /> Previous
          </button>

          <div className="flex items-center gap-2">
            {step < 10 && (
              <button
                type="button"
                onClick={nextStep}
                title={step === 3 && (!isPanVerified || !isAadhaarVerified) ? "Verify both PAN and Aadhaar before continuing" : "Proceed to next step"}
                className={`px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all ${
                  step === 3 && (!isPanVerified || !isAadhaarVerified)
                    ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                    : 'bg-brand-teal hover:bg-brand-teal-light text-white'
                }`}
              >
                <span>{step === 3 && (!isPanVerified || !isAadhaarVerified) ? 'Verify to Continue' : 'Continue'}</span>
                <ArrowRight size={14} />
              </button>
            )}

            {step === 10 && (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit 10-Step Application</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}

            {step === 11 && (
              <button
                type="button"
                onClick={handleSimulateApproval}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Activate Verification Badge</span>
                <CheckCircle2 size={14} />
              </button>
            )}

            {step === 12 && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-brand-teal text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
