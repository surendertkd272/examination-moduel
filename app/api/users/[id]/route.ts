import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser, deleteUser, updateExamsJuryName, countExamsByJury } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const updates = await request.json();

    const existing = await getUserById(id);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existing.role === 'superadmin') {
      return NextResponse.json({ error: 'Cannot modify superadmin account' }, { status: 403 });
    }

    // Hash password if provided
    if (updates.password) {
      updates.password = hashPassword(updates.password);
    }

    // Recalculate permissions if role changed
    if (updates.role && updates.role !== existing.role) {
      const permissionMap: Record<string, string[]> = {
        admin: ['bulk_upload_students', 'schedule_exams', 'export_reports'],
        jury: ['view_assigned_schedule', 'input_real_time_scores', 'add_qualitative_remarks', 'offline_data_sync'],
      };
      updates.permissions = permissionMap[updates.role] || [];
    }

    const updatedUser = await updateUser(id, updates);

    // Keep denormalized jury_name in sync across exams when a jury is renamed.
    let propagatedExams = 0;
    const nameChanged = updates.name && updates.name !== existing.name;
    if (nameChanged && (updatedUser.role === 'jury' || existing.role === 'jury')) {
      propagatedExams = await updateExamsJuryName(id, updatedUser.name);
    }

    const { password: _pw, ...safeUser } = updatedUser;
    return NextResponse.json({ success: true, user: safeUser, propagatedExams });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await getUserById(id);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existing.role === 'superadmin') {
      return NextResponse.json({ error: 'Cannot delete superadmin account' }, { status: 403 });
    }

    // Block deletion if the jury still has assigned exams — otherwise those
    // exams would be left with a dangling jury_id / stale jury_name.
    if (existing.role === 'jury') {
      const assigned = await countExamsByJury(id);
      if (assigned > 0) {
        return NextResponse.json({
          error: `Cannot delete: ${existing.name} is still assigned to ${assigned} exam${assigned === 1 ? '' : 's'}. Reassign them first.`,
          assignedExams: assigned,
        }, { status: 409 });
      }
    }

    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
