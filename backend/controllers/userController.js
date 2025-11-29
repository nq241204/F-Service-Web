// controllers/userController.js
const User = require('../models/User');
const ViGiaoDich = require('../models/ViGiaoDich');
const DichVu = require('../models/DichVu');
const GiaoDich = require('../models/GiaoDich');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const moment = require('moment');

// --- Helper Functions ---

// Lấy thông tin ví và số dư
const getWalletInfo = async (userId) => {
    const user = await User.findById(userId)
        .select('ViGiaoDich HoTen Email')
        .lean();

    if (!user || !user.ViGiaoDich) {
        throw new Error('Không tìm thấy thông tin ví');
    }

    const wallet = await ViGiaoDich.findById(user.ViGiaoDich)
        .populate({
            path: 'GiaoDich',
            options: { sort: { createdAt: -1 }, limit: 10 }
        })
        .lean();

    if (!wallet) {
        throw new Error('Không tìm thấy ví');
    }

    // Tính toán thống kê
    const stats = {
        totalDeposit: 0,
        totalWithdraw: 0,
        totalCommission: 0,
        pendingTransactions: 0
    };

    if (wallet.GiaoDich && wallet.GiaoDich.length > 0) {
        wallet.GiaoDich.forEach(tx => {
            if (tx.TrangThai === 'success') {
                switch (tx.Loai) {
                    case 'deposit':
                        stats.totalDeposit += tx.SoTien;
                        break;
                    case 'withdraw':
                        stats.totalWithdraw += tx.SoTien;
                        break;
                    case 'commission_payment':
                        stats.totalCommission += tx.SoTien;
                        break;
                }
            } else if (tx.TrangThai === 'pending') {
                stats.pendingTransactions++;
            }
        });
    }

    return {
        user,
        wallet,
        stats
    };
};

// --- Web Render Controllers ---

