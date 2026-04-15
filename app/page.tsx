'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.role === 'superadmin') router.push('/superadmin');
        else if (user.role === 'admin') router.push('/admin');
        else router.push('/jury');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="w-16 h-16 border-4 border-secondary border-t-white rounded-full animate-spin" />
        <h1 className="text-white text-3xl font-black tracking-widest uppercase">Equiwings</h1>
        <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Initializing Secure Portal</p>
      </div>
    </div>
  );
}
