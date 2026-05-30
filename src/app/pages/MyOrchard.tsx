import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TreePine, Award, Zap, Calendar, Camera, Sparkles, TrendingUp,
  MapPin, Leaf, Heart, Loader2, LogIn,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function MyOrchard() {
  const { isAuthenticated, user, setShowAuthModal } = useAuth();
  const navigate = useNavigate();
  const [adoptions, setAdoptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const timeOfDay = (() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 8) return 'sunrise';
    if (h >= 8 && h < 17) return 'day';
    if (h >= 17 && h < 20) return 'sunset';
    return 'night';
  })();

  const skyGradient = {
    sunrise: 'from-orange-300 via-pink-200 to-blue-300',
    day: 'from-blue-300 via-cyan-200 to-green-200',
    sunset: 'from-orange-400 via-red-300 to-purple-400',
    night: 'from-indigo-900 via-purple-900 to-black',
  }[timeOfDay];

  useEffect(() => {
    if (!isAuthenticated) { setIsLoading(false); return; }
    api.adoptions.getMyOrchard()
      .then(data => setAdoptions(data || []))
      .catch(() => setAdoptions([]))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  // Not logged in
  if (!isAuthenticated && !isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${skyGradient} pt-24 pb-20 flex items-center justify-center`}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl text-center max-w-md mx-4"
        >
          <TreePine className="w-20 h-20 text-[var(--forest-green)] mx-auto mb-6 opacity-60" />
          <h2 className="text-3xl font-bold text-[var(--deep-forest)] mb-3">Your Orchard Awaits</h2>
          <p className="text-[var(--earth-brown)] mb-8">Sign in to see your adopted trees, growth timelines, and harvest updates.</p>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowAuthModal(true)}
            className="w-full py-4 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" /> Sign In to View Orchard
          </motion.button>
          <Link to="/explore" className="block mt-4 text-sm text-[var(--forest-green)] hover:underline">
            Browse trees to adopt →
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${skyGradient} pt-24 pb-20 relative overflow-hidden`}>
      {/* Animated sky elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div key={i}
            initial={{ x: -200, y: Math.random() * 200 }}
            animate={{ x: typeof window !== 'undefined' ? window.innerWidth + 200 : 1400 }}
            transition={{ duration: 40 + i * 8, repeat: Infinity, ease: 'linear', delay: i * 6 }}
            className="absolute w-32 h-16 bg-white/25 rounded-full blur-xl"
            style={{ top: `${15 + i * 8}%` }}
          />
        ))}
        {timeOfDay === 'night' && Array.from({ length: 40 }).map((_, i) => (
          <motion.div key={i}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 2 }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 40}%` }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-5xl font-bold text-[var(--deep-forest)] mb-2">My Orchard</h1>
                <p className="text-xl text-[var(--earth-brown)]">Welcome back, {user?.name?.split(' ')[0] || 'Guardian'}! 🌱</p>
              </div>
              <Link to="/explore">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-bold rounded-full shadow-lg flex items-center gap-2 text-sm"
                >
                  <Sparkles className="w-4 h-4" /> Adopt More Trees
                </motion.button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard icon={<TreePine className="w-6 h-6" />} label="Trees Adopted" value={adoptions.length.toString()} color="text-[var(--forest-green)]" />
              <StatCard icon={<Zap className="w-6 h-6" />} label="Eco Points" value={user?.eco_points?.toLocaleString() || '0'} color="text-[var(--golden-sun)]" />
              <StatCard icon={<Award className="w-6 h-6" />} label="Streak" value={`${user?.streak_count || 0} days`} color="text-[var(--sunset-orange)]" />
              <StatCard icon={<Calendar className="w-6 h-6" />} label="Active Plans" value={adoptions.filter(a => a.subscription_status === 'active').length.toString()} color="text-[var(--sky-blue)]" />
            </div>
          </div>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && adoptions.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 shadow-2xl text-center"
          >
            <TreePine className="w-24 h-24 text-[var(--forest-green)] mx-auto mb-6 opacity-40" />
            <h3 className="text-3xl font-bold text-[var(--deep-forest)] mb-3">Your orchard is empty</h3>
            <p className="text-[var(--earth-brown)] mb-8 max-w-md mx-auto">You haven't adopted any trees yet. Browse our collection of premium organic trees and start your journey.</p>
            <Link to="/explore">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-bold rounded-full shadow-xl flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-5 h-5" /> Explore Trees to Adopt
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* Orchard landscape */}
        {!isLoading && adoptions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
            <div className="relative bg-gradient-to-b from-green-800/20 to-green-900/40 backdrop-blur-sm rounded-3xl p-10 min-h-[500px] overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-green-900/50 to-transparent" />
              <motion.div
                animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}
                className={`absolute top-8 right-10 w-16 h-16 rounded-full ${timeOfDay === 'night' ? 'bg-gray-200 shadow-[0_0_60px_rgba(255,255,255,0.8)]' : 'bg-yellow-300 shadow-[0_0_80px_rgba(255,183,3,0.8)]'}`}
              />

              <div className="relative z-10 grid md:grid-cols-2 lg:grid-cols-3 gap-10 items-end">
                {adoptions.map((adoption, index) => (
                  <OrchardTree
                    key={adoption.id}
                    adoption={adoption}
                    index={index}
                    isSelected={selectedId === adoption.id}
                    onClick={() => setSelectedId(adoption.id === selectedId ? null : adoption.id)}
                  />
                ))}
                <Link to="/explore">
                  <motion.div whileHover={{ scale: 1.05, y: -10 }} whileTap={{ scale: 0.95 }}
                    className="bg-white/10 backdrop-blur-sm rounded-3xl p-10 border-2 border-dashed border-white/30 flex flex-col items-center justify-center min-h-[280px] cursor-pointer"
                  >
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles className="w-16 h-16 text-white/50 mb-4" />
                    </motion.div>
                    <div className="text-xl font-bold text-white mb-1">Adopt Another Tree</div>
                    <div className="text-white/60 text-sm">Grow your orchard</div>
                  </motion.div>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Adoption cards detail */}
        {!isLoading && adoptions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-[var(--deep-forest)] mb-6 flex items-center gap-2">
                <Heart className="w-7 h-7 text-[var(--sunset-orange)]" /> My Adopted Trees
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {adoptions.map(adoption => {
                  const t = adoption.tree;
                  return (
                    <motion.div key={adoption.id} whileHover={{ y: -4 }}
                      className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100"
                    >
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={t?.tree_images?.[0] || 'https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600'}
                          alt={adoption.custom_tree_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-4 left-4 text-white">
                          <h3 className="text-xl font-bold">{adoption.custom_tree_name}</h3>
                          <p className="text-sm opacity-80 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {t?.farm?.farmer?.location || 'India'}
                          </p>
                        </div>
                        <div className="absolute top-4 right-4 flex gap-2">
                          <span className="px-3 py-1 bg-green-600/90 text-white text-xs font-bold rounded-full uppercase">
                            {adoption.subscription_status}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-3 gap-3 text-center text-xs">
                          <div className="bg-[var(--light-sage)]/30 rounded-xl p-2">
                            <div className="text-[var(--earth-brown)]">Fruit</div>
                            <div className="font-bold text-[var(--forest-green)]">{t?.fruit_type || '—'}</div>
                          </div>
                          <div className="bg-[var(--light-sage)]/30 rounded-xl p-2">
                            <div className="text-[var(--earth-brown)]">Health</div>
                            <div className="font-bold text-[var(--forest-green)]">{t ? Math.round(t.health_score * 10) : '—'}%</div>
                          </div>
                          <div className="bg-[var(--light-sage)]/30 rounded-xl p-2">
                            <div className="text-[var(--earth-brown)]">Yield</div>
                            <div className="font-bold text-[var(--forest-green)]">{t?.expected_yield || '—'} kg</div>
                          </div>
                        </div>

                        {adoption.occasion_type && (
                          <div className="flex items-center gap-2 text-xs text-[var(--earth-brown)] bg-orange-50 rounded-xl px-3 py-2 border border-orange-100">
                            <Award className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                            <span className="capitalize">{adoption.occasion_type}</span>
                            {adoption.dedication_message && <span className="text-gray-400">— "{adoption.dedication_message}"</span>}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Link to={`/tree/${t?.id}`} className="flex-1">
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                              className="w-full py-2.5 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                            >
                              <Camera className="w-3.5 h-3.5" /> View Tree
                            </motion.button>
                          </Link>
                          <div className="flex-1">
                            <div className="w-full py-2.5 bg-[var(--light-sage)]/40 rounded-xl text-xs text-center text-[var(--earth-brown)] font-semibold">
                              Adopted {new Date(adoption.adoption_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="text-center">
      <div className={`${color} mb-2 flex justify-center`}>{icon}</div>
      <div className="text-2xl font-bold text-[var(--deep-forest)] mb-1">{value}</div>
      <div className="text-sm text-[var(--earth-brown)]">{label}</div>
    </motion.div>
  );
}

function OrchardTree({ adoption, index, isSelected, onClick }: { adoption: any; index: number; isSelected: boolean; onClick: () => void }) {
  const t = adoption.tree;
  const stage = t?.health_score >= 9 ? 'fruiting' : 'flowering';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 100 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.2, type: 'spring', bounce: 0.4 }}
      whileHover={{ y: -15, scale: 1.03 }}
      onClick={onClick}
      className="relative cursor-pointer"
    >
      <motion.div animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="relative">
        <div className="w-8 h-28 bg-gradient-to-b from-[var(--earth-brown)] to-[var(--deep-forest)] mx-auto rounded-t-full" />
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40"
        >
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--leaf-green)] to-[var(--forest-green)] rounded-full" />
            {stage === 'fruiting' && Array.from({ length: 7 }).map((_, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                className="absolute w-4 h-4 bg-[var(--sunset-orange)] rounded-full shadow-lg"
                style={{ left: `${20 + Math.cos((i / 7) * Math.PI * 2) * 33 + 38}%`, top: `${20 + Math.sin((i / 7) * Math.PI * 2) * 33 + 38}%` }}
              />
            ))}
            {stage === 'flowering' && Array.from({ length: 10 }).map((_, i) => (
              <motion.div key={i} animate={{ scale: [0, 1, 0.8, 1] }} transition={{ delay: i * 0.05, duration: 0.5 }}
                className="absolute w-2 h-2 bg-white rounded-full shadow"
                style={{ left: `${10 + Math.cos((i / 10) * Math.PI * 2) * 38 + 40}%`, top: `${10 + Math.sin((i / 10) * Math.PI * 2) * 38 + 40}%` }}
              />
            ))}
          </div>
        </motion.div>
        {isSelected && (
          <motion.div animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-[var(--golden-sun)] blur-3xl -z-10"
          />
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + index * 0.2 }}
        className={`mt-6 bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-xl transition-all ${isSelected ? 'ring-2 ring-[var(--golden-sun)]' : ''}`}
      >
        <h3 className="text-lg font-bold text-[var(--deep-forest)] mb-1">{adoption.custom_tree_name}</h3>
        <p className="text-xs text-[var(--earth-brown)] mb-3 flex items-center gap-1">
          <Leaf className="w-3 h-3" /> {t?.fruit_type} • {t?.farm?.farmer?.location || 'India'}
        </p>
        <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
          <div className="bg-[var(--light-sage)]/30 rounded-lg p-1.5">
            <div className="text-[var(--earth-brown)]">Health</div>
            <div className="font-bold text-[var(--forest-green)]">{t ? Math.round(t.health_score * 10) : '—'}%</div>
          </div>
          <div className="bg-[var(--light-sage)]/30 rounded-lg p-1.5">
            <div className="text-[var(--earth-brown)]">Stage</div>
            <div className="font-bold text-[var(--forest-green)] capitalize">{stage}</div>
          </div>
        </div>
        <Link to={`/tree/${t?.id}`}>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="w-full py-2 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" /> View Details
          </motion.button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
