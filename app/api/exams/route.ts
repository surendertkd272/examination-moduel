import { NextRequest, NextResponse } from 'next/server';
import { getExams, getExamsByJury, getStudentById, getUserById, createExam } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let exams;
    if (payload.role === 'jury') {
      exams = await getExamsByJury(payload.userId);
    } else {
      exams = await getExams();
    }

    return NextResponse.json({ exams });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !['superadmin', 'admin'].includes(payload.role)) {
      return NextResponse.json({ error: 'Only superadmin can schedule exams' }, { status: 403 });
    }

    const { studentId, juryId, level, date, time } = await request.json();

    if (!studentId || !juryId || !level || !date) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Verify student exists
    const student = await getStudentById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get jury name
    const jury = await getUserById(juryId);
    if (!jury) {
      return NextResponse.json({ error: 'Jury not found' }, { status: 404 });
    }

    const newExam = await createExam({
      id: `exam-${Date.now()}`,
      studentId,
      juryId,
      juryName: jury.name,
      level: parseInt(level),
      date,
      time: time || '09:00 AM',
      status: 'Scheduled',
      totalScore: null,
      scores: null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, exam: newExam }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
