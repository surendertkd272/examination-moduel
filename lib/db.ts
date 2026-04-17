import { supabase } from './supabase';

export interface DBUser {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'superadmin' | 'admin' | 'jury';
  permissions: string[];
  createdAt: string;
  status: string;
}

export interface DBStudent {
  profile: {
    name: string;
    age: number;
    dob: string;
    school: string;
    class: string;
    unique_id: string;
  };
  background_questionnaire: {
    events_attended: boolean;
    medals_won: boolean;
    objective: string;
    coach_rating: number;
  };
  progression: {
    levels: number[];
    timeline_lock_status: boolean;
    last_exam_date: string;
  };
}

export interface ScoringCategory {
  name: string;
  items: Array<{ name: string; max_score: number }>;
  max_score: number;
}

export interface ScoringTemplate {
  levelName: string;
  passThreshold: number;
  categories: ScoringCategory[];
}

export interface DBExam {
  id: string;
  studentId: string;
  juryId: string;
  juryName: string;
  level: number;
  date: string;
  time: string;
  status: 'Scheduled' | 'In-Progress' | 'Completed';
  totalScore: number | null;
  scores: Record<string, any> | null;
  createdAt: string;
}

// ── Helpers to map DB rows ↔ app types ──────────────────────────────────────

function rowToUser(row: any): DBUser {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    password: row.password,
    role: row.role,
    permissions: row.permissions || [],
    createdAt: row.created_at,
    status: row.status,
  };
}

function rowToStudent(row: any): DBStudent {
  return {
    profile: row.profile,
    background_questionnaire: row.background_questionnaire,
    progression: row.progression,
  };
}

function rowToExam(row: any): DBExam {
  return {
    id: row.id,
    studentId: row.student_id,
    juryId: row.jury_id,
    juryName: row.jury_name,
    level: row.level,
    date: row.date,
    time: row.time,
    status: row.status,
    totalScore: row.total_score ?? null,
    scores: row.scores ?? null,
    createdAt: row.created_at,
  };
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<DBUser[]> {
  const { data, error } = await supabase.from('users').select('*').order('created_at');
  if (error) throw error;
  return (data || []).map(rowToUser);
}

export async function getUserById(id: string): Promise<DBUser | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) return null;
  return rowToUser(data);
}

export async function getUserByUsername(username: string): Promise<DBUser | null> {
  const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
  if (error) return null;
  return rowToUser(data);
}

export async function createUser(user: DBUser): Promise<DBUser> {
  const { data, error } = await supabase.from('users').insert({
    id: user.id,
    name: user.name,
    username: user.username,
    password: user.password,
    role: user.role,
    permissions: user.permissions,
    created_at: user.createdAt,
    status: user.status,
  }).select().single();
  if (error) throw error;
  return rowToUser(data);
}

export async function updateUser(id: string, updates: Partial<DBUser>): Promise<DBUser> {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.username !== undefined) dbUpdates.username = updates.username;
  if (updates.password !== undefined) dbUpdates.password = updates.password;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.permissions !== undefined) dbUpdates.permissions = updates.permissions;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { data, error } = await supabase.from('users').update(dbUpdates).eq('id', id).select().single();
  if (error) throw error;
  return rowToUser(data);
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}

// ── Students ─────────────────────────────────────────────────────────────────

export async function getStudents(): Promise<DBStudent[]> {
  const { data, error } = await supabase.from('students').select('*').order('unique_id');
  if (error) throw error;
  return (data || []).map(rowToStudent);
}

export async function getStudentById(uniqueId: string): Promise<DBStudent | null> {
  const { data, error } = await supabase.from('students').select('*').eq('unique_id', uniqueId).single();
  if (error) return null;
  return rowToStudent(data);
}

export async function createStudent(student: DBStudent): Promise<DBStudent> {
  const { data, error } = await supabase.from('students').insert({
    unique_id: student.profile.unique_id,
    profile: student.profile,
    background_questionnaire: student.background_questionnaire,
    progression: student.progression,
  }).select().single();
  if (error) throw error;
  return rowToStudent(data);
}

export async function upsertStudent(student: DBStudent): Promise<DBStudent> {
  const { data, error } = await supabase.from('students').upsert({
    unique_id: student.profile.unique_id,
    profile: student.profile,
    background_questionnaire: student.background_questionnaire,
    progression: student.progression,
  }).select().single();
  if (error) throw error;
  return rowToStudent(data);
}

export async function updateStudent(uniqueId: string, updates: Partial<DBStudent>): Promise<DBStudent> {
  const dbUpdates: any = {};
  if (updates.profile !== undefined) dbUpdates.profile = updates.profile;
  if (updates.background_questionnaire !== undefined) dbUpdates.background_questionnaire = updates.background_questionnaire;
  if (updates.progression !== undefined) dbUpdates.progression = updates.progression;

  const { data, error } = await supabase.from('students').update(dbUpdates).eq('unique_id', uniqueId).select().single();
  if (error) throw error;
  return rowToStudent(data);
}

export async function deleteStudent(uniqueId: string): Promise<void> {
  const { error } = await supabase.from('students').delete().eq('unique_id', uniqueId);
  if (error) throw error;
}

