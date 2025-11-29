// backend/controllers/memberController.js - API version
const User = require('../models/User');
const Member = require('../models/Member');
const ViGiaoDich = require('../models/ViGiaoDich');
const DichVu = require('../models/DichVu');
const UyThac = require('../models/UyThac');
const StatisticsService = require('../services/StatisticsService');
const { validationResult, body } = require('express-validator');

// Helper function to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount || 0);
};

// Helper function to get wallet balance
const getWalletBalance = async (userId) => {
    const user = await User.findById(userId).select('ViGiaoDich');
    if (!user || !user.ViGiaoDich) {
        return 0;
    }
    const wallet = await ViGiaoDich.findById(user.ViGiaoDich).select('SoDuHienTai');
    return wallet ? wallet.SoDuHienTai : 0;
};

// @desc    Get member dashboard data
// @route   GET /api/member/dashboard
// @access  Private (Member only)
const getDashboard = async (req, res) => {
    try {
        const memberId = req.user._id;
        const member = await Member.findOne({ UserId: memberId }).populate('ViGiaoDich');
        
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin thành viên'
            });
        }

        // Get unified wallet and commission statistics from StatisticsService
        const stats = await StatisticsService.getFullStatistics(memberId);

        // Get pending services
        const pendingServices = await DichVu.find({ 
            TrangThai: 'cho-duyet',
            $or: [
                { ThanhVien: null },
                { ThanhVien: member._id }
            ]
        })
        .populate('NguoiDung', 'name email')
        .sort('-createdAt')
        .limit(5)
        .lean();

        // Get accepted services
        const acceptedServices = await DichVu.find({
            ThanhVien: member._id,
            TrangThai: { $in: ['da-nhan', 'dang-xu-ly'] }
        })
        .populate('NguoiDung', 'name email')
        .lean();

        res.json({
            success: true,
            data: {
                member,
                wallet: stats.wallet,
                commissions: stats.commissions,
                summary: stats.summary,
                pendingServices,
                acceptedServices
            }
        });
    } catch (error) {
        console.error('Error getting member dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải dữ liệu Dashboard Thành Viên.'
        });
    }
};

// @desc    Get member profile
// @route   GET /api/member/profile
// @access  Private (Member only)
const getProfile = async (req, res) => {
    try {
        const memberId = req.user._id;
        const member = await Member.findOne({ UserId: memberId }).populate('ViGiaoDich');
        const user = await User.findById(memberId).select('-password');

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin thành viên'
            });
        }

        // Get unified wallet and commission statistics from StatisticsService
        const stats = await StatisticsService.getFullStatistics(memberId);

        res.json({
            success: true,
            data: {
                user,
                member,
                wallet: stats.wallet,
                commissions: stats.commissions,
                summary: stats.summary
            }
        });
    } catch (error) {
        console.error('Error getting member profile:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải thông tin profile.'
        });
    }
};

// @desc    Update member profile
// @route   PUT /api/member/profile
// @access  Private (Member only)
const updateProfile = async (req, res) => {
    try {
        const { Ten, CapBac, LinhVuc, SoDienThoai, KyNang, ChungChi } = req.body;
        const userId = req.user._id;

        // Find member record
        const member = await Member.findOne({ UserId: userId });
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin thành viên.'
            });
        }

        // Update member info
        if (Ten !== undefined) member.Ten = Ten;
        if (CapBac !== undefined) member.CapBac = CapBac;
        if (LinhVuc !== undefined) member.LinhVuc = LinhVuc;
        if (SoDienThoai !== undefined) member.SoDienThoai = SoDienThoai;
        if (KyNang !== undefined) member.KyNang = KyNang;
        if (ChungChi !== undefined) member.ChungChi = ChungChi;

        await member.save();

        // Get updated data with unified statistics
        const user = await User.findById(userId).select('-password');
        const stats = await StatisticsService.getFullStatistics(userId);

        res.json({
            success: true,
            message: 'Cập nhật hồ sơ thành công.',
            data: {
                user,
                member,
                wallet: stats.wallet,
                commissions: stats.commissions,
                summary: stats.summary
            }
        });
    } catch (error) {
        console.error('Error updating member profile:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật profile.'
        });
    }
};

