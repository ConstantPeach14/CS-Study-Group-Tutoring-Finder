const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const moduleController = require('../controllers/moduleController');

// GET /api/users/me - Protected by JWT auth
router.get('/me', authMiddleware, userController.getMe);

// GET /api/users/me/modules - Protected by JWT auth
router.get('/me/modules', authMiddleware, moduleController.getMyModules);

module.exports = router;

