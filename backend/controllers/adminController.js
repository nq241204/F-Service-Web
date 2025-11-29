// backend/controllers/adminController.js - API version
const User = require('../models/User');
const DichVu = require('../models/DichVu');
const GiaoDich = require('../models/GiaoDich');
const Member = require('../models/Member');
const ServiceManager = require('../services/ServiceManager');
const AdminStatsService = require('../services/AdminStatsService');

// @desc    Get system statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
exports.getSystemStats = async (req, res) => {
  try {
    // Use unified stats service
    const stats = await AdminStatsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Lỗi lấy thống kê hệ thống:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thống kê.'
    });
  }
};

// @desc    Get user list
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    // Use unified stats service
    const result = await AdminStatsService.getUserStats();
    
    // Apply pagination and filtering
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Filter the users
    let filteredUsers = result.data.users;
    
    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    filteredUsers.sort((a, b) => {
      if (sort[sortBy] === -1) {
        return new Date(b[sortBy]) - new Date(a[sortBy]);
      } else {
        return new Date(a[sortBy]) - new Date(b[sortBy]);
      }
    });
    
    // Pagination
    const total = filteredUsers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        statistics: result.data.statistics,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách người dùng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách người dùng.'
    });
  }
};

// @desc    Update user status
// @route   POST /api/admin/user/:userId/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User không tồn tại.' 
      });
    }
    user.status = status === 'true' || status === 'active' ? 'active' : 'banned';
    await user.save();

    res.json({
      success: true,
      message: 'Cập nhật trạng thái user thành công.',
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái.'
    });
  }
};

// @desc    Get all services with filters
// @route   GET /api/admin/services
// @access  Private (Admin only)
exports.getServices = async (req, res) => {
  try {
    const { status, linhVuc, page = 1, limit = 20 } = req.query;
    
    console.log('🔍 getServices query params:', { status, linhVuc, page, limit });
    
    const query = {};
    if (status) query.TrangThai = status;
    if (linhVuc) query.LinhVuc = linhVuc;

    const skip = (page - 1) * limit;
    
    const [services, total] = await Promise.all([
      DichVu.find(query)
        .populate('NguoiDung', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      DichVu.countDocuments(query)
    ]);

    // Debug: Log service data
    console.log('🔍 Service data debug:', {
      query,
      totalFound: total,
      servicesReturned: services.length,
      sampleService: services[0] || 'No services found'
    });

    res.json({
      success: true,
      data: {
        services: services,
        statistics: {
          total: total,
          active: services.filter(s => s.TrangThai === 'active').length,
          inactive: services.filter(s => s.TrangThai === 'inactive').length,
          pending: services.filter(s => s.TrangThai === 'cho-duyet').length,
          approved: services.filter(s => s.TrangThai === 'da-duyet').length,
          rejected: services.filter(s => s.TrangThai === 'huy-bo').length
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách dịch vụ.',
      error: error.message
    });
  }
};

// @desc    Create new service
// @route   POST /api/admin/services
// @access  Private (Admin only)
exports.createService = async (req, res) => {
  try {
    const { TenDichVu, MoTa, LinhVuc, Gia, DonVi } = req.body;

    // Validation
    if (!TenDichVu || !LinhVuc) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên và lĩnh vực dịch vụ.'
      });
    }

    // Simple service creation without transactions
    const DichVu = require('../models/DichVu');
    const newService = new DichVu({
      TenDichVu,
      MoTa: MoTa || '',
      LinhVuc,
      Gia: Gia || 0,
      DonVi: DonVi || 'VND',
      NguoiDung: req.user._id,
      TrangThai: 'cho-duyet'
    });

    await newService.save();

    res.status(201).json({
      success: true,
      message: 'Tạo dịch vụ mới thành công.',
      data: newService
    });
  } catch (error) {
    console.error('Lỗi tạo dịch vụ:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi tạo dịch vụ mới.'
    });
  }
};

