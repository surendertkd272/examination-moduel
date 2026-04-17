'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { UserPlus, Shield, User, Trash2, Mail, Key, Check, X, Edit2, Save } from 'lucide-react';

type EditForm = { name: string; username: string; role: 'admin' | 'jury'; password: string; status: 'active' | 'inactive' };

export default function UserManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', role: 'jury' as 'admin' | 'jury', password: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', username: '', role: 'jury', password: '', status: 'active' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  const { users, addUser, updateUser, deleteUser } = useData();

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await addUser({
      name: newUser.name,
      username: newUser.username,
      role: newUser.role,
      password: newUser.password,
    });
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowModal(false);
        setNewUser({ name: '', username: '', role: 'jury', password: '' });
      }, 1500);
    } else {
      setError(result.error || 'Failed to create account');
    }
  };

  const openEdit = (u: typeof users[0]) => {
    setEditForm({ name: u.name, username: u.username, role: u.role as 'admin' | 'jury', password: '', status: (u.status || 'active') as 'active' | 'inactive' });
    setEditingId(u.id);
    setEditError('');
    setEditSuccess(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setEditSaving(true);
    setEditError('');
    const updates: Record<string, string> = {
      name: editForm.name,
      username: editForm.username,
      role: editForm.role,
      status: editForm.status,
    };
    if (editForm.password.trim()) updates.password = editForm.password;

    const result = await updateUser(editingId, updates);
    setEditSaving(false);
    if (result.success) {
      setEditSuccess(true);
      setTimeout(() => { setEditSuccess(false); setEditingId(null); }, 1200);
    } else {
      setEditError(result.error || 'Failed to update user');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setDeletingId(id);
      await deleteUser(id);
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>User Access Management</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Provision administrative and evaluation accounts</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px', width: 'auto' }}>
          <UserPlus size={20} /> <span className="sm:block">Create New Account</span>
        </button>
      </div>

      {/* User cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {users.filter(u => u.role !== 'superadmin').map((u) => (
          <div key={u.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {editingId === u.id ? (
              /* Inline Edit Form */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Editing User</span>
                  <button onClick={() => setEditingId(null)} style={{ background: 'transparent', border: 'none', minHeight: 'auto', padding: '4px', color: 'var(--text-muted)' }}><X size={18} /></button>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Full Name</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', minHeight: '38px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Username</label>
                  <input type="text" value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} style={{ width: '100%', minHeight: '38px', fontSize: '13px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Role</label>
                    <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as 'admin' | 'jury' }))} style={{ width: '100%', minHeight: '38px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', padding: '0 8px', background: 'white' }}>
                      <option value="admin">Admin</option>
                      <option value="jury">Jury</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Status</label>
                    <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))} style={{ width: '100%', minHeight: '38px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', padding: '0 8px', background: 'white' }}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>New Password <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(leave blank to keep)</span></label>
                  <input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" style={{ width: '100%', minHeight: '38px', fontSize: '13px' }} />
                </div>
                {editError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', color: '#dc2626', fontSize: '12px' }}>{editError}</div>}
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving || editSuccess}
                  style={{ width: '100%', background: editSuccess ? '#10b981' : 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '42px' }}
                >
                  {editSuccess ? <><Check size={16} /> Saved!</> : editSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
            ) : (
              /* Display mode */
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: u.role === 'admin' ? '#dbeafe' : '#fef9c3', color: u.role === 'admin' ? '#1d4ed8' : '#a16207' }}>
                    {u.role === 'admin' ? <Shield size={24} /> : <User size={24} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontWeight: 900, fontSize: '17px', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>{u.name}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0', fontWeight: 600 }}>@{u.username}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => openEdit(u)} style={{ background: '#eff6ff', border: 'none', minHeight: 'auto', padding: '8px', color: '#3b82f6', borderRadius: '8px' }} title="Edit user">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} disabled={deletingId === u.id} style={{ background: '#fef2f2', border: 'none', minHeight: 'auto', padding: '8px', color: '#ef4444', borderRadius: '8px' }} title="Delete user">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, padding: '4px 12px', borderRadius: '6px', background: u.role === 'admin' ? '#7c3aed' : '#fbbf24', color: 'white', letterSpacing: '0.05em' }}>
                    {u.role}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.status === 'active' ? '#10b981' : '#ef4444' }}></div>
                    <span style={{ color: u.status === 'active' ? '#059669' : '#dc2626', textTransform: 'capitalize' }}>{u.status || 'active'}</span>
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 200, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '32px', boxShadow: '0 30px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Provision New Account</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', padding: '6px', minHeight: 'auto', color: '#6b7280', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Full Name</label>
                <input type="text" autoFocus value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="e.g. Dr. Sarah Jenkins" required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>System Username</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>@</span>
                  <input type="text" style={{ paddingLeft: '32px' }} value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder="sarah_jury" required />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Password</label>
                <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Set a secure password" required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Assigned Role</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['admin', 'jury'] as const).map(role => (
                    <button key={role} type="button" onClick={() => setNewUser({ ...newUser, role })} style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: newUser.role === role ? 'var(--primary-color)' : '#f9fafb', color: newUser.role === role ? 'white' : '#6b7280', border: newUser.role === role ? '2px solid var(--primary-color)' : '2px solid transparent', borderRadius: '10px' }}>
                      {role === 'admin' ? <Shield size={20} /> : <User size={20} />}
                      <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{role}</span>
                    </button>
                  ))}
                </div>
              </div>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', color: '#dc2626', fontSize: '13px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: '#f3f4f6', color: '#6b7280', border: 'none' }}>Cancel</button>
                <button type="submit" disabled={success} style={{ flex: 2, background: success ? '#10b981' : 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {success ? <><Check size={20} /> Account Created</> : <><Key size={20} /> Grant Access</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
