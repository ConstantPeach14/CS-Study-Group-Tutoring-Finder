const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const tutoringRequestController = require('../controllers/tutoringRequestController');

// 1. POST /api/tutoring-requests - Student sends request to a tutor
router.post('/', authMiddleware, tutoringRequestController.createRequest);

// 2. GET /api/tutoring-requests/my - Student views their outgoing requests
router.get('/my', authMiddleware, tutoringRequestController.getMyRequests);

// 3. GET /api/tutoring-requests/received - Tutor views their incoming requests
router.get('/received', authMiddleware, tutoringRequestController.getReceivedRequests);

// 4. PATCH /api/tutoring-requests/:id - Update status (tutor: accept/decline; student: cancel)
router.patch('/:id', authMiddleware, tutoringRequestController.updateRequestStatus);

module.exports = router;
