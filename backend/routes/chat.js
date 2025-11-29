// routes/chat.js - Chat system routes
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');
const { body } = require('express-validator');

// Apply auth middleware to all routes
router.use(authMiddleware(['user', 'member', 'admin']));

// @route   GET /api/chat
// @desc    Get all chats for current user
// @access  Private
router.get('/', chatController.getUserChats);

// @route   GET /api/chat/service/:serviceId
// @desc    Get or create chat for a specific service
// @access  Private
router.get('/service/:serviceId', chatController.getChatByService);

// @route   POST /api/chat/:chatId/message
// @desc    Send a message in chat
// @access  Private
router.post('/:chatId/message', 
  chatController.validateMessage,
  chatController.sendMessage
);

// @route   PUT /api/chat/:chatId/read
// @desc    Mark chat messages as read
// @access  Private
router.put('/:chatId/read', chatController.markChatAsRead);

// @route   POST /api/chat/:chatId/negotiate
// @desc    Send price negotiation
// @access  Private
router.post('/:chatId/negotiate', [
  body('priceOffer')
    .isNumeric({ gt: 0 })
    .withMessage('Giá đề nghị phải là số lớn hơn 0')
], chatController.negotiatePrice);

// @route   POST /api/chat/:chatId/agree-price
// @desc    Agree to negotiated price
// @access  Private
router.post('/:chatId/agree-price', chatController.agreeToPrice);

module.exports = router;
