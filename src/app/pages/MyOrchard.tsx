import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  TreePine, Award, Zap, Calendar, Sparkles, MapPin, Leaf, Loader2, LogIn,
} from 'lucide-react';
import { api, formatImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FloatingParticles } from '../components/FloatingParticles';

export function MyOrchard() {
  const { isAuthenticated, user, setShowAuthModal } = useAuth();
  const [adoptions, setAdoptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    api.adoptions.getMyOrchard()
      .then(data => {
        setAdoptions(data || []);
      })
      .catch(() => setAdoptions([]))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  // Not logged in (Consistent with Explore Page theme)
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-24 pb-20 flex items-center justify-center relative overflow-hidden">
        <FloatingParticles />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl text-center max-w-md mx-4 border border-[#1B4332]/10 relative z-10"
        >
          <TreePine className="w-20 h-20 text-[#1B4332] mx-auto mb-6 opacity-80 animate-bounce" />
          <h2 className="text-3xl font-black text-[#081C15] mb-3">Your Orchard Awaits</h2>
          <p className="text-sm text-[#52796F] font-bold mb-8">Sign in to see your adopted trees, growth timelines, and harvest updates.</p>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowAuthModal(true)}
            className="w-full py-4 bg-[#1B4332] hover:bg-[#081C15] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" /> Sign In to View Orchard
          </motion.button>
          <Link to="/explore" className="block mt-4 text-sm text-[#1B4332] font-black hover:underline">
            Browse trees to adopt →
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-24 pb-20">
      <FloatingParticles />

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-[#1B4332]/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
              <div>
                <h1 className="text-5xl font-black text-[#081C15] mb-2 tracking-tight">My Orchard</h1>
                <p className="text-lg text-[#52796F] font-bold">Welcome back, {user?.name?.split(' ')[0] || 'Guardian'}! 🌱</p>
              </div>
              <Link to="/explore">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-[#1B4332] hover:bg-[#081C15] text-white font-bold rounded-full shadow-lg flex items-center gap-2 text-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Adopt More Trees
                </motion.button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<TreePine className="w-6 h-6" />} label="Trees Adopted" value={adoptions.length.toString()} color="text-[#52B788]" />
              <StatCard icon={<Zap className="w-6 h-6" />} label="Eco Points" value={(user?.eco_points || 0).toLocaleString()} color="text-[#F4A261]" />
              <StatCard icon={<Award className="w-6 h-6" />} label="Streak" value={`${user?.streak_count || 0} days`} color="text-[#6B4F3A]" />
              <StatCard icon={<Calendar className="w-6 h-6" />} label="Active Plans" value={adoptions.filter(a => a.subscription_status === 'active').length.toString()} color="text-[#1B4332]" />
            </div>
          </div>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#1B4332] animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && adoptions.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 shadow-2xl text-center border border-[#1B4332]/10"
          >
            <TreePine className="w-24 h-24 text-[#1B4332] mx-auto mb-6 opacity-40 animate-pulse" />
            <h3 className="text-3xl font-black text-[#081C15] mb-3">Your orchard is empty</h3>
            <p className="text-[#52796F] mb-8 max-w-md mx-auto font-medium">You haven't adopted any trees yet. Browse our collection of premium organic trees and start your journey.</p>
            <Link to="/explore">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-gradient-to-r from-[#1B4332] to-[#52B788] text-white font-bold rounded-full shadow-xl flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-5 h-5" /> Explore Trees to Adopt
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* Adopted Trees Grid */}
        {!isLoading && adoptions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#1B4332] flex items-center gap-2 drop-shadow-md">
                <Leaf className="w-6 h-6 text-[#52B788]" /> Your Orchard Roster
              </h2>
              <span className="px-4 py-1.5 bg-[#1B4332]/10 text-[#1B4332] rounded-full text-xs font-black backdrop-blur-sm border border-[#1B4332]/10">
                {adoptions.length} {adoptions.length === 1 ? 'Tree' : 'Trees'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {adoptions.map(adoption => {
                const t = adoption.tree;
                return (
                  <motion.div
                    key={adoption.id}
                    whileHover={{ y: -8 }}
                    className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl border border-[#1B4332]/10 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image frame */}
                      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-5 border border-[#1B4332]/10 group">
                        <img
                          src={formatImageUrl(t?.tree_images?.[0]) || 'https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600'}
                          alt={adoption.custom_tree_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {t?.farm?.farmer?.organic_certified !== false && (
                            <span className="px-2.5 py-1 bg-[#52B788]/90 text-white font-black text-[9px] rounded-full uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
                              <Leaf className="w-2.5 h-2.5" /> Organic
                            </span>
                          )}
                        </div>

                        {adoption.occasion_type && (
                          <div className="absolute top-3 right-3">
                            <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-orange-100/90 text-orange-800 backdrop-blur-sm border border-orange-200">
                              {adoption.occasion_type}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tree Identifiers */}
                      <div className="mb-4">
                        <h3 className="text-2xl font-black text-[#081C15] mb-1 tracking-tight truncate">
                          {adoption.custom_tree_name}
                        </h3>
                        <p className="text-xs text-[#52796F] font-bold flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#52B788]" /> {t?.farm?.farmer?.location || 'India'}
                        </p>
                      </div>

                      {/* Vigor Health info */}
                      <div className="mb-5 bg-[#FAF9F6] p-4 rounded-2xl border border-[#1B4332]/5">
                        <div className="flex justify-between items-center text-xs font-bold text-[#52796F] mb-1.5">
                          <span>Vigor & Health</span>
                          <span className="text-[#52B788]">{t ? Math.round(t.health_score * 10) : '—'}%</span>
                        </div>
                        <div className="h-2 bg-[#D8F3DC] rounded-full overflow-hidden">
                          <div className="h-full bg-[#52B788] rounded-full" style={{ width: `${t ? Math.round(t.health_score * 10) : 0}%` }} />
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="flex gap-2 mb-6">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#1B4332]/10 text-[#1B4332]">
                          {t?.fruit_type || 'Fruit'} Tree
                        </span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#F4A261]/25 text-[#D47C35] border border-orange-200/50">
                          Yield: {t?.expected_yield || '—'} kg
                        </span>
                      </div>
                    </div>

                    <Link to={`/orchard/${adoption.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-[#1B4332] hover:bg-[#081C15] text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs transition-colors"
                      >
                        <Sparkles className="w-4 h-4" /> Enter Care Portal
                      </motion.button>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Adopt a New Tree Card in grid */}
              <Link to="/explore" className="flex">
                <motion.div
                  whileHover={{ y: -8 }}
                  className="w-full rounded-[2rem] p-8 border-4 border-dashed border-[#1B4332]/25 hover:border-[#1B4332] bg-white/40 hover:bg-white flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all duration-300 min-h-[350px]"
                >
                  <div className="w-16 h-16 rounded-full bg-[#1B4332]/5 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[#1B4332] animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#1B4332]">Adopt Another Tree</h3>
                    <p className="text-xs text-[#52796F] mt-2 max-w-[200px] font-bold">Grow your digital orchard and increase your eco-impact.</p>
                  </div>
                </motion.div>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-white/50 border border-[#1B4332]/10 p-4 rounded-2xl text-center backdrop-blur-sm shadow-sm flex flex-col justify-center items-center">
      <div className={`${color} mb-2 flex justify-center`}>{icon}</div>
      <div className="text-2xl font-black text-[#081C15] mb-1">{value}</div>
      <div className="text-[10px] font-black text-[#52796F] uppercase tracking-wider">{label}</div>
    </motion.div>
  );
}
