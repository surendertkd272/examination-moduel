import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// Public endpoint for the login page's "Test Accounts" helper.
// Only exposes accounts whose password is still the default ("admin") —
// once an admin rotates their password, the account disappears from this list,
// so production credentials are never surfaced here.
export async function GET() {
  try {
    const defaultHash = hashPassword('admin');
    const users = await getUsers();

    const testAccounts = users
      .filter(u => u.password === defaultHash && u.status !== 'disabled')
      .map(u => ({
        username: u.username,
        name: u.name,
        role: u.role,
      }))
      .sort((a, b) => {
        const order = { superadmin: 0, admin: 1, jury: 2 } as Record<string, number>;
        return (order[a.role] ?? 9) - (order[b.role] ?? 9) || a.username.localeCompare(b.username);
      });

    return NextResponse.json(
      { accounts: testAccounts, defaultPassword: 'admin' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ accounts: [], defaultPassword: 'admin' });
  }
}