// @desc    Update service
// @route   PUT /api/admin/services/:id
// @access  Private (Admin only)
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenDichVu, MoTa, LinhVuc, Gia, DonVi, TrangThai } = req.body;

    const DichVu = require('../models/DichVu');
    const service = await DichVu.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Dịch vụ không tồn tại.'
      });
    }

    if (TenDichVu) service.TenDichVu = TenDichVu;
    if (MoTa !== undefined) service.MoTa = MoTa;
    if (LinhVuc) service.LinhVuc = LinhVuc;
    if (Gia !== undefined) {
      service.Gia = Gia;
    }
    if (DonVi) service.DonVi = DonVi;
    if (TrangThai) service.TrangThai = TrangThai;

    await service.save();

    res.json({
      success: true,
      message: 'Cập nhật dịch vụ thành công.',
      data: service
    });
  } catch (error) {
    console.error('Lỗi cập nhật dịch vụ:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật dịch vụ.'
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/admin/services/:id
// @access  Private (Admin only)
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await DichVu.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Dịch vụ không tồn tại.'
      });
    }

    // Check if service is being used (check if service has any active transactions or assignments)
    const activeService = await DichVu.findById(id).select('TrangThai ThanhVien');
    if (activeService && (activeService.TrangThai === 'da-nhan' || activeService.TrangThai === 'dang-xu-ly')) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa dịch vụ đang được thực hiện.'
      });
    }

    await service.deleteOne();

    res.json({
      success: true,
      message: 'Xóa dịch vụ thành công.'
    });
  } catch (error) {
    console.error('Lỗi xóa dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa dịch vụ.'
    });
  }
};

// @desc    Get all members with filters
// @route   GET /api/admin/members
// @access  Private (Admin only)
exports.getMembers = async (req, res) => {
  try {
    const { status, capBac, linhVuc, page = 1, limit = 20 } = req.query;
    
    console.log('🔍 getMembers query params:', { status, capBac, linhVuc, page, limit });
    
    const query = {};
    if (status) query.TrangThai = status;
    if (capBac) query.CapBac = capBac;
    if (linhVuc) query.LinhVuc = linhVuc;

    const skip = (page - 1) * limit;
    
    const [members, total] = await Promise.all([
      Member.find(query)
        .populate('UserId', 'name email status')
        .sort({ NgayTao: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Member.countDocuments(query)
    ]);

    // Debug: Log member data
    console.log('🔍 Member data debug:', {
      query,
      totalFound: total,
      membersReturned: members.length,
      sampleMember: members[0] || 'No members found'
    });

    res.json({
      success: true,
      data: {
        members: members,
        statistics: {
          total: total,
          active: members.filter(m => m.TrangThai === 'active').length,
          inactive: members.filter(m => m.TrangThai === 'inactive').length,
          pending: members.filter(m => m.TrangThai === 'pending' || m.TrangThai === 'cho-duyet').length,
          approved: members.filter(m => m.TrangThai === 'approved').length,
          rejected: members.filter(m => m.TrangThai === 'rejected').length
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách members:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách members.',
      error: error.message
    });
  }
};

// @desc    Update member status
// @route   PUT /api/admin/members/:id/status
// @access  Private (Admin only)
exports.updateMemberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { TrangThai } = req.body;

    console.log('Updating member status:', { id, TrangThai });

    const member = await Member.findById(id).populate('UserId');
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member không tồn tại.'
      });
    }

    // Update member status
    member.TrangThai = TrangThai;
    await member.save();

    // Also update user status if needed
    if (member.UserId) {
      const userStatusMap = {
        'active': 'active',
        'inactive': 'inactive',
        'rejected': 'inactive',
        'approved': 'member', // Change user role to member when approved
        'pending': 'inactive'
      };
      
      if (userStatusMap[TrangThai]) {
        const User = require('../models/User');
        const user = await User.findById(member.UserId);
        if (user) {
          user.status = userStatusMap[TrangThai];
          if (TrangThai === 'approved') {
            user.role = 'member'; // Update user role to member
          }
          await user.save();
        }
      }
    }

    console.log('Member status updated successfully:', member.TrangThai);

    res.json({
      success: true,
      message: 'Cập nhật trạng thái member thành công.',
      data: member
    });
  } catch (error) {
    console.error('Lỗi cập nhật member:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái member.',
      error: error.message
    });
  }
};

