-- ============================================================
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Add event_name column to events table (if not already present)
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_name VARCHAR(500);

-- 2. Add created_by_staff_id for record isolation (if not already present)
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by_staff_id UUID REFERENCES staff_users(id) ON DELETE SET NULL;

-- 3. Create staff_users table for JWT authentication
CREATE TABLE IF NOT EXISTS staff_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    register_number VARCHAR(50),
    department VARCHAR(100),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_users_username ON staff_users(username);

-- Enable RLS on staff_users
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- 4. Set security policy (PostgreSQL doesn't support IF NOT EXISTS for policies, so we DROP first)
DROP POLICY IF EXISTS "Service role full access on staff_users" ON staff_users;
CREATE POLICY "Service role full access on staff_users" ON staff_users
    FOR ALL USING (true);

-- 5. Recreate flattened_records view (DROP first to change column structure)
DROP VIEW IF EXISTS flattened_records;
CREATE VIEW flattened_records AS
SELECT
    s.id as student_id,
    s.register_number,
    s.name as student_name,
    s.department,
    e.id as event_id,
    e.event_name,
    e.description as event_description,
    e.from_date,
    e.to_date,
    e.created_by_staff_id,
    ec.id as category_id,
    ec.category,
    ec.custom_category,
    ec.prize_result,
    ec.certificate_url,
    ec.certificate_filename,
    ec.created_at,
    ec.updated_at
FROM
    students s
    INNER JOIN events e ON s.id = e.student_id
    INNER JOIN event_categories ec ON e.id = ec.event_id
ORDER BY
    ec.created_at DESC;
