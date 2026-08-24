-- ============================================
-- CYFQ Database Schema
-- Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'demo',
  provider_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- QUIZZES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ANSWER OPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS answer_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- QUIZ ATTEMPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER,
  total_questions INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- QUIZ ANSWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES answer_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- AUTHENTICATION EVENTS TABLE
-- No password fields - stores only safe metadata
-- ============================================
CREATE TABLE IF NOT EXISTS authentication_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  authentication_method TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'login',
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  safe_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ADMIN AUDIT LOGS TABLE
-- Never stores passwords or tokens
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  safe_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE authentication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile, service role has full access
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Service role full access to users" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Quizzes: public read for active, creator can manage
CREATE POLICY "Anyone can view active quizzes" ON quizzes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access to quizzes" ON quizzes
  FOR ALL USING (auth.role() = 'service_role');

-- Questions: readable if quiz is active
CREATE POLICY "Anyone can view questions of active quizzes" ON questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.is_active = true)
  );

CREATE POLICY "Service role full access to questions" ON questions
  FOR ALL USING (auth.role() = 'service_role');

-- Answer options: readable if quiz is active
CREATE POLICY "Anyone can view answer options" ON answer_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM questions 
      JOIN quizzes ON quizzes.id = questions.quiz_id 
      WHERE questions.id = answer_options.question_id AND quizzes.is_active = true
    )
  );

CREATE POLICY "Service role full access to answer_options" ON answer_options
  FOR ALL USING (auth.role() = 'service_role');

-- Quiz attempts: users can see own attempts
CREATE POLICY "Users can view own attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role full access to quiz_attempts" ON quiz_attempts
  FOR ALL USING (auth.role() = 'service_role');

-- Quiz answers: users can see own answers
CREATE POLICY "Users can view own answers" ON quiz_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = quiz_answers.attempt_id AND auth.uid()::text = quiz_attempts.user_id::text)
  );

CREATE POLICY "Service role full access to quiz_answers" ON quiz_answers
  FOR ALL USING (auth.role() = 'service_role');

-- Auth events: service role only
CREATE POLICY "Service role full access to auth events" ON authentication_events
  FOR ALL USING (auth.role() = 'service_role');

-- Audit logs: service role only
CREATE POLICY "Service role full access to audit logs" ON admin_audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quizzes_creator ON quizzes(creator_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_answer_options_question ON answer_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_user ON authentication_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_created ON authentication_events(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);

-- ============================================
-- SEED DATA for demo purposes
-- ============================================
INSERT INTO users (username, display_name, auth_provider, status, last_login) VALUES
  ('demo_user', 'Demo User', 'CYFQ Demo', 'active', NOW()),
  ('sarah_k', 'Sarah K.', 'OAuth', 'active', NOW() - INTERVAL '2 hours'),
  ('alex_m', 'Alex M.', 'OAuth', 'active', NOW() - INTERVAL '1 day'),
  ('jordan_p', 'Jordan P.', 'CYFQ Demo', 'active', NOW() - INTERVAL '3 days'),
  ('taylor_r', 'Taylor R.', 'OAuth', 'suspended', NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- Seed some quizzes
INSERT INTO quizzes (creator_id, title, description, category) 
SELECT id, 'How Well Do You Know Your Emotions?', 'A quiz to explore your emotional awareness', 'Self-Discovery'
FROM users WHERE username = 'demo_user'
ON CONFLICT DO NOTHING;

INSERT INTO quizzes (creator_id, title, description, category)
SELECT id, 'Friendship Compatibility Quiz', 'Find out how well you connect with your friends', 'Relationships'
FROM users WHERE username = 'sarah_k'
ON CONFLICT DO NOTHING;

INSERT INTO quizzes (creator_id, title, description, category)
SELECT id, 'Stress Management Style', 'Discover your natural stress response patterns', 'Wellness'
FROM users WHERE username = 'alex_m'
ON CONFLICT DO NOTHING;

-- Seed authentication events (no passwords!)
INSERT INTO authentication_events (user_id, authentication_method, event_type, success, safe_metadata)
SELECT id, 'CYFQ Demo', 'login', true, '{"browser": "Chrome 120", "os": "Windows 11"}'::jsonb
FROM users WHERE username = 'demo_user';

INSERT INTO authentication_events (user_id, authentication_method, event_type, success, safe_metadata)
SELECT id, 'OAuth', 'login', true, '{"browser": "Safari 17", "os": "macOS Sonoma"}'::jsonb
FROM users WHERE username = 'sarah_k';

INSERT INTO authentication_events (user_id, authentication_method, event_type, success, safe_metadata)
SELECT id, 'OAuth', 'login', false, '{"browser": "Firefox 121", "os": "Ubuntu 22.04", "reason": "invalid_grant"}'::jsonb
FROM users WHERE username = 'taylor_r';

INSERT INTO authentication_events (user_id, authentication_method, event_type, success, safe_metadata)
SELECT id, 'OAuth', 'login', true, '{"browser": "Chrome 120", "os": "Android 14"}'::jsonb
FROM users WHERE username = 'alex_m';

INSERT INTO authentication_events (user_id, authentication_method, event_type, success, safe_metadata)
SELECT id, 'CYFQ Demo', 'login', true, '{"browser": "Edge 120", "os": "Windows 10"}'::jsonb
FROM users WHERE username = 'jordan_p';

-- ============================================
-- APP SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

-- ============================================
-- CYFQ SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cyfq_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username_1 TEXT NOT NULL,
  username_2 TEXT NOT NULL,
  authentication_method TEXT NOT NULL DEFAULT 'CYFQ Development',
  status TEXT NOT NULL DEFAULT 'Success',
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cyfq_sessions ENABLE ROW LEVEL SECURITY;

-- Settings Policies: Public read, service_role full access
CREATE POLICY "Public read access to app_settings" ON app_settings
  FOR SELECT USING (true);

CREATE POLICY "Service role full access to app_settings" ON app_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Sessions Policies: Public can read own session via API (enforced backend), service_role full access
CREATE POLICY "Service role full access to cyfq_sessions" ON cyfq_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Create initial settings record
INSERT INTO app_settings (setting_key, setting_value) VALUES (
  'login_page_config',
  '{
    "login_title": "Welcome to CYFQ",
    "login_subtitle": "Connect Your Feelings Quiz",
    "username_1_label": "Username 1",
    "username_2_label": "Username 2",
    "username_1_placeholder": "Enter Username 1",
    "username_2_placeholder": "Enter Username 2",
    "login_button_text": "Log In",
    "login_footer_text": "Connect and play quizzes with your friends."
  }'::jsonb
) ON CONFLICT (setting_key) DO NOTHING;
