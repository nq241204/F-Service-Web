const DichVu = require('../models/DichVu');

// @desc    Member nhận dịch vụ
// @route   POST /api/service/receive
exports.receiveService = async (req, res) => {
    try {
        const { serviceId } = req.body;
        const memberId = req.user._id;

        // Check if user is a member
        if (req.user.role !== 'member') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ thành viên mới có thể nhận dịch vụ'
            });
        }

        // Find the service
        const service = await DichVu.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại'
            });
        }

        // Check if service is approved and available
        if (service.TrangThai !== 'da-duyet') {
            return res.status(400).json({
                success: false,
                message: 'Dịch vụ không available để nhận'
            });
        }

        // Check if service already has a member
        if (service.ThanhVien) {
            return res.status(400).json({
                success: false,
                message: 'Dịch vụ đã được nhận bởi thành viên khác'
            });
        }

        // Update service status and assign member
        service.TrangThai = 'dang-thuc-hien';
        service.ThanhVien = memberId;
        await service.save();

        res.status(200).json({
            success: true,
            message: 'Đã nhận dịch vụ thành công',
            data: service
        });

    } catch (error) {
        console.error('Lỗi nhận dịch vụ:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi nhận dịch vụ'
        });
    }
};
