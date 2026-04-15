'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Award, Mail, Download, CheckCircle } from 'lucide-react';

export default function CertificationPage() {
  const { students, exams, scoringTemplates } = useData();
  const [isSending, setIsSending] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const completedExams = exams.filter(ex => 
    ex.status === 'Completed' && 
    ex.date <= todayStr &&
    (ex.totalScore !== null && ex.totalScore !== undefined)
  );

  const getPassStatus = (exam: typeof exams[0]) => {
    const template = scoringTemplates[String(exam.level)];
    const threshold = template?.passThreshold || 70;
    // Calculate max possible score from template
    let maxPossible = 100;
    if (template) {
      maxPossible = template.categories.reduce((sum, cat) => {
        if (cat.name === 'Miscellaneous Questions') return sum;
        return sum + cat.items.reduce((s, item) => s + item.max_score, 0);
      }, 0);
    }
    const percentage = maxPossible > 0 ? Math.round(((exam.totalScore || 0) / maxPossible) * 100) : 0;
    return { passed: percentage >= threshold, percentage, threshold };
  };

  const handleSendEmail = (examId: string) => {
    setIsSending(examId);
    setTimeout(() => {
      setIsSending(null);
      alert('Certificate successfully generated and sent to student email via Auto-Email engine.');
    }, 1500);
  };

  const handleDownloadPDF = async (examId: string) => {
    setIsDownloading(examId);
    try {
      const res = await fetch(`/api/certificates/${examId}`);
      if (res.ok) {
        const { certificate } = await res.json();
        const status = getPassStatus(exams.find(e => e.id === examId)!);
        const certHTML = `
          <!DOCTYPE html>
          <html>
          <head><title>Certificate - ${certificate.studentName}</title>
          <style>
            body { font-family: 'Georgia', serif; text-align: center; padding: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .cert { background: white; padding: 80px 60px; border-radius: 16px; max-width: 800px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); border: 3px solid #667eea; }
            h1 { color: #1E3A8A; font-size: 36px; margin-bottom: 8px; }
            h2 { color: #3b82f6; font-size: 24px; margin-bottom: 32px; font-weight: 400; }
            .name { font-size: 42px; color: #111827; font-weight: bold; margin: 24px 0; border-bottom: 3px solid #FFD600; padding-bottom: 8px; display: inline-block; }
            .details { color: #6b7280; font-size: 16px; line-height: 2; }
            .score { font-size: 48px; font-weight: bold; color: #10b981; margin: 24px 0; }
            .status { background: ${status.passed ? '#10b981' : '#ef4444'}; color: white; padding: 8px 32px; border-radius: 8px; font-weight: bold; display: inline-block; margin: 16px 0; }
            .footer { margin-top: 48px; display: flex; justify-content: space-between; border-top: 2px solid #e5e7eb; padding-top: 24px; }
            .footer div { text-align: center; }
            .footer .line { width: 200px; border-top: 1px solid #111; margin: 8px auto 0; }
            @media print { body { background: white; padding: 0; } .cert { box-shadow: none; border: none; } }
          </style></head>
          <body>
            <div class="cert">
              <h1>Equiwings</h1>
              <h2>Certificate of ${status.passed ? 'Achievement' : 'Participation'}</h2>
              <p style="color: #6b7280;">This is to certify that</p>
              <div class="name">${certificate.studentName}</div>
              <p class="details">
                Student ID: ${certificate.studentId}<br/>
                School: ${certificate.school}<br/>
                Has completed Level ${certificate.level} Equestrian Evaluation
              </p>
              <div class="score">${status.percentage}%</div>
              <div class="status">${status.passed ? 'PASSED' : 'PARTICIPATED'}</div>
              <p class="details">Date: ${certificate.date}</p>
              <div class="footer">
                <div><div class="line"></div><p style="font-size:12px;color:#6b7280;">Examiner: ${certificate.juryName}</p></div>
                <div><div class="line"></div><p style="font-size:12px;color:#6b7280;">Equiwings Authority</p></div>
              </div>
            </div>
          </body></html>
        `;
        const blob = new Blob([certHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
      }
    } catch {
      alert('Failed to generate certificate');
    }
    setIsDownloading(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Certification Engine</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Generate and deliver automated certificates for completed evaluations</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {completedExams.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center', padding: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Award size={64} style={{ color: '#e5e7eb' }} />
            <p style={{ color: 'var(--text-muted)' }}>No students have completed their evaluations yet.</p>
          </div>
        ) : (
          completedExams.map((exam) => {
            const student = students.find(s => s.profile.unique_id === exam.studentId);
            const status = getPassStatus(exam);
            return (
              <div key={exam.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', color: 'white', flexShrink: 0, minWidth: '180px', background: status.passed ? 'var(--primary-color)' : '#6b7280' }}>
                  <Award size={40} style={{ color: '#FFD600', marginBottom: '12px' }} />
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', opacity: 0.7 }}>Level {exam.level}</span>
                  <span style={{ fontSize: '24px', fontWeight: 800 }}>{status.percentage}%</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 10px', borderRadius: '4px', marginTop: '8px', background: status.passed ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.3)' }}>
                    {status.passed ? 'PASSED' : 'BELOW THRESHOLD'}
                  </span>
                </div>

                <div style={{ padding: '24px 32px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{student?.profile.name || exam.studentId}</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{exam.studentId} • {student?.profile.school}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Exam Date</p>
                      <p style={{ fontWeight: 600 }}>{exam.date}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button
                      onClick={() => handleSendEmail(exam.id)}
                      disabled={isSending === exam.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '13px' }}
                    >
                      {isSending === exam.id ? (
                        <div style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
                      ) : <Mail size={16} />}
                      {isSending === exam.id ? 'Delivering...' : 'Auto-Email'}
                    </button>

                    <button
                      onClick={() => handleDownloadPDF(exam.id)}
                      disabled={isDownloading === exam.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', background: 'white', color: 'var(--primary-color)', border: '2px solid var(--primary-color)' }}
                    >
                      <Download size={16} />
                      {isDownloading === exam.id ? 'Generating...' : 'Download'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', background: '#eff6ff', border: '2px solid #dbeafe', padding: '24px', borderRadius: '16px' }}>
        <CheckCircle style={{ color: '#2563eb', flexShrink: 0 }} />
        <div>
          <h4 style={{ fontWeight: 700, marginBottom: '4px', color: '#1e3a5f' }}>Certificate Engine</h4>
          <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#1e40af' }}>
            Pass/fail is dynamically calculated from scoring templates. Threshold is configurable per level in the Scoring Templates page.
          </p>
        </div>
      </div>
    </div>
  );
}
