// routes/admin.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const memberApprovalController = require('../controllers/memberApprovalController');
const adminController = require('../controllers/adminController');
const StatisticsService = require('../services/StatisticsService');

// Dashboard
router.get('/dashboard', authMiddleware(['admin']), adminController.getSystemStats);

// Users Management
router.get('/users', authMiddleware(['admin']), adminController.getUsers);
router.post('/user/:userId/status', authMiddleware(['admin']), adminController.updateUserStatus);

// Services Management
router.get('/services', authMiddleware(['admin']), adminController.getServices);
router.post('/services', authMiddleware(['admin']), adminController.createService);
router.put('/services/:id', authMiddleware(['admin']), adminController.updateService);
router.delete('/services/:id', authMiddleware(['admin']), adminController.deleteService);
router.post('/services/:id/approve', authMiddleware(['admin']), adminController.approveService);
router.post('/services/:id/reject', authMiddleware(['admin']), adminController.rejectService);

// Members Management
router.get('/members', authMiddleware(['admin']), adminController.getMembers);
router.put('/members/:id/status', authMiddleware(['admin']), adminController.updateMemberStatus);

// Member Approval Process
router.get('/members/:id/approve', authMiddleware(['admin']), memberApprovalController.getMemberApprovalDetails);
router.post('/members/:id/interview', authMiddleware(['admin']), memberApprovalController.sendInterviewRequest);
router.post('/members/:id/final-approve', authMiddleware(['admin']), memberApprovalController.finalApproveMember);
router.post('/members/:id/reject', authMiddleware(['admin']), memberApprovalController.rejectMember);

// Transactions Management
router.get('/transactions', authMiddleware(['admin']), adminController.getTransactions);
router.put('/transactions/:id/approve', authMiddleware(['admin']), adminController.approveTransaction);
router.put('/transactions/:id/reject', authMiddleware(['admin']), adminController.rejectTransaction);

// Service Completion Management
router.post('/approve-completion/:serviceId', authMiddleware(['admin']), require('../controllers/memberController').approveCommissionCompletion);

// @route   POST /api/admin/sync-all-statistics
// @desc    Sync all users' statistics (admin only)
// @access  Private (Admin only)
router.post('/sync-all-statistics', authMiddleware(['admin']), async (req, res) => {
  try {
    const result = await StatisticsService.syncAllUsers();
    
    res.json({
      success: true,
      message: 'Đã đồng bộ hóa thống kê cho tất cả users',
      data: result
    });
  } catch (error) {
    console.error('Sync all statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đồng bộ hóa thống kê toàn hệ thống'
    });
  }
});

module.exports = router;