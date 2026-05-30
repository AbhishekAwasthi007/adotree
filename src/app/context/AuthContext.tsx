import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  mobile: string;
  role: string;
  eco_points: number;
  streak_count: number;
  profile_image?: string | null;
  created_at?: string;
  farmer_status?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  sendOTP: (mobile: string) => Promise<any>;
  verifyOTP: (mobile: string, otp: string, loginAs?: string, name?: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await api.auth.getMe();
          setUser(userData);
        } catch (err) {
          console.error("Failed to restore session", err);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const sendOTP = async (mobile: string) => {
    return await api.auth.sendOTP(mobile);
  };

  const verifyOTP = async (mobile: string, otp: string, loginAs?: string, name?: string) => {
    setIsLoading(true);
    try {
      const tokenData = await api.auth.verifyOTP(mobile, otp, loginAs, name);
      const userData = await api.auth.getMe();
      setUser(userData);
      setShowAuthModal(false);
      return tokenData;
    } catch (err) {
      console.error("Verification failed", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.auth.logout();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const userData = await api.auth.getMe();
      setUser(userData);
    } catch (err) {
      console.error("Failed to refresh user profile", err);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        showAuthModal,
        setShowAuthModal,
        sendOTP,
        verifyOTP,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
