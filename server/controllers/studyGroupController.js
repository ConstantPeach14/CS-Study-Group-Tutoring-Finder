const { pool, query } = require('../db/database');

/**
 * GET /api/study-groups
 * Optional auth: returns groups, member count, creator info, and whether requester is member
 * Query params: search / q, course_code, status ('open' | 'full' | 'all')
 */
const getAllGroups = async (req, res) => {
  try {
    const currentUserId = req.user?.id || null;
    const { search, q, course_code, status } = req.query;

    const searchTerm = (search || q || '').trim();
    const courseCodeFilter = (course_code || '').trim();
    const statusFilter = (status || '').toLowerCase().trim();

    const params = [currentUserId];
    const whereConditions = [];

    // Filter by search keyword (matches title or course code)
    if (searchTerm) {
      params.push(`%${searchTerm}%`);
      whereConditions.push(
        `(sg.title ILIKE $${params.length} OR sg.course_code ILIKE $${params.length})`
      );
    }

    // Filter by specific course code
    if (courseCodeFilter) {
      params.push(courseCodeFilter);
      whereConditions.push(`LOWER(sg.course_code) = LOWER($${params.length})`);
    }

    // Filter by status (open vs full)
    if (statusFilter === 'open') {
      whereConditions.push('COALESCE(m.member_count, 0)::int < sg.max_members');
    } else if (statusFilter === 'full') {
      whereConditions.push('COALESCE(m.member_count, 0)::int >= sg.max_members');
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        sg.id,
        sg.title,
        sg.course_code,
        sg.description,
        sg.meeting_schedule,
        sg.location,
        sg.max_members,
        sg.created_by,
        sg.created_at,
        sg.updated_at,
        u.name AS creator_name,
        u.surname AS creator_surname,
        u.email AS creator_email,
        u.role AS creator_role,
        COALESCE(m.member_count, 0)::int AS member_count,
        (COALESCE(m.member_count, 0)::int >= sg.max_members) AS is_full,
        CASE WHEN $1::int IS NOT NULL AND my_m.user_id IS NOT NULL THEN true ELSE false END AS is_member,
        CASE WHEN $1::int IS NOT NULL AND sg.created_by = $1::int THEN true ELSE false END AS is_creator
      FROM study_groups sg
      JOIN users u ON sg.created_by = u.id
      LEFT JOIN (
        SELECT study_group_id, COUNT(*)::int AS member_count
        FROM study_group_members
        GROUP BY study_group_id
      ) m ON sg.id = m.study_group_id
      LEFT JOIN (
        SELECT study_group_id, user_id
        FROM study_group_members
        WHERE user_id = $1::int
      ) my_m ON sg.id = my_m.study_group_id
      ${whereClause}
      ORDER BY sg.created_at DESC;
    `;

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      study_groups: result.rows,
    });
  } catch (error) {
    console.error('Error fetching study groups:', error);
    return res.status(500).json({ error: 'Failed to retrieve study groups.' });
  }
};

/**
 * GET /api/study-groups/:id
 * Optional auth: returns complete group details, creator info, members list, member count
 */
const getGroupById = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid study group ID format.' });
    }

    const currentUserId = req.user?.id || null;

    // Fetch study group with creator info
    const groupSql = `
      SELECT 
        sg.id,
        sg.title,
        sg.course_code,
        sg.description,
        sg.meeting_schedule,
        sg.location,
        sg.max_members,
        sg.created_by,
        sg.created_at,
        sg.updated_at,
        u.id AS creator_id,
        u.name AS creator_name,
        u.surname AS creator_surname,
        u.email AS creator_email,
        u.role AS creator_role
      FROM study_groups sg
      JOIN users u ON sg.created_by = u.id
      WHERE sg.id = $1
    `;
    const groupResult = await query(groupSql, [groupId]);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Study group not found.' });
    }

    const group = groupResult.rows[0];

    // Fetch members without exposing passwords
    const membersSql = `
      SELECT 
        m.id AS membership_id,
        m.joined_at,
        u.id AS user_id,
        u.name,
        u.surname,
        u.email,
        u.role,
        (u.id = $2) AS is_creator
      FROM study_group_members m
      JOIN users u ON m.user_id = u.id
      WHERE m.study_group_id = $1
      ORDER BY m.joined_at ASC;
    `;
    const membersResult = await query(membersSql, [groupId, group.created_by]);
    const members = membersResult.rows;

    const isMember = currentUserId
      ? members.some((m) => m.user_id === currentUserId)
      : false;
    const isCreator = currentUserId ? group.created_by === currentUserId : false;

    return res.status(200).json({
      success: true,
      study_group: {
        id: group.id,
        title: group.title,
        course_code: group.course_code,
        description: group.description,
        meeting_schedule: group.meeting_schedule,
        location: group.location,
        max_members: group.max_members,
        created_by: group.created_by,
        created_at: group.created_at,
        updated_at: group.updated_at,
        creator: {
          id: group.creator_id,
          name: group.creator_name,
          surname: group.creator_surname,
          email: group.creator_email,
          role: group.creator_role,
        },
        members,
        member_count: members.length,
        is_full: members.length >= group.max_members,
        is_member: isMember,
        is_creator: isCreator,
      },
    });
  } catch (error) {
    console.error('Error fetching group details:', error);
    return res.status(500).json({ error: 'Failed to retrieve study group details.' });
  }
};

/**
 * GET /api/study-groups/user/my
 * Protected: returns study groups where current user is creator or member
 */
const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        sg.id,
        sg.title,
        sg.course_code,
        sg.description,
        sg.meeting_schedule,
        sg.location,
        sg.max_members,
        sg.created_by,
        sg.created_at,
        sg.updated_at,
        u.name AS creator_name,
        u.surname AS creator_surname,
        u.email AS creator_email,
        u.role AS creator_role,
        COALESCE(m.member_count, 0)::int AS member_count,
        (COALESCE(m.member_count, 0)::int >= sg.max_members) AS is_full,
        true AS is_member,
        (sg.created_by = $1) AS is_creator
      FROM study_groups sg
      JOIN users u ON sg.created_by = u.id
      LEFT JOIN (
        SELECT study_group_id, COUNT(*)::int AS member_count
        FROM study_group_members
        GROUP BY study_group_id
      ) m ON sg.id = m.study_group_id
      WHERE sg.created_by = $1 
         OR sg.id IN (SELECT study_group_id FROM study_group_members WHERE user_id = $1)
      ORDER BY sg.updated_at DESC;
    `;

    const result = await query(sql, [userId]);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      study_groups: result.rows,
    });
  } catch (error) {
    console.error('Error fetching user study groups:', error);
    return res.status(500).json({ error: 'Failed to retrieve your study groups.' });
  }
};

