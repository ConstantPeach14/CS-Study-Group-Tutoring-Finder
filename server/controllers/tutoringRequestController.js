const { query } = require('../db/database');

/**
 * POST /api/tutoring-requests
 * Protected (student role): student submits a tutoring request to a tutor
 */
const createRequest = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { tutor_id, course_code, message } = req.body;

    const parsedTutorId = parseInt(tutor_id, 10);
    if (!parsedTutorId || isNaN(parsedTutorId)) {
      return res.status(400).json({ error: 'Valid tutor ID is required.' });
    }

    if (studentId === parsedTutorId) {
      return res.status(400).json({ error: 'You cannot request tutoring from yourself.' });
    }

    // Verify tutor exists and has role 'tutor'
    const tutorCheck = await query(
      "SELECT id, name, surname, email, role FROM users WHERE id = $1 AND role = 'tutor'",
      [parsedTutorId]
    );

    if (tutorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tutor not found.' });
    }

    if (!course_code || typeof course_code !== 'string' || course_code.trim().length < 2) {
      return res.status(400).json({ error: 'Course code is required (e.g., CSC101).' });
    }
    if (course_code.trim().length > 50) {
      return res.status(400).json({ error: 'Course code cannot exceed 50 characters.' });
    }

    if (message && message.trim().length > 1000) {
      return res.status(400).json({ error: 'Message cannot exceed 1000 characters.' });
    }

    // Check for existing pending request with same tutor
    const existingCheck = await query(
      "SELECT id FROM tutoring_requests WHERE student_id = $1 AND tutor_id = $2 AND status = 'pending'",
      [studentId, parsedTutorId]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'You already have a pending request with this tutor.' });
    }

    const trimmedCourseCode = course_code.trim().toUpperCase();
    const trimmedMessage = message && typeof message === 'string' ? message.trim() : null;

    const insertSql = `
      INSERT INTO tutoring_requests (student_id, tutor_id, course_code, message, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *;
    `;

    const result = await query(insertSql, [
      studentId,
      parsedTutorId,
      trimmedCourseCode,
      trimmedMessage,
    ]);

    const tutor = tutorCheck.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Tutoring request submitted successfully.',
      request: {
        ...result.rows[0],
        tutor_name: tutor.name,
        tutor_surname: tutor.surname,
        tutor_email: tutor.email,
      },
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'You already have a pending request with this tutor.' });
    }
    console.error('Error creating tutoring request:', error);
    return res.status(500).json({ error: 'Failed to submit tutoring request.' });
  }
};

/**
 * GET /api/tutoring-requests/my
 * Protected (student role): student views all requests they have submitted
 */
const getMyRequests = async (req, res) => {
  try {
    const studentId = req.user.id;

    const sql = `
      SELECT 
        tr.id,
        tr.student_id,
        tr.tutor_id,
        tr.course_code,
        tr.message,
        tr.status,
        tr.created_at,
        tr.updated_at,
        u.name AS tutor_name,
        u.surname AS tutor_surname,
        u.email AS tutor_email,
        tp.subjects AS tutor_subjects,
        tp.qualifications AS tutor_qualifications,
        tp.availability AS tutor_availability
      FROM tutoring_requests tr
      JOIN users u ON tr.tutor_id = u.id
      LEFT JOIN tutor_profiles tp ON tr.tutor_id = tp.user_id
      WHERE tr.student_id = $1
      ORDER BY tr.created_at DESC;
    `;

    const result = await query(sql, [studentId]);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      requests: result.rows,
    });
  } catch (error) {
    console.error('Error fetching student tutoring requests:', error);
    return res.status(500).json({ error: 'Failed to retrieve your tutoring requests.' });
  }
};

/**
 * GET /api/tutoring-requests/received
 * Protected (tutor role): tutor views all requests directed to them
 */
const getReceivedRequests = async (req, res) => {
  try {
    const tutorId = req.user.id;

    const sql = `
      SELECT 
        tr.id,
        tr.student_id,
        tr.tutor_id,
        tr.course_code,
        tr.message,
        tr.status,
        tr.created_at,
        tr.updated_at,
        u.name AS student_name,
        u.surname AS student_surname,
        u.email AS student_email
      FROM tutoring_requests tr
      JOIN users u ON tr.student_id = u.id
      WHERE tr.tutor_id = $1
      ORDER BY 
        CASE WHEN tr.status = 'pending' THEN 0 ELSE 1 END,
        tr.created_at DESC;
    `;

    const result = await query(sql, [tutorId]);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      requests: result.rows,
    });
  } catch (error) {
    console.error('Error fetching tutor received requests:', error);
    return res.status(500).json({ error: 'Failed to retrieve received tutoring requests.' });
  }
};

/**
 * PATCH /api/tutoring-requests/:id
 * Protected: update request status
 * - Tutors can accept or decline requests sent to them
 * - Students can cancel their own pending requests
 */
const updateRequestStatus = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid tutoring request ID.' });
    }

    const userId = req.user.id;
    const userRole = req.user.role;
    const { status } = req.body;

    const allowedStatuses = ['accepted', 'declined', 'cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    // Find the request
    const checkResult = await query(
      'SELECT id, student_id, tutor_id, status FROM tutoring_requests WHERE id = $1',
      [requestId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tutoring request not found.' });
    }

    const currentRequest = checkResult.rows[0];

    // Role-specific authorization
    if (userRole === 'tutor') {
      if (currentRequest.tutor_id !== userId) {
        return res.status(403).json({ error: 'Access denied. You can only respond to requests sent to you.' });
      }
      if (status !== 'accepted' && status !== 'declined') {
        return res.status(400).json({ error: 'Tutors can only accept or decline requests.' });
      }
    } else if (userRole === 'student') {
      if (currentRequest.student_id !== userId) {
        return res.status(403).json({ error: 'Access denied. You can only manage your own requests.' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ error: 'Students cannot accept or decline requests. You may only cancel.' });
      }
    } else {
      return res.status(403).json({ error: 'Unauthorized role.' });
    }

    // Update status
    const updateSql = `
      UPDATE tutoring_requests
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;

    const updatedResult = await query(updateSql, [status, requestId]);

    return res.status(200).json({
      success: true,
      message: `Tutoring request marked as ${status}.`,
      request: updatedResult.rows[0],
    });
  } catch (error) {
    console.error('Error updating tutoring request:', error);
    return res.status(500).json({ error: 'Failed to update tutoring request status.' });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getReceivedRequests,
  updateRequestStatus,
};
