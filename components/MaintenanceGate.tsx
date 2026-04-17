'use client';

import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { Wrench } from 'lucide-react';

// Renders a full-screen maintenance notice when general.maintenance_mode is true.
// Superadmins always bypass so they can disable maintenance mode from inside.
export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { get } = useSettings();
  const { user } = useAuth();

  const enabled = get<boolean>('general.maintenance_mode', false);
  const message = get<string>(
    'general.maintenance_message',
    'The system is undergoing scheduled maintenance. Please check back shortly.'
  );

  if (!enabled || user?.role === 'superadmin') return <>{children}</>;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', padding: 24,
    }}>
      <div style={{
        maxWidth: 480, textAlign: 'center', padding: 40,
        background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Wrench size={32} color="#92400e" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: '#0f172a' }}>
          Maintenance Mode
        </h1>
        <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{message}</p>
      </div>
    </div>
  );
}
