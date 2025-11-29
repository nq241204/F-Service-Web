// controllers/adminServiceController.js
const { body, validationResult } = require('express-validator');
const ServiceManager = require('../services/ServiceManager');

// @desc    Phê duyệt dịch vụ (Admin)
// @route   POST /admin/service/:id/approve
exports.approveService = async (req, res) => {
    try {
        const result = await ServiceManager.approveService(req.params.id, req.user._id);

        if (req.accepts('json')) {
            res.json({
                success: true,
                message: 'Dịch vụ đã được phê duyệt và tiền đã chuyển cho chủ dịch vụ.',
                data: result
            });
        } else {
            req.flash('success', 'Dịch vụ đã được phê duyệt thành công.');
            res.redirect('/admin/services/pending');
        }
    } catch (error) {
        console.error('Lỗi phê duyệt dịch vụ:', error);
        if (req.accepts('json')) {
            res.status(400).json({
                success: false,
                message: error.message || 'Lỗi khi phê duyệt dịch vụ.'
            });
        } else {
            req.flash('error', error.message || 'Lỗi khi phê duyệt dịch vụ.');
            res.redirect('/admin/services/pending');
        }
    }
};

// @desc    Từ chối dịch vụ (Admin)
// @route   POST /admin/service/:id/reject
exports.rejectService = [
    body('reason').notEmpty().withMessage('Lý do từ chối là bắt buộc.'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const result = await ServiceManager.rejectService(
                req.params.id, 
                req.user._id, 
                req.body.reason
            );

            if (req.accepts('json')) {
                res.json({
                    success: true,
                    message: 'Dịch vụ đã bị từ chối và tiền đã hoàn trả.',
                    data: result
                });
            } else {
                req.flash('success', 'Dịch vụ đã bị từ chối và tiền đã hoàn trả.');
                res.redirect('/admin/services/pending');
            }
        } catch (error) {
            console.error('Lỗi từ chối dịch vụ:', error);
            if (req.accepts('json')) {
                res.status(400).json({
                    success: false,
                    message: error.message || 'Lỗi khi từ chối dịch vụ.'
                });
            } else {
                req.flash('error', error.message || 'Lỗi khi từ chối dịch vụ.');
                res.redirect('/admin/services/pending');
            }
        }
    }
];
