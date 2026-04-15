'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useData, Student } from '@/context/DataContext';
import {
  UserPlus, Search, Trash2, Edit2, Check, X,
  ChevronDown, ChevronUp, Upload, Download, FileSpreadsheet, AlertCircle,
} from 'lucide-react';

const OBJECTIVES = ['Just Fun', 'Lifestyle Sport', 'Passion', 'Nationals', 'International'] as const;

const STUDENT_FIELDS = [
  { key: 'name',            label: 'Full Name',                    required: true  },
  { key: 'unique_id',       label: 'Unique ID',                    required: false },
  { key: 'age',             label: 'Age',                          required: false },
  { key: 'dob',             label: 'Date of Birth (YYYY-MM-DD)',   required: false },
  { key: 'school',          label: 'School',                       required: false },
  { key: 'class',           label: 'Class / Grade',                required: false },
  { key: 'objective',       label: 'Objective',                    required: false },
  { key: 'medals_won',      label: 'Medals Won',                   required: false },
  { key: 'coach_rating',    label: 'Coach Rating (1–10)',          required: false },
  { key: 'events_attended', label: 'Events Attended (true/false)', required: false },
  { key: 'levels',          label: 'Levels (e.g. 1 or 1;2)',       required: false },
  { key: 'last_exam_date',  label: 'Last Exam Date',               required: false },
] as const;

const emptyStudent = (): Omit<Student, 'progression'> & { progression: Student['progression'] } => ({
  profile: { name: '', age: 0, dob: '', school: '', class: '', unique_id: '' },
  background_questionnaire: { events_attended: false, medals_won: 0, objective: 'Passion', coach_rating: 5 },
  progression: { levels: [1], timeline_lock_status: false, last_exam_date: '' },
});

