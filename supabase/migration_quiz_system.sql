-- ============================================
-- CYFQ Migration: Quiz System Update
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add share_token to quizzes if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'share_token') THEN
    ALTER TABLE quizzes ADD COLUMN share_token TEXT UNIQUE;
  END IF;
END $$;

-- 2. Update quizzes.creator_id to reference cyfq_sessions instead of users
-- First drop the old foreign key constraint if it exists
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT constraint_name INTO fk_name
  FROM information_schema.table_constraints
  WHERE table_name = 'quizzes' AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%creator_id%';
  
  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE quizzes DROP CONSTRAINT ' || fk_name;
  END IF;
END $$;

-- Drop any remaining FK on creator_id referencing users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'quizzes' AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.column_name = 'creator_id'
  ) LOOP
    EXECUTE 'ALTER TABLE quizzes DROP CONSTRAINT ' || r.constraint_name;
  END LOOP;
END $$;

-- Add new FK to cyfq_sessions (will only work if creator_id values are NULL or valid cyfq_sessions IDs)
-- For existing seed data rows that reference users, set creator_id to NULL first
UPDATE quizzes SET creator_id = NULL WHERE creator_id IS NOT NULL 
  AND creator_id NOT IN (SELECT id FROM cyfq_sessions);

ALTER TABLE quizzes ADD CONSTRAINT quizzes_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES cyfq_sessions(id) ON DELETE SET NULL;

-- 3. Migrate quiz_attempts: rename user_id to session_id, add percentage
DO $$ 
BEGIN
  -- Rename user_id to session_id if user_id exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_attempts' AND column_name = 'user_id') THEN
    -- Drop old FK on user_id
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'quiz_attempts' AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
      ) LOOP
        EXECUTE 'ALTER TABLE quiz_attempts DROP CONSTRAINT ' || r.constraint_name;
      END LOOP;
    END;
    
    ALTER TABLE quiz_attempts RENAME COLUMN user_id TO session_id;
    
    -- Clear invalid references
    UPDATE quiz_attempts SET session_id = NULL WHERE session_id IS NOT NULL
      AND session_id NOT IN (SELECT id FROM cyfq_sessions);
      
    -- Make it NOT NULL after cleanup (delete orphaned rows)
    DELETE FROM quiz_attempts WHERE session_id IS NULL;
    
    ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_session_id_fkey 
      FOREIGN KEY (session_id) REFERENCES cyfq_sessions(id) ON DELETE CASCADE;
  END IF;
  
  -- Add percentage column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_attempts' AND column_name = 'percentage') THEN
    ALTER TABLE quiz_attempts ADD COLUMN percentage INTEGER;
  END IF;
END $$;

-- 4. Update indexes
DROP INDEX IF EXISTS idx_quiz_attempts_user;
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session ON quiz_attempts(session_id);

-- 5. Drop and recreate affected RLS policies
DROP POLICY IF EXISTS "Users can view own attempts" ON quiz_attempts;
CREATE POLICY "Users can view own attempts" ON quiz_attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cyfq_sessions WHERE cyfq_sessions.id = quiz_attempts.session_id)
  );

DROP POLICY IF EXISTS "Users can view own answers" ON quiz_answers;
CREATE POLICY "Users can view own answers" ON quiz_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = quiz_answers.attempt_id)
  );

-- Done!
SELECT 'Migration completed successfully!' AS status;