// @desc    Get all transactions with filters
// @route   GET /api/admin/transactions
// @access  Private (Admin only)
exports.getTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (type) query.Loai = type;
    if (status) query.TrangThai = status;

    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      GiaoDich.find(query)
        .populate('NguoiThamGia', 'name email')
        .sort({ NgayGiaoDich: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      GiaoDich.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        transactions: transactions,
        statistics: {
          total: total,
          completed: transactions.filter(t => t.TrangThai === 'completed').length,
          pending: transactions.filter(t => t.TrangThai === 'pending').length,
          failed: transactions.filter(t => t.TrangThai === 'failed').length
        },
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách giao dịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách giao dịch.'
    });
  }
};

// @desc    Approve service (change status from cho-duyet to active, handle escrow)
// @route   POST /api/admin/services/:id/approve
// @access  Private (Admin only)
exports.approveService = async (req, res) => {
  try {
    console.log('Approving service:', req.params.id, 'by admin:', req.user._id);
    const result = await ServiceManager.approveService(req.params.id, req.user._id);
    console.log('Service approved successfully:', result);

    res.json({
      success: true,
      message: 'Dịch vụ đã được phê duyệt và tiền đã chuyển cho chủ dịch vụ.',
      data: result
    });
  } catch (error) {
    console.error('Lỗi phê duyệt dịch vụ:', error);
    console.error('Error details:', {
      serviceId: req.params.id,
      adminId: req.user._id,
      errorMessage: error.message,
      errorStack: error.stack
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi phê duyệt dịch vụ.'
    });
  }
};

// @desc    Reject service (refund escrow funds)
// @route   POST /api/admin/services/:id/reject
// @access  Private (Admin only)
exports.rejectService = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Lý do từ chối là bắt buộc.'
      });
    }

    const result = await ServiceManager.rejectService(
      req.params.id, 
      req.user._id, 
      reason
    );

    res.json({
      success: true,
      message: 'Dịch vụ đã bị từ chối và tiền đã hoàn trả.',
      data: result
    });
  } catch (error) {
    console.error('Lỗi từ chối dịch vụ:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi từ chối dịch vụ.'
    });
  }
};

// @desc    Confirm deposit transaction (admin)
// @route   POST /api/admin/transactions/confirm-deposit/:transactionId
// @access  Private (Admin only)
exports.confirmDepositTransaction = async (req, res) => {
  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transactionId } = req.params;
    const ViGiaoDich = require('../models/ViGiaoDich');

    // Tìm giao dịch
    const transaction = await GiaoDich.findById(transactionId).session(session);
    if (!transaction || transaction.Loai !== 'deposit' || transaction.TrangThai !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Giao dịch không hợp lệ hoặc đã được xử lý'
      });
    }

    // Tìm ví
    const wallet = await ViGiaoDich.findOne({
      ChuSoHuu: transaction.NguoiThamGia
    }).session(session);

    if (!wallet) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Ví không tồn tại'
      });
    }

    // Cập nhật số dư ví
    wallet.SoDuHienTai += transaction.SoTien;
    transaction.TrangThai = 'success';
    transaction.NgayHoanThanh = new Date();

    // Lưu thay đổi
    await Promise.all([
      wallet.save({ session }),
      transaction.save({ session })
    ]);

    // Cập nhật User model - cập nhật SoDu
    await User.findByIdAndUpdate(
      transaction.NguoiThamGia,
      { 
        $inc: { SoDu: transaction.SoTien }
      },
      { session }
    );

    // Cập nhật Member model nếu user là member
    const member = await Member.findOne({ UserId: transaction.NguoiThamGia }).session(session);
    if (member && !member.ViGiaoDich) {
      member.ViGiaoDich = wallet._id;
      await member.save({ session });
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Xác nhận nạp tiền thành công. Tiền đã được cộng vào ví.',
      data: {
        transactionId: transaction._id,
        amount: transaction.SoTien,
        status: 'success',
        newBalance: wallet.SoDuHienTai,
        completedAt: transaction.NgayHoanThanh
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Confirm deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác nhận giao dịch nạp tiền'
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get pending deposit transactions (admin)
// @route   GET /api/admin/transactions/pending-deposits
// @access  Private (Admin only)
exports.getPendingDeposits = async (req, res) => {
  try {
    const pendingDeposits = await GiaoDich.find({
      Loai: 'deposit',
      TrangThai: 'pending'
    })
    .populate('NguoiThamGia', 'name email phone')
    .sort({ NgayGiaoDich: -1 })
    .lean();

    res.json({
      success: true,
      data: {
        count: pendingDeposits.length,
        transactions: pendingDeposits
      }
    });
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách giao dịch chờ xác nhận'
    });
  }
};

