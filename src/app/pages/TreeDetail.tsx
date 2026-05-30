import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Droplets, Sun, Wind, Heart, Share2,
  Camera, TrendingUp, Gift, Leaf, User, Award, X, Sparkles, CheckCircle, Loader2,
  Home, Phone, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { FloatingParticles } from '../components/FloatingParticles';
import { api } from '../services/api';
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

  // Load saved addresses from localStorage when modal opens
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
        image: tree.tree_images?.[0] || 'https://images.unsplash.com/photo-1775298116276-56bad682022f?w=1200',
        price: `₹${parseFloat(tree.price).toLocaleString('en-IN')}`,
        yield: `${tree.expected_yield} kg`,
        health: Math.round(tree.health_score * 10),
        organic: tree.farm?.farmer?.organic_certified ?? true,
        adopted: 12,
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
    <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-24 pb-20">
      <FloatingParticles />

      <div className="max-w-7xl mx-auto px-6">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Link to="/explore">
            <button className="flex items-center gap-2 text-[var(--forest-green)] hover:gap-3 transition-all">
              <ArrowLeft className="w-5 h-5" />
              Back to Explore
            </button>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Image & Media */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="sticky top-24">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-6 group">
                <img src={tree.image} alt={tree.name} className="w-full aspect-[4/3] object-cover" />

                {/* Overlay Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-3">
                  {tree.organic && (
                    <div className="px-4 py-2 bg-[var(--leaf-green)]/90 backdrop-blur-sm text-white rounded-full flex items-center gap-2">
                      <Leaf className="w-4 h-4" />
                      Certified Organic
                    </div>
                  )}
  
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setLiked(!liked)}
                    className="p-4 bg-white rounded-full"
                  >
                    <Heart
                      className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
                    />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-4 bg-white rounded-full"
                  >
                    <Share2 className="w-6 h-6 text-gray-700" />
                  </motion.button>
                </div>
              </div>

              {/* Weather Widget */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl"
              >
                <h3 className="font-bold text-[var(--deep-forest)] mb-4 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-[var(--golden-sun)]" />
                  Live Weather Conditions
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Sun className="w-8 h-8 text-[var(--golden-sun)]" />
                    <div>
                      <div className="text-xs text-[var(--earth-brown)]">Temperature</div>
                      <div className="font-bold text-[var(--deep-forest)]">{tree.weather.temp}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Droplets className="w-8 h-8 text-[var(--sky-blue)]" />
                    <div>
                      <div className="text-xs text-[var(--earth-brown)]">Humidity</div>
                      <div className="font-bold text-[var(--deep-forest)]">{tree.weather.humidity}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Wind className="w-8 h-8 text-gray-400" />
                    <div>
                      <div className="text-xs text-[var(--earth-brown)]">Rainfall</div>
                      <div className="font-bold text-[var(--deep-forest)]">{tree.weather.rainfall}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sun className="w-8 h-8 text-[var(--sunset-orange)]" />
                    <div>
                      <div className="text-xs text-[var(--earth-brown)]">Sunlight</div>
                      <div className="font-bold text-[var(--deep-forest)]">{tree.weather.sunlight}</div>
                    </div>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 p-4 bg-[var(--light-sage)] rounded-2xl"
                >
                  <p className="text-sm text-[var(--forest-green)]">
                    ☀️ Perfect conditions! Your tree is thriving today.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Details */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="mb-6">
              <h1 className="text-5xl font-bold text-[var(--deep-forest)] mb-4">{tree.name}</h1>
              <div className="flex items-center gap-6 text-[var(--earth-brown)] mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {tree.location}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Planted {tree.plantedDate}
                </div>
              </div>

              {/* Health Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[var(--deep-forest)]">Tree Health</span>
                  <span className="text-2xl font-bold text-[var(--forest-green)]">{tree.health}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${tree.health}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-[var(--leaf-green)] to-[var(--forest-green)] rounded-full"
                  />
                </div>
              </div>

              <p className="text-lg text-[var(--earth-brown)] leading-relaxed mb-8">
                {tree.description}
              </p>

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <InfoCard label="Expected Yield" value={tree.yield} icon={<Gift />} />
                <InfoCard label="Next Harvest" value={tree.nextHarvest} icon={<Calendar />} />
                <InfoCard label="Adopted" value={`${tree.adopted} times`} icon={<Award />} />
                <InfoCard label="GPS Location" value={tree.gpsCoords} icon={<MapPin />} />
              </div>

              {/* Farmer Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl mb-8"
              >
                <h3 className="font-bold text-[var(--deep-forest)] mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Meet Your Farmer
                </h3>
                <div className="flex items-center gap-4">
                  <img
                    src={tree.farmer.avatar}
                    alt={tree.farmer.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-bold text-[var(--deep-forest)]">{tree.farmer.name}</div>
                    <div className="text-sm text-[var(--earth-brown)]">
                      {tree.farmer.experience} of farming experience
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.button
                onClick={handleAdopt}
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(27, 67, 50, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-12 py-6 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white text-xl font-medium rounded-full shadow-2xl mb-4"
              >
                Adopt This Tree — {tree.price}
              </motion.button>
              <p className="text-center text-sm text-[var(--earth-brown)]">
                100% Organic • Real Harvest Delivery
              </p>
            </div>

            {/* Growth Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl"
            >
              <h3 className="font-bold text-[var(--deep-forest)] mb-6 flex items-center gap-2 text-2xl">
                <TrendingUp className="w-6 h-6" />
                Growth Timeline
              </h3>
              <div className="space-y-6">
                {tree.timeline.map((event, index) => (
                  <TimelineCard key={index} event={event} index={index} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isAdopting && setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl z-10 overflow-hidden"
            >
              {!adoptionDone ? (
                <>
                  {/* Step progress bar */}
                  <div className="flex border-b border-gray-100">
                    {(['details', 'address', 'payment'] as const).map((s, i) => (
                      <div key={s} className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider transition-all ${
                        modalStep === s
                          ? 'bg-[var(--forest-green)] text-white'
                          : i < ['details','address','payment'].indexOf(modalStep)
                            ? 'bg-[var(--light-sage)] text-[var(--forest-green)]'
                            : 'text-gray-300'
                      }`}>
                        {i + 1}. {s === 'details' ? 'Tree Details' : s === 'address' ? 'Delivery Address' : 'Confirm & Pay'}
                      </div>
                    ))}
                  </div>

                  <div className="p-8">
                    <button onClick={() => !isAdopting && setShowPaymentModal(false)} className="absolute top-14 right-5 p-2 rounded-full hover:bg-gray-100">
                      <X className="w-5 h-5 text-gray-400" />
                    </button>

                    {/* STEP 1: Tree details */}
                    {modalStep === 'details' && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0">
                            <img src={tree.image} alt={tree.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[var(--deep-forest)]">{tree.name}</h3>
                            <p className="text-[var(--forest-green)] font-bold">{tree.price} / year</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-[var(--deep-forest)] mb-1.5">Name Your Tree</label>
                            <input
                              type="text"
                              value={customTreeName}
                              onChange={e => setCustomTreeName(e.target.value)}
                              placeholder={`e.g. Grandpa's Mango`}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[var(--deep-forest)] mb-1.5">Occasion</label>
                            <select
                              value={occasionType}
                              onChange={e => setOccasionType(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] bg-white text-sm"
                            >
                              <option value="personal">Personal Gift to Myself</option>
                              <option value="birthday">Birthday Gift</option>
                              <option value="anniversary">Anniversary</option>
                              <option value="memorial">In Memory Of</option>
                              <option value="corporate">Corporate Green Pledge</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[var(--deep-forest)] mb-1.5">Dedication Message (optional)</label>
                            <textarea
                              value={dedicationMessage}
                              onChange={e => setDedicationMessage(e.target.value)}
                              placeholder="e.g. In memory of grandpa who loved mangoes..."
                              rows={2}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-sm resize-none"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => setModalStep('address')}
                          disabled={!customTreeName.trim()}
                          className="mt-6 w-full py-4 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          Next: Delivery Address <ChevronRight className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}

                    {/* STEP 2: Delivery address */}
                    {modalStep === 'address' && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="flex items-center gap-2 mb-5">
                          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[var(--deep-forest)] text-sm">Harvest Delivery Address</h3>
                            <p className="text-[10px] text-[var(--earth-brown)]">Where should your seasonal harvest be shipped? 🍊</p>
                          </div>
                        </div>

                        {/* Saved addresses */}
                        {savedAddresses.length > 0 && !addingNewAddress && (
                          <div className="space-y-2 mb-4">
                            {savedAddresses.map((addr, idx) => (
                              <button
                                key={idx}
                                onClick={() => { setSelectedAddressIdx(idx); setDeliveryAddress(addr); }}
                                className={`w-full text-left p-3 rounded-2xl border-2 transition-all ${
                                  selectedAddressIdx === idx
                                    ? 'border-[var(--forest-green)] bg-[var(--light-sage)]/30'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                      selectedAddressIdx === idx ? 'border-[var(--forest-green)]' : 'border-gray-300'
                                    }`}>
                                      {selectedAddressIdx === idx && (
                                        <div className="w-2 h-2 rounded-full bg-[var(--forest-green)]" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-[var(--deep-forest)] truncate">{addr.fullName} · {addr.phone}</p>
                                      <p className="text-[10px] text-[var(--earth-brown)] leading-relaxed mt-0.5">
                                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}
                                      </p>
                                    </div>
                                  </div>
                                  {selectedAddressIdx === idx && (
                                    <span className="text-[9px] font-black text-[var(--forest-green)] bg-[var(--light-sage)] px-2 py-0.5 rounded-full flex-shrink-0">Selected</span>
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
                              className="w-full py-2.5 border-2 border-dashed border-gray-300 hover:border-[var(--forest-green)] rounded-2xl text-xs font-bold text-[var(--earth-brown)] hover:text-[var(--forest-green)] transition-all flex items-center justify-center gap-1.5"
                            >
                              <Home className="w-3.5 h-3.5" /> + Add New Address
                            </button>
                          </div>
                        )}

                        {/* New address form */}
                        {addingNewAddress && (
                          <div className="space-y-3 mb-4">
                            {savedAddresses.length > 0 && (
                              <button
                                onClick={() => { setAddingNewAddress(false); setSelectedAddressIdx(0); setDeliveryAddress(savedAddresses[0]); }}
                                className="flex items-center gap-1 text-[10px] font-bold text-[var(--forest-green)] hover:underline mb-1"
                              >
                                <ChevronLeft className="w-3 h-3" /> Use saved address
                              </button>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-[var(--deep-forest)] mb-1 flex items-center gap-1">
                                  <User className="w-3 h-3" /> Full Name *
                                </label>
                                <input type="text" value={deliveryAddress.fullName}
                                  onChange={e => setDeliveryAddress(p => ({ ...p, fullName: e.target.value }))}
                                  placeholder="Rohan Sharma"
                                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-[var(--deep-forest)] mb-1 flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> Phone *
                                </label>
                                <input type="tel" value={deliveryAddress.phone}
                                  onChange={e => setDeliveryAddress(p => ({ ...p, phone: e.target.value }))}
                                  placeholder="+91 98765 43210"
                                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[var(--deep-forest)] mb-1 flex items-center gap-1">
                                <Home className="w-3 h-3" /> Address Line 1 *
                              </label>
                              <input type="text" value={deliveryAddress.line1}
                                onChange={e => setDeliveryAddress(p => ({ ...p, line1: e.target.value }))}
                                placeholder="Flat / House No., Building, Street"
                                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[var(--deep-forest)] mb-1">Address Line 2 (optional)</label>
                              <input type="text" value={deliveryAddress.line2}
                                onChange={e => setDeliveryAddress(p => ({ ...p, line2: e.target.value }))}
                                placeholder="Landmark, Area, Colony"
                                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-[var(--deep-forest)] mb-1">City *</label>
                                <input type="text" value={deliveryAddress.city}
                                  onChange={e => setDeliveryAddress(p => ({ ...p, city: e.target.value }))}
                                  placeholder="Mumbai"
                                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-[var(--deep-forest)] mb-1">State *</label>
                                <input type="text" value={deliveryAddress.state}
                                  onChange={e => setDeliveryAddress(p => ({ ...p, state: e.target.value }))}
                                  placeholder="Maharashtra"
                                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-[var(--deep-forest)] mb-1">Pincode *</label>
                                <input type="text" value={deliveryAddress.pincode}
                                  onChange={e => setDeliveryAddress(p => ({ ...p, pincode: e.target.value }))}
                                  placeholder="400050" maxLength={6}
                                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-xs"
                                />
                              </div>
                            </div>

                            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <p className="text-[10px] text-amber-700 leading-relaxed">
                                Shared only with your assigned farmer for seasonal harvest delivery.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 mt-2">
                          <button onClick={() => setModalStep('details')}
                            className="px-5 py-3 border-2 border-gray-200 rounded-2xl font-bold text-xs text-[var(--earth-brown)] hover:bg-gray-50 flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" /> Back
                          </button>
                          {addingNewAddress ? (
                            <button
                              onClick={() => { saveNewAddress(); setModalStep('payment'); }}
                              disabled={!deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.line1 || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode}
                              className="flex-1 py-3 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
                            >
                              Save & Continue <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setModalStep('payment')}
                              disabled={selectedAddressIdx === null}
                              className="flex-1 py-3 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
                            >
                              Use This Address <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: Review & Pay */}
                    {modalStep === 'payment' && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h3 className="font-bold text-[var(--deep-forest)] mb-4">Review Your Order</h3>

                        {/* Tree summary */}
                        <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--light-sage)]/30 rounded-2xl">
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={tree.image} alt={tree.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-[var(--deep-forest)] truncate">{customTreeName}</p>
                            <p className="text-[10px] text-[var(--earth-brown)]">{tree.name} · {occasionType}</p>
                          </div>
                          <p className="font-black text-[var(--forest-green)] text-sm flex-shrink-0">{tree.price}</p>
                        </div>

                        {/* Delivery address summary */}
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-2xl">
                          <div className="flex items-center gap-1.5 mb-2">
                            <MapPin className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Deliver Harvest To</span>
                          </div>
                          <p className="text-xs font-bold text-[var(--deep-forest)]">{deliveryAddress.fullName} · {deliveryAddress.phone}</p>
                          <p className="text-[10px] text-[var(--earth-brown)] mt-0.5 leading-relaxed">
                            {deliveryAddress.line1}{deliveryAddress.line2 ? `, ${deliveryAddress.line2}` : ''}, {deliveryAddress.city}, {deliveryAddress.state} — {deliveryAddress.pincode}
                          </p>
                        </div>

                        {/* Price breakdown */}
                        <div className="bg-[var(--light-sage)]/40 rounded-2xl p-4 mb-5 text-xs space-y-1.5 text-[var(--earth-brown)]">
                          <div className="flex justify-between"><span>Tree Adoption (12 months)</span><span className="font-bold text-[var(--deep-forest)]">{tree.price}</span></div>
                                <div className="flex justify-between"><span>Harvest Delivery</span><span className="font-bold text-green-600">Included</span></div>
                          <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-[var(--deep-forest)]"><span>Total</span><span>{tree.price}</span></div>
                        </div>

                        <div className="flex gap-3">
                          <button onClick={() => setModalStep('address')}
                            className="px-5 py-3 border-2 border-gray-200 rounded-2xl font-bold text-xs text-[var(--earth-brown)] hover:bg-gray-50 flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" /> Back
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleConfirmPayment}
                            disabled={isAdopting}
                            className="flex-1 py-3 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 text-xs"
                          >
                            {isAdopting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Confirm & Pay {tree.price}</>}
                          </motion.button>
                        </div>
                        <p className="text-center text-[10px] text-gray-400 mt-3">Secured by Razorpay · 100% Safe</p>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12 px-8 space-y-4">
                  <CheckCircle className="w-20 h-20 text-[var(--leaf-green)] mx-auto" />
                  <h3 className="text-2xl font-bold text-[var(--deep-forest)]">Adoption Complete! 🌳</h3>
                  <p className="text-[var(--earth-brown)] text-sm">Your harvest will be delivered to<br />
                    <span className="font-bold text-[var(--deep-forest)]">{deliveryAddress.city}, {deliveryAddress.state}</span>
                  </p>
                  <p className="text-xs text-gray-400">Redirecting to your orchard...</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md">
      <div className="text-[var(--forest-green)] mb-2">{icon}</div>
      <div className="text-xs text-[var(--earth-brown)] mb-1">{label}</div>
      <div className="font-bold text-[var(--deep-forest)]">{value}</div>
    </div>
  );
}

function TimelineCard({ event, index }: { event: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex gap-4 group"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        </div>
        {index < 2 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-[var(--forest-green)]/30" />
        )}
      </div>
      <div className="flex-1 pb-8">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-bold text-[var(--deep-forest)]">{event.title}</h4>
          <span className="text-sm text-[var(--earth-brown)]">{event.date}</span>
        </div>
        <p className="text-[var(--earth-brown)] text-sm leading-relaxed">{event.description}</p>
      </div>
    </motion.div>
  );
}
