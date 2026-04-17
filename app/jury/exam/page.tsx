'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import ScoringEngine from '@/components/scoring/ScoringEngine';
import { ChevronLeft, Save, AlertCircle, ChevronDown } from 'lucide-react';

function ExamScoringContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('id');
  const { exams, students, scoringTemplates, submitScore } = useData();

  const [totalScore, setTotalScore] = useState(0);
  const [tempScores, setTempScores] = useState<Record<string, number | string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const exam = exams.find(ex => ex.id === examId);
  const student = students.find(s => s.profile.unique_id === exam?.studentId);

  // Get all exams for this student assigned to this jury (for level switching)
  const studentExams = useMemo(() => {
    if (!exam || !student) return [];
    const allExams = exams.filter(e => e.studentId === exam.studentId && e.juryId === exam.juryId);
    const dedupedMap = new Map<number, typeof allExams[0]>();
    allExams.forEach(e => {
      if (!dedupedMap.has(e.level)) {
        dedupedMap.set(e.level, e);
      } else {
        const existing = dedupedMap.get(e.level)!;
        if (existing.status === 'Completed' && e.status !== 'Completed') {
          dedupedMap.set(e.level, e);
        }
      }
    });
    return Array.from(dedupedMap.values()).sort((a, b) => a.level - b.level);
  }, [exam, student, exams]);

  const hasMultipleLevels = studentExams.length > 1;

  // Load rubric config from scoring templates based on exam level
  const rubricConfig = useMemo(() => {
    if (!exam) return [];
    const template = scoringTemplates[String(exam.level)];
    if (template) {
      return template.categories;
    }
    // Fallback — basic rubric
    return [
      { name: 'Dress Code', items: [{ name: 'Helmet', max_score: 5 }, { name: 'Riding Boots', max_score: 5 }], max_score: 5 },
      { name: 'Overall Judgement', items: [{ name: 'Confidence', max_score: 10 }, { name: 'Control', max_score: 10 }], max_score: 10 },
    ];
  }, [exam, scoringTemplates]);

  const maxPossible = rubricConfig.reduce((sum, cat) => sum + cat.items.reduce((s, item) => s + item.max_score, 0), 0);

  if (!exam || !student) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 16px', gap: '16px', textAlign: 'center' }}>
        <AlertCircle size={64} style={{ color: '#ef4444' }} />
        <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Exam Not Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>Please select a valid exam from the schedule.</p>
        <button onClick={() => router.push('/jury')} style={{ marginTop: '16px' }}>Back to Schedule</button>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    const result = await submitScore(exam.id, tempScores);
    setIsSaving(false);
    if (result.success) {
      router.push('/jury');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Sticky Top Progress */}
      <div style={{
        position: 'sticky', top: '64px', background: 'white', zIndex: 40,
        margin: '0 -16px', padding: '12px 16px',
        borderBottom: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button onClick={() => router.push('/jury')} style={{ background: 'transparent', color: 'var(--primary-color)', padding: 0, minWidth: 0, minHeight: 'auto', border: 'none' }}>
          <ChevronLeft size={28} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#6b7280' }}>Scoring For</p>
          <p style={{ fontWeight: 700, fontSize: '14px' }}>{student.profile.name}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#6b7280' }}>Total</p>
          <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-color)' }}>{totalScore}<span style={{ fontSize: '12px', color: '#9ca3af' }}>/{maxPossible}</span></p>
        </div>
      </div>

      {/* Student info card */}
      <div style={{
        background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '16px',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '18px',
          background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 900, fontSize: '24px', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(124,58,237,0.2)'
        }}>
          {student.profile.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>{student.profile.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {student.profile.unique_id} • {student.profile.school} • Age {student.profile.age}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            {Array.from(new Set(student.progression.levels || [])).map(l => (
              <span key={l} style={{
                fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '6px',
                background: l === exam.level ? '#7c3aed' : '#f1f5f9',
                color: l === exam.level ? 'white' : 'var(--text-muted)',
                border: l === exam.level ? '2px solid transparent' : '1px solid var(--border-color)',
                boxShadow: l === exam.level ? '0 4px 10px rgba(124,58,237,0.3)' : 'none'
              }}>
                Level {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Level selector (if multi-level) */}
      {hasMultipleLevels && (
        <div style={{ background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#1e40af', marginBottom: '8px' }}>
            Switch Level (Submit each separately)
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {studentExams.map(se => (
              <button
                key={se.id}
                onClick={() => router.push(`/jury/exam?id=${se.id}`)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', minHeight: 'auto',
                  background: se.id === exam.id ? 'var(--primary-color)' : 'white',
                  color: se.id === exam.id ? 'white' : '#374151',
                  border: se.id === exam.id ? 'none' : '1px solid #bfdbfe',
                }}
              >
                Level {se.level} {se.status === 'Completed' ? '✓' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level info */}
      <div style={{ display: 'flex', gap: '10px', background: '#fefce8', border: '2px solid #fde68a', padding: '14px', borderRadius: '14px' }}>
        <AlertCircle style={{ color: '#ca8a04', flexShrink: 0 }} size={18} />
        <p style={{ fontSize: '13px', color: '#854d0e', lineHeight: 1.5 }}>
          Evaluating <strong>{scoringTemplates[String(exam.level)]?.levelName || `Level ${exam.level}`}</strong>.
          {rubricConfig.length} scoring categories loaded.
          {exam.status === 'Completed' && <strong> (Already scored: {exam.totalScore}pts. Contact superadmin to edit.)</strong>}
        </p>
      </div>

      {/* Scoring Engine — receives dynamic rubric */}
      <ScoringEngine
        rubricConfig={rubricConfig}
        initialScores={(exam.scores as Record<string, number>) || {}}
        onScoreChange={(scores, total) => {
          setTempScores(scores);
          setTotalScore(total);
        }}
      />

      {/* Submit button */}
      <div style={{ marginTop: '24px', marginBottom: '48px' }}>
        <button
          onClick={handleSave}
          disabled={isSaving || exam.status === 'Completed'}
          style={{
            width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
            background: exam.status === 'Completed' ? '#a1a1aa' : '#10b981',
            padding: '24px', borderRadius: '20px', fontSize: '18px', fontWeight: 900,
            boxShadow: exam.status !== 'Completed' ? '0 20px 25px -5px rgba(16,185,129,0.3)' : 'none',
            border: 'none', color: 'white'
          }}
        >
          {isSaving ? (
            <div style={{ width: '24px', height: '24px', border: '4px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          ) : (
            <Save size={24} />
          )}
          {exam.status === 'Completed' ? 'Evaluation Already Submitted' : isSaving ? 'Syncing Scores...' : `Lock & Submit Level ${exam.level}`}
        </button>
      </div>
    </div>
  );
}

export default function ActiveExamPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
      </div>
    }>
      <ExamScoringContent />
    </Suspense>
  );
}