// @desc    Approve transaction
// @route   PUT /api/admin/transactions/:id/approve
// @access  Private (Admin only)
exports.approveTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find transaction
    const transaction = await GiaoDich.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Giao dịch không tồn tại'
      });
    }

    // Check if transaction is pending
    if (transaction.TrangThai !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể duyệt giao dịch đang chờ xử lý'
      });
    }

    // Update transaction status
    transaction.TrangThai = 'success';
    transaction.NgayHoanThanh = new Date();
    await transaction.save();

    // Update user wallet balance
    if (transaction.Loai === 'deposit') {
      // Add money to user wallet
      const ViGiaoDich = require('../models/ViGiaoDich');
      const wallet = await ViGiaoDich.findOne({
        ChuSoHuu: transaction.NguoiThamGia,
        LoaiVi: 'User'
      });
      
      if (wallet) {
        wallet.SoDuHienTai += transaction.SoTien;
        await wallet.save();
      }

      // Update User.SoDu
      await User.findByIdAndUpdate(transaction.NguoiThamGia, {
        $inc: { SoDu: transaction.SoTien }
      });
    } else if (transaction.Loai === 'withdraw') {
      // Withdraw money already deducted, just mark as success
      // Money was already deducted when withdrawal was requested
    }

    res.json({
      success: true,
      message: 'Duyệt giao dịch thành công',
      data: transaction
    });
  } catch (error) {
    console.error('Error approving transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi duyệt giao dịch'
    });
  }
};

// @desc    Reject transaction
// @route   PUT /api/admin/transactions/:id/reject
// @access  Private (Admin only)
exports.rejectTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Find transaction
    const transaction = await GiaoDich.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Giao dịch không tồn tại'
      });
    }

    // Check if transaction is pending
    if (transaction.TrangThai !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể từ chối giao dịch đang chờ xử lý'
      });
    }

    // Update transaction status
    transaction.TrangThai = 'failed';
    transaction.MoTa = transaction.MoTa + (reason ? ` - Lý do từ chối: ${reason}` : ' - Bị admin từ chối');
    await transaction.save();

    // For rejected withdrawals, return money back to user wallet
    if (transaction.Loai === 'withdraw') {
      const ViGiaoDich = require('../models/ViGiaoDich');
      const wallet = await ViGiaoDich.findOne({
        ChuSoHuu: transaction.NguoiThamGia,
        LoaiVi: 'User'
      });
      
      if (wallet) {
        wallet.SoDuHienTai += transaction.SoTien; // Return money
        await wallet.save();
      }

      // Update User.SoDu
      await User.findByIdAndUpdate(transaction.NguoiThamGia, {
        $inc: { SoDu: transaction.SoTien }
      });
    }

    res.json({
      success: true,
      message: 'Từ chối giao dịch thành công',
      data: transaction
    });
  } catch (error) {
    console.error('Error rejecting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi từ chối giao dịch'
    });
  }
};
