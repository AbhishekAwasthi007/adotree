import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import BankAccountModal from '../components/BankAccountModal';
import WithdrawalRequestModal from '../components/WithdrawalRequestModal';
import {
  TrendingUp, Users, CheckCircle, XCircle, Plus,
  BookOpen, Award, DollarSign, AlertCircle, Activity, TreePine,
  ClipboardList, Camera, MapPin, Calendar, Sparkles, Loader2,
  ChevronRight, ArrowLeft, CloudRain, Sun, Wind, Droplets, Map,
  Check, ArrowRight, ShieldCheck, Heart, User, Clock, Trash2,
  MessageSquare, Send, Sparkle, Eye, ShieldAlert, Star, Settings,
  Grid, Bell, HelpCircle, Phone, CreditCard, PieChart, Volume2,
  ListOrdered, Leaf, RefreshCw
} from 'lucide-react';

export function FarmerDashboard() {
  const { user } = useAuth();
  const location = useLocation();

  const [activePage, setActivePage] = useState<string>(() => {
    // Try to get from navigation state first, then localStorage, then default
    const navPage = (location.state as any)?.page;
    if (navPage) return navPage;
    const savedPage = localStorage.getItem('farmer_dashboard_page');
    return savedPage || 'dashboard';
  });
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true); // Default true, but toggleable for demo
  const [lang, setLang] = useState<'en' | 'hi' | 'mr'>('en');

  // Onboarding Step State
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [onboardingData, setOnboardingData] = useState({
    name: 'Ramesh Patil',
    farmName: 'Sahyadri Mango Haven',
    lang: 'mr',
    experience: '12',
    farmSize: '15',
    mobile: '+919330018824',
    aadhaar: '',
    pan: '',
    bankAccount: '',
    selfie: '',
    farmPhotos: [] as string[],
    introVideo: ''
  });

  // DB Data States
  const [trees, setTrees] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [adoptions, setAdoptions] = useState<any[]>([]);
  const [harvests, setHarvests] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploadingTreeImage, setIsUploadingTreeImage] = useState<boolean>(false);
  const [isUploadingFarmImage, setIsUploadingFarmImage] = useState<boolean>(false);

  // Add Farm Form State
  const [showAddFarmModal, setShowAddFarmModal] = useState<boolean>(false);
  const [newFarmForm, setNewFarmForm] = useState({
    name: '',
    soilType: 'Laterite Soil',
    farmSize: '10',
    coverImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800'
  });

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([
    { id: '1', title: 'New Tree Adoption! 🍊', body: 'Rohan Sharma adopted Alphonso Tree #45', time: 'Just now', type: 'info', read: false },
    { id: '2', title: 'High Humidity Warning 🌤️', body: 'Humidity is 88%. Risk of leaf spot disease is high.', time: '2 hours ago', type: 'warning', read: false },
    { id: '3', title: 'Payment Dispatched 💳', body: '₹14,997 payout has been credited to your bank.', time: '1 day ago', type: 'success', read: true },
    { id: '4', title: 'Leaf Scan Disease Alert 🍂', body: 'Leaf Spot detected on Row #4 Mango Trees.', time: '3 days ago', type: 'alert', read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Chat/Messages State
  const [chats, setChats] = useState<any[]>([
    { id: '1', name: 'Rohan Sharma (Alphonso #45)', lastMsg: 'How is the flowering looking this week?', time: '10:45 AM', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120', unread: true, messages: [
      { sender: 'user', text: 'Hi Ramesh, thanks for the welcome certificate! I\'m so excited to be a tree parent.', time: '09:12 AM' },
      { sender: 'farmer', text: 'Namaskar Rohan! Welcome to our orchard family. Your tree is doing great.', time: '09:20 AM' },
      { sender: 'user', text: 'How is the flowering looking this week?', time: '10:45 AM' }
    ]},
    { id: '2', name: 'Dr. Priya Mehta (Apple #12)', lastMsg: 'Can I arrange a video call to show my daughter?', time: 'Yesterday', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120', unread: false, messages: [
      { sender: 'user', text: 'Can I arrange a video call to show my daughter?', time: 'Yesterday' }
    ]}
  ]);
  const [activeChatId, setActiveChatId] = useState<string>('1');
  const [chatMessageInput, setChatMessageInput] = useState('');

  // Disease Scan State
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(54890);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [payoutHistory, setPayoutHistory] = useState([
    { id: 'pay_1', amount: 14997, status: 'Completed', date: 'May 20, 2026', method: 'HDFC Bank - 4302' },
    { id: 'pay_2', amount: 8990, status: 'Completed', date: 'May 10, 2026', method: 'HDFC Bank - 4302' },
    { id: 'pay_3', amount: 19995, status: 'Completed', date: 'Apr 28, 2026', method: 'HDFC Bank - 4302' }
  ]);

  // Stories
  const [stories, setStories] = useState<any[]>([
    { id: 's1', type: 'sunrise', media: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600', caption: 'Sunrise over Mango Orchards 🌅', time: '4h ago' },
    { id: 's2', type: 'rain', media: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600', caption: 'Gentle showers feeding the soil 🌧️', time: '12h ago' },
    { id: 's3', type: 'flowering', media: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600', caption: 'Mango flowers blooming beautifully 🌸', time: '1d ago' }
  ]);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryDesc, setNewStoryDesc] = useState('');
  const [newStoryMedia, setNewStoryMedia] = useState('https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600');

  // Quick Action FAB menu toggle
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Selected Tree for detailed review
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);

  // Quick UI simulation stats
  const totalTrees = trees.length || 3;
  const activeAdoptions = trees.filter(t => t.status === 'adopted').length || 2;
  const pendingHarvests = harvests.filter(h => h.status === 'processing').length || 1;

  // Add Tree State
  const [newTreeForm, setNewTreeForm] = useState({
    farmId: '',
    fruitType: 'Mango',
    age: '4',
    health: '9.8',
    expectedYield: '25.0',
    price: '4999',
    image: 'https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600',
    soilType: 'Laterite Soil',
    irrigation: 'Drip Irrigation',
    weatherCondition: 'Warm Sunny (28-32°C)'
  });

  // AI recommendations for tree registration
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  // Selected Harvest Log Form
  const [harvestForm, setHarvestForm] = useState({
    treeId: '',
    qty: '',
    grade: 'A'
  });

  // Adoption filter
  const [adoptionFilter, setAdoptionFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');

  // Harvest filter
  const [harvestFilter, setHarvestFilter] = useState<'all' | 'processing' | 'shipped' | 'delivered'>('all');

  // Selected delivery for detail view
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  // Multilingual translations
  const t = {
    en: {
      dashboard: 'Dashboard',
      trees: 'My Trees',
      adoptions: 'Adoptions',
      harvests: 'Harvests',
      deliveries: 'Deliveries',
      stories: 'Orchard Stories',
      wallet: 'Wallet & Payouts',
      analytics: 'Analytics',
      insights: 'AI Crop Insights',
      disease: 'Leaf Scan Assistant',
      reviews: 'Reviews',
      settings: 'Settings',
      hello: 'Good Morning, Ramesh',
      health: 'All your mango trees are healthy today.',
      quick_action: 'Quick Actions',
      weather: '28°C - Partly Sunny',
      add_tree: 'Register Tree',
      post_story: 'Upload Story',
      record_harvest: 'Log Harvest'
    },
    hi: {
      dashboard: 'डैशबोर्ड',
      trees: 'मेरे पेड़',
      adoptions: 'गोद लेना',
      harvests: 'फसल की कटाई',
      deliveries: 'वितरण',
      stories: 'बगीचे की कहानियां',
      wallet: 'वॉलेट और भुगतान',
      analytics: 'विश्लेषण',
      insights: 'एआई फसल अंतर्दृष्टि',
      disease: 'पत्ती स्कैन सहायक',
      reviews: 'समीक्षाएं',
      settings: 'सेटिंग्स',
      hello: 'शुभ प्रभात, रमेश जी',
      health: 'आपके आम के सभी पेड़ आज स्वस्थ हैं।',
      quick_action: 'त्वरित कार्रवाई',
      weather: '28°C - आंशिक रूप से धूप',
      add_tree: 'पेड़ जोड़ें',
      post_story: 'कहानी अपलोड करें',
      record_harvest: 'कटाई दर्ज करें'
    },
    mr: {
      dashboard: 'डॅशबोर्ड',
      trees: 'माझी झाडे',
      adoptions: 'दत्तक प्रक्रिया',
      harvests: 'पीक कापणी',
      deliveries: 'वितरण',
      stories: 'बागेतील गोष्टी',
      wallet: 'वॉलेट आणि पेआउट',
      analytics: 'विश्लेषण',
      insights: 'एआय पीक सल्ला',
      disease: 'पानांचे रोग स्कॅनर',
      reviews: 'अभिप्राय',
      settings: 'सेटिंग्ज',
      hello: 'शुभ प्रभात, रमेश',
      health: 'तुमची सर्व आंब्याची झाडे आज निरोगी आहेत.',
      quick_action: 'जलद कृती',
      weather: '२८°C - ढगाळ ऊन',
      add_tree: 'झाडाची नोंद करा',
      post_story: 'अपडेट टाका',
      record_harvest: 'कापणी नोंदवा'
    }
  }[lang];

  // Fetch initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [farmsData, treesData] = await Promise.all([
        api.farms.list().catch(() => []),
        api.farmer.getTrees().catch(() => [])
      ]);
      setFarms(farmsData || []);
      setTrees(treesData || []);
      if (farmsData.length > 0 && !newTreeForm.farmId) {
        setNewTreeForm(prev => ({ ...prev, farmId: farmsData[0].id }));
      }

      // Try real API for adoptions, fall back to mock
      try {
        const adoptionsData = await api.adoptions.getMyOrchard().catch(() => null);
        if (adoptionsData && adoptionsData.length > 0) {
          setAdoptions(adoptionsData.map((a: any) => ({
            id: a.id,
            treeId: a.tree_id,
            adopterName: a.adopter_name || a.user?.name || 'Guardian',
            date: new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: a.status || 'active',
            message: a.dedication_message || '',
            occasion: a.occasion_type || 'Tree Adoption',
            avatar: a.user?.profile_image || null,
          })));
        } else {
          setAdoptions([
            { id: 'a1', treeId: '11111111-1111-1111-1111-111111111111', adopterName: 'Rohan Sharma', date: 'May 12, 2026', status: 'active', message: 'In memory of grandpa who loved mangoes.', occasion: "Grandfather's Birthday", avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
              phone: '+91 98765 43210',
              address: { line1: 'Flat 4B, Sea Breeze Apartments, Carter Road', line2: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' }
            },
            { id: 'a2', treeId: '22222222-2222-2222-2222-222222222222', adopterName: 'Dr. Priya Mehta', date: 'May 05, 2026', status: 'active', message: 'To a greener future!', occasion: 'Green Pledge', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
              phone: '+91 91234 56789',
              address: { line1: '12, Orchid Villa, Lane 5', line2: 'Koregaon Park', city: 'Pune', state: 'Maharashtra', pincode: '411001' }
            },
            { id: 'a3', treeId: '33333333-3333-3333-3333-333333333333', adopterName: 'Arjun Nair', date: 'Apr 28, 2026', status: 'pending', message: 'For my daughter\'s 5th birthday 🎂', occasion: "Daughter's Birthday", avatar: null,
              phone: '+91 87654 32109',
              address: { line1: '301, Green Leaf Tower, 100 Feet Road', line2: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' }
            },
          ]);
        }
      } catch { 
        setAdoptions([
          { id: 'a1', treeId: '11111111-1111-1111-1111-111111111111', adopterName: 'Rohan Sharma', date: 'May 12, 2026', status: 'active', message: 'In memory of grandpa who loved mangoes.', occasion: "Grandfather's Birthday", avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120' },
          { id: 'a2', treeId: '22222222-2222-2222-2222-222222222222', adopterName: 'Dr. Priya Mehta', date: 'May 05, 2026', status: 'active', message: 'To a greener future!', occasion: 'Green Pledge', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120' },
          { id: 'a3', treeId: '33333333-3333-3333-3333-333333333333', adopterName: 'Arjun Nair', date: 'Apr 28, 2026', status: 'pending', message: 'For my daughter\'s 5th birthday 🎂', occasion: "Daughter's Birthday", avatar: null },
        ]);
      }

      // Harvests
      setHarvests([
        { id: 'h1', treeId: '11111111-1111-1111-1111-111111111111', treeType: 'Mango', quantity: 24.5, date: 'May 18, 2026', grade: 'A', status: 'processing' },
        { id: 'h2', treeId: '22222222-2222-2222-2222-222222222222', treeType: 'Apple', quantity: 18.0, date: 'May 10, 2026', grade: 'B', status: 'shipped' },
        { id: 'h3', treeId: '11111111-1111-1111-1111-111111111111', treeType: 'Mango', quantity: 31.0, date: 'Apr 22, 2026', grade: 'A', status: 'delivered' },
      ]);

      // Deliveries
      setDeliveries([
        { id: 'd1', recipient: 'Rohan Sharma', phone: '+91 98765 43210', address: 'Flat 4B, Sea Breeze Apartments, Carter Road', address2: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', trackingNo: 'TR-DEL-X2390A', status: 'processing', progress: 20, harvestId: 'h1', eta: 'May 25, 2026' },
        { id: 'd2', recipient: 'Dr. Priya Mehta', phone: '+91 91234 56789', address: '12, Orchid Villa, Lane 5', address2: 'Koregaon Park', city: 'Pune', state: 'Maharashtra', pincode: '411001', trackingNo: 'TR-DEL-P9841B', status: 'shipped', progress: 65, harvestId: 'h2', eta: 'May 22, 2026' },
        { id: 'd3', recipient: 'Arjun Nair', phone: '+91 87654 32109', address: '301, Green Leaf Tower, 100 Feet Road', address2: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', trackingNo: 'TR-DEL-B7712C', status: 'delivered', progress: 100, harvestId: 'h3', eta: 'Delivered Apr 30, 2026' },
      ]);
    } catch (err) {
      console.error("Failed loading data inside Farmer OS", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh data when navigating to different pages.
  // Important: the menu click only updates local `activePage` state (same route: /dashboard).
  // This effect must run on every click that changes `activePage`.
  useEffect(() => {
    if (!activePage) return;

    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        await loadData();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [activePage]);

  // Sync activePage when nav state changes (e.g. clicking menu while already on /dashboard)
  useEffect(() => {
    const navPage = (location.state as any)?.page;
    if (navPage && navPage !== activePage) setActivePage(navPage);
  }, [location.state]);

  // Persist activePage to localStorage on change
  useEffect(() => {
    localStorage.setItem('farmer_dashboard_page', activePage);
  }, [activePage]);

  // Update AI Recommendations based on tree price and age
  useEffect(() => {
    const ageNum = parseInt(newTreeForm.age) || 3;
    const priceNum = parseInt(newTreeForm.price) || 2000;
    
    // Simple mock calculation representing deep crop AI
    const suggestedPrice = ageNum * 1200 + 1500;
    const expectedYieldVal = (ageNum * 4.5 + 10).toFixed(1);
    const popularityScore = priceNum < suggestedPrice ? 'High 🔥' : 'Moderate';

    setAiSuggestions({
      suggestedPrice: `₹${suggestedPrice}`,
      predictedYield: `${expectedYieldVal} kg / season`,
      popularity: popularityScore,
      healthRecommendation: 'Strong soil nutrient balance. Ideal for premium organic branding.'
    });
  }, [newTreeForm.age, newTreeForm.price]);

  // Handle Add Farm Submit
  const handleAddFarmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmForm.name) {
      toast.error('Please enter a farm name.');
      return;
    }
    setIsLoading(true);
    try {
      const createdFarm = await api.farms.create({
        name: newFarmForm.name,
        cover_image: newFarmForm.coverImage,
        gallery: [newFarmForm.coverImage],
        soil_type: newFarmForm.soilType,
        farm_size: parseFloat(newFarmForm.farmSize) || 10
      });
      toast.success(`Farm "${newFarmForm.name}" created successfully! 🌾`);
      
      // Reset form
      setNewFarmForm({
        name: '',
        soilType: 'Laterite Soil',
        farmSize: '10',
        coverImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800'
      });
      setShowAddFarmModal(false);
      
      // Reload farms list
      const farmsData = await api.farms.list().catch(() => []);
      setFarms(farmsData || []);
      
      // Auto-select the newly created farm in the tree form
      if (createdFarm && createdFarm.id) {
        setNewTreeForm(prev => ({ ...prev, farmId: createdFarm.id }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating farm profile.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Onboarding Completion
  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOnboarded(true);
    toast.success('Welcome to the Smart Farming OS! Profile approved.');
  };

  // Log new Tree
  const handleAddTreeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreeForm.farmId) {
      toast.error('No farm found. Make sure you are logged in as a farmer and have a farm configured.');
      return;
    }
    setIsLoading(true);
    try {
      await api.farmer.createTree({
        farm_id: newTreeForm.farmId,
        fruit_type: newTreeForm.fruitType,
        tree_age: parseInt(newTreeForm.age),
        health_score: parseFloat(newTreeForm.health),
        expected_yield: parseFloat(newTreeForm.expectedYield),
        price: parseFloat(newTreeForm.price),
        tree_images: [newTreeForm.image],
        live_camera_enabled: false
      });
      toast.success('New Tree added to the organic registry!');
      loadData();
      setActivePage('trees');
    } catch (err: any) {
      toast.error(err.message || 'Error registering tree.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Harvest Log
  const handleHarvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!harvestForm.treeId) {
      toast.error('Select a tree first.');
      return;
    }
    try {
      await api.farmer.createHarvest({
        tree_id: harvestForm.treeId,
        quantity: parseFloat(harvestForm.qty),
        quality_grade: harvestForm.grade
      });
      toast.success('Harvest recorded successfully! Shipment dispatch initialized.');
      loadData();
      setActivePage('harvests');
    } catch (err: any) {
      toast.error(err.message || 'Failed recording harvest.');
    }
  };

  // Post New Story
  const handleUploadStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.farmer.uploadStory(newStoryTitle, newStoryDesc, [newStoryMedia]);
      setStories(prev => [
        { id: `s_${Date.now()}`, type: 'growth', media: newStoryMedia, caption: newStoryTitle, time: 'Just now' },
        ...prev
      ]);
      toast.success('Story published to all tree timeline cards!');
      setNewStoryTitle('');
      setNewStoryDesc('');
      setActivePage('trees');
    } catch (err: any) {
      toast.error('Failed uploading story.');
    }
  };

  // Simulate Leaf Scanner Disease AI
  const startLeafScanner = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        disease: 'Anthracnose (Fungal Infection)',
        severity: 'Moderate (Level 2)',
        probability: '94.2%',
        treatment: 'Apply Organic Neem Oil spray and prune infected twigs in the morning. Keep watering moderate.',
        caution: 'Avoid overhead watering during humid evenings.'
      });
      toast.success('AI crop health diagnosis ready!');
    }, 2500);
  };

  // Handle Sending Chat Messages
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageInput.trim()) return;

    const userMessage = chatMessageInput;

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMsg: userMessage,
          messages: [
            ...c.messages,
            { sender: 'farmer', text: userMessage, time: 'Just now' }
          ]
        };
      }
      return c;
    }));
    setChatMessageInput('');

    // Dynamic Adopter Simulator response to make the chat feel extremely premium and functional
    setTimeout(() => {
      const responses: Record<string, string[]> = {
        '1': [
          "Wow, that's beautiful! Thank you so much for the update, Rameshji. 🌳✨",
          "That is amazing! I'm sharing this picture with my kids, they are so excited about Alphonso #45!",
          "Sounds wonderful! Please let me know when we can do the live checkin next. 🍊"
        ],
        '2': [
          "Great! My daughter is going to love seeing the Himalayan apple blossoms. 🌸",
          "Thanks for the prompt response, Ramesh. Keep up the amazing organic farming work!",
          "Fantastic. Let me know what time works best for you tomorrow."
        ]
      };

      const fallbackReplies = [
        "Achaa! Thank you for the update, Ramesh. Looking forward to visiting the orchard soon! 🙏🌾",
        "That's so heartening to hear. Nature is amazing!"
      ];

      const activeResponses = responses[activeChatId] || fallbackReplies;
      const randomReply = activeResponses[Math.floor(Math.random() * activeResponses.length)];

      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            lastMsg: randomReply,
            messages: [
              ...c.messages,
              { sender: 'user', text: randomReply, time: 'Just now' }
            ]
          };
        }
        return c;
      }));
    }, 1500);
  };

  // Upload handlers
  const handleTreeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingTreeImage(true);
    try {
      const result = await api.farmer.uploadImage(file);
      if (result && result.url) {
        setNewTreeForm(prev => ({ ...prev, image: result.url }));
        toast.success('Tree image uploaded successfully! 📸');
      } else {
        throw new Error('No URL returned from server.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload tree image.');
    } finally {
      setIsUploadingTreeImage(false);
    }
  };

  const handleFarmImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFarmImage(true);
    try {
      const result = await api.farmer.uploadImage(file);
      if (result && result.url) {
        setNewFarmForm(prev => ({ ...prev, coverImage: result.url }));
        toast.success('Farm cover image uploaded successfully! 🌾');
      } else {
        throw new Error('No URL returned from server.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload farm image.');
    } finally {
      setIsUploadingFarmImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F0] text-[var(--deep-forest)] pt-20 pb-16 font-sans relative overflow-x-hidden">
      
      {/* Onboarding Overlay Screen if not onboarded */}
      {!isOnboarded ? (
        <div className="min-h-screen bg-[var(--cream-white)] py-12 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-[var(--forest-green)]/15">
            {/* Header */}
            <div className="bg-[var(--forest-green)] text-white p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--leaf-green),transparent)] opacity-40" />
              <div className="relative z-10">
                <Sparkles className="w-12 h-12 text-[var(--golden-sun)] mx-auto mb-3" />
                <h1 className="text-3xl font-black tracking-tight">Eco-Grower Onboarding</h1>
                <p className="text-[var(--light-sage)] text-sm mt-1">Register and verify your organic orchard to meet guardians</p>
              </div>
            </div>

            {/* Progress indicators */}
            <div className="flex border-b border-gray-100 bg-gray-50/50 p-4 justify-around text-xs font-bold text-[var(--earth-brown)]">
              {[1, 2, 3, 4, 5].map((stepNo) => (
                <div key={stepNo} className={`flex items-center gap-1.5 ${onboardingStep === stepNo ? 'text-[var(--forest-green)]' : 'opacity-40'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    onboardingStep > stepNo ? 'bg-green-600 text-white' :
                    onboardingStep === stepNo ? 'bg-[var(--forest-green)] text-white' : 'bg-gray-200'
                  }`}>
                    {onboardingStep > stepNo ? <Check className="w-3 h-3" /> : stepNo}
                  </span>
                  <span className="hidden md:inline">
                    {stepNo === 1 ? 'OTP' : stepNo === 2 ? 'Details' : stepNo === 3 ? 'GPS' : stepNo === 4 ? 'KYC' : 'Photos'}
                  </span>
                </div>
              ))}
            </div>

            {/* Steps Forms */}
            <form onSubmit={handleCompleteOnboarding} className="p-8">
              {onboardingStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center max-w-md mx-auto">
                    <Phone className="w-12 h-12 text-[var(--forest-green)] mx-auto mb-3" />
                    <h3 className="text-xl font-bold">Step 1: Verify phone number</h3>
                    <p className="text-xs text-[var(--earth-brown)] mt-1">We will send a 6-digit OTP code to verify your Identity.</p>
                  </div>
                  <div className="max-w-md mx-auto space-y-4">
                    <input
                      type="tel"
                      value={onboardingData.mobile}
                      onChange={(e) => setOnboardingData({ ...onboardingData, mobile: e.target.value })}
                      placeholder="Enter mobile (e.g. +91 9330018824)"
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl outline-none focus:border-[var(--forest-green)] text-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(2)}
                      className="w-full py-4 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                      Send Verification Code
                    </button>
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-[var(--deep-forest)] flex items-center gap-2">
                    <User className="w-5 h-5 text-[var(--forest-green)]" /> Grower Profile Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold mb-2">Full Name</label>
                      <input
                        type="text"
                        value={onboardingData.name}
                        onChange={(e) => setOnboardingData({ ...onboardingData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-2">Orchard/Farm Name</label>
                      <input
                        type="text"
                        value={onboardingData.farmName}
                        onChange={(e) => setOnboardingData({ ...onboardingData, farmName: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-2">Language Preference</label>
                      <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value as any)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] bg-white text-sm"
                      >
                        <option value="en">English (US)</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                        <option value="mr">मराठी (Marathi)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-2">Farming Experience (Years)</label>
                      <input
                        type="number"
                        value={onboardingData.experience}
                        onChange={(e) => setOnboardingData({ ...onboardingData, experience: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-2">Farm Size (Acres)</label>
                      <input
                        type="number"
                        value={onboardingData.farmSize}
                        onChange={(e) => setOnboardingData({ ...onboardingData, farmSize: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 justify-between pt-6">
                    <button type="button" onClick={() => setOnboardingStep(1)} className="px-6 py-3 border-2 border-gray-200 rounded-full font-bold">Back</button>
                    <button type="button" onClick={() => setOnboardingStep(3)} className="px-6 py-3 bg-[var(--forest-green)] text-white rounded-full font-bold">Next</button>
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-[var(--deep-forest)] flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[var(--forest-green)]" /> Farm GPS & Location Boundary
                  </h3>
                  <p className="text-xs text-[var(--earth-brown)]">Verify your coordinates and tap on the map to draw your organic farm boundary.</p>
                  
                  {/* Mock Map Canvas */}
                  <div className="h-64 rounded-3xl bg-emerald-50 border-2 border-[var(--forest-green)]/15 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(gray_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                    {/* Simulated Farm Boundary shape */}
                    <div className="w-32 h-32 bg-green-500/20 border-2 border-dashed border-green-600 rounded-xl relative flex items-center justify-center">
                      <span className="text-[10px] text-green-800 font-bold bg-white px-2 py-0.5 rounded-full shadow-sm">My Boundary</span>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-md text-[10px] font-bold flex flex-col gap-0.5 border">
                      <span className="text-[var(--forest-green)]">GPS: 17.3625° N</span>
                      <span className="text-[var(--forest-green)]">Lon: 73.3167° E</span>
                    </div>
                    <button type="button" className="absolute bottom-4 bg-[var(--forest-green)] text-white px-4 py-2 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5">
                      <Map className="w-3.5 h-3.5" /> Auto-Detect GPS
                    </button>
                  </div>

                  <div className="flex gap-4 justify-between pt-6">
                    <button type="button" onClick={() => setOnboardingStep(2)} className="px-6 py-3 border-2 border-gray-200 rounded-full font-bold">Back</button>
                    <button type="button" onClick={() => setOnboardingStep(4)} className="px-6 py-3 bg-[var(--forest-green)] text-white rounded-full font-bold">Next</button>
                  </div>
                </div>
              )}

              {onboardingStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-[var(--deep-forest)] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[var(--forest-green)]" /> KYC & Payout Verification
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold mb-1">Aadhaar Card (UIDAI Number)</label>
                      <input
                        type="text"
                        placeholder="12-digit Aadhaar number"
                        value={onboardingData.aadhaar}
                        onChange={(e) => setOnboardingData({ ...onboardingData, aadhaar: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">PAN Card Number</label>
                      <input
                        type="text"
                        placeholder="10-digit PAN string"
                        value={onboardingData.pan}
                        onChange={(e) => setOnboardingData({ ...onboardingData, pan: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Bank Account Info (for payouts)</label>
                      <input
                        type="text"
                        placeholder="IFS Code & Account Number"
                        value={onboardingData.bankAccount}
                        onChange={(e) => setOnboardingData({ ...onboardingData, bankAccount: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 justify-between pt-6">
                    <button type="button" onClick={() => setOnboardingStep(3)} className="px-6 py-3 border-2 border-gray-200 rounded-full font-bold">Back</button>
                    <button type="button" onClick={() => setOnboardingStep(5)} className="px-6 py-3 bg-[var(--forest-green)] text-white rounded-full font-bold">Next</button>
                  </div>
                </div>
              )}

              {onboardingStep === 5 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-[var(--deep-forest)] flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[var(--forest-green)]" /> Farm Media & Video Introduction
                  </h3>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center bg-gray-50 flex flex-col items-center justify-center">
                      <Camera className="w-10 h-10 text-[var(--earth-brown)] mb-2" />
                      <div className="font-bold text-xs">Upload Farm Cover Photo</div>
                      <div className="text-[10px] text-[var(--earth-brown)] mt-0.5">Drag/Drop orchard landscape photos</div>
                    </div>
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center bg-gray-50 flex flex-col items-center justify-center">
                      <Video className="w-10 h-10 text-[var(--earth-brown)] mb-2" />
                      <div className="font-bold text-xs">Record 30s Intro Video</div>
                      <div className="text-[10px] text-[var(--earth-brown)] mt-0.5">Introduce your farm, Vedic farming practices to guardians</div>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-between pt-6">
                    <button type="button" onClick={() => setOnboardingStep(4)} className="px-6 py-3 border-2 border-gray-200 rounded-full font-bold">Back</button>
                    <button type="submit" className="px-8 py-3 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white rounded-full font-bold shadow-lg">Complete Registration</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Layout: Content Panel only */}
          <div className="w-full">
              




              {/* Screen Renders depending on activePage */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  
                  {/* APP WINDOW 1: DASHBOARD CONTROL CENTER */}
                  {activePage === 'dashboard' && (
                    <div className="space-y-6">
                      
                      {/* Welcome Hero Card */}
                      <div className="bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-[var(--forest-green)]/10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] opacity-40" />
                        <div className="relative z-10 space-y-2">
                          <span className="px-3 py-1 bg-white/20 text-white font-bold rounded-full text-[10px] uppercase tracking-wider">
                            Active Session
                          </span>
                          <h1 className="text-3xl font-black">{t.hello} 👋</h1>
                          <p className="text-[var(--light-sage)] text-sm max-w-lg">{t.health}</p>
                          <div className="flex gap-4 pt-4 text-xs font-bold">
                            <div className="flex items-center gap-1"><CloudRain className="w-3.5 h-3.5 text-[var(--sky-blue)]" /> Rain: 20%</div>
                            <div className="flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-blue-200" /> Wind: 12 km/h</div>
                            <div className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-emerald-200" /> Soil Humidity: 65%</div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Action Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActivePage('add-tree')}
                          className="bg-white rounded-3xl p-6 shadow-lg border-2 border-[var(--forest-green)]/20 hover:border-[var(--forest-green)] transition-all text-left group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--forest-green)]/10 flex items-center justify-center group-hover:bg-[var(--forest-green)] transition-colors">
                              <Plus className="w-6 h-6 text-[var(--forest-green)] group-hover:text-white transition-colors" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[var(--forest-green)] transition-colors" />
                          </div>
                          <h3 className="text-lg font-bold text-[var(--deep-forest)] mb-1">Register a Tree</h3>
                          <p className="text-xs text-[var(--earth-brown)]">Add new trees to your farm catalog</p>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActivePage('trees')}
                          className="bg-white rounded-3xl p-6 shadow-lg border-2 border-orange-200/50 hover:border-orange-500 transition-all text-left group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                              <TreePine className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 transition-colors" />
                          </div>
                          <h3 className="text-lg font-bold text-[var(--deep-forest)] mb-1">My Trees</h3>
                          <p className="text-xs text-[var(--earth-brown)]">{totalTrees} trees registered</p>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActivePage('adoptions')}
                          className="bg-white rounded-3xl p-6 shadow-lg border-2 border-blue-200/50 hover:border-blue-500 transition-all text-left group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                              <Users className="w-6 h-6 text-blue-500 group-hover:text-white transition-colors" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <h3 className="text-lg font-bold text-[var(--deep-forest)] mb-1">Adoptions</h3>
                          <p className="text-xs text-[var(--earth-brown)]">{activeAdoptions} active guardians</p>
                        </motion.button>
                      </div>

                      {/* Realtime Stats Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-3xl p-5 shadow border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
                           <div className="absolute -right-4 -bottom-4 text-gray-100 group-hover:text-emerald-50 transition-colors">
                            <TreePine className="w-24 h-24" />
                          </div>
                          <div className="relative z-10">
                            <div className="text-[10px] text-[var(--earth-brown)] font-bold uppercase tracking-wider">Total Trees</div>
                            <div className="text-3xl font-black text-[var(--forest-green)] mt-1">{totalTrees}</div>
                            <div className="text-[9px] text-green-600 mt-2 font-bold flex items-center gap-0.5">
                              <span>+1 this month</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 shadow border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
                           <div className="absolute -right-4 -bottom-4 text-gray-100 group-hover:text-orange-50 transition-colors">
                            <Users className="w-24 h-24" />
                          </div>
                          <div className="relative z-10">
                            <div className="text-[10px] text-[var(--earth-brown)] font-bold uppercase tracking-wider">Adopted Trees</div>
                            <div className="text-3xl font-black text-orange-500 mt-1">{activeAdoptions}</div>
                            <div className="text-[9px] text-orange-600 mt-2 font-bold flex items-center gap-0.5">
                              <span>67% Adoption Rate</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-3xl p-5 shadow border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
                           <div className="absolute -right-4 -bottom-4 text-gray-100 group-hover:text-emerald-50 transition-colors">
                            <DollarSign className="w-24 h-24" />
                          </div>
                          <div className="relative z-10">
                            <div className="text-[10px] text-[var(--earth-brown)] font-bold uppercase tracking-wider">Monthly Income</div>
                            <div className="text-3xl font-black text-emerald-600 mt-1">₹{walletBalance.toLocaleString('en-IN')}</div>
                            <div className="text-[9px] text-emerald-600 mt-2 font-bold flex items-center gap-0.5">
                              <span>Payout ready</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Main Dashboard Panel split: Health Overview & Recent Activities */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Farm Health dials */}
                        <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow border border-gray-100 space-y-4">
                           <h3 className="font-bold text-sm text-[var(--deep-forest)] flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[var(--forest-green)]" /> Farm Health & Sensors
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-[var(--light-sage)]/25 rounded-2xl p-4 border border-[var(--forest-green)]/5">
                              <div className="flex items-center justify-between text-xs font-bold text-[var(--earth-brown)]">
                                <span>Soil Moisture</span>
                                <Droplets className="w-4 h-4 text-blue-500" />
                              </div>
                              <div className="text-xl font-black text-[var(--forest-green)] mt-2">64%</div>
                              <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: '64%' }} />
                              </div>
                            </div>
                            <div className="bg-[var(--light-sage)]/25 rounded-2xl p-4 border border-[var(--forest-green)]/5">
                              <div className="flex items-center justify-between text-xs font-bold text-[var(--earth-brown)]">
                                <span>Solar Index</span>
                                <Sun className="w-4 h-4 text-amber-500" />
                              </div>
                              <div className="text-xl font-black text-amber-600 mt-2">7.8 kW/m²</div>
                              <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: '78%' }} />
                              </div>
                            </div>
                            <div className="bg-[var(--light-sage)]/25 rounded-2xl p-4 border border-[var(--forest-green)]/5">
                              <div className="flex items-center justify-between text-xs font-bold text-[var(--earth-brown)]">
                                <span>Nitrogen Level</span>
                                <Leaf className="w-4 h-4 text-emerald-500" />
                              </div>
                              <div className="text-xl font-black text-emerald-600 mt-2">Optimal (98%)</div>
                              <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98%' }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Recent Activity Timeline */}
                        <div className="bg-white rounded-3xl p-6 shadow border border-gray-100 space-y-4">
                          <h3 className="font-bold text-sm text-[var(--deep-forest)] flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[var(--forest-green)]" /> Activities Timeline
                          </h3>
                          <div className="flex flex-col gap-4 text-xs">
                            <div className="flex gap-3 relative before:absolute before:w-0.5 before:bg-gray-100 before:h-8 before:left-3 before:top-6">
                              <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs">🍊</span>
                              <div>
                                <div className="font-bold">New tree adopted by Rohan Sharma</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">Alphonso Mango Tree #45 • 1h ago</div>
                              </div>
                            </div>
                            <div className="flex gap-3 relative before:absolute before:w-0.5 before:bg-gray-100 before:h-8 before:left-3 before:top-6">
                              <span className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs">🧺</span>
                              <div>
                                <div className="font-bold">Harvest recorded on Apple Tree #12</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">18.0 kg recorded • 1 day ago</div>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">💧</span>
                              <div>
                                <div className="font-bold">Drip irrigation scheduled on Row 2</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">Automated sensory check completed • 2 days ago</div>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* APP WINDOW 2: TREES CATALOG LIST & CARD DETAIL */}
                  {activePage === 'trees' && (
                    <div className="space-y-6">
                      
                      {/* Catalog Header */}
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--deep-forest)]">Trees Management Registry</h2>
                          <p className="text-xs text-[var(--earth-brown)]">Register new seeds and monitor health scores</p>
                        </div>
                        <button
                          onClick={() => setActivePage('add-tree')}
                          className="px-6 py-3 bg-[var(--forest-green)] text-white text-xs font-bold rounded-full hover:bg-[var(--deep-forest)] transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Register a Tree
                        </button>
                      </div>

                      {/* Tree Cards Grid */}
                      <div className="grid md:grid-cols-3 gap-6">
                        {trees.map((tree) => (
                          <div key={tree.id} className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex flex-col justify-between group hover:shadow-2xl transition-all">
                            <div>
                              <div className="relative h-48 bg-gray-100">
                                <img
                                  src={tree.tree_images?.[0] || 'https://images.unsplash.com/photo-1775298116276-56bad682022f?w=600'}
                                  alt={tree.fruit_type}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-4 left-4 flex gap-2">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black text-white uppercase shadow-md ${
                                    tree.status === 'available' ? 'bg-green-600' : 'bg-orange-500'
                                  }`}>
                                    {tree.status}
                                  </span>
                                </div>
                                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-xl text-white font-black text-sm">
                                  ₹{Number(tree.price).toLocaleString('en-IN')}
                                </div>
                              </div>
                              
                              <div className="p-6">
                                <div className="flex justify-between items-start">
                                  <h3 className="text-lg font-bold text-[var(--deep-forest)]">Royal {tree.fruit_type}</h3>
                                  <span className="text-[10px] font-bold text-[var(--forest-green)] bg-[var(--light-sage)]/50 px-2 py-0.5 rounded-full">
                                    Age: {tree.tree_age}y
                                  </span>
                                </div>
                                <p className="text-xs text-[var(--earth-brown)] mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Orchard Row #{tree.tree_age}</p>
                                
                                <div className="grid grid-cols-2 gap-4 mt-4 bg-[var(--light-sage)]/25 p-3 rounded-2xl text-center text-xs">
                                  <div>
                                    <div className="text-[10px] text-[var(--earth-brown)] font-bold">Health Score</div>
                                    <div className="font-black text-[var(--forest-green)] mt-0.5">{tree.health_score * 10}%</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-[var(--earth-brown)] font-bold">Est. Yield</div>
                                    <div className="font-black text-[var(--forest-green)] mt-0.5">{tree.expected_yield} kg</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-6 pt-0 border-t border-gray-100 flex flex-col gap-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedTreeId(tree.id);
                                    setActivePage('tree-details');
                                  }}
                                  className="w-full py-2.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all"
                                >
                                  <BookOpen className="w-3.5 h-3.5" /> Manage Detail
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                  {/* APP WINDOW 3: ADD TREE FORM WITH REALTIME AI RECOMMENDATIONS */}
                  {activePage === 'add-tree' && (
                    <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 shadow-xl border border-[var(--forest-green)]/5">
                      <div className="flex items-center gap-3 pb-6 border-b mb-6">
                        <TreePine className="w-8 h-8 text-[var(--forest-green)]" />
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--deep-forest)]">Register Orchard Tree</h2>
                          <p className="text-xs text-[var(--earth-brown)]">Submit organic soil reports, irrigation methods, and let AI analyze the expected price</p>
                        </div>
                      </div>

                      <form onSubmit={handleAddTreeSubmit} className="grid md:grid-cols-3 gap-8">
                        {/* Forms Fields Left */}
                        <div className="md:col-span-2 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-bold">Select Farm Location</label>
                                <button
                                  type="button"
                                  onClick={() => setShowAddFarmModal(true)}
                                  className="text-[10px] font-bold text-[var(--forest-green)] hover:text-[var(--deep-forest)] hover:underline flex items-center gap-0.5"
                                >
                                  <Plus className="w-3 h-3" /> Add New Farm
                                </button>
                              </div>
                              {farms.length === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setShowAddFarmModal(true)}
                                  className="w-full px-4 py-3 bg-amber-50 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl text-xs text-amber-700 font-semibold text-left flex items-center justify-between"
                                >
                                  <span>⚠️ No Farms Configured — Create One</span>
                                  <span className="bg-amber-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-bold">Create Now</span>
                                </button>
                              ) : (
                                <select
                                  value={newTreeForm.farmId}
                                  onChange={(e) => setNewTreeForm({ ...newTreeForm, farmId: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] bg-white text-xs"
                                  required
                                >
                                  <option value="">-- Choose Farm --</option>
                                  {farms.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-bold mb-2">Fruit Tree Category</label>
                              <select
                                value={newTreeForm.fruitType}
                                onChange={(e) => setNewTreeForm({ ...newTreeForm, fruitType: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] bg-white text-xs"
                              >
                                <option value="Mango">Alphonso Mango</option>
                                <option value="Apple">Organic Apple</option>
                                <option value="Orange">Sunset Orange</option>
                                <option value="Guava">Gold Guava</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold mb-2">Tree Age (Years)</label>
                              <input
                                type="number"
                                value={newTreeForm.age}
                                onChange={(e) => setNewTreeForm({ ...newTreeForm, age: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-xs"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold mb-2">Health Index (0-10)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={newTreeForm.health}
                                onChange={(e) => setNewTreeForm({ ...newTreeForm, health: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-xs"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold mb-2">Price (INR)</label>
                              <input
                                type="number"
                                value={newTreeForm.price}
                                onChange={(e) => setNewTreeForm({ ...newTreeForm, price: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-xs"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold mb-2">Soil Type</label>
                              <input
                                type="text"
                                value={newTreeForm.soilType}
                                onChange={(e) => setNewTreeForm({ ...newTreeForm, soilType: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold mb-2">Irrigation Method</label>
                              <input
                                type="text"
                                value={newTreeForm.irrigation}
                                onChange={(e) => setNewTreeForm({ ...newTreeForm, irrigation: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold mb-2">Tree Profile Picture</label>
                            
                            <div className="flex gap-4 items-center bg-white border-2 border-gray-100 p-4 rounded-2xl">
                              {/* Thumbnail preview */}
                              <div className="w-16 h-16 rounded-xl bg-gray-50 border overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                                {newTreeForm.image ? (
                                  <img src={newTreeForm.image.startsWith('/') ? `http://localhost:8000${newTreeForm.image}` : newTreeForm.image} alt="Tree Preview" className="w-full h-full object-cover" />
                                ) : (
                                  <Camera className="w-6 h-6 text-gray-400" />
                                )}
                                {isUploadingTreeImage && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 space-y-1.5">
                                <div className="text-[10px] text-gray-500 font-bold">Upload a fresh picture of the orchard tree from your device, or paste a URL below.</div>
                                <div className="flex gap-2">
                                  <label className="px-4 py-2 bg-[var(--forest-green)] text-white hover:bg-[var(--deep-forest)] rounded-xl text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1">
                                    {isUploadingTreeImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                    Choose Photo
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleTreeImageUpload}
                                      className="hidden"
                                    />
                                  </label>
                                  {newTreeForm.image && (
                                    <span className="px-2 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold flex items-center gap-0.5 border border-emerald-100">
                                      <Check className="w-3.5 h-3.5" /> Ready
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* URL input backup */}
                            <div className="mt-2.5">
                              <span className="text-[9px] font-black text-gray-400 block mb-1 uppercase tracking-wider">Or Image URL Link</span>
                              <input
                                type="text"
                                value={newTreeForm.image}
                                onChange={(e) => setNewTreeForm({ ...newTreeForm, image: e.target.value })}
                                placeholder="Paste image link URL..."
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] text-[10px]"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-xs disabled:opacity-60 flex items-center justify-center gap-2"
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Tree to Registry'}
                          </button>
                        </div>

                        {/* AI Recommendations panel Right */}
                        <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-600/10 space-y-4">
                          <h4 className="font-bold text-xs text-[var(--forest-green)] flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-[var(--golden-sun)] animate-pulse" /> AI Advisory Panel
                          </h4>
                          {aiSuggestions && (
                            <div className="space-y-3 text-xs">
                              <div className="border-b pb-2">
                                <span className="text-[10px] text-gray-500 font-bold block">Recommended Price</span>
                                <span className="font-black text-sm text-[var(--forest-green)]">{aiSuggestions.suggestedPrice}</span>
                              </div>
                              <div className="border-b pb-2">
                                <span className="text-[10px] text-gray-500 font-bold block">Predicted Yield / Season</span>
                                <span className="font-black text-[var(--deep-forest)]">{aiSuggestions.predictedYield}</span>
                              </div>
                              <div className="border-b pb-2">
                                <span className="text-[10px] text-gray-500 font-bold block">Guardian Interest / Demand</span>
                                <span className="font-bold text-orange-600">{aiSuggestions.popularity}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-500 font-bold block">AI Soil Advice</span>
                                <p className="text-[10px] text-emerald-800 leading-relaxed mt-1">{aiSuggestions.healthRecommendation}</p>
                              </div>
                            </div>
                          )}
                        </div>

                      </form>
                    </div>
                  )}

                  {/* APP WINDOW 4: TREE DETAILS AND GROWTH TIMELINE UPLOADER */}
                  {activePage === 'tree-details' && (
                    <div className="space-y-6">
                      <button
                        onClick={() => setActivePage('trees')}
                        className="px-4 py-2 border rounded-full text-xs font-bold flex items-center gap-2 bg-white hover:bg-gray-50"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to Tree Registry
                      </button>

                      {(() => {
                        const targetId = selectedTreeId || (trees[0] ? trees[0].id : '');
                        const targetTree = trees.find(t => t.id === targetId) || trees[0];
                        if (!targetTree) return <div className="text-center">No trees available.</div>;

                        return (
                          <div className="grid md:grid-cols-3 gap-6">
                            
                            {/* Main Tree Card details Left */}
                            <div className="bg-white rounded-3xl p-6 shadow border border-gray-100 space-y-4">
                              <div className="h-56 rounded-2xl overflow-hidden">
                                <img src={targetTree.tree_images?.[0]} alt="tree" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-[var(--deep-forest)]">Royal {targetTree.fruit_type}</h3>
                                <p className="text-xs text-[var(--earth-brown)] flex items-center gap-1 mt-1">
                                  <MapPin className="w-3.5 h-3.5" /> Row #{targetTree.tree_age}y • ID: {targetTree.id?.slice(-8)}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-center text-xs bg-[var(--light-sage)]/25 p-3 rounded-2xl">
                                <div>
                                  <span className="text-[9px] text-gray-500 font-bold">Yield</span>
                                  <div className="font-bold text-[var(--forest-green)]">{targetTree.expected_yield}kg</div>
                                </div>
                                <div>
                                  <span className="text-[9px] text-gray-500 font-bold">Health</span>
                                  <div className="font-bold text-[var(--forest-green)]">{(targetTree.health_score * 10).toFixed(0)}%</div>
                                </div>
                              </div>

                              {/* Simulated Adopter information */}
                              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200/20 text-xs">
                                <div className="flex items-center gap-2 font-bold text-orange-700">
                                  <Heart className="w-4 h-4 text-orange-600 animate-pulse" /> Adopter Occasion Gift
                                </div>
                                <div className="mt-2 font-semibold text-[var(--deep-forest)]">Guardian: Rohan Sharma</div>
                                <div className="text-[10px] text-orange-800 mt-1">"In memory of grandpa who loved mangoes."</div>
                              </div>
                            </div>

                            {/* Uploader and timeline right */}
                            <div className="md:col-span-2 space-y-6">
                              
                              {/* Growth stages timeline progress indicator */}
                              <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
                                <h3 className="font-bold text-sm text-[var(--deep-forest)] mb-4">Tree Growth Stage</h3>
                                <div className="flex justify-between items-center text-xs font-bold text-[var(--earth-brown)] max-w-lg mx-auto relative before:absolute before:h-1 before:bg-gray-200 before:w-full before:top-2.5">
                                  <div className="flex flex-col items-center gap-2 relative z-10">
                                    <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px]">✓</span>
                                    <span>Sapling</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-2 relative z-10">
                                    <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px]">✓</span>
                                    <span>Budding</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-2 relative z-10">
                                    <span className="w-6 h-6 rounded-full bg-[var(--forest-green)] text-white flex items-center justify-center text-[10px]">3</span>
                                    <span className="text-[var(--forest-green)]">Flowering</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-2 relative z-10">
                                    <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px]">4</span>
                                    <span className="opacity-50">Fruiting</span>
                                  </div>
                                </div>
                              </div>

                              {/* Story update form */}
                              <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
                                <h3 className="font-bold text-sm text-[var(--deep-forest)] mb-4">Post growth updates to timeline</h3>
                                <form onSubmit={handleUploadStorySubmit} className="space-y-4 text-xs">
                                  <div>
                                    <label className="block font-bold mb-1">Update Title</label>
                                    <input
                                      type="text"
                                      value={newStoryTitle}
                                      onChange={(e) => setNewStoryTitle(e.target.value)}
                                      placeholder="e.g. Beautiful white flowers blooming!"
                                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)]"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold mb-1">Grower's Description</label>
                                    <textarea
                                      value={newStoryDesc}
                                      onChange={(e) => setNewStoryDesc(e.target.value)}
                                      placeholder="Describe the soil humidity, weather conditions or new buds..."
                                      rows={3}
                                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] animate-none"
                                      required
                                    />
                                  </div>
                                  <button
                                    type="submit"
                                    className="px-6 py-3 bg-[var(--forest-green)] text-white font-bold rounded-full hover:bg-[var(--deep-forest)] transition-all flex items-center gap-2"
                                  >
                                    <Sparkle className="w-4 h-4" /> Publish Timeline Update
                                  </button>
                                </form>
                              </div>

                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* APP WINDOW 5: ADOPTIONS BOARD */}
                  {activePage === 'adoptions' && (
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--deep-forest)]">Adoption Registries</h2>
                          <p className="text-xs text-[var(--earth-brown)]">Manage active virtual guardians and view printed tree certificates</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {(['all', 'active', 'pending', 'expired'] as const).map(f => (
                            <button key={f} onClick={() => setAdoptionFilter(f)}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${
                                adoptionFilter === f
                                  ? 'bg-[var(--forest-green)] text-white shadow'
                                  : 'bg-white border border-gray-200 text-[var(--earth-brown)] hover:border-[var(--forest-green)]'
                              }`}
                            >{f}</button>
                          ))}
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-4 shadow border border-gray-100 text-center">
                          <div className="text-2xl font-black text-[var(--forest-green)]">{adoptions.length}</div>
                          <div className="text-[10px] text-[var(--earth-brown)] font-bold uppercase tracking-wider mt-1">Total Guardians</div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow border border-gray-100 text-center">
                          <div className="text-2xl font-black text-emerald-600">{adoptions.filter(a => a.status === 'active').length}</div>
                          <div className="text-[10px] text-[var(--earth-brown)] font-bold uppercase tracking-wider mt-1">Active</div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow border border-gray-100 text-center">
                          <div className="text-2xl font-black text-amber-500">{adoptions.filter(a => a.status === 'pending').length}</div>
                          <div className="text-[10px] text-[var(--earth-brown)] font-bold uppercase tracking-wider mt-1">Pending</div>
                        </div>
                      </div>

                      {/* Cards */}
                      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {adoptions
                          .filter(a => adoptionFilter === 'all' || a.status === adoptionFilter)
                          .map((ad) => {
                            const associatedTree = trees.find(t => t.id === ad.treeId);
                            const statusColors: Record<string, string> = {
                              active: 'bg-emerald-100 text-emerald-700',
                              pending: 'bg-amber-100 text-amber-700',
                              expired: 'bg-gray-100 text-gray-500',
                            };
                            return (
                              <div key={ad.id} className="bg-white rounded-3xl shadow border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all">
                                {/* Tree image banner */}
                                <div className="h-28 bg-gradient-to-br from-[var(--forest-green)] to-[var(--leaf-green)] relative overflow-hidden">
                                  {associatedTree?.tree_images?.[0] && (
                                    <img src={associatedTree.tree_images[0]} alt="tree" className="w-full h-full object-cover opacity-60" />
                                  )}
                                  <div className="absolute inset-0 flex items-end p-4">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${statusColors[ad.status] || 'bg-gray-100 text-gray-500'}`}>
                                      {ad.status}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-5 flex flex-col gap-3 flex-1">
                                  {/* Adopter info */}
                                  <div className="flex items-center gap-3">
                                    {ad.avatar ? (
                                      <img src={ad.avatar} alt={ad.adopterName} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-black text-orange-700 border-2 border-white shadow">
                                        {ad.adopterName.charAt(0)}
                                      </div>
                                    )}
                                    <div>
                                      <h4 className="font-bold text-sm text-[var(--deep-forest)]">{ad.adopterName}</h4>
                                      <p className="text-[10px] text-gray-400">Since {ad.date}</p>
                                    </div>
                                  </div>

                                  {/* Tree & occasion */}
                                  <div className="bg-[var(--light-sage)]/25 rounded-2xl p-3 text-xs space-y-1.5 border border-[var(--forest-green)]/5">
                                    <div className="flex justify-between">
                                      <span className="text-gray-400 font-bold">Tree</span>
                                      <span className="font-bold text-[var(--deep-forest)]">
                                        {associatedTree ? `${associatedTree.fruit_type} #${associatedTree.id?.slice(-4)}` : 'Alphonso Mango'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400 font-bold">Occasion</span>
                                      <span className="font-bold text-orange-600">{ad.occasion}</span>
                                    </div>
                                    {ad.message && (
                                      <p className="text-[10px] text-[var(--earth-brown)] border-t pt-2 leading-relaxed italic">
                                        "{ad.message}"
                                      </p>
                                    )}
                                  </div>

                                  {/* Delivery address — key info for farmer */}
                                  {ad.address && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 space-y-1">
                                      <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-700 uppercase tracking-wider">
                                        <MapPin className="w-3 h-3" /> Harvest Delivery Address
                                      </div>
                                      <p className="text-xs font-bold text-[var(--deep-forest)]">{ad.adopterName}</p>
                                      {ad.phone && <p className="text-[10px] text-[var(--earth-brown)] font-semibold">{ad.phone}</p>}
                                      <p className="text-[10px] text-[var(--earth-brown)] leading-relaxed">
                                        {ad.address.line1}{ad.address.line2 ? `, ${ad.address.line2}` : ''}<br />
                                        {ad.address.city}, {ad.address.state} — {ad.address.pincode}
                                      </p>
                                      <button
                                        onClick={() => {
                                          const full = `${ad.address.line1}${ad.address.line2 ? ', ' + ad.address.line2 : ''}, ${ad.address.city}, ${ad.address.state} - ${ad.address.pincode}`;
                                          navigator.clipboard.writeText(full);
                                          toast.success('Address copied to clipboard!');
                                        }}
                                        className="text-[9px] font-bold text-amber-600 hover:text-amber-800 underline mt-0.5"
                                      >
                                        Copy Address
                                      </button>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex gap-2 mt-auto">
                                    <button
                                      onClick={() => { setActivePage('chat'); setActiveChatId('1'); }}
                                      className="flex-1 py-2.5 bg-[var(--forest-green)] text-white hover:bg-[var(--deep-forest)] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" /> Chat
                                    </button>
                                    <button
                                      onClick={() => {
                                        toast.success(`Certificate for ${ad.adopterName} generated! 🏆`);
                                      }}
                                      className="flex-1 py-2.5 bg-white border-2 border-gray-100 hover:bg-amber-50 hover:border-amber-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-[var(--earth-brown)]"
                                    >
                                      <Award className="w-3.5 h-3.5" /> Certificate
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                        {adoptions.filter(a => adoptionFilter === 'all' || a.status === adoptionFilter).length === 0 && (
                          <div className="col-span-3 text-center py-16 text-[var(--earth-brown)]">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-bold">No {adoptionFilter !== 'all' ? adoptionFilter : ''} adoptions found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* APP WINDOW 6: HARVEST LOG & SHIPMENT STEPS */}
                  {activePage === 'harvests' && (
                    <div className="space-y-6">

                      {/* Header + filter */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--deep-forest)]">Harvest Management</h2>
                          <p className="text-xs text-[var(--earth-brown)]">Log crop yields, track packaging and dispatch status</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {(['all', 'processing', 'shipped', 'delivered'] as const).map(f => (
                            <button key={f} onClick={() => setHarvestFilter(f)}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${
                                harvestFilter === f
                                  ? 'bg-[var(--forest-green)] text-white shadow'
                                  : 'bg-white border border-gray-200 text-[var(--earth-brown)] hover:border-[var(--forest-green)]'
                              }`}
                            >{f}</button>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-4 shadow border border-gray-100 text-center">
                          <div className="text-2xl font-black text-[var(--forest-green)]">
                            {harvests.reduce((s, h) => s + h.quantity, 0).toFixed(1)} kg
                          </div>
                          <div className="text-[10px] text-[var(--earth-brown)] font-bold uppercase tracking-wider mt-1">Total Yield</div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow border border-gray-100 text-center">
                          <div className="text-2xl font-black text-amber-500">{harvests.filter(h => h.status === 'processing').length}</div>
                          <div className="text-[10px] text-[var(--earth-brown)] font-bold uppercase tracking-wider mt-1">Processing</div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow border border-gray-100 text-center">
                          <div className="text-2xl font-black text-emerald-600">{harvests.filter(h => h.status === 'delivered').length}</div>
                          <div className="text-[10px] text-[var(--earth-brown)] font-bold uppercase tracking-wider mt-1">Delivered</div>
                        </div>
                      </div>

                      {/* Log New Harvest */}
                      <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
                        <h3 className="font-bold text-sm text-[var(--deep-forest)] mb-4 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-[var(--forest-green)]" /> Log New Harvest Crop Yield
                        </h3>
                        <form onSubmit={handleHarvestSubmit} className="grid sm:grid-cols-4 gap-4 text-xs items-end">
                          <div>
                            <label className="block font-bold mb-1">Select Tree</label>
                            <select
                              value={harvestForm.treeId}
                              onChange={(e) => setHarvestForm({ ...harvestForm, treeId: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] bg-white"
                              required
                            >
                              <option value="">-- Choose tree --</option>
                              {trees.map(t => (
                                <option key={t.id} value={t.id}>{t.fruit_type} (#{t.id?.slice(-6)})</option>
                              ))}
                              {trees.length === 0 && (
                                <>
                                  <option value="mock-1">Alphonso Mango (#111111)</option>
                                  <option value="mock-2">Organic Apple (#222222)</option>
                                </>
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block font-bold mb-1">Yield (kg)</label>
                            <input
                              type="number" step="0.1"
                              value={harvestForm.qty}
                              onChange={(e) => setHarvestForm({ ...harvestForm, qty: e.target.value })}
                              placeholder="e.g. 15.5"
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)]"
                              required
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">Grade</label>
                            <select
                              value={harvestForm.grade}
                              onChange={(e) => setHarvestForm({ ...harvestForm, grade: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] bg-white"
                            >
                              <option value="A">Grade A — Premium</option>
                              <option value="B">Grade B — Choice</option>
                              <option value="C">Grade C — Standard</option>
                            </select>
                          </div>
                          <button type="submit" disabled={isLoading}
                            className="w-full py-3 bg-[var(--forest-green)] text-white font-bold rounded-xl hover:bg-[var(--deep-forest)] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Log Yield</>}
                          </button>
                        </form>
                      </div>

                      {/* Harvest Cards */}
                      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {harvests
                          .filter(h => harvestFilter === 'all' || h.status === harvestFilter)
                          .map((h) => {
                            const statusStep = { processing: 1, shipped: 2, delivered: 3 }[h.status] || 0;
                            const gradeColor = { A: 'text-emerald-600 bg-emerald-50 border-emerald-100', B: 'text-blue-600 bg-blue-50 border-blue-100', C: 'text-gray-600 bg-gray-50 border-gray-100' }[h.grade] || '';
                            const steps = ['Harvested', 'Cleaned & Packed', 'Shipped', 'Delivered'];
                            return (
                              <div key={h.id} className="bg-white rounded-3xl p-6 shadow border border-gray-100 space-y-4 hover:shadow-lg transition-all">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold text-sm text-[var(--deep-forest)]">{h.treeType} Harvest</h4>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{h.date} · ID: {h.id}</p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${gradeColor}`}>
                                    Grade {h.grade}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="bg-[var(--light-sage)]/25 rounded-xl p-3 border border-[var(--forest-green)]/5">
                                    <div className="text-[10px] text-gray-400 font-bold">Quantity</div>
                                    <div className="font-black text-lg text-[var(--forest-green)] mt-0.5">{h.quantity} kg</div>
                                  </div>
                                  <div className="bg-[var(--light-sage)]/25 rounded-xl p-3 border border-[var(--forest-green)]/5">
                                    <div className="text-[10px] text-gray-400 font-bold">Est. Value</div>
                                    <div className="font-black text-lg text-emerald-600 mt-0.5">
                                      ₹{(h.quantity * (h.grade === 'A' ? 320 : h.grade === 'B' ? 220 : 150)).toLocaleString('en-IN')}
                                    </div>
                                  </div>
                                </div>

                                {/* Pipeline steps */}
                                <div className="space-y-2">
                                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pipeline Status</div>
                                  <div className="flex gap-1">
                                    {steps.map((step, i) => (
                                      <div key={step} className="flex-1 flex flex-col items-center gap-1">
                                        <div className={`w-full h-1.5 rounded-full ${
                                          i < statusStep + 1 ? 'bg-[var(--forest-green)]' : 'bg-gray-200'
                                        }`} />
                                        <span className={`text-[8px] font-bold text-center leading-tight ${
                                          i === statusStep ? 'text-[var(--forest-green)]' : i < statusStep ? 'text-gray-400' : 'text-gray-300'
                                        }`}>{step}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-1">
                                  {h.status === 'processing' && (
                                    <button
                                      onClick={() => {
                                        setHarvests(prev => prev.map(x => x.id === h.id ? { ...x, status: 'shipped' } : x));
                                        toast.success('Harvest marked as shipped! 🚚');
                                      }}
                                      className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
                                    >
                                      <ArrowRight className="w-3.5 h-3.5" /> Mark Shipped
                                    </button>
                                  )}
                                  {h.status === 'shipped' && (
                                    <button
                                      onClick={() => {
                                        setHarvests(prev => prev.map(x => x.id === h.id ? { ...x, status: 'delivered' } : x));
                                        setDeliveries(prev => prev.map(x => x.harvestId === h.id ? { ...x, status: 'delivered', progress: 100 } : x));
                                        toast.success('Harvest marked as delivered! ✅');
                                      }}
                                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-1"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" /> Mark Delivered
                                    </button>
                                  )}
                                  {h.status === 'delivered' && (
                                    <div className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border border-emerald-100">
                                      <CheckCircle className="w-3.5 h-3.5" /> Completed
                                    </div>
                                  )}
                                  <button
                                    onClick={() => {
                                      setActivePage('deliveries');
                                      setSelectedDeliveryId(deliveries.find(d => d.harvestId === h.id)?.id || null);
                                    }}
                                    className="px-3 py-2 bg-gray-50 border border-gray-200 text-[var(--earth-brown)] rounded-xl font-bold text-xs hover:bg-gray-100 transition-all flex items-center gap-1"
                                  >
                                    <Map className="w-3.5 h-3.5" /> Track
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                        {harvests.filter(h => harvestFilter === 'all' || h.status === harvestFilter).length === 0 && (
                          <div className="col-span-3 text-center py-16 text-[var(--earth-brown)]">
                            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-bold">No {harvestFilter !== 'all' ? harvestFilter : ''} harvests found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* APP WINDOW 7: DELIVERIES AND LOGISTICS */}
                  {activePage === 'deliveries' && (
                    <div className="space-y-6">

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--deep-forest)]">Deliveries & Logistics</h2>
                          <p className="text-xs text-[var(--earth-brown)]">Track shipments, update status, and upload delivery proof</p>
                        </div>
                        <div className="flex gap-3 text-xs font-bold">
                          <div className="bg-white rounded-2xl px-4 py-2 shadow border border-gray-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            {deliveries.filter(d => d.status === 'processing').length} Processing
                          </div>
                          <div className="bg-white rounded-2xl px-4 py-2 shadow border border-gray-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {deliveries.filter(d => d.status === 'shipped').length} In Transit
                          </div>
                          <div className="bg-white rounded-2xl px-4 py-2 shadow border border-gray-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {deliveries.filter(d => d.status === 'delivered').length} Delivered
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">

                        {/* Shipment list */}
                        <div className="flex flex-col gap-4">
                          <h3 className="font-bold text-sm text-[var(--deep-forest)]">All Shipments</h3>
                          {deliveries.map((d) => {
                            const statusStyle: Record<string, string> = {
                              processing: 'bg-amber-100 text-amber-700',
                              shipped: 'bg-blue-100 text-blue-700',
                              delivered: 'bg-emerald-100 text-emerald-700',
                            };
                            const isSelected = (selectedDeliveryId || deliveries[0]?.id) === d.id;
                            return (
                              <button
                                key={d.id}
                                onClick={() => setSelectedDeliveryId(d.id)}
                                className={`text-left bg-white rounded-3xl p-5 shadow border transition-all space-y-3 text-xs ${
                                  isSelected ? 'border-[var(--forest-green)] ring-2 ring-[var(--forest-green)]/20' : 'border-gray-100 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex justify-between items-center font-bold">
                                  <span className="text-gray-500 text-[10px]">{d.trackingNo}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black ${statusStyle[d.status] || ''}`}>{d.status}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[10px] font-bold">Recipient</span>
                                  <span className="font-black text-[var(--deep-forest)]">{d.recipient}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[10px] font-bold">Address</span>
                                  <span className="text-[10px] text-[var(--earth-brown)]">{d.address2 ? `${d.address2}, ` : ''}{d.city}, {d.state}</span>
                                </div>
                                <div>
                                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                    <span>Progress</span><span>{d.progress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        d.status === 'delivered' ? 'bg-emerald-500' :
                                        d.status === 'shipped' ? 'bg-blue-500' : 'bg-amber-400'
                                      }`}
                                      style={{ width: `${d.progress}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold">📅 ETA: {d.eta}</div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Detail panel */}
                        {(() => {
                          const d = deliveries.find(x => x.id === (selectedDeliveryId || deliveries[0]?.id));
                          if (!d) return <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow border border-gray-100 flex items-center justify-center text-[var(--earth-brown)]">Select a shipment</div>;
                          const trackSteps = [
                            { label: 'Order Placed', done: true },
                            { label: 'Packed at Farm', done: d.progress >= 20 },
                            { label: 'Picked Up by Courier', done: d.progress >= 40 },
                            { label: 'In Transit', done: d.progress >= 65 },
                            { label: 'Out for Delivery', done: d.progress >= 85 },
                            { label: 'Delivered', done: d.progress >= 100 },
                          ];
                          return (
                            <div className="md:col-span-2 space-y-4">

                              {/* Map */}
                              <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="font-bold text-sm text-[var(--deep-forest)]">Route Tracking — {d.trackingNo}</h3>
                                    <p className="text-xs text-[var(--earth-brown)] mt-0.5">Farm → {d.city}, {d.state}</p>
                                  </div>
                                  <span className="text-xs font-bold text-[var(--forest-green)] bg-[var(--light-sage)]/40 px-3 py-1 rounded-full">
                                    ETA: {d.eta}
                                  </span>
                                </div>

                                {/* Full address card */}
                                <div className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                                  <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">Ship To</div>
                                    <p className="text-sm font-bold text-[var(--deep-forest)]">{d.recipient}</p>
                                    <p className="text-xs text-[var(--earth-brown)] font-semibold">{d.phone}</p>
                                    <p className="text-xs text-[var(--earth-brown)] mt-1 leading-relaxed">
                                      {d.address}{d.address2 ? `, ${d.address2}` : ''}<br />
                                      {d.city}, {d.state} — {d.pincode}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const full = `${d.recipient}\n${d.phone}\n${d.address}${d.address2 ? ', ' + d.address2 : ''}\n${d.city}, ${d.state} - ${d.pincode}`;
                                      navigator.clipboard.writeText(full);
                                      toast.success('Address copied!');
                                    }}
                                    className="text-[9px] font-bold text-amber-600 hover:text-amber-800 underline self-start mt-1 flex-shrink-0"
                                  >
                                    Copy
                                  </button>
                                </div>

                                <div className="h-52 rounded-2xl bg-sky-50 border relative overflow-hidden flex items-center justify-center">
                                  <div className="absolute inset-0 bg-[radial-gradient(#1b4332_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
                                  <svg className="w-full h-full absolute inset-0">
                                    <path d="M 80 160 Q 220 80 380 120" fill="none" stroke="var(--forest-green)" strokeWidth="3" strokeDasharray="6 4" />
                                    {d.progress > 0 && d.progress < 100 && (
                                      <circle cx={80 + (380 - 80) * d.progress / 100} cy={160 - Math.sin(Math.PI * d.progress / 100) * 80} r="6" fill="var(--forest-green)" />
                                    )}
                                  </svg>
                                  <div className="absolute left-[60px] top-[140px] text-center">
                                    <MapPin className="w-6 h-6 text-[var(--forest-green)] drop-shadow" />
                                    <span className="text-[8px] font-bold bg-white px-1 rounded border">Farm</span>
                                  </div>
                                  <div className="absolute left-[360px] top-[100px] text-center">
                                    <MapPin className={`w-6 h-6 drop-shadow ${d.status === 'delivered' ? 'text-emerald-600' : 'text-orange-600 animate-bounce'}`} />
                                    <span className="text-[8px] font-bold bg-white px-1 rounded border">{d.recipient}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Timeline steps */}
                              <div className="bg-white rounded-3xl p-6 shadow border border-gray-100">
                                <h3 className="font-bold text-sm text-[var(--deep-forest)] mb-4">Shipment Timeline</h3>
                                <div className="space-y-3">
                                  {trackSteps.map((step, i) => (
                                    <div key={step.label} className="flex items-center gap-3">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
                                        step.done ? 'bg-[var(--forest-green)] text-white' : 'bg-gray-100 text-gray-400'
                                      }`}>
                                        {step.done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                                      </div>
                                      <div className={`flex-1 h-px ${i < trackSteps.length - 1 ? (step.done ? 'bg-[var(--forest-green)]/30' : 'bg-gray-100') : ''}`} />
                                      <span className={`text-xs font-bold ${
                                        step.done ? 'text-[var(--deep-forest)]' : 'text-gray-300'
                                      }`}>{step.label}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="bg-white rounded-3xl p-6 shadow border border-gray-100 flex flex-wrap gap-3">
                                {d.status === 'processing' && (
                                  <button
                                    onClick={() => {
                                      setDeliveries(prev => prev.map(x => x.id === d.id ? { ...x, status: 'shipped', progress: 65 } : x));
                                      setHarvests(prev => prev.map(x => x.id === d.harvestId ? { ...x, status: 'shipped' } : x));
                                      toast.success('Shipment dispatched! Courier notified. 🚚');
                                    }}
                                    className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 transition-all flex items-center gap-2"
                                  >
                                    <ArrowRight className="w-4 h-4" /> Dispatch Shipment
                                  </button>
                                )}
                                {d.status === 'shipped' && (
                                  <button
                                    onClick={() => {
                                      setDeliveries(prev => prev.map(x => x.id === d.id ? { ...x, status: 'delivered', progress: 100 } : x));
                                      setHarvests(prev => prev.map(x => x.id === d.harvestId ? { ...x, status: 'delivered' } : x));
                                      toast.success('Delivery confirmed! ✅ Guardian notified.');
                                    }}
                                    className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-full hover:bg-emerald-700 transition-all flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" /> Confirm Delivery
                                  </button>
                                )}
                                {d.status === 'delivered' && (
                                  <div className="px-6 py-2.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Delivery Complete
                                  </div>
                                )}
                                <button
                                  onClick={() => toast.success('Proof of delivery uploaded! 📸')}
                                  className="px-6 py-2.5 bg-white border-2 border-gray-200 text-[var(--earth-brown)] text-xs font-bold rounded-full hover:bg-gray-50 transition-all flex items-center gap-2"
                                >
                                  <Camera className="w-4 h-4" /> Upload Proof Photo
                                </button>
                                <button
                                  onClick={() => toast.success(`Tracking link sent to ${d.recipient}!`)}
                                  className="px-6 py-2.5 bg-white border-2 border-gray-200 text-[var(--earth-brown)] text-xs font-bold rounded-full hover:bg-gray-50 transition-all flex items-center gap-2"
                                >
                                  <Send className="w-4 h-4" /> Send Tracking Link
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* APP WINDOW 10: EARNINGS AND WALLET payouts */}
                  {activePage === 'wallet' && (
                    <div className="space-y-6">
                      
                      {/* wallet status */}
                      <div className="grid md:grid-cols-3 gap-6">
                        
                        {/* current balance */}
                        <div className="bg-white rounded-3xl p-6 shadow border border-gray-100 flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Withdrawable Balance</span>
                            <div className="text-4xl font-black text-[var(--forest-green)] mt-2">₹{walletBalance.toLocaleString('en-IN')}</div>
                            <p className="text-[10px] text-gray-400 mt-2">Cleared payouts from active monthly subscriptions</p>
                          </div>
                          <button
                            onClick={() => setShowWithdrawalModal(true)}
                            className="w-full py-3 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                          >
                            Submit Withdrawal Payout
                          </button>
                        </div>

                        {/* Payout Bank info */}
                        <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow border border-gray-100 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-bold text-sm text-[var(--deep-forest)] flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-[var(--forest-green)]" /> Bank Settings & Payout Target
                            </h3>
                            <button
                              onClick={() => setShowBankModal(true)}
                              className="px-4 py-2 bg-green-100 text-green-700 text-xs font-bold rounded-lg hover:bg-green-200 transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4 text-xs">
                            <div className="p-4 bg-gray-50 rounded-2xl border">
                              <span className="text-[10px] text-gray-400 font-bold block">Institution Bank Name</span>
                              <span className="font-bold text-[var(--deep-forest)] mt-1 block">HDFC Bank Limited</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border">
                              <span className="text-[10px] text-gray-400 font-bold block">Account Number</span>
                              <span className="font-bold text-[var(--deep-forest)] mt-1 block">•••• •••• 4302</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border">
                              <span className="text-[10px] text-gray-400 font-bold block">IFS Code</span>
                              <span className="font-bold text-[var(--deep-forest)] mt-1 block">HDFC0002841</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border">
                              <span className="text-[10px] text-gray-400 font-bold block">Payout Cycle</span>
                              <span className="font-bold text-[var(--deep-forest)] mt-1 block">Automatic (Weekly Monday)</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Transaction logs */}
                      <div className="bg-white rounded-3xl p-6 shadow border border-gray-100 space-y-4">
                        <h3 className="font-bold text-sm text-[var(--deep-forest)]">Payout History Log</h3>
                        <div className="overflow-x-auto text-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gray-100 text-[var(--earth-brown)] font-bold">
                                <th className="py-3">Payout ID</th>
                                <th className="py-3">Date</th>
                                <th className="py-3">Destination Method</th>
                                <th className="py-3 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {payoutHistory.map((pay) => (
                                <tr key={pay.id}>
                                  <td className="py-3 font-semibold text-[var(--deep-forest)]">{pay.id}</td>
                                  <td className="py-3 text-gray-500">{pay.date}</td>
                                  <td className="py-3 text-gray-500">{pay.method}</td>
                                  <td className="py-3 text-right font-black text-emerald-600">₹{pay.amount.toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}



                  {/* APP WINDOW 12: CHAT HUB — redirect to real chat page */}
                  {activePage === 'chat' && (
                    <div className="flex flex-col items-center justify-center bg-white rounded-3xl p-16 shadow-xl border border-gray-100 text-center">
                      <MessageSquare className="w-16 h-16 text-[var(--forest-green)] mb-4 opacity-60" />
                      <h3 className="text-2xl font-bold text-[var(--deep-forest)] mb-2">Adopter Chats</h3>
                      <p className="text-[var(--earth-brown)] mb-6">Chat in real-time with your tree adopters.</p>
                      <a href="/chat">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          className="px-8 py-3 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-bold rounded-full shadow-lg flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" /> Open Chat
                        </motion.button>
                      </a>
                    </div>
                  )}



                  {/* APP WINDOW 16: SETTINGS PAGE */}
                  {activePage === 'settings' && (
                    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-xl border border-gray-100 space-y-6 text-xs">
                      
                      <div className="pb-4 border-b">
                        <h2 className="text-xl font-bold text-[var(--deep-forest)]">Platform Settings</h2>
                        <p className="text-[10px] text-gray-500">Configure language and payout parameters</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block font-bold mb-2">Grower UI Language</label>
                          <select
                            value={lang}
                            onChange={(e) => setLang(e.target.value as any)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] bg-white"
                          >
                            <option value="en">English (US)</option>
                            <option value="hi">हिन्दी (Hindi)</option>
                            <option value="mr">मराठी (Marathi)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold mb-2">Automated Payout Settings</label>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                            <span>Enable weekly auto-settlement to HDFC bank account</span>
                            <input type="checkbox" defaultChecked className="w-5 h-5 accent-[var(--forest-green)]" />
                          </div>
                        </div>

                        <div>
                        </div>
                      </div>

                      <button
                        onClick={() => toast.success('Settings configuration updated!')}
                        className="px-8 py-3 bg-[var(--forest-green)] text-white font-bold rounded-full hover:bg-[var(--deep-forest)] transition-all"
                      >
                        Save Configuration
                      </button>

                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
          </div>

          {/* Floating Mobile Quick Action FAB Button */}
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setActivePage('add-tree')}
              title="Register a Tree"
              className="w-14 h-14 bg-gradient-to-tr from-[var(--forest-green)] to-[var(--leaf-green)] rounded-full text-white flex items-center justify-center shadow-xl shadow-[var(--forest-green)]/35 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* ADD FARM PROFILE MODAL */}
          <AnimatePresence>
            {showAddFarmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop glass */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddFarmModal(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl z-10 overflow-hidden"
                >
                  {/* Close button */}
                  <button
                    onClick={() => setShowAddFarmModal(false)}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--light-sage)] text-[var(--earth-brown)] transition-all z-10"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3 pb-4 border-b mb-6">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--deep-forest)]">Configure Farm Profile</h3>
                      <p className="text-xs text-[var(--earth-brown)]">Set up a new cultivation location for your orchard trees</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddFarmSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-[var(--deep-forest)]">Farm Location Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sahyadri Mango Groves, Devgad"
                        value={newFarmForm.name}
                        onChange={(e) => setNewFarmForm({ ...newFarmForm, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] bg-white/70 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-[var(--deep-forest)]">Soil Composition</label>
                        <select
                          value={newFarmForm.soilType}
                          onChange={(e) => setNewFarmForm({ ...newFarmForm, soilType: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] bg-white/70 text-xs"
                        >
                          <option value="Laterite Soil">Laterite Soil</option>
                          <option value="Alluvial Soil">Alluvial Soil</option>
                          <option value="Red Sandy Soil">Red Sandy Soil</option>
                          <option value="Black Cotton Soil">Black Cotton Soil</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5 text-[var(--deep-forest)]">Orchard Area (Acres)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 12.5"
                          value={newFarmForm.farmSize}
                          onChange={(e) => setNewFarmForm({ ...newFarmForm, farmSize: e.target.value })}
                          required
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] bg-white/70 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-[var(--deep-forest)]">Farm Cover Image</label>
                      
                      <div className="flex gap-4 items-center bg-white border border-gray-100 p-4 rounded-2xl mb-2">
                        {/* Thumbnail preview */}
                        <div className="w-16 h-16 rounded-xl bg-gray-50 border overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                          {newFarmForm.coverImage ? (
                            <img src={newFarmForm.coverImage.startsWith('/') ? `http://localhost:8000${newFarmForm.coverImage}` : newFarmForm.coverImage} alt="Farm Preview" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-6 h-6 text-gray-400" />
                          )}
                          {isUploadingFarmImage && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <div className="text-[10px] text-gray-500 font-semibold">Upload an image of your farm location, or paste a link below.</div>
                          <div className="flex gap-2">
                            <label className="px-4 py-2 bg-[var(--forest-green)] text-white hover:bg-[var(--deep-forest)] rounded-xl text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1">
                              {isUploadingFarmImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                              Choose Photo
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFarmImageUpload}
                                className="hidden"
                              />
                            </label>
                            {newFarmForm.coverImage && (
                              <span className="px-2 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold flex items-center gap-0.5 border border-emerald-100">
                                <Check className="w-3.5 h-3.5" /> Ready
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Backup URL input */}
                      <input
                        type="text"
                        value={newFarmForm.coverImage}
                        onChange={(e) => setNewFarmForm({ ...newFarmForm, coverImage: e.target.value })}
                        placeholder="Or paste cover image URL..."
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[var(--forest-green)] bg-white/70 text-[10px]"
                      />
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-2xl flex gap-3 text-xs text-emerald-800 border border-emerald-100">
                      <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                      <span>Verified status is inherited. Organic certification will apply to all trees registered in this location.</span>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddFarmModal(false)}
                        className="flex-1 py-3.5 border border-gray-200 hover:bg-gray-50 rounded-xl font-bold text-xs text-[var(--earth-brown)] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-3.5 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Establish Farm Location'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* Bank Account Modal */}
      <BankAccountModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        onSave={() => toast.success('Bank details updated successfully!')}
      />

      {/* Withdrawal Request Modal */}
      <WithdrawalRequestModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        availableBalance={walletBalance}
      />

    </div>
  );
}
