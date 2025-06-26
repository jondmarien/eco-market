import React, { createContext, useContext, useEffect, useState } from 'react';
import { VendorAuth, LoginCredentials, VendorRegistrationForm } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  vendor: VendorAuth | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (registrationData: VendorRegistrationForm) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [vendor, setVendor] = useState<VendorAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('vendorToken');
      if (token) {
        try {
          const vendorData = await authAPI.getCurrentVendor();
          setVendor(vendorData);
        } catch (error) {
          console.error('Failed to get current vendor:', error);
          localStorage.removeItem('vendorToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const vendorData = await authAPI.login(credentials);
      localStorage.setItem('vendorToken', vendorData.token);
      setVendor(vendorData);
    } catch (error) {
      throw error;
    }
  };

  const register = async (registrationData: VendorRegistrationForm) => {
    try {
      const vendorData = await authAPI.register(registrationData);
      localStorage.setItem('vendorToken', vendorData.token);
      setVendor(vendorData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('vendorToken');
    setVendor(null);
    // Optionally call logout API
    authAPI.logout().catch(console.error);
  };

  const value = {
    vendor,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
