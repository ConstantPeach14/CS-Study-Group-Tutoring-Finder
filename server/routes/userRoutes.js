const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// GET /api/users/me - Protected by JWT auth
router.get('/me', authMiddleware, userController.getMe);

module.exports = router;
