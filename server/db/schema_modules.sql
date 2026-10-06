-- Phase 6 — Module & Academic Course Directory Schema
-- Preserves existing tables untouched.

-- 1. MODULES TABLE
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    faculty VARCHAR(100) NOT NULL DEFAULT 'Computer Science & STEM',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER MODULES ENROLLMENT TABLE
CREATE TABLE IF NOT EXISTS user_modules (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    module_id INT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'tutor')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_modules_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_modules_module
        FOREIGN KEY (module_id)
        REFERENCES modules(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_user_module
        UNIQUE (user_id, module_id)
);

-- 3. INDEXES FOR PERFORMANCE AND SEARCHING
CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(LOWER(code));
CREATE INDEX IF NOT EXISTS idx_modules_name ON modules(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_modules_faculty ON modules(faculty);
CREATE INDEX IF NOT EXISTS idx_user_modules_user_id ON user_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_modules_module_id ON user_modules(module_id);
