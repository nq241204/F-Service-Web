// backend/controllers/walletController.js - API version
const mongoose = require('mongoose');
const ViGiaoDich = require('../models/ViGiaoDich');
const GiaoDich = require('../models/GiaoDich');
const User = require('../models/User');
const StatisticsService = require('../services/StatisticsService');
const QRCode = require('qrcode');
const { validationResult } = require('express-validator');

// Constants
const MIN_DEPOSIT = 10000;
const MAX_DEPOSIT = 50000000;
const MIN_WITHDRAW = 50000;
const MAX_WITHDRAW = 50000000;

// @desc    Lấy thông tin ví
// @route   GET /api/wallet
// @access  Private
const getWallet = async (req, res) => {
  try {
    const userId = req.user._id;

    // Tìm ví của user
    let wallet = await ViGiaoDich.findOne({ 
      ChuSoHuu: userId,
      LoaiVi: 'User'
    }).lean();

    // Nếu chưa có ví, tạo mới
    if (!wallet) {
      const newWallet = await ViGiaoDich.create({
        LoaiVi: 'User',
        ChuSoHuu: userId,
        SoDuHienTai: 0
      });
      
      // Cập nhật User với ví mới
      await User.findByIdAndUpdate(userId, {
        ViGiaoDich: newWallet._id
      });

      wallet = newWallet.toObject();
    }

    // Get unified wallet statistics from StatisticsService
    const stats = await StatisticsService.getWalletStatistics(userId);

    res.json({
      success: true,
      data: {
        wallet: stats,
        transactions: stats.transactions.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thông tin ví.'
    });
  }
};

// @desc    Lấy số dư ví
// @route   GET /api/wallet/balance
// @access  Private
const getBalance = async (req, res) => {
  try {
    const userId = req.user._id;

    const wallet = await ViGiaoDich.findOne({ 
      ChuSoHuu: userId,
      LoaiVi: 'User'
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ví'
      });
    }

    res.json({
      success: true,
      data: {
        balance: wallet.SoDuHienTai
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy số dư ví'
    });
  }
};

// @desc    Nạp tiền vào ví
// @route   POST /api/wallet/deposit
// @access  Private
const deposit = async (req, res) => {
  console.log('🔍 Deposit function called');
  console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
  console.log('👤 Request user:', req.user?._id);

  try {
    const { amount, method, provider } = req.body;

    console.log('🔍 Deposit called with:', { amount, method, provider, user: req.user?._id });

    // Simple validation without express-validator for testing
    if (!amount || !method || !provider) {
      console.log('❌ Missing required fields');
      console.log('   - amount:', amount);
      console.log('   - method:', method);
      console.log('   - provider:', provider);
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // Validate amount is a number
    const amountNum = Number(amount);
    if (isNaN(amountNum) || !Number.isFinite(amountNum)) {
      console.log('❌ Invalid amount type:', typeof amount, amount);
      return res.status(400).json({
        success: false,
        message: 'Số tiền phải là số hợp lệ'
      });
    }

    if (amountNum < 10000 || amountNum > 50000000) {
      console.log('❌ Invalid amount:', amountNum);
      return res.status(400).json({
        success: false,
        message: 'Số tiền phải từ 10,000đ đến 50,000,000đ'
      });
    }

    if (!['transfer', 'qrcode'].includes(method)) {
      console.log('❌ Invalid method:', method);
      return res.status(400).json({
        success: false,
        message: 'Phương thức không hợp lệ'
      });
    }

    if (!['momo', 'zalopay', 'bank'].includes(provider)) {
      console.log('❌ Invalid provider:', provider);
      return res.status(400).json({
        success: false,
        message: 'Nhà cung cấp không hợp lệ'
      });
    }

    const userId = req.user._id;
    console.log('🔍 User ID from req.user._id:', userId);

    // Create actual transaction in database
    console.log('💾 Creating transaction in database...');
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create deposit transaction
      const transaction = new GiaoDich({
        Loai: 'deposit',
        SoTien: amountNum,
        NguoiThamGia: userId,
        NguoiNhan: userId,
        TrangThai: 'pending',
        MoTa: `Nạp tiền qua ${method === 'qrcode' ? 'QR Code' : 'chuyển khoản'} (${provider})`,
        NgayTao: new Date(),
        NgayCapNhat: new Date()
      });
      
      const savedTransaction = await transaction.save({ session });
      console.log('✅ Transaction created:', savedTransaction._id);
      
      const responseData = {
        transactionId: savedTransaction._id,
        amount: amountNum,
        status: 'pending',
        currentBalance: 0, // Will be updated when transaction is confirmed
        message: 'Tiền sẽ được cộng vào ví sau khi được xác nhận',
        note: 'Giao dịch đã được tạo thành công'
      };

      if (method === 'transfer') {
        // Tạo thông tin chuyển khoản
        const providerNames = {
          momo: 'MoMo',
          zalopay: 'ZaloPay',
          bank: 'Ngân hàng'
        };

        const transferInfo = {
          recipientName: 'F-SERVICE SYSTEM',
          amount: amountNum,
          message: `Nap tien ${savedTransaction._id}`,
          bankName: providerNames[provider],
          transactionId: savedTransaction._id,
          provider: provider
        };

        if (provider === 'momo') {
          transferInfo.momoNumber = '0934567890';
        } else if (provider === 'zalopay') {
          transferInfo.zalopayNumber = '0912345678';
        } else if (provider === 'bank') {
          transferInfo.accountNumber = '1234567890';
          transferInfo.branch = 'Chi nhánh BIDV Hà Nội';
          transferInfo.bankName = 'Ngân hàng BIDV';
        }

        responseData.transferInfo = transferInfo;
      }

      await session.commitTransaction();
      console.log('✅ Transaction committed to database');

      console.log('✅ Deposit completed successfully');
      res.json({
        success: true,
        message: method === 'transfer' 
          ? 'Thông tin chuyển khoản đã được tạo. Vui lòng chờ admin duyệt.'
          : 'Giao dịch nạp tiền đã được tạo. Vui lòng chờ admin duyệt.',
        data: responseData
      });

      console.log('✅ Response sent, transaction ID:', responseData.transactionId);

    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Transaction error:', error);
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('❌ Deposit error details:', error.message);
    console.error('❌ Deposit error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi nạp tiền',
      error: error.message,
      stack: error.stack
    });
  }
};

// @desc    Xác nhận giao dịch nạp tiền
// @route   POST /api/wallet/confirm-deposit/:transactionId
// @access  Private (Admin only)
const confirmDeposit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transactionId } = req.params;

    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới được duyệt nạp tiền'
      });
    }

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
    const User = require('../models/User');
    await User.findByIdAndUpdate(
      transaction.NguoiThamGia,
      { 
        $inc: { SoDu: transaction.SoTien }
      },
      { session }
    );

    // Cập nhật Member model nếu user là member
    const Member = require('../models/Member');
    const member = await Member.findOne({ UserId: transaction.NguoiThamGia }).session(session);
    if (member && member.ViGiaoDich) {
      // Ví đã được liên kết, không cần cập nhật thêm
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
      message: 'Lỗi server khi xác nhận giao dịch nạp tiền'
    });
  } finally {
    session.endSession();
  }
};