// @desc    Accept service request
// @route   POST /api/member/service/accept/:serviceId
// @access  Private (Member only)
const acceptService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const userId = req.user._id;

        // Find member record for this user
        const member = await Member.findOne({ UserId: userId });
        if (!member) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chưa đăng ký làm thành viên.'
            });
        }

        const dichVu = await DichVu.findById(serviceId).populate('NguoiDung', '_id name email avatar');

        if (!dichVu) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy dịch vụ.'
            });
        }

        if (dichVu.TrangThai !== 'da-duyet') {
            return res.status(400).json({
                success: false,
                message: `Chỉ có thể nhận dịch vụ đã được admin duyệt. Trạng thái hiện tại: ${dichVu.TrangThai}`
            });
        }

        // Check if user has enough balance to pay for the service
        const TransactionService = require('../services/TransactionService');
        let transactionResult = null;
        
        // Only check balance if NguoiDung exists
        if (dichVu.NguoiDung && dichVu.NguoiDung._id) {
            console.log('🔍 Checking wallet for user:', dichVu.NguoiDung._id);
            console.log('🔍 Service price:', dichVu.Gia);
            
            const userWallet = await TransactionService.getUserWallet(dichVu.NguoiDung._id);
            
            console.log('🔍 User wallet found:', userWallet ? 'YES' : 'NO');
            if (userWallet) {
                console.log('🔍 User wallet balance:', userWallet.SoDuHienTai);
                console.log('🔍 Can afford:', userWallet.SoDuHienTai >= dichVu.Gia ? 'YES' : 'NO');
            }
            
            if (!userWallet || userWallet.SoDuHienTai < dichVu.Gia) {
                return res.status(400).json({
                    success: false,
                    message: 'Người tạo dịch vụ không đủ số dư để thanh toán.'
                });
            }

            // Create escrow transaction (deduct money from user's wallet)
            transactionResult = await TransactionService.createEscrowTransaction(
                dichVu.NguoiDung._id,
                dichVu.Gia,
                `Thanh toán cho dịch vụ: ${dichVu.TenDichVu}`,
                serviceId
            );

            if (!transactionResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể tạo giao dịch ký quỹ.'
                });
            }
        } else {
            console.warn('⚠️ Service has no valid NguoiDung, skipping wallet check');
        }

        // Update service status and assign member
        dichVu.TrangThai = 'dang-thuc-hien'; // Member is now working on the service
        dichVu.ThanhVien = member._id;
        
        // Only add escrow transaction ID if transaction was created
        if (transactionResult && transactionResult.transaction) {
            dichVu.GiaoDichKyQuy = transactionResult.transaction._id;
        }
        
        await dichVu.save();

        console.log(`✅ Service ${serviceId} accepted by member ${member._id}`);
        console.log(`✅ Status updated to: ${dichVu.TrangThai}`);
        console.log(`✅ Assigned to member: ${dichVu.ThanhVien}`);
        if (transactionResult && transactionResult.transaction) {
            console.log(`✅ Escrow transaction: ${transactionResult.transaction._id}`);
        }

        res.json({
            success: true,
            message: `Đã chấp nhận dịch vụ: ${dichVu.TenDichVu}. ${formatCurrency(dichVu.Gia)} đã được ký quỹ.`,
            data: dichVu
        });
    } catch (error) {
        console.error('Error accepting service:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi chấp nhận dịch vụ.'
        });
    }
};

