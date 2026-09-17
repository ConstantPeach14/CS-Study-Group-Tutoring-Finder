const { query } = require('../db/database');

// GET /api/users/me
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      'SELECT id, name, surname, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const user = userResult.rows[0];

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
};

module.exports = {
  getMe,
};
