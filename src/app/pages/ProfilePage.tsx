import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Leaf, Award, Flame, Camera, Check, Loader2,
  LogOut, TreePine, ShieldCheck, Edit3, X, Settings, DollarSign,
  CreditCard, Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { toast } from 'sonner';
import BankAccountModal from '../components/BankAccountModal';
import WithdrawalRequestModal from '../components/WithdrawalRequestModal';

export function ProfilePage() {
  const { user, isAuthenticated, logout, refreshUserProfile, setShowAuthModal } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-24 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-md w-full"
        >
          <User className="w-20 h-20 text-[var(--forest-green)] mx-auto mb-6 opacity-40" />
          <h2 className="text-2xl font-bold text-[var(--deep-forest)] mb-3">Sign in to view your profile</h2>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowAuthModal(true)}
            className="w-full py-4 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-bold rounded-2xl shadow-lg mt-4"
          >
            Sign In
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const result = await api.farmer.uploadImage(file);
      setProfileImage(result.url);
    } catch {
      toast.error('Failed to upload image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty.'); return; }
    setIsSaving(true);
    try {
      await api.auth.updateMe({ name: name.trim(), profile_image: profileImage || undefined });
      await refreshUserProfile();
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setProfileImage(user?.profile_image || '');
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const roleLabel = user?.role === 'farmer' ? 'Organic Farmer' : user?.role === 'admin' ? 'Administrator' : 'Tree Guardian';
  const roleBg = user?.role === 'farmer' ? 'bg-amber-100 text-amber-700' : user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Cover */}
          <div className="h-28 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)]" />
          </div>

          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="relative -mt-14 mb-4 w-fit">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-[var(--light-sage)] flex items-center justify-center">
                {profileImage ? (
                  <img src={profileImage} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-[var(--forest-green)]" />
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              {isEditing && (
                <button onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-[var(--forest-green)] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[var(--deep-forest)] transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {/* Name + role */}
            <div className="flex items-start justify-between">
              <div>
                {isEditing ? (
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                    className="text-2xl font-bold text-[var(--deep-forest)] border-b-2 border-[var(--forest-green)] outline-none bg-transparent w-full mb-1"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-[var(--deep-forest)]">{user?.name}</h1>
                )}
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${roleBg}`}>
                  {roleLabel}
                </span>
              </div>

              <div className="flex gap-2 mt-1">
                {isEditing ? (
                  <>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={handleSave} disabled={isSaving}
                      className="px-4 py-2 bg-[var(--forest-green)] text-white text-xs font-bold rounded-full flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Save
                    </motion.button>
                    <button onClick={handleCancel}
                      className="px-4 py-2 border border-gray-200 text-xs font-bold rounded-full flex items-center gap-1.5 hover:bg-gray-50"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </>
                ) : (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border-2 border-[var(--forest-green)]/30 text-[var(--forest-green)] text-xs font-bold rounded-full flex items-center gap-1.5 hover:bg-[var(--light-sage)]/30"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </motion.button>
                )}
              </div>
            </div>

            {/* Info rows */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-[var(--earth-brown)]">
                <Phone className="w-4 h-4 text-[var(--forest-green)] flex-shrink-0" />
                <span>{user?.mobile}</span>
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--earth-brown)]">
                <Leaf className="w-4 h-4 text-[var(--forest-green)] flex-shrink-0" />
                <span>Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { icon: <Leaf className="w-5 h-5" />, label: 'Eco Points', value: user?.eco_points?.toLocaleString() || '0', color: 'text-[var(--forest-green)]', bg: 'bg-emerald-50' },
            { icon: <Flame className="w-5 h-5" />, label: 'Day Streak', value: `${user?.streak_count || 0}🔥`, color: 'text-orange-500', bg: 'bg-orange-50' },
            { icon: <Award className="w-5 h-5" />, label: 'Level', value: (user?.eco_points || 0) >= 500 ? 'Blooming' : 'Seedling', color: 'text-[var(--golden-sun)]', bg: 'bg-yellow-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center shadow-sm`}>
              <div className={`${s.color} flex justify-center mb-1`}>{s.icon}</div>
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[var(--earth-brown)] mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick links */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl shadow-xl divide-y divide-gray-100 overflow-hidden"
        >
          {[
            { icon: <TreePine className="w-5 h-5 text-[var(--forest-green)]" />, label: 'My Orchard', sub: 'View your adopted trees', onClick: () => navigate('/orchard') },
            { icon: <Leaf className="w-5 h-5 text-emerald-500" />, label: 'Explore Trees', sub: 'Find new trees to adopt', onClick: () => navigate('/explore') },
            ...(user?.role === 'farmer' || user?.role === 'admin' ? [{ icon: <Award className="w-5 h-5 text-amber-500" />, label: 'Farmer Dashboard', sub: 'Manage your farm & trees', onClick: () => navigate('/dashboard') }] : []),
          ].map(item => (
            <motion.button key={item.label} whileHover={{ x: 4 }} onClick={item.onClick}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">{item.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-[var(--deep-forest)]">{item.label}</div>
                <div className="text-xs text-[var(--earth-brown)]">{item.sub}</div>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Farmer Wallet */}
        {(user?.role === 'farmer' || user?.role === 'admin') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="bg-white rounded-3xl shadow-xl p-6"
          >
            <h3 className="text-lg font-bold text-[var(--deep-forest)] mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" /> Wallet & Payouts
            </h3>
            
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 mb-4 border border-emerald-100">
              <div className="text-xs text-emerald-700 font-bold mb-1">Available Balance</div>
              <div className="text-3xl font-black text-emerald-600 mb-3">₹54,890</div>
              <button
                onClick={() => setShowWithdrawalModal(true)}
                className="w-full py-3 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Withdraw to Bank
              </button>
            </div>

            {/* Bank Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--earth-brown)]">
                  <CreditCard className="w-4 h-4 text-[var(--forest-green)]" /> Bank Account
                </div>
                <button
                  onClick={() => setShowBankModal(true)}
                  className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-200 transition-colors"
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border">
                  <div className="text-[10px] text-gray-400 font-bold mb-1">Bank Name</div>
                  <div className="font-bold text-[var(--deep-forest)]">HDFC Bank</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border">
                  <div className="text-[10px] text-gray-400 font-bold mb-1">Account</div>
                  <div className="font-bold text-[var(--deep-forest)]">•••• 4302</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full py-4 bg-white border-2 border-red-100 text-red-500 font-bold rounded-2xl shadow-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </motion.button>
        </motion.div>

      </div>
    </div>
  );
}
