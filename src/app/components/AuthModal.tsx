import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Lock, Sparkles, AlertCircle, CheckCircle, TreePine, Users, Leaf, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'role' | 'mobile' | 'otp' | 'name' | 'success' | 'pending'>('role');
  const [loginAs, setLoginAs] = useState<'user' | 'farmer'>('user');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [otpResult, setOtpResult] = useState<any>(null);

  if (!showAuthModal) return null;

  const handleSelectRole = (role: 'user' | 'farmer') => {
    setLoginAs(role);
    setError(null);
    setStep('mobile');
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || mobile.trim().length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;
      const data = await sendOTP(formattedMobile);
      setMobile(formattedMobile);
      if (data.dev_hint) {
        setDevHint(data.dev_hint);
      }
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter the full code');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const result = await verifyOTP(mobile, otp, loginAs);
      setOtpResult(result);

      if (result?.is_new_user) {
        // New user — ask for name before finishing
        setStep('name');
      } else if (loginAs === 'farmer' && result?.farmer_status === 'pending') {
        setStep('pending');
      } else {
        setStep('success');
        setTimeout(() => {
          resetAndClose();
          if (loginAs === 'farmer' && result?.farmer_status === 'approved') {
            navigate('/dashboard');
          }
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      // Re-verify with name to update the user record
      const result = await verifyOTP(mobile, otp, loginAs, name.trim());
      if (loginAs === 'farmer' && result?.farmer_status === 'pending') {
        setStep('pending');
      } else {
        setStep('success');
        setTimeout(() => {
          resetAndClose();
          if (loginAs === 'farmer' && result?.farmer_status === 'approved') {
            navigate('/dashboard');
          }
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save name.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep('role');
    setLoginAs('user');
    setMobile('');
    setOtp('');
    setName('');
    setOtpResult(null);
    setDevHint(null);
    setError(null);
    setShowAuthModal(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop glass */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetAndClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl z-10 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={resetAndClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--light-sage)] text-[var(--earth-brown)] transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* ===== STEP 0: ROLE SELECTION ===== */}
          {step === 'role' && (
            <motion.div
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Heading */}
              <div className="text-center mb-2">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                  className="inline-block p-4 bg-[var(--light-sage)]/50 rounded-full mb-4 text-[var(--forest-green)]"
                >
                  <Sparkles className="w-8 h-8" />
                </motion.div>
                <h2 className="text-3xl font-bold text-[var(--deep-forest)]">Welcome to TreeBond</h2>
                <p className="text-[var(--earth-brown)] mt-2">How would you like to join?</p>
              </div>

              {/* Role Cards */}
              <div className="grid grid-cols-1 gap-4">
                {/* User / Adopter Card */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectRole('user')}
                  className="relative flex items-center gap-5 p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 hover:border-emerald-400 rounded-2xl text-left transition-all group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-4 bg-white rounded-2xl shadow-md group-hover:shadow-lg transition-shadow">
                    <Users className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="relative flex-1">
                    <h3 className="text-xl font-bold text-[var(--deep-forest)] mb-1">🌱 I'm a Tree Adopter</h3>
                    <p className="text-sm text-[var(--earth-brown)] leading-relaxed">
                      Adopt a real tree, name it, track its growth, and receive fresh farm harvests
                    </p>
                  </div>
                  <div className="relative text-emerald-400 group-hover:text-emerald-600 transition-colors">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </div>
                </motion.button>

                {/* Farmer Card */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectRole('farmer')}
                  className="relative flex items-center gap-5 p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 hover:border-amber-400 rounded-2xl text-left transition-all group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-4 bg-white rounded-2xl shadow-md group-hover:shadow-lg transition-shadow">
                    <TreePine className="w-8 h-8 text-amber-600" />
                  </div>
                  <div className="relative flex-1">
                    <h3 className="text-xl font-bold text-[var(--deep-forest)] mb-1">🧑‍🌾 I'm a Farmer</h3>
                    <p className="text-sm text-[var(--earth-brown)] leading-relaxed">
                      List your trees, manage adoptions, earn money, and connect with adopters
                    </p>
                  </div>
                  <div className="relative text-amber-400 group-hover:text-amber-600 transition-colors">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </div>
                </motion.button>
              </div>

              <p className="text-center text-xs text-[var(--earth-brown)]/60 mt-2">
                Admin? Login with your admin phone number as an Adopter.
              </p>
            </motion.div>
          )}

          {/* ===== STEP 1: MOBILE INPUT ===== */}
          {step === 'mobile' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Back button */}
              <button
                onClick={() => { setStep('role'); setError(null); }}
                className="flex items-center gap-2 text-sm text-[var(--forest-green)] hover:text-[var(--deep-forest)] mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Change role
              </button>

              {/* Role Badge */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
                  loginAs === 'farmer'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {loginAs === 'farmer' ? <TreePine className="w-4 h-4" /> : <Leaf className="w-4 h-4" />}
                  Signing in as {loginAs === 'farmer' ? 'Farmer' : 'Tree Adopter'}
                </div>
                <h2 className="text-2xl font-bold text-[var(--deep-forest)]">Enter Your Mobile</h2>
                <p className="text-sm text-[var(--earth-brown)] mt-1">We'll send you a verification code</p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--deep-forest)]">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--earth-brown)]" />
                    <input
                      type="tel"
                      placeholder="Enter mobile (e.g. +91 9876543210)"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                      className="w-full pl-12 pr-6 py-4 bg-white/70 border border-gray-200 focus:border-[var(--forest-green)] rounded-2xl outline-none transition-all text-lg font-medium text-[var(--deep-forest)]"
                    />
                  </div>
                </div>

                {loginAs === 'farmer' && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-semibold mb-1">Farmer Verification Required</p>
                        <p className="text-amber-700">After registration, an admin will verify your farmer profile before you can access the Farmer Dashboard.</p>
                      </div>
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 text-white text-lg font-medium rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 ${
                    loginAs === 'farmer'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)]'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Send Verification Code'
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ===== STEP 2: OTP INPUT ===== */}
          {step === 'otp' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Role Badge */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
                  loginAs === 'farmer'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {loginAs === 'farmer' ? <TreePine className="w-4 h-4" /> : <Leaf className="w-4 h-4" />}
                  {loginAs === 'farmer' ? 'Farmer' : 'Tree Adopter'}
                </div>
                <h2 className="text-2xl font-bold text-[var(--deep-forest)]">Verify Your Code</h2>
                <p className="text-sm text-[var(--earth-brown)] mt-1">Code sent to {mobile}</p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[var(--deep-forest)]">6-Digit OTP Code</label>
                    <button
                      type="button"
                      onClick={() => setStep('mobile')}
                      className="text-sm text-[var(--forest-green)] hover:underline"
                    >
                      Edit Phone
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--earth-brown)]" />
                    <input
                      type="text"
                      pattern="\d*"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="w-full pl-12 pr-6 py-4 bg-white/70 border border-gray-200 focus:border-[var(--forest-green)] rounded-2xl outline-none transition-all text-lg font-medium text-[var(--deep-forest)] tracking-[0.25em]"
                    />
                  </div>
                </div>

                {/* Dev Helper Hint */}
                {devHint && (
                  <div className="p-4 bg-[var(--light-sage)]/40 border border-[var(--forest-green)]/20 rounded-2xl text-center">
                    <div className="text-xs text-[var(--earth-brown)] mb-1">Development Assistant Hint:</div>
                    <div className="text-lg font-bold text-[var(--forest-green)]">{devHint.replace(/[^0-9]/g, '')}</div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 text-white text-lg font-medium rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 ${
                    loginAs === 'farmer'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)]'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Verify and Continue'
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ===== STEP 3: NAME INPUT (new users only) ===== */}
          {step === 'name' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-block p-4 bg-[var(--light-sage)]/50 rounded-full mb-4"
                >
                  <Sparkles className="w-8 h-8 text-[var(--forest-green)]" />
                </motion.div>
                <h2 className="text-2xl font-bold text-[var(--deep-forest)]">What's your name?</h2>
                <p className="text-sm text-[var(--earth-brown)] mt-1">This is how your trees will know you 🌱</p>
              </div>

              <form onSubmit={handleSaveName} className="space-y-4">
                <input
                  type="text"
                  placeholder={loginAs === 'farmer' ? 'e.g. Ramesh Patil' : 'e.g. Rohan Sharma'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-5 py-4 bg-white/70 border border-gray-200 focus:border-[var(--forest-green)] rounded-2xl outline-none transition-all text-lg font-medium text-[var(--deep-forest)]"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 text-white text-lg font-medium rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 ${
                    loginAs === 'farmer'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)]'
                  }`}
                >
                  {isLoading
                    ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : 'Continue →'
                  }
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ===== STEP 4: SUCCESS ===== */}
          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-4"
            >
              <CheckCircle className="w-20 h-20 text-[var(--leaf-green)] mx-auto" />
              <h3 className="text-2xl font-bold text-[var(--deep-forest)]">
                {loginAs === 'farmer' ? 'Welcome, Farmer!' : 'Welcome, Guardian!'}
              </h3>
              <p className="text-[var(--earth-brown)]">
                {loginAs === 'farmer'
                  ? 'Your farmer dashboard is ready.'
                  : 'Your digital bond is established.'}
              </p>
            </motion.div>
          )}

          {/* ===== STEP 4: FARMER PENDING APPROVAL ===== */}
          {step === 'pending' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-5"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="inline-block p-5 bg-amber-100 rounded-full"
              >
                <TreePine className="w-14 h-14 text-amber-600" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-[var(--deep-forest)]">Application Submitted! 🎉</h3>
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left space-y-3">
                <p className="text-amber-800 text-sm leading-relaxed">
                  Your farmer profile has been created and is <strong>pending admin verification</strong>.
                </p>
                <div className="flex items-center gap-3 text-sm text-amber-700">
                  <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-800">1</div>
                  <span>Profile submitted ✓</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-amber-700">
                  <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-800 animate-pulse">2</div>
                  <span>Admin review in progress…</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">3</div>
                  <span>Access Farmer Dashboard</span>
                </div>
              </div>

              <p className="text-xs text-[var(--earth-brown)]">
                You'll be able to access the Farmer Dashboard once approved. Check back soon!
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetAndClose}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg font-medium rounded-2xl shadow-xl"
              >
                Got it, I'll wait!
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
