import { NextRequest, NextResponse } from 'next/server';
import { getExamById, updateExam, getStudentById, updateStudent } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { scores, draft, reset } = await request.json();
    const isDraft = Boolean(draft);
    const isReset = Boolean(reset);

    if (!isReset && (!scores || typeof scores !== 'object')) {
      return NextResponse.json({ error: 'Scores data is required' }, { status: 400 });
    }

    const exam = await getExamById(id);
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Jury can only score exams that are not completed
    if (payload.role === 'jury' && exam.status === 'Completed') {
      return NextResponse.json({ error: 'This exam has already been scored. Contact superadmin to edit.' }, { status: 403 });
    }

    // Jury can only score their own assigned exams
    if (payload.role === 'jury' && exam.juryId !== payload.userId) {
      return NextResponse.json({ error: 'You are not assigned to this exam' }, { status: 403 });
    }

    // Reset path: clear any draft scores and put the exam back on the schedule.
    if (isReset) {
      const resetExam = await updateExam(id, {
        scores: {},
        totalScore: 0,
        status: 'Scheduled',
      });
      return NextResponse.json({ success: true, exam: resetExam, totalScore: 0, reset: true });
    }

    // Preserve the original value type so `select` answers (e.g. "Yes"/"No")
    // and free-text remarks survive — previously we parseFloat'd everything,
    // which wiped non-numeric fields like Objective and Remarks by Jury.
    // Only numbers and booleans contribute to totalScore.
    let totalScore = 0;
    const savedScores: Record<string, number | string> = {};
    for (const [key, val] of Object.entries(scores)) {
      if (typeof val === 'boolean') {
        const n = val ? 5 : 0;
        savedScores[key] = n;
        if (!key.startsWith('Miscellaneous Questions_')) totalScore += n;
      } else if (typeof val === 'number') {
        savedScores[key] = val;
        if (!key.startsWith('Miscellaneous Questions_')) totalScore += val;
      } else if (typeof val === 'string') {
        // Keep strings as strings. Only treat as numeric if it parses cleanly
        // AND the original looked like a number (all digits / decimal).
        const trimmed = val.trim();
        if (trimmed !== '' && /^-?\d+(\.\d+)?$/.test(trimmed)) {
          const n = parseFloat(trimmed);
          savedScores[key] = n;
          if (!key.startsWith('Miscellaneous Questions_')) totalScore += n;
        } else {
          savedScores[key] = val;
        }
      }
    }

    const updatedExam = await updateExam(id, {
      scores: savedScores,
      totalScore,
      status: isDraft ? 'In-Progress' : 'Completed',
    });

    // Only stamp last_exam_date on a final submission, not on a draft save.
    if (!isDraft) {
      const student = await getStudentById(exam.studentId);
      if (student) {
        await updateStudent(exam.studentId, {
          progression: {
            ...student.progression,
            last_exam_date: new Date().toISOString().split('T')[0],
          },
        });
      }
    }

    return NextResponse.json({ success: true, exam: updatedExam, totalScore });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