// @desc    Từ chối giao dịch nạp tiền
// @route   POST /api/wallet/reject-deposit/:transactionId
// @access  Private (Admin only)
const rejectDeposit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transactionId } = req.params;
    const { reason } = req.body;

    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới được từ chối nạp tiền'
      });
    }

    // Tìm giao dịch
    const transaction = await GiaoDich.findById(transactionId).session(session);
    if (!transaction || transaction.Loai !== 'deposit' || transaction.TrangThai !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Giao dịch không hợp lệ hoặc đã được xử lý'
      });
    }

    // Cập nhật trạng thái giao dịch
    transaction.TrangThai = 'failed';
    transaction.NgayHoanThanh = new Date();
    transaction.MoTa += ` - Từ chối: ${reason || 'Lý do không được cung cấp'}`;

    await transaction.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Đã từ chối giao dịch nạp tiền',
      data: {
        transactionId: transaction._id,
        amount: transaction.SoTien,
        status: 'failed',
        reason: reason || 'Lý do không được cung cấp'
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Reject deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi từ chối nạp tiền'
    });
  } finally {
    session.endSession();
  }
};

// @desc    Rút tiền từ ví (tạo giao dịch pending - chờ xác nhận)
// @route   POST /api/wallet/withdraw
// @access  Private
const withdraw = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, bankInfo } = req.body;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    // Validate số tiền
    const amountNum = parseInt(amount);
    if (!amountNum || amountNum < MIN_WITHDRAW || amountNum > MAX_WITHDRAW) {
      return res.status(400).json({
        success: false,
        message: `Số tiền phải từ ${MIN_WITHDRAW.toLocaleString('vi-VN')}đ đến ${MAX_WITHDRAW.toLocaleString('vi-VN')}đ`
      });
    }

    // Validate thông tin ngân hàng
    if (!bankInfo || !bankInfo.accountNumber || !bankInfo.bankName || !bankInfo.accountHolder) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin ngân hàng'
      });
    }

    // Validate định dạng số tài khoản
    if (!/^\d{8,15}$/.test(bankInfo.accountNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Số tài khoản không hợp lệ (8-15 chữ số)'
      });
    }

    const userId = req.user._id;

    // Tìm ví của user
    const wallet = await ViGiaoDich.findOne({ 
      ChuSoHuu: userId,
      LoaiVi: 'User'
    }).session(session);

    if (!wallet) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ví'
      });
    }

    // Kiểm tra số dư
    if (wallet.SoDuHienTai < amountNum) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Số dư không đủ để thực hiện giao dịch này'
      });
    }

    // Tạo giao dịch với trạng thái PENDING (chưa xác nhận)
    const transaction = await GiaoDich.create([{
      Loai: 'withdraw',
      SoTien: amountNum,
      NguoiThamGia: userId,
      TrangThai: 'pending',
      MoTa: `Rút tiền về ${bankInfo.bankName} - ${bankInfo.accountNumber} - ${bankInfo.accountHolder}`,
      ThongTinThanhToan: {
        bankName: bankInfo.bankName,
        accountNumber: bankInfo.accountNumber,
        accountHolder: bankInfo.accountHolder,
        ngayTao: new Date()
      }
    }], { session });

    // *** IMPORTANT: Trừ tiền ngay từ lúc tạo withdraw request ***
    // Tiền sẽ được giữ trong trạng thái pending
    wallet.SoDuHienTai -= amountNum;
    
    // Cập nhật ví để thêm giao dịch
    wallet.GiaoDich.push(transaction[0]._id);
    await wallet.save({ session });

    // Cập nhật User model - trừ SoDu
    await User.findByIdAndUpdate(
      userId,
      { 
        $inc: { SoDu: -amountNum }
      },
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Yêu cầu rút tiền đã được tạo. Vui lòng chờ xác nhận từ hệ thống.',
      data: {
        transactionId: transaction[0]._id,
        amount: amountNum,
        status: 'pending',
        currentBalance: wallet.SoDuHienTai,
        message: 'Tiền sẽ được rút sau khi hệ thống xác nhận'
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Withdraw error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi rút tiền'
    });
  } finally {
    session.endSession();
  }
};

