import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getUserByUsername, createUser } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allUsers = await getUsers();
    const users = allUsers.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      permissions: u.permissions,
      createdAt: u.createdAt,
      status: u.status,
    }));

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, username, role, password } = await request.json();

    if (!name || !username || !role || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!['admin', 'jury'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check for duplicate username
    const existing = await getUserByUsername(username);
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const permissionMap: Record<string, string[]> = {
      admin: ['bulk_upload_students', 'schedule_exams', 'generate_certificates', 'export_reports'],
      jury: ['view_assigned_schedule', 'input_real_time_scores', 'add_qualitative_remarks', 'offline_data_sync'],
    };

    const newUser = await createUser({
      id: `u-${Date.now()}`,
      name,
      username,
      password: hashPassword(password),
      role: role as 'admin' | 'jury',
      permissions: permissionMap[role] || [],
      createdAt: new Date().toISOString(),
      status: 'active',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        createdAt: newUser.createdAt,
        status: newUser.status,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
