const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/database');

// Simple regex for basic email format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, surname, email, password, confirmPassword, role } = req.body;

    // 1. Validate required fields
    if (!name || !surname || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const trimmedName = name.trim();
    const trimmedSurname = surname.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedSurname) {
      return res.status(400).json({ error: 'Name and surname cannot be empty.' });
    }

    // 2. Validate email format
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // 3. Validate role
    if (!['student', 'tutor'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "student" or "tutor".' });
    }

    // 4. Validate password length and match
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // 5. Check whether email already exists
    const existingUser = await query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // 6. Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 7. Insert new user into the existing users table
    const insertResult = await query(
      `INSERT INTO users (name, surname, email, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, surname, email, role, created_at`,
      [trimmedName, trimmedSurname, normalizedEmail, hashedPassword, role]
    );

    const newUser = insertResult.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.',
      user: {
        id: newUser.id,
        name: newUser.name,
        surname: newUser.surname,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'An unexpected server error occurred during registration.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input presence
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Find user by email
    const userResult = await query(
      'SELECT id, name, surname, email, password, role, created_at FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];

    // 3. Compare supplied password with bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 4. Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'cs_study_tutoring_finder_secure_jwt_secret_key_2026!';

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 5. Return token and user info without password
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An unexpected server error occurred during login.' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Server error during logout.' });
  }
};

module.exports = {
  register,
  login,
  logout,
};
