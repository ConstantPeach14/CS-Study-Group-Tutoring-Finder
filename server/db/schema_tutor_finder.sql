-- Schema for Sprint 4: Tutor Finder

-- 1. tutor_profiles table
CREATE TABLE IF NOT EXISTS tutor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    subjects VARCHAR(255) NOT NULL,
    course_codes VARCHAR(255) NOT NULL,
    qualifications VARCHAR(255),
    availability VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutor_profiles_user_id ON tutor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_course_codes ON tutor_profiles(LOWER(course_codes));

-- 2. tutoring_requests table
CREATE TABLE IF NOT EXISTS tutoring_requests (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_code VARCHAR(50) NOT NULL,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutoring_requests_student ON tutoring_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_tutor ON tutoring_requests(tutor_id);

-- Enforce at most one pending request between a student and a tutor
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_tutoring_request 
ON tutoring_requests(student_id, tutor_id) 
WHERE status = 'pending';
