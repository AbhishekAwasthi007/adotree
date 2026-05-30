import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { toast } from 'sonner';
import { FarmerDashboard } from './FarmerDashboard';
import {
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Video,
  VideoOff,
  BookOpen,
  Award,
  DollarSign,
  AlertCircle,
  Activity,
  TreePine,
  ClipboardList,
  Camera,
  MapPin,
  Calendar,
  Sparkles,
  Loader2
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [showFarmerOS, setShowFarmerOS] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'farmer') {
        setShowFarmerOS(true);
      }
    }
  }, [user]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'farmers' | 'users' | 'farmer-trees' | 'add-tree' | 'farms'>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [trees, setTrees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for Farmer features
  const [selectedTree, setSelectedTree] = useState<any>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);

  // Story Form State
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDesc, setStoryDesc] = useState('');
  const [storyMedia, setStoryMedia] = useState('');

  // Harvest Form State
  const [harvestQty, setHarvestQty] = useState('');
  const [harvestGrade, setHarvestGrade] = useState('A');

  // Add Tree Form State
  const [newTreeFarmId, setNewTreeFarmId] = useState('');
  const [newTreeFruitType, setNewTreeFruitType] = useState('Mango');
  const [newTreeAge, setNewTreeAge] = useState('3');
  const [newTreeHealth, setNewTreeHealth] = useState('9.5');
  const [newTreeYield, setNewTreeYield] = useState('15.0');
  const [newTreePrice, setNewTreePrice] = useState('4999');
  const [newTreeImage, setNewTreeImage] = useState('https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600');
  const [newTreeCam, setNewTreeCam] = useState(true);

  // Add Farm Form State
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmSoil, setNewFarmSoil] = useState('');
  const [newFarmSize, setNewFarmSize] = useState('10');
  const [newFarmImage, setNewFarmImage] = useState('https://images.unsplash.com/photo-1775298116276-56bad682022f?w=1200');

  useEffect(() => {
    // Determine default tab based on role
    if (user) {
      if (user.role === 'admin') {
        setActiveTab('analytics');
      } else if (user.role === 'farmer') {
        setActiveTab('farmer-trees');
      }
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (user?.role === 'admin') {
        // Fetch Admin data
        const [analyticsData, usersData, farmersData, farmsData, treesData] = await Promise.all([
          api.admin.getAnalytics().catch(() => null),
          api.admin.getUsers().catch(() => []),
          api.admin.getFarmers().catch(() => []),
          api.farms.list().catch(() => []),
          api.trees.list().catch(() => [])
        ]);
        setAnalytics(analyticsData);
        setUsers(usersData || []);
        setFarmers(farmersData || []);
        setFarms(farmsData || []);
        setTrees(treesData || []);
      } else if (user?.role === 'farmer') {
        // Fetch Farmer data — use farmer-specific endpoint for own trees
        const [farmsData, treesData] = await Promise.all([
          api.farms.list().catch(() => []),
          api.farmer.getTrees().catch(() => [])
        ]);
        setFarms(farmsData || []);
        setTrees(treesData || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      toast.error("Error loading dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Admin: Approve Farmer
  const handleApproveFarmer = async (farmerId: string, verify: boolean) => {
    try {
      await api.admin.approveFarmer(farmerId, verify);
      toast.success(verify ? "Farmer verified successfully!" : "Farmer verification revoked.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update farmer verification status.");
    }
  };

  // Farmer: Add Tree
  const handleAddTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreeFarmId) {
      toast.error("Please select a farm first.");
      return;
    }
    try {
      await api.farmer.createTree({
        farm_id: newTreeFarmId,
        fruit_type: newTreeFruitType,
        tree_age: parseInt(newTreeAge),
        health_score: parseFloat(newTreeHealth),
        expected_yield: parseFloat(newTreeYield),
        price: parseFloat(newTreePrice),
        tree_images: [newTreeImage],
        live_camera_enabled: newTreeCam,
      });
      toast.success("New tree added to your farm catalog!");
      // Reset form
      setNewTreeAge('3');
      setNewTreeHealth('9.5');
      setNewTreeYield('15.0');
      setNewTreePrice('4999');
      // Reload lists
      loadData();
      setActiveTab('farmer-trees');
    } catch (err: any) {
      toast.error(err.message || "Failed to add tree.");
    }
  };

  // Farmer: Add Farm
  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.farms.create({
        name: newFarmName,
        cover_image: newFarmImage,
        gallery: [newFarmImage],
        soil_type: newFarmSoil,
        farm_size: parseFloat(newFarmSize)
      });
      toast.success("Farm created successfully!");
      setShowAddFarmModal(false);
      setNewFarmName('');
      setNewFarmSoil('');
      setNewFarmSize('10');
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create farm.");
    }
  };

  // Farmer: Log Story/Timeline Memory
  const handlePostStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTree) return;
    try {
      const mediaList = storyMedia ? [storyMedia] : [];
      await api.farmer.uploadStory(storyTitle, storyDesc, mediaList, selectedTree.id);
      toast.success("Growth update published to tree guardian's timeline!");
      setShowStoryModal(false);
      setStoryTitle('');
      setStoryDesc('');
      setStoryMedia('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to post timeline update.");
    }
  };

  // Farmer: Log Harvest
  const handleLogHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTree) return;
    try {
      await api.farmer.createHarvest({
        tree_id: selectedTree.id,
        quantity: parseFloat(harvestQty),
        quality_grade: harvestGrade,
      });
      toast.success("Harvest recorded! Delivery dispatched to guardian.");
      setShowHarvestModal(false);
      setHarvestQty('');
      setHarvestGrade('A');
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to record harvest.");
    }
  };

  // Farmer: Toggle Livestream
  const handleToggleLivestream = async (tree: any) => {
    const nextState = !tree.live_camera_enabled;
    try {
      await api.farmer.controlLivestream(tree.id, nextState);
      toast.success(nextState ? "Livestream started!" : "Livestream stopped.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle livestream.");
    }
  };

  // ── Farmer with pending approval → show waiting screen ──
  if (user && user.role === 'farmer' && user.farmer_status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pt-24 pb-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto px-6"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-amber-200 text-center space-y-6">
            {/* Animated icon */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="inline-block p-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full"
            >
              <TreePine className="w-16 h-16 text-amber-600" />
            </motion.div>

            <h2 className="text-3xl font-bold text-[var(--deep-forest)]">
              Verification In Progress 🌾
            </h2>
            <p className="text-[var(--earth-brown)] leading-relaxed">
              Welcome, <strong>{user.name}</strong>! Your farmer profile has been submitted for admin review. 
              Once verified, you'll unlock the complete Farmer Operating System.
            </p>

            {/* Status Steps */}
            <div className="bg-amber-50 rounded-2xl p-6 space-y-4 text-left border border-amber-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--deep-forest)]">Account Created</p>
                  <p className="text-sm text-[var(--earth-brown)]">Phone verified & farmer profile generated</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--deep-forest)]">Admin Review</p>
                  <p className="text-sm text-amber-600">Your application is being reviewed…</p>
                </div>
              </div>
              <div className="flex items-center gap-4 opacity-40">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-400">Farmer Dashboard</p>
                  <p className="text-sm text-gray-400">Full access after approval</p>
                </div>
              </div>
            </div>

            {/* Check Again button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                toast.info("Checking approval status...");
                const { refreshUserProfile } = await import('../context/AuthContext').then(m => {
                  // Actually we need to re-fetch. Let's use api directly
                  return { refreshUserProfile: null };
                });
                try {
                  const userData = await api.auth.getMe();
                  if (userData.farmer_status === 'approved') {
                    toast.success("🎉 You've been approved! Reloading...");
                    window.location.reload();
                  } else {
                    toast.info("Still pending. Admin will approve soon!");
                  }
                } catch {
                  toast.error("Could not check status.");
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg font-semibold rounded-2xl shadow-lg flex items-center justify-center gap-3"
            >
              <Activity className="w-5 h-5" />
              Check Approval Status
            </motion.button>

            <p className="text-xs text-[var(--earth-brown)]/60">
              Average approval time: within 24 hours
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Approved farmer → show full Farmer OS ──
  if (user && showFarmerOS) {
    return <FarmerDashboard />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream-white)] p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-[var(--deep-forest)] mb-2">Access Denied</h2>
          <p className="text-[var(--earth-brown)]">Please sign in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  const isUserAdmin = user.role === 'admin';
  const isUserFarmer = user.role === 'farmer';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Profile Card / Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mb-8 border border-[var(--forest-green)]/10"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[var(--light-sage)] rounded-2xl">
                <Users className="w-10 h-10 text-[var(--forest-green)]" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[var(--deep-forest)]">{user.name}</h1>
                <p className="text-md text-[var(--earth-brown)] flex items-center gap-2">
                  <span className="px-3 py-1 bg-[var(--forest-green)]/15 text-[var(--forest-green)] font-semibold rounded-full capitalize text-xs">
                    {user.role} Portal
                  </span>
                  • {user.mobile}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={loadData}
                className="px-6 py-3 bg-[var(--light-sage)] text-[var(--forest-green)] font-medium rounded-full hover:bg-[var(--light-sage)]/70 transition-all flex items-center gap-2"
              >
                Refresh Data
              </button>
              {isUserFarmer && (
                <button
                  onClick={() => setShowAddFarmModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-medium rounded-full hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Farm
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {isUserAdmin && (
            <>
              <TabButton
                active={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
                icon={<TrendingUp className="w-4 h-4" />}
                label="Analytics & Metrics"
              />
              <TabButton
                active={activeTab === 'farmers'}
                onClick={() => setActiveTab('farmers')}
                icon={<CheckCircle className="w-4 h-4" />}
                label="Farmer Verifications"
              />
              <TabButton
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
                icon={<Users className="w-4 h-4" />}
                label="Registered Users"
              />
            </>
          )}

          {isUserFarmer && (
            <>
              <TabButton
                active={activeTab === 'farmer-trees'}
                onClick={() => setActiveTab('farmer-trees')}
                icon={<TreePine className="w-4 h-4" />}
                label="My Farm Trees"
              />
              <TabButton
                active={activeTab === 'add-tree'}
                onClick={() => setActiveTab('add-tree')}
                icon={<Plus className="w-4 h-4" />}
                label="Register a Tree"
              />
            </>
          )}
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[var(--forest-green)] animate-spin mb-4" />
            <p className="text-[var(--earth-brown)] font-medium">Fetching details from the registry...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Tab 1: Analytics */}
            {activeTab === 'analytics' && isUserAdmin && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnalyticsCard
                    icon={<TreePine className="w-6 h-6 text-[var(--forest-green)]" />}
                    label="Active Adoptions"
                    value={analytics?.active_adoptions ?? 0}
                    subtext="Real trees bound"
                  />
                  <AnalyticsCard
                    icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                    label="Total Revenue"
                    value={`₹${(analytics?.total_revenue ?? 0).toLocaleString('en-IN')}`}
                    subtext="Payment gate receipts"
                  />
                  <AnalyticsCard
                    icon={<Users className="w-6 h-6 text-blue-600" />}
                    label="Registered Guardians"
                    value={analytics?.registered_users ?? 0}
                    subtext="Unique accounts"
                  />
                </div>

                {/* Simulated Chart Container */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-[var(--forest-green)]/10">
                  <h2 className="text-2xl font-bold text-[var(--deep-forest)] mb-6 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-[var(--forest-green)]" />
                    Real-time Platform Activity
                  </h2>
                  <div className="h-64 flex items-end gap-3 pt-6 border-b border-gray-200">
                    <Bar fill="var(--forest-green)" height="45%" label="Mango" />
                    <Bar fill="var(--leaf-green)" height="75%" label="Apple" />
                    <Bar fill="var(--sunset-orange)" height="60%" label="Orange" />
                    <Bar fill="var(--golden-sun)" height="30%" label="Guava" />
                    <Bar fill="var(--earth-brown)" height="85%" label="Avocado" />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-[var(--earth-brown)]">
                    <span>* Adoption volumes grouped by fruit category</span>
                    <span className="font-semibold text-[var(--forest-green)]">Live Feed Connected</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Farmers list & approval */}
            {activeTab === 'farmers' && isUserAdmin && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-[var(--forest-green)]/10">
                <h2 className="text-2xl font-bold text-[var(--deep-forest)] mb-6">Grower Verification Requests</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[var(--earth-brown)] text-sm font-semibold">
                        <th className="py-4">Farmer Details</th>
                        <th className="py-4">Farm Name</th>
                        <th className="py-4 font-bold text-center">Status</th>
                        <th className="py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {farmers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-[var(--earth-brown)]">
                            No farmer applications found.
                          </td>
                        </tr>
                      ) : (
                        farmers.map((farmer) => (
                          <tr key={farmer.id} className="text-sm">
                            <td className="py-4">
                              <div className="font-bold text-[var(--deep-forest)]">{farmer.farm_name}</div>
                              <div className="text-xs text-[var(--earth-brown)]">{farmer.location}</div>
                            </td>
                            <td className="py-4 text-[var(--earth-brown)]">{farmer.farm_name || "N/A"}</td>
                            <td className="py-4 text-center">
                              {farmer.verified ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full text-xs">
                                  Verified
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 font-bold rounded-full text-xs">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              {farmer.verified ? (
                                <button
                                  onClick={() => handleApproveFarmer(farmer.id, false)}
                                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-full font-semibold transition-all"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleApproveFarmer(farmer.id, true)}
                                  className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-full font-semibold transition-all"
                                >
                                  Verify Profile
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Users list */}
            {activeTab === 'users' && isUserAdmin && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-[var(--forest-green)]/10">
                <h2 className="text-2xl font-bold text-[var(--deep-forest)] mb-6">User Accounts Registry</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[var(--earth-brown)] text-sm font-semibold">
                        <th className="py-4">Guardian Name</th>
                        <th className="py-4">Mobile Number</th>
                        <th className="py-4">Access Role</th>
                        <th className="py-4 text-center">Eco Points</th>
                        <th className="py-4 text-right">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u) => (
                        <tr key={u.id} className="text-sm">
                          <td className="py-4 font-bold text-[var(--deep-forest)]">{u.name}</td>
                          <td className="py-4 text-[var(--earth-brown)]">{u.mobile}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'farmer' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 text-center font-bold text-[var(--golden-sun)]">✨ {u.eco_points}</td>
                          <td className="py-4 text-right text-[var(--earth-brown)] text-xs">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Farmer's Trees list */}
            {activeTab === 'farmer-trees' && isUserFarmer && (
              <div className="space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--deep-forest)]">My Farm Trees</h2>
                    <p className="text-sm text-[var(--earth-brown)] mt-1">Manage all your registered trees, livestreams, stories & harvests</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('add-tree')}
                    className="px-6 py-3 bg-[var(--forest-green)] text-white font-medium rounded-full hover:bg-[var(--deep-forest)] transition-all flex items-center gap-2 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Register a Tree
                  </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-center">
                    <div className="text-3xl font-black text-[var(--forest-green)]">{trees.length}</div>
                    <div className="text-xs text-[var(--earth-brown)] mt-1 font-medium">Total Trees</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-center">
                    <div className="text-3xl font-black text-orange-500">{trees.filter(t => t.status === 'adopted').length}</div>
                    <div className="text-xs text-[var(--earth-brown)] mt-1 font-medium">Adopted</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-center">
                    <div className="text-3xl font-black text-green-600">{trees.filter(t => t.status === 'available').length}</div>
                    <div className="text-xs text-[var(--earth-brown)] mt-1 font-medium">Available</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-center">
                    <div className="text-3xl font-black text-red-500">{trees.filter(t => t.live_camera_enabled).length}</div>
                    <div className="text-xs text-[var(--earth-brown)] mt-1 font-medium">🔴 Live Now</div>
                  </div>
                </div>

                {/* Tree Grid */}
                {trees.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 text-center shadow-xl border border-dashed border-[var(--forest-green)]/30">
                    <TreePine className="w-16 h-16 text-[var(--forest-green)]/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-[var(--deep-forest)] mb-2">No Trees Registered Yet</h3>
                    <p className="text-[var(--earth-brown)] mb-6">Start by registering your first fruit tree to the platform.</p>
                    <button
                      onClick={() => setActiveTab('add-tree')}
                      className="px-8 py-3 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-bold rounded-full hover:shadow-lg transition-all inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Register First Tree
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trees.map((tree) => (
                      <motion.div
                        key={tree.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex flex-col justify-between hover:shadow-2xl transition-shadow"
                      >
                        {/* Tree Image */}
                        <div className="relative h-48 bg-gray-100">
                          <img
                            src={tree.tree_images?.[0] || 'https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600'}
                            alt={tree.fruit_type}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow ${
                              tree.status === 'available' ? 'bg-green-600' :
                              tree.status === 'adopted' ? 'bg-orange-500' : 'bg-gray-500'
                            }`}>
                              {tree.status}
                            </span>
                            {tree.live_camera_enabled && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-red-600 shadow flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block" />
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-3 right-3 text-white font-black text-lg drop-shadow">
                            ₹{Number(tree.price).toLocaleString('en-IN')}
                          </div>
                        </div>

                        {/* Tree Details */}
                        <div className="p-5 flex-1">
                          <h3 className="text-lg font-bold text-[var(--deep-forest)] mb-1">Royal {tree.fruit_type}</h3>
                          <div className="flex items-center gap-2 text-xs text-[var(--earth-brown)] mb-3">
                            <Calendar className="w-3 h-3" />
                            <span>Age: {tree.tree_age} yrs</span>
                            <span className="ml-auto text-[var(--forest-green)] font-semibold">
                              Tree #{tree.id?.slice(-6) || '------'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center bg-[var(--light-sage)]/20 p-3 rounded-2xl mb-3 border border-[var(--forest-green)]/5">
                            <div>
                              <div className="text-[10px] text-[var(--earth-brown)]">Yield</div>
                              <div className="font-bold text-[var(--forest-green)] text-sm">{tree.expected_yield}kg</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[var(--earth-brown)]">Health</div>
                              <div className="font-bold text-[var(--forest-green)] text-sm">{(tree.health_score * 10).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[var(--earth-brown)]">Stories</div>
                              <div className="font-bold text-[var(--forest-green)] text-sm">{tree.stories?.length ?? 0}</div>
                            </div>
                          </div>

                          {tree.status === 'adopted' && tree.guardian_name && (
                            <div className="flex items-center gap-2 text-xs bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 mb-2">
                              <Users className="w-3 h-3 text-orange-500" />
                              <span className="text-orange-700 font-semibold">Guardian: {tree.guardian_name}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="px-5 pb-5 pt-2 border-t border-gray-100 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleLivestream(tree)}
                              className={`flex-1 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border-2 transition-all ${
                                tree.live_camera_enabled
                                  ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {tree.live_camera_enabled ? <><Video className="w-3 h-3" /> Stop Stream</> : <><VideoOff className="w-3 h-3" /> Go Live</>}
                            </button>

                            <button
                              onClick={() => { setSelectedTree(tree); setShowStoryModal(true); }}
                              className="flex-1 py-2 bg-blue-50 border-2 border-blue-200 text-blue-600 hover:bg-blue-100 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                            >
                              <BookOpen className="w-3 h-3" /> Post Story
                            </button>
                          </div>

                          <button
                            onClick={() => { setSelectedTree(tree); setShowHarvestModal(true); }}
                            className="w-full py-2.5 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white hover:shadow-md rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                          >
                            <Award className="w-4 h-4" /> Record Harvest
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* My Farms Summary */}
                {farms.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-[var(--deep-forest)] mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[var(--forest-green)]" /> My Farms
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {farms.map((farm) => (
                        <div key={farm.id} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex items-center gap-4 hover:shadow-lg transition-shadow">
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--light-sage)]">
                            {farm.cover_image ? (
                              <img src={farm.cover_image} alt={farm.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <TreePine className="w-7 h-7 text-[var(--forest-green)]" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[var(--deep-forest)] truncate">{farm.name}</div>
                            <div className="text-xs text-[var(--earth-brown)]">{farm.soil_type || 'Organic Soil'} • {farm.farm_size} acres</div>
                            <div className="text-xs text-[var(--forest-green)] font-semibold mt-0.5">
                              {trees.filter((t) => t.farm_id === farm.id).length} tree(s)
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setShowAddFarmModal(true)}
                        className="bg-[var(--light-sage)]/30 border-2 border-dashed border-[var(--forest-green)]/30 rounded-2xl p-4 flex items-center justify-center gap-2 text-sm text-[var(--forest-green)] font-semibold hover:bg-[var(--light-sage)]/50 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add New Farm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Add Tree form */}
            {activeTab === 'add-tree' && isUserFarmer && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-[var(--forest-green)]/10 max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-[var(--deep-forest)] mb-6 flex items-center gap-2">
                  <TreePine className="w-8 h-8 text-[var(--forest-green)]" />
                  Register a Fruit Tree
                </h2>

                <form onSubmit={handleAddTree} className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-[var(--deep-forest)]">Select Farm</label>
                      <button
                        type="button"
                        onClick={() => setShowAddFarmModal(true)}
                        className="text-xs font-bold text-[var(--forest-green)] hover:text-[var(--deep-forest)] hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Farm
                      </button>
                    </div>
                    {farms.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowAddFarmModal(true)}
                        className="w-full px-4 py-3 bg-amber-50 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl text-sm text-amber-700 font-semibold text-left flex items-center justify-between"
                      >
                        <span>⚠️ No Farms Configured — Create One First</span>
                        <span className="bg-amber-600 text-white px-2 py-0.5 rounded-lg text-xs font-bold">Create Now</span>
                      </button>
                    ) : (
                      <select
                        value={newTreeFarmId}
                        onChange={(e) => setNewTreeFarmId(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-[var(--forest-green)] bg-white text-sm"
                        required
                      >
                        <option value="">-- Choose a farm --</option>
                        {farms.map((f) => (
                          <option key={f.id} value={f.id}>{f.name} ({f.location || "Organic Site"})</option>
                        ))}
                      </select>
                    )}

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--deep-forest)] mb-2">Fruit Type</label>
                      <select
                        value={newTreeFruitType}
                        onChange={(e) => setNewTreeFruitType(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-[var(--forest-green)] bg-white text-sm"
                      >
                        <option value="Mango">Mango</option>
                        <option value="Apple">Apple</option>
                        <option value="Orange">Orange</option>
                        <option value="Guava">Guava</option>
                        <option value="Avocado">Avocado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--deep-forest)] mb-2">Tree Age (Years)</label>
                      <input
                        type="number"
                        value={newTreeAge}
                        onChange={(e) => setNewTreeAge(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-[var(--forest-green)] text-sm"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--deep-forest)] mb-2">Health Index (0-10)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newTreeHealth}
                        onChange={(e) => setNewTreeHealth(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-[var(--forest-green)] text-sm"
                        min="0"
                        max="10"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--deep-forest)] mb-2">Expected Yield (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newTreeYield}
                        onChange={(e) => setNewTreeYield(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-[var(--forest-green)] text-sm"
                        min="0.1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--deep-forest)] mb-2">Price (INR)</label>
                      <input
                        type="number"
                        value={newTreePrice}
                        onChange={(e) => setNewTreePrice(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-[var(--forest-green)] text-sm"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--deep-forest)] mb-2">Image URL</label>
                    <input
                      type="text"
                      value={newTreeImage}
                      onChange={(e) => setNewTreeImage(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-[var(--forest-green)] text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="live_camera"
                      checked={newTreeCam}
                      onChange={(e) => setNewTreeCam(e.target.checked)}
                      className="w-5 h-5 accent-[var(--forest-green)]"
                    />
                    <label htmlFor="live_camera" className="text-sm font-semibold text-[var(--deep-forest)]">Enable Live Stream Camera Feed</label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white hover:shadow-lg rounded-2xl font-bold transition-all text-sm"
                  >
                    Submit Registration
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Add Story */}
      <AnimatePresence>
        {showStoryModal && selectedTree && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStoryModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl z-10 border border-gray-100"
            >
              <h3 className="text-2xl font-bold text-[var(--deep-forest)] mb-6">Post Growth Timeline Story</h3>
              <p className="text-xs text-[var(--earth-brown)] mb-4">Sharing update for tree: <b>Royal {selectedTree.fruit_type}</b></p>

              <form onSubmit={handlePostStory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--deep-forest)] mb-1">Story Title</label>
                  <input
                    type="text"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="e.g. Blooming in Spring!"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-[var(--forest-green)] text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--deep-forest)] mb-1">Update Description</label>
                  <textarea
                    value={storyDesc}
                    onChange={(e) => setStoryDesc(e.target.value)}
                    placeholder="Describe how the tree is doing..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-[var(--forest-green)] text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--deep-forest)] mb-1">Media / Image URL (Optional)</label>
                  <input
                    type="text"
                    value={storyMedia}
                    onChange={(e) => setStoryMedia(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-[var(--forest-green)] text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowStoryModal(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-[var(--deep-forest)] font-semibold rounded-xl transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[var(--forest-green)] text-white font-semibold rounded-xl hover:shadow-lg transition-all text-xs"
                  >
                    Publish Post
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Log Harvest */}
      <AnimatePresence>
        {showHarvestModal && selectedTree && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHarvestModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl z-10 border border-gray-100"
            >
              <h3 className="text-2xl font-bold text-[var(--deep-forest)] mb-6">Log Harvest Yield</h3>
              <p className="text-xs text-[var(--earth-brown)] mb-4">Recording crop harvest for: <b>Royal {selectedTree.fruit_type}</b></p>

              <form onSubmit={handleLogHarvest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--deep-forest)] mb-1">Quantity (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={harvestQty}
                      onChange={(e) => setHarvestQty(e.target.value)}
                      placeholder="e.g. 12.5"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-[var(--forest-green)] text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--deep-forest)] mb-1">Crop Grade</label>
                    <select
                      value={harvestGrade}
                      onChange={(e) => setHarvestGrade(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-[var(--forest-green)] bg-white text-sm"
                    >
                      <option value="A">Grade A (Premium)</option>
                      <option value="B">Grade B (Choice)</option>
                      <option value="C">Grade C (Standard)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowHarvestModal(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-[var(--deep-forest)] font-semibold rounded-xl transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[var(--forest-green)] text-white font-semibold rounded-xl hover:shadow-lg transition-all text-xs"
                  >
                    Confirm & Dispatch Delivery
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Farm */}
      <AnimatePresence>
        {showAddFarmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddFarmModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl z-10 border border-gray-100"
            >
              <h3 className="text-2xl font-bold text-[var(--deep-forest)] mb-6">Create New Farm Profile</h3>

              <form onSubmit={handleAddFarm} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--deep-forest)] mb-1">Farm Name</label>
                  <input
                    type="text"
                    value={newFarmName}
                    onChange={(e) => setNewFarmName(e.target.value)}
                    placeholder="e.g. Sahyadri Organic Orchard"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-[var(--forest-green)] text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--deep-forest)] mb-1">Soil Type</label>
                    <input
                      type="text"
                      value={newFarmSoil}
                      onChange={(e) => setNewFarmSoil(e.target.value)}
                      placeholder="e.g. Laterite Soil"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-[var(--forest-green)] text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--deep-forest)] mb-1">Farm Size (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newFarmSize}
                      onChange={(e) => setNewFarmSize(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-[var(--forest-green)] text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--deep-forest)] mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={newFarmImage}
                    onChange={(e) => setNewFarmImage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-[var(--forest-green)] text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddFarmModal(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-[var(--deep-forest)] font-semibold rounded-xl transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[var(--forest-green)] text-white font-semibold rounded-xl hover:shadow-lg transition-all text-xs"
                  >
                    Create Farm
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`px-5 py-3 rounded-full transition-all shadow-sm flex items-center gap-2 text-sm font-semibold border-2 ${
        active
          ? 'bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white border-transparent'
          : 'bg-white text-[var(--earth-brown)] border-[var(--forest-green)]/15 hover:border-[var(--forest-green)]/40'
      }`}
    >
      {icon}
      {label}
    </motion.button>
  );
}

function AnalyticsCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-[var(--earth-brown)] tracking-wider uppercase">{label}</span>
        <div className="p-2 bg-[var(--light-sage)]/30 rounded-xl">{icon}</div>
      </div>
      <div>
        <div className="text-3xl font-extrabold text-[var(--deep-forest)] mb-1">{value}</div>
        <span className="text-xs text-[var(--earth-brown)]/70 font-semibold">{subtext}</span>
      </div>
    </motion.div>
  );
}

function Bar({ fill, height, label }: { fill: string; height: string; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <div className="relative w-full flex items-end justify-center h-full">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="w-12 rounded-t-xl shadow-lg relative overflow-hidden"
          style={{ backgroundColor: fill }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
        </motion.div>
      </div>
      <span className="text-xs font-semibold text-[var(--deep-forest)]">{label}</span>
    </div>
  );
}
