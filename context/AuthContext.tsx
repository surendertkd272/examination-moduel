'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole, AuthState } from '@/types/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
    } catch {
      // Auth check failed
    }
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Redirect based on role
      if (data.user.role === 'superadmin') router.push('/superadmin');
      else if (data.user.role === 'admin') {
        // Admin interface removed — logout and show error
        await fetch('/api/auth/logout', { method: 'POST' });
        setState({ user: null, isAuthenticated: false, isLoading: false });
        return { success: false, error: 'Admin interface has been deprecated. Contact superadmin for access.' };
      }
      else router.push('/jury');

      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue with client-side cleanup even if API fails
    }
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refresh: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
