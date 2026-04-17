'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Search, ChevronLeft, ChevronRight, X, Check, Plus, Edit2, Trash2, Save, Minus } from 'lucide-react';
import type { Exam } from '@/context/DataContext';
import ScoringEngine from '@/components/scoring/ScoringEngine';
import StudentOverlay from '@/components/StudentOverlay';

export default function SuperAdminPage() {
  const { students, exams, users, scoringTemplates } = useData();
  const { addExam, updateExam, deleteExam, updateExamScores } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [editExamMode, setEditExamMode] = useState(false);
  const [editExamForm, setEditExamForm] = useState<Partial<Exam>>({});
  const [savingExam, setSavingExam] = useState(false);
  const [deletingExam, setDeletingExam] = useState(false);

  // Score editing state
  const [editScoreMode, setEditScoreMode] = useState(false);
  const [editScores, setEditScores] = useState<Record<string, number | string>>({});
  const [savingScores, setSavingScores] = useState(false);

  const [activeJuries, setActiveJuries] = useState<Set<string>>(new Set());
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<{
    date: string;
    time: string;
    groups: Record<string, { selectedStudents: string[]; juryId: string; level: number; category: string }>;
  }>({
    date: '', time: '09:00 AM', groups: {}
  });
  const [scheduling, setScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  // Dynamic month navigation
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const monthName = new Date(viewMonth.year, viewMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setViewMonth(v => {
    const d = new Date(v.year, v.month - 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setViewMonth(v => {
    const d = new Date(v.year, v.month + 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const refreshSelectedExam = (examId: string) => {
    const fresh = exams.find(e => e.id === examId);
    if (fresh) setSelectedExam(fresh);
  };

  const startEditExam = (exam: Exam) => {
    setEditExamForm({ date: exam.date, time: exam.time, level: exam.level, juryId: exam.juryId, status: exam.status });
    setEditExamMode(true);
  };

  const saveEditExam = async () => {
    if (!selectedExam) return;
    setSavingExam(true);
    const ok = await updateExam(selectedExam.id, editExamForm);
    setSavingExam(false);
    if (ok) {
      setEditExamMode(false);
      setTimeout(() => refreshSelectedExam(selectedExam.id), 300);
    }
  };

  const handleDeleteExam = async () => {
    if (!selectedExam) return;
    if (!confirm(`Delete exam for ${selectedExam.studentId}? This cannot be undone.`)) return;
    setDeletingExam(true);
    const ok = await deleteExam(selectedExam.id);
    setDeletingExam(false);
    if (ok) { setSelectedExam(null); setEditExamMode(false); }
  };

  // Score editing
  const startEditScores = (exam: Exam) => {
    setEditScores(exam.scores ? { ...exam.scores } : {});
    setEditScoreMode(true);
  };

  const saveEditScores = async () => {
    if (!selectedExam) return;
    setSavingScores(true);
    const result = await updateExamScores(selectedExam.id, editScores);
    setSavingScores(false);
    if (result.success) {
      setEditScoreMode(false);
      setTimeout(() => refreshSelectedExam(selectedExam.id), 300);
    }
  };

  const editScoreTotal = Object.values(editScores).reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);

  const juryUsers = users.filter(u => u.role === 'jury');
  const completedExams = exams.filter(e => e.status === 'Completed');
  const scheduledExams = exams.filter(e => e.status === 'Scheduled');
  const inProgressExams = exams.filter(e => e.status === 'In-Progress');

  // Filter exams by selected month
  const monthFilteredExams = useMemo(() => {
    return exams.filter(exam => {
      const d = new Date(exam.date);
      return d.getFullYear() === viewMonth.year && d.getMonth() === viewMonth.month;
    });
  }, [exams, viewMonth]);

  const filteredExams = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const base = q ? exams : monthFilteredExams;
    if (!q) return base;
    return exams.filter(exam => {
      const student = students.find(s => s.profile.unique_id === exam.studentId);
      return (
        (student?.profile.name || '').toLowerCase().includes(q) ||
        exam.studentId.toLowerCase().includes(q) ||
        exam.juryName.toLowerCase().includes(q) ||
        exam.status.toLowerCase().includes(q) ||
        String(exam.level).includes(q)
      );
    });
  }, [exams, monthFilteredExams, students, searchQuery]);

  const toggleJury = (juryId: string) => {
    setActiveJuries(prev => {
      const next = new Set(prev);
      if (next.has(juryId)) next.delete(juryId); else next.add(juryId);
      return next;
    });
  };

  // Group students by Level and Category for Batch Scheduling modal
  const batchGroups = useMemo(() => {
    const map = new Map<string, { level: number; category: string; key: string; students: typeof students }>();
    students.forEach(s => {
      const cat = s.profile.level_category || 'General';
      (s.progression.levels || []).forEach(l => {
        const key = `${l}_${cat}`;
        if (!map.has(key)) {
          map.set(key, { level: l, category: cat, key, students: [] });
        }
        map.get(key)!.students.push(s);
      });
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.category.localeCompare(b.category);
    });
  }, [students]);

  const handleScheduleExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduling(true);
    try {
      for (const groupKey in scheduleForm.groups) {
        const group = scheduleForm.groups[groupKey];
        if (group.selectedStudents.length === 0) continue;

        for (const studentId of group.selectedStudents) {
          await addExam({
            studentId,
            juryId: group.juryId,
            level: group.level,
            date: scheduleForm.date,
            time: scheduleForm.time,
          });
        }
      }
      setScheduleSuccess(true);
      setTimeout(() => {
        setScheduleSuccess(false);
        setScheduleForm({ ...scheduleForm, groups: {} });
        setShowScheduleModal(false);
      }, 2000);
    } catch {
      setScheduling(false);
    }
  };

  const handleStudentSelect = (studentId?: string) => {
    if (!studentId) {
      setScheduleForm({ date: '', time: '09:00 AM', groups: {} });
      return;
    }
    const student = students.find(s => s.profile.unique_id === studentId);
    if (!student) return;
    
    const cat = student.profile.level_category || 'General';
    const initGroups: typeof scheduleForm.groups = {};
    
    (student.progression.levels || []).forEach(l => {
      const key = `${l}_${cat}`;
      initGroups[key] = { selectedStudents: [student.profile.unique_id], juryId: '', level: l, category: cat };
    });
    setScheduleForm(f => ({ ...f, groups: initGroups }));
  };

  const cardColors = [
    { bg: '#eff6ff', border: '#3b82f6' }, { bg: '#f5f3ff', border: '#8b5cf6' },
    { bg: '#ecfdf5', border: '#10b981' }, { bg: '#fdf2f8', border: '#ec4899' },
    { bg: '#fff7ed', border: '#f97316' },
  ];

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Context Pane */}
      <div className="context-pane">
        <div className="header-top" style={{ padding: '24px' }}>
          <div className="header-title">Exams</div>
        </div>

        <div style={{ padding: '0 24px', marginBottom: '24px' }}>
          <div className="search-bar" style={{ width: '100%' }}>
            <Search size={18} />
            <input type="text" placeholder="Search exams or users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {/* Available Juries */}
        <div className="list-section">
          <div className="list-header">Available Juries</div>
          {juryUsers.filter(u => 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            u.username.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((jury, i) => {
            const isActive = activeJuries.size === 0 || activeJuries.has(jury.id);
            return (
              <div key={jury.id} className={`list-item ${isActive ? 'checked' : ''}`} onClick={() => toggleJury(jury.id)} style={{ cursor: 'pointer' }}>
                <div className="list-checkbox">{isActive && <Check size={12} strokeWidth={4} />}</div>
                <div className="list-avatar" style={{ background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', fontWeight: 800, fontSize: '12px' }}>
                  {jury.name.charAt(0)}
                </div>
                <div>
                  <div className="list-text">{jury.name}</div>
                  <div className="list-subtext">@{jury.username}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Student Queue */}
        <div className="list-section" style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
          <div className="list-header">
            <span>Student Queue</span>
            <span style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px', color: '#6b7280' }}>{students.length}</span>
          </div>
          {students.filter(s => 
            s.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.profile.unique_id.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((student) => (
            <div 
              key={student.profile.unique_id} 
              className="list-item" 
              style={{ padding: '12px 0', cursor: 'pointer' }}
              onClick={() => setSelectedStudentId(student.profile.unique_id)}
            >
              <div className="list-avatar" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '12px', borderRadius: '50%' }}>
                {student.profile.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div className="list-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {student.profile.name}
                  {student.profile.level_category && (
                    <span style={{ fontSize: '9px', fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      {student.profile.level_category}
                    </span>
                  )}
                </div>
                <div className="list-subtext">
                  {student.progression.levels.map(l => `L${l}`).join(', ')} • {student.profile.unique_id}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Pane */}
      <div className="main-pane main-pane-mobile-reset" style={{ paddingRight: selectedExam ? '460px' : '0' }}>
        {/* Top bar */}
        <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '10px 18px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
              {monthName}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={prevMonth} style={{ border: '1px solid #e2e8f0', background: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', minHeight: 'auto', color: '#64748b', transition: 'all 0.2s' }}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={nextMonth} style={{ border: '1px solid #e2e8f0', background: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', minHeight: 'auto', color: '#64748b', transition: 'all 0.2s' }}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <div style={{ background: '#f1f5f9', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                Total <span style={{ color: '#1e293b', marginLeft: '4px', fontSize: '14px' }}>{exams.length}</span>
              </div>
              <div style={{ background: '#ecfdf5', padding: '6px 14px', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#065f46' }}>
                Done <span style={{ color: '#059669', marginLeft: '4px', fontSize: '14px' }}>{completedExams.length}</span>
              </div>
              <div style={{ background: '#eff6ff', padding: '6px 14px', borderRadius: '8px', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                Next <span style={{ color: '#2563eb', marginLeft: '4px', fontSize: '14px' }}>{scheduledExams.length}</span>
              </div>
            </div>
            <button onClick={() => setShowScheduleModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px', minHeight: '44px', fontSize: '14px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>
              <Plus size={18} /> Schedule
            </button>
          </div>
        </div>

        {/* Exam cards */}
        <div style={{ padding: '24px' }}>
          {filteredExams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
              <p style={{ fontSize: '16px' }}>No exams found for {monthName}.</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>Try navigating to another month or scheduling a new exam.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {filteredExams.map((exam, i) => {
                const student = students.find(s => s.profile.unique_id === exam.studentId);
                const color = cardColors[i % cardColors.length];
                const isSelected = selectedExam?.id === exam.id;

                return (
                  <div key={exam.id} onClick={() => { setSelectedExam(isSelected ? null : exam); setEditExamMode(false); setEditScoreMode(false); }}
                    style={{
                      background: isSelected ? color.border : color.bg, borderRadius: '10px', padding: '16px',
                      borderLeft: `4px solid ${color.border}`, cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 4px 20px ${color.border}40` : '0 1px 3px rgba(0,0,0,0.05)',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.3)' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: isSelected ? 'white' : '#374151' }}>
                        {(student?.profile.name || exam.studentId).charAt(0)}
                      </div>
                      <span 
                        style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'white' : '#111827', cursor: 'pointer', borderBottom: isSelected ? '1px dashed white' : '1px dashed #ccc' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentId(student?.profile.unique_id || exam.studentId);
                        }}
                      >
                        {student?.profile.name || exam.studentId}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: isSelected ? 'rgba(255,255,255,0.8)' : '#6b7280' }}>
                      Level {exam.level} {student?.profile.level_category && `(${student.profile.level_category})`} • {exam.juryName}
                    </div>
                    <div style={{ fontSize: '11px', color: isSelected ? 'rgba(255,255,255,0.9)' : color.border, marginTop: '8px', fontWeight: 600 }}>
                      {exam.date} {exam.time}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px',
                        background: isSelected ? 'rgba(255,255,255,0.25)' : (exam.status === 'Completed' ? '#dcfce7' : '#fef9c3'),
                        color: isSelected ? 'white' : (exam.status === 'Completed' ? '#16a34a' : '#a16207'),
                      }}>
                        {exam.status}
                      </span>
                      {exam.status === 'Completed' && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? 'white' : '#10b981' }}>
                          {exam.totalScore}pts
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Overlay Panel */}
      {selectedExam && (() => {
        const exam = selectedExam;
        const student = students.find(s => s.profile.unique_id === exam.studentId);
        const jury = users.find(u => u.id === exam.juryId);
        const colorIdx = filteredExams.findIndex(e => e.id === exam.id) % cardColors.length;
        const color = cardColors[colorIdx >= 0 ? colorIdx : 0];
        const template = scoringTemplates[String(exam.level)];

        return (
          <div className="overlay-pane" style={{ animation: 'slideIn 0.2s ease' }}>
            <div className="detail-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 className="detail-title">Exam Detail</h2>
                <span className="detail-tag">#{exam.id.replace('exam-', '')}</span>
              </div>
              <button onClick={() => { setSelectedExam(null); setEditScoreMode(false); }} style={{ background: 'transparent', border: 'none', padding: '6px', minHeight: 'auto', color: '#6b7280', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="detail-body">
              {/* Status badge */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                  background: exam.status === 'Completed' ? '#dcfce7' : '#fef9c3',
                  color: exam.status === 'Completed' ? '#16a34a' : '#a16207',
                }}>
                  {exam.status === 'Completed' ? <Check size={12} /> : null}
                  {exam.status}
                </span>
              </div>

              {/* Student info */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginBottom: '10px', letterSpacing: '0.5px' }}>Student</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '18px' }}>
                    {(student?.profile.name || exam.studentId).charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{student?.profile.name || exam.studentId}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>
                      {exam.studentId} • {student?.profile.school || 'Unknown'} • {student?.profile.level_category || 'General'}
                    </div>
                    {student && (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span>Age {student.profile.age} • {student.profile.class}</span>
                        {student.profile.level_category && (
                          <span className="detail-tag" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>{student.profile.level_category}</span>
                        )}
                      </div>
                    )}
                    {student && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, color: '#475569' }}>Events: {student.background_questionnaire.events_attended ? 'Yes' : 'No'}</span>
                        <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, color: '#475569' }}>Medals: {student.background_questionnaire.medals_won ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Exam details grid */}
              <div className="detail-card-box">
                {editExamMode ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Date</div>
                      <input type="date" value={editExamForm.date || ''} onChange={e => setEditExamForm(f => ({ ...f, date: e.target.value }))} style={{ width: '100%', minHeight: '38px', fontSize: '13px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Time</div>
                      <input type="text" value={editExamForm.time || ''} onChange={e => setEditExamForm(f => ({ ...f, time: e.target.value }))} placeholder="09:00 AM" style={{ width: '100%', minHeight: '38px', fontSize: '13px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Level</div>
                      <select value={editExamForm.level || 1} onChange={e => setEditExamForm(f => ({ ...f, level: parseInt(e.target.value) }))} style={{ width: '100%', minHeight: '38px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', background: 'white' }}>
                        {Object.keys(scoringTemplates).length > 0
                          ? Object.entries(scoringTemplates).map(([k, t]) => <option key={k} value={k}>{t.levelName}</option>)
                          : [1,2,3,4].map(l => <option key={l} value={l}>Level {l}</option>)
                        }
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Status</div>
                      <select value={editExamForm.status || exam.status} onChange={e => setEditExamForm(f => ({ ...f, status: e.target.value as Exam['status'] }))} style={{ width: '100%', minHeight: '38px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', background: 'white' }}>
                        <option value="Scheduled">Scheduled</option>
                        <option value="In-Progress">In-Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Assign Jury</div>
                      <select value={editExamForm.juryId || exam.juryId} onChange={e => setEditExamForm(f => ({ ...f, juryId: e.target.value }))} style={{ width: '100%', minHeight: '38px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', background: 'white' }}>
                        {users.filter(u => u.role === 'jury').map(j => <option key={j.id} value={j.id}>{j.name} (@{j.username})</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid-2" style={{ gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Date</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{exam.date}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{exam.time}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Level</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{template?.levelName || `Level ${exam.level}`}</div>
                    </div>
                    {exam.status === 'Completed' && exam.totalScore !== null && (
                      <>
                        <div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Total Score</div>
                          <div style={{ fontSize: '22px', fontWeight: 800, color: color.border }}>{exam.totalScore}<span style={{ fontSize: '14px', color: '#9ca3af' }}>pts</span></div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Grade</div>
                          {(() => {
                            const threshold = template?.passThreshold || 70;
                            let maxPossible = 100;
                            if (template) maxPossible = template.categories.reduce((sum, cat) => sum + cat.items.reduce((s, item) => s + item.max_score, 0), 0);
                            const pct = maxPossible > 0 ? Math.round(((exam.totalScore || 0) / maxPossible) * 100) : 0;
                            return (
                              <div style={{ fontSize: '18px', fontWeight: 800, color: pct >= threshold ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
                                {pct >= threshold ? 'Pass' : pct >= 50 ? 'Marginal' : 'Fail'} ({pct}%)
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Assigned Jury */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginBottom: '10px', letterSpacing: '0.5px' }}>Assigned Jury</div>
                <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a16207', fontWeight: 800, fontSize: '14px' }}>
                    {(editExamMode ? (users.find(u => u.id === editExamForm.juryId)?.name || exam.juryName) : exam.juryName).charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{editExamMode ? (users.find(u => u.id === editExamForm.juryId)?.name || exam.juryName) : exam.juryName}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>@{jury?.username || exam.juryId}</div>
                  </div>
                </div>
              </div>

              {/* All Levels for Student */}
              {(() => {
                const assignedLevels = student?.progression.levels || [];
                const studentExams = exams.filter(e => e.studentId === exam.studentId);
                
                if (assignedLevels.length <= 1 && studentExams.length <= 1) return null;

                return (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginBottom: '10px', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Student's Levels Status</span>
                      <button onClick={() => {
                        handleStudentSelect(exam.studentId);
                        setShowScheduleModal(true);
                      }} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0 }}>
                        + Schedule More
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {Array.from(new Set(assignedLevels)).map(level => {
                        const levelExams = studentExams.filter(e => e.level === level);
                        if (levelExams.length === 0) {
                          // Unscheduled
                          return (
                            <div key={`unsched-${level}`} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', minHeight: 'auto', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', display: 'flex', alignItems: 'center' }}>
                              Level {level} (Unscheduled)
                            </div>
                          );
                        }
                        
                        // Pick the most "advanced" exam for this level to avoid duplicates
                        // Priority: Completed > In-Progress > Scheduled
                        const statusPriority = { 'Completed': 3, 'In-Progress': 2, 'Scheduled': 1 };
                        const bestExam = levelExams.sort((a, b) => 
                          (statusPriority[b.status as keyof typeof statusPriority] || 0) - 
                          (statusPriority[a.status as keyof typeof statusPriority] || 0) ||
                          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
                        )[0];

                        return (
                          <button 
                            key={bestExam.id}
                            onClick={() => {
                              setSelectedExam(bestExam);
                              setEditExamMode(false);
                              setEditScoreMode(false);
                            }}
                            style={{
                              padding: '6px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', minHeight: 'auto',
                              background: bestExam.id === exam.id ? 'var(--primary-color)' : '#f1f5f9', 
                              color: bestExam.id === exam.id ? 'white' : '#475569', 
                              border: bestExam.id === exam.id ? '1px solid var(--primary-color)' : '1px solid #cbd5e1'
                            }}
                          >
                            Level {bestExam.level} ({bestExam.status})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}


              {/* Score breakdown — with edit capability */}
              {exam.status === 'Completed' && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>Score Breakdown</div>
                    {!editExamMode && (
                      editScoreMode ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setEditScoreMode(false)} style={{ background: '#f3f4f6', border: 'none', minHeight: 'auto', padding: '4px 10px', color: '#6b7280', fontSize: '11px', fontWeight: 700, borderRadius: '6px' }}>Cancel</button>
                          <button onClick={saveEditScores} disabled={savingScores} style={{ minHeight: 'auto', padding: '4px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '6px' }}>
                            {savingScores ? '...' : 'Save Scores'}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEditScores(exam)} style={{ background: '#eff6ff', border: 'none', minHeight: 'auto', padding: '4px 10px', color: '#3b82f6', fontSize: '11px', fontWeight: 700, borderRadius: '6px' }}>
                          <Edit2 size={10} style={{ marginRight: '4px' }} /> Edit Scores
                        </button>
                      )
                    )}
                  </div>

                  {editScoreMode ? (
                    <div style={{ marginTop: '16px' }}>
                      {template ? (
                        <ScoringEngine 
                          rubricConfig={template.categories} 
                          initialScores={editScores} 
                          onScoreChange={(scores) => setEditScores(scores)} 
                        />
                      ) : (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                          Template not found for this level. Cannot edit scores.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                      {/* Read-only scores */}
                      {exam.scores && Object.entries(exam.scores).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f9fafb', borderRadius: '6px', fontSize: '12px' }}>
                          <span style={{ color: '#374151' }}>{key.replace('_', ': ')}</span>
                          <span style={{ fontWeight: 700, color: typeof val === 'number' ? color.border : '#6b7280' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="detail-footer" style={{ justifyContent: 'space-between' }}>
              <button className="detail-button secondary" onClick={handleDeleteExam} disabled={deletingExam} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                <Trash2 size={16} /> {deletingExam ? 'Deleting...' : 'Delete'}
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                {editExamMode ? (
                  <>
                    <button className="detail-button secondary" onClick={() => setEditExamMode(false)}><X size={16} /> Cancel</button>
                    <button className="detail-button primary" onClick={saveEditExam} disabled={savingExam}><Save size={16} /> {savingExam ? 'Saving...' : 'Save'}</button>
                  </>
                ) : (
                  <>
                    <button className="detail-button secondary" onClick={() => { setSelectedExam(null); setEditScoreMode(false); }}><X size={16} /> Close</button>
                    <button className="detail-button primary" onClick={() => startEditExam(exam)}><Edit2 size={16} /> Edit Exam</button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Schedule Exam Modal */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 200, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', background: 'white', padding: '32px', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Schedule New Exam</h3>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'transparent', border: 'none', padding: '6px', minHeight: 'auto', color: '#6b7280', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleScheduleExam} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Date</label>
                  <input type="date" value={scheduleForm.date} onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })} required style={{ minHeight: '44px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Time</label>
                  <input type="text" value={scheduleForm.time} onChange={e => setScheduleForm({ ...scheduleForm, time: e.target.value })} placeholder="09:00 AM" style={{ minHeight: '44px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Select Students & Assign Jury</label>
                {batchGroups.map(group => {
                  const formGroup = scheduleForm.groups[group.key] || { selectedStudents: [], juryId: '', level: group.level, category: group.category };
                  const isAllSelected = group.students.length > 0 && formGroup.selectedStudents.length === group.students.length;
                  
                  const toggleAll = () => {
                    const nextStudents = isAllSelected ? [] : group.students.map(s => s.profile.unique_id);
                    setScheduleForm(f => ({
                      ...f,
                      groups: { ...f.groups, [group.key]: { ...formGroup, selectedStudents: nextStudents } }
                    }));
                  };

                  const toggleStudent = (id: string) => {
                    const nextStudents = formGroup.selectedStudents.includes(id) 
                      ? formGroup.selectedStudents.filter(sId => sId !== id)
                      : [...formGroup.selectedStudents, id];
                    setScheduleForm(f => ({
                      ...f,
                      groups: { ...f.groups, [group.key]: { ...formGroup, selectedStudents: nextStudents } }
                    }));
                  };

                  return (
                    <div key={group.key} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Level {group.level} 
                          {group.category && group.category !== 'General' && (
                            <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                              {group.category}
                            </span>
                          )}
                        </div>
                        <select 
                          value={formGroup.juryId} 
                          onChange={e => setScheduleForm(f => ({
                            ...f, groups: { ...f.groups, [group.key]: { ...formGroup, juryId: e.target.value } }
                          }))}
                          required={formGroup.selectedStudents.length > 0}
                          style={{ minHeight: '32px', padding: '0 8px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        >
                          <option value="">Select jury...</option>
                          {juryUsers.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <input type="checkbox" checked={isAllSelected} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>Select All ({group.students.length})</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                        {group.students.map(s => {
                          const isSelected = formGroup.selectedStudents.includes(s.profile.unique_id);
                          return (
                            <div key={s.profile.unique_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: isSelected ? '#eff6ff' : 'white', borderRadius: '6px', border: `1px solid ${isSelected ? '#bfdbfe' : '#e2e8f0'}` }}>
                              <input type="checkbox" checked={isSelected} onChange={() => toggleStudent(s.profile.unique_id)} style={{ cursor: 'pointer' }} />
                              <div style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.profile.name} <span style={{ color: '#64748b' }}>({s.profile.unique_id})</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} style={{ flex: 1, background: '#f3f4f6', color: '#6b7280', border: 'none' }}>Cancel</button>
                <button type="submit" disabled={scheduling || scheduleSuccess || Object.values(scheduleForm.groups).every(g => g.selectedStudents.length === 0)} style={{ flex: 2, background: scheduleSuccess ? '#10b981' : 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {scheduleSuccess ? <><Check size={18} /> Scheduled!</> : scheduling ? 'Scheduling...' : <><Plus size={18} /> Schedule Exam</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {/* Global Student Detail Overlay */}
      {selectedStudentId && (
        <StudentOverlay 
          studentId={selectedStudentId} 
          onClose={() => setSelectedStudentId(null)} 
          onSchedule={() => {
            const id = selectedStudentId;
            setSelectedStudentId(null);
            handleStudentSelect(id);
            setShowScheduleModal(true);
          }}
        />
      )}
    </div>
  );
}
