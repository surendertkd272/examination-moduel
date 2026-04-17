import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getUserByUsername, updateUser } from '@/lib/db';
import { verifyToken, verifyPassword } from '@/lib/auth';

// Lets the currently-authenticated user (including superadmin) rename their
// own username/login id. Requires the current password as a second factor so
// a hijacked session alone cannot lock the real owner out.
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { newUsername, currentPassword } = await request.json();
    const next = typeof newUsername === 'string' ? newUsername.trim() : '';

    if (!next) return NextResponse.json({ error: 'New username is required' }, { status: 400 });
    if (next.length < 3) return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    if (!/^[a-zA-Z0-9_.@-]+$/.test(next)) {
      return NextResponse.json({ error: 'Username may only contain letters, numbers, and . _ - @' }, { status: 400 });
    }
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }

    const me = await getUserById(payload.userId);
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!verifyPassword(currentPassword, me.password)) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    if (next === me.username) {
      return NextResponse.json({ success: true, user: { id: me.id, username: me.username, name: me.name, role: me.role } });
    }

    const clash = await getUserByUsername(next);
    if (clash && clash.id !== me.id) {
      return NextResponse.json({ error: 'That username is already taken' }, { status: 409 });
    }

    const updated = await updateUser(payload.userId, { username: next });
    return NextResponse.json({
      success: true,
      user: { id: updated.id, username: updated.username, name: updated.name, role: updated.role },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
