// backend/routes/user.js - API routes only
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ViGiaoDich = require('../models/ViGiaoDich');
const UyThac = require('../models/UyThac');
const DichVu = require('../models/DichVu');
const GiaoDich = require('../models/GiaoDich');
const User = require('../models/User');
const StatisticsService = require('../services/StatisticsService');
const userController = require('../controllers/userController');
const { 
  serviceValidations,
  authValidations,
  handleValidationErrors 
} = require('../middleware/validationMiddleware');

// @route   GET /api/user/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', authMiddleware(['user', 'member']), async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get unified wallet and commission statistics from StatisticsService
    const stats = await StatisticsService.getFullStatistics(userId);
    
    // Get wallet info (create if not exists)
    let wallet = await ViGiaoDich.findOne({ 
      ChuSoHuu: userId,
      LoaiVi: 'User'
    }).lean();

    // If no wallet exists, create one
    if (!wallet) {
      const newWallet = await ViGiaoDich.create({
        LoaiVi: 'User',
        ChuSoHuu: userId,
        SoDuHienTai: 0,
        SoDuKhaDung: 0
      });
      
      // Update User with new wallet
      await User.findByIdAndUpdate(userId, {
        ViGiaoDich: newWallet._id
      });

      wallet = newWallet.toObject();
    }
    
    // Get user's services (created by user)
    const myServices = await DichVu.find({ NguoiDung: userId })
      .populate('ThanhVien', 'Ten CapBac')
      .sort('-createdAt')
      .limit(10)
      .lean();
    
    // Count services by status
    const pendingServices = await DichVu.countDocuments({ 
      NguoiDung: userId, 
      TrangThai: 'cho-duyet' 
    });
    const activeServices = await DichVu.countDocuments({ 
      NguoiDung: userId, 
      TrangThai: { $in: ['da-nhan', 'dang-xu-ly'] }
    });
    const completedServices = await DichVu.countDocuments({ 
      NguoiDung: userId, 
      TrangThai: 'hoan-thanh' 
    });
    
    console.log('Dashboard stats for user', userId, {
      pendingServices,
      activeServices,
      completedServices,
      totalServices: myServices.length
    });
    
    res.json({
      success: true,
      data: {
        user: req.user,
        wallet: stats.wallet,
        commissions: stats.commissions,
        services: myServices,
        stats: {
          services: {
            pending: pendingServices,
            active: activeServices,
            completed: completedServices,
            total: myServices.length
          },
          transactions: stats.summary,
          // Add flat stats for frontend compatibility
          pending: pendingServices,
          active: activeServices,
          completed: completedServices,
          total: myServices.length,
          totalTransactions: stats.wallet.transactions.length
        },
        recentTransactions: stats.wallet.transactions.slice(0, 5)
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải dashboard.'
    });
  }
});

// @route   GET /api/user/requests
// @desc    Get user's service requests
// @access  Private
router.get('/requests', authMiddleware(['user', 'member']), async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Getting requests for user:', userId);
    
    // Get all services created by this user (these are their requests)
    const requests = await DichVu.find({ NguoiDung: userId })
      .populate('ThanhVien', 'Ten CapBac LinhVuc DiemDanhGiaTB')
      .sort('-createdAt')
      .lean();
    
    console.log('Found requests:', requests.length);
    console.log('Requests data:', requests.map(r => ({ 
      id: r._id, 
      title: r.TenDichVu, 
      status: r.TrangThai,
      hasMember: !!r.ThanhVien 
    })));
    
    res.json({
      success: true,
      data: requests
    });
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách yêu cầu.'
    });
  }
});

