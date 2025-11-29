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

// @route   GET /api/service
// @desc    Get all services
// @access  Public
router.get('/', async (req, res) => {
    try {
        const services = await DichVu.find().populate('NguoiTao', 'name').lean();
        res.json({
            success: true,
            data: services
        });
    } catch (error) {
        console.error('Error getting services:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách dịch vụ'
        });
    }
});

// @route   GET /api/service/:id
// @desc    Get service by ID
// @access  Public
router.get('/:id', async (req, res) => {
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
