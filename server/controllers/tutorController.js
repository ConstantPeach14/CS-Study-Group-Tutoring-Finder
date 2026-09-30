const { query } = require('../db/database');

/**
 * GET /api/tutors
 * Public with optionalAuth: returns verified peer tutors and their academic profiles
 * Query params: search / q, course_code, subject
 */
const getAllTutors = async (req, res) => {
  try {
    const currentUserId = req.user?.id || null;
    const { search, q, course_code, subject } = req.query;

    const searchTerm = (search || q || '').trim();
    const courseCodeFilter = (course_code || '').trim();
    const subjectFilter = (subject || '').trim();

    const params = [currentUserId];
    const whereConditions = ["u.role = 'tutor'"];

    // Search filter across tutor name, subjects, course codes, and bio
    if (searchTerm) {
      params.push(`%${searchTerm}%`);
      whereConditions.push(
        `(u.name ILIKE $${params.length} OR u.surname ILIKE $${params.length} OR tp.subjects ILIKE $${params.length} OR tp.course_codes ILIKE $${params.length} OR tp.bio ILIKE $${params.length})`
      );
    }

    // Specific course code filter
    if (courseCodeFilter) {
      params.push(`%${courseCodeFilter}%`);
      whereConditions.push(`tp.course_codes ILIKE $${params.length}`);
    }

    // Specific subject filter
    if (subjectFilter) {
      params.push(`%${subjectFilter}%`);
      whereConditions.push(`tp.subjects ILIKE $${params.length}`);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const sql = `
      SELECT 
        u.id AS tutor_id,
        u.name,
        u.surname,
        u.email,
        u.role,
        u.created_at AS user_created_at,
        tp.id AS profile_id,
        tp.bio,
        tp.subjects,
        tp.course_codes,
        tp.qualifications,
        tp.availability,
        tp.created_at AS profile_created_at,
        tp.updated_at AS profile_updated_at,
        CASE WHEN $1::int IS NOT NULL AND u.id = $1::int THEN true ELSE false END AS is_self
      FROM users u
      LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
      ${whereClause}
      ORDER BY 
        CASE WHEN tp.id IS NOT NULL THEN 0 ELSE 1 END,
        tp.updated_at DESC NULLS LAST,
        u.created_at DESC;
    `;

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      tutors: result.rows,
    });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return res.status(500).json({ error: 'Failed to retrieve tutors list.' });
  }
};

/**
 * GET /api/tutors/:id
 * Public with optionalAuth: returns single tutor profile and optional my_request state
 */
