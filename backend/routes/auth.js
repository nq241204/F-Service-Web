// backend/routes/auth.js - API routes only
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const memberRegistrationController = require('../controllers/memberRegistrationController');
const { authMiddleware } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/register-member
// @desc    Register new member (pending admin approval)
// @access  Public
router.post('/register-member', memberRegistrationController.registerMember);

// @route   GET /api/auth/member-status/:userId
// @desc    Get member registration status
// @access  Public
router.get('/member-status/:userId', [
    // Add validation for user ID
    require('express-validator').param('userId')
        .isMongoId()
        .withMessage('ID người dùng không hợp lệ')
], memberRegistrationController.getMemberStatus);

// @route   POST /api/auth/resend-member-confirmation
// @desc    Resend member registration confirmation
// @access  Public
router.post('/resend-member-confirmation', memberRegistrationController.resendMemberConfirmation);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authMiddleware(['user', 'member', 'admin']), authController.logout);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', authMiddleware(['user', 'member', 'admin']), authController.getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware(['user', 'member', 'admin']), ...authController.updateProfile);

// @route   PUT /api/auth/password
// @desc    Update user password
// @access  Private
router.put('/password', authMiddleware(['user', 'member', 'admin']), ...authController.updatePassword);

// @route   POST /api/auth/reset-password
// @desc    Request password reset
// @access  Public
router.post('/reset-password', ...authController.resetPasswordRequest);

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.put('/reset-password/:token', ...authController.resetPassword);

module.exports = router;
