import { NextRequest, NextResponse } from 'next/server';
import { getStudents } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !['superadmin', 'admin'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const students = await getStudents();

    const headers = ['Unique ID', 'Name', 'Age', 'DOB', 'School', 'Class', 'Objective', 'Events Attended', 'Medals Won', 'Coach Rating', 'Levels', 'Last Exam Date'];
    const rows = students.map(s => [
      s.profile.unique_id,
      s.profile.name,
      s.profile.age,
      s.profile.dob,
      s.profile.school,
      s.profile.class,
      s.background_questionnaire.objective,
      s.background_questionnaire.events_attended ? 'Yes' : 'No',
      s.background_questionnaire.medals_won ? 'Yes' : 'No',
      s.background_questionnaire.coach_rating,
      (s.progression.levels || []).join(';'),
      s.progression.last_exam_date,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="students_export.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