// Hủy giao dịch rút tiền (hoàn tiền lại vào ví)
const cancelWithdraw = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transactionId } = req.params;
    const userId = req.user._id;

    // Tìm giao dịch
    const transaction = await GiaoDich.findById(transactionId).session(session);
    if (!transaction || transaction.Loai !== 'withdraw' || transaction.TrangThai !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Giao dịch không hợp lệ hoặc không ở trạng thái chờ xử lý'
      });
    }

    // Kiểm tra quyền
    if (transaction.NguoiThamGia.toString() !== userId.toString() && req.user.role !== 'admin') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy giao dịch này'
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

    // Hoàn tiền lại vào ví
    wallet.SoDuHienTai += transaction.SoTien;

    // Đánh dấu giao dịch thành cancelled
    transaction.TrangThai = 'cancelled';
    transaction.LyDoHuy = 'User hủy giao dịch rút tiền';
    transaction.NgayHuy = new Date();

    // Lưu thay đổi
    await Promise.all([
      wallet.save({ session }),
      transaction.save({ session })
    ]);

    // Cập nhật User model - hoàn tiền
    await User.findByIdAndUpdate(
      transaction.NguoiThamGia,
      { 
        $inc: { SoDu: transaction.SoTien }
      },
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Giao dịch rút tiền đã được hủy. Tiền đã được hoàn lại vào ví.',
      data: {
        transactionId: transaction._id,
        refundedAmount: transaction.SoTien,
        status: 'cancelled',
        newBalance: wallet.SoDuHienTai,
        cancelledAt: transaction.NgayHuy
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Cancel withdraw error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy giao dịch rút tiền'
    });
  } finally {
    session.endSession();
  }
};

