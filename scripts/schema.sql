-- =============================================
-- Equiwings Exam Module - Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'jury')),
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  unique_id TEXT PRIMARY KEY,
  profile JSONB NOT NULL,
  background_questionnaire JSONB NOT NULL,
  progression JSONB NOT NULL
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(unique_id) ON DELETE CASCADE,
  jury_id TEXT NOT NULL,
  jury_name TEXT NOT NULL,
  level INTEGER NOT NULL,
  date TEXT NOT NULL,
  time TEXT DEFAULT '09:00 AM',
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In-Progress', 'Completed')),
  total_score NUMERIC,
  scores JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scoring templates table
CREATE TABLE IF NOT EXISTS scoring_templates (
  level_key TEXT PRIMARY KEY,
  template_data JSONB NOT NULL
);

-- Disable RLS (app uses its own JWT auth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_templates DISABLE ROW LEVEL SECURITY;
