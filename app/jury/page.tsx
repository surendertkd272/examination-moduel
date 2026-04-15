'use client';

import React, { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Calendar, ChevronRight, Clock, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function JurySchedulePage() {
  const { exams, students } = useData();
  const { user } = useAuth();

  // Jury sees only their assigned exams
  const myExams = exams.filter(ex => ex.juryId === user?.id);

  // Group exams by student — student-first display
  const studentGroups = useMemo(() => {
    const map = new Map<string, typeof myExams>();
    myExams.forEach(exam => {
      const list = map.get(exam.studentId) || [];
      // Deduplicate exams by level: Prefer pending/in-progress over completed
      const existingIdx = list.findIndex(e => e.level === exam.level);
      if (existingIdx !== -1) {
        if (list[existingIdx].status === 'Completed' && exam.status !== 'Completed') {
          list[existingIdx] = exam;
        }
      } else {
        list.push(exam);
      }
      map.set(exam.studentId, list);
    });
    return Array.from(map.entries()).map(([studentId, examList]) => ({
      studentId,
      student: students.find(s => s.profile.unique_id === studentId),
      exams: examList.sort((a, b) => a.level - b.level),
    }));
  }, [myExams, students]);

  const pendingCount = myExams.filter(e => e.status !== 'Completed').length;
  const completedCount = myExams.filter(e => e.status === 'Completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with stats */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Your Evaluation Queue</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Students assigned for your evaluation
        </p>
      </div>

      {/* Summary stats */}
      <div className="student-stats-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-color)' }}>{studentGroups.length}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Students</div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>{pendingCount}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Pending</div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>{completedCount}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Completed</div>
        </div>
      </div>

      {/* Student-first list */}
      {studentGroups.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Calendar size={48} style={{ color: '#d1d5db' }} />
          <p style={{ color: 'var(--text-muted)' }}>No exams assigned to you yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {studentGroups.map(({ studentId, student, exams: studentExams }) => {
            const hasMultipleLevels = studentExams.length > 1;
            const allCompleted = studentExams.every(e => e.status === 'Completed');
            const assignedLevels = Array.from(new Set(student?.progression.levels || studentExams.map(e => e.level)));

            return (
              <div key={studentId} style={{
                background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)',
                overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                borderLeft: `6px solid ${allCompleted ? '#10b981' : 'var(--primary-color)'}`,
              }}>
                {/* Student info header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: allCompleted ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: '20px', flexShrink: 0,
                  }}>
                    {(student?.profile.name || studentId).charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                      {student?.profile.name || studentId}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>{student?.profile.unique_id}</span>
                      <span>•</span>
                      <span>{student?.profile.school || 'Unknown'}</span>
                      <span>•</span>
                      <span>Age {student?.profile.age}</span>
                      <span>•</span>
                      <span>{student?.profile.class}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      {assignedLevels.map(l => (
                        <span key={l} style={{
                          fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                          padding: '2px 8px', borderRadius: '4px',
                          background: '#FFD600', color: '#1E3A8A',
                        }}>
                          Level {l}
                        </span>
                      ))}
                    </div>
                  </div>
                  {allCompleted && (
                    <CheckCircle2 size={24} style={{ color: '#10b981', flexShrink: 0 }} />
                  )}
                </div>

                {/* Level-based exam cards */}
                <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {studentExams.map(exam => {
                    const isCompleted = exam.status === 'Completed';
                    return (
                      <Link key={exam.id} href={`/jury/exam?id=${exam.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: isCompleted ? '#f0fdf4' : '#eff6ff', borderRadius: '12px',
                          padding: '14px 16px', border: `1px solid ${isCompleted ? '#bbf7d0' : '#bfdbfe'}`,
                          cursor: 'pointer', transition: 'transform 0.15s ease',
                          flexWrap: 'wrap', gap: '12px'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '10px',
                              background: isCompleted ? '#10b981' : 'var(--primary-color)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontWeight: 800, fontSize: '14px',
                            }}>
                              L{exam.level}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                                Level {exam.level} Evaluation
                              </div>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={12} /> {exam.date} {exam.time}
                                </span>
                              </div>
                            </div>
                          </div>

                            {isCompleted ? (
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', background: '#10b981', color: 'white' }}>
                                  Evaluation Complete
                                </span>
                                <div style={{ fontWeight: 800, color: '#10b981', fontSize: '14px', marginTop: '2px' }}>Scored {exam.totalScore}pts</div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', background: '#fef9c3', color: '#a16207' }}>
                                  {exam.status === 'In-Progress' ? 'Resume Evaluation' : 'Ready to Start'}
                                </span>
                                <ChevronRight size={20} style={{ color: 'var(--primary-color)' }} />
                              </div>
                            )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Multi-level note */}
                {hasMultipleLevels && (
                  <div style={{ padding: '0 20px 12px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={12} />
                    This student has {studentExams.length} levels to evaluate. Submit each level separately.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scoring tip */}
      <div style={{ background: 'var(--primary-color)', color: 'white', padding: '20px', borderRadius: '16px', marginTop: '8px' }}>
        <h4 style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GraduationCap size={18} /> Scoring Guide
        </h4>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
          Select a student level to begin scoring. All items use numeric scoring (0–N). Dress Code is now scored numerically just like all other categories. Each level has its own rubric automatically loaded.
        </p>
      </div>
    </div>
  );
}
