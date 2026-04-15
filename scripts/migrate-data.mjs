/**
 * One-time data migration script.
 * Reads data/db.json and inserts everything into Supabase.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<your_key> node scripts/migrate-data.mjs
 *
 * Or if you only have the publishable key (anon key) after disabling RLS:
 *   node scripts/migrate-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SUPABASE_URL = 'https://zlnywbpqzfxfluhuslob.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_XHxM2j-Vynvlykc-pyW2YQ_B022wJ34';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('Reading db.json...');
  const raw = JSON.parse(readFileSync(join(ROOT, 'data', 'db.json'), 'utf-8'));

  // Migrate users
  if (raw.users?.length) {
    console.log(`Inserting ${raw.users.length} users...`);
    const { error } = await supabase.from('users').upsert(
      raw.users.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        password: u.password,
        role: u.role,
        permissions: u.permissions || [],
        created_at: u.createdAt || new Date().toISOString(),
        status: u.status || 'active',
      })),
      { onConflict: 'id' }
    );
    if (error) console.error('  Users error:', error.message);
    else console.log('  Users: OK');
  }

  // Migrate students
  if (raw.students?.length) {
    console.log(`Inserting ${raw.students.length} students...`);
    const studentRows = raw.students.map(s => {
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
    const { error } = await supabase.from('students').upsert(studentRows, { onConflict: 'unique_id' });
    if (error) console.error('  Students error:', error.message);
    else console.log('  Students: OK');
  }

  // Migrate exams
  if (raw.exams?.length) {
    console.log(`Inserting ${raw.exams.length} exams...`);
    const { error } = await supabase.from('exams').upsert(
      raw.exams.map(e => ({
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
      })),
      { onConflict: 'id' }
    );
    if (error) console.error('  Exams error:', error.message);
    else console.log('  Exams: OK');
  }

  // Migrate scoring templates
  if (raw.scoringTemplates) {
    const rows = Object.entries(raw.scoringTemplates).map(([key, val]) => ({
      level_key: key,
      template_data: val,
    }));
    if (rows.length > 0) {
      console.log(`Inserting ${rows.length} scoring templates...`);
      const { error } = await supabase.from('scoring_templates').upsert(rows, { onConflict: 'level_key' });
      if (error) console.error('  Templates error:', error.message);
      else console.log('  Templates: OK');
    }
  }

  console.log('\nMigration complete!');
}

main().catch(console.error);
