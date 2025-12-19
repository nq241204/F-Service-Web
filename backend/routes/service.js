// backend/routes/service.js - API routes only
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  serviceValidations,
  handleValidationErrors 
} = require('../middleware/validationMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');
const DichVu = require('../models/DichVu');
const { upload } = require('../middleware/uploadMiddleware');
const { receiveService } = require('../controllers/receiveServiceController');
const mongoose = require('mongoose');

// @route   GET /api/service
// @desc    Get all services
// @access  Public
router.get('/', async (req, res) => {
    try {
        console.log('Attempting to fetch services...');
        
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }
        
        // Basic query with error handling
        const services = await DichVu.find({});
        console.log(`Found ${services.length} services`);
        
        res.json({
            success: true,
            data: services,
            count: services.length
        });
    } catch (error) {
        console.error('Error getting services:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách dịch vụ',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/service/:id
// @desc    Get service by ID
// @access  Public
router.get('/:id', [
    // Add validation for service ID
    require('express-validator').param('id')
        .isMongoId()
        .withMessage('ID dịch vụ không hợp lệ')
], async (req, res) => {
    // Check validation errors
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'ID dịch vụ không hợp lệ',
            errors: errors.array()
        });
    }

    try {
        const service = await DichVu.findById(req.params.id)
            .populate('NguoiDung', 'name email')
            .populate('ThanhVien', 'Ten CapBac LinhVuc')
            .lean();
        
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy dịch vụ'
            });
        }
        
        res.json({
            success: true,
            data: service
        });
    } catch (error) {
        console.error('Error getting service:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin dịch vụ'
        });
    }
});

// @route   POST /api/service/create
// @desc    Create new service
// @access  Private
router.post('/create',
    authMiddleware(['user', 'member']),
    upload.single('HinhAnh'),
    [
        ...serviceValidations.create,
        require('express-validator').body('LoaiDichVu')
            .optional()
            .isIn(['basic', 'premium', 'vip'])
            .withMessage('Loại dịch vụ không hợp lệ'),
        require('express-validator').body('ThoiGianHoanThanh')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Thời gian hoàn thành phải lớn hơn 0')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const serviceData = {
                TenDichVu: req.body.TenDichVu,
                MoTa: req.body.MoTa,
                GiaTien: req.body.GiaTien,
                LoaiDichVu: req.body.LoaiDichVu || 'basic',
                ThoiGianHoanThanh: req.body.ThoiGianHoanThanh || 7,
                TrangThai: req.body.TrangThai === 'active' ? 'active' : 'inactive',
                NguoiTao: req.user._id
            };

            if (req.file) {
                serviceData.HinhAnh = '/uploads/services/' + req.file.filename;
            }

            const dichVu = new DichVu(serviceData);
            await dichVu.save();

            res.status(201).json({
                success: true,
                message: 'Tạo dịch vụ thành công',
                data: dichVu
            });
        } catch (error) {
            console.error('Error creating service:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi tạo dịch vụ'
            });
        }
    }
);

// @route   POST /api/service/receive
// @desc    Member nhận dịch vụ
// @access  Private (members only)
router.post('/receive',
    authMiddleware(['member']),
    [
        body('serviceId').isMongoId().withMessage('ID dịch vụ không hợp lệ')
    ],
    receiveService
);

module.exports = router;
