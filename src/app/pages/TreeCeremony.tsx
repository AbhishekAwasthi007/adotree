import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Gift, Baby, Calendar, Users, TreePine, MapPin, Home, Phone, User } from 'lucide-react';

const occasions = [
  { id: 'birthday', label: 'Birthday', icon: Gift, color: '#F4A261' },
  { id: 'anniversary', label: 'Anniversary', icon: Heart, color: '#d4183d' },
  { id: 'wedding', label: 'Wedding', icon: Heart, color: '#FFB703' },
  { id: 'memorial', label: 'Memorial', icon: Sparkles, color: '#90E0EF' },
  { id: 'friendship', label: 'Friendship', icon: Users, color: '#52B788' },
  { id: 'childbirth', label: 'Child Birth', icon: Baby, color: '#F4A261' },
  { id: 'personal', label: 'Personal Growth', icon: TreePine, color: '#1B4332' },
];

interface DeliveryAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export function TreeCeremony() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'welcome' | 'naming' | 'occasion' | 'dedication' | 'address' | 'reveal'>('welcome');
  const [treeName, setTreeName] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [dedication, setDedication] = useState('');
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: ''
  });

  const handleNext = () => {
    if (step === 'welcome') setStep('naming');
    else if (step === 'naming' && treeName) setStep('occasion');
    else if (step === 'occasion' && selectedOccasion) setStep('dedication');
    else if (step === 'dedication') setStep('address');
    else if (step === 'address') setStep('reveal');
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[var(--deep-forest)] via-[#0a2518] to-black overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Floating Particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 100,
              opacity: 0,
            }}
            animate={{
              y: -100,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'linear',
            }}
            className="absolute w-2 h-2 bg-[var(--golden-sun)] rounded-full blur-sm"
          />
        ))}

        {/* Fireflies */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`firefly-${i}`}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full shadow-[0_0_10px_rgba(255,255,0,0.8)]"
          />
        ))}

        {/* Mystic Glow */}
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--leaf-green)] rounded-full blur-[120px]"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <AnimatePresence mode="wait">
          {step === 'welcome' && <WelcomeStep onNext={handleNext} />}
          {step === 'naming' && (
            <NamingStep
              treeName={treeName}
              setTreeName={setTreeName}
              onNext={handleNext}
            />
          )}
          {step === 'occasion' && (
            <OccasionStep
              selectedOccasion={selectedOccasion}
              setSelectedOccasion={setSelectedOccasion}
              onNext={handleNext}
            />
          )}
          {step === 'dedication' && (
            <DedicationStep
              dedication={dedication}
              setDedication={setDedication}
              onNext={handleNext}
            />
          )}
          {step === 'address' && (
            <AddressStep
              address={address}
              setAddress={setAddress}
              onNext={handleNext}
            />
          )}
          {step === 'reveal' && (
            <RevealStep
              treeName={treeName}
              occasion={selectedOccasion}
              dedication={dedication}
              address={address}
              onComplete={() => navigate('/orchard')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8 }}
      className="text-center max-w-2xl"
    >
      {/* Animated Tree */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1.5, type: 'spring' }}
        className="mb-8 relative"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-[var(--golden-sun)] blur-3xl"
        />
        <TreePine className="w-32 h-32 text-[var(--leaf-green)] mx-auto relative z-10" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-6xl font-bold text-white mb-6"
      >
        Congratulations! 🌱
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-2xl text-[var(--light-sage)] mb-12"
      >
        You are now the guardian of a living tree.
        <br />
        Let's celebrate this sacred bond.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileHover={{ scale: 1.1, boxShadow: '0 0 40px rgba(255, 183, 3, 0.5)' }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        className="px-12 py-5 bg-gradient-to-r from-[var(--golden-sun)] to-[var(--sunset-orange)] text-white text-xl font-medium rounded-full shadow-2xl"
      >
        Begin Ceremony
      </motion.button>
    </motion.div>
  );
}

function NamingStep({
  treeName,
  setTreeName,
  onNext,
}: {
  treeName: string;
  setTreeName: (name: string) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-2xl w-full"
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold text-white mb-6"
      >
        What would you like to name your tree?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-[var(--light-sage)] mb-12"
      >
        Choose a name that holds meaning for you
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative mb-12"
      >
        <input
          type="text"
          value={treeName}
          onChange={(e) => setTreeName(e.target.value)}
          placeholder="Enter tree name..."
          autoFocus
          className="w-full px-8 py-6 bg-white/10 backdrop-blur-xl border-2 border-[var(--golden-sun)]/30 focus:border-[var(--golden-sun)] rounded-3xl text-white text-2xl text-center placeholder-white/50 outline-none transition-all"
        />
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-transparent via-[var(--golden-sun)] to-transparent"
        />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        disabled={!treeName.trim()}
        className="px-12 py-5 bg-gradient-to-r from-[var(--golden-sun)] to-[var(--sunset-orange)] text-white text-xl font-medium rounded-full shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </motion.button>
    </motion.div>
  );
}

