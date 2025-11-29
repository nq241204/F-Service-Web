// backend/controllers/servicesController.js - API version
const DichVu = require('../models/DichVu');
const UyThac = require('../models/UyThac');
const { body, validationResult } = require('express-validator');

// @desc    Get all services with filtering and pagination
// @route   GET /api/services/list
// @access  Public
exports.getServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const linhVuc = req.query.linhVuc || '';
    const minPrice = parseInt(req.query.minPrice) || 0;
    const maxPrice = parseInt(req.query.maxPrice) || 0;
    const sortBy = req.query.sortBy || '-createdAt';

    // Build query
    let query = {};

    // For public list, only show approved services (available for members to receive)
    if (!status) {
      query.TrangThai = { $in: ['da-duyet'] }; // Only admin-approved services
    }

    // Debug: Log the query
    console.log('🔍 Query:', JSON.stringify(query, null, 2));
    console.log('👤 User logged in:', !!req.user);

    // Search filter
    if (search) {
      query.$or = [
        { TenDichVu: { $regex: search, $options: 'i' } },
        { MoTa: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter (override default if specified)
    if (status) {
      query.TrangThai = status;
    }

    // Service type filter
    if (linhVuc) {
      query.LinhVuc = linhVuc;
    }

    // Price filter
    if (minPrice > 0 || maxPrice > 0) {
      query.Gia = {};
      if (minPrice > 0) {
        query.Gia.$gte = minPrice;
      }
      if (maxPrice > 0) {
        query.Gia.$lte = maxPrice;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [services, total] = await Promise.all([
      DichVu.find(query)
        .populate('NguoiDung', 'name email')
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .lean(),
      DichVu.countDocuments(query)
    ]);

    // Debug: Log results
    console.log('📊 Found services:', services.length);
    services.forEach(s => console.log(`- ${s.TenDichVu}: ${s.TrangThai} (User: ${s.NguoiDung?.name})`));

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        services,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách dịch vụ.'
    });
  }
};

// @desc    Create commission
// @route   POST /api/services/commission
// @access  Private
exports.createCommission = [
  body('dichVuId').isMongoId().withMessage('ID dịch vụ không hợp lệ.'),
  body('giaThoaThuan').isInt({ min: 0 }).withMessage('Giá thỏa thuận phải là số không âm.'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { dichVuId, giaThoaThuan } = req.body;
    const userId = req.user._id;

    try {
      const dichVu = await DichVu.findById(dichVuId);
      if (!dichVu) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dịch vụ không tồn tại.' 
        });
      }

      const uyThac = new UyThac({
        UserId: userId,
        DichVuId: dichVuId,
        GiaThoaThuan: parseInt(giaThoaThuan),
        TrangThai: 'Moi',
      });
      await uyThac.save();

      res.status(201).json({ 
        success: true, 
        message: 'Ủy thác đã được tạo.', 
        data: uyThac 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo ủy thác.'
      });
    }
  },
];

// @desc    Get my commissions
// @route   GET /api/services/my-commissions
// @access  Private
exports.getMyCommissions = async (req, res) => {
  try {
    const commissions = await UyThac.find({ UserId: req.user._id })
      .populate('DichVuId')
      .lean();
    res.status(200).json({ success: true, data: commissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách ủy thác.'
    });
  }
};
