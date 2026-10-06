const { query } = require('../db/database');

/**
 * 1. GET /api/modules
 * Public listing with search, filtering, and aggregate counts
 */
const getAllModules = async (req, res) => {
  try {
    const { q, search, faculty } = req.query;
    const searchTerm = (q || search || '').trim();
    const currentUserId = req.user ? req.user.id : null;

    let sql = `
      SELECT 
        m.id,
        m.code,
        m.name,
        m.faculty,
        m.description,
        m.created_at,
        COUNT(DISTINCT CASE WHEN um.role = 'student' THEN um.user_id END)::int AS student_count,
        COUNT(DISTINCT CASE WHEN um.role = 'tutor' THEN um.user_id END)::int AS tutor_count,
        COUNT(DISTINCT sg.id)::int AS group_count
    `;

    const params = [];

    if (currentUserId) {
      params.push(currentUserId);
      sql += `,
        EXISTS (
          SELECT 1 FROM user_modules um_cur 
          WHERE um_cur.module_id = m.id AND um_cur.user_id = $${params.length}
        ) AS is_enrolled
      `;
    } else {
      sql += `, false AS is_enrolled`;
    }

    sql += `
      FROM modules m
      LEFT JOIN user_modules um ON m.id = um.module_id
      LEFT JOIN study_groups sg ON LOWER(sg.course_code) = LOWER(m.code)
    `;

    const whereClauses = [];

    if (searchTerm) {
      params.push(`%${searchTerm}%`);
      const pIdx = params.length;
      whereClauses.push(`(m.code ILIKE $${pIdx} OR m.name ILIKE $${pIdx} OR m.description ILIKE $${pIdx})`);
    }

    if (faculty && faculty.trim() !== '' && faculty.toLowerCase() !== 'all') {
      params.push(faculty.trim());
      whereClauses.push(`m.faculty ILIKE $${params.length}`);
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ` + whereClauses.join(' AND ');
    }

    sql += `
      GROUP BY m.id, m.code, m.name, m.faculty, m.description, m.created_at
      ORDER BY m.code ASC;
    `;

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      modules: result.rows,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return res.status(500).json({ error: 'Failed to retrieve modules.' });
  }
};

/**
 * 2. GET /api/modules/:id
 * Retrieve single module with associated active study groups and tutors
 */
const getModuleById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const currentUserId = req.user ? req.user.id : null;

    let moduleResult;
    if (!isNaN(identifier)) {
      moduleResult = await query('SELECT * FROM modules WHERE id = $1', [parseInt(identifier, 10)]);
    } else {
      moduleResult = await query('SELECT * FROM modules WHERE LOWER(code) = LOWER($1)', [identifier]);
    }

    if (moduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    const mod = moduleResult.rows[0];

    // Check user enrollment
    let isEnrolled = false;
    let enrollmentRole = null;
    if (currentUserId) {
      const enrollCheck = await query(
        'SELECT role FROM user_modules WHERE module_id = $1 AND user_id = $2',
        [mod.id, currentUserId]
      );
      if (enrollCheck.rows.length > 0) {
        isEnrolled = true;
        enrollRole = enrollCheck.rows[0].role;
      }
    }

    // Fetch active study groups for this module
    const groupsResult = await query(
      `SELECT 
        sg.id, sg.title, sg.course_code, sg.description, sg.location, 
        sg.meeting_schedule, sg.max_members, sg.created_at,
        u.id AS creator_id, u.name AS creator_name, u.surname AS creator_surname,
        COUNT(DISTINCT sgm.user_id)::int AS member_count,
        (COUNT(DISTINCT sgm.user_id) >= sg.max_members) AS is_full
      FROM study_groups sg
      JOIN users u ON sg.created_by = u.id
      LEFT JOIN study_group_members sgm ON sg.id = sgm.study_group_id
      WHERE LOWER(sg.course_code) = LOWER($1)
      GROUP BY sg.id, u.id
      ORDER BY sg.created_at DESC`,
      [mod.code]
    );

    // Fetch verified tutors for this module (both enrolled in user_modules and tutor_profiles course_codes)
    const tutorsResult = await query(
      `SELECT 
        u.id, u.name, u.surname, u.email, u.role,
        tp.bio, tp.subjects, tp.course_codes, tp.qualifications, tp.availability
      FROM users u
      JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'tutor' 
        AND (
          EXISTS (
            SELECT 1 FROM user_modules um 
            WHERE um.user_id = u.id AND um.module_id = $1 AND um.role = 'tutor'
          )
          OR tp.course_codes ILIKE $2
          OR tp.subjects ILIKE $3
        )
      ORDER BY u.name ASC`,
      [mod.id, `%${mod.code}%`, `%${mod.name}%`]
    );

    // Fetch enrollment counts
    const countsResult = await query(
      `SELECT 
        COUNT(CASE WHEN role = 'student' THEN 1 END)::int AS student_count,
        COUNT(CASE WHEN role = 'tutor' THEN 1 END)::int AS tutor_count
      FROM user_modules
      WHERE module_id = $1`,
      [mod.id]
    );

    return res.status(200).json({
      success: true,
      module: {
        ...mod,
        student_count: countsResult.rows[0]?.student_count || 0,
        tutor_count: tutorsResult.rows.length,
        group_count: groupsResult.rows.length,
        is_enrolled: isEnrolled,
        user_role: enrollmentRole,
      },
      study_groups: groupsResult.rows,
      tutors: tutorsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching module details:', error);
    return res.status(500).json({ error: 'Failed to retrieve module details.' });
  }
};

/**
 * 3. POST /api/modules/enroll
 * Student or Tutor enrolls in a course module
 */
const enrollModule = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || 'student';
    const { module_id, code } = req.body;

    if (!module_id && !code) {
      return res.status(400).json({ error: 'Please provide either module_id or course code.' });
    }

    let modResult;
    if (module_id) {
      modResult = await query('SELECT * FROM modules WHERE id = $1', [module_id]);
    } else {
      modResult = await query('SELECT * FROM modules WHERE LOWER(code) = LOWER($1)', [code]);
    }

    if (modResult.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    const mod = modResult.rows[0];

    // Check if already enrolled
    const checkResult = await query(
      'SELECT id, role FROM user_modules WHERE user_id = $1 AND module_id = $2',
      [userId, mod.id]
    );

    if (checkResult.rows.length > 0) {
      return res.status(200).json({
        success: true,
        already_enrolled: true,
        message: 'You are already enrolled in this module.',
        module: mod,
      });
    }

    // Insert enrollment
    const insertResult = await query(
      `INSERT INTO user_modules (user_id, module_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, mod.id, userRole]
    );

    return res.status(201).json({
      success: true,
      message: 'Successfully enrolled in module.',
      enrollment: insertResult.rows[0],
      module: mod,
    });
  } catch (error) {
    console.error('Error enrolling in module:', error);
    return res.status(500).json({ error: 'Failed to enroll in module.' });
  }
};

