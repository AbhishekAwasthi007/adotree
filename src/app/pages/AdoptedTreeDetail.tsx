import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  TreePine, Award, Zap, Calendar, Camera, Sparkles, TrendingUp,
  MapPin, Leaf, Heart, Loader2, LogIn, ArrowLeft,
  Sun, Droplets, Wind, X, Maximize2,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FloatingParticles } from '../components/FloatingParticles';

function formatImageUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('/')) {
    return `http://localhost:8000${url}`;
  }
  return url;
}

export function AdoptedTreeDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user, setShowAuthModal, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const [adoption, setAdoption] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRequestingPhoto, setIsRequestingPhoto] = useState(false);
  
  const [localEcoPoints, setLocalEcoPoints] = useState<number>(0);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [actionEffect, setActionEffect] = useState<'water' | 'nourish' | 'love' | null>(null);

  const hasRequestedToday = memories.some((m: any) => {
    if (m.memory_type !== 'live_photo_request' && m.memory_type !== 'live_photo_upload') {
      return false;
    }
    const createdAtTime = new Date(m.created_at).getTime();
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    return createdAtTime > twentyFourHoursAgo;
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    async function fetchAdoptionDetails() {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await api.adoptions.get(id);
        setAdoption(data);
        try {
          const memoriesData = await api.memories.list(id);
          setMemories(memoriesData || []);
        } catch (memErr) {
          console.error("Failed to load memories", memErr);
        }
        setError(null);
      } catch (err: any) {
        console.error("Failed to load adoption details", err);
        setError(err.message || "Failed to load adoption details.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAdoptionDetails();
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (user?.eco_points !== undefined) {
      setLocalEcoPoints(user.eco_points);
    }
  }, [user]);

  const handleCareAction = async (action: 'water' | 'nourish' | 'love', points: number) => {
    setActionEffect(action);
    
    let newEcoPoints = localEcoPoints;
    if (points > 0) {
      newEcoPoints = localEcoPoints + points;
      setLocalEcoPoints(newEcoPoints);
      try {
        await api.auth.updateMe({ eco_points: newEcoPoints });
        await refreshUserProfile();
      } catch (err) {
        console.error("Failed to update eco points in backend", err);
      }
    }
    
    const messages = {
      water: `Water delivered successfully! Farmer Ramesh Patil will irrigate your tree. +5 Eco Points!`,
      nourish: `Allocated organic bio-compost to your tree's root system. +10 Eco Points!`,
      love: `Love sent! We alerted Farmer Ramesh that you are thinking of your tree.`,
    };
    
    setNotificationMessage(messages[action]);
    setTimeout(() => {
      setActionEffect(null);
    }, 1500);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 4500);
  };

  const handleRequestLivePhoto = async () => {
    if (!id) return;
    setIsRequestingPhoto(true);
    try {
      await api.memories.requestLivePhoto(id);
      setNotificationMessage("Photo request sent to the farmer! They will upload a fresh snapshot soon.");
      // Refresh memories
      const memoriesData = await api.memories.list(id);
      setMemories(memoriesData || []);
    } catch (err: any) {
      setNotificationMessage(err.message || "Failed to send photo request.");
    } finally {
      setIsRequestingPhoto(false);
    }
  };

  // Not logged in
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

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-24 pb-20 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#1B4332] animate-spin" />
      </div>
    );
  }

  // Error or Not found
  if (error || !adoption) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-24 pb-20 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl text-center max-w-md mx-4 border border-red-200">
          <h3 className="text-2xl font-black text-red-600 mb-2">Error Loading Tree</h3>
          <p className="text-sm text-[#52796F] font-bold mb-6">{error || "The requested adoption record could not be found."}</p>
          <Link to="/orchard">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-[#1B4332] text-white font-bold rounded-xl shadow-md"
            >
              Back to Orchard
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedTree = adoption.tree;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-24 pb-20">
      <FloatingParticles />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Navigation */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Link to="/orchard" className="inline-flex items-center gap-2 text-[#52796F] hover:text-[#1B4332] transition-colors font-bold text-sm">
            <ArrowLeft className="w-5 h-5" /> Back to My Orchard
          </Link>
        </motion.div>

        {/* Immersive Care & Connection Portal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-[#1B4332]/10 relative overflow-hidden"
        >
          
          {/* Floating care particle effects */}
          {actionEffect && (
            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
              {actionEffect === 'water' && (
                <div className="relative">
                  <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: [0, 80], opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 0.8] }} transition={{ duration: 1.2 }} className="absolute text-5xl">💧</motion.div>
                  <motion.div initial={{ y: -70, opacity: 0 }} animate={{ y: [-20, 60], opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 0.8] }} transition={{ duration: 1.2, delay: 0.2 }} className="absolute -left-10 text-4xl">💧</motion.div>
                  <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: [10, 90], opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 0.8] }} transition={{ duration: 1.2, delay: 0.1 }} className="absolute left-10 text-4xl">💧</motion.div>
                </div>
              )}
              {actionEffect === 'nourish' && (
                <div className="relative">
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0.5, 1.5, 1], opacity: [0, 1, 1, 0], y: [-20, -80] }} transition={{ duration: 1.5 }} className="absolute text-5xl">🌱</motion.div>
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 1, 0], y: [10, -60], x: -30 }} transition={{ duration: 1.5, delay: 0.2 }} className="absolute text-4xl">🍂</motion.div>
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 1, 0], y: [-10, -70], x: 30 }} transition={{ duration: 1.5, delay: 0.1 }} className="absolute text-4xl">✨</motion.div>
                </div>
              )}
              {actionEffect === 'love' && (
                <div className="relative">
                  <motion.div initial={{ scale: 0.2, y: 0, opacity: 0 }} animate={{ scale: [0.5, 1.8, 1.2], opacity: [0, 1, 1, 0], y: [-50, -150] }} transition={{ duration: 1.5 }} className="absolute text-6xl">❤️</motion.div>
                  <motion.div initial={{ scale: 0.2, y: 0, opacity: 0 }} animate={{ scale: [0.5, 1.5, 1], opacity: [0, 1, 1, 0], y: [-30, -110], x: -40 }} transition={{ duration: 1.5, delay: 0.25 }} className="absolute text-4xl">❤️</motion.div>
                  <motion.div initial={{ scale: 0.2, y: 0, opacity: 0 }} animate={{ scale: [0.5, 1.5, 1], opacity: [0, 1, 1, 0], y: [-40, -130], x: 40 }} transition={{ duration: 1.5, delay: 0.15 }} className="absolute text-4xl">❤️</motion.div>
                </div>
              )}
            </div>
          )}

          {/* Care Portal Banner / Custom Name */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="px-3 py-1 bg-[#D8F3DC] text-[#1B4332] font-black text-[10px] rounded-full uppercase tracking-wider">
                Tree Guardian Portal
              </span>
              <h2 className="text-3xl font-black text-[#081C15] mt-2 leading-tight">
                {adoption.custom_tree_name}
              </h2>
              <p className="text-sm text-[#52796F] font-bold flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4 text-[#52B788]" /> {selectedTree?.farm?.farmer?.location || 'India'}
              </p>
            </div>
            
            {/* Subscription status */}
            <span className="px-3 py-1 bg-[#52B788]/20 text-[#1B4332] border border-[#52B788]/30 text-xs font-black rounded-full uppercase tracking-wide">
              {adoption.subscription_status}
            </span>
          </div>

          {/* Immersive Viewport & Lifecycle Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-8 bg-[#FAF9F6] p-6 rounded-[2rem] border border-[#1B4332]/5">
            
            {/* Circular Portrait Frame */}
            <div className="flex justify-center relative py-4">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl relative z-10">
                <img
                  src={formatImageUrl(selectedTree?.tree_images?.[0]) || 'https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600'}
                  alt={adoption.custom_tree_name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Glow halo */}
              <div className="absolute inset-0 bg-[#52B788]/20 rounded-full blur-3xl scale-110 z-0 animate-pulse" />
              <div className="absolute -bottom-2 z-20 px-4 py-1 bg-[#1B4332] text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                Stage: {selectedTree?.health_score >= 9 ? '🥭 Fruiting' : '🌸 Flowering'}
              </div>
            </div>

            {/* Quick metrics in Viewport */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-[#52796F] mb-1.5">
                  <span>Vigor & Health</span>
                  <span className="text-[#52B788]">{selectedTree ? Math.round(selectedTree.health_score * 10) : '—'}%</span>
                </div>
                <div className="h-2 bg-[#D8F3DC] rounded-full overflow-hidden">
                  <div className="h-full bg-[#52B788] rounded-full" style={{ width: `${selectedTree ? Math.round(selectedTree.health_score * 10) : 0}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white p-3 rounded-2xl border border-[#1B4332]/5 shadow-sm">
                  <div className="text-[10px] text-[#52796F] font-bold uppercase tracking-wider mb-0.5">Crop</div>
                  <div className="text-base font-black text-[#1B4332] truncate">{selectedTree?.fruit_type || '—'}</div>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-[#1B4332]/5 shadow-sm">
                  <div className="text-[10px] text-[#52796F] font-bold uppercase tracking-wider mb-0.5">Yield</div>
                  <div className="text-base font-black text-[#1B4332] truncate">{selectedTree?.expected_yield || '—'} kg</div>
                </div>
              </div>
            </div>

          </div>

          {/* Live Conditions (Weather Widget) */}
          <div className="mb-8">
            <h3 className="text-sm font-black text-[#081C15] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-[#FFB703]" /> Live Conditions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <WeatherItem icon={<Sun className="w-10 h-10 text-[#FFB703]"/>} label="Temperature" value="28°C" />
              <WeatherItem icon={<Droplets className="w-10 h-10 text-[#90E0EF]"/>} label="Humidity" value="72%" />
              <WeatherItem icon={<Wind className="w-10 h-10 text-[#52796F]"/>} label="Rainfall" value="15mm today" />
              <WeatherItem icon={<Sun className="w-10 h-10 text-[#FFB703]"/>} label="Sunlight" value="8 hours" />
            </div>
          </div>

          {/* Gamified Care Station */}
          <div className="mb-8">
            <h3 className="text-sm font-black text-[#081C15] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#FFB703]" /> Guardian Care Actions
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              <CareButton
                icon="💧"
                label="Water Tree"
                points="+5 Points"
                disabled={actionEffect !== null}
                onClick={() => handleCareAction('water', 5)}
                color="hover:bg-blue-50 border-blue-100 text-blue-800"
              />
              <CareButton
                icon="🍂"
                label="Nourish Soil"
                points="+10 Points"
                disabled={actionEffect !== null}
                onClick={() => handleCareAction('nourish', 10)}
                color="hover:bg-green-50 border-green-100 text-green-800"
              />
              <CareButton
                icon="❤️"
                label="Send Love"
                points="Farmer Alerted"
                disabled={actionEffect !== null}
                onClick={() => handleCareAction('love', 0)}
                color="hover:bg-red-50 border-red-100 text-red-800"
              />
            </div>

            {/* Toast Care notification */}
            <AnimatePresence>
              {notificationMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 p-3 bg-[#E8F5E9] text-[#1B4332] border border-[#52B788]/20 rounded-xl text-xs font-bold text-center shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-[#52B788]" /> {notificationMessage}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Organic Lifecycle timeline */}
          <div className="mb-8 p-5 bg-[#FAF9F6] rounded-[2rem] border border-[#1B4332]/5">
            <h4 className="text-xs font-black text-[#081C15] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#1B4332]" /> Seasonal Harvest Timeline
            </h4>
            <div className="relative flex justify-between items-center text-center px-4">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#D8F3DC] -translate-y-1/2 z-0" />
              <div className="absolute top-1/2 left-0 h-0.5 bg-[#52B788] -translate-y-1/2 z-0 transition-all duration-500" style={{
                width: selectedTree?.health_score >= 9 ? '75%' : '50%'
              }} />

              <TimelineStep label="Flowering" icon="🌸" active={true} />
              <TimelineStep label="Growing" icon="🟢" active={true} />
              <TimelineStep label="Ripening" icon="🟠" active={selectedTree?.health_score >= 9} />
              <TimelineStep label="Harvest" icon="📦" active={false} />
            </div>
          </div>

          {/* Farmer Dialog bubble */}
          <div className="flex gap-4 items-start p-4 bg-green-50/50 border border-[#D8F3DC] rounded-3xl mb-6">
            <img
              src={selectedTree?.farm?.farmer?.avatar || 'https://images.unsplash.com/photo-1508116916455-2857e44c161e?w=100'}
              alt={selectedTree?.farm?.farmer?.farm_name || 'Farmer Ramesh'}
              className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-white"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h5 className="font-black text-[#081C15] text-xs">
                  {selectedTree?.farm?.farmer?.farm_name || 'Ramesh Patil'}
                </h5>
                <span className="text-[9px] font-black text-[#52796F] uppercase tracking-wider">Farmer Note</span>
              </div>
              <p className="text-xs text-[#1B4332] mt-1 leading-relaxed italic">
                "Hello guardian! {selectedTree?.health_score >= 9 
                  ? 'The fruits are sizing up beautifully on your tree. We expect a sweet, organic harvest this season!' 
                  : 'Pruning went extremely well this week. The tree is receiving full sunlight and starting to bud!'}"
              </p>
            </div>
          </div>

          {/* Primary buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowGallery(true)}
              className="flex-1 py-4 bg-[#1B4332] hover:bg-[#081C15] text-white font-black rounded-2xl shadow-lg hover:shadow-[#1B4332]/25 text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Camera className="w-4 h-4" /> Tree Gallery
            </motion.button>
            <button
              onClick={handleRequestLivePhoto}
              disabled={isRequestingPhoto || hasRequestedToday}
              className="px-5 py-4 bg-[#FAF9F6] border-2 border-[#D8F3DC] hover:border-[#1B4332] text-[#1B4332] font-black rounded-2xl text-xs transition-colors disabled:opacity-50"
            >
              {isRequestingPhoto ? 'Sending Request...' : hasRequestedToday ? 'Photo Requested Today' : 'Request Photo'}
            </button>
          </div>

        </motion.div>

      </div>

      {/* Tree Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGallery(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl z-10 overflow-hidden border border-[#1B4332]/15 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-[#FAF9F6]">
                <div>
                  <span className="px-3 py-1 bg-[#D8F3DC] text-[#1B4332] font-black text-[10px] rounded-full uppercase tracking-wider">
                    Gallery
                  </span>
                  <h3 className="text-2xl font-black text-[#081C15] mt-2">
                    {adoption.custom_tree_name}'s Photo Stream
                  </h3>
                </div>
                <button
                  onClick={() => setShowGallery(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-[#52796F] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Gallery Photos Grid */}
              <div className="p-8 overflow-y-auto flex-1 bg-[#FAF9F6]/50">
                {memories.filter((m: any) => m.memory_type === 'live_photo_upload').length === 0 ? (
                  <div className="text-center py-20">
                    <Camera className="w-16 h-16 text-[#52796F]/40 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-[#081C15]">No uploads yet</h4>
                    <p className="text-sm text-[#52796F] mt-1 max-w-md mx-auto">
                      Farmer uploads will appear here after you request a live photo. Use the "Request Live Photo" button to alert the farmer!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memories
                      .filter((m: any) => m.memory_type === 'live_photo_upload')
                      .map((memory: any) => (
                        <div
                          key={memory.id}
                          onClick={() => setSelectedImage(formatImageUrl(memory.media?.[0]))}
                          className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 group"
                        >
                          <div className="relative aspect-video overflow-hidden">
                            <img
                              src={formatImageUrl(memory.media?.[0])}
                              alt={memory.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                              <div className="flex justify-end">
                                <Maximize2 className="w-5 h-5 text-white drop-shadow" />
                              </div>
                              <span className="text-white text-xs font-bold">
                                {new Date(memory.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="p-5">
                            <h4 className="font-bold text-[#081C15] text-base mb-1">{memory.title}</h4>
                            <p className="text-xs text-[#52796F] leading-relaxed">{memory.description}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal for Large Image View */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-5xl max-h-[90vh] z-10 flex flex-col items-center"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-20 shadow-lg"
              >
                <X className="w-6 h-6" />
              </button>
              
              <img
                src={selectedImage}
                alt="Large View"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimelineStep({ label, icon, active }: { label: string; icon: string; active: boolean }) {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md transition-all duration-500 ${
        active ? 'bg-[#52B788] text-white scale-110' : 'bg-[#FAF9F6] text-[#52796F]/40 border border-[#D8F3DC]'
      }`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black mt-2 uppercase tracking-wider ${
        active ? 'text-[#1B4332]' : 'text-[#52796F]/40'
      }`}>
        {label}
      </span>
    </div>
  );
}

function CareButton({
  icon,
  label,
  points,
  disabled,
  onClick,
  color,
}: {
  icon: string;
  label: string;
  points: string;
  disabled: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      disabled={disabled}
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center p-4 border rounded-3xl transition-all shadow-sm bg-white ${color} disabled:opacity-50`}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-wider text-center">{label}</span>
      <span className="text-[9px] font-bold mt-0.5 opacity-80">{points}</span>
    </motion.button>
  );
}

function WeatherItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-[#FAF9F6] border border-[#1B4332]/10 hover:bg-[#FAF9F6]/80 transition-colors">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#52796F] font-bold mb-0.5">{label}</div>
        <div className="font-bold text-[#081C15] text-lg">{value}</div>
      </div>
    </div>
  );
}