type StudentForm = ReturnType<typeof emptyStudent>;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export default function SuperadminStudentsPage() {
  const {
    students, addStudent, updateStudent, deleteStudent,
    addStudentsBulk, exportStudentsCSV, exportScoresCSV,
  } = useData();

  const [search, setSearch]       = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState<StudentForm>(emptyStudent());
  const [saving, setSaving]       = useState(false);
  const [savedMsg, setSavedMsg]   = useState('');
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  // Export state
  const [exportingStudents, setExportingStudents] = useState(false);
  const [exportingScores,   setExportingScores]   = useState(false);

  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkStep, setBulkStep]             = useState<'upload' | 'map' | 'done'>('upload');
  const [bulkFile, setBulkFile]             = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders]         = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [fieldMappings, setFieldMappings]   = useState<Record<string, string>>({});
  const [bulkUploading, setBulkUploading]   = useState(false);
  const [bulkResult, setBulkResult]         = useState(0);
  const [bulkError, setBulkError]           = useState('');
  const bulkFileRef = useRef<HTMLInputElement>(null);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return students;
    return students.filter(s =>
      s.profile.name.toLowerCase().includes(q) ||
      s.profile.unique_id.toLowerCase().includes(q) ||
      s.profile.school.toLowerCase().includes(q),
    );
  }, [students, search]);

  // ── Single-student form ───────────────────────────────────────────────────
  const openAdd = () => { setForm(emptyStudent()); setEditingId(null); setShowForm(true); };
  const openEdit = (s: Student) => { setForm(JSON.parse(JSON.stringify(s))); setEditingId(s.profile.unique_id); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = editingId ? await updateStudent(editingId, form) : await addStudent(form);
    setSaving(false);
    if (ok) {
      setSavedMsg(editingId ? 'Student updated!' : 'Student added!');
      setTimeout(() => { setSavedMsg(''); setShowForm(false); setEditingId(null); setForm(emptyStudent()); }, 1200);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete student ${id}? This cannot be undone.`)) return;
    setDeletingId(id);
    await deleteStudent(id);
    setDeletingId(null);
  };

  const setProfileField = (k: keyof Student['profile'], v: string | number) =>
    setForm(f => ({ ...f, profile: { ...f.profile, [k]: v } }));
  const setBqField = (k: keyof Student['background_questionnaire'], v: string | number | boolean) =>
    setForm(f => ({ ...f, background_questionnaire: { ...f.background_questionnaire, [k]: v } }));
  const setProgField = (k: keyof Student['progression'], v: string | number | boolean | number[]) =>
    setForm(f => ({ ...f, progression: { ...f.progression, [k]: v } }));

  const toggleLevel = (level: number) =>
    setForm(f => {
      const cur = f.progression.levels || [1];
      const next = cur.includes(level) ? cur.filter(l => l !== level) : [...cur, level].sort();
      return { ...f, progression: { ...f.progression, levels: next.length > 0 ? next : [1] } };
    });

  // ── Export handlers ───────────────────────────────────────────────────────
  const handleExportStudents = async () => { setExportingStudents(true); await exportStudentsCSV(); setExportingStudents(false); };
  const handleExportScores   = async () => { setExportingScores(true);   await exportScoresCSV();   setExportingScores(false); };

  // ── Bulk upload helpers ───────────────────────────────────────────────────
  const openBulkUpload = () => {
    setBulkStep('upload'); setBulkFile(null); setCsvHeaders([]); setCsvPreviewRows([]);
    setFieldMappings({}); setBulkResult(0); setBulkError(''); setShowBulkUpload(true);
  };
  const closeBulkUpload = () => setShowBulkUpload(false);

  const autoMap = (headers: string[]): Record<string, string> => {
    const map: Record<string, string> = {};
    STUDENT_FIELDS.forEach(({ key }) => {
      const match = headers.find(h => {
        const hn = h.toLowerCase().replace(/[\s_\-]/g, '');
        const kn = key.toLowerCase().replace(/[\s_\-]/g, '');
        return hn === kn || hn.includes(kn) || kn.includes(hn);
      });
      if (match) map[key] = match;
    });
    return map;
  };

  const handleBulkFileSelect = (file: File) => {
    setBulkFile(file); setBulkError('');
    file.text().then(text => {
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { setBulkError('File appears empty or has only headers.'); return; }
      const headers = parseCSVLine(lines[0]);
      const preview = lines.slice(1, 6).map(l => parseCSVLine(l));
      setCsvHeaders(headers);
      setCsvPreviewRows(preview);
      setFieldMappings(autoMap(headers));
      setBulkStep('map');
    }).catch(() => setBulkError('Failed to read file. Please check the format.'));
  };

  const buildStudents = async (): Promise<Student[]> => {
    const text  = await bulkFile!.text();
    const lines = text.split('\n').filter(l => l.trim());
    const headers = parseCSVLine(lines[0]);
    const out: Student[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const vals = parseCSVLine(lines[i]);
      const get = (k: string) => {
        const col = fieldMappings[k];
        if (!col) return '';
        const idx = headers.indexOf(col);
        return idx >= 0 ? (vals[idx] || '').trim() : '';
      };

      const name = get('name');
      if (!name) continue;

      const levelStr = get('levels') || '1';
      const levels = levelStr.includes(';')
        ? levelStr.split(';').map(l => parseInt(l)).filter(l => !isNaN(l))
        : [parseInt(levelStr) || 1];

      const uniqueLevels = Array.from(new Set(levels)).sort((a,b) => a-b);
      out.push({
        profile: {
          name,
          age:       parseInt(get('age')) || 12,
          dob:       get('dob') || '',
          school:    get('school') || '',
          class:     get('class') || '',
          unique_id: get('unique_id') || '',
        },
        background_questionnaire: {
          events_attended: get('events_attended').toLowerCase() === 'true',
          medals_won:      parseInt(get('medals_won')) || 0,
          objective:       (get('objective') as any) || 'Just Fun',
          coach_rating:    parseInt(get('coach_rating')) || 5,
        },
        progression: {
          levels: uniqueLevels,
          timeline_lock_status: false,
          last_exam_date: get('last_exam_date') || '',
        },
      });
    }
    return out;
  };

  const handleBulkImport = async () => {
    if (!bulkFile) return;
    setBulkUploading(true); setBulkError('');
    try {
      const studentsList = await buildStudents();
      if (studentsList.length === 0) {
        setBulkError('No valid rows found. Ensure "Full Name" column is mapped and has data.');
        setBulkUploading(false); return;
      }
      const ok = await addStudentsBulk(studentsList);
      if (ok) { setBulkResult(studentsList.length); setBulkStep('done'); }
      else setBulkError('Import failed. Please try again.');
    } catch { setBulkError('Failed to process file. Please check the format.'); }
    setBulkUploading(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Student Registry</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {students.length} student{students.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', width: '100%', maxWidth: '600px', justifyContent: 'flex-start' }}>
          <button
            onClick={handleExportStudents}
            disabled={exportingStudents}
            title="Download all students as CSV"
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 14px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 600, fontSize: '12px', minHeight: '36px' }}
          >
            <Download size={14} />
            {exportingStudents ? 'Exporting…' : 'Export Students'}
          </button>
          <button
            onClick={handleExportScores}
            disabled={exportingScores}
            title="Download all exam scores as CSV"
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 600, fontSize: '12px', minHeight: '36px' }}
          >
            <FileSpreadsheet size={14} />
            {exportingScores ? 'Exporting…' : 'Export Scores'}
          </button>
          <button
            onClick={openBulkUpload}
            title="Upload a CSV to import multiple students"
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 14px', background: '#faf5ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontWeight: 600, fontSize: '12px', minHeight: '36px' }}
          >
            <Upload size={14} /> Bulk
          </button>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 20px', minHeight: '36px', fontSize: '13px' }}>
            <UserPlus size={16} /> Add
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 16px' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Search by name, ID, or school…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', minHeight: 'auto', padding: 0, boxShadow: 'none', background: 'transparent' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', minHeight: 'auto', padding: '2px', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Student list ── */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {search ? 'No students match your search.' : 'No students registered yet. Click "Add Student" to get started.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(s => {
            const isExpanded = expandedId === s.profile.unique_id;
            return (
              <div key={s.profile.unique_id} style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
                    {s.profile.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{s.profile.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {s.profile.unique_id} • {s.profile.school} • {s.profile.class}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {(Array.from(new Set(s.progression.levels || []))).map((l, index) => (
                      <span key={index} style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: '#eff6ff', color: '#3b82f6' }}>L{l}</span>
                    ))}
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: '#f0fdf4', color: '#16a34a' }}>Age {s.profile.age}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '4px' }}>
                    <button onClick={() => setExpandedId(isExpanded ? null : s.profile.unique_id)} style={{ background: 'transparent', border: 'none', minHeight: '32px', width: '32px', padding: 0, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Toggle details">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => openEdit(s)} style={{ background: '#eff6ff', border: 'none', minHeight: '32px', width: '32px', padding: 0, color: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit student">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(s.profile.unique_id)} disabled={deletingId === s.profile.unique_id} style={{ background: '#fef2f2', border: 'none', minHeight: '32px', width: '32px', padding: 0, color: '#ef4444', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete student">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="grid-cols-3" style={{ padding: '16px 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Profile</div>
                      <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span>DOB: <strong>{s.profile.dob || '—'}</strong></span>
                        <span>School: <strong>{s.profile.school}</strong></span>
                        <span>Class: <strong>{s.profile.class}</strong></span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Background</div>
                      <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span>Objective: <strong>{s.background_questionnaire.objective}</strong></span>
                        <span>Medals: <strong>{s.background_questionnaire.medals_won}</strong></span>
                        <span>Coach Rating: <strong>{s.background_questionnaire.coach_rating}/10</strong></span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Progression</div>
                      <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span>Levels: <strong>{(s.progression.levels || []).join(', ')}</strong></span>
                        <span>Last Exam: <strong>{s.progression.last_exam_date || '—'}</strong></span>
                        <span>Timeline Lock: <strong>{s.progression.timeline_lock_status ? 'Locked' : 'Open'}</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          Add / Edit Student Modal
      ═══════════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{editingId ? 'Edit Student' : 'Add New Student'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ background: 'transparent', border: 'none', minHeight: 'auto', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

                <section>
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '16px' }}>Profile Information</div>
                  <div className="grid-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Full Name *</label>
                      <input type="text" value={form.profile.name} onChange={e => setProfileField('name', e.target.value)} placeholder="e.g. Sophia Chen" required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Unique ID</label>
                      <input type="text" value={form.profile.unique_id} onChange={e => setProfileField('unique_id', e.target.value)} placeholder="EQUI-XXXX (auto if blank)" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Date of Birth</label>
                      <input type="date" value={form.profile.dob} onChange={e => setProfileField('dob', e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Age</label>
                      <input type="number" min={3} max={99} value={form.profile.age || ''} onChange={e => setProfileField('age', parseInt(e.target.value))} placeholder="e.g. 14" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>School *</label>
                      <input type="text" value={form.profile.school} onChange={e => setProfileField('school', e.target.value)} placeholder="e.g. Oakwood High" required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Class / Grade</label>
                      <input type="text" value={form.profile.class} onChange={e => setProfileField('class', e.target.value)} placeholder="e.g. Grade 9" />
                    </div>
                  </div>
                </section>

                <section>
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '16px' }}>Background Questionnaire</div>
                  <div className="grid-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Objective</label>
                      <select value={form.background_questionnaire.objective} onChange={e => setBqField('objective', e.target.value)} style={{ minHeight: '44px', padding: '0 14px', fontSize: '14px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'white' }}>
                        {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Medals Won</label>
                      <input type="number" min={0} value={form.background_questionnaire.medals_won} onChange={e => setBqField('medals_won', parseInt(e.target.value) || 0)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Coach Rating (1–10)</label>
                      <input type="number" min={1} max={10} value={form.background_questionnaire.coach_rating} onChange={e => setBqField('coach_rating', parseInt(e.target.value) || 5)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '20px' }}>
                      <input type="checkbox" id="events_attended" checked={form.background_questionnaire.events_attended} onChange={e => setBqField('events_attended', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', minHeight: 'auto' }} />
                      <label htmlFor="events_attended" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Has attended events before</label>
                    </div>
                  </div>
                </section>

                <section>
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '16px' }}>Progression</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>Assigned Levels (select all that apply)</label>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {[1, 2, 3, 4].map(l => {
                          const isActive = (form.progression.levels || []).includes(l);
                          return (
                            <button key={l} type="button" onClick={() => toggleLevel(l)}
                              style={{ padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', minHeight: 'auto', background: isActive ? 'var(--primary-color)' : '#f3f4f6', color: isActive ? 'white' : '#6b7280', border: isActive ? '2px solid var(--primary-color)' : '2px solid #e5e7eb' }}>
                              Level {l}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600 }}>Last Exam Date</label>
                        <input type="date" value={form.progression.last_exam_date} onChange={e => setProgField('last_exam_date', e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '20px' }}>
                        <input type="checkbox" id="timeline_lock" checked={form.progression.timeline_lock_status} onChange={e => setProgField('timeline_lock_status', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', minHeight: 'auto' }} />
                        <label htmlFor="timeline_lock" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Timeline locked</label>
                      </div>
                    </div>
                  </div>
                </section>

              </div>

              <div style={{ padding: '20px 28px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', background: '#fafafa', position: 'sticky', bottom: 0 }}>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} style={{ flex: 1, background: '#f3f4f6', color: '#6b7280', border: 'none' }}>Cancel</button>
                <button type="submit" disabled={saving || !!savedMsg} style={{ flex: 2, background: savedMsg ? '#10b981' : 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {savedMsg ? <><Check size={18} /> {savedMsg}</> : saving ? 'Saving…' : <><Check size={18} /> {editingId ? 'Save Changes' : 'Add Student'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          Bulk Upload Modal
      ═══════════════════════════════════════════════════════════════════ */}
      {showBulkUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '740px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.2)' }}>

            {/* Modal header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Bulk Upload Students</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {bulkStep === 'upload' && 'Upload a CSV file to import multiple students at once'}
                  {bulkStep === 'map'    && `Map your CSV columns to student fields — ${csvPreviewRows.length} data row(s) previewed`}
                  {bulkStep === 'done'   && 'Import complete'}
                </p>
              </div>
              <button onClick={closeBulkUpload} style={{ background: 'transparent', border: 'none', minHeight: 'auto', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: '24px 28px' }}>

              {/* ── Step 1: Upload ── */}
              {bulkStep === 'upload' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Drop zone */}
                  <div
                    style={{ border: '2px dashed #d1d5db', borderRadius: '12px', padding: '52px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: '#fafafa', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onClick={() => bulkFileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f && f.name.toLowerCase().endsWith('.csv')) handleBulkFileSelect(f);
                      else setBulkError('Please upload a .csv file.');
                    }}
                  >
                    <div style={{ padding: '18px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6' }}>
                      <Upload size={36} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontWeight: 700, fontSize: '16px' }}>Drag & drop a CSV file here</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>or click to browse — only .csv format supported</p>
                    </div>
                    <input ref={bulkFileRef} type="file" accept=".csv" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleBulkFileSelect(f); }} />
                  </div>

                  {bulkError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} /> {bulkError}
                    </div>
                  )}

                  {/* Column reference */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px 20px', border: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.04em' }}>Recognised CSV column names (columns will be auto-mapped)</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {STUDENT_FIELDS.map(f => (
                        <span key={f.key} style={{ fontSize: '12px', fontFamily: 'monospace', background: 'white', padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', color: f.required ? '#7c3aed' : '#6b7280' }}>
                          {f.key}{f.required ? ' *' : ''}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}><span style={{ color: '#7c3aed' }}>*</span> required — rows without a name will be skipped</p>
                  </div>
                </div>
              )}

              {/* ── Step 2: Map fields ── */}
              {bulkStep === 'map' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* File confirmation */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} /> File loaded: <strong>{bulkFile?.name}</strong> — {csvHeaders.length} column{csvHeaders.length !== 1 ? 's' : ''} detected
                  </div>

                  {/* Mapping rows */}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Map your CSV columns to student fields:</p>
                    <div className="grid-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {STUDENT_FIELDS.map(field => (
                        <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>
                              {field.label}
                              {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>{field.key}</div>
                          </div>
                          <select
                            value={fieldMappings[field.key] || ''}
                            onChange={e => setFieldMappings(prev => ({ ...prev, [field.key]: e.target.value }))}
                            style={{ minHeight: '38px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white' }}
                          >
                            <option value="">{field.required ? '— Select column —' : '— Skip (optional) —'}</option>
                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data preview */}
                  {csvPreviewRows.length > 0 && fieldMappings['name'] && (
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
                        Preview — first {Math.min(csvPreviewRows.length, 3)} row{Math.min(csvPreviewRows.length, 3) !== 1 ? 's' : ''}:
                      </p>
                      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              {['Name', 'School', 'Class', 'Level(s)', 'Unique ID'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreviewRows.slice(0, 3).map((row, i) => {
                              const getVal = (fieldKey: string) => {
                                const col = fieldMappings[fieldKey];
                                if (!col) return '—';
                                const idx = csvHeaders.indexOf(col);
                                return idx >= 0 ? (row[idx] || '—') : '—';
                              };
                              return (
                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{getVal('name')}</td>
                                  <td style={{ padding: '8px 12px' }}>{getVal('school')}</td>
                                  <td style={{ padding: '8px 12px' }}>{getVal('class')}</td>
                                  <td style={{ padding: '8px 12px' }}>{getVal('levels')}</td>
                                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{getVal('unique_id')}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {bulkError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} /> {bulkError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => { setBulkStep('upload'); setBulkFile(null); setBulkError(''); }} style={{ flex: 1, background: '#f3f4f6', color: '#6b7280', border: 'none' }}>
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!fieldMappings['name'] || bulkUploading}
                      onClick={handleBulkImport}
                      style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {bulkUploading
                        ? <><div style={{ width: '16px', height: '16px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} /> Importing…</>
                        : <><Upload size={16} /> Import Students</>}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Done ── */}
              {bulkStep === 'done' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '24px 0', textAlign: 'center' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={36} style={{ color: '#16a34a' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>Import Successful!</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {bulkResult} student profile{bulkResult !== 1 ? 's' : ''} have been added to the registry.
                    </p>
                  </div>
                  <button onClick={closeBulkUpload} style={{ padding: '0 32px' }}>Done</button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