// @route   GET /api/user/requests/:id
// @desc    Get request details
// @access  Private
router.get('/requests/:id', authMiddleware(['user', 'member']), async (req, res) => {
  try {
    const request = await DichVu.findById(req.params.id)
      .populate('NguoiDung', 'name email phone address')
      .populate('ThanhVien', 'Ten CapBac LinhVuc DiemDanhGiaTB');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu'
      });
    }
    
    // Check authorization - user can view their own requests
    if (request.NguoiDung._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem yêu cầu này'
      });
    }
    
    res.json({
      success: true,
      data: request
    });
  } catch (err) {
    console.error('Get request details error:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải chi tiết yêu cầu.'
    });
  }
});

// @route   GET /api/user/home
// @desc    Get user home data
// @access  Private
router.get('/home', authMiddleware(['user', 'member']), async (req, res) => {
  try {
    const wallet = await ViGiaoDich.findOne({ ChuSoHuu: req.user._id }).lean();
    
    const allCommissions = await UyThac.find({ UserId: req.user._id }).lean();
    const totalCommissions = allCommissions.length;
    const inProgressCommissions = allCommissions.filter(c => 
      c.TrangThai === 'DangThucHien' || c.TrangThai === 'in_progress'
    ).length;
    
    const recentCommissions = await UyThac.find({ UserId: req.user._id })
      .populate('DichVuId')
      .sort({ NgayTao: -1 })
      .limit(5)
      .lean();
    
    const allTransactions = await GiaoDich.find({ ViGiaoDichId: wallet?._id }).lean();
    const totalTransactions = allTransactions.length;
    
    const recentTransactions = await GiaoDich.find({ ViGiaoDichId: wallet?._id })
      .sort({ NgayGiaoDich: -1 })
      .limit(5)
      .lean();
    
    res.json({
      success: true,
      data: {
        wallet,
        totalCommissions,
        inProgressCommissions,
        totalTransactions,
        recentCommissions,
        recentTransactions
      }
    });
  } catch (err) {
    console.error('Home page error:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải trang chủ.'
    });
  }
});

// @route   POST /api/user/create-request
// @desc    Create a new service request
// @access  Private
router.post('/create-request', authMiddleware(['user', 'member']), [
  ...serviceValidations.create,
  handleValidationErrors
], async (req, res) => {

    const { 
      title, 
      description, 
      price, 
      address, 
      expectedDate, 
      serviceType,
      isNewService,
      suggestion,
      customServiceType,
      contactPhone,
      contactEmail,
      contactMethod
    } = req.body;
    
    try {
      // Check user wallet balance before creating service
      const TransactionService = require('../services/TransactionService');
      const userId = req.user._id;
      const servicePrice = parseInt(price) || 0;
      
      console.log('🔍 Checking wallet for service creation...');
      console.log('  - User ID:', userId);
      console.log('  - Service Price:', servicePrice);
      
      const userWallet = await TransactionService.getUserWallet(userId);
      
      if (!userWallet) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy ví của bạn. Vui lòng nạp tiền trước khi tạo yêu cầu.'
        });
      }
      
      console.log('  - Current Balance:', userWallet.SoDuHienTai);
      console.log('  - Required Balance:', servicePrice);
      console.log('  - Can afford:', userWallet.SoDuHienTai >= servicePrice ? 'YES' : 'NO');
      
      if (userWallet.SoDuHienTai < servicePrice) {
        return res.status(400).json({
          success: false,
          message: `Số dư không đủ. Bạn cần ít nhất ${servicePrice.toLocaleString()}đ để tạo yêu cầu này. Số dư hiện tại: ${userWallet.SoDuHienTai.toLocaleString()}đ.`
        });
      }
      
      // Build full description with additional info
      let fullDescription = description;
      if (address) {
        fullDescription += `\n\n📍 Địa chỉ: ${address}`;
      }
      if (expectedDate) {
        fullDescription += `\n⏰ Thời gian mong muốn: ${new Date(expectedDate).toLocaleString('vi-VN')}`;
      }
      if (serviceType) {
        fullDescription += `\n🏷️ Lĩnh vực: ${serviceType}`;
      }
      if (serviceType === 'other' && customServiceType) {
        fullDescription += `\n📝 Lĩnh vực chi tiết: ${customServiceType}`;
      }
      if (contactPhone) {
        fullDescription += `\n📞 SĐT liên hệ: ${contactPhone}`;
      }
      if (contactEmail) {
        fullDescription += `\n📧 Email liên hệ: ${contactEmail}`;
      }
      if (contactMethod) {
        const methodLabels = {
          phone: 'Ưu tiên liên hệ qua điện thoại',
          email: 'Ưu tiên liên hệ qua email',
          both: 'Liên hệ qua cả điện thoại và email'
        };
        fullDescription += `\n📋 ${methodLabels[contactMethod] || 'Liên hệ qua điện thoại'}`;
      }
      if (isNewService && suggestion) {
        fullDescription += `\n\n💡 Gợi ý dịch vụ mới:\n${suggestion}`;
      }

      const dichVu = new DichVu({
        TenDichVu: title,
        LinhVuc: serviceType === 'other' ? (customServiceType || 'Khác') : serviceType,
        MoTa: fullDescription,
        Gia: servicePrice,
        GiaAI: servicePrice,
        NguoiDung: userId,
        TrangThai: 'cho-duyet',
      });
      
      await dichVu.save();
      
      console.log(`✅ Service created successfully: ${dichVu._id}`);
      console.log(`✅ User balance check passed: ${userWallet.SoDuHienTai} >= ${servicePrice}`);
      
      res.status(201).json({
        success: true,
        message: 'Tạo yêu cầu thành công! Yêu cầu đang chờ hệ thống duyệt. Số dư của bạn sẽ được giữ khi có thành viên nhận yêu cầu.',
        data: dichVu
      });
    } catch (err) {
      console.error('Error creating service request:', err);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo yêu cầu.'
      });
    }
  }
);

