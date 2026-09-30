-- Phase 3 — Sprint 3: Study Groups Schema
-- Preserves existing users table untouched.

-- 1. STUDY GROUPS TABLE
CREATE TABLE IF NOT EXISTS study_groups (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    description TEXT,
    meeting_schedule VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    max_members INT NOT NULL DEFAULT 10,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_study_groups_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES users(id) 
        ON DELETE CASCADE,

    CONSTRAINT chk_study_groups_max_members 
        CHECK (max_members >= 2)
);

-- 2. STUDY GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS study_group_members (
    id SERIAL PRIMARY KEY,
    study_group_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_members_study_group 
        FOREIGN KEY (study_group_id) 
        REFERENCES study_groups(id) 
        ON DELETE CASCADE,

    CONSTRAINT fk_members_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,

    CONSTRAINT uq_study_group_user_membership 
        UNIQUE (study_group_id, user_id)
);

-- 3. INDEXES FOR PERFORMANCE AND SEARCHING
CREATE INDEX IF NOT EXISTS idx_study_groups_course_code ON study_groups(LOWER(course_code));
CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON study_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group_id ON study_group_members(study_group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user_id ON study_group_members(user_id);

-- 4. TRIGGER FUNCTION TO AUTO-UPDATE updated_at TIMESTAMP
CREATE OR REPLACE FUNCTION update_study_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_study_groups_updated_at ON study_groups;
CREATE TRIGGER trg_study_groups_updated_at
BEFORE UPDATE ON study_groups
FOR EACH ROW
EXECUTE FUNCTION update_study_groups_updated_at();