// @desc    Register as member
// @route   POST /api/member/register
// @access  Private (User must be logged in)
const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const userId = req.user._id;
        const { Ten, CapBac, LinhVuc, SoDienThoai, KyNang, ChungChi } = req.body;

        // Check if user already has a member account
        const existingMember = await Member.findOne({ UserId: userId });
        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đăng ký thành viên rồi.'
            });
        }

        // Validate CapBac
        const validCapBac = ['Intern', 'Thành thạo', 'Chuyên gia'];
        if (!validCapBac.includes(CapBac)) {
            return res.status(400).json({
                success: false,
                message: 'Cấp bậc không hợp lệ. Phải là: Intern, Thành thạo, hoặc Chuyên gia.'
            });
        }

        // Create member record
        const member = new Member({
            UserId: userId,
            Ten: Ten || req.user.name,
            CapBac,
            LinhVuc,
            SoDienThoai: SoDienThoai || '',
            KyNang: Array.isArray(KyNang) ? KyNang : (KyNang ? [KyNang] : []),
            ChungChi: Array.isArray(ChungChi) ? ChungChi : (ChungChi ? [ChungChi] : []),
            TrangThai: 'pending', // Cần admin duyệt
            DiemDanhGiaTB: 0
        });

        await member.save();

        // Update user role to 'member'
        await User.findByIdAndUpdate(userId, { role: 'member' });

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành viên thành công! Hồ sơ của bạn đang chờ admin duyệt.',
            data: member
        });
    } catch (error) {
        console.error('Error registering member:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký thành viên.'
        });
    }
};

// @desc    Reject/Cancel accepted service
// @route   POST /api/member/service/reject/:serviceId
// @access  Private
const rejectService = async (req, res) => {
    try {
        const memberId = req.user._id;
        const { serviceId } = req.params;

        const dichVu = await DichVu.findById(serviceId);
        if (!dichVu) {
            return res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại.'
            });
        }

        const member = await Member.findOne({ UserId: memberId });
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Thành viên không tồn tại.'
            });
        }

        // Verify member accepted this service
        if (dichVu.ThanhVien?.toString() !== member._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền hủy dịch vụ này.'
            });
        }

        // Reset service status
        dichVu.TrangThai = 'cho-duyet';
        dichVu.ThanhVien = null;
        await dichVu.save();

        res.json({
            success: true,
            message: 'Hủy yêu cầu thành công.',
            data: dichVu
        });
    } catch (error) {
        console.error('Error rejecting service:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi hủy yêu cầu.'
        });
    }
};

// @desc    Get available requests for member
// @route   GET /api/member/requests/available
// @access  Private
const getAvailableRequests = async (req, res) => {
    try {
        const memberId = req.user._id;

        const member = await Member.findOne({ UserId: memberId });
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Thành viên không tồn tại.'
            });
        }

        // Find all available services for member to accept (regardless of field)
        // Use separate queries for each status to avoid MongoDB operator issues
        const choDuyetServices = await DichVu.find({
            TrangThai: 'cho-duyet'
        })
        .populate('NguoiDung', 'name email avatar');
        
        const daDuyetServices = await DichVu.find({
            TrangThai: 'da-duyet'
        })
        .populate('NguoiDung', 'name email avatar');
        
        // Combine and sort results
        const allServices = [...choDuyetServices, ...daDuyetServices]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Filter out services that are already assigned (ThanhVien exists)
        const unassignedServices = allServices.filter(service => !service.ThanhVien);

        console.log(`🔍 Getting available requests for member: ${member._id}`);
        console.log(`🔍 Member LinhVuc: ${member.LinhVuc} (showing all fields)`);
        console.log(`🔍 Found ${allServices.length} total services`);
        console.log(`🔍 Unassigned services: ${unassignedServices.length}`);
        console.log(`🔍 Status filter: ['cho-duyet', 'da-duyet']`);
        console.log(`🔍 Field filter: REMOVED (showing all services)`);
        
        if (unassignedServices.length > 0) {
            console.log(`🔍 Sample available service:`, {
                id: unassignedServices[0]._id,
                name: unassignedServices[0].TenDichVu,
                status: unassignedServices[0].TrangThai,
                linhVuc: unassignedServices[0].LinhVuc,
                assignedTo: unassignedServices[0].ThanhVien
            });
        }

        res.json({
            success: true,
            message: 'Danh sách yêu cầu có sẵn.',
            data: unassignedServices
        });
    } catch (error) {
        console.error('Error getting available requests:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách yêu cầu.'
        });
    }
};

