'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface TestAccount {
  username: string;
  name: string;
  role: 'superadmin' | 'admin' | 'jury';
}

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([]);
  const [defaultPassword, setDefaultPassword] = useState('admin');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/auth/test-accounts', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setTestAccounts(data.accounts || []);
        setDefaultPassword(data.defaultPassword || 'admin');
      } catch {
        // silent — login page still usable via manual entry
      }
    };
    load();
    // Poll every 15s so newly-created jury users appear without a manual refresh.
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(username, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setIsLoading(false);
  };

  const fillCredentials = (user: string) => {
    setUsername(user);
    setPassword(defaultPassword);
    setError('');
  };

  const roleColors: Record<string, { bg: string; fg: string }> = {
    superadmin: { bg: '#ede9fe', fg: '#6d28d9' },
    admin: { bg: '#dbeafe', fg: '#1d4ed8' },
    jury: { bg: '#fef3c7', fg: '#92400e' },
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f3f4f6', padding: '16px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
        <div className="flex flex-col items-center gap-4 mb-8">
          <div style={{ padding: '16px', background: 'var(--primary-color)', borderRadius: '50%', display: 'flex' }}>
            <Shield size={40} color="white" />
          </div>
          <h1 className="text-2xl font-bold text-center">Equiwings</h1>
          <p className="text-muted text-center text-sm">Secure Exam Management Portal</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', padding: '8px', minHeight: 'auto',
                  color: '#6b7280', cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', color: '#dc2626', fontSize: '13px', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex justify-between items-center"
            style={{ borderRadius: '10px', padding: '0 24px', minHeight: '52px' }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
            ) : (
              'Login to System'
            )}
            {!isLoading && <ChevronRight size={20} />}
          </button>
        </form>

        {testAccounts.length > 0 && (
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
            <p className="text-xs text-muted mb-4 uppercase font-bold tracking-wider">
              Test Accounts (password: {defaultPassword})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {testAccounts.map(acc => {
                const c = roleColors[acc.role] || { bg: '#f3f4f6', fg: '#3b82f6' };
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => fillCredentials(acc.username)}
                    style={{
                      background: c.bg, color: c.fg, minHeight: '40px', fontSize: '0.875rem',
                      borderRadius: '8px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '0 14px', border: 'none',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{acc.username}</span>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', opacity: 0.85 }}>
                      {acc.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <p style={{ position: 'fixed', bottom: '24px', fontSize: '12px', color: '#9ca3af' }}>© 2026 Equiwings Global Aviation & Logistics</p>
    </div>
  );
}