/**
 * POST /api/study-groups
 * Protected: creates group and automatically adds creator to study_group_members in transaction
 */
const createGroup = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { title, course_code, description, meeting_schedule, location, max_members } = req.body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ error: 'Title is required and must be at least 3 characters.' });
    }
    if (title.trim().length > 150) {
      return res.status(400).json({ error: 'Title cannot exceed 150 characters.' });
    }

    if (!course_code || typeof course_code !== 'string' || course_code.trim().length < 2) {
      return res.status(400).json({ error: 'Course code is required (e.g., CSC101).' });
    }
    if (course_code.trim().length > 50) {
      return res.status(400).json({ error: 'Course code cannot exceed 50 characters.' });
    }

    if (!meeting_schedule || typeof meeting_schedule !== 'string' || !meeting_schedule.trim()) {
      return res.status(400).json({ error: 'Meeting schedule is required.' });
    }
    if (meeting_schedule.trim().length > 255) {
      return res.status(400).json({ error: 'Meeting schedule cannot exceed 255 characters.' });
    }

    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({ error: 'Location is required (campus venue or virtual link).' });
    }
    if (location.trim().length > 255) {
      return res.status(400).json({ error: 'Location cannot exceed 255 characters.' });
    }

    const parsedMaxMembers = parseInt(max_members, 10);
    if (isNaN(parsedMaxMembers) || parsedMaxMembers < 2 || parsedMaxMembers > 50) {
      return res.status(400).json({ error: 'Maximum members must be an integer between 2 and 50.' });
    }

    const trimmedTitle = title.trim();
    const trimmedCourseCode = course_code.trim().toUpperCase();
    const trimmedDescription = description && typeof description === 'string' ? description.trim() : null;
    const trimmedSchedule = meeting_schedule.trim();
    const trimmedLocation = location.trim();

    await client.query('BEGIN');

    // 1. Insert study group record
    const insertGroupSql = `
      INSERT INTO study_groups (
        title, 
        course_code, 
        description, 
        meeting_schedule, 
        location, 
        max_members, 
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, course_code, description, meeting_schedule, location, max_members, created_by, created_at, updated_at;
    `;
    const groupResult = await client.query(insertGroupSql, [
      trimmedTitle,
      trimmedCourseCode,
      trimmedDescription,
      trimmedSchedule,
      trimmedLocation,
      parsedMaxMembers,
      userId,
    ]);
    const createdGroup = groupResult.rows[0];

    // 2. Automatically add creator to study_group_members
    const insertMemberSql = `
      INSERT INTO study_group_members (study_group_id, user_id)
      VALUES ($1, $2)
      RETURNING id, study_group_id, user_id, joined_at;
    `;
    await client.query(insertMemberSql, [createdGroup.id, userId]);

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Study group created successfully.',
      study_group: {
        ...createdGroup,
        member_count: 1,
        is_full: false,
        is_member: true,
        is_creator: true,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating study group:', error);
    return res.status(500).json({ error: 'Failed to create study group.' });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/study-groups/:id
 * Protected: only group creator can edit. Never allows changing created_by.
 */
const updateGroup = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid study group ID.' });
    }

    const userId = req.user.id;
    const { title, course_code, description, meeting_schedule, location, max_members } = req.body;

    // Check if group exists
    const groupCheck = await query(
      'SELECT id, created_by, max_members FROM study_groups WHERE id = $1',
      [groupId]
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Study group not found.' });
    }

    const existingGroup = groupCheck.rows[0];

    // Only creator can edit
    if (existingGroup.created_by !== userId) {
      return res.status(403).json({ error: 'Access denied. Only the group creator may edit this study group.' });
    }

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ error: 'Title is required and must be at least 3 characters.' });
    }
    if (title.trim().length > 150) {
      return res.status(400).json({ error: 'Title cannot exceed 150 characters.' });
    }

    if (!course_code || typeof course_code !== 'string' || course_code.trim().length < 2) {
      return res.status(400).json({ error: 'Course code is required.' });
    }
    if (course_code.trim().length > 50) {
      return res.status(400).json({ error: 'Course code cannot exceed 50 characters.' });
    }

    if (!meeting_schedule || typeof meeting_schedule !== 'string' || !meeting_schedule.trim()) {
      return res.status(400).json({ error: 'Meeting schedule is required.' });
    }
    if (meeting_schedule.trim().length > 255) {
      return res.status(400).json({ error: 'Meeting schedule cannot exceed 255 characters.' });
    }

    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({ error: 'Location is required.' });
    }
    if (location.trim().length > 255) {
      return res.status(400).json({ error: 'Location cannot exceed 255 characters.' });
    }

    const parsedMaxMembers = parseInt(max_members, 10);
    if (isNaN(parsedMaxMembers) || parsedMaxMembers < 2 || parsedMaxMembers > 50) {
      return res.status(400).json({ error: 'Maximum members must be an integer between 2 and 50.' });
    }

    // Check current member count to prevent lowering below existing members
    const countCheck = await query(
      'SELECT COUNT(*)::int AS count FROM study_group_members WHERE study_group_id = $1',
      [groupId]
    );
    const currentMemberCount = countCheck.rows[0].count;

    if (parsedMaxMembers < currentMemberCount) {
      return res.status(400).json({
        error: `Cannot reduce maximum capacity to ${parsedMaxMembers}; the group already has ${currentMemberCount} enrolled members.`,
      });
    }

    const trimmedTitle = title.trim();
    const trimmedCourseCode = course_code.trim().toUpperCase();
    const trimmedDescription = description && typeof description === 'string' ? description.trim() : null;
    const trimmedSchedule = meeting_schedule.trim();
    const trimmedLocation = location.trim();

    // Execute update (created_by is untouched)
    const updateSql = `
      UPDATE study_groups
      SET 
        title = $1,
        course_code = $2,
        description = $3,
        meeting_schedule = $4,
        location = $5,
        max_members = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, title, course_code, description, meeting_schedule, location, max_members, created_by, created_at, updated_at;
    `;
    const updateResult = await query(updateSql, [
      trimmedTitle,
      trimmedCourseCode,
      trimmedDescription,
      trimmedSchedule,
      trimmedLocation,
      parsedMaxMembers,
      groupId,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Study group updated successfully.',
      study_group: {
        ...updateResult.rows[0],
        member_count: currentMemberCount,
        is_full: currentMemberCount >= parsedMaxMembers,
      },
    });
  } catch (error) {
    console.error('Error updating study group:', error);
    return res.status(500).json({ error: 'Failed to update study group.' });
  }
};