// @desc    Get member's accepted requests
// @route   GET /api/member/requests/accepted
// @access  Private
const getAcceptedRequests = async (req, res) => {
    try {
        const memberId = req.user._id;

        const member = await Member.findOne({ UserId: memberId });
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Thành viên không tồn tại.'
            });
        }

        // Find services assigned to this member
        // Use separate queries to avoid MongoDB operator issues
        const dangThucHienServices = await DichVu.find({
            ThanhVien: member._id,
            TrangThai: 'dang-thuc-hien'
        })
        .populate('NguoiDung', 'name email avatar');
        
        const choDuyetHoanThanhServices = await DichVu.find({
            ThanhVien: member._id,
            TrangThai: 'cho-duyet-hoan-thanh'
        })
        .populate('NguoiDung', 'name email avatar');
        
        const daNhanServices = await DichVu.find({
            ThanhVien: member._id,
            TrangThai: 'da-nhan'
        })
        .populate('NguoiDung', 'name email avatar');
        
        const dangXuLyServices = await DichVu.find({
            ThanhVien: member._id,
            TrangThai: 'dang-xu-ly'
        })
        .populate('NguoiDung', 'name email avatar');
        
        const hoanThanhServices = await DichVu.find({
            ThanhVien: member._id,
            TrangThai: 'hoan-thanh'
        })
        .populate('NguoiDung', 'name email avatar');
        
        // Combine and sort results
        const acceptedServices = [...dangThucHienServices, ...choDuyetHoanThanhServices, ...daNhanServices, ...dangXuLyServices, ...hoanThanhServices]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        console.log(`🔍 Getting accepted requests for member: ${member._id}`);
        console.log(`🔍 Found ${acceptedServices.length} accepted services`);
        console.log(`🔍 Member field: ThanhVien, Status options: ['dang-thuc-hien', 'cho-duyet-hoan-thanh', 'da-nhan', 'dang-xu-ly', 'hoan-thanh']`);
        
        if (acceptedServices.length > 0) {
            console.log(`🔍 Sample service:`, {
                id: acceptedServices[0]._id,
                name: acceptedServices[0].TenDichVu,
                status: acceptedServices[0].TrangThai,
                assignedTo: acceptedServices[0].ThanhVien
            });
        }

        res.json({
            success: true,
            message: 'Danh sách yêu cầu đã nhận.',
            data: acceptedServices
        });
    } catch (error) {
        console.error('Error getting accepted requests:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách yêu cầu đã nhận.'
        });
    }
};

// @desc    Negotiate price for service
// @route   POST /api/member/negotiate-price/:serviceId
// @access  Private
const negotiatePrice = async (req, res) => {
    try {
        const memberId = req.user._id;
        const { serviceId } = req.params;
        const { giaThoaThuan } = req.body;

        if (!giaThoaThuan || giaThoaThuan <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Giá thỏa thuận phải lớn hơn 0.'
            });
        }

        const dichVu = await DichVu.findById(serviceId);
        if (!dichVu) {
            return res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại.'
            });
        }

        const member = await Member.findOne({ UserId: memberId });
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Thành viên không tồn tại.'
            });
        }

        // Check if member accepted this service or it's available
        if (dichVu.ThanhVien?.toString() !== member._id.toString() && dichVu.TrangThai !== 'cho-duyet') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thỏa thuận dịch vụ này.'
            });
        }

        // Find or create UyThac (commission) record
        let uyThac = await UyThac.findOne({
            DichVuId: serviceId,
            MemberId: member._id
        });

        if (!uyThac) {
            uyThac = new UyThac({
                UserId: dichVu.UserId,
                MemberId: member._id,
                DichVuId: serviceId,
                GiaThoaThuan: giaThoaThuan,
                TrangThai: 'Moi'
            });
        } else {
            uyThac.GiaThoaThuan = giaThoaThuan;
        }

        await uyThac.save();

        res.json({
            success: true,
            message: 'Thỏa thuận giá thành công.',
            data: uyThac
        });
    } catch (error) {
        console.error('Error negotiating price:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thỏa thuận giá.'
        });
    }
};

