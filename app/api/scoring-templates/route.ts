import { NextRequest, NextResponse } from 'next/server';
import { getScoringTemplates, setScoringTemplates } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const templates = await getScoringTemplates();
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { templates } = await request.json();
    if (!templates || typeof templates !== 'object') {
      return NextResponse.json({ error: 'Templates data is required' }, { status: 400 });
    }

    await setScoringTemplates(templates);
    const saved = await getScoringTemplates();
    return NextResponse.json({ success: true, templates: saved });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
