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
  ShieldCheck,
  RotateCcw,
  Smartphone,
  Store
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    login,
    register,
    showToast,
    USERS,
    switchUser
  } = useCart();

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form State
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
    studentId: '',
    password: ''
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Forgot Password / OTP Flow State
  const [forgotMethod, setForgotMethod] = useState('email'); // 'email' | 'phone'
  const [forgotEmail, setForgotEmail] = useState('ritesh.yadav@example.com');
  const [forgotPhone, setForgotPhone] = useState('+91 98765 43210');
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'otp' | 'new_password' | 'success'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [demoOtp, setDemoOtp] = useState('4829');
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

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
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

  if (!isAuthModalOpen) return null;

  // ===== LOGIN HANDLER =====
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const email = loginEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('⚠️ Please enter a valid email address');
      return;
    }
    if (!loginPassword) {
      showToast('⚠️ Please enter your password');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login({
        email,
        name: email.split('@')[0].replace('.', ' ')
      });
    }, 450);
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setLoginEmail('ritesh.yadav@example.com');
    setLoginPassword('DemoPassword123');

    setTimeout(() => {
      setIsLoading(false);
      login({
        name: 'Ritesh Yadav',
        email: 'ritesh.yadav@example.com'
      });
    }, 400);
  };

  // ===== REGISTER HANDLER =====
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const { name, email, phone, institution, password } = registerData;

    if (!name.trim()) {
      showToast('⚠️ Please enter your full name');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast('⚠️ Please enter a valid student email');
      return;
    }
    if (!phone.trim()) {
      showToast('⚠️ Please enter your phone number');
      return;
    }
    if (!password || password.length < 6) {
      showToast('⚠️ Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        institution: institution.trim() || 'School / College',
        studentId: registerData.studentId.trim() || `SC-${Math.floor(1000 + Math.random() * 9000)}`
      });
    }, 550);
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
      const generatedCode = '4829';
      setDemoOtp(generatedCode);
      setForgotStep('otp');
      setOtpDigits(['', '', '', '']);
      setOtpTimer(30);
      setCanResendOtp(false);
      const targetDisplay = forgotMethod === 'email' ? getMaskedEmail(forgotEmail) : getMaskedPhone(forgotPhone);
      showToast(`📲 OTP sent to ${targetDisplay.masked} (Last 4 digits: ${targetDisplay.last4}). Demo: ${generatedCode}`);
    }, 450);
  };

  const handleResendOtp = () => {
    if (!canResendOtp) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpTimer(30);
      setCanResendOtp(false);
      setOtpDigits(['', '', '', '']);
      const targetDisplay = forgotMethod === 'email' ? getMaskedEmail(forgotEmail) : getMaskedPhone(forgotPhone);
      showToast(`📩 New OTP sent to ${targetDisplay.masked} (Last 4 digits: ${targetDisplay.last4}). Demo: 4829`);
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

  const handleFillDemoOtp = () => {
    setOtpDigits(['4', '8', '2', '9']);
    showToast('🔑 Demo code 4829 filled! Click "Verify Code" to continue.');
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
      if (enteredOtp === demoOtp || enteredOtp === '4829' || enteredOtp === '1234') {
        setForgotStep('new_password');
        showToast('✓ Identity verified! Please enter your new password.');
      } else {
        showToast(`⚠️ Incorrect OTP code. Enter the 4-digit code (Demo code: ${demoOtp})`);
      }
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
      onClick={closeAuthModal}
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
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest bg-brand-yellow text-brand-teal-dark px-2 py-0.5 rounded-full shadow-2xs">
              <Sparkles size={11} />
              <span>
                {authMode === 'forgot' ? 'ACCOUNT SECURITY' : 'STUDENT REWARDS'}
              </span>
            </span>
          </div>

          <h3 className="font-display text-2xl font-extrabold tracking-tight">
            {authMode === 'login'
              ? 'Welcome Back!'
              : authMode === 'register'
              ? 'Create Student Account'
              : 'Forgot Password?'}
          </h3>
          <p className="text-xs text-white/80 mt-1 leading-relaxed">
            {authMode === 'login'
              ? 'Sign in to access your orders, saved addresses & student discounts.'
              : authMode === 'register'
              ? 'Join Book Vardi to earn reward points & exclusive discounts on stationery.'
              : 'Verify your student account via OTP sent to your email or phone.'}
          </p>

          {/* Mode Switcher Tabs */}
          {authMode !== 'forgot' ? (
            <div className="grid grid-cols-2 bg-black/20 p-1 rounded-xl mt-5">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white text-brand-teal shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white text-brand-teal shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          ) : (
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
                <span>Back to Sign In</span>
              </button>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-yellow bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                {forgotStep === 'request' && 'Step 1: Choose Target'}
                {forgotStep === 'otp' && 'Step 2: Enter OTP'}
                {forgotStep === 'new_password' && 'Step 3: New Password'}
                {forgotStep === 'success' && 'Step 4: Success'}
              </span>
            </div>
          )}
        </div>

        {/* Form Body - Scrollable */}
        <div className="p-6 overflow-y-auto">
          {authMode === 'login' && (
            /* ===== LOGIN FORM ===== */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email or Student ID
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@school.edu or your email"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setForgotStep('request');
                      if (loginEmail) setForgotEmail(loginEmail);
                    }}
                    className="text-[11px] font-bold text-brand-teal hover:underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal-light active:scale-[0.99] disabled:opacity-75 text-white font-extrabold py-3 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xs cursor-pointer hover:shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              {/* Quick Select from mockData USERS */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                    Switch Mock Account (RBAC Roles)
                  </span>
                  <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                    From mockData.js
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(USERS || []).slice(0, 6).map((u) => {
                    const hasAdmin = u.isAdmin && u.adminStatus === 'approved';
                    const hasSeller = u.isSeller && u.sellerStatus === 'approved';
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setIsLoading(true);
                          setLoginEmail(u.email);
                          setLoginPassword('Password123');
                          setTimeout(() => {
                            setIsLoading(false);
                            login({ email: u.email, name: u.name });
                          }, 300);
                        }}
                        disabled={isLoading}
                        className="text-left p-2.5 rounded-xl border border-gray-200 hover:border-brand-teal/40 bg-gray-50/70 hover:bg-teal-50/40 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="font-bold text-xs text-gray-900 group-hover:text-brand-teal truncate">
                            {u.name}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {hasAdmin && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-teal-800 text-white rounded font-black" title="Approved Admin">
                                Admin
                              </span>
                            )}
                            {hasSeller && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-amber-400 text-teal-950 rounded font-black" title="Approved Seller">
                                Seller
                              </span>
                            )}
                            {!hasAdmin && !hasSeller && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-gray-200 text-gray-700 rounded font-bold">
                                {u.role}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500 truncate mt-0.5">
                          {u.email}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-center pt-2 text-xs text-gray-500">
                Don't have a student account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="font-bold text-brand-teal hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {authMode === 'register' && (
            /* ===== REGISTER FORM ===== */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-brand-pink">*</span>
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
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Mobile Phone <span className="text-brand-pink">*</span>
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      placeholder="+91 98765..."
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  School / College / University
                </label>
                <div className="relative">
                  <GraduationCap
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={registerData.institution}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, institution: e.target.value })
                    }
                    placeholder="e.g. Delhi Technological University"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Create Password <span className="text-brand-pink">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, password: e.target.value })
                    }
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-[11px] flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0 text-green-600" />
                <span>Earn <strong>100 Free Reward Points</strong> upon registration!</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover active:scale-[0.99] disabled:opacity-75 text-brand-teal-dark font-extrabold py-3 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xs cursor-pointer hover:shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Create Student Account</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2 text-xs text-gray-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="font-bold text-brand-teal hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

          {authMode === 'forgot' && (
            /* ===== FORGOT PASSWORD / OTP FLOW ===== */
            <div className="space-y-4">
              {/* STEP 1: REQUEST OTP (CHOOSE EMAIL OR PHONE) */}
              {forgotStep === 'request' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
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
                  </div>

                  {forgotMethod === 'email' ? (
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
                  ) : (
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
                  )}

                  {/* Masked Preview with Last 4 Digits / Characters */}
                  <div className="p-3 bg-brand-teal/5 border border-brand-teal/20 rounded-2xl flex items-center justify-between gap-3">
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
                  </div>

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
                      <span className="text-[10px] bg-brand-teal text-white px-2 py-0.5 rounded font-sans">
                        Last 4: {currentMaskedTarget.last4}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="text-[11px] font-bold text-brand-pink hover:underline cursor-pointer pt-0.5 block mx-auto"
                    >
                      Change destination?
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

                  {/* Demo Helper & Resend Timer */}
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleFillDemoOtp}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-yellow/20 hover:bg-brand-yellow/30 border border-brand-yellow/60 rounded-full text-[11px] font-bold text-brand-teal-dark cursor-pointer transition-colors"
                    >
                      <Sparkles size={12} className="text-brand-ochre" />
                      <span>Demo Test Code: <strong>4829</strong> (Click to fill)</span>
                    </button>

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
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
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
