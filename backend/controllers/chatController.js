// controllers/chatController.js - Chat system controller
const Chat = require('../models/Chat');
const DichVu = require('../models/DichVu');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// @desc    Get all chats for a user
// @route   GET /api/chat
// @access  Private
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const chats = await Chat.findByUser(userId)
      .skip(skip)
      .limit(limit);

    const total = await Chat.countDocuments({
      'participants.user': userId,
      status: 'active'
    });

    // Add unread count for each chat
    const chatsWithUnread = chats.map(chat => ({
      ...chat.toObject(),
      unreadCount: chat.getUnreadCount(userId)
    }));

    res.json({
      success: true,
      data: {
        chats: chatsWithUnread,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting user chats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách cuộc trò chuyện'
    });
  }
};

// @desc    Get chat by service ID
// @route   GET /api/chat/service/:serviceId
// @access  Private
exports.getChatByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const userId = req.user._id;

    // Check if user has access to this service
    const service = await DichVu.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Dịch vụ không tồn tại'
      });
    }

    // Check if user is participant (customer or assigned member)
    const isParticipant = service.NguoiDung.toString() === userId.toString() ||
                         (service.ThanhVien && service.ThanhVien.toString() === userId.toString());

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập cuộc trò chuyện này'
      });
    }

    let chat = await Chat.findByService(serviceId);

    // If chat doesn't exist, create it
    if (!chat) {
      const participants = [];
      
      // Add customer
      participants.push({
        user: service.NguoiDung,
        role: 'customer'
      });

      // Add assigned member if exists
      if (service.ThanhVien) {
        participants.push({
          user: service.ThanhVien,
          role: 'provider'
        });
      }

      chat = new Chat({
        service: serviceId,
        participants
      });

      await chat.save();
    }

    // Mark messages as read for current user
    await chat.markAsRead(userId);

    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error getting chat by service:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin cuộc trò chuyện'
    });
  }
};

// @desc    Send message
// @route   POST /api/chat/:chatId/message
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text', fileUrl = null, fileName = null, metadata = {} } = req.body;
    const userId = req.user._id;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Cuộc trò chuyện không tồn tại'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(p => 
      p.user.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không tham gia cuộc trò chuyện này'
      });
    }

    // Add message
    await chat.addMessage({
      sender: userId,
      content,
      type,
      fileUrl,
      fileName,
      metadata
    });

    // Get updated chat with populated data
    const updatedChat = await Chat.findById(chatId)
      .populate('messages.sender', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    // Create notification for other participants
    const Notification = require('../models/Notification');
    const otherParticipants = chat.participants.filter(p => 
      p.user.toString() !== userId.toString()
    );

    for (const participant of otherParticipants) {
      await Notification.createNotification({
        recipient: participant.user,
        sender: userId,
        type: 'new_message',
        title: 'Tin nhắn mới',
        message: `Bạn có tin nhắn mới từ ${req.user.name}`,
        relatedEntity: 'chat',
        relatedId: chatId,
        actionUrl: `/chat/${chatId}`,
        metadata: {
          senderName: req.user.name,
          serviceName: chat.service.TenDichVu
        }
      });
    }

    res.json({
      success: true,
      message: 'Gửi tin nhắn thành công',
      data: updatedChat
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi tin nhắn'
    });
  }
};

// @desc    Mark chat as read
// @route   PUT /api/chat/:chatId/read
// @access  Private
exports.markChatAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Cuộc trò chuyện không tồn tại'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(p => 
      p.user.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không tham gia cuộc trò chuyện này'
      });
    }

    await chat.markAsRead(userId);

    res.json({
      success: true,
      message: 'Đã đánh dấu là đã đọc'
    });
  } catch (error) {
    console.error('Error marking chat as read:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đánh dấu đã đọc'
    });
  }
};

