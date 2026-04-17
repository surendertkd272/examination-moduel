import { NextRequest, NextResponse } from 'next/server';
import { getExams, deleteExam } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can clear exams' }, { status: 403 });
    }

    const { status } = await request.json();

    const allExams = await getExams();
    let toDelete = allExams;

    if (status && status !== 'all') {
      toDelete = allExams.filter(e => e.status === status);
    }

    let deleted = 0;
    for (const exam of toDelete) {
      await deleteExam(exam.id);
      deleted++;
    }

    return NextResponse.json({ success: true, deleted });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
