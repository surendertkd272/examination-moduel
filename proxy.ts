import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'equiwings-jwt-secret-key-2026-production'
);

async function getTokenPayload(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; role: string; name: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip API routes — they handle their own auth
  if (path.startsWith('/api')) {
    return NextResponse.next();
  }

  const payload = await getTokenPayload(request);
  const role = payload?.role;

  // Admin interface has been removed — redirect to login
  if (path.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect superadmin paths
  if (path.startsWith('/superadmin') && role !== 'superadmin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect jury paths — allow both jury and superadmin
  if (path.startsWith('/jury') && role !== 'jury' && role !== 'superadmin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access login page, redirect to dashboard
  // Use startsWith to handle /login and /login?msg=... paths
  if (path === '/login' && role) {
    // Check for query params to prevent redirect loops
    const hasMsg = request.nextUrl.searchParams.has('msg');
    if (hasMsg) {
      // Already at login with a message — just show the login page
      return NextResponse.next();
    }

    if (role === 'superadmin') return NextResponse.redirect(new URL('/superadmin', request.url));
    if (role === 'jury') return NextResponse.redirect(new URL('/jury', request.url));
    // Admin users: show login page (no redirect loop)
    if (role === 'admin') return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/superadmin/:path*', '/admin/:path*', '/jury/:path*', '/login'],
};
