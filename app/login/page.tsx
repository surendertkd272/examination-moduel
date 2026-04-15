'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    setPassword('admin');
    setError('');
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

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
          <p className="text-xs text-muted mb-4 uppercase font-bold tracking-wider">Test Accounts (password: admin)</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('superadmin')}
              style={{ background: '#f3f4f6', color: '#3b82f6', minHeight: '40px', fontSize: '0.875rem', borderRadius: '8px' }}
            >
              superadmin
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('jury1')}
                className="flex-1"
                style={{ background: '#f3f4f6', color: '#3b82f6', minHeight: '40px', fontSize: '0.875rem', borderRadius: '8px' }}
              >
                jury1
              </button>
            </div>
          </div>
        </div>
      </div>
      <p style={{ position: 'fixed', bottom: '24px', fontSize: '12px', color: '#9ca3af' }}>© 2026 Equiwings Global Aviation & Logistics</p>
    </div>
  );
}
