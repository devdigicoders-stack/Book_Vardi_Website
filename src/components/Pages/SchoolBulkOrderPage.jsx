import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { compressImageToWebP } from '../../utils/imageCompressor';
import { backendEnabled, submitSchoolBulkOrderInBackend } from '../../utils/api';
import { useCart } from '../../context/CartContext';

export default function SchoolBulkOrderPage({ onNavigate }) {
  const { showToast } = useCart();

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

  // Requirement Demands List (dynamic array)
  const [requirements, setRequirements] = useState([
    {
      id: Date.now(),
      category: 'Custom School Uniforms',
      itemName: '',
      quantity: 100,
      sampleImage: '',
      notes: ''
    }
  ]);

  const [logoEmbroideryRequired, setLogoEmbroideryRequired] = useState(true);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [targetBudgetPerKit, setTargetBudgetPerKit] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReferenceId, setSubmittedReferenceId] = useState(null);

  // Dynamic Requirements handlers
  const handleAddRequirement = () => {
    setRequirements((prev) => [
      ...prev,
      {
        id: Date.now(),
        category: 'Custom School Uniforms',
        itemName: '',
        quantity: 100,
        sampleImage: '',
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

  const handleSampleImageUpload = async (id, file) => {
    if (!file) return;
    try {
      const compressed = await compressImageToWebP(file, 1024, 1024, 0.85);
      handleRequirementChange(id, 'sampleImage', compressed.dataUrl);
      showToast('📸 Sample image compressed & attached successfully!');
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleRequirementChange(id, 'sampleImage', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!institutionName.trim() || !contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      showToast('⚠️ Please fill out all required institution and administrator fields.');
      return;
    }

    if (!city.trim() || !state.trim() || !pincode.trim()) {
      showToast('⚠️ Please fill out complete location details (City, State, Pincode).');
      return;
    }

    const invalidItem = requirements.find((r) => !r.itemName.trim());
    if (invalidItem) {
      showToast('⚠️ Please provide a name/title for each requirement demand item.');
      return;
    }

    setIsSubmitting(true);

    const refId = `BULK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalQty = requirements.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

    const payload = {
      referenceId: refId,
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
      targetDeliveryDate,
      logoEmbroideryRequired,
      targetBudgetPerKit: targetBudgetPerKit.trim(),
      additionalNotes: additionalNotes.trim()
    };

    if (backendEnabled) {
      try {
        await submitSchoolBulkOrderInBackend(payload);
      } catch (err) {
        console.warn('Backend bulk order submission error:', err?.message);
      }
    }

    setIsSubmitting(false);
    setSubmittedReferenceId(refId);
    showToast(`🎉 Bulk Order Inquiry ${refId} submitted successfully!`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                Institutional Request Registered
              </span>
              <h2 className="font-display text-3xl font-extrabold text-gray-900 mt-3">
                Thank You, {contactName}!
              </h2>
              <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">
                Your bulk enquiry for <strong>{institutionName}</strong> has been received by the BookVardi Institutional Sales Team.
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
                <span className="text-gray-500 font-medium">Location:</span>
                <span className="font-bold text-gray-800">{city}, {state}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-start gap-2.5 text-xs">
                <Clock size={18} className="text-brand-teal shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900">24-Hour Callback</strong>
                  <span className="text-gray-500 text-[11px]">Dedicated relationship manager will call you.</span>
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
                  setRequirements([
                    {
                      id: Date.now(),
                      category: 'Custom School Uniforms',
                      itemName: '',
                      quantity: 100,
                      sampleImage: '',
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
              Student-wise Bag Packaging
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles size={14} className="text-brand-yellow shrink-0" />
              Sample Kit Verification
            </span>
          </div>
        </div>
      </div>

      {/* Main Bulk Order Form */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
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
                  <option value="K-12 School">K-12 School (CBSE / ICSE / State Board)</option>
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
                <p className="text-xs text-gray-500">Person authorized for procurement decisions.</p>
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

          {/* SECTION 3: LOCATION & DELIVERY DETAILS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-200">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="font-display text-base font-extrabold text-gray-900">
                  3. Delivery & Campus Location Details
                </h2>
                <p className="text-xs text-gray-500">Address where sample kits or bulk shipments will be dispatched.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Campus Address / Landmark
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Sector 49, Rosewood City Road"
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
                  placeholder="e.g. Gurugram"
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
                  key={reqItem.id}
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
                    <div className="sm:col-span-4">
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
                    <div className="sm:col-span-5">
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
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Quantity Demanded (Units)
                      </label>
                      <input
                        type="number"
                        min="10"
                        value={reqItem.quantity}
                        onChange={(e) => handleRequirementChange(reqItem.id, 'quantity', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-brand-teal focus:ring-2 focus:ring-brand-teal"
                      />
                    </div>
                  </div>

                  {/* Sample Image Upload & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1 items-start">
                    {/* Sample Upload */}
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Upload Sample Image / Design Preview (Optional)
                      </label>

                      {reqItem.sampleImage ? (
                        <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-brand-teal/40 shadow-2xs group/img">
                          <img src={reqItem.sampleImage} alt="Sample" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRequirementChange(reqItem.id, 'sampleImage', '')}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            title="Remove photo"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-gray-300 bg-white text-gray-600 hover:border-brand-teal hover:text-brand-teal text-xs transition-all cursor-pointer">
                          <Camera size={15} />
                          <span>Attach Sample Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSampleImageUpload(reqItem.id, e.target.files?.[0])}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Specific Notes */}
                    <div className="sm:col-span-7">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Specific Notes (Fabric, Color, Size Breakdown, etc.)
                      </label>
                      <input
                        type="text"
                        value={reqItem.notes}
                        onChange={(e) => handleRequirementChange(reqItem.id, 'notes', e.target.value)}
                        placeholder="e.g. 100% cotton, sizes 28 to 38, golden logo buttons"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-teal"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: CUSTOMIZATION, TARGET DATE & SUBMIT */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="font-display text-base font-extrabold text-gray-900">
                  5. Customization, Target Delivery & Final Submission
                </h2>
                <p className="text-xs text-gray-500">Provide target pricing or specific delivery deadlines.</p>
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
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Target Price per Student / Unit (Optional ₹)
                </label>
                <input
                  type="text"
                  value={targetBudgetPerKit}
                  onChange={(e) => setTargetBudgetPerKit(e.target.value)}
                  placeholder="e.g. ₹1,200 per student kit"
                  className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white"
                />
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
                placeholder="Mention any special tender terms, payment milestones, or sample dispatch instructions..."
                className="w-full bg-gray-50/70 border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-teal focus:bg-white"
              />
            </div>

            {/* Submission Action */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <ShieldCheck size={16} className="text-brand-teal shrink-0" />
                <span>Your request will be routed directly to BookVardi Institutional Sales Managers.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-sm px-8 py-3.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Send size={16} />
                <span>{isSubmitting ? 'Submitting Request...' : 'Submit Bulk Supply Request'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
