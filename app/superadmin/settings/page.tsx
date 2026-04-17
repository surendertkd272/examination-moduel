'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useSettings } from '@/context/SettingsContext';
import {
  User, Lock, Building, GraduationCap, Download, Trash2,
  Check, AlertTriangle, Info, ChevronDown, ChevronUp, Shield,
  Globe, Sliders, Wrench, Bell, KeyRound,
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
  const { user, refresh: refreshAuth } = useAuth();
  const { students, exams, users, exportStudentsCSV, exportScoresCSV, refreshExams, refreshUsers } = useData();

  // ── Change Username ──
  const [newUsername, setNewUsername] = useState('');
  const [usernamePw, setUsernamePw] = useState('');
  const [unSaving, setUnSaving] = useState(false);
  const [unMsg, setUnMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.username) setNewUsername(user.username);
  }, [user?.username]);

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnMsg(null);
    if (!newUsername.trim() || newUsername.trim() === user?.username) {
      setUnMsg({ type: 'error', text: 'Enter a new username different from the current one' });
      return;
    }
    setUnSaving(true);
    try {
      const res = await fetch('/api/auth/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername: newUsername.trim(), currentPassword: usernamePw }),
      });
      const data = await res.json();
      if (res.ok) {
        setUnMsg({ type: 'success', text: 'Username updated' });
        setUsernamePw('');
        await refreshAuth();
        await refreshUsers();
      } else {
        setUnMsg({ type: 'error', text: data.error || 'Failed to update username' });
      }
    } catch {
      setUnMsg({ type: 'error', text: 'Network error' });
    }
    setUnSaving(false);
  };

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

  // ── System Settings (DB-backed via SettingsContext) ──
  const { settings, loading: settingsLoading, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'localization'>('general');
  const [draft, setDraft] = useState<Record<string, string | number | boolean>>({});
  const [sysSaving, setSysSaving] = useState(false);
  const [sysMsg, setSysMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Hydrate the edit draft whenever settings load or change server-side.
  useEffect(() => {
    if (settingsLoading) return;
    setDraft({
      'general.default_school': String(settings['general.default_school'] ?? ''),
      'general.default_pass_threshold': Number(settings['general.default_pass_threshold'] ?? 70),
      'general.maintenance_mode': Boolean(settings['general.maintenance_mode'] ?? false),
      'general.maintenance_message': String(settings['general.maintenance_message'] ?? ''),
      'integrations.notifications_enabled': Boolean(settings['integrations.notifications_enabled'] ?? false),
      'localization.timezone': String(settings['localization.timezone'] ?? 'Asia/Kolkata'),
      'localization.date_format': String(settings['localization.date_format'] ?? 'YYYY-MM-DD'),
      'security.session_timeout_hours': Number(settings['security.session_timeout_hours'] ?? 24),
      'security.min_password_length': Number(settings['security.min_password_length'] ?? 4),
    });
  }, [settings, settingsLoading]);

  const setDraftField = (k: string, v: string | number | boolean) =>
    setDraft(d => ({ ...d, [k]: v }));

  const saveTab = async (keys: string[]) => {
    setSysSaving(true);
    setSysMsg(null);
    const updates: Record<string, string | number | boolean> = {};
    for (const k of keys) if (k in draft) updates[k] = draft[k];
    const result = await updateSettings(updates);
    setSysSaving(false);
    setSysMsg(result.success
      ? { type: 'success', text: 'Settings saved' }
      : { type: 'error', text: result.error || 'Save failed' });
    setTimeout(() => setSysMsg(null), 3000);
  };

  // Env-var presence check (read-only): we never surface the actual secret.
  const envStatus = {
    supabase_url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabase_anon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
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

          {/* Change username form */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <User size={16} color="var(--text-muted)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Change Username / Login ID</span>
            </div>
            <form onSubmit={handleChangeUsername}>
              <div style={rowStyle}>
                <div>
                  <div style={labelStyle}>New Username</div>
                  <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="New login id" style={inputStyle} required />
                </div>
                <div>
                  <div style={labelStyle}>Confirm with Current Password</div>
                  <input type="password" value={usernamePw} onChange={e => setUsernamePw(e.target.value)} placeholder="Current password" style={inputStyle} required />
                </div>
              </div>
              <button type="submit" disabled={unSaving} style={btnPrimary}>
                {unSaving ? 'Saving...' : 'Update Username'}
              </button>
              {unMsg && (
                <div style={toastStyle(unMsg.type)}>
                  {unMsg.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                  {unMsg.text}
                </div>
              )}
            </form>
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

        {/* ── 2. System Settings (tabbed, DB-backed) ── */}
        <Section icon={<Sliders size={18} />} title="System Settings" defaultOpen>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)', marginBottom: 20, marginLeft: -4, marginRight: -4 }}>
            {([
              { id: 'general' as const, label: 'General', icon: <Building size={14} /> },
              { id: 'security' as const, label: 'Security', icon: <Shield size={14} /> },
              { id: 'localization' as const, label: 'Localization', icon: <Globe size={14} /> },
            ]).map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
                    fontSize: 13, fontWeight: 600, border: 'none', background: 'transparent',
                    borderBottom: active ? '2px solid var(--primary-color)' : '2px solid transparent',
                    color: active ? 'var(--primary-color)' : 'var(--text-muted)',
                    marginBottom: -1, cursor: 'pointer',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              );
            })}
          </div>

          {/* General tab */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={labelStyle}>Default School / Academy Name</div>
                <input type="text" value={String(draft['general.default_school'] ?? '')} onChange={e => setDraftField('general.default_school', e.target.value)} style={inputStyle} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Pre-filled when adding new students</p>
              </div>
              <div>
                <div style={labelStyle}>Default Pass Threshold (%)</div>
                <input type="number" value={Number(draft['general.default_pass_threshold'] ?? 70)} onChange={e => setDraftField('general.default_pass_threshold', parseInt(e.target.value || '0'))} min={0} max={100} style={{ ...inputStyle, maxWidth: 120 }} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Used when scoring templates don't specify a threshold</p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Wrench size={15} color="#92400e" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Maintenance Mode</span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
                  <input type="checkbox" checked={Boolean(draft['general.maintenance_mode'])} onChange={e => setDraftField('general.maintenance_mode', e.target.checked)} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Enable maintenance mode (non-superadmin users will see a maintenance screen)</span>
                </label>
                <div>
                  <div style={labelStyle}>Maintenance Message</div>
                  <textarea value={String(draft['general.maintenance_message'] ?? '')} onChange={e => setDraftField('general.maintenance_message', e.target.value)} rows={3} style={{ ...inputStyle, minHeight: 70, padding: 10, fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Bell size={15} color="var(--primary-color)" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Notifications</span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={Boolean(draft['integrations.notifications_enabled'])} onChange={e => setDraftField('integrations.notifications_enabled', e.target.checked)} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Trigger notifications on exam status changes</span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => saveTab(['general.default_school', 'general.default_pass_threshold', 'general.maintenance_mode', 'general.maintenance_message', 'integrations.notifications_enabled'])} disabled={sysSaving} style={btnPrimary}>
                  {sysSaving ? 'Saving...' : 'Save General Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Security tab */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={rowStyle}>
                <div>
                  <div style={labelStyle}>Session Timeout (hours)</div>
                  <input type="number" value={Number(draft['security.session_timeout_hours'] ?? 24)} onChange={e => setDraftField('security.session_timeout_hours', parseInt(e.target.value || '0'))} min={1} max={168} style={inputStyle} />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Applies to newly-issued JWTs</p>
                </div>
                <div>
                  <div style={labelStyle}>Minimum Password Length</div>
                  <input type="number" value={Number(draft['security.min_password_length'] ?? 4)} onChange={e => setDraftField('security.min_password_length', parseInt(e.target.value || '0'))} min={4} max={32} style={inputStyle} />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Enforced on user creation & password change</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <KeyRound size={15} color="var(--primary-color)" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>API Keys (env-configured)</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  For security, API keys are read from environment variables — not the database. This panel only shows whether each key is configured.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'NEXT_PUBLIC_SUPABASE_URL', ok: envStatus.supabase_url },
                    { label: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', ok: envStatus.supabase_anon },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-color)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-body)' }}>{item.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: item.ok ? '#dcfce7' : '#fef2f2', color: item.ok ? '#16a34a' : '#dc2626' }}>
                        {item.ok ? 'Configured' : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button onClick={() => saveTab(['security.session_timeout_hours', 'security.min_password_length'])} disabled={sysSaving} style={btnPrimary}>
                  {sysSaving ? 'Saving...' : 'Save Security Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Localization tab */}
          {activeTab === 'localization' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={rowStyle}>
                <div>
                  <div style={labelStyle}>Timezone</div>
                  <select value={String(draft['localization.timezone'] ?? 'Asia/Kolkata')} onChange={e => setDraftField('localization.timezone', e.target.value)} style={inputStyle}>
                    {['Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'UTC', 'America/New_York', 'America/Los_Angeles'].map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Date Format</div>
                  <select value={String(draft['localization.date_format'] ?? 'YYYY-MM-DD')} onChange={e => setDraftField('localization.date_format', e.target.value)} style={inputStyle}>
                    {['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MMM-YYYY'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <button onClick={() => saveTab(['localization.timezone', 'localization.date_format'])} disabled={sysSaving} style={btnPrimary}>
                  {sysSaving ? 'Saving...' : 'Save Localization'}
                </button>
              </div>
            </div>
          )}

          {sysMsg && (
            <div style={toastStyle(sysMsg.type)}>
              {sysMsg.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
              {sysMsg.text}
            </div>
          )}
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