// ── Exams ────────────────────────────────────────────────────────────────────

export async function getExams(): Promise<DBExam[]> {
  const { data, error } = await supabase.from('exams').select('*').order('created_at');
  if (error) throw error;
  return (data || []).map(rowToExam);
}

export async function getExamsByJury(juryId: string): Promise<DBExam[]> {
  const { data, error } = await supabase.from('exams').select('*').eq('jury_id', juryId).order('created_at');
  if (error) throw error;
  return (data || []).map(rowToExam);
}

export async function getExamById(id: string): Promise<DBExam | null> {
  const { data, error } = await supabase.from('exams').select('*').eq('id', id).single();
  if (error) return null;
  return rowToExam(data);
}

export async function createExam(exam: DBExam): Promise<DBExam> {
  const { data, error } = await supabase.from('exams').insert({
    id: exam.id,
    student_id: exam.studentId,
    jury_id: exam.juryId,
    jury_name: exam.juryName,
    level: exam.level,
    date: exam.date,
    time: exam.time,
    status: exam.status,
    total_score: exam.totalScore,
    scores: exam.scores,
    created_at: exam.createdAt,
  }).select().single();
  if (error) throw error;
  return rowToExam(data);
}

export async function updateExam(id: string, updates: Partial<DBExam>): Promise<DBExam> {
  const dbUpdates: any = {};
  if (updates.juryId !== undefined) dbUpdates.jury_id = updates.juryId;
  if (updates.juryName !== undefined) dbUpdates.jury_name = updates.juryName;
  if (updates.level !== undefined) dbUpdates.level = updates.level;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.time !== undefined) dbUpdates.time = updates.time;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.totalScore !== undefined) dbUpdates.total_score = updates.totalScore;
  if (updates.scores !== undefined) dbUpdates.scores = updates.scores;

  const { data, error } = await supabase.from('exams').update(dbUpdates).eq('id', id).select().single();
  if (error) throw error;
  return rowToExam(data);
}

export async function deleteExam(id: string): Promise<void> {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw error;
}

// Propagate a jury rename to the denormalized jury_name column on every
// exam they're assigned to. Called from the user PUT handler.
export async function updateExamsJuryName(juryId: string, newName: string): Promise<number> {
  const { data, error } = await supabase
    .from('exams')
    .update({ jury_name: newName })
    .eq('jury_id', juryId)
    .select('id');
  if (error) throw error;
  return (data || []).length;
}

export async function countExamsByJury(juryId: string): Promise<number> {
  const { count, error } = await supabase
    .from('exams')
    .select('id', { count: 'exact', head: true })
    .eq('jury_id', juryId);
  if (error) throw error;
  return count || 0;
}

// ── Scoring Templates ─────────────────────────────────────────────────────────

export async function getScoringTemplates(): Promise<Record<string, ScoringTemplate>> {
  const { data, error } = await supabase.from('scoring_templates').select('*');
  if (error) throw error;
  const result: Record<string, ScoringTemplate> = {};
  for (const row of data || []) {
    result[row.level_key] = row.template_data;
  }
  return result;
}

export async function setScoringTemplates(templates: Record<string, ScoringTemplate>): Promise<void> {
  // Delete all and re-insert
  const { error: delError } = await supabase.from('scoring_templates').delete().neq('level_key', '___never___');
  if (delError) throw delError;

  const rows = Object.entries(templates).map(([key, val]) => ({
    level_key: key,
    template_data: val,
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from('scoring_templates').insert(rows);
    if (error) throw error;
  }
}

// ── App Settings (key/value) ──────────────────────────────────────────────────

export interface AppSettingRow {
  key: string;
  value: unknown;
  category: string;
  isPublic: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export async function getAllSettings(): Promise<AppSettingRow[]> {
  const { data, error } = await supabase.from('app_settings').select('*');
  if (error) throw error;
  return (data || []).map(r => ({
    key: r.key,
    value: r.value,
    category: r.category,
    isPublic: r.is_public,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
  }));
}

export async function getPublicSettings(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from('app_settings').select('key, value').eq('is_public', true);
  if (error) throw error;
  const out: Record<string, unknown> = {};
  for (const row of data || []) out[row.key] = row.value;
  return out;
}

export async function upsertSettings(
  entries: { key: string; value: unknown }[],
  updatedBy: string
): Promise<void> {
  if (entries.length === 0) return;
  // Only allow updates to keys that already exist, to keep the schema explicit.
  const { data: existing, error: selErr } = await supabase
    .from('app_settings')
    .select('key')
    .in('key', entries.map(e => e.key));
  if (selErr) throw selErr;
  const allowed = new Set((existing || []).map(r => r.key));

  const updates = entries
    .filter(e => allowed.has(e.key))
    .map(e => ({
      key: e.key,
      value: e.value,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    }));

  for (const u of updates) {
    const { error } = await supabase
      .from('app_settings')
      .update({ value: u.value, updated_at: u.updated_at, updated_by: u.updated_by })
      .eq('key', u.key);
    if (error) throw error;
  }
}
