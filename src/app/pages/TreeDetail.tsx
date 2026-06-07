import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Droplets, Sun, Wind, Heart, Share2,
  TrendingUp, Gift, Leaf, User, Award, X, Sparkles, CheckCircle, Loader2,
  Home, Phone, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { FloatingParticles } from '../components/FloatingParticles';
import { api, formatImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

const staticTreeData = {
  id: 1,
  name: 'Royal Alphonso Mango',
  type: 'Mango',
  location: 'Ratnagiri, Maharashtra',
  farmer: {
    name: 'Ramesh Patil',
    experience: '25 years',
    avatar: 'https://images.unsplash.com/photo-1508116916455-2857e44c161e?w=100',
  },
  image: 'https://images.unsplash.com/photo-1775298116276-56bad682022f?w=1200',
  price: '₹4,999',
  yield: '15-20 kg',
  health: 95,
  organic: true,
  adopted: 12,
  status: 'available',
  description:
    'This beautiful Alphonso mango tree is planted in the fertile soils of Ratnagiri. Known for producing the sweetest mangoes in India, this tree will provide you with premium organic fruits every season.',
  nextHarvest: 'August 2026',
  plantedDate: 'January 2023',
  gpsCoords: '17.3625°N, 73.3167°E',
  weather: {
    temp: '28°C',
    humidity: '72%',
    rainfall: '15mm today',
    sunlight: '8 hours',
  },
  timeline: [
    {
      date: '2026-05-20',
      title: 'Flowering Started',
      description: 'Beautiful white flowers have appeared on your tree!',
      image: 'https://images.unsplash.com/photo-1761839321322-88f782f02e24?w=400',
    },
    {
      date: '2026-05-10',
      title: 'Heavy Rainfall',
      description: 'Your tree received 45mm of refreshing rain.',
      image: 'https://images.unsplash.com/photo-1771612646091-d927060bc75b?w=400',
    },
    {
      date: '2026-04-25',
      title: 'Health Checkup',
      description: 'Farmer Ramesh inspected your tree. Everything looks perfect!',
      image: 'https://images.unsplash.com/photo-1508116916455-2857e44c161e?w=400',
    },
  ],
};

export function TreeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, setShowAuthModal, user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [backendTree, setBackendTree] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isAdopting, setIsAdopting] = useState(false);
  const [adoptionDone, setAdoptionDone] = useState(false);
  const [customTreeName, setCustomTreeName] = useState('');
  const [occasionType, setOccasionType] = useState('personal');
  const [dedicationMessage, setDedicationMessage] = useState('');
  const [modalStep, setModalStep] = useState<'details' | 'address' | 'payment'>('details');
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [savedAddresses, setSavedAddresses] = useState<typeof deliveryAddress[]>([]);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number | null>(null);
  const [addingNewAddress, setAddingNewAddress] = useState(false);

  const openModal = () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    setCustomTreeName(`My ${tree.type}`);
    setModalStep('details');
    const stored = localStorage.getItem(`delivery_addresses_${user?.id}`);
    const parsed: typeof deliveryAddress[] = stored ? JSON.parse(stored) : [];
    setSavedAddresses(parsed);
    if (parsed.length > 0) {
      setSelectedAddressIdx(0);
      setDeliveryAddress(parsed[0]);
      setAddingNewAddress(false);
    } else {
      setSelectedAddressIdx(null);
      setDeliveryAddress({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });
      setAddingNewAddress(true);
    }
    setShowPaymentModal(true);
  };

  const saveNewAddress = () => {
    const updated = [...savedAddresses, deliveryAddress];
    setSavedAddresses(updated);
    localStorage.setItem(`delivery_addresses_${user?.id}`, JSON.stringify(updated));
    setSelectedAddressIdx(updated.length - 1);
    setAddingNewAddress(false);
  };

  useEffect(() => {
    async function loadTree() {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await api.trees.get(id);
        setBackendTree(data);
      } catch (err) {
        console.error("Failed to load tree details", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTree();
  }, [id]);

  function mapTreeDetail(tree: any) {
    if (!tree) return null;
    if (tree.fruit_type) {
      return {
        id: tree.id,
        name: `Royal ${tree.fruit_type}`,
        type: tree.fruit_type,
        location: tree.farm?.farmer?.location || 'Ratnagiri, Maharashtra',
        farmer: {
          name: tree.farm?.farmer?.farm_name || 'Ramesh Patil',
          experience: '15 years',
          avatar: 'https://images.unsplash.com/photo-1508116916455-2857e44c161e?w=100',
        },
        image: formatImageUrl(tree.tree_images?.[0]) || 'https://images.unsplash.com/photo-1775298116276-56bad682022f?w=1200',
        price: `₹${parseFloat(tree.price).toLocaleString('en-IN')}`,
        yield: `${tree.expected_yield} kg`,
        health: Math.round(tree.health_score * 10),
        organic: tree.farm?.farmer?.organic_certified ?? true,
        adopted: 12,
        status: tree.status || 'available',
        description: tree.farm?.farmer?.farm_description || 'This beautiful fruit tree is planted in fertile organic soils. Known for producing high-grade premium crops, this tree will provide you with organic harvest deliveries every season.',
        nextHarvest: 'August 2026',
        plantedDate: 'January 2023',
        gpsCoords: `${tree.farm?.farmer?.latitude || 17.3625}°N, ${tree.farm?.farmer?.longitude || 73.3167}°E`,
        weather: {
          temp: '28°C',
          humidity: '72%',
          rainfall: '15mm today',
          sunlight: '8 hours',
        },
        timeline: [
          {
            date: '3 days ago',
            title: 'Flowering Started',
            description: 'Beautiful white flowers have appeared on your tree!',
            image: 'https://images.unsplash.com/photo-1761839321322-88f782f02e24?w=400',
          },
          {
            date: '1 week ago',
            title: 'Heavy Rainfall',
            description: 'Your tree received 45mm of refreshing rain.',
            image: 'https://images.unsplash.com/photo-1771612646091-d927060bc75b?w=400',
          }
        ]
      };
    }
    return tree;
  }

  const tree = mapTreeDetail(backendTree) || staticTreeData;
  const handleAdopt = () => openModal();

  const handleConfirmPayment = async () => {
    setIsAdopting(true);
    try {
      const order = await api.adoptions.createOrder(
        tree.id.toString(),
        customTreeName,
        occasionType,
        dedicationMessage
      );
      await api.adoptions.verifyPayment({
        tree_id: tree.id.toString(),
        razorpay_order_id: order.razorpay_order_id,
        razorpay_payment_id: `pay_mock_${Math.random().toString(36).substr(2, 9)}`,
        razorpay_signature: 'mock_signature_data_abc123',
        custom_tree_name: customTreeName,
        occasion_type: occasionType,
        dedication_message: dedicationMessage,
      });
      setAdoptionDone(true);
      setTimeout(() => {
        setShowPaymentModal(false);
        navigate('/orchard');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsAdopting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] to-[#E8F5E9]/50 text-[#1B4332] pt-24 pb-20">
      <FloatingParticles />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Navigation */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link to="/explore" className="inline-flex items-center gap-2 text-[#52796F] hover:text-[#1B4332] transition-colors font-bold text-sm">
            <ArrowLeft className="w-5 h-5" /> Back to Explore
          </Link>
        </motion.div>

        {/* BENTO BOX GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* HERO SECTION (Spans 8 cols) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="lg:col-span-8 bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-[#1B4332]/10 relative group min-h-[450px] flex flex-col justify-end"
          >
            <img src={tree.image} alt={tree.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out" />
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Top Badges */}
            <div className="absolute top-6 left-6 z-20 flex gap-3">
              {tree.organic && (
                <div className="px-4 py-2 bg-[#52B788] text-white backdrop-blur-md rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                  <Leaf className="w-4 h-4" /> Certified Organic
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="absolute top-6 right-6 z-20 flex gap-3">
              <button onClick={() => setLiked(!liked)} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Hero Info */}
            <div className="relative z-20 p-8 text-white">
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-lg">{tree.name}</h1>
              <div className="flex flex-wrap items-center gap-5 text-sm md:text-base text-white/90 font-medium">
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#52B788]"/> {tree.location}</div>
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#F4A261]"/> Planted {tree.plantedDate}</div>
              </div>
            </div>
          </motion.div>

          {/* PRICING & CTA (Spans 4 cols) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#1B4332]/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-[#081C15]">Adoption Plan</h3>
                <span className="px-3 py-1 bg-[#1B4332]/10 text-[#1B4332] font-black text-[10px] rounded-full uppercase tracking-wider">Premium</span>
              </div>
              
              <div className="mb-8">
                <div className="text-5xl font-black text-[#1B4332] mb-3">{tree.price} <span className="text-lg text-[#52796F] font-medium">/ year</span></div>
                <p className="text-sm text-[#52796F] leading-relaxed font-medium">{tree.description}</p>
              </div>

              <div className="space-y-5 mb-8">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#52796F] flex items-center gap-2 font-bold"><Gift className="w-5 h-5 text-[#52B788]"/> Expected Yield</span>
                  <span className="font-bold text-[#081C15] text-base">{tree.yield}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#52796F] flex items-center gap-2 font-bold"><Calendar className="w-5 h-5 text-[#1B4332]"/> Next Harvest</span>
                  <span className="font-bold text-[#081C15] text-base">{tree.nextHarvest}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#52796F] flex items-center gap-2 font-bold"><Award className="w-5 h-5 text-[#FFB703]"/> Total Adopted</span>
                  <span className="font-bold text-[#081C15] text-base">{tree.adopted} times</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleAdopt}
              disabled={tree.status !== 'available'}
              className={`w-full py-5 font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg ${
                tree.status === 'available'
                  ? 'bg-[#1B4332] hover:bg-[#081C15] text-white hover:shadow-[#1B4332]/25 hover:-translate-y-1'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {tree.status === 'available' ? (
                <>
                  <Sparkles className="w-5 h-5"/> Adopt This Tree
                </>
              ) : (
                <>
                  <X className="w-5 h-5"/> {tree.status === 'adopted' ? 'Already Adopted' : 'Tree Unavailable'}
                </>
              )}
            </button>
          </motion.div>

          {/* WEATHER WIDGET (Spans 6 cols) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-6 bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#1B4332]/10">
            <h3 className="font-bold text-[#081C15] mb-6 flex items-center gap-3 text-2xl">
              <Sun className="w-7 h-7 text-[#FFB703]" /> Live Conditions
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <WeatherItem icon={<Sun className="w-10 h-10 text-[#FFB703]"/>} label="Temperature" value={tree.weather.temp} />
              <WeatherItem icon={<Droplets className="w-10 h-10 text-[#90E0EF]"/>} label="Humidity" value={tree.weather.humidity} />
              <WeatherItem icon={<Wind className="w-10 h-10 text-[#52796F]"/>} label="Rainfall" value={tree.weather.rainfall} />
              <WeatherItem icon={<Sun className="w-10 h-10 text-[#FFB703]"/>} label="Sunlight" value={tree.weather.sunlight} />
            </div>
            <div className="p-5 bg-[#FAF9F6] rounded-2xl border border-[#1B4332]/10">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-[#081C15]">Overall Tree Health</span>
                <span className="font-black text-[#52B788] text-lg">{tree.health}%</span>
              </div>
              <div className="h-3 bg-[#D8F3DC] rounded-full overflow-hidden">
                <div className="h-full bg-[#52B788] rounded-full" style={{ width: `${tree.health}%` }} />
              </div>
            </div>
          </motion.div>

          {/* TIMELINE & FARMER (Spans 6 cols) */}
          <div className="lg:col-span-6 grid grid-cols-1 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-[#1B4332]/10 flex items-center gap-6">
              <img src={tree.farmer.avatar} alt={tree.farmer.name} className="w-24 h-24 rounded-2xl object-cover shadow-md" />
              <div>
                <h3 className="text-xs text-[#52796F] uppercase tracking-wider font-black mb-1">Your Farmer</h3>
                <div className="text-2xl font-bold text-[#081C15] mb-1">{tree.farmer.name}</div>
                <div className="text-sm text-[#1B4332] font-bold flex items-center gap-1.5"><Award className="w-4 h-4"/> {tree.farmer.experience} Experience</div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#1B4332]/10 h-full">
              <h3 className="font-bold text-[#081C15] mb-8 flex items-center gap-3 text-2xl">
                <TrendingUp className="w-7 h-7 text-[#1B4332]" /> Growth Timeline
              </h3>
              <div className="space-y-6">
                {tree.timeline.map((event: any, index: number) => (
                  <TimelineCard key={index} event={event} index={index} isLast={index === tree.timeline.length - 1} />
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Payment Modal Refactored */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isAdopting && setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl z-10 overflow-hidden border border-[#1B4332]/15"
            >
              {!adoptionDone ? (
                <>
                  {/* Step progress bar */}
                  <div className="flex border-b border-[#1B4332]/10 bg-[#FAF9F6]">
                    {(['details', 'address', 'payment'] as const).map((s, i) => (
                      <div key={s} className={`flex-1 py-4 text-center text-[10px] font-black uppercase tracking-wider transition-all ${
                        modalStep === s
                          ? 'bg-[#1B4332] text-white'
                          : i < ['details','address','payment'].indexOf(modalStep)
                            ? 'bg-[#52B788]/20 text-[#1B4332]'
                            : 'text-[#52796F]'
                      }`}>
                        {i + 1}. {s === 'details' ? 'Tree Details' : s === 'address' ? 'Delivery Address' : 'Confirm & Pay'}
                      </div>
                    ))}
                  </div>

                  <div className="p-8">
                    <button onClick={() => !isAdopting && setShowPaymentModal(false)} className="absolute top-14 right-5 p-2 rounded-full hover:bg-[#FAF9F6] text-[#52796F] transition-colors">
                      <X className="w-5 h-5" />
                    </button>

                    {/* STEP 1: Tree details */}
                    {modalStep === 'details' && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-[#1B4332]/10">
                            <img src={tree.image} alt={tree.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#081C15]">{tree.name}</h3>
                            <p className="text-[#1B4332] font-bold">{tree.price} / year</p>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div>
                            <label className="block text-xs font-bold text-[#081C15] mb-2">Name Your Tree</label>
                            <input
                              type="text"
                              value={customTreeName}
                              onChange={e => setCustomTreeName(e.target.value)}
                              placeholder={`e.g. Grandpa's Mango`}
                              className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#D8F3DC] rounded-xl outline-none focus:border-[#1B4332] text-[#081C15] text-sm transition-colors placeholder:text-[#52796F]/50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#081C15] mb-2">Occasion</label>
                            <select
                              value={occasionType}
                              onChange={e => setOccasionType(e.target.value)}
                              className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#D8F3DC] rounded-xl outline-none focus:border-[#1B4332] text-[#081C15] text-sm transition-colors"
                            >
                              <option value="personal">Personal Gift to Myself</option>
                              <option value="birthday">Birthday Gift</option>
                              <option value="anniversary">Anniversary</option>
                              <option value="memorial">In Memory Of</option>
                              <option value="corporate">Corporate Green Pledge</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#081C15] mb-2">Dedication Message (optional)</label>
                            <textarea
                              value={dedicationMessage}
                              onChange={e => setDedicationMessage(e.target.value)}
                              placeholder="e.g. In memory of grandpa who loved mangoes..."
                              rows={2}
                              className="w-full px-4 py-3 bg-[#FAF9F6] border-2 border-[#D8F3DC] rounded-xl outline-none focus:border-[#1B4332] text-[#081C15] text-sm resize-none transition-colors placeholder:text-[#52796F]/50"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => setModalStep('address')}
                          disabled={!customTreeName.trim()}
                          className="mt-8 w-full py-4 bg-[#1B4332] hover:bg-[#081C15] text-white font-bold rounded-2xl shadow-lg hover:shadow-[#1B4332]/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                        >
                          Next: Delivery Address <ChevronRight className="w-5 h-5" />
                        </button>
                      </motion.div>
                    )}

                    {/* STEP 2: Delivery address */}
                    {modalStep === 'address' && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-[#D8F3DC] flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-[#1B4332]" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[#081C15] text-sm">Harvest Delivery Address</h3>
                            <p className="text-[10px] text-[#52796F] font-medium">Where should your seasonal harvest be shipped? 🍊</p>
                          </div>
                        </div>

                        {/* Saved addresses */}
                        {savedAddresses.length > 0 && !addingNewAddress && (
                          <div className="space-y-3 mb-6">
                            {savedAddresses.map((addr, idx) => (
                              <button
                                key={idx}
                                onClick={() => { setSelectedAddressIdx(idx); setDeliveryAddress(addr); }}
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                                  selectedAddressIdx === idx
                                    ? 'border-[#1B4332] bg-[#FAF9F6] shadow-md'
                                    : 'border-[#1B4332]/10 hover:border-[#1B4332]/30 bg-white'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                      selectedAddressIdx === idx ? 'border-[#1B4332]' : 'border-[#52796F]'
                                    }`}>
                                      {selectedAddressIdx === idx && (
                                        <div className="w-2 h-2 rounded-full bg-[#1B4332]" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-[#081C15] truncate">{addr.fullName} · {addr.phone}</p>
                                      <p className="text-[10px] text-[#52796F] leading-relaxed mt-1">
                                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}
                                      </p>
                                    </div>
                                  </div>
                                  {selectedAddressIdx === idx && (
                                    <span className="text-[9px] font-black text-[#1B4332] bg-[#D8F3DC] px-2.5 py-1 rounded-full flex-shrink-0 uppercase tracking-wider">Selected</span>
                                  )}
                                </div>
                              </button>
                            ))}

                            <button
                              onClick={() => {
                                setAddingNewAddress(true);
                                setSelectedAddressIdx(null);
                                setDeliveryAddress({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });
                              }}
                              className="w-full py-4 border-2 border-dashed border-[#1B4332]/20 hover:border-[#1B4332] rounded-2xl text-xs font-bold text-[#52796F] hover:text-[#1B4332] transition-all flex items-center justify-center gap-2 bg-[#FAF9F6]"
                            >
                              <Home className="w-4 h-4" /> Add New Address
                            </button>
                          </div>
                        )}

                        {/* New address form */}
                        {addingNewAddress && (
                          <div className="space-y-4 mb-6">
                            {savedAddresses.length > 0 && (
                              <button
                                onClick={() => { setAddingNewAddress(false); setSelectedAddressIdx(0); setDeliveryAddress(savedAddresses[0]); }}
                                className="flex items-center gap-1 text-[10px] font-bold text-[#1B4332] hover:underline mb-2"
                              >
                                <ChevronLeft className="w-3 h-3" /> Use saved address
                              </button>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-[#081C15] mb-1.5 flex items-center gap-1">
                                  <User className="w-3 h-3" /> Full Name *
                                </label>
                                <input type="text" value={deliveryAddress.fullName}
                                  onChange={e => setDeliveryAddress(p => ({ ...p, fullName: e.target.value }))}
                                  placeholder="Rohan Sharma"
                                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border-2 border-[#D8F3DC] rounded-xl outline-none focus:border-[#1B4332] text-[#081C15] text-xs transition-colors placeholder:text-[#52796F]/50"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-[#081C15] mb-1.5 flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> Phone *
                                </label>
                                <input type="tel" value={deliveryAddress.phone}
                                  onChange={e => setDeliveryAddress(p => ({ ...p, phone: e.target.value }))}
                                  placeholder="+91 98765 43210"
                                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border-2 border-[#D8F3DC] rounded-xl outline-none focus:border-[#1B4332] text-[#081C15] text-xs transition-colors placeholder:text-[#52796F]/50"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#081C15] mb-1.5 flex items-center gap-1">
                                  <Home className="w-3 h-3" /> Address Line 1 *
                              </label>
                              <input type="text" value={deliveryAddress.line1}
                                onChange={e => setDeliveryAddress(p => ({ ...p, line1: e.target.value }))}
                                placeholder="Flat / House No., Building, Street"
                                className="w-full px-3 py-2.5 bg-[#FAF9F6] border-2 border-[#D8F3DC] rounded-xl outline-none focus:border-[#1B4332] text-[#081C15] text-xs transition-colors placeholder:text-[#52796F]/50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#081C15] mb-1.5">Address Line 2 (optional)</label>
                              <input type="text" value={deliveryAddress.line2}
                                onChange={e => setDeliveryAddress(p => ({ ...p, line2: e.target.value }))}
                                placeholder="Landmark, Area, Colony"
                                className="w-full px-3 py-2.5 bg-[#FAF9F6] border-2 border-[#D8F3DC] rounded-xl outline-none focus:border-[#1B4332] text-[#081C15] text-xs transition-colors placeholder:text-[#52796F]/50"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-[#081C15] mb-1.5">City *</label>
                                <input type="text" value={deliveryAddress.city}
                                  onChange={e => setDeliveryAddress(p => ({ ...p, city: e.target.value }))}
                                  placeholder="Mumbai"
                                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border-2 border-[#D8F3DC] rounded-xl outline-none focus:border-[#1B4332] text-[#081C15] text-xs transition-colors placeholder:text-[#52796F]/50"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-[#081C15] mb-1.5">State *</label>
                                <input type="text" value={deliveryAddress.state}
                                  onChange={e => setDeliveryAddress(p => ({ ...p, state: e.target.value }))}
                                  placeholder="Maharashtra"
                                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border-2 border-[#D8F3DC] rounded-xl outline-none focus:border-[#1B4332] text-[#081C15] text-xs transition-colors placeholder:text-[#52796F]/50"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-[#081C15] mb-1.5">Pincode *</label>
                                <input type="text" value={deliveryAddress.pincode}
                                  onChange={e => setDeliveryAddress(p => ({ ...p, pincode: e.target.value }))}
                                  placeholder="400050" maxLength={6}
                                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border-2 border-[#D8F3DC] rounded-xl outline-none focus:border-[#1B4332] text-[#081C15] text-xs transition-colors placeholder:text-[#52796F]/50"
                                />
                              </div>
                            </div>

                            <div className="flex items-start gap-2 bg-[#D8F3DC]/30 border border-[#D8F3DC] rounded-xl p-3">
                              <MapPin className="w-4 h-4 text-[#1B4332] flex-shrink-0 mt-0.5" />
                              <p className="text-[10px] text-[#1B4332] leading-relaxed font-medium">
                                Shared only with your assigned farmer for seasonal harvest delivery.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 mt-4">
                          <button onClick={() => setModalStep('details')}
                            className="px-6 py-4 bg-[#FAF9F6] border-2 border-[#D8F3DC] rounded-2xl font-bold text-xs text-[#52796F] hover:bg-[#FAF9F6]/80 flex items-center gap-1 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" /> Back
                          </button>
                          {addingNewAddress ? (
                            <button
                              onClick={() => { saveNewAddress(); setModalStep('payment'); }}
                              disabled={!deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.line1 || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode}
                              className="flex-1 py-4 bg-[#1B4332] hover:bg-[#081C15] text-white font-bold rounded-2xl shadow-lg hover:shadow-[#1B4332]/25 flex items-center justify-center gap-2 disabled:opacity-50 text-sm transition-all"
                            >
                              Save & Continue <ChevronRight className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setModalStep('payment')}
                              disabled={selectedAddressIdx === null}
                              className="flex-1 py-4 bg-[#1B4332] hover:bg-[#081C15] text-white font-bold rounded-2xl shadow-lg hover:shadow-[#1B4332]/25 flex items-center justify-center gap-2 disabled:opacity-50 text-sm transition-all"
                            >
                              Use This Address <ChevronRight className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: Review & Pay */}
                    {modalStep === 'payment' && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h3 className="font-bold text-[#081C15] mb-6 text-xl">Review Your Order</h3>

                        {/* Tree summary */}
                        <div className="flex items-center gap-4 mb-4 p-4 bg-[#D8F3DC]/30 border border-[#D8F3DC] rounded-2xl">
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={tree.image} alt={tree.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-[#081C15] truncate">{customTreeName}</p>
                            <p className="text-xs text-[#52796F] font-medium mt-0.5">{tree.name} · <span className="capitalize">{occasionType}</span></p>
                          </div>
                          <p className="font-black text-[#1B4332] text-base flex-shrink-0">{tree.price}</p>
                        </div>

                        {/* Delivery address summary */}
                        <div className="mb-6 p-4 bg-[#FAF9F6] border border-[#1B4332]/10 rounded-2xl">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-[#52B788]" />
                            <span className="text-[10px] font-black text-[#52B788] uppercase tracking-wider">Deliver Harvest To</span>
                          </div>
                          <p className="text-sm font-bold text-[#081C15]">{deliveryAddress.fullName} · {deliveryAddress.phone}</p>
                          <p className="text-xs text-[#52796F] mt-1 leading-relaxed font-medium">
                            {deliveryAddress.line1}{deliveryAddress.line2 ? `, ${deliveryAddress.line2}` : ''}, {deliveryAddress.city}, {deliveryAddress.state} — {deliveryAddress.pincode}
                          </p>
                        </div>

                        {/* Price breakdown */}
                        <div className="bg-[#FAF9F6] rounded-2xl p-5 mb-8 text-sm space-y-3 text-[#52796F] font-medium border border-[#1B4332]/10">
                          <div className="flex justify-between"><span>Tree Adoption (12 months)</span><span className="font-bold text-[#081C15]">{tree.price}</span></div>
                          <div className="flex justify-between"><span>Harvest Delivery</span><span className="font-bold text-[#52B788]">Included</span></div>
                          <div className="border-t border-[#1B4332]/10 pt-3 flex justify-between font-black text-base text-[#081C15]"><span>Total</span><span>{tree.price}</span></div>
                        </div>

                        <div className="flex gap-3">
                          <button onClick={() => setModalStep('address')}
                            className="px-6 py-4 bg-[#FAF9F6] border-2 border-[#D8F3DC] rounded-2xl font-bold text-sm text-[#52796F] hover:bg-[#FAF9F6]/80 flex items-center gap-2 transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" /> Back
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleConfirmPayment}
                            disabled={isAdopting}
                            className="flex-1 py-4 bg-[#1B4332] hover:bg-[#081C15] text-white font-bold rounded-2xl shadow-lg hover:shadow-[#1B4332]/25 flex items-center justify-center gap-2 disabled:opacity-60 text-sm transition-all"
                          >
                            {isAdopting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Confirm & Pay {tree.price}</>}
                          </motion.button>
                        </div>
                        <p className="text-center text-xs text-[#52796F] mt-4 font-medium">Secured by Razorpay · 100% Safe</p>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-16 px-8 space-y-5">
                  <CheckCircle className="w-24 h-24 text-[#52B788] mx-auto" />
                  <h3 className="text-3xl font-black text-[#081C15]">Adoption Complete! 🌳</h3>
                  <p className="text-[#52796F] text-base leading-relaxed">Your organic harvest will be delivered directly to<br />
                    <span className="font-bold text-[#1B4332]">{deliveryAddress.city}, {deliveryAddress.state}</span>
                  </p>
                  <p className="text-sm text-[#52796F]/60 animate-pulse mt-4">Redirecting to your orchard...</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
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

function TimelineCard({ event, index, isLast }: { event: any; index: number, isLast: boolean }) {
  return (
    <div className="flex gap-5 relative group">
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#1B4332]/10 shadow-sm flex-shrink-0 group-hover:border-[#1B4332] transition-colors">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        </div>
        {!isLast && <div className="w-0.5 h-full bg-[#1B4332]/10 mt-3 group-hover:bg-[#1B4332]/30 transition-colors" />}
      </div>
      <div className={`flex-1 ${!isLast ? 'pb-8' : ''}`}>
        <div className="text-xs text-[#52B788] font-bold uppercase tracking-wider mb-1.5">{event.date}</div>
        <h4 className="font-bold text-[#081C15] text-lg mb-1.5">{event.title}</h4>
        <p className="text-sm text-[#1B4332]/80 leading-relaxed font-medium">{event.description}</p>
      </div>
    </div>
  );
}