/**
 * DELETE /api/study-groups/:id
 * Protected: only group creator can delete. Database cascade removes memberships.
 */
const deleteGroup = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid study group ID.' });
    }

    const userId = req.user.id;

    // Check if group exists
    const groupCheck = await query(
      'SELECT id, created_by FROM study_groups WHERE id = $1',
      [groupId]
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Study group not found.' });
    }

    const group = groupCheck.rows[0];

    // Only creator can delete
    if (group.created_by !== userId) {
      return res.status(403).json({ error: 'Access denied. Only the creator may delete this study group.' });
    }

    // Delete group (cascade handles study_group_members)
    await query('DELETE FROM study_groups WHERE id = $1', [groupId]);

    return res.status(200).json({
      success: true,
      message: 'Study group deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting study group:', error);
    return res.status(500).json({ error: 'Failed to delete study group.' });
  }
};

/**
 * POST /api/study-groups/:id/join
 * Protected: checks group existence, duplicate membership, and capacity using row locking
 */
const joinGroup = async (req, res) => {
  const client = await pool.connect();
  try {
    const groupId = parseInt(req.params.id, 10);
    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid study group ID.' });
    }

    const userId = req.user.id;

    await client.query('BEGIN');

    // 1. Lock the group row for update to prevent concurrent capacity race conditions
    const groupRes = await client.query(
      'SELECT id, title, max_members, created_by FROM study_groups WHERE id = $1 FOR UPDATE',
      [groupId]
    );

    if (groupRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Study group not found.' });
    }

    const group = groupRes.rows[0];

    // 2. Check if user is already a member
    const memberCheck = await client.query(
      'SELECT id FROM study_group_members WHERE study_group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (memberCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You are already a member of this study group.' });
    }

    // 3. Check current member count against max_members
    const countRes = await client.query(
      'SELECT COUNT(*)::int AS count FROM study_group_members WHERE study_group_id = $1',
      [groupId]
    );
    const currentMemberCount = countRes.rows[0].count;

    if (currentMemberCount >= group.max_members) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Study group has reached maximum capacity.' });
    }

    // 4. Add authenticated user to study_group_members
    const insertRes = await client.query(
      'INSERT INTO study_group_members (study_group_id, user_id) VALUES ($1, $2) RETURNING id, joined_at',
      [groupId, userId]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Successfully joined the study group.',
      member_count: currentMemberCount + 1,
      membership: insertRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'You are already a member of this study group.' });
    }
    console.error('Error joining study group:', error);
    return res.status(500).json({ error: 'Failed to join study group.' });
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/study-groups/:id/leave
 * Protected: removes membership. Creator cannot leave their own group.
 */
const leaveGroup = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid study group ID.' });
    }

    const userId = req.user.id;

    // Check if group exists
    const groupCheck = await query(
      'SELECT id, created_by FROM study_groups WHERE id = $1',
      [groupId]
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Study group not found.' });
    }

    const group = groupCheck.rows[0];

    // Creator cannot leave own group
    if (group.created_by === userId) {
      return res.status(400).json({
        error: 'As the creator, you cannot leave your own study group. You must edit or delete the group instead.',
      });
    }

    // Check if user is a member
    const memberCheck = await query(
      'SELECT id FROM study_group_members WHERE study_group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(400).json({ error: 'You are not a member of this study group.' });
    }

    // Remove membership
    await query(
      'DELETE FROM study_group_members WHERE study_group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'You have left the study group successfully.',
    });
  } catch (error) {
    console.error('Error leaving study group:', error);
    return res.status(500).json({ error: 'Failed to leave study group.' });
  }
};

module.exports = {
  getAllGroups,
  getGroupById,
  getMyGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
};
