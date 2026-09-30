const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const studyGroupController = require('../controllers/studyGroupController');

// 1. GET /api/study-groups - Public browsing with optional authentication
router.get('/', authMiddleware.optionalAuth, studyGroupController.getAllGroups);

// 2. GET /api/study-groups/user/my - Protected user groups list (must be before :id)
router.get('/user/my', authMiddleware, studyGroupController.getMyGroups);

// 3. GET /api/study-groups/:id - Single group details (public with optional authentication)
router.get('/:id', authMiddleware.optionalAuth, studyGroupController.getGroupById);

// 4. POST /api/study-groups - Create group (protected)
router.post('/', authMiddleware, studyGroupController.createGroup);

// 5. PUT /api/study-groups/:id - Edit group (creator only, protected)
router.put('/:id', authMiddleware, studyGroupController.updateGroup);

// 6. DELETE /api/study-groups/:id - Delete group (creator only, protected)
router.delete('/:id', authMiddleware, studyGroupController.deleteGroup);

// 7. POST /api/study-groups/:id/join - Join group (protected)
router.post('/:id/join', authMiddleware, studyGroupController.joinGroup);

// 8. DELETE /api/study-groups/:id/leave - Leave group (protected)
router.delete('/:id/leave', authMiddleware, studyGroupController.leaveGroup);
router.post('/:id/leave', authMiddleware, studyGroupController.leaveGroup);

module.exports = router;