// @desc    Xác nhận giao dịch rút tiền
// @route   POST /api/wallet/confirm-withdraw/:transactionId
// @access  Private/Admin
const confirmWithdraw = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transactionId } = req.params;
    const userId = req.user._id;

    // Tìm giao dịch
    const transaction = await GiaoDich.findById(transactionId).session(session);
    if (!transaction || transaction.Loai !== 'withdraw' || transaction.TrangThai !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Giao dịch không hợp lệ hoặc đã được xử lý'
      });
    }

    // Kiểm tra quyền
    if (transaction.NguoiThamGia.toString() !== userId.toString() && req.user.role !== 'admin') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xác nhận giao dịch này'
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

    // *** Tiền đã được trừ khi tạo withdraw request ***
    // Chỉ cần đánh dấu giao dịch thành công
    transaction.TrangThai = 'success';
    transaction.NgayHoanThanh = new Date();

    // Lưu thay đổi
    await Promise.all([
      wallet.save({ session }),
      transaction.save({ session })
    ]);

    // NOTE: Tiền đã trừ User.SoDu khi tạo withdraw, nên không trừ lại ở đây

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Xác nhận rút tiền thành công.',
      data: {
        transactionId: transaction._id,
        amount: transaction.SoTien,
        status: 'success',
        currentBalance: wallet.SoDuHienTai,
        completedAt: transaction.NgayHoanThanh
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Confirm withdraw error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác nhận giao dịch rút tiền'
    });
  } finally {
    session.endSession();
  }
};

// @desc    Tạo mã QR cho nạp tiền
// @route   POST /api/wallet/generate-qr
// @access  Private
const generateQRCode = async (req, res) => {
  try {
    console.log('generateQRCode called with:', req.body);
    console.log('User from req:', req.user);
    
    const { amount, provider } = req.body;

    // Validate số tiền
    const amountNum = parseInt(amount);
    if (!amountNum || amountNum < MIN_DEPOSIT || amountNum > MAX_DEPOSIT) {
      return res.status(400).json({
        success: false,
        message: `Số tiền phải từ ${MIN_DEPOSIT.toLocaleString('vi-VN')}đ đến ${MAX_DEPOSIT.toLocaleString('vi-VN')}đ`
      });
    }

    // Validate provider
    if (!provider || !['momo', 'zalopay', 'bank'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Nhà cung cấp không hợp lệ'
      });
    }

    // For public endpoint, use a dummy user ID
    const userId = req.user?._id || '507f1f77bcf86cd799439011';
    console.log('Using userId:', userId);
    
    // Tạo nội dung cho mã QR với provider
    const transactionId = new mongoose.Types.ObjectId();
    const providerNames = {
      momo: 'MOMO',
      zalopay: 'ZALOPAY',
      bank: 'BANK'
    };
    
    const content = `FS_NAPTIEN_${transactionId}_${amountNum}_${userId}_${providerNames[provider]}`;
    console.log('QR content:', content);
    
    try {
      // Tạo mã QR
      const qrCodeDataUrl = await QRCode.toDataURL(content, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      console.log('QR code generated successfully');

      // Tạo giao dịch với trạng thái PENDING
      const transaction = await GiaoDich.create({
        Loai: 'deposit',
        SoTien: amountNum,
        NguoiThamGia: userId,
        TrangThai: 'pending',
        MoTa: `Nạp tiền qua Quét mã QR - ${providerNames[provider]}`,
        ThongTinThanhToan: {
          method: 'qrcode',
          provider: provider,
          qrContent: content,
          ngayTao: new Date()
        }
      });
      console.log('Transaction created:', transaction._id);

      res.json({
        success: true,
        message: 'Tạo mã QR thành công',
        data: {
          transactionId: transaction._id,
          amount: amountNum,
          content: content,
          qrCodeUrl: qrCodeDataUrl,
          qrCodeData: content,
          status: 'pending',
          createdAt: new Date()
        }
      });
    } catch (qrError) {
      console.error('QR generation or DB error:', qrError);
      // Fallback: return QR content without saving to DB
      const qrCodeDataUrl = await QRCode.toDataURL(content, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      res.json({
        success: true,
        message: 'Tạo mã QR thành công (chưa lưu vào DB)',
        data: {
          transactionId: transactionId,
          amount: amountNum,
          content: content,
          qrCodeUrl: qrCodeDataUrl,
          qrCodeData: content,
          status: 'pending',
          createdAt: new Date(),
          note: 'Giao dịch sẽ được tạo khi xác nhận thanh toán'
        }
      });
    }

  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo mã QR: ' + error.message
    });
  }
};

module.exports = {
  getWallet,
  getBalance,
  deposit,
  confirmDeposit,
  rejectDeposit,
  withdraw,
  confirmWithdraw,
  generateQRCode
};
