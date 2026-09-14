import React, { useState } from 'react';
import {
  Store,
  UserCheck,
  Building2,
  FileText,
  MapPin,
  FileCheck,
  CreditCard,
  Package,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ONBOARDING_STEPS } from './SellerRegistrationModal';

export default function SellerApplicationReviewCard({ applicationData, onEditStep, onOpenSellerDashboard }) {
  const [expandedSections, setExpandedSections] = useState({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
    10: true,
    11: true,
    12: true
  });

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const collapseAll = () => {
    const collapsed = {};
    ONBOARDING_STEPS.forEach(s => { collapsed[s.id] = false; });
    setExpandedSections(collapsed);
  };

  const expandAll = () => {
    const expanded = {};
    ONBOARDING_STEPS.forEach(s => { expanded[s.id] = true; });
    setExpandedSections(expanded);
  };

  const data = applicationData || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-brand-teal-dark via-brand-teal to-brand-teal-light rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-yellow text-brand-teal-dark uppercase tracking-wider">
              {data.submissionStatus === 'approved' ? 'Active Verified Seller' : 'Submitted Application'}
            </span>
            <span className="text-xs text-white/80 font-medium">
              12 of 12 Steps Profile
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
            {data.storeName || data.legalBusinessName || 'Seller KYC & Business Profile'}
          </h2>
          <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
            All details submitted across the 12 onboarding steps are permanently saved, synchronized, and verified for compliance and partner payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onOpenSellerDashboard && (
            <button
              onClick={onOpenSellerDashboard}
              className="px-4 py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Store size={15} />
              <span>Launch Seller Hub</span>
              <ExternalLink size={13} />
            </button>
          )}

          {onEditStep && (
            <button
              onClick={() => onEditStep(1)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-white/20"
            >
              <Edit3 size={14} />
              <span>Edit Steps</span>
            </button>
          )}
        </div>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="text-gray-500 font-semibold">
          Reviewing recorded records from all 12 registration steps
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-brand-teal hover:underline font-bold cursor-pointer"
          >
            Expand All
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* 12 Steps Accordion */}
      <div className="space-y-4">
        
        {/* STEP 1: Basic Profile */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection(1)}
            className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>Step 1: Basic Profile</span>
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </h3>
                <p className="text-[11px] text-gray-500">Seller contact information, photo & OTP verification</p>
              </div>
            </div>
            {expandedSections[1] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expandedSections[1] && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Seller Full Name</span>
                <span className="font-bold text-gray-800">{data.sellerName || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Primary Email</span>
                <span className="font-bold text-gray-800">{data.sellerEmail || 'N/A'}</span>
                <span className="ml-1 text-[10px] text-emerald-600 font-bold">✓ Verified</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Mobile Phone</span>
                <span className="font-bold text-gray-800">{data.sellerPhone || 'N/A'}</span>
                <span className="ml-1 text-[10px] text-emerald-600 font-bold">✓ OTP Verified</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Profile Photo</span>
                {data.profilePhoto ? (
                  <img src={data.profilePhoto} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-200 mt-1" />
                ) : (
                  <span className="text-gray-400 italic">None attached</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: Business Details */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection(2)}
            className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>Step 2: Business Details</span>
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </h3>
                <p className="text-[11px] text-gray-500">Legal entity registration, trade name, business type</p>
              </div>
            </div>
            {expandedSections[2] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expandedSections[2] && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Legal Business Name</span>
                <span className="font-bold text-gray-800">{data.legalBusinessName || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Trade / Brand Name</span>
                <span className="font-bold text-gray-800">{data.tradeName || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Business Entity Type</span>
                <span className="font-bold text-gray-800">{data.businessType || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Year Started & Turnover</span>
                <span className="font-bold text-gray-800">{data.yearStarted || 'N/A'} • {data.annualTurnoverEstimate || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>

        {/* STEP 3: Owner / Authorized Signatory */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection(3)}
            className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>Step 3: Owner / Authorized Person</span>
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </h3>
                <p className="text-[11px] text-gray-500">Signatory designation, PAN & identity verification</p>
              </div>
            </div>
            {expandedSections[3] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expandedSections[3] && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Signatory Full Name</span>
                <span className="font-bold text-gray-800">{data.ownerFullName || data.sellerName || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Designation</span>
                <span className="font-bold text-gray-800">{data.ownerDesignation || 'Director / Proprietor'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Personal PAN</span>
                <span className="font-bold text-gray-800 font-mono">{data.ownerPan || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Aadhaar Last 4</span>
                <span className="font-bold text-gray-800 font-mono">•••• •••• {data.ownerAadhaarLast4 || '8942'}</span>
              </div>
            </div>
          )}
        </div>

        {/* STEP 4: Business Documents */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection(4)}
            className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>Step 4: Business Documents</span>
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </h3>
                <p className="text-[11px] text-gray-500">Business PAN, GSTIN & MSME/CIN registration</p>
              </div>
            </div>
            {expandedSections[4] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expandedSections[4] && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Business PAN</span>
                <span className="font-bold text-gray-800 font-mono">{data.businessPan || data.ownerPan || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">GSTIN Number</span>
                <span className="font-bold text-gray-800 font-mono">{data.gstin || (data.hasGstExemption ? 'GST Exempted' : 'N/A')}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">MSME Udyam ID</span>
                <span className="font-bold text-gray-800 font-mono">{data.msmeRegistrationNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">CIN Registration</span>
                <span className="font-bold text-gray-800 font-mono">{data.cinNumber || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>

        {/* STEP 5: Business Address */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection(5)}
            className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                5
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>Step 5: Business Address</span>
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </h3>
                <p className="text-[11px] text-gray-500">Registered office and warehouse location</p>
              </div>
            </div>
            {expandedSections[5] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expandedSections[5] && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <span className="block text-gray-400 font-medium text-[11px]">Registered Address</span>
                <span className="font-bold text-gray-800">
                  {data.addressLine1} {data.addressLine2 ? `, ${data.addressLine2}` : ''}
                </span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">City, State & Pincode</span>
                <span className="font-bold text-gray-800">
                  {data.city || 'New Delhi'}, {data.state || 'Delhi'} - {data.pincode || '110020'} ({data.country || 'India'})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* STEP 6: Address Proof */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection(6)}
            className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                6
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>Step 6: Address Proof</span>
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </h3>
                <p className="text-[11px] text-gray-500">Utility bill, lease agreement or municipal document</p>
              </div>
            </div>
            {expandedSections[6] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expandedSections[6] && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Document Type</span>
                <span className="font-bold text-gray-800">{data.addressProofType || 'Electricity Bill'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Document Reference #</span>
                <span className="font-bold text-gray-800 font-mono">{data.addressProofDocNumber || 'EB-2026-98124'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Uploaded Document File</span>
                {data.addressProofDoc ? (
                  <div className="flex items-center gap-2 mt-1">
                    {data.addressProofDoc.startsWith('data:image/') || (data.addressProofFileName && data.addressProofFileName.match(/\.(png|jpe?g|webp)$/i)) ? (
                      <img src={data.addressProofDoc} alt="Document Preview" className="w-10 h-10 rounded-lg object-cover border border-gray-300" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200 shrink-0">
                        <FileCheck size={18} />
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-teal-950 text-xs block truncate max-w-[150px]">
                        {data.addressProofFileName || 'address_proof.pdf'}
                      </span>
                      <a
                        href={data.addressProofDoc}
                        target="_blank"
                        rel="noreferrer"
                        download={data.addressProofFileName || 'address_proof'}
                        className="text-[10px] text-brand-teal font-bold hover:underline"
                      >
                        View / Download ↗
                      </a>
                    </div>
                  </div>
                ) : (
                  <span className="font-semibold text-teal-800 flex items-center gap-1 mt-0.5">
                    <FileCheck size={14} />
                    <span>{data.addressProofFileName || 'Verified Document Attached'}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STEP 7: Bank Details */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection(7)}
            className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                7
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>Step 7: Bank Details</span>
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </h3>
                <p className="text-[11px] text-gray-500">Beneficiary bank account, IFSC & payout channel</p>
              </div>
            </div>
            {expandedSections[7] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expandedSections[7] && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Account Holder Name</span>
                <span className="font-bold text-gray-800">{data.bankAccountHolder || data.legalBusinessName || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Bank Name & Branch</span>
                <span className="font-bold text-gray-800">{data.bankName || 'HDFC Bank Ltd'} ({data.bankBranch || 'Okhla'})</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Account Number</span>
                <span className="font-bold text-gray-800 font-mono">{data.bankAccountNumber || '••••••••••9194'}</span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">IFSC Code & Type</span>
                <span className="font-bold text-gray-800 font-mono">{data.bankIfscCode || 'HDFC0000240'} ({data.accountType || 'Current'})</span>
              </div>
            </div>
          )}
        </div>

        {/* STEP 8: Store Details */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection(8)}
            className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                8
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>Step 8: Store Details</span>
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </h3>
                <p className="text-[11px] text-gray-500">Public store name, handle, description & branding</p>
              </div>
            </div>
            {expandedSections[8] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expandedSections[8] && (
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Public Store Name</span>
                  <span className="font-bold text-gray-800 text-sm">{data.storeName || 'Book Vardi Official Hub'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Store Handle / Slug</span>
                  <span className="font-bold text-teal-800 font-mono">bookvardi.in/store/{data.storeSlug || 'book-vardi-official'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Store Tagline</span>
                  <span className="font-semibold text-gray-700">{data.storeTagline || 'Certified School Uniforms & Kits'}</span>
                </div>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Store Bio & Description</span>
                <p className="text-gray-700 leading-relaxed mt-1">
                  {data.storeDescription || 'Premier provider of school textbooks, uniform sets, drawing guides and geometry supplies with fast campus delivery.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* STEP 9: Product Information */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection(9)}
            className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                9
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>Step 9: Product Information</span>
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </h3>
                <p className="text-[11px] text-gray-500">Categories, authorized brands, catalog volume</p>
              </div>
            </div>
            {expandedSections[9] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expandedSections[9] && (
            <div className="p-5 space-y-3 text-xs">
              <div>
                <span className="block text-gray-400 font-medium text-[11px] mb-1.5">Registered Categories</span>
                <div className="flex flex-wrap gap-1.5">
                  {(data.selectedCategories || ['Uniforms & Schoolwear', 'NCERT & CBSE Textbooks', 'Notebooks & Paper Crafts']).map((cat, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-teal-50 text-teal-900 rounded-lg font-semibold text-[11px] border border-teal-200/60">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Primary Brands Represented</span>
                  <span className="font-bold text-gray-800">
                    {Array.isArray(data.primaryBrands) ? data.primaryBrands.join(', ') : 'Classmate, Doms, Camlin, Oxford'}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Estimated Catalog Volume</span>
                  <span className="font-bold text-gray-800">{data.estimatedSkuCount || '250+ SKUs'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 10: Agreements & Policies */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection(10)}
            className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                10
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>Step 10: Agreements & Policies</span>
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </h3>
                <p className="text-[11px] text-gray-500">Seller code of conduct, commission terms & return SLA</p>
              </div>
            </div>
            {expandedSections[10] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expandedSections[10] && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 font-medium">
                <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                <span>BookVardi Master Seller Terms Accepted</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 font-medium">
                <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                <span>Marketplace Commission Schedule Accepted</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 font-medium">
                <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                <span>7-Day Return & Student Exchange SLA Acknowledged</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 font-medium">
                <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                <span>Authorized Signatory Digital Affirmation Validated</span>
              </div>
            </div>
          )}
        </div>

        {/* STEP 11: Final Verification & Audit */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection(11)}
            className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                11
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>Step 11: Final Verification & Submission</span>
                  <CheckCircle2 size={15} className="text-emerald-600" />
                </h3>
                <p className="text-[11px] text-gray-500">Automated KYC, AML & Admin cross-verification timestamp</p>
              </div>
            </div>
            {expandedSections[11] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expandedSections[11] && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Application Status</span>
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                  {data.status || 'Approved & Verified'}
                </span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Application Submission Date</span>
                <span className="font-bold text-gray-800">
                  {data.submittedAt || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="block text-gray-400 font-medium text-[11px]">Audit Reference ID</span>
                <span className="font-mono font-bold text-teal-900">
                  BV-KYC-{Math.abs(data.sellerPhone?.replace(/\D/g, '') || 9876543210).toString().slice(-6)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* STEP 12: Verified Seller Badge & Permissions */}
        <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection(12)}
            className="w-full px-5 py-3.5 bg-emerald-50/50 hover:bg-emerald-50 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-emerald-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                12
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>Step 12: Verified Seller Badge & Activation</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                    ACTIVE
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500">Live storefront privileges, inventory syndication & checkout visibility</p>
              </div>
            </div>
            {expandedSections[12] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {expandedSections[12] && (
            <div className="p-5 space-y-3 text-xs bg-linear-to-b from-emerald-50/30 to-white">
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Verified BookVardi Merchant Trust Active</h4>
                  <p className="text-gray-600 text-[11px] mt-0.5">
                    Your products are marked with the trusted blue & gold verified badge across student search results, school directories, and parent checkout carts.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="block text-gray-400 text-[10px] uppercase font-bold">Port 5174 Hub</span>
                  <span className="font-bold text-teal-900">Direct Single Sign-On</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="block text-gray-400 text-[10px] uppercase font-bold">Listing Cap</span>
                  <span className="font-bold text-teal-900">Unlimited SKUs & Kits</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="block text-gray-400 text-[10px] uppercase font-bold">Disbursement</span>
                  <span className="font-bold text-teal-900">T+2 Daily Bank Settlement</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}