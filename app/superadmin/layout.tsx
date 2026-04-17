'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, FileText, Users, Settings, LogOut, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/superadmin', icon: <LayoutDashboard size={24} />, title: 'Dashboard' },
    { href: '/superadmin/students', icon: <GraduationCap size={24} />, title: 'Students' },
    { href: '/superadmin/users', icon: <Users size={24} />, title: 'Manage Users' },
    { href: '/superadmin/templates', icon: <FileText size={24} />, title: 'Scoring Templates' },
  ];

  // Dashboard manages its own 3-pane layout internally
  const isDashboard = pathname === '/superadmin';

  return (
    <div className="app-container">
      <aside className="sidebar" style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`icon-btn ${pathname === item.href ? 'active' : ''}`}
              title={item.title}
            >
              {item.icon}
            </Link>
          ))}
          <button className="icon-btn" title="Settings">
            <Settings size={24} />
          </button>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={logout} className="icon-btn" style={{ color: '#ef4444' }} title="Logout">
            <LogOut size={24} />
          </button>
        </div>
      </aside>

      {isDashboard ? (
        <>{children}</>
      ) : (
        <main className="main-content-layout" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-color)' }}>
          {children}
        </main>
      )}
    </div>
  );
}