// @desc    Render trang Dashboard User
// @route   GET /user/dashboard
exports.renderDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        // Lấy thông tin ví và thống kê
        const { wallet, stats } = await getWalletInfo(userId);

        // Lấy danh sách dịch vụ và thống kê
        const [services, serviceStats] = await Promise.all([
            DichVu.find({ ChuSoHuu: userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            DichVu.aggregate([
                { $match: { ChuSoHuu: mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: '$TrangThai',
                        count: { $sum: 1 },
                        totalValue: { $sum: '$GiaTri' }
                    }
                }
            ])
        ]);

        // Xử lý thống kê dịch vụ
        const processedStats = serviceStats.reduce((acc, stat) => {
            acc[stat._id] = {
                count: stat.count,
                value: stat.totalValue
            };
            return acc;
        }, {
            pending: { count: 0, value: 0 },
            active: { count: 0, value: 0 },
            completed: { count: 0, value: 0 },
            cancelled: { count: 0, value: 0 }
        });

        // Lấy các giao dịch gần đây
        const recentTransactions = await GiaoDich.find({ 
            NguoiThamGia: userId 
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('DichVu', 'TenDichVu')
        .lean();

        res.render('user/dashboard', {
            title: 'Trang Chủ',
            wallet,
            stats,
            services,
            serviceStats: processedStats,
            recentTransactions,
            moment,
            helpers: {
                formatCurrency: (amount) => {
                    return new Intl.NumberFormat('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND' 
                    }).format(amount);
                }
            }
        });
    } catch (error) {
        console.error("Lỗi khi render Dashboard:", error);
        req.flash('error_msg', 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
        res.redirect('/');
    }
};

// @desc    Render trang Ví giao dịch
// @route   GET /user/wallet
exports.renderWallet = async (req, res) => {
    try {
        const userId = req.user._id;
        const { wallet, stats } = await getWalletInfo(userId);

        // Lấy lịch sử giao dịch chi tiết
        const transactions = await GiaoDich.find({ 
            NguoiThamGia: userId 
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('DichVu', 'TenDichVu')
        .lean();

        // Phân loại giao dịch
        const categorizedTransactions = {
            deposits: transactions.filter(tx => tx.Loai === 'deposit'),
            withdrawals: transactions.filter(tx => tx.Loai === 'withdraw'),
            payments: transactions.filter(tx => tx.Loai === 'service_payment'),
            commissions: transactions.filter(tx => tx.Loai === 'commission_payment')
        };

        // Tính toán thống kê theo thời gian (7 ngày gần nhất)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
            return {
                date,
                deposits: 0,
                withdrawals: 0,
                commissions: 0
            };
        }).reverse();

        transactions.forEach(tx => {
            const txDate = moment(tx.createdAt).format('YYYY-MM-DD');
            const dayStats = last7Days.find(day => day.date === txDate);
            if (dayStats && tx.TrangThai === 'success') {
                switch (tx.Loai) {
                    case 'deposit':
                        dayStats.deposits += tx.SoTien;
                        break;
                    case 'withdraw':
                        dayStats.withdrawals += tx.SoTien;
                        break;
                    case 'commission_payment':
                        dayStats.commissions += tx.SoTien;
                        break;
                }
            }
        });

        res.render('user/wallet', {
            title: 'Ví Điện Tử',
            wallet,
            stats,
            transactions: categorizedTransactions,
            chartData: last7Days,
            moment,
            helpers: {
                formatCurrency: (amount) => {
                    return new Intl.NumberFormat('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND' 
                    }).format(amount);
                },
                getStatusClass: (status) => {
                    return {
                        'success': 'bg-green-100 text-green-800',
                        'pending': 'bg-yellow-100 text-yellow-800',
                        'failed': 'bg-red-100 text-red-800'
                    }[status] || 'bg-gray-100 text-gray-800';
                }
            }
        });
    } catch (error) {
        console.error("Lỗi khi render Ví:", error);
        req.flash('error_msg', 'Không thể tải thông tin ví. Vui lòng thử lại sau.');
        res.redirect('/user/dashboard');
    }
};

// @desc    Render trang Danh sách Ủy thác
// @route   GET /user/commissions
exports.renderMyCommissions = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const search = req.query.search;

        // Xây dựng query
        let query = { ChuSoHuu: userId };
        if (status && status !== 'all') {
            query.TrangThai = status;
        }
        if (search) {
            query.$or = [
                { TenDichVu: { $regex: search, $options: 'i' } },
                { MoTa: { $regex: search, $options: 'i' } }
            ];
        }

        // Thực hiện truy vấn với pagination
        const [services, totalDocs] = await Promise.all([
            DichVu.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('NguoiThucHien', 'HoTen Avatar')
                .lean(),
            DichVu.countDocuments(query)
        ]);

        // Tính toán thống kê
        const stats = await DichVu.aggregate([
            { $match: { ChuSoHuu: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$TrangThai',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$GiaTri' }
                }
            }
        ]);

        // Xử lý phân trang
        const totalPages = Math.ceil(totalDocs / limit);
        const pagination = {
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            totalDocs
        };

        // Thêm thông tin phụ cho mỗi dịch vụ
        const enrichedServices = await Promise.all(services.map(async service => {
            const transactions = await GiaoDich.find({
                DichVu: service._id
            }).sort({ createdAt: -1 }).limit(1).lean();

            return {
                ...service,
                lastTransaction: transactions[0] || null,
                statusInfo: {
                    label: {
                        'pending': 'Đang chờ',
                        'active': 'Đang thực hiện',
                        'completed': 'Hoàn thành',
                        'cancelled': 'Đã hủy'
                    }[service.TrangThai],
                    class: {
                        'pending': 'bg-yellow-100 text-yellow-800',
                        'active': 'bg-blue-100 text-blue-800',
                        'completed': 'bg-green-100 text-green-800',
                        'cancelled': 'bg-red-100 text-red-800'
                    }[service.TrangThai]
                }
            };
        }));

        res.render('user/commissions', {
            title: 'Dịch Vụ Của Tôi',
            services: enrichedServices,
            stats: stats.reduce((acc, stat) => {
                acc[stat._id] = stat;
                return acc;
            }, {}),
            filters: {
                status,
                search
            },
            pagination,
            moment,
            helpers: {
                formatCurrency: (amount) => {
                    return new Intl.NumberFormat('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND' 
                    }).format(amount);
                }
            }
        });
    } catch (error) {
        console.error("Lỗi khi render Danh sách Dịch vụ:", error);
        req.flash('error_msg', 'Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.');
        res.redirect('/user/dashboard');
    }
};


// --- API Controllers ---

// @desc    Lấy thông tin profile đầy đủ với các thống kê đồng bộ hóa
// @route   GET /api/user/profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const StatisticsService = require('../services/StatisticsService');

        // Lấy user info
        const user = await User.findById(userId).select('-password').lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin user'
            });
        }

        // Lấy thống kê đầy đủ từ service tập trung
        const fullStats = await StatisticsService.getFullStatistics(userId);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    avatar: user.avatar,
                    role: user.role,
                    status: user.status,
                    createdAt: user.createdAt
                },
                wallet: fullStats.wallet,
                commissions: fullStats.commissions,
                summary: fullStats.summary
            }
        });
    } catch (error) {
        console.error('Lỗi getProfile:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Lỗi server khi lấy thông tin profile.' 
        });
    }
};

