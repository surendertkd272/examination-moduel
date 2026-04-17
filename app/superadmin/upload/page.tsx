'use client';

import React, { useState, useRef } from 'react';
import { useData, Student } from '@/context/DataContext';
import { Upload, FileText, CheckCircle2, X } from 'lucide-react';

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [error, setError] = useState('');
  const { addStudentsBulk } = useData();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadComplete(false);
      setError('');
    }
  };

  const parseCSV = (text: string): Student[] => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const students: Student[] = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim());
      const get = (key: string) => vals[headers.indexOf(key)] || '';

      const levelStr = get('levels') || get('current_level') || '1';
      const levels = levelStr.includes(';')
        ? levelStr.split(';').map(l => parseInt(l)).filter(l => !isNaN(l))
        : [parseInt(levelStr) || 1];

      const parseYesNo = (val: string) => {
        const v = (val || '').toLowerCase().trim();
        return v === 'yes' || v === 'y' || v === 'true' || v === '1';
      };

      students.push({
        profile: {
          name: get('name') || `Student ${i}`,
          age: parseInt(get('age')) || 12,
          dob: get('dob') || '2012-01-01',
          school: get('school') || 'Unknown School',
          class: get('class') || 'Grade 6',
          unique_id: get('unique_id') || '',
        },
        background_questionnaire: {
          events_attended: parseYesNo(get('events_attended')),
          medals_won:      parseYesNo(get('medals_won')),
          objective: (get('objective') as any) || 'Just Fun',
          coach_rating: parseInt(get('coach_rating')) || 5,
        },
        progression: {
          levels,
          timeline_lock_status: false,
          last_exam_date: get('last_exam_date') || '',
        },
      });
    }
    return students;
  };

  const parseJSON = (text: string): Student[] => {
    try {
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      // Migrate legacy current_level → levels
      return arr.map((s: any) => {
        if (s.progression && !Array.isArray(s.progression.levels)) {
          s.progression.levels = [s.progression.current_level || 1];
          delete s.progression.current_level;
        }
        return s;
      });
    } catch {
      return [];
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');

    try {
      const text = await file.text();
      let students: Student[] = [];

      if (file.name.endsWith('.csv')) {
        students = parseCSV(text);
      } else if (file.name.endsWith('.json')) {
        students = parseJSON(text);
      }

      if (students.length === 0) {
        setError('No valid student data found in file. Check the format.');
        setIsUploading(false);
        return;
      }

      const success = await addStudentsBulk(students);
      if (success) {
        setUploadComplete(true);
        setUploadCount(students.length);
      } else {
        setError('Upload failed. Please try again.');
      }
    } catch {
      setError('Failed to parse file. Ensure it is valid CSV or JSON.');
    }

    setIsUploading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '768px', margin: '0 auto' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Bulk Upload Students</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Upload CSV or JSON files to populate student rosters</p>
      </div>

      <div
        style={{
          background: 'white', borderRadius: '16px', border: `2px dashed ${file ? 'var(--primary-color)' : '#e5e7eb'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
          paddingTop: '64px', paddingBottom: '64px', padding: '64px 32px',
          backgroundColor: file ? 'var(--primary-light)' : 'white',
        }}
      >
        <div style={{ padding: '24px', borderRadius: '50%', background: file ? 'var(--primary-color)' : '#f3f4f6', color: file ? 'white' : '#6b7280' }}>
          <Upload size={48} />
        </div>

        {file ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: '18px' }}>{file.name}</p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(2)} KB</p>
            <button
              onClick={() => { setFile(null); setUploadComplete(false); }}
              style={{ marginTop: '16px', background: 'transparent', color: 'var(--error)', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', margin: '16px auto 0', minHeight: 'auto' }}
            >
              <X size={16} /> Remove File
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: '18px' }}>Drag & drop student list file</p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>Supported formats: .csv, .json (max 5MB)</p>
            <label style={{ background: 'var(--primary-color)', color: 'white', padding: '12px 32px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, display: 'inline-block' }}>
              Browse Files
              <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".csv,.json" onChange={handleFileChange} />
            </label>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--surface-color)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px' }}>Required Column Mapping</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {['name', 'dob', 'school', 'class', 'unique_id', 'objective', 'levels'].map(key => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'monospace', background: 'white', padding: '8px 12px', border: '1px solid #f3f4f6', borderRadius: '6px' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
              {key}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '2px solid #fecaca', padding: '16px', borderRadius: '12px', color: '#dc2626', fontSize: '14px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      <button
        disabled={!file || isUploading || uploadComplete}
        onClick={handleUpload}
        style={{
          width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
          padding: '20px', borderRadius: '16px', fontSize: '18px', fontWeight: 700,
          background: uploadComplete ? 'var(--success)' : 'var(--primary-color)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        }}
      >
        {isUploading ? (
          <div style={{ width: '24px', height: '24px', border: '4px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
        ) : uploadComplete ? (
          <CheckCircle2 size={24} />
        ) : (
          <FileText size={24} />
        )}
        {isUploading ? 'Processing File...' : uploadComplete ? 'Upload Successful!' : 'Start Import Process'}
      </button>

      {uploadComplete && (
        <div style={{ display: 'flex', gap: '16px', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.2)', padding: '24px', borderRadius: '16px' }}>
          <CheckCircle2 size={32} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--success)' }}>Import Successful</h4>
            <p style={{ fontSize: '14px', color: 'rgba(16,185,129,0.8)' }}>
              {uploadCount} student profile(s) have been added to the system. You can now schedule their evaluation from the Dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
