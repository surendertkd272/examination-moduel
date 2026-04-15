import { NextRequest, NextResponse } from 'next/server';
import { getExams, getStudents, getScoringTemplates } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !['superadmin', 'admin'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [allExams, students, scoringTemplates] = await Promise.all([
      getExams(),
      getStudents(),
      getScoringTemplates(),
    ]);

    const completedExams = allExams.filter(e => e.status === 'Completed');

    // Collect all unique score keys
    const allScoreKeys = new Set<string>();
    completedExams.forEach(exam => {
      if (exam.scores) {
        Object.keys(exam.scores).forEach(k => allScoreKeys.add(k));
      }
    });
    const scoreKeysList = Array.from(allScoreKeys).sort();

    const baseHeaders = [
      'Exam ID', 'Student ID', 'Student Name', 'School',
      'Level', 'Exam Date', 'Exam Time', 'Jury', 'Status',
      'Total Score', 'Max Score', 'Percentage', 'Result',
    ];
    const headers = [...baseHeaders, ...scoreKeysList];
    const csvLines: string[] = [headers.map(h => `"${h}"`).join(',')];

    for (const exam of completedExams) {
      const student = students.find(s => s.profile.unique_id === exam.studentId);
      const template = scoringTemplates[String(exam.level)];

      let maxScore = 0;
      if (template) {
        maxScore = template.categories.reduce((sum, cat) => {
          return sum + cat.items.length * cat.max_score;
        }, 0);
      }

      const totalScore = exam.totalScore ?? 0;
      const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : '';
      const passThreshold = template?.passThreshold ?? 60;
      const result = maxScore > 0
        ? (parseFloat(percentage) >= passThreshold ? 'Pass' : 'Fail')
        : '';

      const baseRow = [
        exam.id,
        exam.studentId,
        student?.profile.name ?? '',
        student?.profile.school ?? '',
        exam.level,
        exam.date,
        exam.time,
        exam.juryName,
        exam.status,
        totalScore,
        maxScore || '',
        percentage,
        result,
      ];

      const scoreRow = scoreKeysList.map(k => exam.scores?.[k] ?? '');
      const fullRow = [...baseRow, ...scoreRow];
      csvLines.push(fullRow.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    }

    return new NextResponse(csvLines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="scores_export.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