/**
 * 4. POST /api/modules/unenroll
 * Unenroll user from a module
 */
const unenrollModule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { module_id, code } = req.body;

    if (!module_id && !code) {
      return res.status(400).json({ error: 'Please provide either module_id or course code.' });
    }

    let targetModuleId = module_id;
    if (!targetModuleId && code) {
      const modResult = await query('SELECT id FROM modules WHERE LOWER(code) = LOWER($1)', [code]);
      if (modResult.rows.length === 0) {
        return res.status(404).json({ error: 'Module not found.' });
      }
      targetModuleId = modResult.rows[0].id;
    }

    const deleteResult = await query(
      'DELETE FROM user_modules WHERE user_id = $1 AND module_id = $2 RETURNING *',
      [userId, targetModuleId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'You are not enrolled in this module.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully unenrolled from module.',
    });
  } catch (error) {
    console.error('Error unenrolling from module:', error);
    return res.status(500).json({ error: 'Failed to unenroll from module.' });
  }
};

/**
 * 5. POST /api/tutors/modules
 * Tutor registers a module they are qualified to teach
 */
const tutorRegisterModule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { module_id, code } = req.body;

    if (!module_id && !code) {
      return res.status(400).json({ error: 'Please provide either module_id or course code.' });
    }

    let modResult;
    if (module_id) {
      modResult = await query('SELECT * FROM modules WHERE id = $1', [module_id]);
    } else {
      modResult = await query('SELECT * FROM modules WHERE LOWER(code) = LOWER($1)', [code]);
    }

    if (modResult.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    const mod = modResult.rows[0];

    // Enroll as tutor in user_modules
    await query(
      `INSERT INTO user_modules (user_id, module_id, role)
       VALUES ($1, $2, 'tutor')
       ON CONFLICT (user_id, module_id) 
       DO UPDATE SET role = 'tutor'`,
      [userId, mod.id]
    );

    // Keep tutor_profiles course_codes synchronized if profile exists
    const profileResult = await query('SELECT course_codes FROM tutor_profiles WHERE user_id = $1', [userId]);
    if (profileResult.rows.length > 0) {
      const currentCodes = (profileResult.rows[0].course_codes || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      if (!currentCodes.map((c) => c.toUpperCase()).includes(mod.code.toUpperCase())) {
        currentCodes.push(mod.code);
        await query(
          'UPDATE tutor_profiles SET course_codes = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
          [currentCodes.join(', '), userId]
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully registered ${mod.code} as a tutoring module.`,
      module: mod,
    });
  } catch (error) {
    console.error('Error registering tutor module:', error);
    return res.status(500).json({ error: 'Failed to register tutoring module.' });
  }
};

/**
 * 6. GET /api/users/me/modules or /api/modules/user/my
 * List current user's enrolled / teaching modules
 */
const getMyModules = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        m.id,
        m.code,
        m.name,
        m.faculty,
        m.description,
        um.role AS enrollment_role,
        um.created_at AS enrolled_at,
        COUNT(DISTINCT sg.id)::int AS active_group_count
      FROM user_modules um
      JOIN modules m ON um.module_id = m.id
      LEFT JOIN study_groups sg ON LOWER(sg.course_code) = LOWER(m.code)
      WHERE um.user_id = $1
      GROUP BY m.id, m.code, m.name, m.faculty, m.description, um.role, um.created_at
      ORDER BY m.code ASC;
    `;

    const result = await query(sql, [userId]);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      modules: result.rows,
    });
  } catch (error) {
    console.error('Error fetching user modules:', error);
    return res.status(500).json({ error: 'Failed to retrieve your modules.' });
  }
};

module.exports = {
  getAllModules,
  getModuleById,
  enrollModule,
  unenrollModule,
  tutorRegisterModule,
  getMyModules,
};
