import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { ExplorePage } from './pages/ExplorePage';
import { TreeDetail } from './pages/TreeDetail';
import { TreeCeremony } from './pages/TreeCeremony';
import { MyOrchard } from './pages/MyOrchard';
import { AdoptedTreeDetail } from './pages/AdoptedTreeDetail';
import { SustainabilityPage } from './pages/SustainabilityPage';
import { Dashboard } from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { ProfilePage } from './pages/ProfilePage';
import { ChatPage } from './pages/ChatPage';
import { useTimeOfDayEngine } from './hooks/useTimeOfDayEngine';

export default function App() {
  // Initialize time-of-day engine
  useTimeOfDayEngine();

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navigation />
          <AuthModal />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/tree/:id" element={<TreeDetail />} />
            <Route path="/ceremony" element={<TreeCeremony />} />
            <Route path="/adopt" element={<TreeCeremony />} />
            <Route path="/orchard" element={<MyOrchard />} />
            <Route path="/orchard/:id" element={<AdoptedTreeDetail />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/sustainability" element={<SustainabilityPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}