// @desc    Cập nhật thông tin profile
// @route   PUT /api/user/profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const updates = {};
        const allowedUpdates = ['name', 'phone', 'address', 'avatar'];
        
        // Kiểm tra và lọc các trường được phép cập nhật
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        // Validate dữ liệu
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Cập nhật user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password').lean();

        // Đồng bộ hóa lại thống kê từ giao dịch
        const transactions = await GiaoDich.find({
            NguoiThamGia: userId
        }).lean();

        let totalDeposit = 0;
        let totalWithdraw = 0;
        transactions.forEach(tx => {
            if (tx.TrangThai === 'success') {
                if (tx.Loai === 'deposit') {
                    totalDeposit += tx.SoTien;
                } else if (tx.Loai === 'withdraw') {
                    totalWithdraw += tx.SoTien;
                }
            }
        });

        // Cập nhật SoDu
        const userSoDu = totalDeposit - totalWithdraw;
        updatedUser.SoDu = userSoDu;

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công.',
            data: {
                user: updatedUser,
                walletSyncedBalance: userSoDu
            }
        });
    } catch (error) {
        console.error('Lỗi updateProfile:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật thông tin.'
        });
    }
};

// @desc    Lấy lịch sử giao dịch
// @route   GET /api/user/transactions
exports.getTransactionHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const type = req.query.type; // deposit, withdraw, service_payment, commission_payment
        const status = req.query.status; // success, pending, failed
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        // Xây dựng query
        let query = { NguoiThamGia: req.user._id };
        if (type) query.Loai = type;
        if (status) query.TrangThai = status;
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Thực hiện truy vấn với pagination
        const [transactions, totalDocs] = await Promise.all([
            GiaoDich.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('DichVu', 'TenDichVu')
                .lean(),
            GiaoDich.countDocuments(query)
        ]);

        // Format dữ liệu trả về
        const formattedTransactions = transactions.map(tx => ({
            ...tx,
            formattedAmount: new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
            }).format(tx.SoTien),
            formattedDate: moment(tx.createdAt).format('DD/MM/YYYY HH:mm')
        }));

        res.json({
            success: true,
            data: {
                transactions: formattedTransactions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalDocs / limit),
                    totalDocs,
                    hasNextPage: page < Math.ceil(totalDocs / limit),
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Lỗi getTransactionHistory:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy lịch sử giao dịch.'
        });
    }
};

// @desc    Lấy thông tin thống kê
// @route   GET /api/user/stats
exports.getStats = async (req, res) => {
    try {
        const { stats } = await getWalletInfo(req.user._id);

        // Lấy thống kê theo thời gian (30 ngày gần nhất)
        const timeStats = await GiaoDich.aggregate([
            {
                $match: {
                    NguoiThamGia: mongoose.Types.ObjectId(req.user._id),
                    createdAt: { 
                        $gte: moment().subtract(30, 'days').toDate() 
                    },
                    TrangThai: 'success'
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        type: "$Loai"
                    },
                    total: { $sum: "$SoTien" }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats,
                timeStats: timeStats.reduce((acc, stat) => {
                    const { date, type } = stat._id;
                    if (!acc[date]) acc[date] = {};
                    acc[date][type] = stat.total;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Lỗi getStats:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy thống kê.'
        });
    }
};

// @desc    User confirms service completion
// @route   POST /api/user/confirm-service-completion/:serviceId
// @access  Private (User only)
const confirmServiceCompletion = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const userId = req.user._id;
        const { xacNhan, danhGia = 5, ghiChu = '' } = req.body; // User confirmation, rating, and notes

        // Find the service
        const service = await DichVu.findById(serviceId)
            .populate('NguoiDung', '_id name email')
            .populate('ThanhVien', '_id Ten');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại.'
            });
        }

        // Check if user is the service creator
        if (service.NguoiDung._id.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xác nhận dịch vụ này.'
            });
        }

        // Check if service is waiting for user confirmation
        if (service.TrangThai !== 'cho-xac-nhan-hoan-thanh') {
            return res.status(400).json({
                success: false,
                message: `Dịch vụ chưa sẵn sàng để xác nhận. Trạng thái hiện tại: ${service.TrangThai}`
            });
        }

        // Check if already confirmed
        if (service.UserDaXacNhan) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã xác nhận hoàn thành dịch vụ này.'
            });
        }

        // Store user confirmation details
        service.UserDaXacNhan = xacNhan !== false; // Default to true unless explicitly false
        service.NgayUserXacNhan = new Date();
        
        // Store user rating and notes
        service.DanhGia = {
            Sao: danhGia,
            NhanXet: ghiChu
        };

        // If user confirms, move to admin approval stage
        if (service.UserDaXacNhan) {
            service.TrangThai = 'cho-duyet-hoan-thanh';
            console.log(`✅ User ${userId} confirmed completion for service ${serviceId}`);
            console.log(`✅ Service status updated to: cho-duyet-hoan-thanh`);
            console.log(`✅ Waiting for admin approval before transferring funds`);
        } else {
            // User rejects completion - service goes back to in progress
            service.TrangThai = 'dang-thuc-hien';
            console.log(`❌ User ${userId} rejected completion for service ${serviceId}`);
            console.log(`✅ Service status reverted to: dang-thuc-hien`);
        }
        
        await service.save();

        res.json({
            success: true,
            message: service.UserDaXacNhan 
                ? '✅ Bạn đã xác nhận hoàn thành dịch vụ! Vui lòng chờ admin duyệt để hoàn tất quy trình.'
                : '❌ Bạn đã từ chối xác nhận. Dịch vụ sẽ được tiếp tục thực hiện.',
            data: {
                service: service,
                nextStep: service.UserDaXacNhan ? 'Admin approval required' : 'Continue service',
                memberInfo: service.ThanhVien ? {
                    name: service.ThanhVien.Ten,
                    completedAt: service.ThanhVienHoanThanh?.ngayHoanThanh,
                    memberRating: service.ThanhVienHoanThanh?.danhGia,
                    memberNotes: service.ThanhVienHoanThanh?.ghiChu
                } : null
            }
        });
    } catch (error) {
        console.error('Error confirming service completion:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xác nhận hoàn thành dịch vụ.'
        });
    }
};