// @route   GET /api/user/commissions
// @desc    Get user commissions
// @access  Private
router.get('/commissions', authMiddleware(['user', 'member']), async (req, res) => {
  try {
    const status = req.query.status || null;
    const query = { UserId: req.user._id };
    if (status) query.TrangThai = status;
    const commissions = await UyThac.find(query).populate('DichVuId').lean();
    
    res.json({
      success: true,
      data: commissions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách ủy thác.'
    });
  }
});

// @route   GET /api/user/transactions
// @desc    Get user transactions
// @access  Private
router.get('/transactions', authMiddleware(['user', 'member']), async (req, res) => {
  try {
    const transactions = await GiaoDich.find({ NguoiThamGia: req.user._id }).lean();
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lịch sử giao dịch.'
    });
  }
});

// @route   GET /api/user/profile
// @desc    Get user profile with statistics
// @access  Private
router.get('/profile', authMiddleware(['user', 'member']), async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get wallet info
    const wallet = await ViGiaoDich.findOne({ ChuSoHuu: userId }).lean();
    
    // Get services statistics
    const allServices = await DichVu.find({ NguoiDung: userId }).lean();
    const totalServices = allServices.length;
    const completedServices = allServices.filter(s => s.TrangThai === 'hoan-thanh').length;
    const activeServices = allServices.filter(s => ['da-nhan', 'dang-xu-ly'].includes(s.TrangThai)).length;
    const pendingServices = allServices.filter(s => s.TrangThai === 'cho-duyet').length;
    
    // Get commissions and transactions
    const commissions = await UyThac.find({ UserId: userId }).lean();
    const transactions = await GiaoDich.find({ NguoiThamGia: userId }).lean();
    
    const totalCommissions = commissions.length;
    const completedCommissions = commissions.filter(c => c.TrangThai === 'DaHoanThanh').length;
    const inProgressCommissions = commissions.filter(c => c.TrangThai === 'DangThucHien').length;
    const totalTransactions = transactions.length;

    res.json({
      success: true,
      data: {
        user: req.user,
        wallet,
        services: {
          total: totalServices,
          completed: completedServices,
          active: activeServices,
          pending: pendingServices
        },
        totalCommissions,
        completedCommissions,
        inProgressCommissions,
        totalTransactions
      }
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thông tin cá nhân.'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware(['user', 'member']), [
  ...authValidations.updateProfile,
  handleValidationErrors
], async (req, res) => {
  try {

    const allowedFields = ['name', 'phone', 'email', 'bio', 'dateOfBirth', 'gender', 'address', 'preferences'];
    const updateData = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Check if email is already taken by another user
    if (updateData.email && updateData.email !== req.user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng bởi tài khoản khác'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công',
      data: { user: updatedUser }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin cá nhân.'
    });
  }
});