const getTutorById = async (req, res) => {
  try {
    const tutorId = parseInt(req.params.id, 10);
    if (isNaN(tutorId)) {
      return res.status(400).json({ error: 'Invalid tutor ID.' });
    }

    const currentUserId = req.user?.id || null;
    const currentUserRole = req.user?.role || null;

    // Check if user exists and is a tutor
    const userResult = await query(
      `SELECT u.id AS tutor_id, u.name, u.surname, u.email, u.role, u.created_at AS user_created_at,
              tp.id AS profile_id, tp.bio, tp.subjects, tp.course_codes, tp.qualifications, tp.availability,
              tp.created_at AS profile_created_at, tp.updated_at AS profile_updated_at
       FROM users u
       LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
       WHERE u.id = $1 AND u.role = 'tutor'`,
      [tutorId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tutor not found.' });
    }

    const tutor = userResult.rows[0];
    const isSelf = currentUserId === tutorId;

    // If requester is a student, fetch any active/recent tutoring request between them
    let myRequest = null;
    if (currentUserId && currentUserRole === 'student') {
      const requestCheck = await query(
        `SELECT id, course_code, message, status, created_at, updated_at
         FROM tutoring_requests
         WHERE student_id = $1 AND tutor_id = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [currentUserId, tutorId]
      );
      if (requestCheck.rows.length > 0) {
        myRequest = requestCheck.rows[0];
      }
    }

    return res.status(200).json({
      success: true,
      tutor: {
        ...tutor,
        is_self: isSelf,
        my_request: myRequest,
      },
    });
  } catch (error) {
    console.error('Error fetching tutor details:', error);
    return res.status(500).json({ error: 'Failed to retrieve tutor profile.' });
  }
};

/**
 * GET /api/tutors/profile/me (or /api/tutors/me)
 * Protected (tutor role only): returns logged-in tutor's own profile
 */
const getMyTutorProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT u.id AS tutor_id, u.name, u.surname, u.email, u.role, u.created_at AS user_created_at,
              tp.id AS profile_id, tp.bio, tp.subjects, tp.course_codes, tp.qualifications, tp.availability,
              tp.created_at AS profile_created_at, tp.updated_at AS profile_updated_at
       FROM users u
       LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
       WHERE u.id = $1 AND u.role = 'tutor'`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tutor account not found.' });
    }

    return res.status(200).json({
      success: true,
      profile: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching own tutor profile:', error);
    return res.status(500).json({ error: 'Failed to retrieve tutor profile.' });
  }
};

/**
 * PUT /api/tutors/profile/me (or /api/tutors/me)
 * Protected (tutor role only): creates or updates (upserts) the authenticated tutor's profile
 */
const updateMyTutorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, subjects, course_codes, qualifications, availability } = req.body;

    // Validation
    if (!subjects || typeof subjects !== 'string' || !subjects.trim()) {
      return res.status(400).json({ error: 'Subjects/Course areas are required (e.g., Computer Science, Mathematics).' });
    }
    if (subjects.trim().length > 255) {
      return res.status(400).json({ error: 'Subjects cannot exceed 255 characters.' });
    }

    if (!course_codes || typeof course_codes !== 'string' || !course_codes.trim()) {
      return res.status(400).json({ error: 'Course codes are required (e.g., CSC101, MAM100).' });
    }
    if (course_codes.trim().length > 255) {
      return res.status(400).json({ error: 'Course codes cannot exceed 255 characters.' });
    }

    if (!availability || typeof availability !== 'string' || !availability.trim()) {
      return res.status(400).json({ error: 'Availability is required (e.g., Weekdays 14:00 - 18:00, Weekends).' });
    }
    if (availability.trim().length > 255) {
      return res.status(400).json({ error: 'Availability cannot exceed 255 characters.' });
    }

    if (qualifications && qualifications.trim().length > 255) {
      return res.status(400).json({ error: 'Qualifications cannot exceed 255 characters.' });
    }

    if (bio && bio.trim().length > 1000) {
      return res.status(400).json({ error: 'Bio cannot exceed 1000 characters.' });
    }

    const trimmedBio = bio && typeof bio === 'string' ? bio.trim() : null;
    const trimmedSubjects = subjects.trim();
    const trimmedCourseCodes = course_codes.trim().toUpperCase();
    const trimmedQualifications = qualifications && typeof qualifications === 'string' ? qualifications.trim() : null;
    const trimmedAvailability = availability.trim();

    // Upsert query into tutor_profiles
    const upsertSql = `
      INSERT INTO tutor_profiles (user_id, bio, subjects, course_codes, qualifications, availability, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        bio = EXCLUDED.bio,
        subjects = EXCLUDED.subjects,
        course_codes = EXCLUDED.course_codes,
        qualifications = EXCLUDED.qualifications,
        availability = EXCLUDED.availability,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await query(upsertSql, [
      userId,
      trimmedBio,
      trimmedSubjects,
      trimmedCourseCodes,
      trimmedQualifications,
      trimmedAvailability,
    ]);

    // Fetch user details for complete response
    const userResult = await query(
      'SELECT id, name, surname, email, role FROM users WHERE id = $1',
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Tutor profile updated successfully.',
      profile: {
        ...userResult.rows[0],
        ...result.rows[0],
      },
    });
  } catch (error) {
    console.error('Error updating tutor profile:', error);
    return res.status(500).json({ error: 'Failed to update tutor profile.' });
  }
};

module.exports = {
  getAllTutors,
  getTutorById,
  getMyTutorProfile,
  updateMyTutorProfile,
};
