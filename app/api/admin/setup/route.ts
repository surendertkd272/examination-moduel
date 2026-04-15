/**
 * One-time database setup & seed endpoint.
 * POST /api/admin/setup  (no auth required — only usable before DB is initialized)
 *
 * This route:
 *  1. Reads the local data/db.json seed file (bundled in the repo)
 *  2. Inserts all users, students, exams, and scoring templates into Supabase
 *
 * After initial setup, this endpoint becomes a no-op if data already exists.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Security: require a setup token to prevent unauthorized seeding
    const { setupToken } = await request.json().catch(() => ({}));
    const expectedToken = process.env.SETUP_TOKEN || 'equiwings-setup-2026';
    if (setupToken !== expectedToken) {
      return NextResponse.json({ error: 'Invalid setup token' }, { status: 403 });
    }

    // Check if already seeded
    const { data: existingUsers } = await supabase.from('users').select('id').limit(1);
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ message: 'Database already initialized', skipped: true });
    }

    // Read seed data
    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Seed file not found' }, { status: 404 });
    }
    const raw = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

    // Insert users
    if (raw.users?.length) {
      const userRows = raw.users.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        password: u.password,
        role: u.role,
        permissions: u.permissions || [],
        created_at: u.createdAt || new Date().toISOString(),
        status: u.status || 'active',
      }));
      const { error } = await supabase.from('users').insert(userRows);
      if (error) throw new Error(`Users insert failed: ${error.message}`);
    }

    // Insert students
    if (raw.students?.length) {
      const studentRows = raw.students.map((s: any) => {
        // Migrate legacy current_level → levels
        if (s.progression && !Array.isArray(s.progression.levels)) {
          const level = s.progression.current_level || s.progression.levels || 1;
          s.progression.levels = Array.isArray(level) ? level : [level];
          delete s.progression.current_level;
        }
        return {
          unique_id: s.profile.unique_id,
          profile: s.profile,
          background_questionnaire: s.background_questionnaire,
          progression: s.progression,
        };
      });
      const { error } = await supabase.from('students').insert(studentRows);
      if (error) throw new Error(`Students insert failed: ${error.message}`);
    }

    // Insert exams
    if (raw.exams?.length) {
      const examRows = raw.exams.map((e: any) => ({
        id: e.id,
        student_id: e.studentId,
        jury_id: e.juryId,
        jury_name: e.juryName,
        level: e.level,
        date: e.date,
        time: e.time || '09:00 AM',
        status: e.status || 'Scheduled',
        total_score: e.totalScore ?? null,
        scores: e.scores ?? null,
        created_at: e.createdAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from('exams').insert(examRows);
      if (error) throw new Error(`Exams insert failed: ${error.message}`);
    }

    // Insert scoring templates
    if (raw.scoringTemplates) {
      const templateRows = Object.entries(raw.scoringTemplates).map(([key, val]) => ({
        level_key: key,
        template_data: val,
      }));
      if (templateRows.length > 0) {
        const { error } = await supabase.from('scoring_templates').insert(templateRows);
        if (error) throw new Error(`Templates insert failed: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      counts: {
        users: raw.users?.length || 0,
        students: raw.students?.length || 0,
        exams: raw.exams?.length || 0,
        templates: Object.keys(raw.scoringTemplates || {}).length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Setup failed' }, { status: 500 });
  }
}
