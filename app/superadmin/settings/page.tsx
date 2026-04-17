'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import {
  User, Lock, Building, GraduationCap, Download, Trash2,
  Check, AlertTriangle, Info, ChevronDown, ChevronUp, Shield,
} from 'lucide-react';

// ── Styles ──────────────────────────────────────────────────────────────────
const sectionStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, border: '1px solid var(--border-color)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
};
const sectionHeaderStyle: React.CSSProperties = {
  padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
  borderBottom: '1px solid var(--border-color)', cursor: 'pointer',
  userSelect: 'none',
};
const sectionBodyStyle: React.CSSProperties = {
  padding: '20px 24px',
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6,
};
const rowStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16,
};
const inputStyle: React.CSSProperties = {
  width: '100%', minHeight: 42, padding: '0 14px', fontSize: 13.5,
  border: '1.5px solid var(--border-color)', borderRadius: 8,
  background: '#fff', color: 'var(--text-main)', fontWeight: 500,
};
const btnPrimary: React.CSSProperties = {
  background: 'var(--primary-color)', color: '#fff', border: 'none',
  padding: '0 20px', minHeight: 40, borderRadius: 8, fontWeight: 600,
  fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(91,33,182,0.2)',
};
const btnDanger: React.CSSProperties = {
  background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
  padding: '0 20px', minHeight: 40, borderRadius: 8, fontWeight: 600,
  fontSize: 13, cursor: 'pointer', boxShadow: 'none',
};
const toastStyle = (type: 'success' | 'error'): React.CSSProperties => ({
  padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  background: type === 'success' ? '#ecfdf5' : '#fef2f2',
  color: type === 'success' ? '#059669' : '#dc2626',
  border: `1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'}`,
  display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
});

