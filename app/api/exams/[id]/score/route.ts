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
    const { scores } = await request.json();

    if (!scores || typeof scores !== 'object') {
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

    // Calculate total score — exclude "Miscellaneous Questions" from total
    let totalScore = 0;
    const numericScores: Record<string, number> = {};
    for (const [key, val] of Object.entries(scores)) {
      const numVal = typeof val === 'boolean'
        ? (val ? 5 : 0)
        : (typeof val === 'number' ? val : parseFloat(val as string) || 0);
      numericScores[key] = numVal;

      if (!key.startsWith('Miscellaneous Questions_')) {
        totalScore += numVal;
      }
    }

    const updatedExam = await updateExam(id, {
      scores: numericScores,
      totalScore,
      status: 'Completed',
    });

    // Update student's progression last_exam_date
    const student = await getStudentById(exam.studentId);
    if (student) {
      await updateStudent(exam.studentId, {
        progression: {
          ...student.progression,
          last_exam_date: new Date().toISOString().split('T')[0],
        },
      });
    }

    return NextResponse.json({ success: true, exam: updatedExam, totalScore });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
