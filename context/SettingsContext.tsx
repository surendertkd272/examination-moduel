'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type SettingValue = string | number | boolean;

interface SettingsContextValue {
  settings: Record<string, unknown>;
  loading: boolean;
  refresh: () => Promise<void>;
  updateSettings: (updates: Record<string, SettingValue>) => Promise<{ success: boolean; error?: string }>;
  get: <T = SettingValue>(key: string, fallback: T) => T;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store', credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSettings(data.settings || {});
      } else {
        console.error('[SettingsContext] GET /api/settings failed:', res.status, data);
      }
    } catch (e) {
      console.error('[SettingsContext] GET /api/settings threw:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // Poll so changes from another superadmin session propagate without
    // requiring users to reload — same pattern as DataContext.
    const interval = setInterval(refresh, 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh]);

  const updateSettings = async (updates: Record<string, SettingValue>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSettings(data.settings || {});
        return { success: true };
      }
      console.error('[SettingsContext] PUT /api/settings failed:', res.status, data);
      return { success: false, error: data.error || `Save failed (HTTP ${res.status})` };
    } catch (e) {
      console.error('[SettingsContext] PUT /api/settings threw:', e);
      return { success: false, error: 'Network error' };
    }
  };

  const get = <T = SettingValue,>(key: string, fallback: T): T => {
    const v = settings[key];
    return (v === undefined || v === null) ? fallback : (v as T);
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh, updateSettings, get }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