// ── Collapsible section ─────────────────────────────────────────────────────
function Section({ icon, title, children, defaultOpen = false }: {
  icon: React.ReactNode; title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle} onClick={() => setOpen(o => !o)}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{title}</h3>
        </div>
        {open ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
      </div>
      {open && <div style={sectionBodyStyle}>{children}</div>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth();
  const { students, exams, users, exportStudentsCSV, exportScoresCSV, refreshExams } = useData();

  // ── Change Password ──
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPw.length < 4) {
      setPwMsg({ type: 'error', text: 'Password must be at least 4 characters' });
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: 'success', text: 'Password changed successfully' });
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
      } else {
        setPwMsg({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Network error' });
    }
    setPwSaving(false);
  };

  // ── System Settings (localStorage) ──
  const [defaultSchool, setDefaultSchool] = useState('');
  const [defaultPassThreshold, setDefaultPassThreshold] = useState('70');
  const [sysSaved, setSysSaved] = useState(false);

  useEffect(() => {
    setDefaultSchool(localStorage.getItem('eq_default_school') || 'The Hyderabad Public School');
    setDefaultPassThreshold(localStorage.getItem('eq_pass_threshold') || '70');
  }, []);

  const saveSystemSettings = () => {
    localStorage.setItem('eq_default_school', defaultSchool);
    localStorage.setItem('eq_pass_threshold', defaultPassThreshold);
    setSysSaved(true);
    setTimeout(() => setSysSaved(false), 2000);
  };

  // ── Data Management ──
  const [clearTarget, setClearTarget] = useState<'all' | 'Scheduled' | 'Completed'>('Scheduled');
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearExams = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setClearing(true);
    setClearMsg(null);
    try {
      const res = await fetch('/api/exams/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: clearTarget }),
      });
      const data = await res.json();
      if (res.ok) {
        setClearMsg({ type: 'success', text: `Deleted ${data.deleted} exam(s)` });
        await refreshExams();
      } else {
        setClearMsg({ type: 'error', text: data.error || 'Failed to clear exams' });
      }
    } catch {
      setClearMsg({ type: 'error', text: 'Network error' });
    }
    setClearing(false);
    setConfirmClear(false);
  };

  const scheduledCount = exams.filter(e => e.status === 'Scheduled').length;
  const completedCount = exams.filter(e => e.status === 'Completed').length;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Manage your profile, system preferences, and data</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── 1. Profile & Password ── */}
        <Section icon={<User size={18} />} title="Profile & Security" defaultOpen>
          {/* Profile info (read-only) */}
          <div style={{ ...rowStyle, marginBottom: 20 }}>
            <div>
              <div style={labelStyle}>Name</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{user?.name || '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Username</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{user?.username || '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Role</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} color="var(--primary-color)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-color)', textTransform: 'capitalize' }}>{user?.role || '—'}</span>
              </div>
            </div>
            <div>
              <div style={labelStyle}>User ID</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{user?.id || '—'}</div>
            </div>
          </div>

          {/* Change password form */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Lock size={16} color="var(--text-muted)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Change Password</span>
            </div>
            <form onSubmit={handleChangePassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={labelStyle}>Current Password</div>
                  <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password" style={inputStyle} required />
                </div>
                <div style={rowStyle}>
                  <div>
                    <div style={labelStyle}>New Password</div>
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 4 characters" style={inputStyle} required />
                  </div>
                  <div>
                    <div style={labelStyle}>Confirm New Password</div>
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter new password" style={inputStyle} required />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button type="submit" disabled={pwSaving} style={btnPrimary}>
                    {pwSaving ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </div>
              {pwMsg && (
                <div style={toastStyle(pwMsg.type)}>
                  {pwMsg.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                  {pwMsg.text}
                </div>
              )}
            </form>
          </div>
        </Section>

        {/* ── 2. System Settings ── */}
        <Section icon={<Building size={18} />} title="System Settings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={labelStyle}>Default School / Academy Name</div>
              <input type="text" value={defaultSchool} onChange={e => setDefaultSchool(e.target.value)} placeholder="e.g. The Hyderabad Public School" style={inputStyle} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Pre-filled when adding new students</p>
            </div>
            <div>
              <div style={labelStyle}>Default Pass Threshold (%)</div>
              <input type="number" value={defaultPassThreshold} onChange={e => setDefaultPassThreshold(e.target.value)} min="0" max="100" style={{ ...inputStyle, maxWidth: 120 }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Used when scoring templates don't specify a threshold</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={saveSystemSettings} style={btnPrimary}>
                {sysSaved ? 'Saved!' : 'Save Settings'}
              </button>
              {sysSaved && <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={14} /> Settings saved</span>}
            </div>
          </div>
        </Section>

        {/* ── 3. Data Management ── */}
        <Section icon={<Download size={18} />} title="Data Management">
          {/* Export */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>Export Data</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={exportStudentsCSV} style={{ ...btnPrimary, background: '#059669', boxShadow: '0 2px 8px rgba(5,150,105,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={14} /> Export Students CSV
              </button>
              <button onClick={exportScoresCSV} style={{ ...btnPrimary, background: '#2563eb', boxShadow: '0 2px 8px rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={14} /> Export Scores CSV
              </button>
            </div>
          </div>

          {/* Clear exams */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Trash2 size={16} color="#dc2626" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>Clear Exam Records</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={labelStyle}>Target</div>
              <select value={clearTarget} onChange={e => { setClearTarget(e.target.value as typeof clearTarget); setConfirmClear(false); }} style={{ ...inputStyle, maxWidth: 220 }}>
                <option value="Scheduled">Scheduled only ({scheduledCount})</option>
                <option value="Completed">Completed only ({completedCount})</option>
                <option value="all">All exams ({exams.length})</option>
              </select>
            </div>

            <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#854d0e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} />
              This action is irreversible. Deleted exams cannot be recovered.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={handleClearExams} disabled={clearing} style={confirmClear ? { ...btnDanger, background: '#dc2626', color: '#fff', borderColor: '#dc2626' } : btnDanger}>
                {clearing ? 'Deleting...' : confirmClear ? 'Click Again to Confirm' : 'Clear Exams'}
              </button>
              {confirmClear && (
                <button onClick={() => setConfirmClear(false)} style={{ ...btnDanger, background: '#f4f5f7', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                  Cancel
                </button>
              )}
            </div>
            {clearMsg && (
              <div style={toastStyle(clearMsg.type)}>
                {clearMsg.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                {clearMsg.text}
              </div>
            )}
          </div>
        </Section>

        {/* ── 4. About ── */}
        <Section icon={<Info size={18} />} title="About">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={rowStyle}>
              <div>
                <div style={labelStyle}>Application</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>Equiwings Exam Management System</div>
              </div>
              <div>
                <div style={labelStyle}>Version</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>1.0.0</div>
              </div>
            </div>
            <div style={rowStyle}>
              <div>
                <div style={labelStyle}>Platform</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-body)' }}>Next.js + Supabase</div>
              </div>
              <div>
                <div style={labelStyle}>Environment</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-body)' }}>{process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}</div>
              </div>
            </div>

            {/* Live stats */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 4 }}>
              <div style={{ ...labelStyle, marginBottom: 12 }}>System Statistics</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Students', value: students.length, color: '#2563eb' },
                  { label: 'Exams', value: exams.length, color: '#7c3aed' },
                  { label: 'Users', value: users.length, color: '#059669' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'var(--bg-color)', borderRadius: 10, padding: '14px 16px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              &copy; 2026 Equiwings Global Aviation & Logistics. All rights reserved.
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