// @route   POST /api/user/transactions/check-and-confirm
// @desc    Check and confirm pending transactions (auto-confirm system)
// @access  Private
router.post('/transactions/check-and-confirm', authMiddleware(['user', 'member']), async (req, res) => {
  try {
    const TransactionAutoConfirmService = require('../services/TransactionAutoConfirmService');
    
    // Xử lý tất cả giao dịch pending của user này
    const pendingTransactions = await GiaoDich.find({
      NguoiThamGia: req.user._id,
      TrangThai: 'pending',
      createdAt: { $lte: new Date(Date.now() - 2 * 1000) } // Chờ tối thiểu 2 giây
    }).select('_id Loai');

    if (pendingTransactions.length === 0) {
      return res.json({
        success: true,
        message: 'Không có giao dịch pending cần xác nhận',
        confirmed: 0
      });
    }

    let confirmed = 0;
    let errors = [];

    for (const tx of pendingTransactions) {
      try {
        if (tx.Loai === 'deposit') {
          await TransactionAutoConfirmService.autoConfirmDeposit(tx._id);
        } else if (tx.Loai === 'withdraw') {
          await TransactionAutoConfirmService.autoConfirmWithdraw(tx._id);
        }
        confirmed++;
      } catch (error) {
        errors.push({
          transactionId: tx._id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Đã xác nhận ${confirmed} giao dịch thành công`,
      confirmed,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Check and confirm error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra và xác nhận giao dịch'
    });
  }
});

// @route   POST /api/user/transactions/process-all-pending
// @desc    Process all pending transactions system-wide (admin/system endpoint)
// @access  Private (Admin only)
router.post('/transactions/process-all-pending', authMiddleware(['admin']), async (req, res) => {
  try {
    const TransactionAutoConfirmService = require('../services/TransactionAutoConfirmService');
    
    // Xử lý tất cả giao dịch pending 
    const { timeoutMinutes = 5 } = req.body;
    const result = await TransactionAutoConfirmService.processAllPendingTransactions(timeoutMinutes);

    res.json({
      success: true,
      message: 'Đã xử lý giao dịch pending',
      result
    });
  } catch (error) {
    console.error('Process all pending error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý giao dịch pending'
    });
  }
});

// @route   POST /api/user/confirm-service-completion/:serviceId
// @desc    User confirms service completion
// @access  Private (User only)
router.post('/confirm-service-completion/:serviceId', authMiddleware(['user']), userController.confirmServiceCompletion);

// @route   GET /api/user/service-progress/:serviceId
// @desc    Get user's service progress
// @access  Private (User only)
router.get('/service-progress/:serviceId', authMiddleware(['user']), userController.getServiceProgress);

// @route   POST /api/user/sync-statistics
// @desc    Sync user statistics (wallet + commissions)
// @access  Private
router.post('/sync-statistics', authMiddleware(['user', 'member']), async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Sync single user statistics
    await StatisticsService.syncUserData(userId);
    
    // Get updated stats
    const stats = await StatisticsService.getFullStatistics(userId);
    
    res.json({
      success: true,
      message: 'Đã đồng bộ hóa thống kê thành công',
      data: stats
    });
  } catch (error) {
    console.error('Sync statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đồng bộ hóa thống kê'
    });
  }
});

module.exports = router;



