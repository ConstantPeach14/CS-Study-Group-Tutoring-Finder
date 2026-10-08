const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passwordResetController = require('../controllers/passwordResetController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', passwordResetController.requestPasswordReset);
router.post('/reset-password', passwordResetController.resetPassword);

module.exports = router;