// @desc    Get user's service progress
// @route   GET /api/user/service-progress/:serviceId
// @access  Private (User only)
const getServiceProgress = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const userId = req.user._id;

        // Find the service
        const service = await DichVu.findById(serviceId)
            .populate('NguoiDung', '_id name email')
            .populate('ThanhVien', '_id Ten LinhVuc');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại.'
            });
        }

        // Check if user is the service creator
        if (service.NguoiDung._id.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem tiến độ dịch vụ này.'
            });
        }

        // Progress information based on status
        const progressInfo = {
            serviceId: service._id,
            serviceName: service.TenDichVu,
            currentStatus: service.TrangThai,
            statusDescription: getStatusDescription(service.TrangThai),
            assignedMember: service.ThanhVien ? {
                id: service.ThanhVien._id,
                name: service.ThanhVien.Ten,
                field: service.ThanhVien.LinhVuc
            } : null,
            createdAt: service.createdAt,
            completionDate: service.NgayHoanThanh,
            userConfirmed: service.UserDaXacNhan,
            userConfirmationDate: service.NgayUserXacNhan,
            price: service.Gia,
            nextStep: getNextStep(service.TrangThai, service.UserDaXacNhan)
        };

        res.json({
            success: true,
            data: progressInfo
        });

    } catch (error) {
        console.error('Error getting service progress:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy tiến độ dịch vụ.'
        });
    }
};

// Helper function to get status description
const getStatusDescription = (status) => {
    const descriptions = {
        'cho-duyet': 'Dịch vụ đang chờ admin duyệt',
        'da-duyet': 'Dịch vụ đã được duyệt, chờ member nhận',
        'da-nhan': 'Member đã nhận dịch vụ',
        'dang-thuc-hien': 'Member đang thực hiện dịch vụ',
        'cho-duyet-hoan-thanh': 'Member đã hoàn thành, chờ admin duyệt',
        'hoan-thanh': 'Admin đã duyệt hoàn thành, chờ bạn xác nhận',
        'huy-bo': 'Dịch vụ đã bị hủy'
    };
    return descriptions[status] || 'Trạng thái không xác định';
};

// Helper function to get next step
const getNextStep = (status, userConfirmed) => {
    if (userConfirmed) {
        return 'Dịch vụ đã hoàn thành hoàn tất';
    }
    
    const nextSteps = {
        'cho-duyet': 'Chờ admin duyệt dịch vụ',
        'da-duyet': 'Chờ member nhận dịch vụ',
        'da-nhan': 'Member sẽ bắt đầu thực hiện',
        'dang-thuc-hien': 'Member đang thực hiện dịch vụ',
        'cho-duyet-hoan-thanh': 'Chờ admin duyệt hoàn thành',
        'hoan-thanh': 'Vui lòng xác nhận hoàn thành để hoàn tất thanh toán'
    };
    return nextSteps[status] || 'Không có bước tiếp theo';
};

module.exports = {
    getBalance: exports.getBalance,
    getTransactionHistory: exports.getTransactionHistory,
    getStats: exports.getStats,
    confirmServiceCompletion,
    getServiceProgress
};