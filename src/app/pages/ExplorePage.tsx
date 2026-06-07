import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Leaf, Heart, Camera, Sparkles, TreePine, Navigation, X, Loader2 } from 'lucide-react';
import { FloatingParticles } from '../components/FloatingParticles';
import { api, formatImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { haversineKm, geocode, FARM_COORDS } from '../utils/geo';

const RADIUS_KM = 200;

const staticTrees = [
  { id: 1, name: 'Royal Alphonso Mango', type: 'Mango', location: 'Ratnagiri, Maharashtra', farmer: 'Ramesh Patil', image: 'https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600', price: '₹4,999', yield: '15-20 kg', health: 95, organic: true, adopted: 12 },
  { id: 2, name: 'Himalayan Apple', type: 'Apple', location: 'Shimla, Himachal Pradesh', farmer: 'Suresh Kumar', image: 'https://images.unsplash.com/photo-1628486930648-fed98c4d56cb?w=600', price: '₹6,999', yield: '25-30 kg', health: 98, organic: true, adopted: 34 },
  { id: 3, name: 'Nagpur Orange', type: 'Orange', location: 'Nagpur, Maharashtra', farmer: 'Anjali Sharma', image: 'https://images.unsplash.com/photo-1667559794596-27c6019ba5b6?w=600', price: '₹3,999', yield: '30-35 kg', health: 92, organic: true, adopted: 8 },
  { id: 4, name: 'Kesar Mango', type: 'Mango', location: 'Junagadh, Gujarat', farmer: 'Vikram Patel', image: 'https://images.unsplash.com/photo-1759162339512-c2e0f23d4dff?w=600', price: '₹5,499', yield: '18-22 kg', health: 96, organic: true, adopted: 21 },
  { id: 5, name: 'Kashmir Apple', type: 'Apple', location: 'Srinagar, Kashmir', farmer: 'Farooq Ahmad', image: 'https://images.unsplash.com/photo-1680093762189-7c139cc3aa8e?w=600', price: '₹7,999', yield: '20-25 kg', health: 94, organic: true, adopted: 45 },
  { id: 6, name: 'Coorg Orange', type: 'Orange', location: 'Coorg, Karnataka', farmer: 'Lakshmi Rao', image: 'https://images.unsplash.com/photo-1722441297028-1144bcdc231c?w=600', price: '₹4,499', yield: '28-32 kg', health: 90, organic: false, adopted: 15 },
];

export function ExplorePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [backendTrees, setBackendTrees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Proximity state
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [proximityActive, setProximityActive] = useState(false);
  const [proximityLoading, setProximityLoading] = useState(false);
  const [proximityLabel, setProximityLabel] = useState('');
  const [proximityError, setProximityError] = useState('');

  useEffect(() => {
    async function loadTrees() {
      setIsLoading(true);
      try {
        const data = await api.trees.list(selectedType || undefined, searchQuery || undefined);
        setBackendTrees(data);
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
    const t = setTimeout(loadTrees, 300);
    return () => clearTimeout(t);
  }, [selectedType, searchQuery]);

  // Auto-detect user location from saved delivery address (pincode/city)
  useEffect(() => {
    if (!user?.id) return;
    const stored = localStorage.getItem(`delivery_addresses_${user.id}`);
    if (!stored) return;
    const addresses = JSON.parse(stored);
    if (!addresses?.length) return;
    const primary = addresses[0];
    const query = primary.pincode || `${primary.city}, ${primary.state}`;
    setProximityLoading(true);
    setProximityLabel(`${primary.city}, ${primary.state}`);
    geocode(query).then(coords => {
      if (coords) {
        setUserCoords(coords);
        setProximityActive(true);
      }
      setProximityLoading(false);
    });
  }, [user?.id]);

  const activateGPS = useCallback(() => {
    setProximityError('');
    setProximityLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setProximityActive(true);
        setProximityLabel('your current location');
        setProximityLoading(false);
      },
      () => {
        setProximityError('Location access denied. Please allow location or use your saved address.');
        setProximityLoading(false);
      }
    );
  }, []);

  function mapTreeData(tree: any) {
    if (tree.fruit_type) {
      return {
        id: tree.id,
        name: `Royal ${tree.fruit_type}`,
        type: tree.fruit_type,
        location: tree.farm?.farmer?.location || 'Ratnagiri, Maharashtra',
        farmer: tree.farm?.farmer?.farm_name || 'Ramesh Patil',
        image: formatImageUrl(tree.tree_images?.[0]) || 'https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600',
        price: `₹${parseFloat(tree.price).toLocaleString('en-IN')}`,
        yield: `${tree.expected_yield} kg`,
        health: Math.round(tree.health_score * 10),
        organic: tree.farm?.farmer?.organic_certified ?? true,

        adopted: 12,
        lat: tree.farm?.farmer?.latitude,
        lon: tree.farm?.farmer?.longitude,
      };
    }
    return tree;
  }

  const activeTrees = (backendTrees.length > 0 ? backendTrees : (isLoading ? [] : staticTrees)).map(mapTreeData);

  // Attach distance to each tree
  const treesWithDistance = activeTrees.map(tree => {
    let distKm: number | null = null;
    if (userCoords) {
      const farmCoords =
        (tree.lat && tree.lon)
          ? { lat: tree.lat, lon: tree.lon }
          : FARM_COORDS[tree.location] ?? null;
      if (farmCoords) {
        distKm = Math.round(haversineKm(userCoords.lat, userCoords.lon, farmCoords.lat, farmCoords.lon));
      }
    }
    return { ...tree, distKm };
  });

  const filteredTrees = treesWithDistance
    .filter(tree => {
      const matchesSearch =
        tree.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tree.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !selectedType || tree.type === selectedType;
      const matchesRadius = !proximityActive || tree.distKm === null || tree.distKm <= RADIUS_KM;
      return matchesSearch && matchesType && matchesRadius;
    })
    .sort((a, b) => {
      // When proximity active: sort by distance, nulls last
      if (proximityActive) {
        if (a.distKm === null && b.distKm === null) return 0;
        if (a.distKm === null) return 1;
        if (b.distKm === null) return -1;
        return a.distKm - b.distKm;
      }
      return 0;
    });

  const nearbyCount = treesWithDistance.filter(t => t.distKm !== null && t.distKm <= RADIUS_KM).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-24 pb-20">
      <FloatingParticles />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-6xl font-bold text-[var(--deep-forest)] mb-4">Find Your Perfect Tree</h1>
          <p className="text-xl text-[var(--earth-brown)] max-w-2xl mx-auto">
            Browse premium fruit trees from certified organic farms
          </p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8 space-y-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--earth-brown)]" />
            <input
              type="text"
              placeholder="Search by tree name or location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white/80 backdrop-blur-sm rounded-full border-2 border-[var(--forest-green)]/20 focus:border-[var(--forest-green)] outline-none transition-all shadow-lg text-lg"
            />
          </div>

          {/* Filter chips + proximity toggle */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <FilterChip label="All Trees" active={!selectedType} onClick={() => setSelectedType(null)} />
            <FilterChip label="Mango" active={selectedType === 'Mango'} onClick={() => setSelectedType('Mango')} />
            <FilterChip label="Apple" active={selectedType === 'Apple'} onClick={() => setSelectedType('Apple')} />
            <FilterChip label="Orange" active={selectedType === 'Orange'} onClick={() => setSelectedType('Orange')} />

            {/* Proximity toggle */}
            {proximityActive ? (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="flex items-center gap-2 px-5 py-3 bg-[var(--forest-green)] text-white rounded-full shadow-md text-sm font-bold"
              >
                <Navigation className="w-4 h-4" />
                Within {RADIUS_KM} km of {proximityLabel}
                <button onClick={() => { setProximityActive(false); setUserCoords(null); setProximityLabel(''); }}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={activateGPS}
                disabled={proximityLoading}
                className="px-5 py-3 bg-white rounded-full border-2 border-[var(--forest-green)]/30 hover:border-[var(--forest-green)] transition-all shadow-md flex items-center gap-2 text-sm font-medium text-[var(--earth-brown)] disabled:opacity-60"
              >
                {proximityLoading
                  ? <Loader2 className="w-4 h-4 animate-spin text-[var(--forest-green)]" />
                  : <Navigation className="w-4 h-4 text-[var(--forest-green)]" />
                }
                Near Me ({RADIUS_KM} km)
              </motion.button>
            )}
          </div>

          {/* Proximity error */}
          {proximityError && (
            <p className="text-center text-sm text-red-500">{proximityError}</p>
          )}
        </motion.div>

        {/* Proximity banner */}
        {proximityActive && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-6 px-5 py-3 bg-[var(--light-sage)]/60 border border-[var(--forest-green)]/20 rounded-2xl flex items-center gap-3 text-sm text-[var(--deep-forest)]"
          >
            <MapPin className="w-4 h-4 text-[var(--forest-green)] flex-shrink-0" />
            <span>
              Showing <span className="font-bold text-[var(--forest-green)]">{nearbyCount} farms</span> within{' '}
              <span className="font-bold">{RADIUS_KM} km</span> of {proximityLabel}.{' '}
              <button onClick={() => setProximityActive(false)} className="underline text-[var(--earth-brown)] hover:text-[var(--forest-green)]">
                Show all
              </button>
            </span>
          </motion.div>
        )}

        {/* Results count */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8 text-center">
          <p className="text-[var(--earth-brown)]">
            Showing <span className="font-bold text-[var(--forest-green)]">{filteredTrees.length}</span> trees
          </p>
        </motion.div>

        {/* Tree Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredTrees.map((tree, index) => (
              <TreeCard key={tree.id} tree={tree} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredTrees.length === 0 && !isLoading && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <TreePine className="w-20 h-20 text-[var(--forest-green)] mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold text-[var(--deep-forest)] mb-2">
              {proximityActive ? `No farms within ${RADIUS_KM} km` : 'No trees found'}
            </h3>
            <p className="text-[var(--earth-brown)] mb-4">
              {proximityActive ? 'Try expanding your search or browse all farms.' : 'Try adjusting your search or filters.'}
            </p>
            {proximityActive && (
              <button onClick={() => setProximityActive(false)}
                className="px-6 py-3 bg-[var(--forest-green)] text-white rounded-full font-bold text-sm hover:bg-[var(--deep-forest)] transition-all"
              >
                Show All Farms
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClick}
      className={`px-6 py-3 rounded-full transition-all shadow-md ${
        active
          ? 'bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white'
          : 'bg-white text-[var(--earth-brown)] border-2 border-[var(--forest-green)]/20'
      }`}
    >
      {label}
    </motion.button>
  );
}

function TreeCard({ tree, index }: { tree: any; index: number }) {
  const [liked, setLiked] = useState(false);
  const isNearby = tree.distKm !== null && tree.distKm <= RADIUS_KM;

  return (
    <motion.div layout initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }} whileHover={{ y: -10 }}
      className="bg-white rounded-3xl overflow-hidden shadow-xl group"
    >
      <Link to={`/tree/${tree.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <motion.img whileHover={{ scale: 1.1 }} transition={{ duration: 0.6 }}
            src={tree.image} alt={tree.name} className="w-full h-full object-cover"
          />

          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {tree.organic && (
              <div className="px-3 py-1.5 bg-[var(--leaf-green)]/90 backdrop-blur-sm text-white text-sm rounded-full flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Organic
              </div>
            )}

            {/* Distance badge */}
            {tree.distKm !== null && (
              <div className={`px-3 py-1.5 backdrop-blur-sm text-white text-sm rounded-full flex items-center gap-1 font-bold ${
                isNearby ? 'bg-[var(--forest-green)]/90' : 'bg-gray-600/80'
              }`}>
                <Navigation className="w-3 h-3" />
                {tree.distKm < 1 ? '<1' : tree.distKm} km
              </div>
            )}
          </div>

          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={e => { e.preventDefault(); setLiked(!liked); }}
            className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
          >
            <Heart className={`w-5 h-5 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-[var(--earth-brown)]'}`} />
          </motion.button>

          <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-6"
          >
            <div className="text-white">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{tree.location}</span>
              </div>
              <div className="text-sm opacity-90">by {tree.farmer}</div>
            </div>
          </motion.div>
        </div>
      </Link>

      <div className="p-6">
        <Link to={`/tree/${tree.id}`}>
          <h3 className="text-xl font-bold text-[var(--deep-forest)] mb-3 group-hover:text-[var(--forest-green)] transition-colors">
            {tree.name}
          </h3>
        </Link>

        {/* Nearby highlight */}
        {isNearby && (
          <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[var(--forest-green)] bg-[var(--light-sage)]/40 px-3 py-1.5 rounded-full w-fit">
            <Navigation className="w-3 h-3" /> {tree.distKm} km from you
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--earth-brown)]">Tree Health</span>
            <span className="text-sm font-bold text-[var(--forest-green)]">{tree.health}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${tree.health}%` }} transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-[var(--leaf-green)] to-[var(--forest-green)] rounded-full"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-[var(--earth-brown)]">Expected Yield</div>
            <div className="font-bold text-[var(--forest-green)]">{tree.yield}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--earth-brown)]">Adopted</div>
            <div className="font-bold text-[var(--sunset-orange)]">{tree.adopted} times</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-2xl font-bold text-[var(--deep-forest)]">{tree.price}</div>
          <Link to={`/tree/${tree.id}`}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white rounded-full font-medium shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Adopt Now
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
