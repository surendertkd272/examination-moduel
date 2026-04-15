import { NextRequest, NextResponse } from 'next/server';
import { getStudents, getStudentById, createStudent } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const students = await getStudents();
    return NextResponse.json({ students });
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Support both single student and bulk (array)
    const studentsToAdd = Array.isArray(body.students) ? body.students : [body];
    let added = 0;

    for (const student of studentsToAdd) {
      // Auto-generate unique_id if not provided
      if (!student.profile.unique_id) {
        student.profile.unique_id = `EQUI-${Math.floor(Math.random() * 9000) + 1000}`;
      }

      // Check for duplicate unique_id
      const exists = await getStudentById(student.profile.unique_id);
      if (exists) continue;

      await createStudent(student);
      added++;
    }

    const students = await getStudents();
    return NextResponse.json({ success: true, count: added, students }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
