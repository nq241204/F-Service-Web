// backend/routes/services.js - API routes only
const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const { authMiddleware } = require('../middleware/authMiddleware');
const DichVu = require('../models/DichVu');

// @route   GET /api/services/list
// @desc    Get all services
// @access  Public
router.get('/list', servicesController.getServices);

// @route   GET /api/services/:id
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
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải chi tiết dịch vụ.'
    });
  }
});

module.exports = router;