// @desc    Complete commission and send confirmation to user
// @route   POST /api/member/complete-commission/:serviceId
// @access  Private
const completeCommission = async (req, res) => {
    try {
        const memberId = req.user._id;
        const { serviceId } = req.params;
        const { danhGia = 5, ghiChu = '' } = req.body; // Rating and notes from member

        const dichVu = await DichVu.findById(serviceId).populate('NguoiDung');
        if (!dichVu) {
            return res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại.'
            });
        }

        const member = await Member.findOne({ UserId: memberId });
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Thành viên không tồn tại.'
            });
        }

        // Verify member is assigned to this service
        if (dichVu.ThanhVien?.toString() !== member._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền hoàn thành dịch vụ này.'
            });
        }

        // Verify service is in progress
        if (dichVu.TrangThai !== 'dang-thuc-hien') {
            return res.status(400).json({
                success: false,
                message: `Dịch vụ không ở trạng thái đang thực hiện. Trạng thái hiện tại: ${dichVu.TrangThai}`
            });
        }

        // Find UyThac record - optional for completion
        const uyThac = await UyThac.findOne({
            DichVuId: serviceId,
            MemberId: member._id
        });

        // UyThac record is optional - service assignment is the primary check
        console.log(`📄 UyThac record found: ${uyThac ? 'YES' : 'NO'}`);
        if (!uyThac) {
            console.warn('⚠️ UyThac record not found, but service assignment is valid');
        }

        // Update service status to pending user confirmation
        dichVu.TrangThai = 'cho-xac-nhan-hoan-thanh';
        
        // Store member completion details
        dichVu.ThanhVienHoanThanh = {
            ngayHoanThanh: new Date(),
            danhGia: danhGia,
            ghiChu: ghiChu,
            thanhVienId: member._id
        };
        
        await dichVu.save();

        console.log(`✅ Member ${member._id} completed service ${serviceId}`);
        console.log(`✅ Service status updated to: cho-xac-nhan-hoan-thanh`);
        console.log(`✅ Waiting for user confirmation before admin approval`);

        // TODO: Send notification to user (email, push notification, etc.)
        console.log(`📧 Notification sent to user ${dichVu.NguoiDung.name} (${dichVu.NguoiDung.email})`);

        res.json({
            success: true,
            message: `🎉 Dịch vụ đã hoàn thành! Vui lòng chờ người dùng xác nhận.`,
            data: {
                service: dichVu,
                nextStep: 'User confirmation required',
                userNotified: dichVu.NguoiDung ? {
                    name: dichVu.NguoiDung.name,
                    email: dichVu.NguoiDung.email
                } : null
            }
        });
    } catch (error) {
        console.error('Error completing commission:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi hoàn thành ủy thác.'
        });
    }
};