function OccasionStep({
  selectedOccasion,
  setSelectedOccasion,
  onNext,
}: {
  selectedOccasion: string | null;
  setSelectedOccasion: (occasion: string) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-4xl w-full"
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold text-white mb-6"
      >
        What's the occasion?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-[var(--light-sage)] mb-12"
      >
        Select what this tree represents for you
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
      >
        {occasions.map((occasion, index) => {
          const Icon = occasion.icon;
          const isSelected = selectedOccasion === occasion.id;

          return (
            <motion.button
              key={occasion.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedOccasion(occasion.id)}
              className={`relative p-8 rounded-3xl transition-all ${
                isSelected
                  ? 'bg-white/20 border-2 border-[var(--golden-sun)] shadow-[0_0_30px_rgba(255,183,3,0.3)]'
                  : 'bg-white/5 border-2 border-white/10 hover:bg-white/10'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="selectedOccasion"
                  className="absolute inset-0 bg-gradient-to-br from-[var(--golden-sun)]/20 to-transparent rounded-3xl"
                />
              )}
              <Icon className="w-12 h-12 mx-auto mb-3 text-white" style={{ color: occasion.color }} />
              <div className="text-white font-medium">{occasion.label}</div>
            </motion.button>
          );
        })}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        disabled={!selectedOccasion}
        className="px-12 py-5 bg-gradient-to-r from-[var(--golden-sun)] to-[var(--sunset-orange)] text-white text-xl font-medium rounded-full shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </motion.button>
    </motion.div>
  );
}

function DedicationStep({
  dedication,
  setDedication,
  onNext,
}: {
  dedication: string;
  setDedication: (text: string) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-2xl w-full"
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold text-white mb-6"
      >
        Add a dedication message
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-[var(--light-sage)] mb-12"
      >
        Share your wishes and intentions for this tree
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-12"
      >
        <textarea
          value={dedication}
          onChange={(e) => setDedication(e.target.value)}
          placeholder="Write your dedication..."
          autoFocus
          rows={6}
          className="w-full px-8 py-6 bg-white/10 backdrop-blur-xl border-2 border-[var(--golden-sun)]/30 focus:border-[var(--golden-sun)] rounded-3xl text-white text-lg placeholder-white/50 outline-none transition-all resize-none"
        />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        className="px-12 py-5 bg-gradient-to-r from-[var(--golden-sun)] to-[var(--sunset-orange)] text-white text-xl font-medium rounded-full shadow-2xl"
      >
        Complete Ceremony
      </motion.button>
    </motion.div>
  );
}

function AddressStep({
  address,
  setAddress,
  onNext,
}: {
  address: DeliveryAddress;
  setAddress: (a: DeliveryAddress) => void;
  onNext: () => void;
}) {
  const set = (field: keyof DeliveryAddress) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress({ ...address, [field]: e.target.value });

  const isValid = address.fullName && address.phone && address.line1 && address.city && address.state && address.pincode;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-2xl w-full"
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="w-16 h-16 rounded-full bg-[var(--golden-sun)]/20 border-2 border-[var(--golden-sun)]/40 flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-[var(--golden-sun)]" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-3">Harvest Delivery Address</h2>
        <p className="text-lg text-[var(--light-sage)]">
          Where should your seasonal harvest be delivered? 🍊
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 space-y-4 text-left mb-8"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--light-sage)] mb-1.5 flex items-center gap-1">
              <User className="w-3 h-3" /> Full Name *
            </label>
            <input
              type="text"
              value={address.fullName}
              onChange={set('fullName')}
              placeholder="Rohan Sharma"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 focus:border-[var(--golden-sun)] rounded-xl text-white placeholder-white/40 outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--light-sage)] mb-1.5 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Phone Number *
            </label>
            <input
              type="tel"
              value={address.phone}
              onChange={set('phone')}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 focus:border-[var(--golden-sun)] rounded-xl text-white placeholder-white/40 outline-none text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--light-sage)] mb-1.5 flex items-center gap-1">
            <Home className="w-3 h-3" /> Address Line 1 *
          </label>
          <input
            type="text"
            value={address.line1}
            onChange={set('line1')}
            placeholder="Flat / House No., Building, Street"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 focus:border-[var(--golden-sun)] rounded-xl text-white placeholder-white/40 outline-none text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--light-sage)] mb-1.5">Address Line 2 (optional)</label>
          <input
            type="text"
            value={address.line2}
            onChange={set('line2')}
            placeholder="Landmark, Area, Colony"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 focus:border-[var(--golden-sun)] rounded-xl text-white placeholder-white/40 outline-none text-sm transition-all"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--light-sage)] mb-1.5">City *</label>
            <input
              type="text"
              value={address.city}
              onChange={set('city')}
              placeholder="Mumbai"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 focus:border-[var(--golden-sun)] rounded-xl text-white placeholder-white/40 outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--light-sage)] mb-1.5">State *</label>
            <input
              type="text"
              value={address.state}
              onChange={set('state')}
              placeholder="Maharashtra"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 focus:border-[var(--golden-sun)] rounded-xl text-white placeholder-white/40 outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--light-sage)] mb-1.5">Pincode *</label>
            <input
              type="text"
              value={address.pincode}
              onChange={set('pincode')}
              placeholder="400050"
              maxLength={6}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 focus:border-[var(--golden-sun)] rounded-xl text-white placeholder-white/40 outline-none text-sm transition-all"
            />
          </div>
        </div>

        <div className="flex items-start gap-2 bg-[var(--golden-sun)]/10 border border-[var(--golden-sun)]/20 rounded-xl p-3">
          <MapPin className="w-4 h-4 text-[var(--golden-sun)] flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-[var(--light-sage)] leading-relaxed">
            Your address is shared only with your assigned farmer for seasonal harvest delivery. It is never sold or shared with third parties.
          </p>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        disabled={!isValid}
        className="px-12 py-5 bg-gradient-to-r from-[var(--golden-sun)] to-[var(--sunset-orange)] text-white text-xl font-medium rounded-full shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm Address
      </motion.button>
    </motion.div>
  );
}

function RevealStep({
  treeName,
  occasion,
  dedication,
  address,
  onComplete,
}: {
  treeName: string;
  occasion: string | null;
  dedication: string;
  address: DeliveryAddress;
  onComplete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, type: 'spring' }}
      className="text-center max-w-3xl"
    >
      {/* Animated Tree with Bloom */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, type: 'spring', bounce: 0.5 }}
        className="relative mb-8"
      >
        {/* Roots Animation */}
        <motion.div
          initial={{ scaleY: 0, originY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-32 bg-gradient-to-b from-[var(--earth-brown)] to-transparent"
        />

        {/* Glow Effect */}
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-[var(--golden-sun)] blur-3xl"
        />

        {/* Tree Icon */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <TreePine className="w-40 h-40 text-[var(--leaf-green)] mx-auto relative z-10" />
        </motion.div>

        {/* Leaves Blooming */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: 0 }}
            animate={{
              scale: [0, 1.5, 1],
              rotate: 360,
              x: Math.cos((i / 12) * Math.PI * 2) * 80,
              y: Math.sin((i / 12) * Math.PI * 2) * 80,
            }}
            transition={{ duration: 1, delay: 1 + i * 0.05 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Sparkles className="w-6 h-6 text-[var(--golden-sun)]" />
          </motion.div>
        ))}
      </motion.div>

      {/* Tree Name Reveal */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2 }}
          className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--golden-sun)] via-[var(--sunset-orange)] to-[var(--golden-sun)] mb-4"
        >
          {treeName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="text-3xl text-white mb-8"
        >
          Your Guardian Tree
        </motion.p>

        {dedication && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3 }}
            className="max-w-xl mx-auto mb-6 p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10"
          >
            <p className="text-[var(--light-sage)] text-lg italic leading-relaxed">{dedication}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.2 }}
          className="max-w-xl mx-auto mb-12 p-5 bg-white/5 backdrop-blur-xl rounded-3xl border border-[var(--golden-sun)]/20 text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-[var(--golden-sun)]" />
            <span className="text-xs font-bold text-[var(--golden-sun)] uppercase tracking-wider">Harvest Delivery Address Saved</span>
          </div>
          <p className="text-sm text-white font-bold">{address.fullName} &middot; {address.phone}</p>
          <p className="text-xs text-[var(--light-sage)] mt-1">
            {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} &mdash; {address.pincode}
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5 }}
          whileHover={{ scale: 1.1, boxShadow: '0 0 40px rgba(255, 183, 3, 0.5)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete}
          className="px-12 py-5 bg-gradient-to-r from-[var(--golden-sun)] to-[var(--sunset-orange)] text-white text-xl font-medium rounded-full shadow-2xl"
        >
          Visit My Orchard
        </motion.button>
      </motion.div>

      {/* Confetti Effect */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={`confetti-${i}`}
          initial={{
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            opacity: 1,
          }}
          animate={{
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 500,
            y: window.innerHeight + 100,
            opacity: 0,
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: Math.random() * 2 + 1,
            delay: 2 + Math.random(),
            ease: 'easeOut',
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: ['#FFB703', '#F4A261', '#52B788', '#90E0EF'][Math.floor(Math.random() * 4)],
          }}
        />
      ))}
    </motion.div>
  );
}
