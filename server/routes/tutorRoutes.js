const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const tutorController = require('../controllers/tutorController');

// 1. GET /api/tutors - Public listing with optional authentication
router.get('/', authMiddleware.optionalAuth, tutorController.getAllTutors);

// 2. GET /api/tutors/me or /api/tutors/profile/me - Protected (tutor only, must come before :id)
router.get('/me', authMiddleware, requireRole('tutor'), tutorController.getMyTutorProfile);
router.get('/profile/me', authMiddleware, requireRole('tutor'), tutorController.getMyTutorProfile);

// 3. PUT /api/tutors/me or /api/tutors/profile/me - Protected (tutor only)
router.put('/me', authMiddleware, requireRole('tutor'), tutorController.updateMyTutorProfile);
router.put('/profile/me', authMiddleware, requireRole('tutor'), tutorController.updateMyTutorProfile);

// 4. GET /api/tutors/:id - Public tutor details with optional authentication
router.get('/:id', authMiddleware.optionalAuth, tutorController.getTutorById);

module.exports = router;
