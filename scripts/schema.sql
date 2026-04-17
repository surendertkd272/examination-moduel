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

-- App settings — key/value store for global configuration.
-- Keys are namespaced: "general.*", "security.*", "localization.*", "integrations.*".
-- Values are JSONB so a setting can hold a string, number, boolean, or object.
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS app_settings_category_idx ON app_settings (category);

-- Seed defaults (no-op if already present)
INSERT INTO app_settings (key, value, category, is_public) VALUES
  ('general.default_school', '"The Hyderabad Public School"', 'general', true),
  ('general.default_pass_threshold', '70', 'general', true),
  ('general.maintenance_mode', 'false', 'general', true),
  ('general.maintenance_message', '"The system is undergoing scheduled maintenance. Please check back shortly."', 'general', true),
  ('localization.timezone', '"Asia/Kolkata"', 'localization', true),
  ('localization.date_format', '"YYYY-MM-DD"', 'localization', true),
  ('security.session_timeout_hours', '24', 'security', false),
  ('security.min_password_length', '4', 'security', false),
  ('integrations.notifications_enabled', 'false', 'integrations', false)
ON CONFLICT (key) DO NOTHING;

-- Disable RLS (app uses its own JWT auth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