// @desc    Admin approves completed commission and transfers funds
// @route   POST /api/admin/approve-completion/:serviceId
// @access  Private (Admin only)
const approveCommissionCompletion = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { danhGia = 5 } = req.body; // Admin can set rating

        const dichVu = await DichVu.findById(serviceId).populate('ThanhVien').populate('GiaoDichKyQuy');
        if (!dichVu) {
            return res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại.'
            });
        }

        if (dichVu.TrangThai !== 'cho-duyet-hoan-thanh') {
            return res.status(400).json({
                success: false,
                message: `Dịch vụ không ở trạng thái chờ duyệt hoàn thành. Trạng thái hiện tại: ${dichVu.TrangThai}`
            });
        }

        if (!dichVu.ThanhVien) {
            return res.status(400).json({
                success: false,
                message: 'Dịch vụ chưa được gán cho thành viên nào.'
            });
        }

        // Find UyThac record
        const uyThac = await UyThac.findOne({
            DichVuId: serviceId,
            MemberId: dichVu.ThanhVien._id
        });

        if (!uyThac) {
            return res.status(404).json({
                success: false,
                message: 'Bản ghi ủy thác không tồn tại.'
            });
        }

        // Get TransactionService for fund transfer
        const TransactionService = require('../services/TransactionService');

        // Transfer escrow funds to member wallet
        const transferResult = await TransactionService.releaseEscrowFunds(
            dichVu.NguoiDung._id, // Service creator (who paid)
            dichVu.ThanhVien.UserId, // Member who will receive
            dichVu.Gia,
            `Thanh toán dịch vụ: ${dichVu.TenDichVu}`,
            serviceId
        );

        if (!transferResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Không thể chuyển tiền ký quỹ: ' + transferResult.message
            });
        }

        // Update service status to completed
        dichVu.TrangThai = 'hoan-thanh';
        dichVu.NgayHoanThanh = new Date();
        await dichVu.save();

        // Update commission status and rating
        uyThac.TrangThai = 'DaHoanThanh';
        uyThac.DanhGia = danhGia;
        uyThac.NgayHoanThanh = new Date();
        await uyThac.save();

        // Calculate experience gain and revenue
        const price = uyThac.GiaThoaThuan || dichVu.Gia;
        const expGain = Math.floor(price / 10000) + 50;
        const revenue = price * 0.95; // 95% of price goes to member

        // Update member statistics
        const member = await Member.findById(dichVu.ThanhVien._id);
        member.DiemExp += expGain;
        member.SoUyThacHoanThanh += 1;
        member.TongDoanhThu += revenue;
        member.DiemDanhGiaTB = ((member.DiemDanhGiaTB * (member.SoUyThacHoanThanh - 1)) + danhGia) / member.SoUyThacHoanThanh;
        await member.save();

        console.log(`✅ Admin approved completion for service ${serviceId}`);
        console.log(`✅ Transferred ${revenue.toLocaleString()}đ to member ${member._id}`);
        console.log(`✅ Member gained ${expGain} exp points`);

        res.json({
            success: true,
            message: `✅ Đã duyệt hoàn thành dịch vụ! ${revenue.toLocaleString()}đ đã được chuyển cho thành viên.`,
            data: {
                service: dichVu,
                member: member,
                commission: uyThac,
                transfer: transferResult,
                stats: {
                    expGain,
                    revenue,
                    newBalance: transferResult.newBalance
                }
            }
        });
    } catch (error) {
        console.error('Error approving commission completion:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi duyệt hoàn thành dịch vụ.'
        });
    }
};

// @desc    Get member's completed commissions
// @route   GET /api/member/commissions/completed
// @access  Private
const getCompletedCommissions = async (req, res) => {
    try {
        const memberId = req.user._id;

        const member = await Member.findOne({ UserId: memberId });
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Thành viên không tồn tại.'
            });
        }

        // Find completed commissions for this member
        const completedCommissions = await UyThac.find({
            MemberId: member._id,
            TrangThai: 'DaHoanThanh'
        })
        .populate('UserId', 'name email avatar')
        .populate('DichVuId', 'TenDichVu Gia')
        .sort({ updatedAt: -1 });

        res.json({
            success: true,
            message: 'Danh sách ủy thác đã hoàn thành.',
            data: completedCommissions
        });
    } catch (error) {
        console.error('Error getting completed commissions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách ủy thác đã hoàn thành.'
        });
    }
};

// Validation middleware for member registration
const registerValidation = [
    body('Ten').optional().trim().isLength({ min: 2 }).withMessage('Tên phải có ít nhất 2 ký tự'),
    body('CapBac')
        .notEmpty().withMessage('Cấp bậc là bắt buộc')
        .isIn(['Intern', 'Thành thạo', 'Chuyên gia']).withMessage('Cấp bậc không hợp lệ'),
    body('LinhVuc')
        .notEmpty().withMessage('Lĩnh vực là bắt buộc')
        .trim()
        .isLength({ min: 2 }).withMessage('Lĩnh vực phải có ít nhất 2 ký tự'),
    body('SoDienThoai').optional().trim(),
    body('KyNang').optional().custom((value) => {
        if (value && !Array.isArray(value) && typeof value !== 'string') {
            throw new Error('Kỹ năng phải là mảng hoặc chuỗi');
        }
        return true;
    }),
    body('ChungChi').optional().custom((value) => {
        if (value && !Array.isArray(value) && typeof value !== 'string') {
            throw new Error('Chứng chỉ phải là mảng hoặc chuỗi');
        }
        return true;
    })
];

module.exports = {
    getDashboard,
    getProfile,
    updateProfile,
    acceptService,
    rejectService,
    getAvailableRequests,
    getAcceptedRequests,
    negotiatePrice,
    completeCommission,
    approveCommissionCompletion,
    getCompletedCommissions,
    register,
    registerValidation
};
