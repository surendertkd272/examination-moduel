import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/db';
import { verifyToken, verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'New password must be at least 4 characters' }, { status: 400 });
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!verifyPassword(currentPassword, user.password)) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    await updateUser(payload.userId, { password: hashPassword(newPassword) });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
