import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, getPublicSettings, upsertSettings } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/settings
//   - No auth: returns only is_public=true settings (so the login page can
//     read maintenance_mode before the user signs in).
//   - Superadmin: returns the full settings map.
//   - Anyone authenticated but not superadmin: returns public settings only.
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (payload?.role === 'superadmin') {
      const rows = await getAllSettings();
      const settings: Record<string, unknown> = {};
      for (const r of rows) settings[r.key] = r.value;
      return NextResponse.json(
        { settings, meta: rows.map(r => ({ key: r.key, category: r.category, isPublic: r.isPublic, updatedAt: r.updatedAt, updatedBy: r.updatedBy })) },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const settings = await getPublicSettings();
    return NextResponse.json({ settings }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ settings: {} });
  }
}

// PUT /api/settings
// Body: { updates: { [key]: value } }
// Superadmin only. Only pre-seeded keys can be updated (no dynamic key creation).
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { updates } = await request.json();
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'updates object required' }, { status: 400 });
    }

    const entries = Object.entries(updates).map(([key, value]) => ({ key, value }));
    await upsertSettings(entries, payload.userId);

    const rows = await getAllSettings();
    const settings: Record<string, unknown> = {};
    for (const r of rows) settings[r.key] = r.value;
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
