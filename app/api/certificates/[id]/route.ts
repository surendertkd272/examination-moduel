import { NextRequest, NextResponse } from 'next/server';
import { getExamById, getStudentById, getUserById } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const exam = await getExamById(id);

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.status !== 'Completed') {
      return NextResponse.json({ error: 'Exam is not completed' }, { status: 400 });
    }

    const [student, jury] = await Promise.all([
      getStudentById(exam.studentId),
      getUserById(exam.juryId),
    ]);

    return NextResponse.json({
      certificate: {
        examId: exam.id,
        studentName: student?.profile.name || exam.studentId,
        studentId: exam.studentId,
        school: student?.profile.school || 'Unknown',
        level: exam.level,
        totalScore: exam.totalScore,
        date: exam.date,
        juryName: jury?.name || exam.juryName,
        status: exam.status,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
