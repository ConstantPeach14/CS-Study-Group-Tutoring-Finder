const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const moduleController = require('../controllers/moduleController');

// 1. GET /api/modules - Public listing with optional authentication
router.get('/', authMiddleware.optionalAuth, moduleController.getAllModules);

// 2. GET /api/modules/my or /api/modules/user/my - User's active enrolled modules
router.get('/my', authMiddleware, moduleController.getMyModules);
router.get('/user/my', authMiddleware, moduleController.getMyModules);

// 3. POST /api/modules/enroll - Enroll in a module
router.post('/enroll', authMiddleware, moduleController.enrollModule);

// 4. POST /api/modules/unenroll - Unenroll from a module
router.post('/unenroll', authMiddleware, moduleController.unenrollModule);

// 5. GET /api/modules/:id - Public details with optional authentication (groups, tutors, details)
router.get('/:id', authMiddleware.optionalAuth, moduleController.getModuleById);

module.exports = router;