// @desc    Negotiate price
// @route   POST /api/chat/:chatId/negotiate
// @access  Private
exports.negotiatePrice = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { priceOffer } = req.body;
    const userId = req.user._id;

    if (!priceOffer || priceOffer <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá đề nghị không hợp lệ'
      });
    }

    const chat = await Chat.findById(chatId).populate('service');
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Cuộc trò chuyện không tồn tại'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(p => 
      p.user.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không tham gia cuộc trò chuyện này'
      });
    }

    // Add price negotiation message
    await chat.addMessage({
      sender: userId,
      content: `Đề nghị giá: ${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(priceOffer)}`,
      type: 'price_negotiation',
      metadata: {
        priceOffer,
        originalPrice: chat.service.Gia
      }
    });

    // Create notification for price negotiation
    const Notification = require('../models/Notification');
    const otherParticipants = chat.participants.filter(p => 
      p.user.toString() !== userId.toString()
    );

    for (const participant of otherParticipants) {
      await Notification.createNotification({
        recipient: participant.user,
        sender: userId,
        type: 'price_negotiation',
        title: 'Đề nghị giá mới',
        message: `${req.user.name} đề nghị giá ${new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(priceOffer)}`,
        relatedEntity: 'chat',
        relatedId: chatId,
        actionUrl: `/chat/${chatId}`,
        metadata: {
          priceOffer,
          serviceName: chat.service.TenDichVu,
          senderName: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Gửi đề nghị giá thành công',
      data: {
        currentOffer: priceOffer,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error negotiating price:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi đề nghị giá'
    });
  }
};

// @desc    Agree to price
// @route   POST /api/chat/:chatId/agree-price
// @access  Private
exports.agreeToPrice = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Cuộc trò chuyện không tồn tại'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(p => 
      p.user.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không tham gia cuộc trò chuyện này'
      });
    }

    if (!chat.priceNegotiation.currentOffer) {
      return res.status(400).json({
        success: false,
        message: 'Không có đề nghị giá nào để đồng ý'
      });
    }

    // Update price negotiation status
    chat.priceNegotiation.agreedPrice = chat.priceNegotiation.currentOffer;
    chat.priceNegotiation.status = 'agreed';

    // Add agreement message
    await chat.addMessage({
      sender: userId,
      content: `Đã đồng ý với giá: ${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(chat.priceNegotiation.agreedPrice)}`,
      type: 'price_negotiation',
      metadata: {
        priceOffer: chat.priceNegotiation.agreedPrice,
        agreed: true
      }
    });

    // Update service price if agreed
    const DichVu = require('../models/DichVu');
    await DichVu.findByIdAndUpdate(chat.service, {
      Gia: chat.priceNegotiation.agreedPrice
    });

    // Create notification for price agreement
    const Notification = require('../models/Notification');
    const otherParticipants = chat.participants.filter(p => 
      p.user.toString() !== userId.toString()
    );

    for (const participant of otherParticipants) {
      await Notification.createNotification({
        recipient: participant.user,
        sender: userId,
        type: 'price_agreed',
        title: 'Đã thỏa thuận giá',
        message: `${req.user.name} đã đồng ý với giá ${new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(chat.priceNegotiation.agreedPrice)}`,
        relatedEntity: 'chat',
        relatedId: chatId,
        actionUrl: `/chat/${chatId}`,
        metadata: {
          priceOffer: chat.priceNegotiation.agreedPrice,
          serviceName: chat.service.TenDichVu,
          senderName: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Đã đồng ý giá thành công',
      data: {
        agreedPrice: chat.priceNegotiation.agreedPrice,
        status: 'agreed'
      }
    });
  } catch (error) {
    console.error('Error agreeing to price:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đồng ý giá'
    });
  }
};

// Validation middleware
exports.validateMessage = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Nội dung tin nhắn không được để trống')
    .isLength({ max: 1000 })
    .withMessage('Tin nhắn không được quá 1000 ký tự')
];
