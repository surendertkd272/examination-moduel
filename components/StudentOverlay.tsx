'use client';

import React from 'react';
import { useData } from '@/context/DataContext';
import { X, Phone, Calendar, MapPin, Star, Droplets, UserRound, AlertCircle } from 'lucide-react';

interface StudentOverlayProps {
  studentId: string;
  onClose: () => void;
  onSchedule?: () => void;
}

export default function StudentOverlay({ studentId, onClose, onSchedule }: StudentOverlayProps) {
  const { students } = useData();
  const student = students.find(s => s.profile.unique_id === studentId);
  if (!student) return null;

  const initials = student.profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const infoCards = [
    {
      icon: <Phone size={14} color="#5b21b6" />,
      label: 'Mobile',
      value: student.profile.phone || '—',
    },
    {
      icon: <Droplets size={14} color="#dc2626" />,
      label: 'Blood Group',
      value: student.profile.blood_group || '—',
    },
    {
      icon: <UserRound size={14} color="#0891b2" />,
      label: 'Parent / Guardian',
      value: student.profile.parent_name || '—',
    },
    {
      icon: <AlertCircle size={14} color="#dc2626" />,
      label: 'Emergency Contact',
      value: student.profile.emergency_contact || '—',
      accent: true,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 40, backdropFilter: 'blur(6px)', background: 'rgba(15,23,42,0.35)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        height: '100%', width: '460px',
        background: '#ffffff',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid #e4e7ec',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.10)',
        animation: 'slideInRight 0.22s cubic-bezier(0.22,1,0.36,1)',
      }}>

        {/* Header */}
        <div style={{ padding: '28px 28px 24px', borderBottom: '1px solid #f1f3f6', background: '#fff', flexShrink: 0 }}>
          {/* Close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 18, right: 18,
            background: '#f4f5f7', border: 'none',
            width: 32, height: 32, minHeight: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748b', cursor: 'pointer', padding: 0,
            boxShadow: 'none',
          }}>
            <X size={16} />
          </button>

          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            {/* Avatar */}
            <div style={{
              width: 68, height: 68, borderRadius: 18, flexShrink: 0,
              background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 22, fontWeight: 800,
              boxShadow: '0 4px 16px rgba(91,33,182,0.25)',
              letterSpacing: '-0.02em',
            }}>
              {initials}
            </div>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0d1117', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 6 }}>
                {student.profile.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
                  {student.profile.gender || 'Male'}
                </span>
                <span style={{ color: '#cbd5e1', fontSize: 10 }}>•</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <MapPin size={10} /> {student.profile.school}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={11} /> {student.profile.dob} · {student.profile.age} yrs
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  background: '#ede9fe', color: '#5b21b6',
                  padding: '2px 8px', borderRadius: 99, letterSpacing: '0.05em',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  <Star size={9} fill="#5b21b6" /> {student.profile.level_category || 'General'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24, background: '#f8f9fc' }}>

          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {infoCards.map((card) => (
              <div key={card.label} style={{
                background: '#fff',
                borderRadius: 12,
                padding: '14px 16px',
                border: card.accent ? '1px solid #fecaca' : '1px solid #e4e7ec',
                borderLeft: card.accent ? '3px solid #dc2626' : '1px solid #e4e7ec',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  {card.icon}
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: card.accent ? '#dc2626' : '#94a3b8' }}>
                    {card.label}
                  </span>
                </div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: '#0d1117', lineHeight: 1.4 }}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Rider Background */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 20px', border: '1px solid #e4e7ec', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 10 }}>
              Rider Background
            </h3>
            <p style={{ fontSize: 13.5, color: '#1e293b', lineHeight: 1.65, fontWeight: 450 }}>
              Primary objective is{' '}
              <strong style={{ color: '#5b21b6', fontWeight: 700 }}>{student.background_questionnaire.objective}</strong>.{' '}
              {student.background_questionnaire.events_attended
                ? 'Has attended previous events.'
                : 'First time at a formalized event.'}{' '}
              {student.background_questionnaire.medals_won
                ? 'Has won medals in past competitions.'
                : 'Has not won any medals yet.'}
            </p>
          </div>

          {/* Target Categories */}
          <div>
            <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 10 }}>
              Target Categories
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Dress Code', 'Tack Identification', 'Riding Knowledge'].map(tag => (
                <span key={tag} style={{
                  fontSize: 12, fontWeight: 600,
                  background: '#ede9fe', color: '#5b21b6',
                  padding: '4px 12px', borderRadius: 99,
                  border: '1px solid #ddd6fe',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Progression Path */}
          <div>
            <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 16 }}>
              Progression Path
            </h3>
            <div style={{ position: 'relative', paddingLeft: 12 }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: 17, top: 10, bottom: 10, width: 2, background: '#e4e7ec', borderRadius: 2 }} />

              {[1, 2, 3, 4].map(level => {
                const isActive = (student.progression.levels || []).includes(level);
                return (
                  <div key={level} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative', zIndex: 1, marginBottom: 20 }}>
                    {/* Dot */}
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 3,
                      background: isActive ? '#5b21b6' : '#e4e7ec',
                      border: isActive ? '2px solid #5b21b6' : '2px solid #d1d5db',
                      boxShadow: isActive ? '0 0 0 4px #ede9fe' : 'none',
                      transition: 'all 0.2s',
                    }} />
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: isActive ? '#0d1117' : '#94a3b8', marginBottom: 2 }}>
                        Level {level} Evaluation
                      </p>
                      <p style={{ fontSize: 11.5, fontWeight: 600, color: isActive ? '#5b21b6' : '#c4cad4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isActive ? 'Ready for scheduling' : 'Locked'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid #e4e7ec',
          background: '#fff', display: 'flex', gap: 12, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            flex: 1, background: '#f4f5f7', color: '#1e293b',
            border: '1.5px solid #e4e7ec', boxShadow: 'none',
            fontWeight: 600, fontSize: 14,
          }}>
            Close
          </button>
          <button onClick={onSchedule} style={{
            flex: 2, background: '#5b21b6', color: '#fff',
            border: 'none', fontWeight: 700, fontSize: 14,
            boxShadow: '0 4px 14px rgba(91,33,182,0.25)',
          }}>
            Schedule
          </button>
        </div>

      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
