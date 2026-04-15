'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { List, ClipboardCheck, History, LogOut, Star } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function JuryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { name: 'Schedule', href: '/jury', icon: <List size={24} /> },
    { name: 'Active Exam', href: '/jury/exam', icon: <ClipboardCheck size={24} /> },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-color)' }}>
      {/* Mobile Top Header */}
      <header className="flex justify-between items-center sticky" style={{ background: 'var(--primary-color)', color: 'white', padding: '16px', top: 0, zIndex: 50 }}>
        <div className="flex items-center gap-2">
          <Star size={24} color="#FFD600" />
          <h1 className="text-xl font-bold" style={{ letterSpacing: '-0.025em' }}>Equiwings</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Juror</p>
            <p className="text-sm font-bold">{user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', border: 'none', minWidth: '40px', minHeight: '40px' }}
          >
            <LogOut size={20} color="white" />
          </button>
        </div>
      </header>

      {/* Main Scoring Area */}
      <main style={{ flexGrow: 1, padding: '16px', paddingBottom: '96px', maxWidth: '768px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>

      {/* Persistent Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center" style={{ background: 'white', borderTop: '1px solid #e5e7eb', padding: '8px 8px 24px', zIndex: 50 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 p-2 rounded-lg no-underline transition-colors"
              style={{ color: isActive ? 'var(--primary-color)' : 'var(--text-muted)', minHeight: 'auto' }}
            >
              <div className="p-2 rounded-full" style={{ background: isActive ? 'var(--primary-light)' : 'transparent' }}>
                {item.icon}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sync Indicator */}
      <div className="fixed flex justify-center items-center gap-2 rounded-full" style={{ bottom: '80px', left: '16px', right: '16px', background: 'var(--success)', color: 'white', padding: '8px 16px', fontSize: '12px', fontWeight: 700, opacity: 0.9, boxShadow: '0 10px 15px rgba(0,0,0,0.1)', pointerEvents: 'none' }}>
        <div className="animate-pulse rounded-full" style={{ width: '8px', height: '8px', background: 'white' }} />
        Connected to Server
      </div>
    </div>
  );
}
