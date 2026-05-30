import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Leaf, User, Menu, X, TreePine, MessageSquare, ChevronDown,
  Grid, Award, Users, ClipboardList, DollarSign, Settings,
  Globe, Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FARMER_MENU = [
  { id: 'dashboard',  label: 'Dashboard',       icon: <Grid className="w-4 h-4" /> },
  { id: 'trees',      label: 'My Trees',         icon: <TreePine className="w-4 h-4" /> },
  { id: 'adoptions',  label: 'Adoptions',        icon: <Users className="w-4 h-4" /> },
  { id: 'harvests',   label: 'Harvests',         icon: <Award className="w-4 h-4" /> },
  { id: 'deliveries', label: 'Deliveries',       icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'wallet',     label: 'Wallet & Payouts', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'chat',       label: 'Adopter Chats',    icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'settings',   label: 'Settings',         icon: <Settings className="w-4 h-4" /> },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
];

export function Navigation() {
  const { user, isAuthenticated, setShowAuthModal } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [farmerMenuOpen, setFarmerMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const farmerMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';
  const isFarmer = user?.role === 'farmer' || user?.role === 'admin';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (farmerMenuRef.current && !farmerMenuRef.current.contains(e.target as Node)) setFarmerMenuOpen(false);
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setLangMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFarmerNav = (id: string) => {
    setFarmerMenuOpen(false);
    setMobileMenuOpen(false);
    navigate('/dashboard', { state: { page: id, ts: Date.now() } });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || !isHome ? 'bg-white/80 backdrop-blur-xl shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }} className="relative">
              <Leaf className="w-8 h-8 text-[var(--forest-green)]" />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-[var(--leaf-green)] opacity-20 rounded-full blur-lg"
              />
            </motion.div>
            <span className="text-2xl font-bold text-[var(--deep-forest)] tracking-tight">TreeBond</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/explore">Explore Trees</NavLink>
            <NavLink to="/sustainability">Sustainability</NavLink>

            {/* Farmer dropdown */}
            {isAuthenticated && isFarmer && (
              <div ref={farmerMenuRef} className="relative">
                <button
                  onClick={() => setFarmerMenuOpen(v => !v)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    farmerMenuOpen ? 'text-[var(--forest-green)]' : 'text-[var(--earth-brown)] hover:text-[var(--forest-green)]'
                  }`}
                >
                  <TreePine className="w-4 h-4" />
                  Farm OS
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${farmerMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {farmerMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                      {/* Language selector at top */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-[var(--light-sage)]/20">
                        <p className="text-[10px] font-bold text-[var(--earth-brown)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Globe className="w-3 h-3" /> Language
                        </p>
                        <div className="flex gap-1.5">
                          {LANGUAGES.map(l => (
                            <button key={l.code} onClick={() => setLang(l.code)}
                              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                lang === l.code
                                  ? 'bg-[var(--forest-green)] text-white'
                                  : 'bg-white text-[var(--earth-brown)] hover:bg-gray-50 border border-gray-200'
                              }`}
                            >
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Nav items */}
                      <div className="py-1.5">
                        {FARMER_MENU.map(item => (
                          <button key={item.id} onClick={() => handleFarmerNav(item.id)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--earth-brown)] hover:bg-[var(--light-sage)]/30 hover:text-[var(--forest-green)] transition-colors text-left"
                          >
                            <span className="text-[var(--forest-green)]">{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && (
              <Link to="/chat">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-full hover:bg-[var(--light-sage)] transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-[var(--forest-green)]" />
                </motion.button>
              </Link>
            )}

            {isAuthenticated ? (
              <Link to="/profile">
                <motion.div whileHover={{ scale: 1.03 }}
                  className="flex items-center gap-2.5 bg-[var(--light-sage)]/40 px-4 py-2 rounded-full border border-[var(--forest-green)]/10 cursor-pointer hover:bg-[var(--light-sage)]/70 transition-colors"
                >
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-[var(--forest-green)]" />
                  )}
                  <span className="text-sm font-semibold text-[var(--deep-forest)]">{user?.name}</span>
                  <span className="text-xs text-[var(--golden-sun)] font-bold">✨ {user?.eco_points}p</span>
                </motion.div>
              </Link>
            ) : (
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowAuthModal(true)}
                className="p-2 rounded-full hover:bg-[var(--light-sage)] transition-colors flex items-center gap-2"
              >
                <User className="w-5 h-5 text-[var(--forest-green)]" />
                <span className="text-sm font-semibold text-[var(--forest-green)] hidden lg:inline">Sign In</span>
              </motion.button>
            )}

            <Link to="/orchard">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(27, 67, 50, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2.5 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white rounded-full font-medium shadow-lg flex items-center gap-2 text-sm"
              >
                <TreePine className="w-4 h-4" />
                My Orchard
              </motion.button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-[var(--forest-green)]">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl md:hidden pt-20 overflow-y-auto"
          >
            <div className="flex flex-col gap-2 p-6">
              <MobileNavLink to="/explore" onClick={() => setMobileMenuOpen(false)}>Explore Trees</MobileNavLink>
              <MobileNavLink to="/sustainability" onClick={() => setMobileMenuOpen(false)}>Sustainability</MobileNavLink>

              {isAuthenticated && isFarmer && (
                <>
                  {/* Language */}
                  <div className="mt-2 mb-1 px-2">
                    <p className="text-xs font-bold text-[var(--earth-brown)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Language
                    </p>
                    <div className="flex gap-2">
                      {LANGUAGES.map(l => (
                        <button key={l.code} onClick={() => setLang(l.code)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                            lang === l.code
                              ? 'bg-[var(--forest-green)] text-white'
                              : 'bg-gray-100 text-[var(--earth-brown)]'
                          }`}
                        >
                          {lang === l.code && <Check className="w-3 h-3" />}
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3 mt-1">
                    <p className="text-xs font-bold text-[var(--earth-brown)] uppercase tracking-wider mb-2 px-2">Farm OS</p>
                    {FARMER_MENU.map(item => (
                      <button key={item.id} onClick={() => handleFarmerNav(item.id)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium text-[var(--earth-brown)] hover:bg-[var(--light-sage)]/30 hover:text-[var(--forest-green)] transition-colors"
                      >
                        <span className="text-[var(--forest-green)]">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {isAuthenticated && (
                <MobileNavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>My Profile</MobileNavLink>
              )}

              <div className="mt-4">
                <Link to="/orchard" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full px-6 py-4 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white rounded-full font-medium shadow-lg">
                    My Orchard
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to}>
      <motion.span whileHover={{ y: -2 }}
        className={`relative text-sm font-medium transition-colors ${
          isActive ? 'text-[var(--forest-green)]' : 'text-[var(--earth-brown)] hover:text-[var(--forest-green)]'
        }`}
      >
        {children}
        {isActive && (
          <motion.div layoutId="activeTab"
            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--forest-green)] rounded-full"
          />
        )}
      </motion.span>
    </Link>
  );
}

function MobileNavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick}
      className="text-xl font-medium text-[var(--deep-forest)] hover:text-[var(--forest-green)] transition-colors px-2 py-2"
    >
      {children}
    </Link>
  );
}
