-- ============================================================
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- WARNING: This script DROPS tables and deletes all data.
-- ============================================================

-- Drop old data and schema for the add-record flow
DROP VIEW IF EXISTS flattened_records;
DROP TABLE IF EXISTS event_categories CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Students
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_register_number ON students(register_number);

-- Events (one per participation entry)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    event_name VARCHAR(500),
    participation_description TEXT,
    awarding_agency TEXT,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    created_by_staff_id UUID REFERENCES staff_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_student_id ON events(student_id);

-- Event categories (stores category + optional sub-activity in custom_category)
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    custom_category VARCHAR(500),
    prize_result VARCHAR(100),
    certificate_url TEXT,
    certificate_filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE event_categories ADD CONSTRAINT event_categories_category_check
    CHECK (category IN ('Curricular', 'Co-Curricular', 'Extra-Curricular'));

CREATE INDEX idx_event_categories_event_id ON event_categories(event_id);

-- Recreate flattened_records view
CREATE VIEW flattened_records AS
SELECT
    s.id as student_id,
    s.register_number,
    s.name as student_name,
    s.department,
    e.id as event_id,
    e.event_name,
    e.participation_description,
    e.awarding_agency,
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
