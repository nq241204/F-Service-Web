// backend/routes/member.js - API routes only
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const memberController = require('../controllers/memberController');
const transactionController = require('../controllers/transactionController');

// Middleware chung cho Member
const isMember = authMiddleware(['member']);
// Middleware cho user đã đăng nhập (để đăng ký member)
const isAuthenticated = authMiddleware(['user', 'member', 'admin']);

// @route   POST /api/member/register
// @desc    Register as member (convert user to member)
// @access  Private (User must be logged in)
router.post('/register', isAuthenticated, memberController.registerValidation, memberController.register);

// @route   GET /api/member/dashboard
// @desc    Get member dashboard data
// @access  Private (Member only)
router.get('/dashboard', isMember, memberController.getDashboard);

// @route   GET /api/member/profile
// @desc    Get member profile
// @access  Private (Member only)
router.get('/profile', isMember, memberController.getProfile);

// @route   PUT /api/member/profile
// @desc    Update member profile
// @access  Private (Member only)
router.put('/profile', isMember, memberController.updateProfile);

// @route   POST /api/member/service/accept/:serviceId
// @desc    Accept service request
// @access  Private (Member only)
router.post('/service/accept/:serviceId', isMember, memberController.acceptService);

// @route   POST /api/member/service/reject/:serviceId
// @desc    Reject/cancel accepted service
// @access  Private (Member only)
router.post('/service/reject/:serviceId', isMember, memberController.rejectService);

// @route   GET /api/member/requests/available
// @desc    Get available service requests
// @access  Private (Member only)
router.get('/requests/available', isMember, memberController.getAvailableRequests);

// @route   GET /api/member/requests/accepted
// @desc    Get member's accepted requests
// @access  Private (Member only)
router.get('/requests/accepted', isMember, memberController.getAcceptedRequests);

// @route   POST /api/member/negotiate-price/:serviceId
// @desc    Negotiate price for service
// @access  Private (Member only)
router.post('/negotiate-price/:serviceId', isMember, memberController.negotiatePrice);

// @route   POST /api/member/complete-commission/:serviceId
// @desc    Complete commission and gain experience
// @access  Private (Member only)
router.post('/complete-commission/:serviceId', isMember, memberController.completeCommission);

// @route   GET /api/member/commissions/completed
// @desc    Get member's completed commissions
// @access  Private (Member only)
router.get('/commissions/completed', isMember, memberController.getCompletedCommissions);

// @route   POST /api/member/commission/settle/:serviceId
// @desc    Settle commission payment
// @access  Private (Member only)
router.post('/commission/settle/:serviceId', isMember, async (req, res) => {
    try {
        const result = await transactionController.settleCommissionPayment(req, res);
        if (result && result.success) {
            res.status(200).json(result);
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;
