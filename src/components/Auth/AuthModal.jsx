import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  GraduationCap,
  Sparkles,
  LogIn,
  UserPlus,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Smartphone,
  Store,
  Edit2
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { sendOtpToBackend, verifyOtpWithBackend } from '../../utils/api';
import safeStorage from '../../utils/safeStorage';
const localStorage = safeStorage;
import SchoolSelect from '../Common/SchoolSelect';
import ClassSelect from '../Common/ClassSelect';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    login,
    register,
    updateProfile,
    showToast,
    USERS,
    isUserRegistered,
    switchUser
  } = useCart();

  // Login Form State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpTimer, setLoginOtpTimer] = useState(0);
  const canResendLoginOtp = loginOtpTimer === 0;
  const [showLoginOtp, setShowLoginOtp] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form State
  const [registerData, setRegisterData] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_user_reg_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      }
    } catch {}
    return {
      name: '',
      email: '',
      phone: '',
      institution: '',
      standard: '',
      studentId: '',
      password: ''
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('bv_user_reg_draft', JSON.stringify(registerData));
    } catch (e) {}
  }, [registerData]);
  const [registerStep, setRegisterStep] = useState('otp');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerOtp, setRegisterOtp] = useState('');
  const [registerOtpSent, setRegisterOtpSent] = useState(false);
  const [registerOtpTimer, setRegisterOtpTimer] = useState(0);
  const canResendRegisterOtp = registerOtpTimer === 0;
  const [generatedOtp, setGeneratedOtp] = useState('');
  // const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Forgot Password / OTP Flow State
  const [forgotMethod, setForgotMethod] = useState('email'); // 'email' | 'phone'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'otp' | 'new_password' | 'success'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(30);
  const canResendOtp = otpTimer === 0;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Helper to extract and format last 4 digits of phone
  const getMaskedPhone = (phoneStr) => {
    const digitsOnly = phoneStr.replace(/\D/g, '');
    const last4 = digitsOnly.length >= 4 ? digitsOnly.slice(-4) : digitsOnly.padStart(4, '0');
    return {
      masked: `+91 ••••• •${last4}`,
      last4: last4
    };
  };

  // Helper to extract and format last 4 characters of email username
  const getMaskedEmail = (emailStr) => {
    const parts = emailStr.split('@');
    const username = parts[0] || 'student';
    const domain = parts[1] || 'example.com';
    const last4 = username.length >= 4 ? username.slice(-4) : username;
    return {
      masked: `••••••••${last4}@${domain}`,
      last4: last4
    };
  };

  const currentMaskedTarget = forgotMethod === 'email'
    ? getMaskedEmail(forgotEmail)
    : getMaskedPhone(forgotPhone);

  // Reset forgot password sub-flow
  const resetForgotState = () => {
    setForgotStep('request');
    setOtpDigits(['', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setOtpTimer(30);
  };

  const resetLoginState = () => {
    setLoginPhone('');
    setLoginOtp('');
    setLoginOtpSent(false);
    setLoginOtpTimer(0);
    setShowLoginOtp(false);
    setGeneratedOtp('');
    setRememberMe(true);
  };

  const resetRegisterState = () => {
    setRegisterData({
      name: '',
      email: '',
      phone: '',
      institution: '',
      studentId: '',
      password: ''
    });
    setRegisterStep('otp');
    setRegisterOtp('');
    setRegisterOtpSent(false);
    setRegisterOtpTimer(0);
    setGeneratedOtp('');
    setShowRegisterPassword(false);
  };

  const resetAuthForms = () => {
    resetLoginState();
    resetRegisterState();
    resetForgotState();
    setAuthMode('login');
  };

  const handleCloseModal = () => {
    resetAuthForms();
    closeAuthModal();
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // OTP Countdown Timer
  useEffect(() => {
    if (authMode !== 'forgot' || forgotStep !== 'otp' || otpTimer <= 0) return;

    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [authMode, forgotStep, otpTimer]);

  useEffect(() => {
    if (!registerOtpSent || registerOtpTimer <= 0) return;

    const interval = setInterval(() => {
      setRegisterOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [registerOtpSent, registerOtpTimer]);

  useEffect(() => {
    if (!loginOtpSent || loginOtpTimer <= 0) return;

    const interval = setInterval(() => {
      setLoginOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [loginOtpSent, loginOtpTimer]);

  if (!isAuthModalOpen) return null;

  // ===== LOGIN HANDLER =====
  const handleSendLoginOtp = async () => {
    const rawDigits = loginPhone.replace(/\D/g, '');
    const phone = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
    if (!phone || phone.length !== 10) {
      showToast('⚠️ Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      let response = null;
      try {
        response = await sendOtpToBackend(phone, 'auth');
      } catch (err) {
        console.warn('Backend send OTP warning:', err);
      }

      setGeneratedOtp('');
      setLoginOtpSent(true);
      setLoginOtp('');
      setLoginOtpTimer(30);
      showToast(`📲 OTP sent to +91 ${phone}! Please enter the 4-digit code received on your mobile.`);
    } catch (error) {
      showToast(error.message || '⚠️ Unable to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLoginOtp = async () => {
    if (!canResendLoginOtp) return;
    await handleSendLoginOtp();
  };

  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const rawDigits = loginPhone.replace(/\D/g, '');
    const phone = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
    if (!phone || phone.length !== 10) {
      showToast('⚠️ Please enter a valid 10-digit phone number');
      return;
    }
    if (!loginOtpSent) {
      await handleSendLoginOtp();
      return;
    }
    if (!loginOtp.trim()) {
      showToast('⚠️ Please enter your OTP');
      return;
    }

    setIsLoading(true);
    try {
      const verificationResponse = await verifyOtpWithBackend(phone, loginOtp.trim());

      const verifiedUser = verificationResponse?.user;
      const isNewUser = Boolean(
        verificationResponse?.isNewUser ||
        (!verifiedUser && !isUserRegistered(phone))
      );

      // If user does not exist in DB: seamlessly move to Registration Details form!
      if (isNewUser) {
        showToast('📱 OTP verified! Please enter your details to complete registration 📝');
        setAuthMode('register');
        setRegisterStep('details');
        setRegisterOtpSent(true);
        setRegisterData((prev) => ({
          name: '',
          email: '',
          institution: '',
          standard: '',
          studentId: '',
          ...prev,
          phone
        }));
        return;
      }

      // Existing user: direct login!
      const success = await login({
        phone,
        otp: loginOtp.trim(),
        name: verifiedUser?.name || '',
        email: verifiedUser?.email || '',
        verifiedUser,
        token: verificationResponse?.token
      });

      if (success) {
        resetAuthForms();
        closeAuthModal();
      } else {
        showToast('Unable to complete login.');
      }
    } catch (error) {
      showToast(error.message || '⚠️ Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setLoginPhone('9876543210');
    setLoginOtp('3123');

    setTimeout(() => {
      setIsLoading(false);
      login({
        phone: '9876543210',
        name: 'Ritesh Yadav'
      });
    }, 400);
  };

  // ===== REGISTER HANDLER =====
  const handleSendRegisterOtp = async () => {
    const rawDigits = registerData.phone.replace(/\D/g, '');
    const phone = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
    if (!phone || phone.length !== 10) {
      showToast('⚠️ Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      let response = null;
      try {
        response = await sendOtpToBackend(phone, 'auth');
      } catch (err) {
        console.warn('Backend send OTP warning:', err);
      }

      setGeneratedOtp('');
      setRegisterStep('otp');
      setRegisterOtpSent(true);
      setRegisterOtp('');
      setRegisterOtpTimer(30);
      showToast(`📲 OTP sent to +91 ${phone}! Please enter the 4-digit code received on your mobile.`);
    } catch (error) {
      showToast(error.message || '⚠️ Unable to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendRegisterOtp = async () => {
    if (!canResendRegisterOtp) return;
    await handleSendRegisterOtp();
  };

  const finishRegistration = async (payload) => {
    try {
      if (updateProfile) {
        await updateProfile(payload);
      }
      resetAuthForms();
      closeAuthModal();
      showToast(`🎉 Profile saved! Welcome to BookVardi, ${payload.name || 'Student'}! ✨`);
    } catch (err) {
      resetAuthForms();
      closeAuthModal();
      showToast('🎉 Registration complete! Welcome to BookVardi! ✨');
    }
  };

  const handleRegisterSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const rawDigits = registerData.phone.replace(/\D/g, '');
    const phone = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

    if (!phone || phone.length !== 10) {
      showToast('⚠️ Please enter a valid 10-digit phone number');
      return;
    }

    if (!registerOtpSent) {
      await handleSendRegisterOtp();
      return;
    }

    if (registerStep !== 'details') {
      if (!registerOtp.trim()) {
        showToast('⚠️ Please enter the OTP sent to your phone');
        return;
      }

      setIsLoading(true);
      try {
        const verificationResponse = await verifyOtpWithBackend(phone, registerOtp.trim());

        // If user already exists in DB, log them in directly!
        if (verificationResponse?.user && !verificationResponse?.isNewUser) {
          const success = await login({
            phone,
            otp: registerOtp.trim(),
            name: verificationResponse.user.name,
            email: verificationResponse.user.email,
            verifiedUser: verificationResponse.user,
            token: verificationResponse.token
          });
          if (success) {
            resetAuthForms();
            closeAuthModal();
            return;
          }
        }

        // Otherwise advance to details form
        setRegisterStep('details');
        showToast('✓ Phone verified! Please enter your details 📝');
      } catch (error) {
        showToast(error.message || '⚠️ Invalid OTP. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Details step submission
    const name = String(registerData?.name || '').trim();
    if (!name) {
      showToast('⚠️ Please enter your full name');
      return;
    }

    setIsLoading(true);
    try {
      const email = String(registerData?.email || '').trim();
      const institution = String(registerData?.institution || '').trim();
      const standard = String(registerData?.standard || '').trim();
      const studentId = String(registerData?.studentId || '').trim();

      const backendPayload = {
        name,
        email: email || `student${phone.slice(-4)}@bookvardi.app`,
        phone,
        password: 'BookVardi@123',
        institution: institution || 'School / College',
        standard: standard || 'Nursery',
        studentId: studentId || `SC-${Math.floor(1000 + Math.random() * 9000)}`
      };

      await register(backendPayload);
      resetAuthForms();
      closeAuthModal();
    } catch (error) {
      showToast(error.message || '⚠️ Error saving profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSkipDetails = async () => {
    setIsLoading(true);
    try {
      const rawDigits = registerData.phone.replace(/\D/g, '');
      const phone = rawDigits.length >= 10 ? rawDigits.slice(-10) : (loginPhone.replace(/\D/g, '').slice(-10) || '9999999999');
      const backendPayload = {
        name: `Student ${phone.slice(-4)}`,
        email: `student${phone.slice(-4)}@bookvardi.app`,
        phone,
        password: 'BookVardi@123',
        institution: 'School / College',
        standard: 'Nursery',
        studentId: `SC-${Math.floor(1000 + Math.random() * 9000)}`
      };
      await register(backendPayload);
      resetAuthForms();
      closeAuthModal();
      showToast('🎉 Welcome to BookVardi! You can update your profile details anytime in My Account. ✨');
    } catch (e) {
      resetAuthForms();
      closeAuthModal();
    } finally {
      setIsLoading(false);
    }
  };

  // ===== OTP FLOW HANDLERS =====
  const handleSendOtp = (e) => {
    e?.preventDefault();
    if (forgotMethod === 'email') {
      const email = forgotEmail.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('⚠️ Please enter a valid email address');
        return;
      }
    } else {
      const digitsOnly = forgotPhone.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        showToast('⚠️ Please enter a valid 10-digit mobile number');
        return;
      }
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setForgotStep('otp');
      setOtpDigits(['', '', '', '']);
      setOtpTimer(30);
      const targetDisplay = forgotMethod === 'email' ? getMaskedEmail(forgotEmail) : getMaskedPhone(forgotPhone);
      showToast(`📲 OTP sent to ${targetDisplay.masked}`);
    }, 450);
  };

  const handleResendOtp = () => {
    if (!canResendOtp) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpTimer(30);
      setOtpDigits(['', '', '', '']);
      const targetDisplay = forgotMethod === 'email' ? getMaskedEmail(forgotEmail) : getMaskedPhone(forgotPhone);
      showToast(`📩 New OTP sent to ${targetDisplay.masked}`);
    }, 350);
  };

  const handleOtpDigitChange = (index, value) => {
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = char;
    setOtpDigits(newOtp);

    if (char && index < 3) {
      otpInputRefs[index + 1]?.current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1]?.current?.focus();
    }
  };

  const handlePasteOtp = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 4);
    if (/^\d{1,4}$/.test(pastedData)) {
      const newOtp = ['', '', '', ''];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtpDigits(newOtp);
      const nextIndex = Math.min(pastedData.length, 3);
      otpInputRefs[nextIndex]?.current?.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e?.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 4) {
      showToast('⚠️ Please enter the complete 4-digit verification code');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setForgotStep('new_password');
      showToast('✓ Identity verified! Please enter your new password.');
    }, 400);
  };

  const handleResetPasswordSubmit = (e) => {
    e?.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('⚠️ New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('⚠️ Passwords do not match');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setForgotStep('success');
      showToast('🎉 Password reset successfully!');

      setTimeout(() => {
        const email = forgotMethod === 'email' ? forgotEmail : 'ritesh.yadav@example.com';
        login({
          email: email,
          name: email.split('@')[0].replace('.', ' ') || 'Ritesh Yadav',
          phone: forgotMethod === 'phone' ? forgotPhone : '+91 98765 43210'
        });
        closeAuthModal();
        setAuthMode('login');
        resetForgotState();
      }, 1000);
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={handleCloseModal}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-brand-teal text-white p-6 relative overflow-hidden shrink-0">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-brand-yellow/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-brand-pink/20 rounded-full blur-xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>

          

          <h3 className="font-display text-2xl font-extrabold tracking-tight">
            {registerStep === 'details'
              ? 'Complete Profile'
              : authMode === 'forgot'
              ? 'Forgot Password?'
              : 'Welcome to BookVardi'}
          </h3>
          <p className="text-xs text-white/80 mt-1 leading-relaxed">
            {registerStep === 'details'
              ? 'Phone verified! Enter your details to create your student account.'
              : authMode === 'forgot'
              ? 'Verify your student account via OTP sent to your email or phone.'
              : loginOtpSent
              ? `Enter the 4-digit OTP sent to +91 ${loginPhone}`
              : 'Enter your mobile number to get instant OTP verification.'}
          </p>

          {/* Subheader status ribbon (only when on details or forgot) */}
          {registerStep === 'details' ? (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 bg-white/10 px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-300" />
                <span>Mobile Verified: +91 {registerData.phone || loginPhone}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setRegisterStep('otp');
                  setLoginOtpSent(false);
                }}
                className="text-xs font-bold text-white hover:text-brand-yellow flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Change Number</span>
              </button>
            </div>
          ) : authMode === 'forgot' ? (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  resetForgotState();
                }}
                className="text-xs font-bold text-white hover:text-brand-yellow flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-yellow bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                {forgotStep === 'request' && 'Step 1: Choose Target'}
                {forgotStep === 'otp' && 'Step 2: Enter OTP'}
                {forgotStep === 'new_password' && 'Step 3: New Password'}
                {forgotStep === 'success' && 'Step 4: Success'}
              </span>
            </div>
          ) : null}
        </div>

        {/* Form Body */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[calc(90vh-160px)] hide-scrollbar">
          {registerStep === 'details' ? (
            /* ===== COMPLETE PROFILE / REGISTRATION FORM ===== */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-3.5 border border-brand-teal/20 bg-brand-teal/5 rounded-2xl p-4">
                <div className="border-b border-brand-teal/10 pb-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-brand-teal flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    <span>Student Profile Details</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Please enter your details to complete your registration.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Full Name <span className="text-brand-pink">*</span>
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      placeholder="e.g. Ritesh Yadav"
                      required
                      autoFocus
                      className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      placeholder="name@school.edu"
                      className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    School / Institution
                  </label>
                  <SchoolSelect
                    value={registerData.institution}
                    onChange={(val) => setRegisterData({ ...registerData, institution: val })}
                    placeholder="Select or search school..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Class / Standard
                  </label>
                  <ClassSelect
                    value={registerData.standard}
                    onChange={(val) => setRegisterData({ ...registerData, standard: val })}
                    selectedSchoolName={registerData.institution}
                    placeholder="Select Class (Nursery to 12th)..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal-light active:scale-[0.99] disabled:opacity-75 text-white font-extrabold py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : authMode !== 'forgot' ? (
            /* ===== UNIFIED SINGLE PHONE & OTP FORM ===== */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {!loginOtpSent ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Mobile Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center gap-1 text-gray-500 font-bold text-xs sm:text-sm select-none pointer-events-none">
                      <Phone size={15} className="text-gray-400" />
                      <span>+91</span>
                      <span className="text-gray-300 ml-1">|</span>
                    </div>
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setLoginPhone(val);
                        setRegisterData((prev) => ({ ...prev, phone: val }));
                      }}
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                      autoFocus
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-18 pr-4 py-3 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:bg-white focus:ring-2 focus:ring-brand-teal/20 transition-all font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-xl px-3.5 py-2.5 mb-3">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">OTP Sent To</span>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 font-mono">+91 {loginPhone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginOtpSent(false);
                        setLoginOtp('');
                        setGeneratedOtp('');
                      }}
                      className="text-xs font-bold text-brand-pink hover:underline flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white transition-all"
                    >
                      <Edit2 size={12} />
                      <span>Edit Number</span>
                    </button>
                  </div>

                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Enter OTP
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Enter 4-digit OTP"
                      maxLength={4}
                      autoFocus
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:bg-white focus:ring-2 focus:ring-brand-teal/15 transition-all font-mono font-bold tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginOtp(!showLoginOtp)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showLoginOtp ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                    <div>
                      {canResendLoginOtp ? (
                        <button
                          type="button"
                          onClick={handleResendLoginOtp}
                          className="font-bold text-brand-teal hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw size={12} />
                          <span>Resend OTP</span>
                        </button>
                      ) : (
                        <span>Resend OTP in <strong>{loginOtpTimer}s</strong></span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!loginOtpSent && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal/20"
                    />
                    <span>Keep me signed in</span>
                  </label>
                </div>
              )}

              <button
                type={loginOtpSent ? 'button' : 'submit'}
                disabled={isLoading || (!loginOtpSent && loginPhone.replace(/\D/g, '').length < 10)}
                onClick={(e) => {
                  if (loginOtpSent) {
                    handleLoginSubmit(e);
                  }
                }}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal-light active:scale-[0.99] disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{loginOtpSent ? 'Submitting...' : 'Sending OTP...'}</span>
                  </>
                ) : (
                  <>
                    {loginOtpSent ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
                    <span>{loginOtpSent ? 'Verify & Continue' : 'Send OTP'}</span>
                  </>
                )}
              </button>
            </form>
          ) : null}

          {authMode === 'forgot' && (
            /* ===== FORGOT PASSWORD / OTP FLOW ===== */
            <div className="space-y-4">
              {/* STEP 1: REQUEST OTP (CHOOSE EMAIL OR PHONE) */}
              {forgotStep === 'request' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {/* <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Send Verification Code Via:
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setForgotMethod('email')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          forgotMethod === 'email'
                            ? 'bg-white text-brand-teal shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Mail size={14} />
                        <span>Email Address</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotMethod('phone')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          forgotMethod === 'phone'
                            ? 'bg-white text-brand-teal shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Smartphone size={14} />
                        <span>Mobile SMS</span>
                      </button>
                    </div>
                  </div> */}

                  {/* {forgotMethod === 'email' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. ritesh.yadav@example.com"
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all"
                        />
                      </div>
                    </div>
                  ) : ( */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Registered Mobile Phone
                      </label>
                      <div className="relative">
                        <Phone
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                          type="tel"
                          value={forgotPhone}
                          onChange={(e) => setForgotPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all"
                        />
                      </div>
                    </div>
                  {/* )} */}

                  {/* Masked Preview with Last 4 Digits / Characters */}
                  {/* <div className="p-3 bg-brand-teal/5 border border-brand-teal/20 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-teal/15 text-brand-teal flex items-center justify-center shrink-0">
                        <ShieldCheck size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-bold text-gray-400">
                          Target Masked Destination
                        </div>
                        <div className="text-xs font-mono font-bold text-brand-teal truncate">
                          {currentMaskedTarget.masked}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 bg-brand-yellow/35 text-brand-teal-dark border border-brand-yellow/60 text-[11px] font-extrabold px-2.5 py-1 rounded-lg">
                      Last 4: <span className="underline">{currentMaskedTarget.last4}</span>
                    </div>
                  </div> */}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal-light active:scale-[0.99] disabled:opacity-75 text-white font-extrabold py-3 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xs cursor-pointer hover:shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Send Verification OTP</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: ENTER OTP VERIFICATION CODE */}
              {forgotStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* Sent Confirmation Badge with Last 4 Digits */}
                  <div className="p-3.5 bg-brand-yellow/20 border border-brand-yellow/50 rounded-2xl text-center space-y-1">
                    <div className="text-xs text-gray-700">
                      Enter the 4-digit code sent to your {forgotMethod === 'email' ? 'email' : 'phone'}:
                    </div>
                    <div className="text-sm font-mono font-extrabold text-brand-teal flex items-center justify-center gap-2">
                      <span>{currentMaskedTarget.masked}</span>
                      {/* <span className="text-[10px] bg-brand-teal text-white px-2 py-0.5 rounded font-sans">
                        Last 4: {currentMaskedTarget.last4}
                      </span> */}
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="text-[11px] font-bold text-brand-pink hover:underline cursor-pointer pt-0.5 block mx-auto"
                    >
                      Change phone?
                    </button>
                  </div>

                  {/* 4 Digit OTP Input Boxes */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider text-center mb-2.5">
                      4-Digit One-Time Password
                    </label>
                    <div
                      className="flex items-center justify-center gap-2 sm:gap-3"
                      onPaste={handlePasteOtp}
                    >
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={otpInputRefs[idx]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-12 h-14 sm:w-14 sm:h-16 text-center font-mono text-xl sm:text-2xl font-extrabold bg-gray-50 border-2 border-gray-200 focus:border-brand-teal rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-teal/15 transition-all text-brand-teal"
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resend Timer */}
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      {canResendOtp ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isLoading}
                          className="font-bold text-brand-teal hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Resend OTP Code</span>
                        </button>
                      ) : (
                        <span>Resend OTP in <strong>{otpTimer}s</strong></span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal-light active:scale-[0.99] disabled:opacity-75 text-white font-extrabold py-3 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xs cursor-pointer hover:shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Verify OTP & Continue</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 3: NEW PASSWORD */}
              {forgotStep === 'new_password' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                    <span>Identity verified! Enter your new password below.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      New Password <span className="text-brand-pink">*</span>
                    </label>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        required
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all"
                      />
                      {/* <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button> */}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Confirm New Password <span className="text-brand-pink">*</span>
                    </label>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover active:scale-[0.99] disabled:opacity-75 text-brand-teal-dark font-extrabold py-3 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xs cursor-pointer hover:shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>Save Password & Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 4: SUCCESS */}
              {forgotStep === 'success' && (
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="font-display text-xl font-extrabold text-gray-800">
                    Password Reset Complete!
                  </h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Your password has been securely updated. Signing you into Book Vardi now...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
